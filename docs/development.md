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

`tests/pickup.test.mjs` verifica decisões de custo, o indicador de preferência, reconhecimento e simulações do teclado, da loja e do cassino; não comprova que o jogo aceita os eventos nem que a estratégia seja ótima.

Os cenários da loja incluem saldo abreviado, lote parcialmente vendido e itens caros com renovação barata.

Os cenários do cassino incluem saldo abreviado, clique ignorado, botão de pular animação, contador de giros e mudança de preferência após uma loja cara observada.

Ao mudar o script, incremente `@version` em `scripts/gerar-userscript.mjs`, gere o arquivo e inclua-o no commit. O gerenciador usa o endereço configurado no cabeçalho para consultar versões publicadas na `main`.

## Git

Use o WSL para operações Git. Este repositório trabalha diretamente na branch `main`, sem Gitflow. Depois de verificar cada alteração, faça commit e envie a `main` ao GitHub. A convenção de commits segue a skill global `commit-message` quando aplicável.
