"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, FileText, Layers, HelpCircle, ArrowRight, Plus, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import type { Document } from "@/lib/types";

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${color}`}>
        <Icon size={16} className="text-white" />
      </div>
      <div className="mt-3 text-2xl font-bold text-fg">{value}</div>
      <div className="mt-0.5 text-xs text-muted">{label}</div>
    </div>
  );
}

function DocumentCard({ doc }: { doc: Document }) {
  return (
    <Link
      href={`/dashboard/document/${doc.id}`}
      className="group flex items-start gap-4 rounded-3xl border border-border bg-card p-5 transition-all hover:border-primary-500/40 hover:bg-card-hover"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-tint">
        <FileText size={18} className="text-primary-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-fg group-hover:text-primary-400 transition-colors">
          {doc.title}
        </p>
        <p className="mt-0.5 text-xs text-muted">
          {doc.flashcard_count ?? 0} flashcards · {doc.quiz_count ?? 0} questions
        </p>
        <p className="mt-1 text-[11px] text-dim">
          {new Date(doc.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
        </p>
      </div>
      <ArrowRight size={15} className="shrink-0 text-dim opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
    </Link>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { userId, email, ready } = useAuth();
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ready && !userId) router.replace("/login");
  }, [ready, userId, router]);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    supabase
      .from("documents")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setDocs(data ?? []);
        setLoading(false);
      });
  }, [userId]);

  if (!ready || !userId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 size={20} className="animate-spin text-muted" />
      </div>
    );
  }

  const firstName = email?.split("@")[0]?.split(".")[0] ?? "là";
  const name = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  const totalFlashcards = docs.reduce((s, d) => s + (d.flashcard_count ?? 0), 0);
  const totalQuizzes = docs.reduce((s, d) => s + (d.quiz_count ?? 0), 0);

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs text-muted">Bonjour,</p>
          <h1 className="mt-0.5 text-2xl font-bold text-fg md:text-3xl">{name} 👋</h1>
        </div>
        <Link
          href="/dashboard/upload"
          className="flex items-center gap-2 rounded-full bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-white shadow-btn-blue hover:opacity-90 transition-all"
        >
          <Plus size={15} />
          Nouveau document
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <StatCard icon={FileText} label="Documents" value={docs.length} color="bg-primary-500" />
        <StatCard icon={Layers} label="Flashcards" value={totalFlashcards} color="bg-accent-500" />
        <StatCard icon={HelpCircle} label="Questions" value={totalQuizzes} color="bg-success-500" />
      </div>

      {/* Documents list */}
      <div>
        <h2 className="mb-4 text-sm font-semibold text-fg">Mes documents récents</h2>

        {loading ? (
          <div className="flex h-40 items-center justify-center text-muted">
            <Loader2 size={18} className="animate-spin" />
          </div>
        ) : docs.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-tint">
              <BookOpen size={22} className="text-primary-400" />
            </div>
            <p className="text-sm font-medium text-fg">Aucun document pour l'instant</p>
            <p className="mt-1 text-xs text-muted">Commence par uploader un PDF ou coller du texte.</p>
            <Link
              href="/dashboard/upload"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-white shadow-btn-blue hover:opacity-90 transition-all"
            >
              <Plus size={14} />
              Ajouter un document
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {docs.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
