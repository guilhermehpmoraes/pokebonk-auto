# Contratos

## Decisão interna

`decidir(tela, configuracao, aleatorio)` em `src/decisao.mjs` aceita `tela.tipo` igual a `build`, `status` ou `powerup`, opções com `id` e campos usados por cada tipo, e ordem de status em `configuracao.status`. Retorna `selecionar` ou `banir` com `id`, `atualizar`, `pular` ou `aguardar` com motivo quando aplicável. Raridade é numérica e crescente.

Uma seleção de build fora do plano inclui `foraDoPlano: true`. O fallback aleatório exige que todos os contadores de banimento, atualização e pulo sejam reconhecidos como inteiros não negativos; contadores ausentes produzem `aguardar` quando são necessários.

Para `tela.tipo` igual a `reliquia`, recebe `opcoes` e `equipadas` com `id`, `raridade` numérica e `status` como lista de atributos, além de `configuracao.status` com a ordem do preset ativo. Com três equipadas, retorna `selecionar` com os IDs da oferta e de `substituir`, ou `dispensar` se não houver melhora. Dados insuficientes produzem `aguardar`.

## Interface externa

`src/adaptador.js` depende, entre outros elementos, de `button.card.offer`, `.bp-badge`, `.kind`, `.rar`, `.typeicon`, imagens de bênção e rótulos portugueses de botões. A disponibilidade de recursos é lida dos contadores e do estado desabilitado. Esses seletores são observados em exemplos fornecidos pelo usuário; não são uma API estável do jogo.

Uma oferta de golpe marcada como `MELHORIA`, com subtítulo `.bd > .sub` iniciado por `Fusão ★`, é considerada melhoria de uma fusão equipada, mesmo sem `.bp-badge`. Ela participa da ordenação por raridade e tipo.

Para relíquias, o adaptador lê `.rl-wrap`, `.rl-sub`, `.rl-card`, `.rl-stats`, `.rl-mine .rl-chip` e `.rl-swap`. Atributos separados por `·` são interpretados individualmente; os não reconhecidos não são adicionados automaticamente ao preset ao aparecerem em relíquias. A passiva não é interpretada. Classes `r0` a `r4` indicam raridade crescente.

Para avaliar kits, `kitPodeSerBanido` recebe o nome, um mapa de kits, a Pokédex e os planos. O adaptador tenta acessar os módulos do próprio jogo e lê as chaves locais `pokebonk.buildPlan.*`; verifica todos os planos encontrados, não somente a tela atual. Se os dados forem ambíguos ou ausentes, se algum plano contiver fusões ou se os módulos não forem compatíveis, retorna ao banimento individual. Fusões bloqueiam o banimento de kit porque seus ingredientes ainda não são verificados.

O painel lê a ordem anterior em `localStorage` sob `pokebonk-auto-select-status` e persiste os presets em `pokebonk-auto-select-perfis`, com `ativo` (índice de 0 a 4) e `perfis` (cinco entradas com `nome` e `ordem`). Não há rotas HTTP, contrato de banco ou variáveis de ambiente próprias implementadas.

Os avisos de itens fora do plano usam `sessionStorage` com a chave `pokebonk-auto-select-fora-da-build`, como lista de objetos com `nome` e `tipo`. Se esse armazenamento estiver indisponível, ficam apenas em memória.

Ao ler as ordens, variações reconhecidas de nomes são unificadas pelo identificador do catálogo; quando aparecem duplicadas, permanece a primeira posição de cada preset.

Os metadados `@updateURL` e `@downloadURL` no script gerado apontam para o arquivo público na `main`; `@version` determina a versão anunciada ao gerenciador de userscripts. O gerador é a fonte desses campos.

Após selecionar um cartão de build, bênção ou item, o adaptador pode repetir o clique no mesmo elemento enquanto a tela permanecer igual, até o limite em `selecionarComTentativa`.

Para interações de passagem, `decidirPickup` recebe o texto português normalizado, sem a tecla de interação, e autoriza os rótulos gratuitos conhecidos e o padrão `libertar [nome] · 30 ₽`. A jaula custa 30 ₽, embora não participe da estratégia de gasto. O adaptador depende de um único `#hud .prompt` visível com `kbd` igual a E e da ausência de `.modal` visível. Eventos de teclado sintéticos dependem do comportamento do jogo e ainda não foram verificados em partida.

`decidirGasto` compara saldo, custo de Pokébola, giro e estimativa do preço médio da loja; `decidirLoteLoja` verifica o saldo e quatro preços e estados de disponibilidade, e pode comparar o lote renovado com as alternativas. O adaptador lê `.wallet` (`data-g`, `.wl-ball em`, `.wl-slots em`, `.wl-shop em`) e `.ht-zone`; o chip da loja é renovação, não o preço dos itens. Na loja usa `.shop-modal`, `.cards > button.card`, `.price`, `.rar`, `.cap`, `.shop-reroll` e `.shop-exit`. Com preços e raridades observados, estima o custo do estoque seguinte antes de renovar e volta a comparar os preços reais após a renovação. Valores abreviados com `k`, `m` ou `b` usam limites conservadores para saldo e preços nos modais. O cassino é identificado por `.sl-cab` e botões em `.actions`; preço e saldo são lidos novamente no próprio modal, em vez de depender da atualização do HUD. Sem dados suficientes, não compra nem gira. HTML fornecido pelo usuário e código público do jogo são referências, não uma API estável.

O botão do Auto Pickup apresenta uma sugestão de `decidirGasto` como Pokébola, cassino, loja ou espera; a sugestão é mantida em memória até ser concluída ou trocada e não bloqueia outras interações pagas. O adaptador acompanha a abertura e fechamento dos modais reconhecidos e a mudança do preço bruto da Pokébola para confirmar a interação. Uma loja concluída fica fora das sugestões por 30 segundos; avisos pagos permanecem bloqueados para reabertura até mudarem ou desaparecerem. Em seus próprios modais, o botão apresenta uma indicação de avaliação. O texto é atualizado apenas quando muda.

A estimativa de loja observada é mantida em memória por até 60 segundos na mesma zona e descartada ao identificar mudança de zona, reinício do relógio da partida ou ausência do HUD. O contador `.sl-led span:nth-child(2) b`, quando disponível, diferencia giros mesmo com valores arredondados iguais. Durante `.sl-cab.spinning`, somente um botão `.actions button` identificado como `Pular animação` é acionado; giros novos aguardam o fim da animação e outra decisão.
