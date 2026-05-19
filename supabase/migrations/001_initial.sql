-- NovoSign - Schema inicial

-- Planos
create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price_monthly decimal(10,2) not null default 0,
  documents_limit integer not null default 10,
  users_limit integer not null default 1,
  features jsonb default '[]',
  created_at timestamptz default now()
);

-- Empresas (tenants)
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cnpj text unique,
  email text not null,
  logo_url text,
  plan_id uuid references plans(id),
  credits integer default 0,
  created_at timestamptz default now()
);

-- Usuários (extensão do auth.users)
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references companies(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null default 'member' check (role in ('owner','admin','member')),
  created_at timestamptz default now()
);

-- Documentos
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  title text not null,
  status text not null default 'draft' check (status in ('draft','pending','completed','cancelled')),
  file_path text not null,
  file_hash text not null,
  signed_file_path text,
  signed_file_hash text,
  created_by uuid references users(id),
  expires_at timestamptz,
  message text,
  created_at timestamptz default now()
);

-- Signatários
create table if not exists signatories (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  cpf text,
  sign_order integer not null default 1,
  status text not null default 'pending' check (status in ('pending','viewed','signed','rejected')),
  token text unique not null default gen_random_uuid()::text,
  notification_channel text not null default 'email' check (notification_channel in ('email','whatsapp','sms')),
  signed_at timestamptz,
  ip_address text,
  user_agent text,
  geolocation jsonb,
  signature_image_path text,
  rejection_reason text,
  created_at timestamptz default now()
);

-- Eventos de auditoria (append-only)
create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  signatory_id uuid references signatories(id),
  event_type text not null check (event_type in (
    'document_created','document_sent','document_viewed',
    'code_sent','code_verified','signed','rejected','completed','cancelled'
  )),
  ip_address text,
  user_agent text,
  geolocation jsonb,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- Códigos OTP
create table if not exists verification_codes (
  id uuid primary key default gen_random_uuid(),
  signatory_id uuid not null references signatories(id) on delete cascade,
  code text not null,
  channel text not null check (channel in ('email','whatsapp','sms')),
  expires_at timestamptz not null,
  used_at timestamptz,
  attempts integer default 0,
  created_at timestamptz default now()
);

-- Templates de documento
create table if not exists document_templates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  title text not null,
  content text not null,
  variables jsonb default '[]',
  created_at timestamptz default now()
);

-- Plano inicial (free)
insert into plans (name, price_monthly, documents_limit, users_limit, features)
values
  ('Gratuito', 0, 5, 1, '["5 documentos/mês","1 usuário","Assinatura eletrônica"]'),
  ('Básico', 49.90, 50, 3, '["50 documentos/mês","3 usuários","E-mail + WhatsApp","Templates"]'),
  ('Profissional', 99.90, 200, 10, '["200 documentos/mês","10 usuários","E-mail + WhatsApp + SMS","Templates","API"]'),
  ('Empresarial', 299.90, 1000, 50, '["1000 documentos/mês","50 usuários","Todos os canais","Templates","API","White-label"]')
on conflict do nothing;

-- RLS
alter table companies enable row level security;
alter table users enable row level security;
alter table documents enable row level security;
alter table signatories enable row level security;
alter table audit_events enable row level security;
alter table verification_codes enable row level security;
alter table document_templates enable row level security;

-- Policies: users
create policy "Usuário acessa próprio perfil" on users
  for all using (auth.uid() = id);

-- Policies: companies
create policy "Usuário acessa própria empresa" on companies
  for all using (
    id in (select company_id from users where id = auth.uid())
  );

-- Policies: documents
create policy "Usuário acessa docs da empresa" on documents
  for all using (
    company_id in (select company_id from users where id = auth.uid())
  );

-- Policies: signatories (acesso por token - público, ou por empresa)
create policy "Signatário acessa por token" on signatories
  for select using (true);

create policy "Empresa gerencia signatários" on signatories
  for all using (
    document_id in (
      select id from documents where company_id in (
        select company_id from users where id = auth.uid()
      )
    )
  );

-- Policies: audit_events (somente insert público para sign flow, select pela empresa)
create policy "Empresa lê audit" on audit_events
  for select using (
    document_id in (
      select id from documents where company_id in (
        select company_id from users where id = auth.uid()
      )
    )
  );

create policy "Insert audit livre" on audit_events
  for insert with check (true);

-- Policies: verification_codes
create policy "Acesso público codes" on verification_codes
  for all using (true);

-- Policies: templates
create policy "Empresa acessa templates" on document_templates
  for all using (
    company_id in (select company_id from users where id = auth.uid())
  );
