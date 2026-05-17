"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { Loader2, Mail, Lock, ArrowRight, Eye, EyeOff, BookOpen, Zap, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type Mode = "login" | "signup";

function FeatureItem({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-white/60">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.06]">
        <Icon size={15} className="text-primary-400" />
      </div>
      {label}
    </div>
  );
}

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signup, login, resendConfirmation } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendDone, setResendDone] = useState(false);

  const isSignup = mode === "signup";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (isSignup && password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    try {
      if (isSignup) {
        const res = await signup(email, password);
        if (!res.ok) { setError(res.error); return; }
        setSentTo(email);
      } else {
        const res = await login(email, password);
        if (!res.ok) { setError(res.error); return; }
        router.push("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "h-11 w-full rounded-2xl border border-border bg-surface pl-9 pr-3 text-sm text-fg placeholder:text-dim " +
    "focus:border-primary-500/60 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all";

  return (
    <div className="flex min-h-screen bg-bg">
      {/* ── Brand panel (desktop) ── */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-white/[0.06] bg-[#060B18] p-10 lg:flex lg:w-[460px] lg:shrink-0">
        {/* Background glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary-500/[0.12] blur-[100px]" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-accent-500/[0.10] blur-[80px]" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-brand">
            <BookOpen size={18} className="text-white" />
          </div>
          <span className="text-lg font-semibold text-white">StudyPilot</span>
        </div>

        {/* Center content */}
        <div className="relative space-y-8">
          <div>
            <h2 className="text-3xl font-bold leading-tight text-white">
              Transforme tes cours<br />en savoir réel.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/50">
              Upload un PDF ou colle du texte. L'IA génère tes flashcards, quiz et résumé en quelques secondes.
            </p>
          </div>

          <div className="space-y-3">
            <FeatureItem icon={Zap} label="Flashcards générées automatiquement" />
            <FeatureItem icon={BookOpen} label="Quiz QCM pour tester tes connaissances" />
            <FeatureItem icon={MessageSquare} label="Chat IA « mode prof » sur chaque document" />
          </div>

          {/* Gradient card preview */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-widest text-white/30">Exemple — Flashcard</p>
            <div className="rounded-xl bg-gradient-brand-soft p-3">
              <p className="text-xs font-medium text-white/80">Q · Qu'est-ce que la mitose ?</p>
              <p className="mt-1.5 text-xs text-white/50">Division cellulaire produisant deux cellules filles génétiquement identiques à la cellule mère.</p>
            </div>
          </div>
        </div>

        <p className="relative text-xs text-white/20">© {new Date().getFullYear()} StudyPilot</p>
      </div>

      {/* ── Form panel ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-brand">
            <BookOpen size={15} className="text-white" />
          </div>
          <span className="text-base font-semibold text-fg">StudyPilot</span>
        </div>

        <div className="w-full max-w-sm">
          {sentTo ? (
            /* Email sent state */
            <div className="rounded-3xl border border-border bg-card p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-tint text-primary-400">
                <Mail size={22} />
              </div>
              <h1 className="mt-5 text-2xl font-semibold tracking-tight text-fg">Vérifie ton email</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Un lien de confirmation a été envoyé à{" "}
                <span className="font-medium text-fg">{sentTo}</span>.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/login" className="inline-flex h-10 items-center justify-center rounded-full border border-border px-5 text-sm font-medium text-fg hover:bg-fg/5 transition-colors">
                  Retour à la connexion
                </Link>
                <button
                  type="button"
                  disabled={resendLoading || resendDone}
                  onClick={async () => {
                    setResendLoading(true);
                    await resendConfirmation(sentTo);
                    setResendLoading(false);
                    setResendDone(true);
                  }}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-border px-5 text-sm font-medium text-muted hover:bg-fg/5 disabled:opacity-60 transition-colors"
                >
                  {resendLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                  {resendDone ? "Email renvoyé !" : "Renvoyer"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-7">
                <h1 className="text-2xl font-bold tracking-tight text-fg">
                  {isSignup ? "Crée ton compte" : "Bon retour 👋"}
                </h1>
                <p className="mt-1.5 text-sm text-muted">
                  {isSignup
                    ? "Commence à apprendre plus vite, gratuitement."
                    : "Accède à tes documents et flashcards."}
                </p>
              </div>

              {searchParams.get("error") === "confirm" && (
                <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-400">
                  Lien de confirmation invalide ou expiré.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
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
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-xs font-medium text-muted">Mot de passe</label>
                    {!isSignup && (
                      <Link href="/forgot-password" className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
                        Oublié ?
                      </Link>
                    )}
                  </div>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dim" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isSignup ? "6 caractères minimum" : "••••••••"}
                      className={`${inputClass} pr-10`}
                    />
                    <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-muted transition-colors">
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                {isSignup && (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted">Confirmer le mot de passe</label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dim" />
                      <input
                        type={showConfirm ? "text" : "password"}
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`${inputClass} pr-10`}
                      />
                      <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-muted transition-colors">
                        {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-400">
                    {error}
                    {isSignup && error.includes("existe déjà") && (
                      <> — <Link href="/login" className="underline hover:text-red-300">Se connecter</Link></>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-brand text-[15px] font-semibold text-white shadow-btn-blue transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                  {isSignup ? "Créer mon compte" : "Se connecter"}
                </button>
              </form>

              <p className="mt-6 text-center text-xs text-muted">
                {isSignup ? "Déjà un compte ?" : "Pas encore de compte ?"}{" "}
                <Link href={isSignup ? "/login" : "/signup"} className="font-medium text-primary-400 hover:text-primary-300 transition-colors">
                  {isSignup ? "Connexion" : "Créer un compte gratuit"}
                </Link>
              </p>

              <p className="mt-2 text-center text-[11px] text-dim">
                Curieux des tarifs ?{" "}
                <Link href="/pricing" className="underline hover:text-muted transition-colors">
                  Voir les offres
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
