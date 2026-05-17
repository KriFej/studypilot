"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, BookOpen } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 text-center">
      <div className="mb-10 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-brand">
          <BookOpen size={18} className="text-white" />
        </div>
        <span className="text-lg font-semibold text-fg">StudyPilot</span>
      </div>
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10">
        <AlertTriangle size={28} className="text-red-400" />
      </div>
      <h1 className="mt-6 text-2xl font-medium text-fg">Une erreur est survenue</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        Quelque chose s&apos;est mal passé. Réessayez ou revenez au dashboard.
      </p>
      <div className="mt-8 flex gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-full bg-primary-500 px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          <RotateCcw size={14} />
          Réessayer
        </button>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-fg hover:bg-fg/5"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
