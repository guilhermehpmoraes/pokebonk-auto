# Operações

## Distribuição e estado

O artefato `pokebonk-autoselect.user.js` é instalado em um gerenciador de userscripts. O cabeçalho aponta `@updateURL` e `@downloadURL` para o arquivo público na `main` do GitHub. O gerenciador pode consultar atualizações periodicamente quando a configuração estiver habilitada; o intervalo e as confirmações dependem dele. O script instalado antes dessa configuração precisa ser atualizado ou reinstalado uma vez a partir do link do README. A instalação e a atualização automáticas ainda não foram testadas no navegador.

| Configuração | Estado |
| --- | --- |
| `pokebonk-auto-select-status` | Ordem anterior, usada como base ao criar presets |
| `pokebonk-auto-select-perfis` | Cinco presets e índice ativo em `localStorage` do site no navegador |
| Estado ativo | Mantido em memória; inicia desligado |
| Variáveis de ambiente | Nenhuma identificada no código |

## Observabilidade, riscos e dívidas

Não há serviço, banco, pipeline de deploy ou telemetria próprios identificados. O script interage com uma partida real e pode consumir recursos. Mudanças no DOM ou no idioma podem impedir o funcionamento. O catálogo de status é parcial; testes reais, latência, compatibilidade entre navegadores e comportamento em todas as telas não foram verificados integralmente.

Uma seleção de cartão ignorada pode ser tentada novamente até três vezes. As ações de consumo de banimento, atualização e pulo não são repetidas automaticamente.

Banimento individual usa dois cliques no cartão quando o jogo pede confirmação. O banimento de kit depende da leitura de módulos internos do jogo e dos planos armazenados localmente; por precaução, um plano com fusão impede o banimento automático de kit. A verificação tem tempo limitado e recorre ao banimento individual quando falha. A integração real ainda não foi validada.

O aviso de item fora da build permanece na aba e pode sobreviver ao recarregamento por `sessionStorage`. O botão **Resolvido** remove apenas o aviso, não o item. A remoção por Hypno, o início de outra partida e a aquisição efetiva ainda não são detectados automaticamente; o jogador deve conferir e limpar os avisos quando apropriado.

As escolhas e substituições de relíquias têm testes simulados. O HTML real pode mudar; não há confirmação de teste no jogo para essa integração. Substituições afetam a partida atual.

O Auto Pickup inicia desligado independentemente do Auto Select. Ele interage com alguns objetos gratuitos, inclusive os que aumentam a dificuldade, e pode gastar dinheiro automaticamente na Pokébola, na loja e no cassino. Não automatiza portais. A estratégia usa estimativas e não garante a melhor decisão; eventos de teclado, cliques e reconhecimento precisam de teste manual no jogo.
