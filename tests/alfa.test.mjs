import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { decidirAlfa, decidirPickup } from '../src/decisao.mjs';

test('escolhe o pior suporte apenas quando o novo tem prioridade maior', () => {
  const existentes = [{ id: 0, status: 'vida' }, { id: 1, status: 'dinheiro' }, { id: 2, status: 'coleta' }];
  const prioridade = ['sorteio', 'dinheiro', 'coleta', 'vida'];
  assert.equal(decidirAlfa({ existentes, novo: { id: 3, status: 'sorteio' }, prioridade }), 0);
  assert.equal(decidirAlfa({ existentes, novo: { id: 3, status: 'vida' }, prioridade }), 3);
  assert.equal(decidirAlfa({ existentes, novo: { id: 3, status: 'desconhecido' }, prioridade }), null);
  assert.equal(decidirPickup('friend ball: luta com voce nesta partida (4 s) · apoio: +12% de chance de status').acao, 'interagir');
  assert.equal(decidirPickup('friend ball: abrir portal').acao, 'aguardar');
});

function simularTela(statusNovo, configuracao = {}) {
  const controles = [], tarefas = [], clicados = [];
  const dados = configuracao.dados || [ ['Onix', 'Vínculo 5', '+15 de HP máx.', 'Libertar'], ['Dodrio', 'Vínculo 5', '+10% de Pokédólares', 'Libertar'], ['Shuckle', 'Vínculo 5', '+1 de coleta', 'Libertar'], ['Golbat', 'NOVO', statusNovo, 'Libertar o novo'] ];
  const cartoes = dados.map(([nome, rar, status, acao], id) => ({ outerHTML: `alfa-${id}-${status}`, querySelector(s) { return s === '.rar' ? { textContent: rar } : s === '.key' ? { textContent: acao } : s === '.bd > p' ? { textContent: status } : null; }, click() { clicados.push(nome); } }));
  const modal = { getClientRects: () => [1], querySelector(s) { return s === 'h1' ? { textContent: configuracao.titulo ?? 'Golbat quer se juntar à sua equipe!' } : s === '.help' ? { textContent: configuracao.ajuda ?? 'Sua equipe está completa: escolha quem libertar (o Laboratório dá um espaço a mais)' } : null; }, querySelectorAll(s) { return s === '.cards > button.card' ? cartoes : []; } };
  const document = { body: { appendChild: (el) => controles.push(el) }, createElement: () => ({ style: {}, addEventListener(tipo, fn) { this[tipo] = fn; } }), querySelector: () => null, querySelectorAll(s) { return s === '.modal' ? [modal] : []; } };
  class MutationObserver { observe() {} }
  const localStorage = { getItem(k) { return k === 'pokebonk-auto-select-perfis' ? JSON.stringify({ ativo: 0, perfis: [{ ordem: configuracao.ordem || ['sorteio', 'dinheiro', 'coleta', 'vida'] }] }) : null; } };
  vm.runInNewContext(readFileSync(new URL('../pokebonk-autoselect.user.js', import.meta.url), 'utf8'), { document, localStorage, MutationObserver, window: {}, setTimeout(fn) { tarefas.push(fn); }, setInterval() {}, Date, Math });
  if (configuracao.ligado !== false) controles[2].click(); tarefas.splice(0).forEach((fn) => fn()); return clicados;
}

test('com pickup ligado reconhece tela de Alfa e respeita prioridade do preset', () => {
  assert.deepEqual(simularTela('+12% de chance de status'), ['Onix']);
  assert.deepEqual(simularTela('+15 de HP máx.'), ['Golbat']);
  assert.deepEqual(simularTela('+10% de atributo não reconhecido'), []);
});

