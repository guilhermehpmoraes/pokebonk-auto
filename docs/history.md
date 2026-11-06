# Histórico

## 2026-11-06

Protótipo desenvolvido para automatizar escolhas de build, bênçãos e itens. Inclui painel de prioridades, banimento seguido de atualização ou pulo, geração do userscript e testes locais. O arquivo gerado declara versão `0.2.2` em `scripts/gerar-userscript.mjs`.

O repositório foi publicado inicialmente com Gitflow e depois passou a trabalhar diretamente na `main`, por decisão do mantenedor.

## Estado atual

O código existe no repositório local. Os testes simulados verificam regras e um cenário de bênção; não comprovam a integração completa com o jogo.

## Ainda não lançado

Os metadados para atualizações pelo GitHub foram adicionados, mas o fluxo automático no Tampermonkey ainda não foi verificado. Não há release ou pipeline de entrega confirmados.

## Limitações conhecidas

O usuário relatou telas de bênção sem seleção em versões anteriores. Um ajuste no agendamento foi adicionado e testado em simulação; sua eficácia em jogo permanece não verificada. A lista completa de status, a captura de item único e o desempenho de cerca de um segundo ainda precisam de validação em jogo.

O usuário também relatou uma tela de nível sem seleção. O adaptador passou a repetir cliques de seleção ignorados de forma limitada; a correção ainda precisa ser testada no jogo.
