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

O Auto Pickup inicia desligado independentemente do Auto Select. Ele interage com alguns objetos gratuitos, inclusive os que aumentam a dificuldade, e pode gastar dinheiro automaticamente em jaulas de 30 ₽, Pokébolas, lojas e cassinos. Não automatiza portais. A estratégia usa estimativas e não garante a melhor decisão; eventos de teclado, cliques e reconhecimento precisam de teste manual no jogo.

O botão informa a alternativa paga sugerida e a mantém no trajeto; **Trocar sugestão** permite escolher outra. O pickup também gasta ao encontrar as outras opções pagas, se as reconhecer e houver saldo. O cassino tenta um giro inicial mesmo quando não é a sugestão, e a loja compra o primeiro lote se o saldo cobrir os itens disponíveis. A indicação reflete uma estimativa, não garante que o objeto esteja próximo ou que a loja tenha itens vantajosos.

Na loja, o script compra os itens disponíveis do primeiro lote quando o reconhece e o saldo o cobre. Antes de renovar, estima o custo do próximo estoque pelos preços e raridades observados, além do preço da renovação; volta a comparar os preços reais depois de renovar. A estimativa não antecipa quais itens aparecerão e ainda precisa de confirmação no jogo.

O cassino tenta novamente cliques de giro ignorados, até três vezes por estado e com intervalo mínimo de 800 ms. Durante a animação, tenta apenas o botão identificado de pular animação, até três vezes com intervalo mínimo de 400 ms. Preços observados na loja são usados temporariamente na comparação, mas podem se tornar desatualizados antes de expirar. O fluxo precisa de teste em jogo.
