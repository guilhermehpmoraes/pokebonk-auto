import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function preparar() {
  const controles = [], tarefas = [];
  let modal = null, prompt = null, build = 'mw88813m', ofertas = []; const eventos = [];
  const defs = Array.from({ length: 7 }, (_, i) => ({ id: i + 1, key: `golpe-${i + 1}`, name: `Golpe ${i + 1}`, type: 'normal' }));
  const pares = [{ id: 'assinatura', pares: [[1, 2]], nome: 'Fusão especial' }, { id: 'tipo', pares: [[1, 3], [3, 4], [3, 5]], nome: 'Fusão tipo' }, { id: 'terceira', pares: [[5, 6]], nome: 'Fusão final' }];
  const modulo = { Qi: (id) => defs.find((d) => d.id === id), Dr: ({ player }) => player.moves.flatMap((m, a) => !m || m.link || m.def.fusion ? [] : player.moves.flatMap((n, b) => {
    if (b <= a || !n || n.link || n.def.fusion) return [];
    const receita = pares.find((r) => r.pares.some((par) => par.includes(m.def.id) && par.includes(n.def.id)));
    return [{ a, b, boon: {}, r: { key: receita?.id ?? 'glitch', name: receita?.nome ?? 'MissingNo.' } }];
  })) };
  modulo['$i'] = modulo.Qi; modulo.Or = modulo.Dr;
  const player = { moveSlots: 4, roster: { id: 106 }, moves: [1, 2, 3, 4].map((id) => ({ def: defs[id - 1], level: 8, parents: [] })) };
  const run = { player, planSnap: { moves: defs.map((d) => d.id), fus: pares.map((p) => p.id), links: [] }, fusions: [], banished: new Set(), state: 'play' };
  const instancia = { run }; run.interactables = instancia;
  const comandos = ['Banir (0)', 'Atualizar (0)', 'Pular (0)'].map((textContent) => ({ textContent, disabled: true, getClientRects: () => [1] }));
  const document = { body: { appendChild: (el) => controles.push(el) }, createElement: () => ({ style: {}, addEventListener(tipo, fn) { this[tipo] = fn; }, setAttribute() {}, append() {}, replaceChildren() {} }), querySelector(s) { return s === 'meta[name="pokebonk-build"]' ? { content: build } : null; }, querySelectorAll(s) { return s === '.modal' && modal ? [modal] : s === '#hud .prompt' && prompt ? [prompt] : s === 'button.card.offer' ? ofertas : s === 'button' ? comandos : []; } };
  class MutationObserver { observe() {} }
  class KeyboardEvent { constructor(type) { this.type = type; } }
  const codigo = readFileSync(new URL('../pokebonk-autoselect.user.js', import.meta.url), 'utf8').replace('new MutationObserver(agendar).observe', 'globalThis.testeBuild = { iniciar(i, m) { mapaInstancia = i; moduloDadosJogo = m; ativo = true; pickupAtivo = true; }, setPickup(valor) { pickupAtivo = valor; }, estadoPlanoPartida, observarBuildEspecial, observarPickup, observar };\nnew MutationObserver(agendar).observe');
  const ctx = { document, localStorage: { getItem: () => null }, sessionStorage: { getItem: () => null, setItem() {} }, MutationObserver, KeyboardEvent, window: { dispatchEvent(e) { eventos.push(e.type); } }, setTimeout(fn) { tarefas.push(fn); }, setInterval() {}, Date, Math, Set };
  vm.runInNewContext(codigo, ctx); ctx.testeBuild.iniciar(instancia, modulo);
  return { api: ctx.testeBuild, player, run, defs, pares, eventos, controles, comandos, setOfertas: (o) => { ofertas = o; }, setPrompt: (p) => { prompt = p; }, setModal: (m) => { modal = m; }, setBuild: (b) => { build = b; } };
}

