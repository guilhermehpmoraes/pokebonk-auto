import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function preparar() {
  const controles = [], tarefas = [];
  let modal = null, prompt = null, build = 'mw88813m', ofertas = []; const eventos = [];
  const defs = Array.from({ length: 7 }, (_, i) => ({ id: i + 1, key: `golpe-${i + 1}`, name: `Golpe ${i + 1}`, type: 'normal' }));
  const pares = [{ id: 'assinatura', pares: [[1, 2]], nome: 'Fusão especial' }, { id: 'tipo', pares: [[1, 3], [3, 4], [3, 5]], nome: 'Fusão tipo' }, { id: 'terceira', pares: [[5, 6]], nome: 'Fusão final' }];
  const modulo = { Qi: (id) => defs.find((d) => d.id === id), Dr: ({ player }) => pares.flatMap((r) => r.pares.map(([a, b]) => ({ a: player.moves.findIndex((m) => m.def.id === a), b: player.moves.findIndex((m) => m.def.id === b), r: { key: r.id, name: r.nome } }))) };
  const player = { moveSlots: 4, roster: { id: 106 }, moves: [1, 2, 3, 4].map((id) => ({ def: defs[id - 1], level: 8, parents: [] })) };
  const run = { player, planSnap: { moves: defs.map((d) => d.id), fus: pares.map((p) => p.id), links: [] }, fusions: [], banished: new Set(), state: 'play' };
  const instancia = { run }; run.interactables = instancia;
  const comandos = ['Banir (0)', 'Atualizar (0)', 'Pular (0)'].map((textContent) => ({ textContent, disabled: true, getClientRects: () => [1] }));
  const document = { body: { appendChild: (el) => controles.push(el) }, createElement: () => ({ style: {}, addEventListener(tipo, fn) { this[tipo] = fn; }, setAttribute() {}, append() {}, replaceChildren() {} }), querySelector(s) { return s === 'meta[name="pokebonk-build"]' ? { content: build } : null; }, querySelectorAll(s) { return s === '.modal' && modal ? [modal] : s === '#hud .prompt' && prompt ? [prompt] : s === 'button.card.offer' ? ofertas : s === 'button' ? comandos : []; } };
  class MutationObserver { observe() {} }
  class KeyboardEvent { constructor(type) { this.type = type; } }
  const codigo = readFileSync(new URL('../pokebonk-autoselect.user.js', import.meta.url), 'utf8').replace('new MutationObserver(agendar).observe', 'globalThis.testeBuild = { iniciar(i, m) { mapaInstancia = i; moduloDadosJogo = m; ativo = true; pickupAtivo = true; }, estadoPlanoPartida, observarBuildEspecial, observarPickup, observar };\nnew MutationObserver(agendar).observe');
  const ctx = { document, localStorage: { getItem: () => null }, sessionStorage: { getItem: () => null, setItem() {} }, MutationObserver, KeyboardEvent, window: { dispatchEvent(e) { eventos.push(e.type); } }, setTimeout(fn) { tarefas.push(fn); }, setInterval() {}, Date, Math, Set };
  vm.runInNewContext(codigo, ctx); ctx.testeBuild.iniciar(instancia, modulo);
  return { api: ctx.testeBuild, player, run, defs, pares, eventos, setOfertas: (o) => { ofertas = o; }, setPrompt: (p) => { prompt = p; }, setModal: (m) => { modal = m; }, setBuild: (b) => { build = b; } };
}

test('ao subir de nível prioriza ingrediente específico e espera se a build do jogo for desconhecida', () => {
  const t = preparar(), acoes = [];
  t.player.moves = [1, 3].map((id) => ({ def: t.defs[id - 1], level: 8, parents: [] }));
  t.setOfertas([2, 4].map((id) => ({ disabled: false, outerHTML: `golpe-${id}`, getClientRects: () => [1], querySelector(s) { return s === 'h3' ? { textContent: `Golpe ${id}` } : s === '.kind' ? { textContent: 'NOVO' } : s === '.top .typeicon' || s === '.bp-badge' ? {} : null; }, click() { acoes.push(id); } })));
  t.setBuild('versao-desconhecida'); t.api.observar(); assert.deepEqual(acoes, []);
  t.setBuild('mw88813m'); t.api.observar(); assert.deepEqual(acoes, [2]);
});

