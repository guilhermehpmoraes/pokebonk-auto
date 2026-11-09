# Operações

## Distribuição e estado

O artefato `pokebonk-autoselect.user.js` é instalado em um gerenciador de userscripts. O cabeçalho aponta `@updateURL` e `@downloadURL` para o arquivo público na `main` do GitHub. O gerenciador pode consultar atualizações periodicamente quando a configuração estiver habilitada; o intervalo e as confirmações dependem dele. O script instalado antes dessa configuração precisa ser atualizado ou reinstalado uma vez a partir do link do README. A instalação e a atualização automáticas ainda não foram testadas no navegador.

Na versão 0.2.35 o `@name` mudou. Como o gerenciador pode considerá-lo um script diferente, instale a versão atual e desative ou remova a antiga para evitar execução duplicada. Os presets ficam no `localStorage` do site, não no nome do userscript.

| Configuração | Estado |
| --- | --- |
| `pokebonk-auto-select-status` | Ordem anterior, usada como base ao criar presets |
| `pokebonk-auto-select-perfis` | Cinco presets e índice ativo em `localStorage` do site no navegador |
| Estado ativo | Mantido em memória; inicia desligado |
| Auto Fenda | Mantido em memória, independente do pickup e inicia desligado |
| Variáveis de ambiente | Nenhuma identificada no código |

## Observabilidade, riscos e dívidas

Não há serviço, banco, pipeline de deploy ou telemetria próprios identificados. O script interage com uma partida real e pode consumir recursos. Mudanças no DOM ou no idioma podem impedir o funcionamento. O catálogo de status é parcial; testes reais, latência, compatibilidade entre navegadores e comportamento em todas as telas não foram verificados integralmente.

Uma seleção de cartão ignorada pode ser tentada novamente até três vezes. As ações de consumo de banimento, atualização e pulo não são repetidas automaticamente.

Na escolha de power-ups, o reconhecimento cobre bônus diretos de atributos do catálogo, não todos os efeitos. Itens com efeitos especiais sem atributo reconhecido ficam atrás dos que têm prioridade reconhecida, salvo quando são lendários. A seleção tem teste simulado com cartões fornecidos pelo usuário; a integração precisa de validação em jogo.

Banimento individual usa dois cliques no cartão quando o jogo pede confirmação. O banimento de kit depende da leitura de módulos internos do jogo e dos planos armazenados localmente; por precaução, um plano com fusão impede o banimento automático de kit. A verificação tem tempo limitado e recorre ao banimento individual quando falha. A integração real ainda não foi validada.

Os avisos de itens fora da build podem sobreviver ao recarregamento por `sessionStorage`; não há botão de limpeza manual. O script tenta removê-los quando o inventário estável confirma a ausência dos itens. A leitura depende da instância e da compilação reconhecidas; se ela falhar, os avisos permanecem. Ingredientes de fusões e ataques unidos são considerados presentes. A sincronização ainda precisa de confirmação em jogo.

Os avisos ficam ocultos quando a carteira do HUD não está visível, por exemplo na sala cooperativa. Ocultar não os apaga; eles podem reaparecer até que o inventário da partida seja reconhecido.

Bill e Hypno exigem Auto Select e Auto Pickup ligados, além da compilação `mw88813m` e dos dados internos reconhecidos. O script pode esquecer um golpe do plano para destravar os espaços quando o modelo identifica uma sequência possível; o golpe esquecido volta ao nível inicial se for aprendido de novo. As ações têm testes simulados, não confirmação em jogo. A atualização do jogo pode desativá-las até que a compatibilidade seja revista.

Quando não houver banimento elegível e atualização e pulo estiverem esgotados, um golpe do plano pode ser escolhido temporariamente e precisar ser esquecido no Hypno para liberar espaço. O jogador precisa ir até o Hypno; a simulação de sequência não garante que o jogo oferecerá novamente o golpe ou seus parceiros.

Uma escolha planejada também pode depender de remover posteriormente um ataque fora do plano. O jogador precisa levar o personagem ao Hypno; sem essa remoção, a sequência calculada pode não caber nos espaços disponíveis.

Na proximidade de Bill ou Hypno, confira o texto do botão de pickup se a interação não ocorrer. O motivo é resumido e pode indicar ausência de dados, incompatibilidade, plano bloqueado ou ausência de par seguro. Não prova se o clique seria aceito pelo jogo.

A partir da 0.2.42, ataques acima do nível 8 também passam na conferência de prontidão de Bill. A mudança tem teste simulado e ainda precisa de confirmação na partida relatada.

As escolhas e substituições de relíquias têm testes simulados. O HTML real pode mudar; não há confirmação de teste no jogo para essa integração. Substituições afetam a partida atual.

