# Produto

## Problema e vocabulário

Reduzir escolhas repetitivas no PokéBonk. **Plano** é a build marcada no jogo; **status** são atributos oferecidos em bênçãos; **itens** são recompensas apresentadas pelo jogo. O userscript é um protótipo que age quando ativado.

## Regras implementadas

Em `src/decisao.mjs`, só opções do plano participam de escolhas de build. O adaptador também considera elegível uma melhoria de fusão já equipada identificada pelo cartão, mesmo sem o selo do plano. Opções novas precedem melhorias; golpes novos precedem vitaminas novas. Entre melhorias, prioriza-se raridade e, no empate, golpe. Entre golpes novos há sorteio. Sem opção elegível, tenta banir aleatoriamente, atualizar e pular, nessa ordem, quando disponíveis.

Para bênçãos, prioridade configurada vem antes de raridade; a raridade desempata opções do mesmo status. Itens apresentados em conjunto usam maior raridade e sorteio no empate. `src/adaptador.js` tenta identificar a tela de item único e clicar em Pegar.

Relíquias usam maior raridade e, em caso de empate, o atributo mais alto no preset de status ativo. Em relíquias com vários atributos, vale o de maior prioridade. Com três espaços cheios, uma oferta substitui a menos prioritária apenas se melhorar a raridade ou, na mesma raridade, a prioridade do atributo. Caso nenhuma oferta melhore o conjunto, o script tenta escolher **Não levar nenhuma**. Atributos ausentes do preset ficam após os configurados; a passiva não entra na comparação.

O painel oferece cinco presets de status com nomes editáveis. Cada preset guarda uma ordem independente; a aba selecionada determina a prioridade usada nas bênçãos. É possível copiar a ordem de outro preset para o ativo, mediante confirmação, preservando o nome do destino. Uma alça e botões movem cada status uma posição ou diretamente ao topo ou ao fim. As configurações ficam salvas no navegador. Na primeira utilização, a ordem anterior é usada como ponto de partida para os cinco presets.

## Fora do escopo e limitações

Movimentação e coleta automática no mapa não fazem parte do protótipo. A lista de atributos é parcial e nomes não reconhecidos são acrescentados ao fim; o reconhecimento, as interações reais e o desempenho não foram validados de forma completa no jogo.