test('pickup abre Bill só com fusão segura pronta e identifica versão incompatível', () => {
  const t = preparar();
  t.setPrompt({ getClientRects: () => [1], textContent: 'EMáquina do Bill · uma fusão, a escolher entre 3 pares', querySelector: () => ({ textContent: 'E' }) });
  t.setBuild('outra'); t.api.observarPickup(); assert.deepEqual(t.eventos, []);
  t.setBuild('mw88813m'); t.api.observarPickup(); assert.deepEqual(t.eventos, ['keydown']);
});

test('reconhece o plano da partida e bloqueia compilação desconhecida', () => {
  const t = preparar();
  const estado = t.api.estadoPlanoPartida();
  assert.equal(estado.receitas.length, 3);
  assert.deepEqual(Array.from(estado.decisao.fundir, (f) => f.id), ['assinatura', 'tipo']);
  t.setBuild('versao-desconhecida');
  assert.equal(t.api.estadoPlanoPartida(), null);
});

test('seleciona fusão planejada segura e confirma somente modo fundir', () => {
  const t = preparar(), acoes = [];
  const linha = { disabled: false, classList: { contains: (c) => c === 'sel' }, querySelector(s) { return s === '.bm-pair' ? { textContent: 'Golpe 1 + Golpe 2' } : s === '.bm-rtx b' ? { textContent: 'Fusão especial' } : null; } };
  const botao = { disabled: false, textContent: 'Fundir em Fusão especial', click() { acoes.push('fundir'); } };
  const cartao = { querySelector: () => ({ textContent: 'Fusão especial' }) };
  const bill = { querySelectorAll: () => [linha], querySelector(s) { return s === '.bm-card.fuse' ? cartao : s === 'button.bm-go.fuse' ? botao : null; } };
  t.setModal({ getClientRects: () => [1], querySelector(s) { return s === '.bm-win' ? bill : null; } });
  assert.equal(t.api.observarBuildEspecial(), true);
  assert.deepEqual(acoes, ['fundir']);
});

test('não funde par flexível que consome ingrediente de fusão específica', () => {
  const t = preparar(), acoes = [];
  const linha = { disabled: false, classList: { contains: (c) => c === 'sel' }, querySelector(s) { return s === '.bm-pair' ? { textContent: 'Golpe 1 + Golpe 3' } : s === '.bm-rtx b' ? { textContent: 'Fusão tipo' } : null; } };
  const botao = { disabled: false, textContent: 'Fundir em Fusão tipo', click() { acoes.push('fundir'); } };
  const bill = { querySelectorAll: () => [linha], querySelector(s) { return s === 'button.bm-go.fuse' ? botao : null; } };
  t.setModal({ getClientRects: () => [1], querySelector(s) { return s === '.bm-win' ? bill : null; } });
  assert.equal(t.api.observarBuildEspecial(), true);
  assert.deepEqual(acoes, []);
});

test('lição do Hypno guarda oferta sem golpe seguro e ignora dados desconhecidos', () => {
  const t = preparar(), acoes = [];
  t.player.moves = [1, 2, 3].map((id) => ({ def: t.defs[id - 1], level: 8, parents: [] }));
  const card = { outerHTML: 'golpe desconhecido', querySelector(s) { return s === 'h3' ? { textContent: 'Golpe fora do plano' } : s === '.kind' ? { textContent: 'NOVO' } : null; } };
  const botao = { textContent: 'Agora não (guardar a lição)', disabled: false, click() { acoes.push('guardar'); } };
  t.setModal({ getClientRects: () => [1], classList: { contains: (c) => c === 'hy-modal' }, querySelector(s) { return s === 'h1' ? { textContent: 'Hypno te ensina' } : null; }, querySelectorAll(s) { return s === '.cards > button.card.offer' ? [card] : s === '.actions button' ? [botao] : []; } });
  assert.equal(t.api.observarBuildEspecial(), true);
  assert.deepEqual(acoes, ['guardar']);
});

