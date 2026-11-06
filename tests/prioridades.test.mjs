import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

test('painel move status para extremos e permite arrastar pela alça', () => {
  const memoria = new Map();
  let alvo;
  class Elemento {
    constructor(tag) { this.tag = tag; this.style = {}; this.dataset = {}; this.children = []; this.handlers = {}; this.scrollTop = 0; }
    addEventListener(tipo, fn) { this.handlers[tipo] = fn; }
    setAttribute() {}
    setPointerCapture() {}
    focus() {}
    append(...filhos) { this.children.push(...filhos); }
    appendChild(filho) { this.children.push(filho); }
    replaceChildren(...filhos) { this.children = filhos; }
    contains(filho) { return this.children.includes(filho); }
    closest() { return this; }
    querySelector(selector) {
      if (selector === 'ol') return this.lista;
      if (selector === '[data-close]') return this.fechar;
      return null;
    }
    set innerHTML(_) { this.lista = new Elemento('ol'); this.fechar = new Elemento('button'); }
    click() { if (!this.disabled) { this.onclick?.(); this.handlers.click?.({ stopPropagation() {} }); } }
  }
  const body = new Elemento('body');
  const document = { body, createElement: (tag) => new Elemento(tag), elementFromPoint: () => alvo };
  const localStorage = { getItem: (chave) => memoria.get(chave) ?? null, setItem: (chave, valor) => memoria.set(chave, valor) };
  class MutationObserver { observe() {} }
  vm.runInNewContext(readFileSync(new URL('../pokebonk-autoselect.user.js', import.meta.url), 'utf8'), {
    document, localStorage, MutationObserver, setTimeout() {}, setInterval() {}, Math, Date,
  });
  body.children[1].click();
  const lista = body.children[2].lista;
  const ordem = () => JSON.parse(memoria.get('pokebonk-auto-select-status'));
  const id = (posicao) => lista.children[posicao].dataset.statusId;
  assert.equal(id(0), 'experiencia');
  assert.equal(id(2), 'sorte');
  lista.children[2].children[3].click(); // ⇈
  assert.equal(ordem()[0], 'sorte');
  lista.children[0].children[6].click(); // ⇊
  assert.equal(ordem().at(-1), 'sorte');
  const arrastado = lista.children.at(-1);
  alvo = lista.children[1];
  const evento = { button: 0, pointerId: 1, clientX: 20, clientY: 20, preventDefault() {}, stopPropagation() {} };
  arrastado.children[0].handlers.pointerdown(evento);
  arrastado.children[0].handlers.pointerup(evento);
  assert.equal(ordem()[1], 'sorte');
});
