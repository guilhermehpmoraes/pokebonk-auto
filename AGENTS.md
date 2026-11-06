# Instruções para agentes

## Fonte de verdade

- Consulte [docs/README.md](docs/README.md) e o código relevante antes de alterar comportamento. O código executável prevalece sobre descrições desatualizadas.
- Cada mudança inclui a revisão dos documentos indicados na matriz de manutenção. Declare ausência de impacto documental somente após comparar o diff com a documentação.
- Separe comportamento implementado, validação, limitações e planos. Não descreva integração, navegadores ou desempenho como verificados sem evidência.

## Precedentes locais

- Regras de escolha pertencem a `src/decisao.mjs`; preserve a separação entre decisão e DOM.
- Identificação de telas, controles e configurações fica em `src/adaptador.js`. Mantenha o comportamento conservador quando não for possível identificar uma tela com segurança.
- `scripts/gerar-userscript.mjs` combina essas fontes; não edite apenas o arquivo gerado `pokebonk-autoselect.user.js`.
- Adicione testes de decisão em `tests/decisao.test.mjs` e cenários de integração simulada em `tests/integracao.test.mjs`, quando necessários para validar mudanças.

## Verificação e segurança

- Execute os comandos de [development.md](docs/development.md). Teste manual no jogo não é substituído por teste simulado.
- O userscript clica em escolhas e pode gastar banimentos, atualizações e pulos em partidas reais. Preserve a inicialização desligada e não execute ações no jogo do usuário sem necessidade da tarefa.
- Não inclua credenciais, dados privados, tokens ou configurações locais no repositório. Não altere o salvamento do jogo como parte de testes.
- Use o Git pelo WSL. Neste repositório, trabalhe e publique diretamente na branch `main`; Gitflow não é utilizado.
- Após concluir e verificar cada alteração, faça commit e envie a `main` ao GitHub pelo WSL. Respeite os limites de acesso e não inclua alterações de terceiros sem identificá-las.
- Ao alterar o userscript distribuído, aumente `@version` em `scripts/gerar-userscript.mjs`, regenere o arquivo e publique ambos para que os gerenciadores identifiquem a atualização.
