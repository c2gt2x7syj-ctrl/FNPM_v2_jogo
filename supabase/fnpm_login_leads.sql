-- FNPM login lead capture table.
-- Run this in Supabase SQL Editor before enabling the Vercel env vars.

create table if not exists public.fnpm_login_leads (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  nome text not null,
  email text not null,
  device text not null default 'unknown',
  page_path text,
  referrer text,
  language text,
  viewport_width integer,
  viewport_height integer,
  user_agent text,
  source text not null default 'fnpm_game',
  constraint fnpm_login_leads_nome_length check (char_length(nome) between 1 and 200),
  constraint fnpm_login_leads_email_length check (char_length(email) between 3 and 200),
  constraint fnpm_login_leads_email_format check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$'),
  constraint fnpm_login_leads_device_check check (device in ('mobile', 'desktop', 'unknown')),
  constraint fnpm_login_leads_viewport_width_check check (viewport_width is null or viewport_width > 0),
  constraint fnpm_login_leads_viewport_height_check check (viewport_height is null or viewport_height > 0)
);

create index if not exists fnpm_login_leads_created_at_idx
  on public.fnpm_login_leads (created_at desc);

create index if not exists fnpm_login_leads_email_idx
  on public.fnpm_login_leads (email);

create index if not exists fnpm_login_leads_device_created_at_idx
  on public.fnpm_login_leads (device, created_at desc);

alter table public.fnpm_login_leads enable row level security;

comment on table public.fnpm_login_leads is
  'Lead captures from the FNPM game login screen. Inserts should come from the Vercel API route using a server-side Supabase key.';
