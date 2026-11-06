# PokéBonk Auto Select

Protótipo de userscript para automatizar escolhas no jogo de navegador PokéBonk. Usa o plano de build do jogo, uma prioridade configurável de atributos e a raridade dos itens. O projeto é independente e não é afiliado ao jogo.

## Estado

O código gera um userscript para a interface em português de `https://pokebonk.com/`. As decisões são testadas localmente; a integração com o jogo, o tempo de resposta e a compatibilidade entre navegadores ainda precisam de validação completa. Veja [limitações](docs/history.md).

## Usar

Instale um gerenciador de userscripts compatível com seu navegador, crie um script com o conteúdo de [`pokebonk-autoselect.user.js`](pokebonk-autoselect.user.js), salve e recarregue o jogo. O Auto Select começa desligado. O painel de prioridades salva a ordem no navegador.

## Desenvolver e verificar

Requer Node.js com suporte a `node:test`; uma versão mínima ainda não foi definida.

```sh
node scripts/gerar-userscript.mjs
node --check pokebonk-autoselect.user.js
node --test tests/*.test.mjs
```

O arquivo `.user.js` é gerado a partir de `src/decisao.mjs` e `src/adaptador.js`; regenere-o após alterações nessas fontes. Consulte [desenvolvimento](docs/development.md), o [índice da documentação](docs/README.md) e [instruções para agentes](AGENTS.md).
