import Link from "next/link";
import { ArrowLeft, Home, BookOpen } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg px-6 text-center">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 select-none text-center font-semibold leading-none tracking-tighter text-fg/[0.03]"
        style={{ fontSize: "clamp(140px, 30vw, 340px)" }}
      >
        404
      </span>

      <div className="relative z-10 flex flex-col items-center">
        <div className="mb-10 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-brand">
            <BookOpen size={18} className="text-white" />
          </div>
          <span className="text-lg font-semibold text-fg">StudyPilot</span>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-tint px-3.5 py-1.5 text-xs font-medium text-primary-400">
          Erreur 404
        </div>

        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
          Page introuvable
        </h1>
        <p className="mt-3 max-w-sm text-sm text-muted">
          Cette page n&apos;existe pas ou a été déplacée.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-gradient-brand px-5 text-sm font-semibold text-white hover:opacity-90 transition-all"
          >
            <Home size={14} />
            Mon dashboard
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-medium text-fg hover:border-border-hover hover:bg-fg/5"
          >
            <ArrowLeft size={14} />
            Connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
