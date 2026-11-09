# Operações

## Distribuição e estado

O artefato `pokebonk-autoselect.user.js` é instalado em um gerenciador de userscripts. O cabeçalho aponta `@updateURL` e `@downloadURL` para o arquivo público na `main` do GitHub. O gerenciador pode consultar atualizações periodicamente quando a configuração estiver habilitada; o intervalo e as confirmações dependem dele. O script instalado antes dessa configuração precisa ser atualizado ou reinstalado uma vez a partir do link do README. A instalação e a atualização automáticas ainda não foram testadas no navegador.

Na versão 0.2.35 o `@name` mudou. Como o gerenciador pode considerá-lo um script diferente, instale a versão atual e desative ou remova a antiga para evitar execução duplicada. Os presets ficam no `localStorage` do site, não no nome do userscript.

| Configuração | Estado |
| --- | --- |
| `pokebonk-auto-select-status` | Ordem anterior, usada como base ao criar presets |
| `pokebonk-auto-select-perfis` | Cinco presets e índice ativo em `localStorage` do site no navegador |
| Estado ativo | Mantido em memória; inicia desligado |
| Variáveis de ambiente | Nenhuma identificada no código |

## Observabilidade, riscos e dívidas

Não há serviço, banco, pipeline de deploy ou telemetria próprios identificados. O script interage com uma partida real e pode consumir recursos. Mudanças no DOM ou no idioma podem impedir o funcionamento. O catálogo de status é parcial; testes reais, latência, compatibilidade entre navegadores e comportamento em todas as telas não foram verificados integralmente.

Uma seleção de cartão ignorada pode ser tentada novamente até três vezes. As ações de consumo de banimento, atualização e pulo não são repetidas automaticamente.

Na escolha de power-ups, o reconhecimento cobre bônus diretos de atributos do catálogo, não todos os efeitos. Itens com efeitos especiais sem atributo reconhecido ficam atrás dos que têm prioridade reconhecida, salvo quando são lendários. A seleção tem teste simulado com cartões fornecidos pelo usuário; a integração precisa de validação em jogo.

Banimento individual usa dois cliques no cartão quando o jogo pede confirmação. O banimento de kit depende da leitura de módulos internos do jogo e dos planos armazenados localmente; por precaução, um plano com fusão impede o banimento automático de kit. A verificação tem tempo limitado e recorre ao banimento individual quando falha. A integração real ainda não foi validada.

O aviso de item fora da build permanece na aba e pode sobreviver ao recarregamento por `sessionStorage`. O botão **Resolvido** remove apenas o aviso, não o item. A remoção por Hypno, o início de outra partida e a aquisição efetiva ainda não são detectados automaticamente; o jogador deve conferir e limpar os avisos quando apropriado.

Bill e Hypno exigem Auto Select e Auto Pickup ligados, além da compilação `mw88813m` e dos dados internos reconhecidos. O script pode esquecer um golpe do plano para destravar os espaços quando o modelo identifica uma sequência possível; o golpe esquecido volta ao nível inicial se for aprendido de novo. As ações têm testes simulados, não confirmação em jogo. A atualização do jogo pode desativá-las até que a compatibilidade seja revista.

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

Confira a posição de Cura em cada preset: em perfis sem a entrada, ela é adicionada após os atributos já salvos. A tela de Alfa com cura tem simulação baseada na imagem fornecida, mas o DOM e o clique em partida ainda precisam ser confirmados.

Confira também Dano de status nos presets: quando ausente, é acrescentado depois das prioridades salvas. A seleção da equipe mostrada com Arcanine foi simulada; ainda precisa ser confirmada em jogo.

Com pickup ativo, uma troca de brilhante reconhecida também liberta automaticamente um dos dois cartões segundo o preset. A comparação foi simulada com os textos de uma imagem; os seletores e o clique precisam de confirmação no jogo.

Com Auto Pickup ativo, a Fenda consome Incenso automaticamente quando liberada pelo jogo. Sua entrada é acionada ao passar perto. O recurso depende do HUD, da tecla padrão C e de métodos internos, que podem mudar em versões futuras.

O pickup também tenta antecipar ondas ao encontrar o aviso reconhecido, usando E. A interação foi simulada e ainda precisa de confirmação em partida.

Os controles e a lista de mapa ficam à esquerda, abaixo da equipe quando ela é identificada. O aviso de itens fora da build aparece mais acima, afastado do inventário; a disposição precisa de confirmação nas resoluções e modos de jogo usados.
