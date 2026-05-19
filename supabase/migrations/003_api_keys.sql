-- API Keys para integração com sistemas externos (ex: UNIAVP)
create table if not exists api_keys (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,                       -- nome descritivo (ex: "UNIAVP Produção")
  key_hash text not null unique,            -- SHA-256 da chave (nunca armazenar plain)
  key_prefix text not null,                 -- primeiros 8 chars para identificação (ex: "ns_live_")
  last_used_at timestamptz,
  expires_at timestamptz,                   -- null = sem expiração
  active boolean default true,
  created_at timestamptz default now()
);

-- Webhooks registrados por sistemas externos
create table if not exists webhooks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  url text not null,
  events text[] not null default '{"document.completed","document.rejected"}',
  secret text not null,                     -- para validar o payload no receiver
  active boolean default true,
  created_at timestamptz default now()
);

-- RLS
alter table api_keys enable row level security;
alter table webhooks enable row level security;

create policy "Empresa gerencia api_keys" on api_keys
  for all using (
    company_id in (select company_id from users where id = auth.uid())
  );

create policy "Empresa gerencia webhooks" on webhooks
  for all using (
    company_id in (select company_id from users where id = auth.uid())
  );

-- Service role pode ler tudo (para autenticação server-side)
create policy "Service role api_keys" on api_keys
  for select using (true);