function telaComUltimoEspaco({ banimentos = 0, atualizacoes = 0, pulos = 0 } = {}) {
  const t = preparar(), acoes = []; let fase = 'normal'; const selos = new Set([7]);
  t.pares.splice(0, t.pares.length, { id: 'assinatura', pares: [[1, 2]], nome: 'A' }, { id: 'terceira', pares: [[3, 4]], nome: 'B' }, { id: 'tipo', pares: [[5, 6]], nome: 'C' });
  t.run.fusions = ['assinatura', 'terceira'];
  t.player.moves = [{ def: { id: 90, key: 'assinatura', fusion: {} }, level: 6, parents: [1, 2] }, { def: { id: 91, key: 'terceira', fusion: {} }, level: 6, parents: [3, 4] }, { def: t.defs[4], level: 10, parents: [] }, null];
  for (const [indice, nome, quantidade] of [[0, 'Banir', banimentos], [1, 'Atualizar', atualizacoes], [2, 'Pular', pulos]]) {
    t.comandos[indice].textContent = `${nome} (${quantidade})`;
    t.comandos[indice].disabled = quantidade === 0;
    t.comandos[indice].click = () => { acoes.push(nome); if (nome === 'Banir') { fase = 'escolher'; t.comandos[0].textContent = 'Escolha o que banir'; } };
  }
  const card = (id) => ({ disabled: false, outerHTML: `golpe-${id}`, getClientRects: () => [1], querySelector(s) { return s === 'h3' ? { textContent: `Golpe ${id}` } : s === '.kind' ? { textContent: 'NOVO' } : s === '.top .typeicon' || (s === '.bp-badge' && selos.has(id)) ? {} : null; }, click() { acoes.push(`Golpe ${id}`); if (fase === 'escolher') { fase = 'confirmar'; t.comandos[0].textContent = `Banir Golpe ${id}? Toque outra vez`; } else if (fase === 'confirmar') fase = 'finalizado'; } });
  t.setOfertas([card(10), card(11), card(7), card(12)]);
  return { t, acoes, marcarPlanejado: (id) => selos.add(id) };
}

test('com o último espaço reservado bane uma oferta fora do plano antes de atualizar', () => {
  const { t, acoes } = telaComUltimoEspaco({ banimentos: 6, atualizacoes: 8, pulos: 8 });
  t.api.observar(); t.api.observar(); t.api.observar();
  assert.deepEqual(acoes, ['Banir', 'Golpe 10', 'Golpe 10']);
  assert.ok(!acoes.includes('Golpe 7'));
});

test('interrompe o banimento se um selo de plano mudar', () => {
  const { t, acoes, marcarPlanejado } = telaComUltimoEspaco({ banimentos: 6, atualizacoes: 8, pulos: 8 });
  t.api.observar(); marcarPlanejado(10); t.api.observar();
  assert.deepEqual(acoes, ['Banir']);
});

test('interrompe o banimento se o plano da partida mudar', () => {
  const { t, acoes } = telaComUltimoEspaco({ banimentos: 6, atualizacoes: 8, pulos: 8 });
  t.api.observar(); t.run.planSnap.moves = [...t.run.planSnap.moves, 8]; t.api.observar();
  assert.deepEqual(acoes, ['Banir']);
});

test('atualiza se todas as ofertas tiverem selo e não houver alvo seguro para banir', () => {
  const { t, acoes, marcarPlanejado } = telaComUltimoEspaco({ banimentos: 6, atualizacoes: 8, pulos: 8 });
  [10, 11, 12].forEach(marcarPlanejado);
  t.api.observar(); assert.deepEqual(acoes, ['Atualizar']);
});

test('sem banimentos atualiza uma vez, preservando o golpe planejado', () => {
  const { t, acoes } = telaComUltimoEspaco({ atualizacoes: 8, pulos: 8 });
  t.api.observar(); t.api.observar();
  assert.deepEqual(acoes, ['Atualizar']);
});

test('sem atualizações pula; sem recursos aceita apenas golpe temporário reversível', () => {
  const pulo = telaComUltimoEspaco({ pulos: 8 });
  pulo.t.api.observar(); assert.deepEqual(pulo.acoes, ['Pular']);
  const temporario = telaComUltimoEspaco();
  temporario.t.api.observar(); assert.deepEqual(temporario.acoes, ['Golpe 7']);
  temporario.t.player.moves[3] = { def: temporario.t.defs[6], level: 1, parents: [] };
  assert.ok(temporario.t.api.estadoPlanoPartida().ceder.includes(7));
});

test('aguarda quando não pode confirmar os recursos da tela', () => {
  const { t, acoes } = telaComUltimoEspaco();
  t.comandos[1].textContent = 'Atualizar'; t.comandos[1].disabled = false;
  t.api.observar(); assert.deepEqual(acoes, []);
});

