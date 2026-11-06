# Contratos

## Decisão interna

`decidir(tela, configuracao, aleatorio)` em `src/decisao.mjs` aceita `tela.tipo` igual a `build`, `status` ou `powerup`, opções com `id` e campos usados por cada tipo, e ordem de status em `configuracao.status`. Retorna `selecionar` ou `banir` com `id`, `atualizar`, `pular` ou `aguardar` com motivo quando aplicável. Raridade é numérica e crescente.

Para `tela.tipo` igual a `reliquia`, recebe `opcoes` e `equipadas` com `id`, `raridade` numérica e `dano` booleano. Com três equipadas, retorna `selecionar` com os IDs da oferta e de `substituir`, ou `dispensar` se não houver melhora. Dados insuficientes produzem `aguardar`.

## Interface externa

`src/adaptador.js` depende, entre outros elementos, de `button.card.offer`, `.bp-badge`, `.kind`, `.rar`, `.typeicon`, imagens de bênção e rótulos portugueses de botões. A disponibilidade de recursos é lida dos contadores e do estado desabilitado. Esses seletores são observados em exemplos fornecidos pelo usuário; não são uma API estável do jogo.

Uma oferta de golpe marcada como `MELHORIA`, com subtítulo `.bd > .sub` iniciado por `Fusão ★`, é considerada melhoria de uma fusão equipada, mesmo sem `.bp-badge`. Ela participa da ordenação por raridade e tipo.

Para relíquias, o adaptador lê `.rl-wrap`, `.rl-sub`, `.rl-card`, `.rl-stats`, `.rl-mine .rl-chip` e `.rl-swap`. O bônus de dano é identificado no texto dos atributos, sem interpretar a passiva. Classes `r0` a `r4` indicam raridade crescente.

O painel lê a ordem anterior em `localStorage` sob `pokebonk-auto-select-status` e persiste os presets em `pokebonk-auto-select-perfis`, com `ativo` (índice de 0 a 4) e `perfis` (cinco entradas com `nome` e `ordem`). Não há rotas HTTP, contrato de banco ou variáveis de ambiente próprias implementadas.

Ao ler as ordens, variações reconhecidas de nomes são unificadas pelo identificador do catálogo; quando aparecem duplicadas, permanece a primeira posição de cada preset.

Os metadados `@updateURL` e `@downloadURL` no script gerado apontam para o arquivo público na `main`; `@version` determina a versão anunciada ao gerenciador de userscripts. O gerador é a fonte desses campos.

Após selecionar um cartão de build, bênção ou item, o adaptador pode repetir o clique no mesmo elemento enquanto a tela permanecer igual, até o limite em `selecionarComTentativa`.
