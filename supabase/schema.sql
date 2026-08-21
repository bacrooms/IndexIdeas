create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  email text not null check (char_length(email) between 3 and 320),
  phone text not null check (char_length(phone) between 7 and 30),
  source text not null default 'index-ideas-website',
  created_at timestamptz not null default now()
);

alter table public.registrations enable row level security;

revoke all on table public.registrations from anon, authenticated;
grant insert on table public.registrations to service_role;

comment on table public.registrations is
  'Index Ideas event registration submissions. Access is server-only.';
