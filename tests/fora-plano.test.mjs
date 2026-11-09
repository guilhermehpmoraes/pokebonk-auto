import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function iniciar({ memoria = new Map(), aceitarNaTentativa = 1, opcoes = ['Toxic'], aleatorios = [0], melhorias = [], recursos = 0 } = {}) {
  let tarefa; let intervalo; let tempo = 1000; let tentativas = 0; let indiceAleatorio = 0;
  const acoes = [];
  class Elemento {
    constructor() { this.style = {}; this.children = []; this.handlers = {}; }
    addEventListener(tipo, fn) { this.handlers[tipo] = fn; }
    setAttribute() {}
    append(...itens) { this.children.push(...itens); }
    appendChild(item) { this.children.push(item); }
    replaceChildren(...itens) { this.children = itens; }
    click() { this.handlers.click?.({ stopPropagation() {} }); }
  }
  const body = new Elemento();
  const cartas = opcoes.map((nome) => ({ nome, disabled: false, isConnected: true, outerHTML: nome,
    getClientRects() { return this.isConnected ? [1] : []; },
    querySelector(seletor) {
      if (seletor === 'h3') return { textContent: nome };
      if (seletor === '.top .typeicon') return {};
      if (seletor === '.kind') return { textContent: melhorias.includes(nome) ? 'MELHORIA' : 'NOVO' };
      if (seletor === '.rar') return { textContent: melhorias.includes(nome) ? 'Comum' : 'Ataque' };
      if (seletor === '.bd > .sub') return { textContent: melhorias.includes(nome) ? 'Nível 1 → 2 (máx. 8)' : 'Novo ataque' };
      return null;
    },
    click() { acoes.push(nome); tentativas++; if (tentativas >= aceitarNaTentativa) cartas.forEach((carta) => { carta.isConnected = false; }); },
  }));
  const botoes = [`Banir (${recursos}) Z`, `Atualizar (${recursos}) F`, `Pular (${recursos}) X`].map((textContent) => ({ textContent, disabled: recursos === 0, getClientRects: () => [1] }));
  const document = { body, createElement: () => new Elemento(), querySelectorAll(seletor) {
    if (seletor === 'button.card.offer') return cartas.filter((carta) => carta.isConnected);
    if (seletor === 'button') return botoes;
    return [];
  } };
  const sessionStorage = { getItem: (chave) => memoria.get(chave) ?? null, setItem: (chave, valor) => memoria.set(chave, valor) };
  const localStorage = { getItem: () => null, setItem() {} };
  class MutationObserver { observe() {} }
  const math = Object.create(Math); math.random = () => aleatorios[Math.min(indiceAleatorio++, aleatorios.length - 1)];
  vm.runInNewContext(readFileSync(new URL('../pokebonk-autoselect.user.js', import.meta.url), 'utf8'), {
    document, localStorage, sessionStorage, MutationObserver, Math: math, Date: { now: () => tempo },
    setTimeout(fn) { tarefa = fn; return 1; }, setInterval(fn) { intervalo = fn; },
  });
  return { body, memoria, acoes, ativar() { body.children[0].click(); tarefa(); },
    repetir() { tempo += 600; intervalo(); tarefa(); } };
}

test('avisa sem botão manual e conserva o aviso quando o inventário é desconhecido', () => {
  const execucao = iniciar();
  execucao.ativar();
  assert.deepEqual(execucao.acoes, ['Toxic']);
  const chave = 'pokebonk-auto-select-fora-da-build';
  assert.deepEqual(JSON.parse(execucao.memoria.get(chave)), [{ nome: 'Toxic', tipo: 'golpe' }]);
  const reaberto = iniciar({ memoria: execucao.memoria, opcoes: [] });
  const painel = reaberto.body.children.find((elemento) => elemento.children?.[2]?.children?.[0]?.textContent === "Toxic (golpe)");
  assert.equal(painel.children[2].children[0].textContent, 'Toxic (golpe)');
  assert.equal(painel.children[2].children.length, 1);
  reaberto.repetir();
  assert.deepEqual(JSON.parse(execucao.memoria.get(chave)), [{ nome: 'Toxic', tipo: 'golpe' }]);
});

test('avisa sobre o cartão realmente tentado quando a escolha aleatória muda', () => {
  const execucao = iniciar({ aceitarNaTentativa: 2, opcoes: ['Toxic', 'Supersonic'], aleatorios: [0, 0.99] });
  execucao.ativar();
  assert.deepEqual(JSON.parse(execucao.memoria.get('pokebonk-auto-select-fora-da-build')), []);
  execucao.repetir();
  assert.deepEqual(execucao.acoes, ['Toxic', 'Toxic']);
  assert.deepEqual(JSON.parse(execucao.memoria.get('pokebonk-auto-select-fora-da-build')), [{ nome: 'Toxic', tipo: 'golpe' }]);
});

test('melhora o golpe fora da build antes de gastar banimentos e mostra aviso', () => {
  const execucao = iniciar({ opcoes: ['Toxic'], melhorias: ['Toxic'], recursos: 2 });
  execucao.ativar();
  assert.deepEqual(execucao.acoes, ['Toxic']);
  assert.deepEqual(JSON.parse(execucao.memoria.get('pokebonk-auto-select-fora-da-build')), [{ nome: 'Toxic', tipo: 'golpe' }]);
});

test('trata a melhoria do ataque inicial como qualquer golpe já adquirido', () => {
  const execucao = iniciar({ opcoes: ['Rolling Kick'], melhorias: ['Rolling Kick'], recursos: 2 });
  execucao.ativar();
  assert.deepEqual(execucao.acoes, ['Rolling Kick']);
  assert.deepEqual(JSON.parse(execucao.memoria.get('pokebonk-auto-select-fora-da-build')), [{ nome: 'Rolling Kick', tipo: 'golpe' }]);
});
