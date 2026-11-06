# Desenvolvimento

## Ambiente

Node.js com suporte a módulos ES e `node:test`. Versão mínima e matriz de navegadores: não verificadas. O projeto não possui manifesto de dependências ou processo de instalação próprio.

## Geração e verificações

```sh
node scripts/gerar-userscript.mjs
node --check pokebonk-autoselect.user.js
node --test tests/*.test.mjs
```

O gerador escreve `pokebonk-autoselect.user.js`. Os testes em `tests/decisao.test.mjs` cobrem decisões e `tests/integracao.test.mjs` simula um cenário de bênção; o navegador e o jogo real precisam de teste manual separado.

## Git

Use o WSL para operações Git. Este repositório trabalha diretamente na branch `main`, sem Gitflow. A convenção de commits segue a skill global `commit-message` quando aplicável.
