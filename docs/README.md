# Documentação

O repositório contém um userscript publicado. O usuário relatou uma partida sem erros em que ele e um amigo usaram o script. [Histórico e limitações](history.md).

## Ordem de leitura

| Documento | Conteúdo |
| --- | --- |
| [Produto](product.md) | Objetivo e regras de escolha |
| [Arquitetura](architecture.md) | Componentes e fronteiras |
| [Fluxos](flows.md) | Caminhos de decisão e interação |
| [Contratos](contracts.md) | Formatos internos e dependências do DOM |
| [Padrões](code-standards.md) | Precedentes e práticas do código |
| [Desenvolvimento](development.md) | Geração, testes e Git |
| [Operações](operations.md) | Distribuição, estado e riscos |
| [Histórico](history.md) | Estado e limitações |
| [Decisões](decisions/README.md) | Índice de ADRs |

## Mapa do repositório

| Caminho | Responsabilidade |
| --- | --- |
| `src/decisao.mjs` | Regras puras de escolha |
| `src/kits.mjs` | Verificação conservadora de kits contra os planos |
| `src/adaptador.js` | DOM, configuração, painel e ações |
| `scripts/gerar-userscript.mjs` | Montagem do userscript |
| `pokebonk-autoselect.user.js` | Artefato gerado para instalação |
| `tests/` | Testes das regras e simulação de DOM |

## Matriz de manutenção

| Mudança | Revisar |
| --- | --- |
| Prioridade, elegibilidade ou fallback | product, flows, contracts, history |
| DOM, painel ou reconhecimento de tela | architecture, flows, contracts, operations, history |
| Build, arquivos ou testes | architecture, code-standards, development |
| Instalação ou distribuição | README raiz, development, operations, history |
| Decisão arquitetural duradoura | architecture, decisions/README e ADR |
