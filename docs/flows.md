# Fluxos

```mermaid
flowchart TD
  A[Alteração na página ou verificação periódica] --> B{Ativo e painel fechado?}
  B -- Não --> W[Aguardar]
  B -- Sim --> C{Tela identificada?}
  C -- Build --> D[Interpretar opções e recursos]
  D --> E[decidir: selecionar, banir, atualizar, pular ou aguardar]
  C -- Bênção --> F[Identificar status e consultar prioridade]
  C -- Itens --> G[Escolher maior raridade ou pegar item único]
  C -- Não --> W
```

1. `MutationObserver` e verificação periódica agendam `observar`, em `src/adaptador.js`.
2. O adaptador lê elementos visíveis e encaminha opções para `decidir` em `src/decisao.mjs`.
3. Para banir, primeiro ativa o modo de banimento; depois confere os nomes e a ausência de marcadores do plano antes de clicar no alvo.
4. Se a tela ou os dados necessários não forem reconhecidos, o adaptador ou a decisão aguardam. Não há códigos HTTP próprios.

Os seletores e etapas são dependências da interface real; a simulação em `tests/integracao.test.mjs` não confirma o comportamento do jogo.
