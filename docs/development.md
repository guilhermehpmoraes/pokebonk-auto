# Desenvolvimento

Os testes de planejamento de fusões e de Bill/Hypno simulam reserva de ingredientes, ocupação de espaços, abertura da máquina, escolha de fusão, remoção de ataque e recusa de dados desconhecidos. Não comprovam as APIs internas nem as interações em partida real.

Os cenários de Bill também cobrem união explícita ou inferida, troca de modo, preservação de ingredientes, prioridade da fusão e rejeição quando o cartão mostra outro par. Os testes não comprovam planos copiados nem cliques na máquina real.

Após a falha relatada diante de Bill, um teste do planejador reproduz uma estrutura equivalente com uma fusão concluída; outro testa uma implementação de `has` que não pertence à classe `Set` do mesmo contexto. Os motivos de espera também têm simulação parcial.

Os cenários de Bill incluem ataques acima do nível 8 depois de outra fusão concluída e um par com ataque abaixo do nível necessário. A integração real ainda requer confirmação.

Os testes de level-up simulam duas fusões prontas, um último espaço reservado, atualização, pulo e escolha temporária quando ambos se esgotam; não confirmam a interação real nem a disponibilidade futura das ofertas.

Os testes de avisos simulam remoção individual, inventário estável, ataques usados em fusões, vitaminas, dados incompletos e ausência do botão manual. Não confirmam o acesso ao inventário na partida real.

O teste de avisos também simula a saída da partida, a ocultação do painel, o retorno e a reconciliação dos itens armazenados.

O teste de Fenda verifica também as posições inferiores dos controles e do mapa e a quebra de texto do Auto Pickup; a disposição visual precisa de confirmação no jogo.

O cenário também verifica banimento individual antes de atualizar, preservação de oferta planejada na mesma tela, mudança de selo, mudança do plano e ausência de alvo seguro. O teste é simulado.

O teste de level-up inclui um ataque fora do plano e três espaços livres, com três fusões planejadas, e verifica que a escolha pode prosseguir quando a remoção futura do erro torna a sequência viável. Não comprova a integração em cooperativo ou na Fenda.

O teste de Alfa inclui a equipe com Arcanine e dano de status mostrada pelo usuário, em ordens diferentes de prioridade; a interação real ainda requer confirmação.

Também simula a equipe de cinco cartões com Hitmontop e a troca de brilhantes com Tyrogue, usando `dano em elites` e verificando a escolha conforme o preset.

## Ambiente

Node.js com suporte a módulos ES e `node:test`. Versão mínima e matriz de navegadores: não verificadas. O projeto não possui manifesto de dependências ou processo de instalação próprio.

## Geração e verificações

```sh
node scripts/gerar-userscript.mjs
node --check pokebonk-autoselect.user.js
node --test tests/*.test.mjs
```

O gerador escreve `pokebonk-autoselect.user.js`. Os testes em `tests/decisao.test.mjs` cobrem decisões e `tests/integracao.test.mjs` simula cenários de bênção e itens; a simulação não substitui testes no navegador e no jogo. O usuário relatou uma partida sem erros com um amigo, sem especificar os fluxos exercitados.

`tests/pickup.test.mjs` verifica decisões de custo, o indicador de preferência, reconhecimento e simulações do teclado, da loja e do cassino; não comprova que o jogo aceita os eventos nem que a estratégia seja ótima.

Os cenários da loja incluem saldo abreviado, lote parcialmente vendido e itens caros com renovação barata.

Um cenário reproduz uma loja com três cartões e verifica a compra do lote quando viável e a recusa quando o custo supera o limite.

Os cenários do cassino incluem saldo abreviado, clique ignorado, botão de pular animação, contador de giros e mudança de preferência após uma loja cara observada.

O teste de lote do cassino cobre reserva, limite conservador por giro e um resumo simulado que leva aos prêmios. Não confirma a integração em partida.

Os cenários de pickup também incluem sugestão estável durante o trajeto, troca manual, interações pagas fora da sugestão e prevenção de reabertura da loja.

Os testes de preços incluem o aviso de 14498 ₽ com HUD abreviado em 14.4k, além de dados ausentes, divergentes e saldo insuficiente.

Os cenários do Rugido de Rhydon cobrem os avisos 0, 1/3, 2/3 e esgotado, além de cliques ignorados e limite de tentativas.

Ao mudar o script, incremente `@version` em `scripts/gerar-userscript.mjs`, gere o arquivo e inclua-o no commit. O gerenciador usa o endereço configurado no cabeçalho para consultar versões publicadas na `main`.

## Git

Use o WSL para operações Git. Este repositório trabalha diretamente na branch `main`, sem Gitflow. Depois de verificar cada alteração, faça commit e envie a `main` ao GitHub. A convenção de commits segue a skill global `commit-message` quando aplicável.

Os testes simulam lotes renovados repetidamente, reserva para Pokébola e retorno ao cassino após uma tela de recompensa reconhecida. Esses cenários não substituem validação em jogo.

`tests/mapa.test.mjs` simula captura da instância, contagem e atualização; `tests/alfa.test.mjs` cobre prioridade, empate, cura e dados desconhecidos. `pickup.test.mjs` cobre prêmio de item único após intervalo, jaula com saldo insuficiente e projeção de custo. A simulação não comprova compatibilidade com o módulo real do jogo.

O teste de mapa também simula a ausência do registro do módulo para a build conhecida, captura pela consulta de preço e descarte de instância encerrada. A captura no navegador real continua sem confirmação.

Os testes simulam captura após adição antes da atribuição da instância e carregamento do catálogo de vitaminas sem registro de recurso. Não reproduzem uma sessão cooperativa real.

`tests/fenda.test.mjs` simula controle independente iniciado desligado, disponibilidade, bloqueios, intervalo entre pressionamentos e entrada na Fenda, inclusive com o pickup ligado e desligado. Não comprova a integração com a partida real.

O teste também simula a ausência de carteira e instância interna, a tentativa pelo HUD pronto, o intervalo maior, modal aberto e a distinção entre entrada de Fenda e portal. Não comprova o resultado dos eventos no jogo.

O mesmo teste simula chamadas de ondas sucessivas e o pickup desligado; `tests/pickup.test.mjs` cobre o formato e contagens inválidas.

`tests/fossil.test.mjs` simula a abertura das ruínas e a seleção do Domo, inclusive dados ambíguos e botão desabilitado; não comprova a integração em jogo.

`tests/alfa.test.mjs` também simula a comparação de dois brilhantes, empate e dados ambíguos com Auto Pickup ligado ou desligado. A tela real de brilhante ainda não foi validada.

`tests/decisao.test.mjs` e `tests/integracao.test.mjs` verificam a precedência de lendários e a ordem de atributos e raridade em power-ups, incluindo os cartões fornecidos pelo usuário. Isso não substitui teste em jogo.

O teste de item único simula clique ignorado, limite de tentativas e outro prêmio igual com botão novo. Não confirma o DOM nem os cliques no jogo.

O teste de brilhantes simula Seel e Jolteon com `vel. de ataque` nas duas ordens de prioridade; o HTML e o clique real ainda precisam de confirmação.
