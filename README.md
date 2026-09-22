# site-vendas-ceobiblico

Site de vendas do CEOBiblico.ai — programa de Windows que manda um versículo por dia.

## Arquivos

- `index.html` — página de vendas: vídeo (VSL), telas do app e botão de compra.
- `assets/` — logo, fonte Inter (licença em `assets/OFL.txt`), capa do vídeo e as capturas do app.

A pressel (as 4 perguntas) fica em outro repositório: `site-pressel-ceobiblico`.

## Pendente

- **Link do checkout**: os botões `ADQUIRIR CHAVE DE ACESSO` em `index.html` ainda apontam para `#checkout`. Trocar pelo link do Mercado Pago depois que a conta estiver configurada.
- **Pressel**: apontar o botão final dela para o endereço desta página.

## Rodar local

O vídeo do YouTube não toca abrindo o arquivo por duplo clique (`file://` dá erro 153).
Sirva a pasta por HTTP — por exemplo, com Node instalado:

```
npx --yes serve .
```

E abra o endereço que aparecer (algo como `http://localhost:3000`).