test('compara brilhantes pela prioridade e mantém o atual no empate', () => {
  const dados = [['Venomoth', 'Vínculo 5', '+2 de coleta', 'Libertar'], ['Marill', 'NOVO', '+30% de cura', 'Libertar o novo']];
  const tela = { dados, titulo: 'Marill brilhante quer te acompanhar!', ajuda: 'Só um brilhante pode te acompanhar: escolha qual libertar. O registro na Pokédex e os 120 de Stardust você ganha de qualquer jeito' };
  assert.deepEqual(simularTela(null, { ...tela, ordem: ['cura', 'coleta'] }), ['Venomoth']);
  assert.deepEqual(simularTela(null, { ...tela, ordem: ['coleta', 'cura'] }), ['Marill']);
  assert.deepEqual(simularTela(null, { ...tela, dados: [dados[0], ['Marill', 'NOVO', '+3 de coleta', 'Libertar o novo']] }), ['Marill']);
  assert.deepEqual(simularTela(null, { ...tela, dados: [dados[0], ['Marill', 'NOVO', '+3 de atributo desconhecido', 'Libertar o novo']] }), []);
  assert.deepEqual(simularTela(null, { ...tela, ajuda: 'Escolha outro companheiro' }), []);
  assert.deepEqual(simularTela(null, { ...tela, dados: [...dados, dados[0]] }), []);
  assert.deepEqual(simularTela(null, { ...tela, ligado: false }), []);
});

test('reconhece cura na equipe mostrada e respeita sua posição no preset', () => {
  const dados = [ ['Golduck', 'Vínculo 2', '+15% de cura', 'Libertar'], ['Ledian', 'Vínculo 1', '+1 de coleta', 'Libertar'], ['Togetic', 'Vínculo 0', '+8 de sorte', 'Libertar'], ['Weedle', 'NOVO', '+1 de coleta', 'Libertar o novo'] ];
  assert.deepEqual(simularTela(null, { dados, ordem: ['sorte', 'coleta'] }), ['Golduck']);
  assert.deepEqual(simularTela(null, { dados, ordem: ['cura', 'sorte', 'coleta'] }), ['Weedle']);
  assert.deepEqual(simularTela(null, { dados, ordem: ['sorte', 'coleta', 'novo: cura'] }), ['Golduck']);
});

test('reconhece dano de status na equipe mostrada sem confundir com chance de status', () => {
  const dados = [ ['Wigglytuff', 'Vínculo 4', '+10% de Pokédólares', 'Libertar'], ['Miltank', 'Vínculo 5', '+10% de Pokédólares', 'Libertar'], ['Arcanine', 'Vínculo 3', '+15% de dano de status', 'Libertar'], ['Miltank novo', 'NOVO', '+10% de Pokédólares', 'Libertar o novo'] ];
  assert.deepEqual(simularTela(null, { dados, ordem: ['dinheiro', 'dano status'] }), ['Arcanine']);
  assert.deepEqual(simularTela(null, { dados, ordem: ['dano status', 'dinheiro'] }), ['Miltank novo']);
  assert.deepEqual(simularTela(null, { dados, ordem: ['novo: dano de status', 'dinheiro'] }), ['Miltank novo']);
  assert.deepEqual(simularTela(null, { dados, ordem: ['sorteio', 'dinheiro', 'dano status'] }), ['Arcanine']);
});

test('compara dano em elites na equipe de cinco cartões mostrada', () => {
  const dados = [ ['Rhydon', 'Vínculo 2', '+4 de armadura', 'Libertar'], ['Heracross', 'Vínculo 2', '+1 de coleta', 'Libertar'], ['Arbok', 'Vínculo 0', '+12% de chance de status', 'Libertar'], ['Larvitar', 'Vínculo 0', '+15 de HP máx.', 'Libertar'], ['Hitmontop', 'NOVO', '+10% de dano em elites', 'Libertar o novo'] ];
  assert.deepEqual(simularTela(null, { dados, ordem: ['dano elites', 'coleta', 'sorteio', 'armadura', 'vida'] }), ['Larvitar']);
  assert.deepEqual(simularTela(null, { dados, ordem: ['coleta', 'sorteio', 'armadura', 'vida', 'dano elites'] }), ['Hitmontop']);
});

test('na troca de brilhantes com dano em elites igual mantém o existente', () => {
  const dados = [['Machop', 'Vínculo 2', '+20% de dano em elites', 'Libertar'], ['Tyrogue', 'NOVO', '+20% de dano em elites', 'Libertar o novo']];
  assert.deepEqual(simularTela(null, { dados, ordem: ['dano elites'], titulo: 'Tyrogue brilhante quer te acompanhar!', ajuda: 'Só um brilhante pode te acompanhar: escolha qual libertar. O registro na Pokédex e os 120 de Stardust você ganha de qualquer jeito' }), ['Tyrogue']);
});
