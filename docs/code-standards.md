# Padrões de código

## Precedente local

Use a implementação mais próxima no mesmo papel: regras puras em `src/decisao.mjs`, proteção de kits em `src/kits.mjs`, reconhecimento e cliques em `src/adaptador.js`, montagem em `scripts/gerar-userscript.mjs`. Prefira nomes em português em continuidade ao projeto.

## Mudanças e testes

Adicione testes para regras e cenários com risco real em `tests/`; a simulação de integração usa `node:vm`. Preserve identificadores e razões de espera quando úteis para entender por que uma ação não ocorreu. Regere o artefato e revise os documentos afetados.

## Não copie

Não assuma que simulações equivalem a testes no jogo, que todos os nomes possíveis de status foram mapeados ou que o DOM é uma API estável. Não faça mudanças apenas no artefato gerado. Não ignore uma opção não reconhecida apenas para forçar uma ação.
