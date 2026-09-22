# site-vendas-ceobiblico

Site de vendas do CEOBiblico.ai — programa de Windows que manda um versículo por dia.

## Arquivos

- `index.html` — página de vendas: vídeo (VSL), telas do app e botão de compra.
- `assets/` — logo, fonte Inter (licença em `assets/OFL.txt`), capa do vídeo e as capturas do app.

A pressel (as 4 perguntas) fica em outro repositório: `site-pressel-ceobiblico`.

## Pendente

- **Link do checkout**: os botões `ADQUIRIR CHAVE DE ACESSO` em `index.html` ainda apontam para `#checkout`. Trocar pelo link do Mercado Pago depois que a conta estiver configurada.
- **Pressel**: apontar o botão final dela para o endereço desta página.

## Vídeo (VSL)

O arquivo `.mp4` fica no Google Drive e toca na tag `<video>` com controles próprios — sem player
de terceiro, sem título nem logo por cima. O endereço está no `src` do `<video>`, em `index.html`:

```
https://drive.usercontent.google.com/download?id=<ID DO ARQUIVO>&export=download
```

O arquivo precisa estar compartilhado como "qualquer pessoa com o link". Se o Drive passar a
recusar (ele tem cota de downloads), é só trocar esse endereço por outro — Supabase Storage,
por exemplo. O resto da página não muda.

A capa é `assets/video-capa.jpg`.

## Rodar local

Com Node instalado:

```
npx --yes serve .
```

E abra o endereço que aparecer (algo como `http://localhost:3000`).
