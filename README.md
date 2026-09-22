# site-vendas-ceobiblico

Site de vendas do CEOBiblico.ai — programa de Windows que manda um versículo por dia.

## Arquivos

- `index.html` — página de vendas: vídeo (VSL), telas do app e botão de compra.
- `pressel.html` — pressel provisória; vai ser trocada pela versão com as perguntas.
- `assets/` — logo, fonte Inter (licença em `assets/OFL.txt`), capa do vídeo e as capturas do app.

## Pendente

- **Link do checkout**: os botões `ADQUIRIR CHAVE DE ACESSO` em `index.html` ainda apontam para `#checkout`. Trocar pelo link do Mercado Pago depois que a conta estiver configurada.
- **Pressel**: substituir `pressel.html` pela versão com as perguntas e apontar o botão dela para `index.html`.

## Rodar local

O vídeo do YouTube não toca abrindo o arquivo por duplo clique (`file://` dá erro 153).
Sirva a pasta por HTTP — por exemplo, com Node instalado:

```
npx --yes serve .
```

E abra o endereço que aparecer (algo como `http://localhost:3000`).