test('lição prioriza ingrediente específico quando mais de uma oferta é segura', () => {
  const t = preparar(), acoes = [];
  t.player.moves = [1, 3].map((id) => ({ def: t.defs[id - 1], level: 8, parents: [] }));
  const cartoes = [2, 4].map((id) => ({ outerHTML: `golpe-${id}`, querySelector(s) { return s === 'h3' ? { textContent: `Golpe ${id}` } : s === '.kind' ? { textContent: 'NOVO' } : null; }, click() { acoes.push(id); } }));
  t.setModal({ getClientRects: () => [1], classList: { contains: (c) => c === 'hy-modal' }, querySelector(s) { return s === 'h1' ? { textContent: 'Hypno te ensina' } : null; }, querySelectorAll(s) { return s === '.cards > button.card.offer' ? cartoes : []; } });
  assert.equal(t.api.observarBuildEspecial(), true);
  assert.deepEqual(acoes, [2]);
});

test('Hypno remove só ataque comum comprovadamente fora do plano', () => {
  const t = preparar(), acoes = [];
  t.player.moves[3] = { def: { id: 8, key: 'errado', name: 'Golpe errado', type: 'normal' }, level: 4, parents: [] };
  const botao = { disabled: false, textContent: 'Esquecer (+32 ₽)', click() { acoes.push('esquecer'); } };
  const linha = { querySelector(s) { if (s === 'h4') return { textContent: 'Golpe errado · Nv. 4' }; if (s === '.hy-share') return {}; if (s === 'button') return botao; return null; } };
  const lista = { querySelectorAll: () => [linha] };
  t.setModal({ getClientRects: () => [1], classList: { contains: (c) => c === 'hy-modal' }, querySelector(s) { return s === 'h1' ? { textContent: 'Hypno' } : null; }, querySelectorAll(s) { return s === '.hy-list' ? [lista] : []; } });
  assert.equal(t.api.observarBuildEspecial(), true);
  assert.deepEqual(acoes, ['esquecer']);
});

test('Hypno libera o golpe do plano que comprovadamente destrava a sequência', () => {
  const t = preparar(), acoes = [];
  t.run.planSnap.fus = ['assinatura', 'terceira', 'outra'];
  t.pares.splice(0, t.pares.length, { id: 'assinatura', pares: [[1, 2]], nome: 'A' }, { id: 'terceira', pares: [[3, 4]], nome: 'B' }, { id: 'outra', pares: [[5, 6]], nome: 'C' });
  t.player.moves = [1, 3, 5, 7].map((id) => ({ def: t.defs[id - 1], level: 8, parents: [] }));
  const botao = { disabled: false, textContent: 'Esquecer (+64 ₽)', click() { acoes.push('Golpe 7'); } };
  const linha = { querySelector(s) { return s === 'h4' ? { textContent: 'Golpe 7 · Nv. 8' } : s === '.hy-share' ? {} : s === 'button' ? botao : null; } };
  const lista = { querySelectorAll: () => [linha] };
  t.setModal({ getClientRects: () => [1], classList: { contains: (c) => c === 'hy-modal' }, querySelector(s) { return s === 'h1' ? { textContent: 'Hypno' } : null; }, querySelectorAll(s) { return s === '.hy-list' ? [lista] : []; } });
  assert.equal(t.api.observarBuildEspecial(), true);
  assert.deepEqual(acoes, ['Golpe 7']);
});

test('não age quando há fusão desconhecida ou ataques unidos', () => {
  const t = preparar();
  t.player.moves[0] = { def: { key: 'fusao-fora', fusion: {}, id: 99 }, level: 1, parents: [1, 2] };
  assert.equal(t.api.estadoPlanoPartida(), null);
  t.player.moves[0] = { def: t.defs[0], level: 8, parents: [], link: { def: t.defs[1] } };
  assert.equal(t.api.estadoPlanoPartida(), null);
});
