create table public.daily_insights (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  insight_data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.daily_insights enable row level security;

-- Políticas de segurança
create policy "Usuários podem ver seus próprios insights"
  on public.daily_insights for select
  using ( auth.uid() = user_id );

create policy "Usuários podem inserir seus próprios insights"
  on public.daily_insights for insert
  with check ( auth.uid() = user_id );

create policy "Usuários podem atualizar seus próprios insights"
  on public.daily_insights for update
  using ( auth.uid() = user_id );
