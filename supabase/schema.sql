-- Stock & Order: esquema inicial para catálogo e encomenda partilhada.
-- Executar no SQL Editor de um projeto Supabase novo.

create extension if not exists pgcrypto;

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'A minha loja',
  created_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  primary key (workspace_id, user_id)
);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  supplier_id uuid references public.suppliers(id) on delete set null,
  name text not null,
  brand text,
  barcode text,
  photo_path text,
  created_at timestamptz not null default now(),
  unique (workspace_id, barcode)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null default 'Encomenda atual',
  status text not null default 'open' check (status in ('open','completed')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null default 1 check (quantity > 0),
  collected boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (order_id, product_id)
);

-- RLS: os membros de um espaço só podem consultar e alterar os dados desse espaço.
create or replace function public.is_workspace_member(target_workspace uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = target_workspace and user_id = auth.uid()
  );
$$;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.suppliers enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "members read workspace" on public.workspaces for select using (public.is_workspace_member(id));
create policy "members read memberships" on public.workspace_members for select using (public.is_workspace_member(workspace_id));
create policy "members read suppliers" on public.suppliers for select using (public.is_workspace_member(workspace_id));
create policy "members write suppliers" on public.suppliers for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members read products" on public.products for select using (public.is_workspace_member(workspace_id));
create policy "members write products" on public.products for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members read orders" on public.orders for select using (public.is_workspace_member(workspace_id));
create policy "members write orders" on public.orders for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members read order items" on public.order_items for select using (
  exists (select 1 from public.orders o where o.id = order_id and public.is_workspace_member(o.workspace_id))
);
create policy "members write order items" on public.order_items for all using (
  exists (select 1 from public.orders o where o.id = order_id and public.is_workspace_member(o.workspace_id))
) with check (
  exists (select 1 from public.orders o where o.id = order_id and public.is_workspace_member(o.workspace_id))
);

-- Nota: o convite de membros e a criação inicial do workspace devem ser feitos
-- através de um fluxo autenticado/servidor. Não expor service_role no frontend.
