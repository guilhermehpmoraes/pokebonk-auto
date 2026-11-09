# Contratos

## Decisão interna

`planejarFusoes` recebe identificadores de golpes, equipados e consumidos, fusões concluídas, limite de espaços e receitas com pares possíveis. Retorna aquisições e fusões que mantêm uma sequência possível no modelo, ou `null` quando os dados são inválidos. `golpesParaAbrirEspaco` encontra ataques cuja retirada destravaria uma sequência. O adaptador fornece dados da partida e confirma os níveis; a disponibilidade futura de ofertas não é garantida.

`golpesAposRemoverErrados` calcula opções planejadas considerando a remoção futura dos ataques fora do plano. Só retorna candidatos quando existe um espaço físico livre agora e as contagens de espaços são consistentes. Ao escolher, o adaptador prioriza opções que já funcionam sem essa remoção e recorre às demais somente com o pickup ligado e quando não houver opção direta entre as ofertas.

`decidirSemGolpeSeguro` recebe os contadores de banimento, atualização e pulo e os IDs de alvos de banimento e opções temporárias previamente verificados. Prioriza banimento de alvo elegível, atualização, pulo e, com os recursos indisponíveis, uma opção temporária; contadores necessários desconhecidos produzem espera. O adaptador só considera uma opção temporária com pickup ligado, sem golpes errados e quando `golpesParaAbrirEspaco` comprova que a própria opção pode ser removida para destravar o modelo.

Para Bill e Hypno, o adaptador usa a instância da partida obtida pelo mapa, `planSnap`, `player.moves`, `moveSlots`, `fusions` e `banished`. Na compilação `mw88813m`, usa os exports `Qi` e `Dr` do módulo `menus` para obter definições e combinações dos golpes do plano, verificando as combinações equipadas. Uniões explícitas em `planSnap.links` são pares de identificadores; uniões restantes podem usar pares de golpes planejados quando existir sequência segura. O planejador conta uniões concluídas como um espaço e reserva seus dois golpes. A consulta de pares usa objetos simulados, mas a função do jogo também sorteia um bônus de união. Outras compilações, fusões desconhecidas e dados incompatíveis não ativam a automação. Em Bill, uma fusão exige par, resultado, `.bm-card.fuse` e `.bm-go.fuse`; uma união exige par, `.bm-card.link`, nomes dos dois golpes e `.bm-go.link`. Hypno exige `.hy-modal`, identifica ataques em `.hy-list` e não confirma a remoção de fusões ou ataques unidos. A lição escolhe nomes seguros do plano ou guarda a oferta. Esses contratos dependem do código público e não foram validados na partida.

Ao detectar o aviso de Bill ou Hypno sem dados suficientes, o botão do pickup apresenta um motivo resumido; exceções mostram apenas uma categoria conhecida, sem dados da exceção. Para banimentos, basta existir o método `has`, sem exigir identidade de classe entre contextos JavaScript.

Na tela de level-up, se houver um plano com fusões identificado e a leitura de estado falhar, o botão do pickup ligado mostra o motivo resumido e a seleção aguarda. Quando não há opção segura nem ação disponível, informa a espera ou a necessidade de conferir o ataque no Hypno.

`fusoesProntas` aceita ataques de nível inteiro `>= 8`; níveis menores ou não reconhecidos não autorizam a abertura automática. A regra corresponde à comparação de nível observada na compilação do jogo examinada.

`decidir(tela, configuracao, aleatorio)` em `src/decisao.mjs` aceita `tela.tipo` igual a `build`, `status` ou `powerup`, opções com `id` e campos usados por cada tipo, e ordem de status em `configuracao.status`. Retorna `selecionar` ou `banir` com `id`, `atualizar`, `pular` ou `aguardar` com motivo quando aplicável. Raridade é numérica e crescente.

