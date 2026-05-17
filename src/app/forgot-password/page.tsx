"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, Loader2, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/auth/confirm?type=recovery`,
      });
      if (error) { setError("Erreur — réessaie."); return; }
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-brand">
              <BookOpen size={15} className="text-white" />
            </div>
            <span className="font-semibold text-fg">StudyPilot</span>
          </Link>
        </div>

        <div className="rounded-3xl border border-border bg-card p-8">
          {sent ? (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-tint text-primary-400">
                <Mail size={22} />
              </div>
              <h1 className="mt-5 text-2xl font-semibold tracking-tight text-fg">Email envoyé</h1>
              <p className="mt-2 text-sm text-muted">
                Un lien de réinitialisation a été envoyé à <span className="font-medium text-fg">{email}</span>.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-flex h-10 items-center gap-2 rounded-full border border-border px-5 text-sm font-medium text-fg hover:bg-fg/5 transition-colors"
              >
                <ArrowLeft size={14} /> Retour à la connexion
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold tracking-tight text-fg">Mot de passe oublié</h1>
              <p className="mt-1.5 text-sm text-muted">
                Entre ton email — on t'envoie un lien pour le réinitialiser.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted">Email</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dim" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="toi@exemple.com"
                      className="h-11 w-full rounded-2xl border border-border bg-surface pl-9 pr-3 text-sm text-fg placeholder:text-dim focus:border-primary-500/60 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-400">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-gradient-brand text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 transition-all"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  Envoyer le lien
                </button>
              </form>

              <Link
                href="/login"
                className="mt-5 inline-flex items-center gap-1.5 text-xs text-muted hover:text-fg transition-colors"
              >
                <ArrowLeft size={12} /> Retour à la connexion
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
