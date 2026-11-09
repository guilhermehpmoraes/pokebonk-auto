# Desenvolvimento

O teste de planejamento de fusões cobre reserva de ingredientes e ocupação de espaços com dados sintéticos. O planejador ainda não está integrado ao jogo.

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

Os cenários do cassino incluem saldo abreviado, clique ignorado, botão de pular animação, contador de giros e mudança de preferência após uma loja cara observada.

Os cenários de pickup também incluem sugestão estável durante o trajeto, troca manual, interações pagas fora da sugestão e prevenção de reabertura da loja.

Os testes de preços incluem o aviso de 14498 ₽ com HUD abreviado em 14.4k, além de dados ausentes, divergentes e saldo insuficiente.

Os cenários do Rugido de Rhydon cobrem os avisos 0, 1/3, 2/3 e esgotado, além de cliques ignorados e limite de tentativas.

Ao mudar o script, incremente `@version` em `scripts/gerar-userscript.mjs`, gere o arquivo e inclua-o no commit. O gerenciador usa o endereço configurado no cabeçalho para consultar versões publicadas na `main`.

## Git

Use o WSL para operações Git. Este repositório trabalha diretamente na branch `main`, sem Gitflow. Depois de verificar cada alteração, faça commit e envie a `main` ao GitHub. A convenção de commits segue a skill global `commit-message` quando aplicável.

Os testes simulam lotes renovados repetidamente, reserva para Pokébola e retorno ao cassino após uma tela de recompensa reconhecida. Esses cenários não substituem validação em jogo.

`tests/mapa.test.mjs` simula captura da instância, contagem e atualização; `tests/alfa.test.mjs` cobre prioridade, empate, cura e dados desconhecidos. `pickup.test.mjs` cobre prêmio de item único após intervalo, jaula com saldo insuficiente e projeção de custo. A simulação não comprova compatibilidade com o módulo real do jogo.

`tests/fenda.test.mjs` simula disponibilidade, bloqueios, intervalo entre pressionamentos e entrada na Fenda. Não comprova a integração com a partida real.

O mesmo teste simula chamadas de ondas sucessivas e o pickup desligado; `tests/pickup.test.mjs` cobre o formato e contagens inválidas.

`tests/fossil.test.mjs` simula a abertura das ruínas e a seleção do Domo, inclusive dados ambíguos e botão desabilitado; não comprova a integração em jogo.

`tests/alfa.test.mjs` também simula a comparação de dois brilhantes, empate e dados ambíguos com Auto Pickup ligado ou desligado. A tela real de brilhante ainda não foi validada.

`tests/decisao.test.mjs` e `tests/integracao.test.mjs` verificam a precedência de lendários e a ordem de atributos e raridade em power-ups, incluindo os cartões fornecidos pelo usuário. Isso não substitui teste em jogo.
