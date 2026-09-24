-- =====================================================================
-- CEOBiblico.ai — vendas pelo Pix (Mercado Pago)
-- Supabase → SQL Editor → cole tudo → Run. Pode rodar de novo sem problema.
-- Rode ANTES o supabase/pressel.sql do repositório site-pressel-ceobiblico
-- (a visão "vendas_com_pressel" junta as duas tabelas).
-- =====================================================================

-- Uma linha por Pix gerado. Quem grava é a função "pix" (supabase/functions/pix).
create table if not exists public.vendas (
  id            bigint generated always as identity primary key,
  pagamento_id  text not null unique,          -- nº do pedido no Mercado Pago
  status        text not null default 'pendente',  -- pendente | pago | cancelado | recusado | devolvido | contestado
  nome          text not null,
  email         text not null,
  telefone      text not null,                 -- WhatsApp com 55 + DDD, só dígitos
  valor         numeric(10, 2) not null,
  dispositivo   text,                          -- código da pressel (se a pessoa passou por ela)
  criado_em     timestamptz not null default now(),
  pago_em       timestamptz
);

create index if not exists vendas_dispositivo_idx on public.vendas (dispositivo);

-- Fechada: só a função "pix" (com a chave de serviço) lê e grava. A página não acessa direto.
alter table public.vendas enable row level security;
revoke all on public.vendas from anon, authenticated;


-- ---------------------------------------------------------------------
-- Vendas + respostas da pressel, lado a lado (abra no Table Editor)
-- ---------------------------------------------------------------------
create or replace view public.vendas_com_pressel
with (security_invoker = on) as
select
  v.criado_em,
  v.status,
  v.nome,
  v.email,
  v.telefone,
  v.valor,
  v.pagamento_id,
  v.pago_em,
  p.id is not null as veio_da_pressel,
  p.trabalho,
  p.religiao,
  p.tempo,
  p.ocupacao,
  p.aparelho,
  p.sistema
from public.vendas v
left join public.pressel_respostas p on p.dispositivo = v.dispositivo;

revoke all on public.vendas_com_pressel from anon, authenticated;


-- =====================================================================
-- Relatórios (rode quando quiser ver):
--
-- Quem pagou (para conferir antes de mandar a chave):
--   select pago_em, nome, telefone, email, pagamento_id
--     from public.vendas where status = 'pago' order by pago_em desc;
--
-- Funil: quantos responderam a pressel → geraram Pix → pagaram:
--   select
--     (select count(*) from public.pressel_respostas) as responderam_pressel,
--     count(distinct v.dispositivo) filter (where p.id is not null) as geraram_pix,
--     count(distinct v.dispositivo) filter (where p.id is not null and v.status = 'pago') as pagaram
--   from public.vendas v
--   left join public.pressel_respostas p on p.dispositivo = v.dispositivo;
--
-- Quem gerou Pix e não pagou (para chamar no WhatsApp):
--   select criado_em, nome, telefone, email from public.vendas v
--    where status <> 'pago'
--      and not exists (select 1 from public.vendas x where x.email = v.email and x.status = 'pago')
--    order by criado_em desc;
-- =====================================================================
