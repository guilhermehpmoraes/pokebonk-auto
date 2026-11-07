# Produto

## Problema e vocabulário

Reduzir escolhas repetitivas no PokéBonk. **Plano** é a build marcada no jogo; **status** são atributos oferecidos em bênçãos; **itens** são recompensas apresentadas pelo jogo. O userscript é um protótipo que age quando ativado.

## Regras implementadas

Em `src/decisao.mjs`, as opções do plano têm prioridade. O adaptador também considera elegível uma melhoria de fusão já equipada identificada pelo cartão, mesmo sem o selo do plano. Opções novas do plano precedem melhorias; golpes novos precedem vitaminas novas. Entre melhorias, prioriza-se raridade e, no empate, golpe. Entre golpes novos há sorteio.

Sem opção do plano, prioriza melhorias de golpes ou vitaminas já adquiridos, mesmo fora do plano, por raridade e, no empate, por golpe. Sem essas melhorias, tenta banir aleatoriamente, atualizar e pular, nessa ordem. Quando todos os recursos acabam, seleciona aleatoriamente uma opção fora do plano. Quando o jogo oferece banir o kit, o adaptador o faz apenas se comprovar que nenhum golpe do kit aparece nos planos disponíveis; caso contrário, confirma o banimento individual.

Essa regra também vale para o ataque inicial: se aparecer como melhoria fora do plano, pode ser escolhido enquanto houver níveis disponíveis. Ele não recebe identificação ou prioridade especial, e continua gerando o aviso de fora da build.

Após uma escolha fora do plano e o cartão deixar a tela, um aviso persistente informa o nome e recomenda conferir a remoção com Hypno. O usuário marca o aviso como resolvido; o script não verifica automaticamente se o item foi removido ou se uma nova partida começou.

Para bênçãos, prioridade configurada vem antes de raridade; a raridade desempata opções do mesmo status. Itens apresentados em conjunto usam maior raridade e sorteio no empate. `src/adaptador.js` tenta identificar a tela de item único e clicar em Pegar.

Relíquias usam maior raridade e, em caso de empate, o atributo mais alto no preset de status ativo. Em relíquias com vários atributos, vale o de maior prioridade. Com três espaços cheios, uma oferta substitui a menos prioritária apenas se melhorar a raridade ou, na mesma raridade, a prioridade do atributo. Caso nenhuma oferta melhore o conjunto, o script tenta escolher **Não levar nenhuma**. Atributos ausentes do preset ficam após os configurados; a passiva não entra na comparação.

O painel oferece cinco presets de status com nomes editáveis. Cada preset guarda uma ordem independente; a aba selecionada determina a prioridade usada nas bênçãos. É possível copiar a ordem de outro preset para o ativo, mediante confirmação, preservando o nome do destino. Uma alça e botões movem cada status uma posição ou diretamente ao topo ou ao fim. As configurações ficam salvas no navegador. Na primeira utilização, a ordem anterior é usada como ponto de partida para os cinco presets.

O Auto Pickup tem ativação própria, começa desligado e tenta interagir ao detectar os textos conhecidos de Poké Bola gratuita ou amaldiçoada, Great Ball gratuita, Snorlax, Rock Smash, coleta de Oran Berries, altar de Gengar e altar de desafio. Portais e interações desconhecidas continuam manuais.

Para gastos, compara custos estimados por item. A Pokébola recebe um bônus de 30% por permitir escolha; o cassino usa 0,194 item por giro e retorno de 25% do preço, médias calculadas sem bônus de sorte, além de penalidade de 30% pelo risco. O preço médio inicial da loja é estimado em 130 ₽ na zona 1, multiplicado por 2,2 por zona. Após observar preços de itens na loja, usa essa estimativa observada também no mapa por até 60 segundos na mesma zona. São heurísticas, não garantia de fortalecer mais a build: sorte, qualidade dos itens, saldo e modificadores reais podem alterar o resultado. As alternativas exibidas no HUD são comparadas antes da interação.

Na loja aberta pelo pickup, os quatro preços e capacidades são conferidos; se o saldo cobrir todos os itens ainda disponíveis, compra o primeiro lote inteiro. Itens vendidos ou já no limite não podem ser comprados. Ao esgotar o lote, decide renovar ou sair: estima o próximo estoque a partir dos preços e raridades observados na loja e soma o custo da renovação na comparação. Sem preços observados, não renova. Como o próximo estoque é desconhecido, ao aparecer um novo lote compara seus preços reais antes de começar a comprá-lo; se ele for competitivo e couber no saldo, compra todos os disponíveis. Se os preços, capacidade ou saldo forem insuficientes ou ambíguos, sai ou aguarda conforme a situação. No cassino aberto pelo pickup, confere o preço atualizado antes de cada giro e sai quando outra opção fica mais vantajosa ou falta saldo. A seleção de recompensas continua dependendo do Auto Select ou do jogador.

## Fora do escopo e limitações

Movimentação automática não faz parte do protótipo. O pickup cobre apenas os textos reconhecidos e exige a tecla padrão E. A estimativa da loja não sabe o estoque antes de abrir e, sem observação recente, não usa os modificadores reais do preço; só trabalha com zonas normais identificadas. A lista de atributos é parcial e nomes não reconhecidos são acrescentados ao fim; o reconhecimento, as interações reais e o desempenho não foram validados de forma completa no jogo.
