import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

test('Auto Fenda começa desligado, independe do pickup e respeita os bloqueios', async () => {
  let intervalo, tempo = 10000, bloqueio = null, pronta = true, modalAberto = false, aviso = '';
  const controles = [], tarefas = [], eventos = [];
  class Objetos {
    constructor() { this.list = []; this.run = { interactables: this, chestsBought: 0, state: 'play', player: { dead: false }, rifts: { useBlock: () => bloqueio, nearEntrance: () => true, enterBlock: () => null, entranceLabel: () => '[E] Entrar na Fenda de Fogo (Rara) · 30 s de ondas e seu Alfa' }, teamRifts: { enabled: false } }; }
    markers() { return this.list; } chestCost() { return 18; } add() {}
  }
  const chip = (n) => ({ getClientRects: () => [1], querySelector: () => ({ textContent: String(n) }) });
  const carteira = { getClientRects: () => [1], dataset: { g: '1000', k: '1000|18|40|40' }, querySelector(s) { return s === '.wl-ball' ? chip(18) : chip(40); } };
  const fenda = { getClientRects: () => [1], classList: { contains: (s) => s === 'ready' && pronta }, querySelector: () => ({ textContent: 'C' }) };
  const prompt = { getClientRects: () => [1], get textContent() { return `E${aviso}`; }, querySelector: () => ({ textContent: 'E' }) };
  const document = { body: { appendChild: (el) => controles.push(el) }, createElement: () => ({ style: {}, addEventListener(tipo, fn) { this[tipo] = fn; } }), querySelector(s) { return s === '#hud .wallet' ? carteira : s === '#hud .ht-zone' ? { textContent: 'Zona 1/3' } : s === '#hud .inc' ? fenda : null; }, querySelectorAll(s) { return s === '.modal' && modalAberto ? [{ getClientRects: () => [1] }] : s === '#hud .prompt' && aviso ? [prompt] : []; } };
  class MutationObserver { observe() {} }
  class KeyboardEvent { constructor(tipo, dados) { this.type = tipo; this.code = dados.code; } }
  const codigo = readFileSync(new URL('../pokebonk-autoselect.user.js', import.meta.url), 'utf8').replace('await import(urls[0])', 'await Promise.resolve(moduloTeste)');
  vm.runInNewContext(codigo, { document, localStorage: { getItem: () => null }, MutationObserver, KeyboardEvent, window: { innerHeight: 900, dispatchEvent(e) { eventos.push(`${e.type}:${e.code}`); } }, URL, location: { href: 'https://pokebonk.com/', origin: 'https://pokebonk.com' }, performance: { getEntriesByType: () => [{ name: 'https://pokebonk.com/assets/menus-abc.js' }] }, moduloTeste: { Objetos }, setTimeout(fn) { tarefas.push(fn); }, setInterval(fn) { intervalo = fn; }, Date: { now: () => tempo }, Math });
  const executar = () => { const pendentes = tarefas.splice(0); pendentes.forEach((fn) => fn()); };
  const tick = () => { intervalo(); executar(); executar(); };
  tick(); await Promise.resolve(); await Promise.resolve(); const objetos = new Objetos(); objetos.markers(); tick();
  assert.equal(controles[5].textContent, 'Auto Fenda: desligado');
  assert.equal(controles[5].style.bottom, '8px');
  assert.equal(controles[3].style.bottom, '42px');
  assert.equal(controles[4].style.bottom, '76px');
  assert.deepEqual(eventos, []);
  // O pickup ligado não abre nem entra na Fenda enquanto o controle dela estiver desligado.
  controles[2].click(); executar(); executar();
  aviso = 'Entrar na Fenda de Fogo (Rara) · 30 s de ondas e seu Alfa'; tick();
  assert.deepEqual(eventos, []);
  controles[2].click(); aviso = ''; executar(); executar();
  // A Fenda funciona mesmo com o pickup desligado.
  controles[5].click(); executar(); executar();
  assert.equal(controles[5].textContent, 'Auto Fenda: ligado');
  assert.deepEqual(eventos, ['keydown:KeyC', 'keyup:KeyC']);
  tick(); assert.equal(eventos.length, 2);
  tempo += 2500; bloqueio = 'Já existe uma fenda'; tick(); assert.equal(eventos.length, 2);
  bloqueio = null; pronta = false; tick(); assert.equal(eventos.length, 2);
  pronta = true; modalAberto = true; tick(); assert.equal(eventos.length, 2);
  modalAberto = false; objetos.run.state = 'paused'; tick(); assert.equal(eventos.length, 2);
  objetos.run.state = 'play'; tick(); assert.equal(eventos.length, 4);
  bloqueio = 'Já existe uma fenda'; aviso = 'Entrar no portal da próxima zona'; tick(); assert.equal(eventos.length, 4);
  aviso = 'Entrar na Fenda de Fogo (Rara) · 30 s de ondas e seu Alfa'; tick();
  assert.deepEqual(eventos.slice(-2), ['keydown:KeyE', 'keyup:KeyE']);
  controles[5].click(); executar(); executar();
  assert.equal(controles[5].textContent, 'Auto Fenda: desligado');
  tempo += 4000; aviso = ''; tick();
  aviso = 'Entrar na Fenda de Fogo (Rara) · 30 s de ondas e seu Alfa'; tick(); assert.equal(eventos.length, 6);
  // As chamadas de onda continuam sendo interações do pickup.
  controles[2].click(); executar(); executar();
  assert.equal(eventos.length, 6);
  aviso = 'Chamar a onda 2/6 já'; tick();
  assert.equal(eventos.length, 8);
  tick(); assert.equal(eventos.length, 8);
  aviso = 'Chamar a onda 3/6 já'; tick();
  assert.equal(eventos.length, 10);
  aviso = 'Chamar a onda 7/6 já'; tick(); assert.equal(eventos.length, 10);
  controles[2].click(); aviso = 'Chamar a onda 4/6 já'; tick(); assert.equal(eventos.length, 10);
});
