import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

test('painel lê objetos ainda não descobertos e atualiza a reserva ao coletar', async () => {
  let intervalo, compilacao = 'mw6akj2h'; const controles = [], tarefas = [];
  class Objetos { constructor() { this.list = [{ kind: 'chest', used: false }, { kind: 'chest', used: false }, { kind: 'cage', used: false }]; this.run = { interactables: this, chestsBought: 0 }; } markers() { return this.list.filter((o) => !o.used); } chestCost() { return 18; } add() {} }
  const chip = (n) => ({ getClientRects: () => [1], querySelector: () => ({ textContent: String(n) }) });
  const carteira = { getClientRects: () => [1], dataset: { g: '1000', k: '1000|18|40|40' }, querySelector(s) { return s === '.wl-ball' ? chip(18) : chip(40); } };
  const document = { body: { appendChild: (el) => controles.push(el) }, createElement: () => ({ style: {}, addEventListener(tipo, fn) { this[tipo] = fn; } }), querySelector(s) { return s === '#hud .wallet' ? carteira : s === '#hud .ht-zone' ? { textContent: 'Zona 1/3' } : s === 'meta[name="pokebonk-build"]' ? { content: compilacao } : null; }, querySelectorAll: () => [] };
  class MutationObserver { observe() {} }
  const codigo = readFileSync(new URL('../pokebonk-autoselect.user.js', import.meta.url), 'utf8').replace('await import(urls[0])', 'await Promise.resolve(moduloTeste)');
  vm.runInNewContext(codigo, { document, localStorage: { getItem: () => null }, MutationObserver, window: {}, URL, location: { href: 'https://pokebonk.com/', origin: 'https://pokebonk.com' }, performance: { getEntriesByType: () => [{ name: 'https://pokebonk.com/assets/menus-abc.js' }] }, moduloTeste: { Objetos }, setTimeout(fn) { tarefas.push(fn); }, setInterval(fn) { intervalo = fn; }, Date: { now: () => 10000 }, Math });
  const executar = () => { const pendentes = tarefas.splice(0); pendentes.forEach((fn) => fn()); };
  intervalo(); executar(); await Promise.resolve(); await Promise.resolve();
  const objetos = new Objetos(); objetos.markers(); intervalo(); executar();
  assert.match(controles[4].textContent, /Pokébolas pagas: 2/);
  assert.match(controles[4].textContent, /Jaulas: 1/);
  assert.match(controles[4].textContent, /Bolas pagas no saldo: 2\/2/);
  objetos.list[0].used = true; intervalo(); executar();
  assert.match(controles[4].textContent, /Pokébolas pagas: 1/);
  compilacao = 'versao-desconhecida'; intervalo(); executar();
  assert.match(controles[4].textContent, /estimativa indisponível/);
  objetos.disposed = true; intervalo(); executar();
  assert.match(controles[4].textContent, /Aguardando dados/);
});
