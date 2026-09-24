# site-vendas-ceobiblico

Site de vendas do CEOBiblico.ai — programa de Windows que manda um versículo por dia.

## Arquivos

- `index.html` — página de vendas: carrossel com os dois programas (primeiro o CEOLocalBiblico.ai, a seta leva ao
  CEOBiblico.ai), um botão de compra e o checkout Pix.
  Os vídeos ficam no Supabase Storage (bucket público `Videos`); para trocar, mude o `data-src` de cada `.vsl`.
- `obrigado.html` — página de compra realizada. Confere o pagamento no Mercado Pago e só então mostra o botão do WhatsApp
  (número na variável `WHATSAPP`, no `<script>` do arquivo) com a mensagem pedindo a chave e o número do pedido.
- `supabase/functions/pix/index.ts` — função do Supabase que cria o Pix de R$ 25 e consulta se foi pago.
- `assets/` — logo, favicon e fonte Inter (licença em `assets/OFL.txt`).

A pressel (as 4 perguntas) fica em outro repositório: `site-pressel-ceobiblico`.

## Pagamento (Pix pelo Mercado Pago)

1. Os botões `ADQUIRIR CHAVE DE ACESSO` abrem uma janela que pede nome, e-mail e WhatsApp e gera o Pix (QR Code + Copia e Cola).
2. A função `pix` anota o pedido na tabela `vendas` como `pendente`.
3. A janela pergunta à função `pix` a cada 4 segundos se o pagamento foi aprovado.
4. Aprovado → vai para `obrigado.html?id=<pedido>`, que confere de novo e libera o WhatsApp.
5. A tabela passa para `pago` quando a página confere, ou pelo aviso (webhook) que o Mercado Pago manda para
   `.../functions/v1/pix?aviso=mp` — mesmo que o cliente feche a página antes.

O Access Token do Mercado Pago fica **só** no Supabase (segredo `MP_ACCESS_TOKEN`), nunca no HTML.

**Tabela:** rode `supabase/vendas.sql` no SQL Editor (depois do `pressel.sql` do repositório da pressel).
A visão `vendas_com_pressel` mostra cada venda com as respostas da pressel, quando a pessoa veio de lá
(a pressel manda o código dela no link: `?d=...`). No fim do `vendas.sql` há consultas prontas: quem pagou, funil e quem não pagou.

Para publicar ou atualizar a função: Supabase → Edge Functions → função `pix` → cole o conteúdo de
`supabase/functions/pix/index.ts` → Deploy. A opção de verificar JWT fica **desligada** (a página chama a função sem chave).

O preço está em `PRECO`, no começo do `index.ts`.

## Pendente

- **Pressel**: apontar o botão final dela para o endereço desta página.

## Rodar local

Dá para abrir o `index.html` direto, mas o ideal é servir a pasta por HTTP — por exemplo, com Node instalado:

```
npx --yes serve .
```

E abra o endereço que aparecer (algo como `http://localhost:3000`).
