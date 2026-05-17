import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, Layers, HelpCircle, MessageSquare, Sparkles, ArrowRight, Check, Zap, Crown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function LandingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-bg">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-brand">
              <BookOpen size={15} className="text-white" />
            </div>
            <span className="font-semibold text-fg">StudyPilot</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/pricing"
              className="hidden h-9 items-center rounded-full px-4 text-sm font-medium text-muted hover:text-fg transition-colors sm:flex"
            >
              Tarifs
            </Link>
            <Link
              href="/login"
              className="flex h-9 items-center rounded-full px-4 text-sm font-medium text-fg hover:bg-card transition-colors"
            >
              Connexion
            </Link>
            <Link
              href="/signup"
              className="flex h-9 items-center gap-1.5 rounded-full bg-gradient-brand px-4 text-sm font-semibold text-white shadow-btn-blue hover:opacity-90 transition-all"
            >
              Commencer
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary-500/[0.12] blur-[100px]" />
          <div className="absolute -bottom-32 right-0 h-72 w-72 rounded-full bg-accent-500/[0.10] blur-[80px]" />
        </div>

        <div className="relative mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-tint px-3.5 py-1.5 text-xs font-medium text-primary-400">
            <Sparkles size={12} />
            Powered by GPT-4o-mini
          </div>

          <h1 className="mt-6 text-4xl font-bold tracking-tight text-fg sm:text-6xl">
            Transforme tes cours{" "}
            <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
              en savoir réel
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base text-muted sm:text-lg">
            Upload un PDF ou colle ton cours. L'IA génère tes flashcards, quiz QCM et résumé en quelques secondes.
            Pose-lui n'importe quelle question — c'est ton prof particulier 24h/24.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="flex h-12 items-center gap-2 rounded-full bg-gradient-brand px-6 text-[15px] font-semibold text-white shadow-btn-blue hover:opacity-90 transition-all"
            >
              Commencer gratuitement
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/pricing"
              className="flex h-12 items-center rounded-full border border-border px-6 text-[15px] font-medium text-fg hover:bg-card transition-colors"
            >
              Voir les tarifs
            </Link>
          </div>

          <p className="mt-4 text-xs text-dim">10 documents gratuits — pas de carte bancaire requise</p>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
              Tout ce qu'il te faut pour réviser
            </h2>
            <p className="mt-3 text-sm text-muted">Trois outils en un, alimentés par l'IA.</p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <FeatureCard
              icon={Layers}
              color="bg-primary-500"
              title="Flashcards auto"
              desc="L'IA extrait les concepts clés de ton cours et génère 10 flashcards prêtes à apprendre."
            />
            <FeatureCard
              icon={HelpCircle}
              color="bg-accent-500"
              title="Quiz QCM"
              desc="Teste tes connaissances avec 5 questions à choix multiples — avec explications détaillées."
            />
            <FeatureCard
              icon={MessageSquare}
              color="bg-success-500"
              title="Prof IA 24h/24"
              desc="Pose n'importe quelle question sur ton cours. L'IA connaît tout le contenu et t'explique avec des exemples."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">3 étapes, 30 secondes</h2>
          </div>

          <div className="space-y-4">
            <Step n="1" title="Upload ton cours" desc="PDF, notes, article — n'importe quel texte." />
            <Step n="2" title="L'IA fait le travail" desc="Flashcards, quiz et résumé générés en ~10 secondes." />
            <Step n="3" title="Révise efficacement" desc="Apprends, teste-toi, et discute avec ton prof IA." />
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl rounded-3xl border border-border bg-card p-10 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">Commence gratuitement</h2>
          <p className="mt-3 text-sm text-muted">10 documents offerts. Aucune carte bancaire requise.</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <PlanBadge name="Gratuit" price="0€" features={["10 documents", "50 messages IA / mois"]} />
            <PlanBadge name="Pro" price="4,99€" features={["Documents illimités", "Messages illimités"]} highlight icon={<Zap size={11} />} />
            <PlanBadge name="Max" price="13,99€" features={["Tout Pro inclus", "Features avancées"]} icon={<Crown size={11} />} />
          </div>

          <Link
            href="/signup"
            className="mt-10 inline-flex h-12 items-center gap-2 rounded-full bg-gradient-brand px-7 text-[15px] font-semibold text-white shadow-btn-blue hover:opacity-90 transition-all"
          >
            Créer mon compte gratuit
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-xs text-dim sm:flex-row">
          <p>© {new Date().getFullYear()} StudyPilot. Tous droits réservés.</p>
          <div className="flex gap-5">
            <Link href="/pricing" className="hover:text-muted transition-colors">Tarifs</Link>
            <Link href="/login" className="hover:text-muted transition-colors">Connexion</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, color, title, desc }: { icon: React.ElementType; color: string; title: string; desc: string }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-fg">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{desc}</p>
    </div>
  );
}

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-tint text-sm font-semibold text-primary-400">
        {n}
      </div>
      <div>
        <p className="text-sm font-semibold text-fg">{title}</p>
        <p className="mt-0.5 text-sm text-muted">{desc}</p>
      </div>
    </div>
  );
}

function PlanBadge({ name, price, features, highlight, icon }: { name: string; price: string; features: string[]; highlight?: boolean; icon?: React.ReactNode }) {
  return (
    <div className={`rounded-2xl border p-5 text-left ${highlight ? "border-primary-500/50 bg-primary-tint" : "border-border bg-surface"}`}>
      <div className="flex items-center gap-1.5">
        {icon}
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">{name}</p>
      </div>
      <p className="mt-2 text-2xl font-bold text-fg">{price}<span className="text-sm font-normal text-muted">/mo</span></p>
      <ul className="mt-3 space-y-1.5">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-1.5 text-xs text-muted">
            <Check size={11} className="mt-0.5 shrink-0 text-primary-400" />
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}
