# ÍCONE OFICIAL LKM — Versão 2.7

Esta versão resolve a persistência do ícone antigo por **novos nomes de arquivo**.

## Instalação no GitHub / Vercel (muito importante)
1. Abra este ZIP: **os arquivos `index.html`, `app.js`, `styles.css` e a pasta `icons` estão na RAIZ do ZIP**, sem pasta externa.
2. No GitHub, vá à raiz do repositório `deninhu92-bit/lucroskm`, na branch `main`.
3. Clique em `Add file` > `Upload files`. Envie **todos os arquivos e as pastas** que estão dentro deste ZIP, não o próprio ZIP.
4. Confirme `Commit changes` e aguarde o Deployment aparecer como `Ready` no Vercel.
5. Abra o site e confirme se a logo aparece grande no topo. Veja se `https://SEU-SITE/icons/lkm-app-192-v27.png` abre a nova imagem.
6. No celular, atualize o site. O ícone já instalado pode continuar antigo porque **Android e iPhone podem guardar o ícone no sistema operacional**, mesmo com novo manifesto. Faça **backup JSON antes** de remover/reinstalar qualquer atalho ou aplicativo.

## O que muda
- `index.html`: a logomarca fornecida fica visível no cabeçalho e no diálogo de instalação.
- `manifest.webmanifest`: ícones exclusivos v2.7 de Android e iPhone.
- `sw.js`: novo cache offline e referências de arquivo; o site antigo não deve esconder as novas imagens quando a atualização for instalada.
- `vercel.json`: cabeçalhos de cache revisados.

**Não limpe os dados do site ou armazenamento do navegador** para trocar o ícone. Seus registros financeiros continuam no `localStorage` do mesmo endereço. A atualização não faz migração nem apaga o histórico.
