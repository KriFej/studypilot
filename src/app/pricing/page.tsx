import Link from "next/link";
import type { Metadata } from "next";
import { Check, BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "Tarifs — StudyPilot",
  description: "Commence gratuitement avec 10 documents. Upgrade à Pro pour un stockage et des messages illimités.",
};

const plans = [
  {
    name: "Gratuit",
    price: "0€",
    period: "pour toujours",
    description: "Pour découvrir StudyPilot",
    color: "border-border",
    btnClass: "border border-border bg-card text-fg hover:bg-card-hover",
    href: "/signup",
    btnLabel: "Commencer gratuitement",
    features: [
      "10 documents maximum",
      "50 messages IA / mois",
      "Flashcards & quiz illimités",
      "Professeur IA inclus",
    ],
    limit: true,
  },
  {
    name: "Pro",
    price: "4,99€",
    period: "par mois",
    description: "Pour les étudiants sérieux",
    color: "border-primary-500/50 ring-2 ring-primary-500/20",
    btnClass: "bg-gradient-brand text-white shadow-btn-blue hover:opacity-90",
    href: process.env.NEXT_PUBLIC_LS_PRO_VARIANT_ID !== "a_configurer"
      ? `https://studypilote.lemonsqueezy.com/checkout/buy/${process.env.NEXT_PUBLIC_LS_PRO_VARIANT_ID}`
      : "/signup",
    btnLabel: "Choisir Pro",
    badge: "Le plus populaire",
    features: [
      "Documents illimités",
      "Messages illimités",
      "Flashcards & quiz illimités",
      "Professeur IA inclus",
      "Accès prioritaire aux nouvelles features",
    ],
  },
  {
    name: "Max",
    price: "13,99€",
    period: "par mois",
    description: "Pour aller plus loin",
    color: "border-accent-500/50",
    btnClass: "bg-accent-500 text-white shadow-btn-purple hover:opacity-90",
    href: process.env.NEXT_PUBLIC_LS_MAX_VARIANT_ID !== "a_configurer"
      ? `https://studypilote.lemonsqueezy.com/checkout/buy/${process.env.NEXT_PUBLIC_LS_MAX_VARIANT_ID}`
      : "/signup",
    btnLabel: "Choisir Max",
    features: [
      "Tout ce qui est dans Pro",
      "Fonctionnalités avancées (bientôt)",
      "Support prioritaire",
      "Accès bêta exclusif",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-bg px-6 py-20">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-4 flex justify-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-brand">
              <BookOpen size={15} className="text-white" />
            </div>
            <span className="font-semibold text-fg">StudyPilot</span>
          </Link>
        </div>

        <h1 className="mt-8 text-center text-3xl font-bold tracking-tight text-fg sm:text-4xl">
          Des tarifs simples
        </h1>
        <p className="mt-3 text-center text-sm text-muted">
          Commence gratuitement. Upgrade quand tu en as besoin.
        </p>

        {/* Plans */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-3xl border bg-card p-7 ${p.color}`}
            >
              {p.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-primary-500 px-3 py-1 text-[11px] font-semibold text-white">
                    {p.badge}
                  </span>
                </div>
              )}

              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">{p.name}</p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-fg">{p.price}</span>
                  <span className="text-sm text-muted">/ {p.period}</span>
                </div>
                <p className="mt-1 text-xs text-muted">{p.description}</p>
              </div>

              <Link
                href={p.href}
                className={`flex h-10 w-full items-center justify-center rounded-full text-sm font-semibold transition-all ${p.btnClass}`}
              >
                {p.btnLabel}
              </Link>

              <ul className="mt-6 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-muted">
                    <Check size={14} className="mt-0.5 shrink-0 text-primary-400" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-dim">
          Paiement sécurisé via Lemon Squeezy · Résiliable à tout moment
        </p>
      </div>
    </div>
  );
}
