import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { decidirFossil } from '../src/decisao.mjs';

test('escolhe somente o Domo com ganho e custo reconhecidos', () => {
  const domo = { id: 1, nome: 'fossil de domo', ganho: 'escolha uma bencao ancestral (lendaria ×1,5)', custo: '−20% de hp max' };
  assert.equal(decidirFossil([{ id: 0, nome: 'fossil de helix' }, domo]), 1);
  assert.equal(decidirFossil([{ ...domo, custo: '−25% de hp max' }]), null);
  assert.equal(decidirFossil([domo, domo]), null);
  assert.equal(decidirFossil([]), null);
});

function simular({ ligado = true, custo = '−20% de HP máx.', desabilitado = false, duplicado = false } = {}) {
  const controles = [], tarefas = [], eventos = [], clicados = [];
  let aberto = false, mudou;
  const cartao = (nome, ganho, bane, disabled = false) => ({ disabled, outerHTML: nome + ganho + bane, getClientRects: () => [1],
    querySelector(s) { return ({ h3: { textContent: nome }, '.pact-line.boon b': { textContent: ganho }, '.pact-line.bane b': { textContent: bane } })[s] || null; },
    click() { clicados.push(nome); } });
  const domo = () => cartao('Fóssil de Domo', 'Escolha uma bênção ancestral (lendária ×1,5)', custo, desabilitado);
  const cartoes = [cartao('Fóssil de Hélix', 'Item', '−15% de HP máx.'), domo(), ...(duplicado ? [domo()] : [])];
  const modal = { getClientRects: () => [1], querySelectorAll(s) { return s === 'button.card.pact.trade' ? cartoes : []; }, querySelector: () => null };
  const prompt = { getClientRects: () => [1], textContent: 'ERuínas do Fóssil · reviva um fóssil em troca de HP máximo', querySelector: () => ({ textContent: 'E' }) };
  const document = { body: { appendChild: (el) => controles.push(el) }, createElement: () => ({ style: {}, addEventListener(tipo, fn) { this[tipo] = fn; } }),
    querySelector: () => null, querySelectorAll(s) { return s === '.modal' ? (aberto ? [modal] : []) : s === '#hud .prompt' ? [prompt] : []; } };
  class MutationObserver { constructor(fn) { mudou = fn; } observe() {} }
  class KeyboardEvent { constructor(type) { this.type = type; } }
  vm.runInNewContext(readFileSync(new URL('../pokebonk-autoselect.user.js', import.meta.url), 'utf8'), {
    document, localStorage: { getItem: () => null }, MutationObserver, KeyboardEvent,
    window: { dispatchEvent(evento) { eventos.push(evento.type); if (evento.type === 'keydown') { aberto = true; mudou(); } } },
    setTimeout(fn) { tarefas.push(fn); return tarefas.length; }, setInterval() {}, Date, Math,
  });
  if (ligado) controles[2].click();
  for (let i = 0; i < 4; i++) tarefas.splice(0).forEach((fn) => fn());
  return { eventos, clicados };
}

test('pickup aciona as ruínas e seleciona Domo; espera quando os dados são ambíguos', () => {
  assert.deepEqual(simular(), { eventos: ['keydown', 'keyup'], clicados: ['Fóssil de Domo'] });
  assert.deepEqual(simular({ ligado: false }), { eventos: [], clicados: [] });
  assert.deepEqual(simular({ custo: '−25% de HP máx.' }).clicados, []);
  assert.deepEqual(simular({ desabilitado: true }).clicados, []);
  assert.deepEqual(simular({ duplicado: true }).clicados, []);
});
