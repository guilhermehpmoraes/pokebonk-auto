import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function preparar(avisos, { semRecursos = false } = {}) {
  let tempo = 1000, compilacao = 'mw88813m', hudVisivel = true;
  const memoria = new Map([['pokebonk-auto-select-fora-da-build', JSON.stringify(avisos)]]);
  class Elemento {
    constructor() { this.style = {}; this.children = []; }
    addEventListener() {} setAttribute() {} append(...itens) { this.children.push(...itens); }
    appendChild(item) { this.children.push(item); } replaceChildren(...itens) { this.children = itens; }
  }
  const body = new Elemento();
  const document = { body, createElement: () => new Elemento(), querySelector(s) { return s === 'meta[name="pokebonk-build"]' ? { content: compilacao } : s === '#hud .wallet' && hudVisivel ? { getClientRects: () => [1] } : null; }, querySelectorAll() { return []; } };
  class MutationObserver { observe() {} }
  const sessionStorage = { getItem: (k) => memoria.get(k) ?? null, setItem: (k, v) => memoria.set(k, v) };
  const catalogo = new Map([['vit-a', { name: 'Vitamina A' }], ['vit-b', { name: 'Vitamina B' }]]);
  const codigo = readFileSync(new URL('../pokebonk-autoselect.user.js', import.meta.url), 'utf8').replaceAll('await import(urls[0])', 'await Promise.resolve(moduloTeste)').replace('new MutationObserver(agendar).observe', 'globalThis.testeAvisos = { definir(i, m, v) { mapaInstancia = i; moduloDadosJogo = m; catalogoVitaminas = v; }, sincronizarAvisosComInventario, carregarCatalogoVitaminas, atualizarVisibilidadeAvisos };\nnew MutationObserver(agendar).observe');
  const ctx = { document, sessionStorage, localStorage: { getItem: () => null }, MutationObserver, window: {}, URL, location: { href: 'https://pokebonk.com/', origin: 'https://pokebonk.com' }, performance: { getEntriesByType: () => semRecursos ? [] : [{ name: 'https://pokebonk.com/assets/defineProperty-teste.js' }] }, moduloTeste: { ao: catalogo }, setTimeout() {}, setInterval() {}, Date: { now: () => tempo }, Math };
  vm.runInNewContext(codigo, ctx);
  const player = { moveSlots: 4, roster: { id: 1 }, moves: [], vitamins: new Map() };
  const run = { state: 'play', player }, instancia = { run }; run.interactables = instancia;
  const defs = { 8: { name: 'Swift' }, 9: { name: 'Outro' } };
  ctx.testeAvisos.definir(instancia, { Qi: (id) => defs[id] }, catalogo);
  return { player, run, instancia, catalogo, api: ctx.testeAvisos, body, memoria, setHud(valor) { hudVisivel = valor; }, setCompilacao(valor) { compilacao = valor; }, passar(ms = 600) { tempo += ms; }, avisos() { return JSON.parse(memoria.get('pokebonk-auto-select-fora-da-build')); } };
}

const movimento = (nome) => ({ def: { name: nome }, parents: [], link: null });
const aviso = (nome, tipo = 'golpe') => ({ nome, tipo });

test('oculta avisos fora da partida e os recupera sem apagar dados ao voltar', () => {
  const t = preparar([aviso('Swift')]);
  const painel = t.body.children.find((el) => el.children?.[2]?.children?.[0]?.textContent === 'Swift (golpe)');
  assert.equal(painel.style.display, 'block');
  t.setHud(false); t.api.atualizarVisibilidadeAvisos();
  assert.equal(painel.style.display, 'none');
  assert.deepEqual(t.avisos(), [aviso('Swift')]);
  t.setHud(true); t.api.atualizarVisibilidadeAvisos();
  assert.equal(painel.style.display, 'block');
  t.player.moves = [null, null, null, null];
  t.api.sincronizarAvisosComInventario(); t.passar(); t.api.sincronizarAvisosComInventario();
  assert.deepEqual(t.avisos(), []);
  assert.equal(painel.style.display, 'none');
});

