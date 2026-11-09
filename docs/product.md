# Produto

## Problema e vocabulário

Reduzir escolhas repetitivas no PokéBonk. **Plano** é a build marcada no jogo; **status** são atributos oferecidos em bênçãos; **itens** são recompensas apresentadas pelo jogo. O userscript age quando ativado.

## Regras implementadas

Em `src/decisao.mjs`, as opções do plano têm prioridade. O adaptador também considera elegível uma melhoria de fusão já equipada identificada pelo cartão, mesmo sem o selo do plano. Opções novas do plano precedem melhorias; golpes novos precedem vitaminas novas. Com dados de fusão reconhecidos, a seleção de golpes novos usa o planejador para descartar escolhas que bloqueiam a sequência e prioriza as que têm parceiro equipado e receitas mais específicas. Entre melhorias, prioriza-se raridade e, no empate, golpe. Empates de golpes novos são sorteados.

Quando os únicos golpes novos do plano ocupariam um espaço necessário, e não há outra opção planejada ou melhoria, o script tenta banir uma oferta nova fora do plano, atualizar e depois pular. Quando não houver alvo seguro para banimento, passa ao recurso seguinte. Com os recursos indisponíveis e o pickup ligado, pode aprender um desses golpes temporariamente se o modelo indicar que removê-lo no Hypno permitirá continuar. Se não puder comprovar isso, aguarda.

Sem opção do plano, prioriza melhorias de golpes ou vitaminas já adquiridos, mesmo fora do plano, por raridade e, no empate, por golpe. Sem essas melhorias, tenta banir aleatoriamente, atualizar e pular, nessa ordem. Quando todos os recursos acabam, seleciona aleatoriamente uma opção fora do plano. Quando o jogo oferece banir o kit, o adaptador o faz apenas se comprovar que nenhum golpe do kit aparece nos planos disponíveis; caso contrário, confirma o banimento individual.

Essa regra também vale para o ataque inicial: se aparecer como melhoria fora do plano, pode ser escolhido enquanto houver níveis disponíveis. Ele não recebe identificação ou prioridade especial, e continua gerando o aviso de fora da build.

Após uma escolha fora do plano e o cartão deixar a tela, um aviso informa o nome e recomenda a remoção com Hypno. Quando o inventário da partida é reconhecido e permanece estável, o script remove automaticamente o aviso do item que não estiver mais equipado. Dados insuficientes mantêm o aviso.

Com Auto Select e Auto Pickup ligados, o script também tenta identificar ataques equipados fora do plano e avisa para procurar o Hypno. Perto dele, tenta esquecer o ataque errado, ou um ataque do plano cuja retirada comprovadamente destrave uma sequência. Na lição, escolhe uma oferta segura do plano ou guarda a lição para aprender depois. Os avisos desaparecem conforme o inventário reconhecido confirma a ausência dos itens.

Com o Auto Pickup ligado, se um ataque errado bloquear o planejamento completo, o Auto Select pode escolher um ataque planejado que caiba no espaço atual e mantenha uma sequência possível após a remoção do erro no Hypno. Ofertas que mantêm uma sequência sem essa remoção têm preferência quando aparecem na mesma tela.

Com os dois controles ligados e dados reconhecidos, o pickup abre a Máquina do Bill quando existe um par seguro com ambos os ataques no nível 8 ou acima. Ele prioriza fusões prontas e também realiza uniões, respeitando pares do plano e preservando uma sequência possível para as demais operações. Quando há menos de três fusões ou uniões explicitamente planejadas, pode completar os espaços com uniões entre golpes do plano, até o limite de pares disponíveis. O modelo não garante que futuros ataques serão oferecidos pelo jogo.

Se o script não puder avaliar Bill ou Hypno, o botão de pickup mostra o motivo reconhecido. Se nenhum par for seguro e estiver pronto, informa essa condição e aguarda.

