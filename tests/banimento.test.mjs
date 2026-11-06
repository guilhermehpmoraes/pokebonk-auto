import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

async function simular({ kitDisponivel = true, seguro = false, manual = false, mudaNome = false, mudaPlano = false, dadosReais = false } = {}) {
  let fase = manual ? 'confirmar' : 'normal'; let agora = 1000; let verificar;
  const acoes = []; const elementos = []; const tarefas = [];
  const plano = JSON.stringify({ 94: { moves: [3], fus: [] } });
  const storage = { 'pokebonk.buildPlan.local': plano, getItem(chave) { return this[chave] ?? null; }, setItem() {} };
  const assinatura = JSON.stringify([['pokebonk.buildPlan.local', plano]]);
  const criar = () => ({ style: {}, addEventListener(tipo, fn) { this[tipo] = fn; }, click() { this.click?.(); } });
  const carta = { disabled: false, outerHTML: 'Poltergeist', getClientRects: () => [1], querySelector(seletor) {
    if (seletor === 'h3') return { textContent: mudaNome && fase === 'confirmar' ? 'Outro ataque' : 'Poltergeist' };
    if (seletor === '.top .typeicon') return {};
    if (seletor === '.kind') return { textContent: 'NOVO' };
    if (seletor === '.rar') return { textContent: 'Ataque' };
    if (seletor === '.bd > .sub') return { textContent: 'Novo ataque' };
    return null;
  }, click() { acoes.push('cartao'); fase = fase === 'escolher' ? 'confirmar' : 'finalizado'; } };
  const banir = { disabled: false, getClientRects: () => [1], get textContent() {
    if (fase === 'normal') return 'Banir (1) Z';
    if (fase === 'escolher') return 'Escolha o que banir… Z';
    return 'Banir Poltergeist? Toque outra vez Z';
  }, click() { acoes.push('banir'); fase = 'escolher'; } };
  const kit = { disabled: false, textContent: 'Banir todo o kit de Misdreavus',
    getClientRects: () => kitDisponivel && fase === 'confirmar' ? [1] : [], click() { acoes.push('kit'); fase = 'finalizado'; } };
  const controles = [banir, kit, ...['Atualizar (0) F', 'Pular (0) X'].map((textContent) => ({ textContent, disabled: true, getClientRects: () => [1] }))];
  const document = { body: { appendChild: (elemento) => elementos.push(elemento) }, createElement: criar,
    querySelectorAll(seletor) { if (seletor === 'button.card.offer') return [carta]; if (seletor === 'button') return controles; return []; } };
  class MutationObserver { observe() {} }
  let codigo = readFileSync(new URL('../pokebonk-autoselect.user.js', import.meta.url), 'utf8');
  if (!dadosReais) codigo = codigo.replace('async function verificarKitSeguro(nome) {', 'async function verificarKitSeguroReal(nome) {')
    .replace('function observar() {', 'async function verificarKitSeguro(nome) { return testeVerificar(nome); }\nfunction observar() {');
  vm.runInNewContext(codigo, { document, localStorage: storage, MutationObserver, Math, Date: { now: () => agora },
    performance: { getEntriesByType: () => [] },
    testeVerificar: async (nome) => { verificar = nome; if (mudaPlano) storage['pokebonk.buildPlan.local'] = '{}'; return seguro ? assinatura : null; },
    setTimeout(fn, atraso) { if (atraso === 150) tarefas.push(fn); return tarefas.length || 1; }, setInterval() {},
  });
  const passo = () => { const fn = tarefas.shift(); if (fn) { agora += 150; fn(); } };
  elementos[0].click(); passo(); passo(); passo();
  for (let i = 0; i < 10; i++) await Promise.resolve();
  passo();
  return { acoes, verificar };
}

test('confirma duas vezes o mesmo golpe quando não há botão de kit', async () => {
  assert.deepEqual((await simular({ kitDisponivel: false })).acoes, ['banir', 'cartao', 'cartao']);
});
test('bane o kit somente quando a verificação confirma segurança', async () => {
  const resultado = await simular({ seguro: true });
  assert.deepEqual(resultado.acoes, ['banir', 'cartao', 'kit']);
  assert.equal(resultado.verificar, 'Misdreavus');
  assert.deepEqual((await simular({ seguro: false })).acoes, ['banir', 'cartao', 'cartao']);
  assert.deepEqual((await simular({ seguro: true, mudaPlano: true })).acoes, ['banir', 'cartao', 'cartao']);
  assert.deepEqual((await simular({ dadosReais: true })).acoes, ['banir', 'cartao', 'cartao']);
});
test('não confirma seleção manual ou quando as opções mudam', async () => {
  assert.deepEqual((await simular({ manual: true })).acoes, []);
  assert.deepEqual((await simular({ mudaNome: true })).acoes, ['banir', 'cartao']);
});