Para `powerup`, cada opção contém `raridade` e `status` como lista de atributos. Raridade 5 prevalece, com sorteio entre lendários; sem ela, compara a melhor posição de status no preset, seguida da raridade, com sorteio no empate. Status ausentes ficam depois dos reconhecidos. Se não houver lendário reconhecido e uma raridade for desconhecida, aguarda.

Uma seleção de build fora do plano inclui `foraDoPlano: true`. O fallback aleatório exige que todos os contadores de banimento, atualização e pulo sejam reconhecidos como inteiros não negativos; contadores ausentes produzem `aguardar` quando são necessários.

Para `tela.tipo` igual a `reliquia`, recebe `opcoes` e `equipadas` com `id`, `raridade` numérica e `status` como lista de atributos, além de `configuracao.status` com a ordem do preset ativo. Com três equipadas, retorna `selecionar` com os IDs da oferta e de `substituir`, ou `dispensar` se não houver melhora. Dados insuficientes produzem `aguardar`.

## Interface externa

`src/adaptador.js` depende, entre outros elementos, de `button.card.offer`, `.bp-badge`, `.kind`, `.rar`, `.typeicon`, imagens de bênção e rótulos portugueses de botões. A disponibilidade de recursos é lida dos contadores e do estado desabilitado. Esses seletores são observados em exemplos fornecidos pelo usuário; não são uma API estável do jogo.

Uma oferta de golpe marcada como `MELHORIA`, com subtítulo `.bd > .sub` iniciado por `Fusão ★`, é considerada melhoria de uma fusão equipada, mesmo sem `.bp-badge`. Ela participa da ordenação por raridade e tipo.

Para power-ups, o adaptador lê `.bd > p`: identifica somente bônus positivos diretos iniciando a descrição, e bônus adicionais ligados por separadores ou `e`, quando seus nomes constam do catálogo. Não interpreta efeitos condicionais ou especiais. O DOM dos exemplos foi fornecido pelo usuário; a integração precisa de teste em jogo.

Para relíquias, o adaptador lê `.rl-wrap`, `.rl-sub`, `.rl-card`, `.rl-stats`, `.rl-mine .rl-chip` e `.rl-swap`. Atributos separados por `·` são interpretados individualmente; os não reconhecidos não são adicionados automaticamente ao preset ao aparecerem em relíquias. A passiva não é interpretada. Classes `r0` a `r4` indicam raridade crescente.

Para avaliar kits, `kitPodeSerBanido` recebe o nome, um mapa de kits, a Pokédex e os planos. O adaptador tenta acessar os módulos do próprio jogo e lê as chaves locais `pokebonk.buildPlan.*`; verifica todos os planos encontrados, não somente a tela atual. Se os dados forem ambíguos ou ausentes, se algum plano contiver fusões ou se os módulos não forem compatíveis, retorna ao banimento individual. Fusões bloqueiam o banimento de kit porque seus ingredientes ainda não são verificados.

O painel lê a ordem anterior em `localStorage` sob `pokebonk-auto-select-status` e persiste os presets em `pokebonk-auto-select-perfis`, com `ativo` (índice de 0 a 4) e `perfis` (cinco entradas com `nome` e `ordem`). Não há rotas HTTP, contrato de banco ou variáveis de ambiente próprias implementadas.

Os avisos de itens fora do plano usam `sessionStorage` com a chave `pokebonk-auto-select-fora-da-build`, como lista de objetos com `nome` e `tipo`. Se esse armazenamento estiver indisponível, ficam apenas em memória.

O painel só é exibido enquanto a carteira `#hud .wallet` estiver visível. Ao sair da partida, ocultá-lo não apaga os avisos; eles voltam a ser reconciliados quando o inventário for reconhecido.

Para remover avisos, o adaptador exige instância ativa, compilação `mw88813m`, estado de partida reconhecido e inventário estável por pelo menos 500 ms. Confere nomes de `player.moves`, ataques unidos e ingredientes de fusões pelo catálogo `Qi`; vitaminas são comparadas a `player.vitamins` e ao catálogo `ao` do módulo `defineProperty`. Se uma categoria ou seu catálogo não for reconhecido, conserva os avisos dessa categoria. Não altera o inventário nem depende de botão manual. A reconciliação tem testes simulados e ainda precisa de confirmação em jogo.

