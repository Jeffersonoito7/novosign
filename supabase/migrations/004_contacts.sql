-- Tabela de contatos frequentes
create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  cpf text,
  created_at timestamptz default now()
);

alter table contacts enable row level security;

create policy "Empresa acessa contatos" on contacts
  for all using (
    company_id in (select company_id from users where id = auth.uid())
  );