test('aviso some individualmente após confirmar remoção, sem botão manual', () => {
  const t = preparar([aviso('Swift'), aviso('Scary Face'), aviso('Burning Jealousy')]);
  t.player.moves = [movimento('Swift'), movimento('Scary Face'), movimento('Burning Jealousy'), null];
  t.api.sincronizarAvisosComInventario(); t.passar(); t.api.sincronizarAvisosComInventario();
  assert.equal(t.avisos().length, 3);
  const painel = t.body.children.find((el) => el.children?.[2]?.children?.[0]?.textContent === 'Swift (golpe)');
  assert.equal(painel.children[2].children.length, 1);
  t.player.moves[1] = null;
  t.api.sincronizarAvisosComInventario(); assert.equal(t.avisos().length, 3);
  t.passar(); t.api.sincronizarAvisosComInventario();
  assert.deepEqual(t.avisos(), [aviso('Swift'), aviso('Burning Jealousy')]);
  t.player.moves = [null, null, null, null];
  t.api.sincronizarAvisosComInventario(); t.passar(); t.api.sincronizarAvisosComInventario();
  assert.deepEqual(t.avisos(), []); assert.equal(painel.style.display, 'none');
});

test('preserva ingredientes de fusão e aguarda se não conseguir identificá-los', () => {
  const t = preparar([aviso('Swift')]);
  t.player.moves = [{ def: { name: 'Fusão' }, parents: [8], link: null }, null, null, null];
  t.api.sincronizarAvisosComInventario(); t.passar(); t.api.sincronizarAvisosComInventario();
  assert.deepEqual(t.avisos(), [aviso('Swift')]);
  t.api.definir(t.instancia, null, t.catalogo);
  t.player.moves[0].parents = [999];
  t.api.sincronizarAvisosComInventario(); t.passar(); t.api.sincronizarAvisosComInventario();
  assert.deepEqual(t.avisos(), [aviso('Swift')]);
});

test('reconcilia vitaminas pelo catálogo e preserva dados incompletos', () => {
  const t = preparar([aviso('Vitamina A', 'vitamina'), aviso('Vitamina B', 'vitamina')]);
  t.player.moves = [null, null, null, null]; t.player.vitamins.set('vit-a', {}); t.player.vitamins.set('vit-b', {});
  t.api.sincronizarAvisosComInventario(); t.passar(); t.api.sincronizarAvisosComInventario();
  t.player.vitamins.delete('vit-a'); t.api.sincronizarAvisosComInventario(); t.passar(); t.api.sincronizarAvisosComInventario();
  assert.deepEqual(t.avisos(), [aviso('Vitamina B', 'vitamina')]);
  t.player.vitamins.clear(); t.player.vitamins.set('desconhecida', {});
  t.api.sincronizarAvisosComInventario(); t.passar(); t.api.sincronizarAvisosComInventario();
  assert.deepEqual(t.avisos(), [aviso('Vitamina B', 'vitamina')]);
  t.instancia.disposed = true; t.player.vitamins.clear();
  t.api.sincronizarAvisosComInventario(); t.passar(); t.api.sincronizarAvisosComInventario();
  assert.deepEqual(t.avisos(), [aviso('Vitamina B', 'vitamina')]);
});

test('não apaga avisos em outra compilação ou com inventário incompleto', () => {
  const t = preparar([aviso('Swift')]);
  t.player.moves = [null, null, null, null]; t.setCompilacao('outra');
  t.api.sincronizarAvisosComInventario(); t.passar(); t.api.sincronizarAvisosComInventario();
  assert.deepEqual(t.avisos(), [aviso('Swift')]);
  t.setCompilacao('mw88813m'); t.player.moves = [null];
  t.api.sincronizarAvisosComInventario(); t.passar(); t.api.sincronizarAvisosComInventario();
  assert.deepEqual(t.avisos(), [aviso('Swift')]);
});

test('aguarda catálogo de vitaminas sem impedir a atualização dos avisos de ataques', async () => {
  const t = preparar([aviso('Swift'), aviso('Vitamina A', 'vitamina')]);
  t.player.moves = [null, null, null, null];
  t.api.definir(t.instancia, null, null);
  t.api.sincronizarAvisosComInventario(); t.passar(); t.api.sincronizarAvisosComInventario();
  assert.deepEqual(t.avisos(), [aviso('Vitamina A', 'vitamina')]);
  t.passar(3000); await t.api.carregarCatalogoVitaminas();
  t.api.sincronizarAvisosComInventario(); t.passar(); t.api.sincronizarAvisosComInventario();
  assert.deepEqual(t.avisos(), []);
});

test('carrega catálogo conhecido sem registro de recurso e remove vitamina ausente', async () => {
  const t = preparar([aviso('Vitamina A', 'vitamina')], { semRecursos: true });
  t.player.moves = [null, null, null, null];
  t.api.definir(t.instancia, null, null);
  t.passar(3000); await t.api.carregarCatalogoVitaminas();
  t.api.sincronizarAvisosComInventario(); t.passar(); t.api.sincronizarAvisosComInventario();
  assert.deepEqual(t.avisos(), []);
});
