"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BookOpen, Upload, Settings, LogOut, Sun, Moon, LayoutDashboard, Zap, Crown, ArrowUpRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/ui/ThemeProvider";

const NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Tableau de bord" },
  { href: "/dashboard/upload", icon: Upload, label: "Nouveau document" },
  { href: "/dashboard/settings", icon: Settings, label: "Paramètres" },
];

type PlanInfo = {
  plan: "free" | "pro" | "max";
  docs: { count: number; limit: number | null };
};

const BADGE = {
  free: { label: "Gratuit", color: "bg-surface text-muted border-border", icon: null },
  pro:  { label: "Pro",     color: "bg-primary-500/10 text-primary-400 border-primary-500/30", icon: <Zap size={10} /> },
  max:  { label: "Max",     color: "bg-accent-500/10 text-accent-400 border-accent-500/30",   icon: <Crown size={10} /> },
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, userId } = useAuth();
  const { theme, toggle } = useTheme();
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);

  useEffect(() => {
    if (!userId) return;
    fetch("/api/user/plan").then((r) => r.json()).then(setPlanInfo);
  }, [userId, pathname]);

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  const badge = planInfo ? BADGE[planInfo.plan] : BADGE.free;
  const showUsage = planInfo?.plan === "free" && planInfo.docs.limit !== null;
  const pct = showUsage ? Math.min((planInfo!.docs.count / planInfo!.docs.limit!) * 100, 100) : 0;

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-brand">
          <BookOpen size={15} className="text-white" />
        </div>
        <span className="font-semibold text-fg">StudyPilot</span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all ${
                active ? "bg-primary-tint text-primary-400" : "text-muted hover:bg-card hover:text-fg"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Plan card */}
      {planInfo && (
        <div className="px-3">
          <div className="rounded-2xl border border-border bg-card p-3">
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badge.color}`}>
                {badge.icon}
                {badge.label}
              </span>
              {showUsage && (
                <span className="text-[10px] text-muted">
                  {planInfo.docs.count}/{planInfo.docs.limit}
                </span>
              )}
            </div>

            {showUsage && (
              <>
                <div className="mt-2 h-1.5 w-full rounded-full bg-surface">
                  <div
                    className={`h-1.5 rounded-full transition-all ${pct >= 80 ? "bg-amber-400" : "bg-primary-500"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <Link
                  href="/pricing"
                  className="mt-2.5 flex items-center justify-between gap-1 rounded-xl bg-gradient-brand px-2.5 py-1.5 text-[10px] font-semibold text-white hover:opacity-90 transition-all"
                >
                  Passer à Pro
                  <ArrowUpRight size={10} />
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      <div className="space-y-1 p-3 border-t border-border mt-3">
        <button
          onClick={toggle}
          className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-card hover:text-fg transition-all"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          {theme === "dark" ? "Mode clair" : "Mode sombre"}
        </button>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-red-500/10 hover:text-red-400 transition-all"
        >
          <LogOut size={16} />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
