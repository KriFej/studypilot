"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Trash2, ArrowUpRight, Zap, Crown, CreditCard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { checkoutUrl, customerPortalUrl } from "@/lib/lemonsqueezy";

type PlanData = {
  plan: "free" | "pro" | "max";
  docs: { count: number; limit: number | null };
  messages: { count: number; limit: number | null };
};

function UsageBar({ count, limit, label }: { count: number; limit: number | null; label: string }) {
  const pct = limit === null ? 0 : Math.min((count / limit) * 100, 100);
  const near = limit !== null && pct >= 80;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className={near ? "font-semibold text-amber-400" : "text-muted"}>
          {count}{limit !== null ? ` / ${limit}` : " (illimité)"}
        </span>
      </div>
      {limit !== null && (
        <div className="h-2 w-full rounded-full bg-surface">
          <div
            className={`h-2 rounded-full transition-all ${near ? "bg-amber-400" : "bg-primary-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

const PLAN_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  free: { label: "Gratuit", color: "bg-surface text-muted border border-border", icon: null },
  pro:  { label: "Pro", color: "bg-primary-500/10 text-primary-400 border border-primary-500/30", icon: <Zap size={11} /> },
  max:  { label: "Max", color: "bg-accent-500/10 text-accent-400 border border-accent-500/30", icon: <Crown size={11} /> },
};

export default function SettingsPage() {
  const router = useRouter();
  const { email, logout, deleteAccount } = useAuth();
  const [planData, setPlanData] = useState<PlanData | null>(null);

  useEffect(() => {
    fetch("/api/user/plan").then((r) => r.json()).then(setPlanData);
  }, []);

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  async function handleDelete() {
    if (!confirm("Supprimer définitivement ton compte ? Cette action est irréversible.")) return;
    await deleteAccount();
    router.push("/");
  }

  const plan = planData?.plan ?? "free";
  const badge = PLAN_LABELS[plan];
  const isFree = plan === "free";
  const isPaid = plan === "pro" || plan === "max";
  const proUrl = checkoutUrl("pro", email ?? undefined);

  return (
    <div className="p-6 md:p-8 max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-fg">Paramètres</h1>
        <p className="mt-1 text-sm text-muted">Ton plan et ton compte.</p>
      </div>

      <div className="space-y-5">
        {/* Plan + usage */}
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-fg">Mon abonnement</h2>
              <p className="mt-0.5 text-xs text-muted">Connecté en tant que {email}</p>
            </div>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${badge.color}`}>
              {badge.icon}
              {badge.label}
            </span>
          </div>

          {planData ? (
            <div className="space-y-4">
              <UsageBar
                count={planData.docs.count}
                limit={planData.docs.limit}
                label="Documents stockés"
              />
              <UsageBar
                count={planData.messages.count}
                limit={planData.messages.limit}
                label="Messages ce mois-ci"
              />
            </div>
          ) : (
            <div className="h-10 animate-pulse rounded-xl bg-surface" />
          )}

          {isFree && (
            <div className="mt-5 rounded-2xl border border-accent-500/20 bg-accent-tint p-4">
              <p className="text-xs font-medium text-fg">Passe à Pro pour tout débloquer</p>
              <p className="mt-0.5 text-xs text-muted">Documents illimités, messages illimités, accès prioritaire.</p>
              <Link
                href={proUrl}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-brand px-4 py-2 text-xs font-semibold text-white hover:opacity-90 transition-all"
              >
                Passer à Pro — 4,99€/mois <ArrowUpRight size={12} />
              </Link>
            </div>
          )}

          {isPaid && (
            <div className="mt-5">
              <Link
                href={customerPortalUrl()}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-medium text-muted hover:bg-card-hover hover:text-fg transition-all"
              >
                <CreditCard size={12} />
                Gérer mon abonnement
                <ArrowUpRight size={11} />
              </Link>
            </div>
          )}
        </div>

        {/* Account */}
        <div className="rounded-3xl border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold text-fg">Compte</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-card-hover hover:text-fg transition-all"
            >
              <LogOut size={14} />
              Déconnexion
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-all"
            >
              <Trash2 size={14} />
              Supprimer mon compte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
