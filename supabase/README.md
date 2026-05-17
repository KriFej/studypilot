# Supabase — setup locpilote

## 1. Appliquer le schéma

Dans ton projet Supabase :

1. Ouvre **SQL Editor** (icône `</>` dans la sidebar).
2. Crée une nouvelle query, colle le contenu de `supabase/schema.sql`.
3. Clique **Run**.

Tu devrais voir `Success. No rows returned`. Les tables `properties`
et `subscriptions` apparaissent dans **Table Editor**.

## 2. Variables d'environnement

Copie `.env.local.example` en `.env.local` et renseigne :

- `NEXT_PUBLIC_SUPABASE_URL` — sous **Project Settings → API** → *Project URL*
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — clé *publishable* (`sb_publishable_…`)
- `SUPABASE_SERVICE_ROLE_KEY` — clé *secret* (`sb_secret_…`), utilisée
  uniquement côté serveur pour le webhook Stripe.

Sur Vercel, ajoute les 3 variables dans **Project → Settings → Environment
Variables** (Production + Preview).

## 3. Sécurité — RLS

Toutes les tables sont protégées par Row Level Security :

- `properties` : l'utilisateur authentifié n'accède qu'à ses propres biens.
- `subscriptions` : lecture seule côté client. Les mutations passent par
  le webhook Stripe avec la clé service role (qui bypass RLS).

Cela verrouille la vulnérabilité `/success?plan=unlimited` : même en
appelant l'API Supabase directement, un utilisateur ne peut pas
insérer/modifier sa ligne `subscriptions`.