Na build `mw88813m`, a ausência de registro do recurso `defineProperty` permite tentar a URL conferida desse módulo; outras compilações não ativam a reconciliação.

Ao ler as ordens, variações reconhecidas de nomes são unificadas pelo identificador do catálogo; quando aparecem duplicadas, permanece a primeira posição de cada preset.

O catálogo reconhece `cura` como atributo próprio, distinto de `regeneracao`. Uma entrada salva como `novo: cura` é normalizada para `cura` preservando sua posição; presets sem essa entrada recebem o atributo depois dos itens já salvos.

O catálogo também reconhece `dano status` para textos como `dano de status`, distinto de `sorteio` (chance de status). Uma entrada anterior `novo: dano de status` é normalizada mantendo sua posição; presets sem o atributo o recebem depois das prioridades salvas.

O texto `dano em elites` é reconhecido como `dano elites`, inclusive nos bônus dos companheiros Alfa.

Os metadados `@updateURL` e `@downloadURL` no script gerado apontam para o arquivo público na `main`; `@version` determina a versão anunciada ao gerenciador de userscripts. O gerador é a fonte desses campos.

Após selecionar um cartão de build, bênção ou item, o adaptador pode repetir o clique no mesmo elemento enquanto a tela permanecer igual, até o limite em `selecionarComTentativa`.

Para interações de passagem, `decidirPickup` recebe o texto português normalizado, sem a tecla de interação, e autoriza os rótulos gratuitos conhecidos e o padrão `libertar [nome] · [preço] ₽`, com verificação de saldo. O preço da jaula varia por zona e não participa da comparação principal. O adaptador depende de um único `#hud .prompt` visível com `kbd` igual a E e da ausência de `.modal` visível. Eventos de teclado sintéticos dependem do comportamento do jogo e ainda não foram verificados em partida.

O padrão `pegar o ovo pokemon · choca apos [n] derrotas` aceita uma contagem numérica de derrotas. Avisos de ninho vazio, ovo já carregado ou outros textos não são acionados por essa regra.

Os avisos exatos do altar amaldiçoado e de chamar o Alfa encerrando as ondas também são elegíveis. Para o Rugido de Rhydon, `decidirPickup` retorna `estagioRhydon` 0, 1 ou 2 conforme o texto reconhecido; avisos de limite ou sem correspondência aguardam. O adaptador tenta cada estágio até três vezes, com intervalo mínimo de 800 ms, e passa ao seguinte quando o aviso muda.

O aviso exato das Ruínas do Fóssil é elegível para E. Em um único modal visível, o adaptador lê cartões `button.card.pact.trade`, nome e textos de benefício e custo; `decidirFossil` exige um único Domo com os efeitos conhecidos. O cartão precisa estar visível e habilitado. O reconhecimento depende do HTML fornecido e ainda requer validação em jogo.

`decidirGasto` prioriza a Pokébola e compara as demais opções quando ela é excluída; `gastoViavel` exige saldo para o gasto e a reserva calculada de Pokébolas e limita o custo estimado por item ao dobro do custo de referência da Pokébola. `decidirLoteLoja` verifica de um a quatro preços, disponibilidade, reserva e custo do lote. O adaptador lê `.wallet` (`data-g`, `data-k`, `.wl-ball em`, `.wl-slots em`, `.wl-shop em`) e `.ht-zone`; o chip da loja é renovação, não preço dos itens. Para reconhecer Pokébola e cassino, usa os preços brutos de `data-k` ou o HUD não abreviado. Lê os preços reais da loja em `.shop-modal` e os do cassino em `.sl-cab` e `.actions`. Valores abreviados nos modais usam limites conservadores; sem dados suficientes, aguarda ou sai. O retorno ao cassino exige tela de recompensa reconhecida.

