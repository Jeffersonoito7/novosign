-- Pacotes de créditos disponíveis para compra
create table if not exists credit_packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  credits integer not null,
  price_cents integer not null,       -- preço em centavos (R$)
  price_annual_cents integer,         -- preço anual mensal em centavos
  stripe_price_id text,               -- ID do Price no Stripe (avulso)
  stripe_price_annual_id text,        -- ID do Price no Stripe (anual)
  active boolean default true,
  created_at timestamptz default now()
);

-- Histórico de transações de créditos
create table if not exists credit_transactions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  type text not null check (type in ('purchase','deduction','bonus','refund')),
  credits integer not null,           -- positivo = entrada, negativo = saída
  balance_after integer not null,     -- saldo após a transação
  description text not null,
  document_id uuid references documents(id),
  stripe_session_id text,
  stripe_payment_intent_id text,
  package_id uuid references credit_packages(id),
  created_at timestamptz default now()
);

-- Pacotes padrão (mesmos preços do mercado)
insert into credit_packages (name, credits, price_cents, price_annual_cents)
values
  ('Starter',      15,  5990,  4490),
  ('Básico',       30,  9900,  7900),
  ('Professional', 100, 27900, 21900),
  ('Business',     200, 52900, 41900),
  ('Scale',        500, 124900, 99900),
  ('Enterprise',   1000, 219900, 159900)
on conflict do nothing;

-- RLS
alter table credit_packages enable row level security;
alter table credit_transactions enable row level security;

create policy "Pacotes públicos" on credit_packages
  for select using (active = true);

create policy "Empresa vê transações" on credit_transactions
  for select using (
    company_id in (select company_id from users where id = auth.uid())
  );

create policy "Insert transação livre (server-side)" on credit_transactions
  for insert with check (true);
