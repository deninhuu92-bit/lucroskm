# LucroKM v2.4 — Meta e fontes ajustáveis

- **Meta do Dia:** cartão independente em destaque com lucro acumulado, objetivo definido, valor restante, percentual e barra de progresso. Botão **Ajustar meta** abre diretamente o campo correto. Quando a meta é alcançada, há confirmação visual em verde.
- **Fonte ajustável:** botão Aa no topo abre as configurações. Use A− / A+ para escolher 100%, 112%, 125% ou 140%. A preferência é salva com os dados locais e incluída no backup. O aplicativo inteiro escala a tipografia — inclusive formulários, histórico, relatórios e menu.
- **Layout responsivo:** valores e campos adaptam-se ao tamanho da tela; em fontes maiores, KPIs e Meta do Dia reorganizam-se.
- **PWA/Vercel:** versão do cache atualizada para 2.4, mantendo a instalação e os ícones locais.

## Publicação
Extraia o ZIP na raiz do repositório usado no Vercel e publique novamente no mesmo projeto/domínio. Os registros locais existentes são preservados porque a chave de armazenamento `lucrokm_state` não mudou. Ao restaurar backup antigo, a preferência de fontes volta ao padrão 100%.
