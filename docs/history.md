# Histórico

## 2026-11-06

Protótipo desenvolvido para automatizar escolhas de build, bênçãos e itens. Inclui painel de prioridades, banimento seguido de atualização ou pulo, geração do userscript e testes locais. O arquivo gerado declara versão `0.2.25` em `scripts/gerar-userscript.mjs`.

O repositório foi publicado inicialmente com Gitflow e depois passou a trabalhar diretamente na `main`, por decisão do mantenedor.

## Estado atual

O código existe no repositório local. Os testes simulados verificam regras e um cenário de bênção; não comprovam a integração completa com o jogo.

## Ainda não lançado

Os metadados para atualizações pelo GitHub foram adicionados, mas o fluxo automático no Tampermonkey ainda não foi verificado. Não há release ou pipeline de entrega confirmados.

## Limitações conhecidas

O usuário relatou telas de bênção sem seleção em versões anteriores. Um ajuste no agendamento foi adicionado e testado em simulação; sua eficácia em jogo permanece não verificada. A lista completa de status, a captura de item único e o desempenho de cerca de um segundo ainda precisam de validação em jogo.

O usuário também relatou uma tela de nível sem seleção. O adaptador passou a repetir cliques de seleção ignorados de forma limitada; a correção ainda precisa ser testada no jogo.

O usuário relatou falha ao arrastar prioridades; o painel passou a usar movimentos de ponteiro e recebeu botões para mover ao topo ou ao fim. O usuário confirmou que os controles funcionaram no Firefox.

Foram adicionados cinco presets de prioridade com nomes editáveis, seleção e ordens independentes. A migração e a persistência têm teste simulado; ainda não foram verificadas no Firefox.

Uma variação do nome de dano a elites e chefes era cadastrada duas vezes. O reconhecimento e a leitura dos presets passaram a unificá-la, preservando a primeira posição; a correção ainda precisa de confirmação no jogo.

Foi adicionada a cópia de ordem entre presets, com confirmação antes de substituir o destino. O fluxo foi testado em simulação e ainda precisa de confirmação no Firefox.

O usuário relatou que uma melhoria de fusão equipada aparecia sem o selo do plano e era ignorada. O adaptador passou a tratá-la como golpe elegível; a correção ainda precisa de confirmação no jogo.

Foi adicionada seleção de relíquias por raridade e bônus de dano, com comparação para substituição ou descarte. Há testes simulados; a integração ainda precisa de confirmação no jogo.

A comparação de relíquias passou a usar a prioridade de status do preset ativo para desempatar raridades, considerando o melhor atributo quando houver vários. A integração segue aguardando validação em jogo.

Uma captura mostrou que o banimento individual exige confirmação no mesmo cartão. O adaptador passou a confirmar seleções que ele próprio iniciou e a tentar banir kits quando a verificação conservadora dos planos permite. Ambos os fluxos precisam de confirmação em jogo.

O fallback passou a melhorar itens já possuídos fora da build antes de gastar recursos e a escolher aleatoriamente quando eles se esgotarem. Avisos persistentes pedem conferência e podem ser marcados como resolvidos. Os fluxos têm testes simulados e precisam de validação no jogo.

Foram adicionados testes para o ataque inicial fora da build, confirmando que a lógica existente escolhe sua melhoria depois das opções do plano. O jogo real ainda precisa ser testado.

Foi adicionado um primeiro estágio do Auto Pickup para alguns rótulos gratuitos, com controle independente e desligado ao iniciar. Naquele estágio, a comparação entre gastos e a automação da loja e do cassino ainda não haviam sido implementadas.

A etapa seguinte adicionou uma estimativa para comparar Pokébola, cassino e loja, além de acompanhamento de lotes e giros. As probabilidades e custos de referência foram examinados no código público do jogo; HTML da carteira e das telas foi fornecido pelo usuário. A estratégia é aproximada, tem testes simulados e ainda não foi validada em jogo.

O botão do Auto Pickup passou a mostrar a opção paga preferida ou a espera por dados e saldo. A atualização tem teste simulado e ainda precisa de confirmação em jogo.

O aviso `Rock Smash`, fornecido pelo usuário, foi adicionado às interações gratuitas reconhecidas. A interação tem teste simulado e ainda precisa de confirmação em jogo.

O aviso `Coletar Oran Berries`, fornecido pelo usuário, também foi adicionado às interações gratuitas reconhecidas e tem teste simulado; ainda precisa de confirmação em jogo.

O usuário relatou uma loja que parou depois de uma compra, com saldo exibido como `67.0k`, e outra com itens caros apesar da renovação barata. O adaptador passou a interpretar valores abreviados de forma conservadora; conclui o primeiro lote disponível antes de avaliar a renovação, usa preços e raridades observados nessa avaliação e confere o novo lote antes de comprá-lo. Cenários reproduzidos em testes simulados; a correção ainda precisa de confirmação em jogo.

O usuário relatou que o cassino ficou sem girar, com `19.5k` de saldo e giro de 34 ₽. A leitura de saldo abreviado já havia sido adicionada na versão anterior, mas não há confirmação de qual versão estava instalada no relato. Foram adicionadas tentativas limitadas para cliques ignorados e uso temporário dos custos observados na loja; o cenário foi simulado e ainda precisa de confirmação em jogo.

Foi adicionada a tentativa de acionar o botão **Pular animação** nos giros do cassino. O fluxo foi testado em simulação e ainda precisa de confirmação no jogo.

O aviso do Magnemite fornecido pelo usuário foi incluído entre as interações gratuitas, com teste simulado; ainda precisa de confirmação em jogo.

Após relato de sugestões mudando no trajeto e da loja sendo sugerida repetidamente, a sugestão passou a ser mantida até a interação correspondente ou troca manual. A pedido do usuário, interações pagas fora da sugestão também são tentadas. Há testes simulados para o trajeto, a loja e o cassino; a integração precisa de confirmação em jogo.

O aviso de jaula por 30 ₽ fornecido pelo usuário foi incluído como interação de passagem para qualquer nome de Pokémon. Há testes simulados; a interação ainda precisa de confirmação no jogo.

Os avisos do Rugido de Rhydon e do altar amaldiçoado fornecidos pelo usuário foram incluídos no Auto Pickup. Os estágios subsequentes e o limite do Rugido foram consultados no código público do jogo. Ambos têm testes simulados e ainda precisam de confirmação em jogo.

O aviso de coleta do Ovo Pokémon fornecido pelo usuário foi incluído no Auto Pickup, com contagem variável de derrotas e teste simulado. Ainda precisa de confirmação no jogo.

O usuário relatou que uma Pokébola deixou de ser aberta com aviso de 14498 ₽ e HUD de 14.4k. A comparação anterior tratava o valor abreviado como 14400; o adaptador passou a usar o preço bruto da carteira, com fallback apenas para valor não abreviado. O cenário tem teste simulado e ainda precisa de confirmação em jogo.

A estratégia passou a priorizar Pokébolas e reservar o preço de uma próxima ao avaliar lotes e giros, com repetição até o limite heurístico de custo. A retomada após recompensa reconhecida tem teste simulado, mas precisa de validação no jogo; não há contagem automática das Pokébolas restantes.
