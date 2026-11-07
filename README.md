# PokéBonk Auto Select

Protótipo de userscript para automatizar escolhas no jogo de navegador PokéBonk. Usa o plano de build do jogo, uma prioridade configurável de atributos e a raridade dos itens. O projeto é independente e não é afiliado ao jogo.

## Estado

O código gera um userscript para a interface em português de `https://pokebonk.com/`. As decisões são testadas localmente; a integração com o jogo, o tempo de resposta e a compatibilidade entre navegadores ainda precisam de validação completa. Veja [limitações](docs/history.md).

## Usar

Instale um gerenciador de userscripts compatível, como o Tampermonkey, e abra o [link de instalação](https://raw.githubusercontent.com/guilhermehpmoraes/pokebonk-auto/main/pokebonk-autoselect.user.js). Confirme a instalação ou atualização e recarregue o jogo. O Auto Select começa desligado. O painel salva cinco presets de prioridade no navegador.

O botão Auto Pickup também começa desligado. Quando ligado, mantém uma sugestão de qual opção paga procurar, mas tenta interagir com as outras opções pagas e com alguns objetos gratuitos encontrados no caminho. Portais continuam manuais. A estimativa e a integração precisam de validação em jogo; veja [regras e limitações](docs/product.md).

O script informa ao gerenciador o endereço de atualização no GitHub. Com atualizações automáticas habilitadas, novas versões podem ser verificadas periodicamente; o intervalo e eventuais confirmações dependem do gerenciador e de suas configurações.

## Desenvolver e verificar

Requer Node.js com suporte a `node:test`; uma versão mínima ainda não foi definida.

```sh
node scripts/gerar-userscript.mjs
node --check pokebonk-autoselect.user.js
node --test tests/*.test.mjs
```

O arquivo `.user.js` é gerado a partir de `src/decisao.mjs`, `src/kits.mjs` e `src/adaptador.js`; regenere-o após alterações nessas fontes. Consulte [desenvolvimento](docs/development.md), o [índice da documentação](docs/README.md) e [instruções para agentes](AGENTS.md).
