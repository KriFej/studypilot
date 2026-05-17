"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, Loader2, AlertCircle, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";

type Tab = "text" | "pdf";

export default function UploadPage() {
  const router = useRouter();
  const { userId } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<Tab>("text");
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLimitReached(false);

    if (!title.trim()) {
      setError("Donne un titre à ce document.");
      return;
    }

    let content = text;

    if (tab === "pdf" && file) {
      setLoading(true);
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/parse-pdf", { method: "POST", body: fd });
      if (!res.ok) { setError("Impossible de lire le PDF."); setLoading(false); return; }
      const json = await res.json();
      content = json.text;
    }

    if (!content.trim()) {
      setError("Le contenu est vide.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data: doc, error: dbErr } = await supabase
        .from("documents")
        .insert({ user_id: userId, title: title.trim(), content })
        .select()
        .single();

      if (dbErr || !doc) throw new Error(dbErr?.message ?? "Erreur base de données");

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: doc.id, content }),
      });

      if (res.status === 403) {
        const json = await res.json();
        if (json.error === "limit_docs") {
          // Supprimer le doc inséré avant la vérification (race condition possible)
          await supabase.from("documents").delete().eq("id", doc.id);
          setLimitReached(true);
          return;
        }
        throw new Error(json.message ?? "Erreur génération IA");
      }

      if (!res.ok) throw new Error("Erreur génération IA");

      router.push(`/dashboard/document/${doc.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  const tabClass = (t: Tab) =>
    `px-4 py-2 text-sm font-medium rounded-full transition-all ${
      tab === t ? "bg-primary-500 text-white" : "text-muted hover:text-fg"
    }`;

  if (limitReached) {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <div className="rounded-3xl border border-accent-500/30 bg-accent-tint p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-500/20 text-3xl">
            📚
          </div>
          <h2 className="text-lg font-bold text-fg">Limite de 10 documents atteinte</h2>
          <p className="mt-2 text-sm text-muted">
            Tu as rempli ta bibliothèque gratuite. Passe à Pro pour continuer à apprendre sans limite.
          </p>
          <Link
            href="/pricing"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-brand px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition-all"
          >
            Voir les offres <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-fg">Nouveau document</h1>
        <p className="mt-1 text-sm text-muted">Colle du texte ou upload un PDF — l'IA s'occupe du reste.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">Titre du document</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ex. Chapitre 3 — Biologie cellulaire"
            className="h-11 w-full rounded-2xl border border-border bg-surface px-4 text-sm text-fg placeholder:text-dim focus:border-primary-500/60 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
          />
        </div>

        <div className="flex gap-1 rounded-full border border-border bg-surface p-1 w-fit">
          <button type="button" className={tabClass("text")} onClick={() => setTab("text")}>Texte</button>
          <button type="button" className={tabClass("pdf")} onClick={() => setTab("pdf")}>PDF</button>
        </div>

        {tab === "text" ? (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">Contenu du cours</label>
            <textarea
              required={tab === "text"}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={12}
              placeholder="Colle ici ton cours, tes notes, un article…"
              className="w-full rounded-2xl border border-border bg-surface p-4 text-sm text-fg placeholder:text-dim resize-y focus:border-primary-500/60 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
            />
          </div>
        ) : (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">Fichier PDF</label>
            <div
              onClick={() => fileRef.current?.click()}
              className={`flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-all ${
                file ? "border-primary-500/50 bg-primary-tint" : "border-border hover:border-primary-500/40 hover:bg-primary-tint/50"
              }`}
            >
              {file ? (
                <>
                  <FileText size={28} className="text-primary-400" />
                  <p className="text-sm font-medium text-fg">{file.name}</p>
                  <p className="text-xs text-muted">{(file.size / 1024).toFixed(0)} Ko</p>
                </>
              ) : (
                <>
                  <Upload size={28} className="text-dim" />
                  <p className="text-sm text-muted">Clique pour choisir un PDF</p>
                  <p className="text-xs text-dim">Max 10 Mo</p>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex h-12 w-full items-center justify-center gap-2.5 rounded-full bg-gradient-brand text-[15px] font-semibold text-white shadow-btn-blue hover:opacity-90 active:scale-[0.98] disabled:opacity-60 transition-all"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {loading ? "Génération en cours…" : "Générer flashcards + quiz"}
        </button>
      </form>
    </div>
  );
}
