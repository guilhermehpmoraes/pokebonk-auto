# Arquitetura

O planejador puro `planejarFusoes`, em `src/decisao.mjs`, recebe as receitas identificadas pelo adaptador e verifica sequências de fusão. O adaptador acessa o estado da partida e o catálogo interno do jogo para Bill, Hypno e prioridade de golpes; quando os dados não são reconhecidos, esses fluxos aguardam.

O fallback de level-up para uma oferta planejada que bloquearia o espaço usa uma decisão pura para banimento, atualização, pulo ou escolha temporária; o adaptador identifica alvos fora do plano e confere se a remoção da escolha destrava o modelo antes de oferecê-la à decisão.

Outra decisão pura avalia aprendizado com a hipótese explícita de remoção futura de ataques fora do plano; o adaptador confere antes se há espaço físico disponível e prioriza escolhas que não dependem dessa hipótese.

O adaptador mantém um motivo resumido da última falha de leitura e o exibe ao detectar o aviso de Bill ou Hypno; ele não grava informações da partida nesse indicador.

O catálogo de atributos do adaptador inclui dano de status como atributo distinto de chance de status para a comparação de companheiros e outros cartões reconhecidos.

```mermaid
flowchart LR
  S[src/decisao.mjs] --> G[scripts/gerar-userscript.mjs]
  K[src/kits.mjs] --> G
  A[src/adaptador.js] --> G
  G --> U[pokebonk-autoselect.user.js]
  U --> D[DOM do jogo]
  U --> L[localStorage do navegador]
```

`decidir` recebe uma descrição de tela e retorna uma ação. O adaptador observa o DOM, reconhece cartões e botões e chama `decidir`, executando cliques quando ativo. O gerador combina as fontes em um userscript independente. `localStorage` guarda cinco presets e o preset ativo; a ativação é mantida apenas em memória e começa desligada.

O adaptador extrai atributos diretos das descrições dos power-ups; a regra pura escolhe por lendário, prioridade e raridade usando o preset ativo.

O adaptador guarda avisos de seleções fora da build em `sessionStorage` da aba, com fallback em memória. Após identificar um inventário estável, reconcilia separadamente ataques e vitaminas e remove os avisos dos itens ausentes. Sem dados suficientes para uma categoria, preserva os respectivos avisos.

Para banimento de kit, o adaptador tenta ler os módulos do jogo carregados na mesma origem e os planos de build disponíveis no `localStorage`. `kitPodeSerBanido` compara o kit com todos os planos encontrados, sem transmitir os planos. Se não for possível comprovar a segurança, o adaptador usa banimento individual.

O DOM do jogo é externo e pode mudar sem aviso. Não há serviço ou banco próprio neste repositório. Veja [contratos](contracts.md) e [decisões](decisions/README.md).

O Auto Pickup possui ativação separada em memória. A decisão de elegibilidade e as estimativas de gasto são puras; o adaptador lê o aviso e a carteira, emite eventos de teclado e acompanha as telas do cassino e da loja que ele mesmo abriu.

O reconhecimento dos estágios do Rugido de Rhydon fica na decisão; o adaptador limita e espaça as tentativas para cada estágio visível.

A elegibilidade das Ruínas do Fóssil e a escolha do Domo ficam nas regras puras; o adaptador reconhece o cartão e executa a interação e o clique.

Durante um giro no cassino, o adaptador tenta pular a animação e reavalia o próximo giro. Se identificar uma tela de recompensa, tenta retomar a visita após a escolha.

Para lotes do cassino, a decisão pura verifica custo total e um teto por giro; o adaptador identifica o botão e o resumo exibidos pelo jogo. O lote inteiro é decidido de uma vez.

Quando ativo, o botão do Auto Pickup mostra uma sugestão de destino mantida em memória até ser concluída ou trocada pelo usuário. A sugestão não limita as interações pagas no caminho. Nos modais próprios, indica que está avaliando itens ou giro.

O painel de mapa captura a instância de marcadores envolvendo os métodos de marcadores e de custo da classe interna carregada pelo jogo. Quando o registro do recurso não está disponível, há uma URL alternativa para a build conferida. A extração e a projeção são conservadoras quando a versão ou os dados não são reconhecidos. O adaptador identifica a tela Alfa, e a escolha entre bônus é uma regra pura em `decisao.mjs`.

A captura também observa adições durante a construção da instância, verificando-a após o construtor. O catálogo de vitaminas tem alternativa para a build conferida quando não há registro do módulo.

A visibilidade do aviso de itens fora da build acompanha a carteira do HUD, sem depender da captura da instância; a remoção dos avisos continua dependente da reconciliação do inventário.

O catálogo compartilhado de atributos no adaptador reconhece cura como entrada independente para leitura e ordenação dos bônus.

O adaptador também reconhece a tela de escolha entre dois brilhantes e reutiliza a decisão pura de comparação de suportes.

A automação de Fenda tem controle próprio, inicializado desligado e independente do pickup. Usa a instância capturada para o painel de mapa quando disponível e, na ausência dela, reconhece o HUD de incenso e o aviso específico de entrada; o jogo mantém suas verificações de bloqueio.

O reconhecimento do aviso de chamada de onda é uma regra de texto em `decisao.mjs`; o adaptador usa o fluxo habitual de interação do pickup.

Os controles ficam na faixa inferior central; o mapa recolhível e os avisos ficam acima, com altura limitada. A largura dos controles se adapta à janela; o posicionamento requer confirmação visual no jogo.
