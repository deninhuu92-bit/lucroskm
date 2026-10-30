# LucroKM 2.3 — Correção visual dos ícones

Corrige o bug de desalinhamento nos quatro cards de **Indicadores de hoje** mostrado na captura do usuário. O seletor original `.metric-card span` tinha maior especificidade que `.mini-tile` e fazia os quadradinhos perderem o display grid que centraliza seus SVGs. Além disso, remove o ícone duplicado no título.

Não altera dados, cálculos, chaves de armazenamento, ícone de instalação nem manifestação PWA.

**Atualização Vercel:** substituir o projeto pela pasta desta versão e fazer novo deploy. Em aplicativo já instalado, fechar e reabrir após a atualização e recarregar a página (pode ser necessário abrir o site no navegador para forçar o novo cache).