Para bênçãos, prioridade configurada vem antes de raridade; a raridade desempata opções do mesmo status. Na escolha de power-ups, qualquer lendário reconhecido vem primeiro, com sorteio entre lendários. Sem lendário, usa o atributo direto mais prioritário do preset ativo e, no empate, a maior raridade; se nenhuma opção tiver atributo reconhecido, usa a maior raridade. Empates restantes são sorteados. Efeitos condicionais e atributos não reconhecidos não entram na comparação. `src/adaptador.js` tenta identificar a tela de item único e clicar em Pegar.

Relíquias usam maior raridade e, em caso de empate, o atributo mais alto no preset de status ativo. Em relíquias com vários atributos, vale o de maior prioridade. Com três espaços cheios, uma oferta substitui a menos prioritária apenas se melhorar a raridade ou, na mesma raridade, a prioridade do atributo. Caso nenhuma oferta melhore o conjunto, o script tenta escolher **Não levar nenhuma**. Atributos ausentes do preset ficam após os configurados; a passiva não entra na comparação.

O painel oferece cinco presets de status com nomes editáveis. Cada preset guarda uma ordem independente; a aba selecionada determina a prioridade usada nas bênçãos. É possível copiar a ordem de outro preset para o ativo, mediante confirmação, preservando o nome do destino. Uma alça e botões movem cada status uma posição ou diretamente ao topo ou ao fim. As configurações ficam salvas no navegador. Na primeira utilização, a ordem anterior é usada como ponto de partida para os cinco presets.

O Auto Pickup tem ativação própria, começa desligado e tenta interagir ao detectar os textos conhecidos de Poké Bola gratuita ou amaldiçoada, Great Ball gratuita, Snorlax, Rock Smash, coleta de Oran Berries, Magnemite, Ovo Pokémon, altar de Gengar, altar de desafio e altar amaldiçoado. O aviso **Chamar o Alfa agora (encerra as ondas)** também é acionado ao passar. O altar amaldiçoado concede um item raro em troca de uma maldição. Os portais do chefe e da próxima zona e interações desconhecidas continuam manuais.

No Rugido de Rhydon, o pickup identifica o aviso inicial e os estágios 1/3 e 2/3 para tentar completar três ativações no total. Cada rugido fortalece o guardião e melhora a recompensa; ao chegar ao limite, o jogo mostra outro aviso que não é acionado pelo script.

Com o Auto Pickup ligado, as Ruínas do Fóssil são acionadas ao passar e o Fóssil de Domo é escolhido na tela reconhecida. Ele concede uma bênção ancestral e reduz permanentemente o HP máximo em 20% na partida. Se o cartão ou seus efeitos não forem reconhecidos, aguarda.

Jaulas com o aviso **Libertar [Pokémon] · [preço] ₽** são acionadas ao passar quando o saldo cobre o valor exibido; o custo varia com a zona. Os avisos de Lançar Poké Bola e Friend Ball também são reconhecidos.

A sugestão prioriza Pokébolas quando há saldo e elas não estão esgotadas na zona; **Trocar sugestão** permite comparar cassino e loja. Os custos estimados por item usam bônus de escolha de 30% para Pokébolas, 0,194 item por giro, retorno de 25% e penalidade de risco de 30% para o cassino. A estimativa da loja começa em 130 ₽ na zona 1, multiplicada por 2,2 por zona, e usa preços observados por até 60 segundos. São heurísticas e não garantem a melhor build.

A sugestão permanece até a interação sugerida ser concluída, mesmo se os custos mudarem no trajeto ou outra opção paga for usada no caminho. **Trocar sugestão** permite escolher outra. Com dados reconhecidos e saldo suficiente, o pickup também interage com Pokébolas, lojas e cassinos encontrados fora da sugestão. Após uma visita, não repete a mesma interação paga enquanto seu aviso continuar próximo, exceto na retomada do cassino após recompensa reconhecida; a loja deixa de ser sugerida por 30 segundos após a saída.