test('uma melhoria já adquirida continua precedendo o gasto de atualização', () => {
  const { t, acoes } = telaComUltimoEspaco({ atualizacoes: 8, pulos: 8 });
  const card = (nome, novo) => ({ disabled: false, outerHTML: nome, getClientRects: () => [1], querySelector(s) {
    if (s === 'h3') return { textContent: nome };
    if (s === '.kind') return { textContent: novo ? 'NOVO' : 'MELHORIA' };
    if (s === '.top .typeicon') return {};
    if (s === '.bp-badge' && novo) return {};
    if (s === '.rar') return { textContent: 'Comum' };
    return null;
  }, click() { acoes.push(nome); } });
  t.setOfertas([card('Golpe 7', true), card('Melhoria adquirida', false)]);
  t.api.observar(); assert.deepEqual(acoes, ['Melhoria adquirida']);
});

test('ao subir de nível prioriza ingrediente específico e espera se a build do jogo for desconhecida', () => {
  const t = preparar(), acoes = [];
  t.player.moves = [1, 3].map((id) => ({ def: t.defs[id - 1], level: 8, parents: [] }));
  t.setOfertas([2, 4].map((id) => ({ disabled: false, outerHTML: `golpe-${id}`, getClientRects: () => [1], querySelector(s) { return s === 'h3' ? { textContent: `Golpe ${id}` } : s === '.kind' ? { textContent: 'NOVO' } : s === '.top .typeicon' || s === '.bp-badge' ? {} : null; }, click() { acoes.push(id); } })));
  t.setBuild('versao-desconhecida'); t.api.observar(); assert.deepEqual(acoes, []);
  assert.match(t.controles[2].textContent, /Plano: versão do jogo não reconhecida/);
  t.setBuild('mw88813m'); t.api.observar(); assert.deepEqual(acoes, [2]);
});

test('level-up escolhe golpe planejado com espaço livre e ataque errado removível', () => {
  const t = preparar(), acoes = [];
  t.pares.splice(0, t.pares.length, { id: 'assinatura', pares: [[1, 2]], nome: 'A' }, { id: 'tipo', pares: [[3, 4]], nome: 'B' }, { id: 'terceira', pares: [[5, 6]], nome: 'C' });
  t.defs[0].name = 'Fire Pledge'; t.defs[2].name = 'Magma Storm';
  t.player.moves = [{ def: { id: 8, key: 'fora', name: 'Swift', type: 'normal' }, level: 8, parents: [] }, null, null, null];
  const card = (id, nome, plano) => ({ disabled: false, outerHTML: `golpe-${id}`, getClientRects: () => [1], querySelector(s) { return s === 'h3' ? { textContent: nome } : s === '.kind' ? { textContent: 'NOVO' } : s === '.top .typeicon' || (s === '.bp-badge' && plano) ? {} : null; }, click() { acoes.push(id); } });
  t.setOfertas([card(1, 'Fire Pledge', true), card(9, 'Lava Plume', false), card(3, 'Magma Storm', true), card(10, 'Sacred Fire', false)]);
  const estado = t.api.estadoPlanoPartida();
  assert.equal(estado.decisao.aprender.length, 0);
  assert.ok(estado.aprenderAposHypno.includes(1));
  assert.ok(!estado.aprenderAposHypno.includes(7));
  t.api.setPickup(false); t.api.observar(); assert.deepEqual(acoes, []);
  t.api.setPickup(true);
  t.api.observar();
  assert.equal(acoes.length, 1);
  assert.ok([1, 3].includes(acoes[0]));
});

test('pickup abre Bill só com fusão segura pronta e identifica versão incompatível', () => {
  const t = preparar();
  t.setPrompt({ getClientRects: () => [1], textContent: 'EMáquina do Bill · uma fusão, a escolher entre 3 pares', querySelector: () => ({ textContent: 'E' }) });
  t.setBuild('outra'); t.api.observarPickup(); assert.deepEqual(t.eventos, []); assert.match(t.controles[2].textContent, /Bill: versão do jogo não reconhecida/);
  t.setBuild('mwaj5w8h'); t.api.observarPickup(); assert.deepEqual(t.eventos, ['keydown']);
});

test('uma fusão concluída preserva o reconhecimento das outras receitas', () => {
  const t = preparar();
  t.run.fusions = ['terceira'];
  t.run.banished = { has: () => false };
  t.player.moves = [{ def: { id: 90, key: 'terceira', fusion: {} }, level: 5, parents: [5, 6] }, ...[1, 2, 3].map((id) => ({ def: t.defs[id - 1], level: 8, parents: [] }))];
  const estado = t.api.estadoPlanoPartida();
  assert.ok(estado);
  assert.ok(estado.decisao.fundir.some((f) => f.id === 'assinatura'));
});

