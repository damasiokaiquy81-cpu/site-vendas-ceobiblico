# site-vendas-ceobiblico

Site de vendas do CEOBiblico.ai — programa de Windows que manda um versículo por dia.

## Arquivos

- `index.html` — página de vendas: vídeo do CEOBiblico.ai, vídeo do bônus (CEOLocalBiblico.ai) e botão de compra.
  Os vídeos ficam no Supabase Storage (bucket público `Videos`); para trocar, mude o `data-src` de cada `.vsl`.
- `assets/` — logo, favicon e fonte Inter (licença em `assets/OFL.txt`).

A pressel (as 4 perguntas) fica em outro repositório: `site-pressel-ceobiblico`.

## Pendente

- **WhatsApp**: os botões `ADQUIRIR CHAVE DE ACESSO` abrem o WhatsApp com uma mensagem pronta. O número vai na variável `WHATSAPP`, no começo do `<script>` do `index.html`.
- **Pressel**: apontar o botão final dela para o endereço desta página.

## Rodar local

Dá para abrir o `index.html` direto, mas o ideal é servir a pasta por HTTP — por exemplo, com Node instalado:

```
npx --yes serve .
```

E abra o endereço que aparecer (algo como `http://localhost:3000`).
