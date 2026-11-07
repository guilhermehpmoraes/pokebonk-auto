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

O Auto Pickup inicia desligado independentemente do Auto Select. Ele interage com alguns objetos gratuitos, inclusive os que aumentam a dificuldade, e pode gastar dinheiro automaticamente em jaulas pelo preço exibido, Pokébolas, lojas e cassinos. Não automatiza portais. A estratégia usa estimativas e não garante a melhor decisão; eventos de teclado, cliques e reconhecimento precisam de teste manual no jogo.

O altar amaldiçoado adiciona uma maldição em troca de um item raro. O Rugido de Rhydon pode ser ativado até o limite exibido de três, fortalecendo o guardião e sua escolta em troca de Great Balls extras. Ambos têm testes simulados e precisam de confirmação no jogo.

O botão sugere Pokébola enquanto houver saldo; **Trocar sugestão** permite outra opção. Ao encontrar a loja ou o cassino, avalia seus custos mesmo fora da sugestão, reserva o custo estimado das Pokébolas restantes que cabem no saldo e repete compras ou giros enquanto viáveis. A projeção não antecipa ganhos futuros nem mudanças de bônus, e usa uma única Pokébola como reserva quando faltam dados verificáveis.

Quando o preço no HUD estiver abreviado, a abertura de Pokébolas e a entrada no cassino dependem do preço bruto em `data-k` para conferir o aviso. Sem esse dado, o pickup aguarda em vez de adivinhar o preço.

Na loja, o script compra os itens disponíveis do primeiro lote quando o reconhece e o saldo o cobre. Antes de renovar, estima o custo do próximo estoque pelos preços e raridades observados, além do preço da renovação; volta a comparar os preços reais depois de renovar. A estimativa não antecipa quais itens aparecerão e ainda precisa de confirmação no jogo.

O cassino tenta novamente cliques ignorados até três vezes por estado e tenta pular animações até três vezes. Ao identificar uma tela de recompensa, tenta voltar ao cassino após a escolha. Isso depende do DOM e ainda precisa de confirmação em jogo.

O painel de mapa pode ser recolhido clicando nele; mostra dados mesmo com o Auto Pickup desligado. Ele depende de uma classe interna e pode deixar de funcionar após uma atualização do jogo. A seleção de Alfa libera automaticamente um dos cartões elegíveis se o pickup estiver ligado; ao não reconhecer o bônus ou a tela, aguarda.
