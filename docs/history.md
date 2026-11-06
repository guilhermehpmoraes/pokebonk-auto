# Histórico

## 2026-11-06

Protótipo desenvolvido para automatizar escolhas de build, bênçãos e itens. Inclui painel de prioridades, banimento seguido de atualização ou pulo, geração do userscript e testes locais. O arquivo gerado declara versão `0.2.8` em `scripts/gerar-userscript.mjs`.

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