O Auto Pickup inicia desligado independentemente do Auto Select. Ele interage com alguns objetos gratuitos, inclusive os que aumentam a dificuldade, e pode gastar dinheiro automaticamente em jaulas pelo preço exibido, Pokébolas, lojas e cassinos. Não automatiza portais. A estratégia usa estimativas e não garante a melhor decisão; eventos de teclado, cliques e reconhecimento precisam de teste manual no jogo.

O altar amaldiçoado adiciona uma maldição em troca de um item raro. O Rugido de Rhydon pode ser ativado até o limite exibido de três, fortalecendo o guardião e sua escolta em troca de Great Balls extras. Ambos têm testes simulados e precisam de confirmação no jogo.

As Ruínas do Fóssil são acionadas pelo pickup e o Domo selecionado automaticamente quando reconhecido, sacrificando 20% do HP máximo pelo resto da partida. O fluxo tem teste simulado e precisa de confirmação em jogo.

O botão sugere Pokébola enquanto houver saldo; **Trocar sugestão** permite outra opção. Ao encontrar a loja ou o cassino, avalia seus custos mesmo fora da sugestão, reserva o custo estimado das Pokébolas restantes que cabem no saldo e repete compras ou giros enquanto viáveis. A projeção não antecipa ganhos futuros nem mudanças de bônus, e usa uma única Pokébola como reserva quando faltam dados verificáveis.

Quando o preço no HUD estiver abreviado, a abertura de Pokébolas e a entrada no cassino dependem do preço bruto em `data-k` para conferir o aviso. Sem esse dado, o pickup aguarda em vez de adivinhar o preço.

Na loja, o script compra os itens disponíveis do primeiro lote quando o reconhece e o saldo o cobre. Antes de renovar, estima o custo do próximo estoque pelos preços e raridades observados, além do preço da renovação; volta a comparar os preços reais depois de renovar. A estimativa não antecipa quais itens aparecerão e ainda precisa de confirmação no jogo.

O cassino tenta novamente cliques ignorados até três vezes por estado e tenta pular animações até três vezes. Ao identificar uma tela de recompensa, tenta voltar ao cassino após a escolha. Isso depende do DOM e ainda precisa de confirmação em jogo.

O lote do cassino compromete o preço inteiro antes dos resultados e não reavalia cada giro intermediário; portanto prêmios, alterações na partida e mudanças futuras da estratégia só são consideradas após o resumo. A aprovação usa um teto conservador por giro e pode preferir um giro individual mesmo quando o lote seria viável. Lotes e processamento de recompensas precisam de confirmação em jogo.

O painel de mapa pode ser recolhido clicando nele; mostra dados mesmo com o Auto Pickup desligado. Ele depende de uma classe interna e pode deixar de funcionar após uma atualização do jogo. A seleção de Alfa libera automaticamente um dos cartões elegíveis se o pickup estiver ligado; ao não reconhecer o bônus ou a tela, aguarda.

Na build `mw88813m`, o script pode descobrir o módulo por uma URL conhecida quando o navegador não mantém seu registro de recurso. A captura também observa o cálculo de preço; essa alternativa requer confirmação em partida.

Confira a posição de Cura em cada preset: em perfis sem a entrada, ela é adicionada após os atributos já salvos. A tela de Alfa com cura tem simulação baseada na imagem fornecida, mas o DOM e o clique em partida ainda precisam ser confirmados.

Confira também Dano de status nos presets: quando ausente, é acrescentado depois das prioridades salvas. A seleção da equipe mostrada com Arcanine foi simulada; ainda precisa ser confirmada em jogo.

Com pickup ativo, uma troca de brilhante reconhecida também liberta automaticamente um dos dois cartões segundo o preset. A comparação foi simulada com os textos de uma imagem; os seletores e o clique precisam de confirmação no jogo.

Com Auto Fenda ativo, a abertura consome Incenso automaticamente quando liberada pelo jogo. Sua entrada é acionada ao passar perto. O recurso depende do HUD, da tecla padrão C e de métodos internos, que podem mudar em versões futuras. O botão inicia desligado e não depende do Auto Pickup.

Na falta da instância interna, o script tenta usar o HUD pronto e reconhece apenas o aviso português específico de entrada; o jogo ainda pode bloquear a ação. No cooperativo, a Fenda de equipe é combatida no mapa, sem entrada solo.

O pickup também tenta antecipar ondas ao encontrar o aviso reconhecido, usando E. A interação foi simulada e ainda precisa de confirmação em partida.

Os controles ficam na faixa inferior central, com mapa e avisos logo acima. A disposição precisa de confirmação nas resoluções e modos de jogo usados.