Na loja aberta pelo pickup, compara o custo médio dos itens disponíveis com o da Pokébola e exige saldo para o lote inteiro e a reserva estimada para as Pokébolas restantes. Se viável, compra todos os itens disponíveis; ao acabar, estima o próximo lote usando preços e raridades observados e pode renovar repetidamente. Após renovar, compara os preços reais antes de iniciar as compras. No cassino, compara cada giro com a Pokébola e pode girar repetidamente. O limite heurístico é o dobro do custo estimado por item da Pokébola; ao passar desse limite ou faltar reserva, sai. A seleção de recompensas depende do Auto Select ou do jogador. O pickup tenta retomar o cassino após uma tela reconhecida de recompensa.

A avaliação também aceita lojas com menos de quatro itens exibidos, mantendo as mesmas verificações de preço e reserva.

Para agilizar os giros, o pickup tenta acionar **Pular animação** quando o botão aparece no cassino aberto por ele. O resultado do giro continua sendo processado pelo jogo antes da próxima decisão.

Quando o cassino oferecer um lote de 2 a 10 giros, o pickup pode usá-lo se o custo total preservar a reserva e o custo máximo conservador de um giro respeitar o mesmo limite da estratégia. Caso contrário, avalia o giro individual. O resumo reconhecido é confirmado para continuar ou ver os prêmios.

## Fora do escopo e limitações

Movimentação automática não faz parte do script. O pickup cobre apenas os textos reconhecidos e usa as teclas padrão E e C. A estimativa da loja não sabe o estoque antes de abrir e, sem observação recente, não usa os modificadores reais do preço; só trabalha com zonas normais identificadas. A lista de atributos é parcial e nomes não reconhecidos são acrescentados ao fim. O usuário relatou uma partida sem erros, mas não identificou quais interações ocorreram nela.

O painel de mapa apresenta as categorias e quantidades atuais da mesma lista usada na legenda do jogo; clique nele para recolher ou expandir. Mostra quantas Pokébolas pagas cabem no saldo e uma reserva estimada a partir da curva de preços atual. A reserva cobre as que cabem no saldo atual; não prevê rendimentos nem mudanças de bônus. Se a lista ou a fórmula não puderem ser verificadas, informa a limitação e reserva o preço da próxima bola. A lista não prevê objetos que ainda não foram criados.

Com Auto Pickup ligado, a Friend Ball de Alfa é acionada quando reconhecida. Na tela de equipe cheia, compara os bônus de suporte usando a ordem do preset ativo; substitui o Alfa elegível de menor prioridade somente se o novo for melhor. Em empate mantém os atuais; com dados desconhecidos aguarda. O jogo pode omitir companheiros que não podem ser libertados.

O bônus de cura tem uma prioridade própria, separada de regeneração. Nos presets existentes que ainda não a incluem, Cura é acrescentada após as prioridades já salvas; ajuste sua posição no painel conforme desejado.

Dano de status também possui prioridade própria, separada de chance de status. Presets sem essa prioridade a recebem depois das prioridades salvas.

O bônus `dano em elites` usa a prioridade de dano a elites e chefes na comparação dos companheiros.

Com Auto Pickup ligado, a tela que permite apenas um companheiro brilhante compara os bônus do atual e do novo usando o mesmo preset. Liberta o atual apenas se o bônus do novo tiver prioridade maior; em empate mantém o atual e, com dados desconhecidos, aguarda. A comparação considera o tipo de bônus, não seu valor numérico.

O Auto Fenda possui botão independente e começa desligado. Quando ligado, o script tenta usar Incenso para abrir uma Fenda sempre que o jogo indicar que é permitido; também tenta entrar na Fenda reconhecida ao passar perto dela. A abertura consome Incenso. A movimentação até a entrada continua manual. As chamadas de onda continuam sob controle do Auto Pickup.

O aviso **Chamar a onda 2/6 já**, e outros com números válidos no mesmo formato, é acionado ao passar com o Auto Pickup ligado. Isso antecipa a próxima onda; o funcionamento real ainda precisa ser confirmado na partida.
