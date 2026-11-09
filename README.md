# PokéBonk Auto Select

Userscript para automatizar escolhas no jogo de navegador PokéBonk. Usa o plano de build do jogo, uma prioridade configurável de atributos e a raridade dos itens. O projeto é independente e não é afiliado ao jogo.

## Estado

O código gera um userscript para a interface em português de `https://pokebonk.com/`. O usuário relatou que ele e um amigo usaram o script em uma partida sem erros. As decisões também têm testes locais; o relato não identifica quais fluxos ocorreram nem cobre todas as configurações e navegadores. Veja [histórico e limitações](docs/history.md).

## Usar

Instale um gerenciador de userscripts compatível, como o Tampermonkey, e abra o [link de instalação](https://raw.githubusercontent.com/guilhermehpmoraes/pokebonk-auto/main/pokebonk-autoselect.user.js). Confirme a instalação ou atualização e recarregue o jogo. O Auto Select começa desligado. O painel salva cinco presets de prioridade no navegador.

A versão 0.2.35 mudou o nome do script. O gerenciador pode tratá-la como uma nova instalação: instale pelo link acima e desative ou remova a versão antiga **PokéBonk Auto Select — protótipo de upgrades** para evitar duas cópias ativas. As prioridades são salvas no armazenamento do site, separadas do script.

O botão Auto Pickup também começa desligado. Quando ligado, mantém uma sugestão de qual opção paga procurar, mas tenta interagir com as outras opções pagas e com alguns objetos gratuitos encontrados no caminho. Os portais do chefe e da próxima zona continuam manuais. Veja [regras e limitações](docs/product.md).

O botão **Auto Fenda** começa desligado e é independente do Auto Pickup. Ligue-o quando quiser que o script tente usar Incenso e entrar nas Fendas reconhecidas; a abertura consome Incenso.

O Auto Pickup também aciona as Ruínas do Fóssil e escolhe o Fóssil de Domo quando reconhecido: ele oferece uma bênção ancestral em troca de 20% do HP máximo pelo resto da partida.

Com Auto Select e Auto Pickup ligados, o script tenta usar a Máquina do Bill e o Hypno conforme o plano, preservando os ingredientes das outras fusões. A integração depende da compilação reconhecida do jogo e ainda precisa de teste em partida; consulte [regras e limitações](docs/product.md).

Os avisos de itens fora do plano são removidos automaticamente quando o inventário reconhecido confirma que eles não estão mais equipados.

O script informa ao gerenciador o endereço de atualização no GitHub. Com atualizações automáticas habilitadas, novas versões podem ser verificadas periodicamente; o intervalo e eventuais confirmações dependem do gerenciador e de suas configurações.

## Desenvolver e verificar

Requer Node.js com suporte a `node:test`; uma versão mínima ainda não foi definida.

```sh
node scripts/gerar-userscript.mjs
node --check pokebonk-autoselect.user.js
node --test tests/*.test.mjs
```

O arquivo `.user.js` é gerado a partir de `src/decisao.mjs`, `src/kits.mjs` e `src/adaptador.js`; regenere-o após alterações nessas fontes. Consulte [desenvolvimento](docs/development.md), o [índice da documentação](docs/README.md) e [instruções para agentes](AGENTS.md).
