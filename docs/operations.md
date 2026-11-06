# Operações

## Distribuição e estado

O artefato `pokebonk-autoselect.user.js` é instalado em um gerenciador de userscripts. O cabeçalho aponta `@updateURL` e `@downloadURL` para o arquivo público na `main` do GitHub. O gerenciador pode consultar atualizações periodicamente quando a configuração estiver habilitada; o intervalo e as confirmações dependem dele. O script instalado antes dessa configuração precisa ser atualizado ou reinstalado uma vez a partir do link do README. A instalação e a atualização automáticas ainda não foram testadas no navegador.

| Configuração | Estado |
| --- | --- |
| `pokebonk-auto-select-status` | Ordem de status em `localStorage` do site no navegador |
| Estado ativo | Mantido em memória; inicia desligado |
| Variáveis de ambiente | Nenhuma identificada no código |

## Observabilidade, riscos e dívidas

Não há serviço, banco, pipeline de deploy ou telemetria próprios identificados. O script interage com uma partida real e pode consumir recursos. Mudanças no DOM ou no idioma podem impedir o funcionamento. O catálogo de status é parcial; testes reais, latência, compatibilidade entre navegadores e comportamento em todas as telas não foram verificados integralmente.

Uma seleção de cartão ignorada pode ser tentada novamente até três vezes. As ações de consumo de banimento, atualização e pulo não são repetidas automaticamente.
