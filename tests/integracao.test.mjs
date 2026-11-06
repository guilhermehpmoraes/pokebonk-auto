import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

test('bênção de Unown continua sendo detectada com mudanças frequentes', () => {
  const jobs = new Map(); let next = 0; let observer; let escolhido = null;
  const criar = () => ({ style: {}, addEventListener(event, fn) { this[event] = fn; }, click() { this.click?.(); } });
  const card = (nome, raridade) => ({ disabled: false, outerHTML: nome, getClientRects: () => [1],
    querySelector(seletor) {
      if (seletor.includes('blessing.png')) return {};
      if (seletor === 'h3') return { textContent: nome };
      if (seletor === '.rar') return { textContent: raridade };
      return null;
    }, click() { escolhido = nome; } });
  const cartoes = [card('+2.4% de roubo de vida', 'Incomum'), card('+3.0% de evasão', 'Comum'), card('+14% de dano', 'Incomum')];
  const elementos = [];
  const document = { body: { appendChild: (e) => elementos.push(e) }, createElement: criar,
    querySelectorAll(seletor) { if (seletor === 'button.card.offer') return []; if (seletor === 'button.card') return cartoes; return []; } };
  const memoria = new Map();
  const localStorage = { getItem: (k) => memoria.get(k) ?? null, setItem: (k, v) => memoria.set(k, v) };
  class MutationObserver { constructor(callback) { observer = callback; } observe() {} }
  const contexto = { document, localStorage, MutationObserver, setTimeout(fn) { const id = ++next; jobs.set(id, fn); return id; }, clearTimeout(id) { jobs.delete(id); }, setInterval() {}, Math, Date };
  vm.runInNewContext(readFileSync(new URL('../pokebonk-autoselect.user.js', import.meta.url), 'utf8'), contexto);
  elementos[0].click();
  for (let i = 0; i < 100; i++) observer();
  assert.equal(jobs.size, 1);
  const executar = [...jobs.values()][0]; jobs.clear(); executar();
  assert.equal(escolhido, '+14% de dano');
});
