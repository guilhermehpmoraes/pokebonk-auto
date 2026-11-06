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

test('bênção usa a ordem do preset ativo', () => {
  const memoria = new Map([['pokebonk-auto-select-perfis', JSON.stringify({ ativo: 1, perfis: [
    { nome: 'Físico', ordem: ['dano fisico', 'dano especial'] },
    { nome: 'Especial', ordem: ['dano especial', 'dano fisico'] },
  ] })]]);
  let escolhido; let tarefa;
  const controles = [];
  const criar = () => ({ style: {}, addEventListener(tipo, fn) { this[tipo] = fn; }, click() { this.click?.(); } });
  const card = (nome) => ({ disabled: false, outerHTML: nome, getClientRects: () => [1],
    querySelector(seletor) {
      if (seletor.includes('blessing.png')) return {};
      if (seletor === 'h3') return { textContent: nome };
      if (seletor === '.rar') return { textContent: 'Comum' };
      return null;
    }, click() { escolhido = nome; } });
  const cartoes = [card('+20% de dano físico'), card('+20% de dano especial')];
  const document = { body: { appendChild: (e) => controles.push(e) }, createElement: criar,
    querySelectorAll(seletor) { if (seletor === 'button.card') return cartoes; return []; } };
  const localStorage = { getItem: (k) => memoria.get(k) ?? null, setItem: (k, v) => memoria.set(k, v) };
  class MutationObserver { observe() {} }
  vm.runInNewContext(readFileSync(new URL('../pokebonk-autoselect.user.js', import.meta.url), 'utf8'), {
    document, localStorage, MutationObserver, setTimeout(fn) { tarefa = fn; return 1; }, setInterval() {}, Math, Date,
  });
  controles[0].click(); tarefa();
  assert.equal(escolhido, '+20% de dano especial');
});

test('repete a escolha de Ether se o primeiro clique de level-up for ignorado', () => {
  const jobs = new Map(); let next = 0; let observer; let relogio = 1000;
  const cliques = [];
  const criar = () => ({ style: {}, addEventListener(event, fn) { this[event] = fn; }, click() { this.click?.(); } });
  const oferta = (nome, tipo, estado, raridade, noPlano) => ({
    disabled: false, outerHTML: nome, getClientRects: () => [1],
    querySelector(seletor) {
      if (seletor === 'h3') return { textContent: nome };
      if (seletor === '.top .typeicon') return tipo === 'golpe' ? {} : null;
      if (seletor.includes('assets/items/')) return tipo === 'vitamina' ? {} : null;
      if (seletor === '.kind') return { textContent: estado };
      if (seletor === '.rar') return { textContent: raridade };
      if (seletor === '.bp-badge') return noPlano ? {} : null;
      return null;
    }, click() { cliques.push(nome); },
  });
  const cartoes = [oferta('Jump Kick', 'golpe', 'MELHORIA', 'Comum', true), oferta('Calcium', 'vitamina', 'NOVA', 'Incomum', false), oferta('Zinc', 'vitamina', 'NOVA', 'Comum', false), oferta('Ether', 'vitamina', 'NOVA', 'Incomum', true)];
  const controles = ['Atualizar (4) F', 'Pular (4) X', 'Banir (1) Z'].map((textContent) => ({ textContent, disabled: false, getClientRects: () => [1] }));
  const elementos = [];
  const document = { body: { appendChild: (e) => elementos.push(e) }, createElement: criar,
    querySelectorAll(seletor) { if (seletor === 'button.card.offer') return cartoes; if (seletor === 'button') return controles; return []; } };
  const localStorage = { getItem: () => null, setItem() {} };
  class MutationObserver { constructor(callback) { observer = callback; } observe() {} }
  const contexto = { document, localStorage, MutationObserver, setTimeout(fn) { const id = ++next; jobs.set(id, fn); return id; }, setInterval() {}, Math, Date: { now: () => relogio } };
  vm.runInNewContext(readFileSync(new URL('../pokebonk-autoselect.user.js', import.meta.url), 'utf8'), contexto);
  const executar = () => { const fn = [...jobs.values()][0]; jobs.clear(); fn(); };
  elementos[0].click(); executar();
  assert.deepEqual(cliques, ['Ether']);
  relogio += 200; observer(); executar();
  assert.deepEqual(cliques, ['Ether']);
  relogio += 400; observer(); executar();
  assert.deepEqual(cliques, ['Ether', 'Ether']);
  relogio += 600; observer(); executar();
  relogio += 600; observer(); executar();
  assert.deepEqual(cliques, ['Ether', 'Ether', 'Ether']);
});
