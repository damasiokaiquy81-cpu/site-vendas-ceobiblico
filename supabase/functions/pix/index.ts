// Função "pix" (Supabase Edge Function) — fala com o Mercado Pago no lugar da página,
// para o Access Token nunca aparecer no navegador, e anota cada compra na tabela "vendas".
//
//   POST /functions/v1/pix  { nome, email, telefone, dispositivo? } → cria o Pix e devolve o QR Code
//   GET  /functions/v1/pix?id=123                                   → diz se o pagamento 123 foi aprovado
//   POST /functions/v1/pix?aviso=mp                                 → aviso (webhook) do Mercado Pago
//
// Segredo necessário (Supabase → Edge Functions → Secrets): MP_ACCESS_TOKEN
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY o Supabase já coloca sozinho.
// Tabela: supabase/vendas.sql (rodar uma vez no SQL Editor).

const TOKEN = Deno.env.get('MP_ACCESS_TOKEN') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const PRECO = 25;
const DESCRICAO = 'CEOBiblico.ai — Chave de acesso';
// Marca os pagamentos deste site: a consulta só responde por eles.
const REFERENCIA = 'ceobiblico-chave';

const MP = 'https://api.mercadopago.com/v1/payments';

// Status do Mercado Pago → como aparece na tabela
const STATUS: Record<string, string> = {
  pending: 'pendente',
  in_process: 'pendente',
  approved: 'pago',
  cancelled: 'cancelado',
  rejected: 'recusado',
  refunded: 'devolvido',
  charged_back: 'contestado',
};

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, authorization, apikey, x-client-info',
};

function json(dados: unknown, status = 200) {
  return new Response(JSON.stringify(dados), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

// Tabela "vendas" pela API do próprio Supabase, com a chave de serviço (só existe aqui dentro).
async function tabela(metodo: string, filtro: string, dados: unknown) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/vendas${filtro}`, {
    method: metodo,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(dados),
  });
  if (!r.ok) console.error(`Tabela vendas (${metodo}) falhou:`, r.status, await r.text());
}

async function buscarPagamento(id: string) {
  const r = await fetch(`${MP}/${id}`, { headers: { Authorization: `Bearer ${TOKEN}` } });
  const p = await r.json();
  return r.ok && p.external_reference === REFERENCIA ? p : null;
}

// Copia para a tabela o status atual do pagamento
async function anotarStatus(p: { id: number; status: string; date_approved?: string }) {
  const dados: Record<string, unknown> = { status: STATUS[p.status] ?? p.status };
  if (p.status === 'approved') dados.pago_em = p.date_approved ?? new Date().toISOString();
  await tabela('PATCH', `?pagamento_id=eq.${p.id}`, dados);
}

async function criar(req: Request) {
  const corpo = await req.json().catch(() => ({}));
  const nome = String(corpo.nome ?? '').trim().replace(/\s+/g, ' ').slice(0, 120);
  const email = String(corpo.email ?? '').trim().toLowerCase().slice(0, 160);
  let telefone = String(corpo.telefone ?? '').replace(/\D/g, '');
  const dispositivo = String(corpo.dispositivo ?? '').slice(0, 64);

  if (nome.length < 2) return json({ erro: 'Digite o seu nome.' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ erro: 'Digite um e-mail válido.' }, 400);
  if (telefone.length === 10 || telefone.length === 11) telefone = '55' + telefone;
  if (!/^55\d{10,11}$/.test(telefone)) return json({ erro: 'Digite o seu WhatsApp com DDD.' }, 400);

  const [primeiro, ...resto] = nome.split(' ');
  const r = await fetch(MP, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': crypto.randomUUID(),
    },
    body: JSON.stringify({
      transaction_amount: PRECO,
      description: DESCRICAO,
      payment_method_id: 'pix',
      external_reference: REFERENCIA,
      notification_url: `${SUPABASE_URL}/functions/v1/pix?aviso=mp`,
      payer: { email, first_name: primeiro, last_name: resto.join(' ') || undefined },
    }),
  });
  const p = await r.json();
  if (!r.ok) {
    console.error('Mercado Pago recusou a criação do Pix:', JSON.stringify(p));
    return json({ erro: 'Não foi possível gerar o Pix agora. Tente de novo em instantes.' }, 502);
  }

  await tabela('POST', '', {
    pagamento_id: String(p.id),
    status: STATUS[p.status] ?? p.status,
    nome,
    email,
    telefone,
    valor: PRECO,
    dispositivo: dispositivo.length >= 8 ? dispositivo : null,
  });

  const t = p.point_of_interaction?.transaction_data ?? {};
  return json({ id: p.id, copiaecola: t.qr_code, qrcode: t.qr_code_base64 });
}

async function consultar(url: URL) {
  const id = url.searchParams.get('id') ?? '';
  if (!/^\d+$/.test(id)) return json({ erro: 'Pedido inválido.' }, 400);

  const p = await buscarPagamento(id);
  if (!p) return json({ erro: 'Pedido não encontrado.' }, 404);
  if (p.status !== 'pending') await anotarStatus(p);

  // pending = esperando o Pix · approved = pago · cancelled/rejected = não vale mais
  return json({ id: p.id, status: p.status, pago: p.status === 'approved' });
}

// Webhook: o Mercado Pago avisa que um pagamento mudou. Não confiamos no aviso em si —
// buscamos o pagamento direto no Mercado Pago e anotamos o status verdadeiro.
async function aviso(req: Request, url: URL) {
  const corpo = await req.json().catch(() => ({}));
  const tipo = corpo.type ?? corpo.topic ?? url.searchParams.get('type') ?? url.searchParams.get('topic');
  const id = String(corpo.data?.id ?? url.searchParams.get('data.id') ?? url.searchParams.get('id') ?? '');

  if (tipo === 'payment' && /^\d+$/.test(id)) {
    const p = await buscarPagamento(id);
    if (p) await anotarStatus(p);
  }
  return json({ ok: true });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (!TOKEN) return json({ erro: 'MP_ACCESS_TOKEN não configurado no Supabase.' }, 500);

  try {
    const url = new URL(req.url);
    if (req.method === 'POST' && url.searchParams.has('aviso')) return await aviso(req, url);
    if (req.method === 'POST') return await criar(req);
    if (req.method === 'GET') return await consultar(url);
    return json({ erro: 'Método não permitido.' }, 405);
  } catch (e) {
    console.error(e);
    return json({ erro: 'Falha ao falar com o Mercado Pago.' }, 502);
  }
});
