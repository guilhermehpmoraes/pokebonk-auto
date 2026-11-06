# Operações

## Distribuição e estado

O artefato `pokebonk-autoselect.user.js` é instalado manualmente em um gerenciador de userscripts. Atualizar o arquivo no repositório não atualiza automaticamente uma cópia instalada. A distribuição e o processo de release ainda não foram definidos.

| Configuração | Estado |
| --- | --- |
| `pokebonk-auto-select-status` | Ordem de status em `localStorage` do site no navegador |
| Estado ativo | Mantido em memória; inicia desligado |
| Variáveis de ambiente | Nenhuma identificada no código |

## Observabilidade, riscos e dívidas

Não há serviço, banco, pipeline de deploy ou telemetria próprios identificados. O script interage com uma partida real e pode consumir recursos. Mudanças no DOM ou no idioma podem impedir o funcionamento. O catálogo de status é parcial; testes reais, latência, compatibilidade entre navegadores e comportamento em todas as telas não foram verificados integralmente.
