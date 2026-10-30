# LucroKM v2.4 — Destaque da Meta do Dia e acessibilidade

Consulte `NOVIDADES_V2.4.md` para as novas funções.

# LucroKM v2.3 — Vercel, PWA e ícones coloridos

Aplicativo para motoristas, sem login e sem dependências externas. Interface responsiva com funcionamento offline após o primeiro carregamento em HTTPS.

## Melhorias
- Ícones PNG 180, 192 e 512 px, ícone adaptável/maskable, manifest e service worker com versão.
- Instalação: botão destacado, suporte ao prompt nativo quando disponível e instruções para Safari no iPhone e Chrome/Edge no Android.
- Jornada sobrevive ao fechamento do navegador e à mudança de dia sem resetar; histórico de jornadas finalizadas e cálculo do tempo por dia local.
- Cálculos por data local (sem UTC), quilômetros, reserva configurável, custo extra opcional por km.
- Entradas editáveis e removíveis, data do lançamento, categorias e observações tratadas como texto, evitando injeção de HTML.
- Relatórios por intervalo, gráfico simples, CSV e impressão/Salvar em PDF do navegador.
- Cadastro de veículo, backup JSON completo e restauração com confirmação.
- Migração automática do estado anterior em `localStorage` no mesmo endereço/origem.

## Publicar na Vercel
1. Suba o CONTEÚDO desta pasta `LucroKM` para um repositório do GitHub (ou selecione `LucroKM` como Root Directory no Vercel).
2. No Vercel: **Framework Preset = Other**, **Build Command vazio**, **Output Directory = .** (raiz selecionada). O projeto é estático.
3. Após publicar, abra o site via HTTPS em um Android (Chrome/Edge) ou iPhone (Safari).
4. Use **Instalar** ou o menu do navegador para adicionar à tela inicial. Abra o novo ícone.
5. Teste com o aparelho sem conexão **depois** de abrir o app online ao menos uma vez.

## Armazenamento e segurança
- Dados permanecem em `localStorage` **no aparelho/navegador atual**; hospedagem Vercel não é banco de dados.
- Use Configurações → **Baixar backup** para guardar seus registros. **Restaurar backup** substitui os dados atuais.
- Atualizações no **mesmo domínio** preservam normalmente o armazenamento local. Mudança de domínio, limpeza do navegador, outro celular ou modo privado NÃO preservam.
- Salvar PDF usa a função **Imprimir / PDF** do sistema, sem gerar PDF via servidor.
- Os custos por km são estimativas, não despesas pagas automaticamente.

## Testar localmente
Na pasta contendo `index.html`: `python -m http.server 8080`, depois `http://localhost:8080`.
A instalação como PWA exige contexto seguro (HTTPS ou localhost).

## Limitações conhecidas
- Não sincroniza dados entre aparelhos nem protege contra perda se o armazenamento do navegador for apagado.
- Para uso comercial multiusuário, será necessário implementar autenticação, sincronização e políticas adequadas de backup.
- Km informados na jornada são contabilizados no dia atual enquanto ela está em andamento e no dia do encerramento após finalizada; a duração é repartida por dia local.
- Para impressão como PDF, use o diálogo de impressão do navegador.

## Ícones coloridos (v2.3)

A interface usa ícones da biblioteca **Font Awesome Free**, em SVG local e com gradientes de cor por categoria para identidade premium e disponibilidade offline. Veja `assets/CREDITOS_ICONES.md` e `assets/FONT-AWESOME-LICENSE.txt` para autoria e licenciamento.

Para atualizar no Vercel, publique esta pasta na raiz do projeto e recarregue o PWA. O service worker v2.3 atualiza o cache, e o armazenamento dos registros não é apagado na atualização.

## Correção 2.3 — Alinhamento dos indicadores
- Corrigida a regra genérica de `span` que anulava o `display: grid` dos quadradinhos de ícone.
- Os SVGs dos cards e relatórios agora ficam centralizados tanto na vertical quanto na horizontal.
- Removido o segundo ícone redundante do título "Indicadores de hoje".
- Revisados respiro e alinhamento dos valores nos quatro cartões.
- CSS versionado e cache do Service Worker atualizado para a nova versão aparecer após publicação.


## Novidades v2.5
- Histórico diário com cartões por data.
- Botão "Ver fechamento" para abrir rapidamente qualquer dia salvo.
- Resumo por dia com lucro, faturamento, km e jornada.