O botão apresenta sugestão mantida até ser concluída ou trocada; não bloqueia interações pagas no caminho. O adaptador acompanha os modais e preços para confirmar interações. Uma loja concluída fica fora das sugestões por 30 segundos. Avisos pagos bloqueiam reabertura até mudar ou desaparecer, exceto ao tentar retomar o cassino após recompensa reconhecida.

A estimativa de loja observada é mantida em memória por até 60 segundos na mesma zona e descartada ao identificar mudança de zona, reinício do relógio da partida ou ausência do HUD. O contador `.sl-led span:nth-child(2) b`, quando disponível, diferencia giros mesmo com valores arredondados iguais. Durante `.sl-cab.spinning`, somente um botão `.actions button` identificado como `Pular animação` é acionado; giros novos aguardam o fim da animação e outra decisão.

O lote depende de um único botão habilitado `.sl-x10` com quantidade de 2 a 10 e preço legível. `loteCassinoViavel` aplica o limite ao custo total e a um teto do último giro, calculado subtraindo do total os preços mínimos dos anteriores; pressupõe preços não decrescentes. O adaptador identifica `.sl-sum`, seu título e uma única ação de continuar ou ver prêmios, tentando até três vezes. A interface é baseada no código público e precisa de validação em jogo.

O painel procura um único módulo `menus` da mesma origem já carregado e uma única classe com `markers`, `chestCost` e `add`; envolve `markers` e `chestCost`, preservando seus retornos para obter a instância ativa. Se não houver registro de recurso, usa a URL conferida da build `mw88813m`; outras builds sem registro aguardam. Rejeita listas ou instâncias inconsistentes. Conta os marcadores retornados, inclusive ainda não descobertos. A projeção só é usada na build `mw6akj2h`, quando o preço bruto da carteira coincide com `chestCost()` e há contagem válida; caso contrário reserva somente a próxima bola. Usa `run.chestsBought` e a curva observada nessa build, considerando bônus atuais fixos. As APIs internas não são estáveis. A tela Alfa exige título, texto de equipe completa, selos, ações e bônus reconhecidos; compara apenas os cartões elegíveis exibidos.

Também observa `add` e, após a construção, captura a instância apenas quando ela é a instância ativa da partida. A observação preserva o retorno original e agrupa verificações pendentes por instância.

A tela de troca de brilhante exige título e aviso reconhecidos, exatamente dois cartões com selos e ações de existente e novo, e bônus presentes no preset. O adaptador usa os mesmos seletores presumidos da tela de Alfa e encaminha os dados para `decidirAlfa`; o HTML da tela de brilhante ainda não foi confirmado.

A abertura e a entrada automáticas exigem o Auto Fenda ligado, independentemente do estado do Auto Pickup. A abertura exige `#hud .inc.ready` visível e a tecla exibida C. Quando há instância de partida, verifica estado `play` e `useBlock()`; no cooperativo consulta a Fenda de equipe. Sem instância, o HUD permite a tentativa e o próprio jogo avalia seus bloqueios. O intervalo entre tentativas é de dois segundos com instância e cinco sem ela. Para entrar na Fenda solo, compara o aviso visível com `entranceLabel()` e verifica `nearEntrance()` e `enterBlock()` quando disponíveis; sem instância exige um aviso português específico de entrada na Fenda. O jogo decide se a entrada está bloqueada.

O aviso de onda segue o formato exato `Chamar a onda N/T já`, com inteiros positivos seguros e N menor ou igual a T. É tratado como interação gratuita pelo pickup, sem comprovar que o aviso pertence à Fenda.

O posicionamento distribui os controles na faixa inferior central conforme a largura da janela, reservando mais espaço ao Auto Pickup e permitindo a quebra de texto. O mapa fica à esquerda do Auto Select, com altura limitada e rolagem; a disposição não identifica dinamicamente os inventários do jogo.
