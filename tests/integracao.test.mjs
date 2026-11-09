import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

test('item único tenta novamente clique ignorado e aceita prêmio igual seguinte', () => {
  let tarefa, observer, relogio = 1000, cliques = 0;
  const controles = [];
  const titulo = { textContent: 'Você encontrou um item!', getClientRects: () => [1] };
  const vender = { textContent: 'Vender (+65 ₽) V', getClientRects: () => [1] };
  const criarPegar = () => ({ textContent: 'Pegar E', outerHTML: '<button>Pegar E</button>', getClientRects: () => [1], click() { cliques++; } });
  let pegar = criarPegar();
  const document = { body: { appendChild: (el) => controles.push(el) },
    createElement: () => ({ style: {}, addEventListener(tipo, fn) { this[tipo] = fn; } }),
    querySelector(s) { return s === '.card h3' ? { textContent: 'Lucky Egg' } : null; },
    querySelectorAll(s) { return s === 'h1,h2,h3,div,span' ? [titulo] : s === 'button' ? [pegar, vender] : []; } };
  class MutationObserver { constructor(fn) { observer = fn; } observe() {} }
  vm.runInNewContext(readFileSync(new URL('../pokebonk-autoselect.user.js', import.meta.url), 'utf8'), {
    document, localStorage: { getItem: () => null }, MutationObserver,
    setTimeout(fn) { tarefa = fn; return 1; }, setInterval() {}, Date: { now: () => relogio }, Math,
  });
  const executar = () => { observer(); const fn = tarefa; tarefa = null; fn(); };
  controles[0].click(); executar();
  assert.equal(cliques, 1);
  relogio += 200; executar(); assert.equal(cliques, 1);
  relogio += 400; executar(); assert.equal(cliques, 2);
  relogio += 600; executar(); relogio += 600; executar(); assert.equal(cliques, 3);
  pegar = criarPegar(); executar(); assert.equal(cliques, 4);
});

test('escolha de itens usa o preset para bônus diretos e prioriza lendários', () => {
  function simular(ofertas, ordem) {
    let tarefa, escolhido;
    const controles = [];
    const criar = () => ({ style: {}, addEventListener(tipo, fn) { this[tipo] = fn; } });
    const cartoes = ofertas.map(({ nome, raridade, descricao }) => ({ disabled: false, outerHTML: nome,
      classList: { contains: () => false }, getClientRects: () => [1],
      querySelector(s) {
        if (s === '.rar') return { textContent: raridade };
        if (s === '.bd > p') return descricao == null ? null : { textContent: descricao };
        if (s === '.cap' || s.includes('assets/items/')) return {};
        return null;
      }, click() { escolhido = nome; } }));
    const nenhum = { disabled: false, textContent: 'Nenhum (+315 ₽)', getClientRects: () => [1] };
    const document = { body: { appendChild: (e) => controles.push(e) }, createElement: criar,
      querySelectorAll(s) { return s === 'button.card' ? cartoes : s === 'button' ? [nenhum] : []; } };
    class MutationObserver { observe() {} }
    const localStorage = { getItem(k) { return k === 'pokebonk-auto-select-perfis' ? JSON.stringify({ ativo: 0, perfis: [{ ordem }] }) : null; } };
    vm.runInNewContext(readFileSync(new URL('../pokebonk-autoselect.user.js', import.meta.url), 'utf8'), {
      document, localStorage, MutationObserver, setTimeout(fn) { tarefa = fn; return 1; }, setInterval() {}, Date, Math,
    });
    controles[0].click(); tarefa(); return escolhido;
  }
  const itens = [
    { nome: 'Sitrus Berry', raridade: 'Incomum', descricao: '+10 de HP máx. Ao cair abaixo de 30% de HP, você recupera 35% (a cada 45 s).' },
    { nome: 'White Herb', raridade: 'Incomum', descricao: '+25% de chance de status.' },
    { nome: 'Quick Claw', raridade: 'Incomum', descricao: '+10% de velocidade de ataque.' },
  ];
  assert.equal(simular(itens, ['velocidade ataque', 'sorteio', 'vida']), 'Quick Claw');
  assert.equal(simular(itens, ['sorteio', 'velocidade ataque', 'vida']), 'White Herb');
  assert.equal(simular(itens, ['vida', 'sorteio', 'velocidade ataque']), 'Sitrus Berry');
  assert.equal(simular([...itens, { nome: 'Max Revive', raridade: 'Lendário', descricao: 'Revive uma vez.' }], ['vida']), 'Max Revive');
  assert.equal(simular([{ nome: 'Especial', raridade: 'Épico', descricao: 'Ao atacar, +20% de dano.' }, itens[0]], ['dano', 'vida']), 'Sitrus Berry');
  assert.equal(simular([{ nome: 'Múltiplo', raridade: 'Raro', descricao: '+10% de sorte e +5% de dano.' }, itens[1]], ['dano', 'sorteio']), 'Múltiplo');
  const macho = { nome: 'Macho Brace', raridade: 'Raro', descricao: '+50% de experiência, -10% de velocidade.' };
  assert.equal(simular([macho, { nome: 'Outro', raridade: 'Épico', descricao: '+20% de dano.' }], ['experiencia', 'dano']), 'Macho Brace');
  assert.equal(simular([macho, { nome: 'Max Revive', raridade: 'Lendário', descricao: 'Revive uma vez.' }], ['experiencia']), 'Max Revive');
});

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
  let escolhido; let tarefa; let gravacoes = 0;
  const controles = [];
  const criar = () => ({ style: {}, addEventListener(tipo, fn) { this[tipo] = fn; }, click() { this.click?.(); } });
  const card = (nome) => ({ disabled: false, outerHTML: nome, getClientRects: () => [1],
    querySelector(seletor) {
      if (seletor.includes('blessing.png')) return {};
      if (seletor === 'h3') return { textContent: nome };
      if (seletor === '.rar') return { textContent: 'Comum' };
      return null;
    }, click() { escolhido = nome; } });
  const cartoes = [card('+20% de dano físico'), card('+20% de dano especial'), card('+20% de dano em elites e chefes')];
  const document = { body: { appendChild: (e) => controles.push(e) }, createElement: criar,
    querySelectorAll(seletor) { if (seletor === 'button.card') return cartoes; return []; } };
  const localStorage = { getItem: (k) => memoria.get(k) ?? null, setItem: (k, v) => { gravacoes++; memoria.set(k, v); } };
  class MutationObserver { observe() {} }
  vm.runInNewContext(readFileSync(new URL('../pokebonk-autoselect.user.js', import.meta.url), 'utf8'), {
    document, localStorage, MutationObserver, setTimeout(fn) { tarefa = fn; return 1; }, setInterval() {}, Math, Date,
  });
  controles[0].click(); tarefa();
  assert.equal(escolhido, '+20% de dano especial');
  assert.equal(gravacoes, 0);
});

