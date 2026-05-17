"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Key, Save, Eye, EyeOff, LogOut, Trash2, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function SettingsPage() {
  const router = useRouter();
  const { email, logout, deleteAccount } = useAuth();
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sp-openai-key") ?? "";
    setApiKey(stored);
  }, []);

  function saveKey() {
    if (apiKey.trim()) {
      localStorage.setItem("sp-openai-key", apiKey.trim());
    } else {
      localStorage.removeItem("sp-openai-key");
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  async function handleDelete() {
    if (!confirm("Supprimer définitivement ton compte ? Cette action est irréversible.")) return;
    await deleteAccount();
    router.push("/");
  }

  return (
    <div className="p-6 md:p-8 max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-fg">Paramètres</h1>
        <p className="mt-1 text-sm text-muted">Configure ta clé API et gère ton compte.</p>
      </div>

      <div className="space-y-5">
        {/* API Key */}
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-tint">
              <Key size={16} className="text-accent-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-fg">Clé API OpenAI</h2>
              <p className="text-xs text-muted">Stockée uniquement dans ton navigateur, jamais envoyée à nos serveurs.</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-proj-..."
                className="h-11 w-full rounded-2xl border border-border bg-surface pr-10 pl-4 text-sm text-fg placeholder:text-dim font-mono focus:border-accent-500/60 focus:outline-none focus:ring-2 focus:ring-accent-500/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-muted transition-colors"
              >
                {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            <button
              onClick={saveKey}
              className={`flex h-10 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-all ${
                saved
                  ? "bg-success-500/10 text-success-500"
                  : "bg-accent-500 text-white hover:opacity-90 shadow-btn-purple"
              }`}
            >
              {saved ? <Check size={14} /> : <Save size={14} />}
              {saved ? "Sauvegardé !" : "Sauvegarder"}
            </button>
          </div>

          <p className="mt-4 text-[11px] leading-relaxed text-dim">
            La clé est stockée dans localStorage de ton navigateur. Elle n'est jamais transmise à nos serveurs — elle est envoyée directement à l'API OpenAI depuis ton navigateur.
          </p>
        </div>

        {/* Account */}
        <div className="rounded-3xl border border-border bg-card p-6">
          <h2 className="mb-1 text-sm font-semibold text-fg">Compte</h2>
          <p className="text-xs text-muted">Connecté en tant que <span className="font-medium text-fg">{email}</span></p>

          <div className="mt-5 flex flex-wrap gap-3">
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
