-- ============================================================
-- StudyPilot — Supabase Schema
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── Documents ──────────────────────────────────────────────
create table if not exists documents (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  title           text not null,
  content         text not null,
  summary         text,
  flashcard_count int  default 0,
  quiz_count      int  default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ── Flashcards ─────────────────────────────────────────────
create table if not exists flashcards (
  id          uuid primary key default uuid_generate_v4(),
  document_id uuid not null references documents(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  question    text not null,
  answer      text not null,
  created_at  timestamptz default now()
);

-- ── Quiz Questions (QCM) ───────────────────────────────────
create table if not exists quiz_questions (
  id            uuid primary key default uuid_generate_v4(),
  document_id   uuid not null references documents(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  question      text not null,
  options       jsonb not null,
  correct_index int  not null,
  explanation   text,
  created_at    timestamptz default now()
);

-- ── Chat Messages ──────────────────────────────────────────
create table if not exists chat_messages (
  id          uuid primary key default uuid_generate_v4(),
  document_id uuid not null references documents(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null check (role in ('user', 'assistant')),
  content     text not null,
  created_at  timestamptz default now()
);

-- ── Indexes ────────────────────────────────────────────────
create index if not exists documents_user_id_idx      on documents(user_id);
create index if not exists flashcards_document_id_idx  on flashcards(document_id);
create index if not exists quiz_document_id_idx        on quiz_questions(document_id);
create index if not exists chat_document_id_idx        on chat_messages(document_id);

-- ── Row Level Security ─────────────────────────────────────
alter table documents      enable row level security;
alter table flashcards     enable row level security;
alter table quiz_questions enable row level security;
alter table chat_messages  enable row level security;

create policy "documents_owner" on documents
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "flashcards_owner" on flashcards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "quiz_owner" on quiz_questions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "chat_owner" on chat_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Trigger: updated_at ────────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger documents_updated_at
  before update on documents
  for each row execute procedure update_updated_at();

-- ── Subscriptions ──────────────────────────────────────────
create table if not exists subscriptions (
  id                           uuid primary key default uuid_generate_v4(),
  user_id                      uuid not null references auth.users(id) on delete cascade unique,
  plan                         text not null default 'free' check (plan in ('free', 'pro', 'max')),
  status                       text not null default 'active' check (status in ('active', 'cancelled', 'expired', 'on_trial', 'paused')),
  lemon_squeezy_subscription_id text,
  lemon_squeezy_customer_id    text,
  current_period_end           timestamptz,
  created_at                   timestamptz default now(),
  updated_at                   timestamptz default now()
);

alter table subscriptions enable row level security;

create policy "subscriptions_owner" on subscriptions
  for select using (auth.uid() = user_id);

create trigger subscriptions_updated_at
  before update on subscriptions
  for each row execute procedure update_updated_at();

-- ── Usage (messages par mois) ──────────────────────────────
create table if not exists usage (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  year_month     text not null, -- format: "2026-05"
  messages_count int  not null default 0,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now(),
  unique(user_id, year_month)
);

alter table usage enable row level security;

create policy "usage_owner" on usage
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger usage_updated_at
  before update on usage
  for each row execute procedure update_updated_at();

-- ── Fonction atomique : incrément messages ────────────────
create or replace function increment_messages(p_user_id uuid, p_year_month text)
returns void language plpgsql security definer as $$
begin
  insert into usage (user_id, year_month, messages_count)
  values (p_user_id, p_year_month, 1)
  on conflict (user_id, year_month)
  do update set messages_count = usage.messages_count + 1, updated_at = now();
end;
$$;
