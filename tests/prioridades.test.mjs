import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

test('painel migra prioridades e mantém cinco presets independentes', () => {
  const memoria = new Map();
  memoria.set('pokebonk-auto-select-status', JSON.stringify(['experiencia', 'dinheiro', 'sorte']));
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
      if (selector === '[data-tabs]') return this.abas;
      if (selector === '[data-name]') return this.nome;
      return null;
    }
    set innerHTML(_) { this.lista = new Elemento('ol'); this.fechar = new Elemento('button'); this.abas = new Elemento('div'); this.nome = new Elemento('input'); }
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
  const dados = () => JSON.parse(memoria.get('pokebonk-auto-select-perfis'));
  const ordem = () => dados().perfis[dados().ativo].ordem;
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
  const abas = body.children[2].abas;
  assert.equal(abas.children.length, 5);
  abas.children[1].click();
  assert.equal(dados().ativo, 1);
  assert.deepEqual(dados().perfis[1].ordem.slice(0, 3), ['experiencia', 'dinheiro', 'sorte']);
  assert.equal(dados().perfis[0].ordem[1], 'sorte');
  const nome = body.children[2].nome;
  nome.value = 'Especial'; nome.handlers.change();
  assert.equal(dados().perfis[1].nome, 'Especial');
  lista.children[1].children[3].click();
  assert.equal(dados().perfis[1].ordem[0], 'dinheiro');
  abas.children[0].click();
  assert.equal(dados().ativo, 0);
  assert.equal(ordem()[1], 'sorte');
  abas.children[1].click();
  assert.equal(ordem()[0], 'dinheiro');
  assert.equal(body.children[2].nome.value, 'Especial');
  assert.equal(memoria.get('pokebonk-auto-select-status'), JSON.stringify(['experiencia', 'dinheiro', 'sorte']));
  const novoBody = new Elemento('body');
  const novoDocument = { ...document, body: novoBody };
  vm.runInNewContext(readFileSync(new URL('../pokebonk-autoselect.user.js', import.meta.url), 'utf8'), {
    document: novoDocument, localStorage, MutationObserver, setTimeout() {}, setInterval() {}, Math, Date,
  });
  novoBody.children[1].click();
  assert.equal(novoBody.children[2].nome.value, 'Especial');
  assert.equal(novoBody.children[2].lista.children[0].dataset.statusId, 'dinheiro');
  const antigos = dados();
  antigos.perfis[0].ordem = ['sorte', 'novo: dano em elites e chefes', 'dinheiro', 'dano elites'];
  antigos.perfis[1].ordem = ['dano elites', 'sorte', 'novo: dano em elites e chefes'];
  memoria.set('pokebonk-auto-select-perfis', JSON.stringify(antigos));
  const outroBody = new Elemento('body');
  vm.runInNewContext(readFileSync(new URL('../pokebonk-autoselect.user.js', import.meta.url), 'utf8'), {
    document: { ...document, body: outroBody }, localStorage, MutationObserver, setTimeout() {}, setInterval() {}, Math, Date,
  });
  outroBody.children[1].click();
  const outroPainel = outroBody.children[2];
  const ids = () => outroPainel.lista.children.map((item) => item.dataset.statusId);
  assert.equal(ids()[0], 'dano elites');
  assert.equal(ids().filter((id) => id === 'dano elites').length, 1);
  outroPainel.abas.children[0].click();
  assert.deepEqual(ids().slice(0, 3), ['sorte', 'dano elites', 'dinheiro']);
  assert.equal(ids().filter((id) => id === 'dano elites').length, 1);
});