test('pickup reconhece fusão após outra pronta com ataques acima do nível 8', () => {
  const t = preparar();
  t.run.fusions = ['terceira'];
  t.player.moves = [{ def: { id: 90, key: 'terceira', fusion: {} }, level: 5, parents: [5, 6] },
    ...[1, 2, 3].map((id) => ({ def: t.defs[id - 1], level: id === 1 ? 9 : 12, parents: [] }))];
  t.setPrompt({ getClientRects: () => [1], textContent: 'EMáquina do Bill · uma fusão, a escolher entre 3 pares', querySelector: () => ({ textContent: 'E' }) });
  t.api.observarPickup(); assert.deepEqual(t.eventos, ['keydown']);
});

test('pickup não considera pronto um par com ataque abaixo do nível 8', () => {
  const t = preparar();
  t.player.moves = [1, 2, 3, 4].map((id) => ({ def: t.defs[id - 1], level: id === 2 || id === 4 ? 7 : 8, parents: [] }));
  t.setPrompt({ getClientRects: () => [1], textContent: 'EMáquina do Bill · uma fusão pronta', querySelector: () => ({ textContent: 'E' }) });
  t.api.observarPickup(); assert.deepEqual(t.eventos, []);
  assert.match(t.controles[2].textContent, /par seguro ainda não está no nível 8/);
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

test('união planejada libera espaço sem consumir ingredientes da fusão', () => {
  const t = preparar();
  t.run.planSnap.fus = ['assinatura', 'terceira'];
  t.run.planSnap.links = [[3, 4]];
  t.pares.splice(0, t.pares.length, { id: 'assinatura', pares: [[1, 2]], nome: 'A' }, { id: 'terceira', pares: [[5, 6]], nome: 'B' });
  t.player.moves = [1, 2, 3, 4].map((id) => ({ def: t.defs[id - 1], level: 8, parents: [] }));
  let estado = t.api.estadoPlanoPartida();
  assert.ok(estado.decisao.fundir.some((f) => f.id === 'assinatura'));
  assert.ok(estado.decisao.fundir.some((f) => f.id === 'uniao:plano:0'));
  assert.ok(!estado.decisao.fundir.some((f) => f.id.startsWith('uniao') && f.par.includes(1)));
  t.player.moves = [t.player.moves[0], t.player.moves[1], { ...t.player.moves[2], link: t.player.moves[3] }, null];
  estado = t.api.estadoPlanoPartida();
  assert.ok(estado);
  assert.ok(estado.entrada.concluidas.includes('uniao:plano:0'));
  assert.ok(estado.decisao.fundir.some((f) => f.id === 'assinatura'));
});

test('sem uniões explícitas completa espaços com pares seguros do plano', () => {
  const t = preparar();
  t.run.planSnap.fus = ['assinatura', 'terceira']; t.run.planSnap.links = [];
  t.pares.splice(0, t.pares.length, { id: 'assinatura', pares: [[1, 2]], nome: 'A' }, { id: 'terceira', pares: [[5, 6]], nome: 'B' });
  t.player.moves = [1, 2, 3, 4].map((id) => ({ def: t.defs[id - 1], level: 8, parents: [] }));
  const estado = t.api.estadoPlanoPartida();
  assert.ok(estado.receitas.some((r) => r.id.startsWith('uniao:livre:')));
  const unioes = estado.decisao.fundir.filter((f) => f.id.startsWith('uniao:'));
  assert.ok(unioes.some((f) => f.par.includes(3) && f.par.includes(4)));
  assert.ok(unioes.every((f) => !f.par.includes(1) && !f.par.includes(2)));
});

test('pickup abre Bill quando há apenas união planejada pronta', () => {
  const t = preparar();
  t.run.planSnap.fus = []; t.run.planSnap.links = [[1, 2], [3, 4], [5, 6]];
  t.setPrompt({ getClientRects: () => [1], textContent: 'EMáquina do Bill · uma fusão, a escolher entre 3 pares', querySelector: () => ({ textContent: 'E' }) });
  t.api.observarPickup();
  assert.deepEqual(t.eventos, ['keydown']);
});

test('seleciona unir planejado e confirma os dois golpes no cartão', () => {
  const t = preparar(), acoes = [];
  t.run.planSnap.fus = [];
  t.run.planSnap.links = [[1, 2], [3, 4], [5, 6]];
  const linha = { disabled: false, classList: { contains: (c) => c === 'sel' }, querySelector(s) { return s === '.bm-pair' ? { textContent: 'Golpe 1 + Golpe 2' } : s === '.bm-rtx b' ? { textContent: 'MissingNo.' } : null; } };
  const botao = { disabled: false, textContent: 'Unir os dois ataques', click() { acoes.push('unir'); } };
  const cartao = { querySelectorAll: () => [{ textContent: 'Golpe 1' }, { textContent: 'Golpe 2' }] };
  const bill = { querySelectorAll(s) { return s === 'button.bm-row' ? [linha] : []; }, querySelector(s) { return s === '.bm-card.link' ? cartao : s === 'button.bm-go.link' ? botao : null; } };
  t.setModal({ getClientRects: () => [1], querySelector(s) { return s === '.bm-win' ? bill : null; } });
  assert.equal(t.api.observarBuildEspecial(), true);
  assert.deepEqual(acoes, ['unir']);
});

test('não confirma união se a tela mostrar outros golpes', () => {
  const t = preparar(), acoes = [];
  t.run.planSnap.fus = []; t.run.planSnap.links = [[1, 2], [3, 4], [5, 6]];
  const linha = { disabled: false, classList: { contains: (c) => c === 'sel' }, querySelector(s) { return s === '.bm-pair' ? { textContent: 'Golpe 1 + Golpe 2' } : s === '.bm-rtx b' ? { textContent: 'MissingNo.' } : null; } };
  const botao = { disabled: false, textContent: 'Unir os dois ataques', click() { acoes.push('unir'); } };
  const cartao = { querySelectorAll: () => [{ textContent: 'Golpe 1' }, { textContent: 'Golpe 3' }] };
  const bill = { querySelectorAll(s) { return s === 'button.bm-row' ? [linha] : []; }, querySelector(s) { return s === '.bm-card.link' ? cartao : s === 'button.bm-go.link' ? botao : null; } };
  t.setModal({ getClientRects: () => [1], querySelector(s) { return s === '.bm-win' ? bill : null; } });
  assert.equal(t.api.observarBuildEspecial(), true);
  assert.deepEqual(acoes, []);
});

test('alterna para Unir antes de confirmar a união', () => {
  const t = preparar(), acoes = [];
  t.run.planSnap.fus = []; t.run.planSnap.links = [[1, 2], [3, 4], [5, 6]];
  const linha = { disabled: false, classList: { contains: (c) => c === 'sel' }, querySelector(s) { return s === '.bm-pair' ? { textContent: 'Golpe 1 + Golpe 2' } : s === '.bm-rtx b' ? { textContent: 'MissingNo.' } : null; } };
  const aba = { disabled: false, classList: { contains: () => false }, querySelector: () => ({ textContent: 'Unir' }), click() { acoes.push('abrir unir'); } };
  const bill = { querySelectorAll(s) { return s === 'button.bm-row' ? [linha] : s === '.bm-tabs button.bm-tab' ? [aba] : []; }, querySelector() { return null; } };
  t.setModal({ getClientRects: () => [1], querySelector(s) { return s === '.bm-win' ? bill : null; } });
  assert.equal(t.api.observarBuildEspecial(), true);
  assert.deepEqual(acoes, ['abrir unir']);
});

test('prioriza fusão pronta mesmo quando a união também está pronta', () => {
  const t = preparar(), acoes = [];
  t.run.planSnap.fus = ['assinatura']; t.run.planSnap.links = [[3, 4]];
  t.pares.splice(0, t.pares.length, { id: 'assinatura', pares: [[1, 2]], nome: 'A' });
  const linha = (par, nome, sel) => ({ disabled: false, classList: { contains: (c) => c === 'sel' && sel }, querySelector(s) { return s === '.bm-pair' ? { textContent: par } : s === '.bm-rtx b' ? { textContent: nome } : null; }, click() { acoes.push(par); } });
  const linhas = [linha('Golpe 3 + Golpe 4', 'MissingNo.', true), linha('Golpe 1 + Golpe 2', 'A', false)];
  const bill = { querySelectorAll(s) { return s === 'button.bm-row' ? linhas : []; }, querySelector() { return null; } };
  t.setModal({ getClientRects: () => [1], querySelector(s) { return s === '.bm-win' ? bill : null; } });
  assert.equal(t.api.observarBuildEspecial(), true);
  assert.deepEqual(acoes, ['Golpe 1 + Golpe 2']);
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
