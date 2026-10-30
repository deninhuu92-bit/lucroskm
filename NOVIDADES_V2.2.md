# LucroKM v2.2 — Melhorias visuais

A partir da versão 2.1 do LucroKM, este pacote traz:

- Ícones reais da biblioteca **Font Awesome Free** com acabamento SVG em gradiente.
- Paleta funcional: receita (verde), combustível (dourado), despesa (coral), veículo/km (azul), relatórios/reserva (violeta), jornada (laranja), instalação (turquesa).
- Ícones renovados no dashboard, cards, botões, barra inferior, configurações, relatórios e histórico.
- Ícones de categorias de despesas, como alimentação, pedágio, estacionamento, lavagem, seguro e manutenção.
- Ícones hospedados localmente e incluídos no cache de PWA, sem dependência de CDN.
- Interface e lógica da jornada preservadas, sem mudar a chave `lucrokm_state` que guarda dados no navegador.
- Instalação na tela inicial segue disponível pelos ícones PWA e botão 'Instalar'.

**Implementação:** arquivos HTML/CSS/JavaScript estáticos, prontos para Vercel.

**Licença:** os SVGs são da biblioteca Font Awesome Free, sob CC BY 4.0. Créditos e licença inclusos em `assets/`.

**Verificação:** sintaxe JavaScript, rotas locais de ícones, integridade XML dos SVGs e lista de recursos no cache foram conferidos. Teste interativo do PWA instalado requer publicação HTTPS e verificação no navegador/dispositivo.