test('melhoria de fusão equipada participa como golpe mesmo sem selo', () => {
  function simular(ofertas) {
    const cliques = []; const elementos = []; let tarefa;
    const criar = () => ({ style: {}, addEventListener(tipo, fn) { this[tipo] = fn; }, click() { this.click?.(); } });
    const cartoes = ofertas.map(({ nome, tipo, raridade, selo, descricao }) => ({
      disabled: false, outerHTML: nome, getClientRects: () => [1],
      querySelector(seletor) {
        if (seletor === 'h3') return { textContent: nome };
        if (seletor === '.top .typeicon') return tipo === 'golpe' ? {} : null;
        if (seletor.includes('assets/items/')) return tipo === 'vitamina' ? {} : null;
        if (seletor === '.kind') return { textContent: 'MELHORIA' };
        if (seletor === '.rar') return { textContent: raridade };
        if (seletor === '.bd > .sub') return { textContent: descricao };
        if (seletor === '.bp-badge') return selo ? {} : null;
        return null;
      }, click() { cliques.push(nome); },
    }));
    const botoes = ['Atualizar (0) F', 'Pular (3) X', 'Banir (1) Z'].map((textContent) => ({ textContent,
      disabled: textContent.startsWith('Atualizar'), getClientRects: () => [1], click() { cliques.push(textContent); } }));
    const document = { body: { appendChild: (e) => elementos.push(e) }, createElement: criar,
      querySelectorAll(seletor) { if (seletor === 'button.card.offer') return cartoes; if (seletor === 'button') return botoes; return []; } };
    const localStorage = { getItem: () => null, setItem() {} };
    class MutationObserver { observe() {} }
    vm.runInNewContext(readFileSync(new URL('../pokebonk-autoselect.user.js', import.meta.url), 'utf8'), {
      document, localStorage, MutationObserver, setTimeout(fn) { tarefa = fn; return 1; }, setInterval() {}, Math, Date,
    });
    elementos[0].click(); tarefa();
    return cliques;
  }
  const fusao = { nome: 'Maldição Sombria', tipo: 'golpe', raridade: 'Comum', selo: false, descricao: 'Fusão ★1 → ★2 (máx. ★5)' };
  const vitamina = { nome: 'Ether', tipo: 'vitamina', raridade: 'Comum', selo: true, descricao: 'Nível 1 → 2' };
  assert.deepEqual(simular([fusao]), ['Maldição Sombria']);
  assert.deepEqual(simular([vitamina, fusao]), ['Maldição Sombria']);
  assert.deepEqual(simular([{ ...vitamina, raridade: 'Raro' }, fusao]), ['Ether']);
  assert.deepEqual(simular([{ ...fusao, nome: 'Golpe fora do plano', descricao: 'Nível 1 → 2' }]), ['Golpe fora do plano']);
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
