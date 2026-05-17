"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AuthResult = { ok: true } | { ok: false; error: string };

function translateError(message: string | undefined): string {
  if (!message) return "Une erreur est survenue.";
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "Email ou mot de passe incorrect.";
  if (m.includes("user already registered"))
    return "Un compte existe déjà avec cet email.";
  if (m.includes("password should be at least"))
    return "Le mot de passe doit contenir au moins 6 caractères.";
  if (m.includes("unable to validate email"))
    return "Email invalide.";
  if (m.includes("email not confirmed"))
    return "Email non confirmé — vérifie ta boîte mail.";
  if (m.includes("token has expired") || m.includes("otp expired"))
    return "Le lien a expiré, recommencez.";
  if (m.includes("same password"))
    return "Le nouveau mot de passe doit être différent.";
  return message;
}

export function useAuth() {
  const supabase = useMemo(() => createClient(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUserId(data.user?.id ?? null);
      setEmail(data.user?.email ?? null);
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
      setEmail(session?.user?.email ?? null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const signup = useCallback(
    async (mail: string, password: string): Promise<AuthResult> => {
      const { data, error } = await supabase.auth.signUp({
        email: mail.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/auth/confirm`
              : undefined,
        },
      });
      if (error) return { ok: false, error: translateError(error.message) };
      // Supabase silently "succeeds" for duplicate emails when confirm is enabled.
      // Detect it via empty identities array.
      if (data.user && data.user.identities?.length === 0) {
        return { ok: false, error: "Un compte existe déjà avec cet email." };
      }
      return { ok: true };
    },
    [supabase],
  );

  const deleteAccount = useCallback(async (): Promise<AuthResult> => {
    const res = await fetch("/api/account/delete", { method: "DELETE" });
    if (!res.ok) return { ok: false, error: "Erreur lors de la suppression du compte." };
    await supabase.auth.signOut();
    return { ok: true };
  }, [supabase]);

  const login = useCallback(
    async (mail: string, password: string): Promise<AuthResult> => {
      const { error } = await supabase.auth.signInWithPassword({
        email: mail.trim().toLowerCase(),
        password,
      });
      if (error) return { ok: false, error: translateError(error.message) };
      return { ok: true };
    },
    [supabase],
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase]);

  const resendConfirmation = useCallback(
    async (mail: string): Promise<AuthResult> => {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: mail.trim().toLowerCase(),
        options: {
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/auth/confirm`
              : undefined,
        },
      });
      if (error) return { ok: false, error: translateError(error.message) };
      return { ok: true };
    },
    [supabase],
  );

  return { userId, email, ready, signup, login, logout, deleteAccount, resendConfirmation };
}
