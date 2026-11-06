import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function executar({ ofertas, equipadas, subtitulo, escolherManualmente, prioridade }) {
  let fase = escolherManualmente == null ? 'oferta' : 'troca';
  let escolhida = escolherManualmente == null ? null : ofertas[escolherManualmente];
  let tarefa; let intervalo; let relogio = 1000;
  const cliques = []; const controles = [];
  const labels = ['Comum', 'Incomum', 'Raro', 'Épica', 'Lendária'];
  const elemento = () => ({ style: {}, addEventListener(tipo, fn) { this[tipo] = fn; }, click() { this.click?.(); } });
  function card(dados, indice, tipo) {
    const raro = labels[dados.raridade - 1];
    return { disabled: false, classList: [`r${dados.raridade - 1}`], outerHTML: `${tipo}:${dados.nome}`, getClientRects: () => [1],
      querySelector(seletor) {
        if (seletor === '.rl-rar') return tipo === 'chip' ? null : { textContent: raro };
        if (seletor === '.rl-stats' || seletor === '.rl-chip-bd span') return { textContent: dados.stats };
        if (seletor === '.rl-bd h3' || seletor === '.rl-chip-bd b') return { textContent: dados.nome };
        return null;
      },
      click() {
        cliques.push(`${tipo}:${dados.nome}`);
        if (tipo === 'oferta' && equipadas.length === 3) { escolhida = dados; fase = 'troca'; }
      } };
  }
  const ofertasDom = ofertas.map((item, indice) => card(item, indice, 'oferta'));
  const chips = equipadas.map((item, indice) => card(item, indice, 'chip'));
  const swaps = equipadas.map((item, indice) => card(item, indice, 'swap'));
  const dispensar = { disabled: false, getClientRects: () => [1], get textContent() { return fase === 'oferta' ? 'Não levar nenhuma' : 'Ficar com as minhas'; }, click() { cliques.push(this.textContent); } };
  const janela = { getClientRects: () => [1],
    querySelectorAll(seletor) {
      if (seletor === 'button.rl-card.rl-swap') return fase === 'troca' ? swaps : [];
      if (seletor === 'button.rl-card:not(.rl-swap)') return fase === 'oferta' ? ofertasDom : [];
      if (seletor === '.rl-mine .rl-chip') return chips;
      if (seletor === '.actions button') return [dispensar];
      return [];
    },
    querySelector(seletor) {
      if (seletor === '.rl-incoming .rl-card') return escolhida ? card(escolhida, 0, 'previa') : null;
      if (seletor === '.rl-sub') return { textContent: subtitulo ?? (equipadas.length === 3 ? 'Escolha uma. Seus 3 espaços estão cheios: depois você decide qual substituir.' : `Escolha uma para o resto da partida (${equipadas.length}/3 espaços).`) };
      return null;
    } };
  const document = { body: { appendChild: (item) => controles.push(item) }, createElement: elemento,
    querySelectorAll(seletor) { return seletor === '.rl-wrap' ? [janela] : []; } };
  const localStorage = { getItem: (chave) => chave === 'pokebonk-auto-select-perfis' && prioridade ? JSON.stringify({ ativo: 0, perfis: [{ nome: 'Teste', ordem: prioridade }] }) : null, setItem() {} };
  class MutationObserver { observe() {} }
  vm.runInNewContext(readFileSync(new URL('../pokebonk-autoselect.user.js', import.meta.url), 'utf8'), {
    document, localStorage, MutationObserver, setTimeout(fn) { tarefa = fn; return 1; }, setInterval(fn) { intervalo = fn; }, Math, Date: { now: () => relogio },
  });
  controles[0].click(); tarefa();
  if (fase === 'troca' && escolherManualmente == null) { relogio += 600; intervalo(); tarefa(); }
  return cliques;
}

const r = (nome, raridade, stats) => ({ nome, raridade, stats });
test('escolhe maior raridade e usa dano como desempate nas ofertas', () => {
  const ofertas = [r('Com dano', 1, '+5% Dano'), r('Área', 2, '+8% Área'), r('Dano', 2, '+7% Dano')];
  assert.deepEqual(executar({ ofertas, equipadas: [] }), ['oferta:Dano']);
});
test('usa o preset ativo e reconhece atributos múltiplos em relíquias', () => {
  const ofertas = [r('Dano', 2, '+7% Dano'), r('Mista', 2, '+8% Chance crít. · +25% Dano crítico')];
  assert.deepEqual(executar({ ofertas, equipadas: [], prioridade: ['dano critico', 'dano', 'chance critica'] }), ['oferta:Mista']);
  assert.deepEqual(executar({ ofertas, equipadas: [], prioridade: ['dano', 'dano critico', 'chance critica'] }), ['oferta:Dano']);
});
test('compara o preset ativo ao escolher qual relíquia substituir', () => {
  const equipadas = [r('Área', 5, '+8% Área'), r('Dano', 5, '+7% Dano'), r('Sorte', 5, '+10% Sorte')];
  assert.deepEqual(executar({ ofertas: [r('Dano crítico', 5, '+25% Dano crítico')], equipadas,
    prioridade: ['dano critico', 'area', 'dano', 'sorte'] }), ['oferta:Dano crítico', 'swap:Sorte']);
});
test('com espaços cheios escolhe e substitui a relíquia menos prioritária', () => {
  const ofertas = [r('Estrela', 5, '+25% Dano crítico')];
  const equipadas = [r('Chifre', 2, '+8% Área'), r('Garra', 2, '+7% Dano'), r('Presa', 1, '+5% Dano')];
  assert.deepEqual(executar({ ofertas, equipadas }), ['oferta:Estrela', 'swap:Presa']);
});
test('dispensa ofertas que não melhoram as relíquias equipadas', () => {
  const equipadas = [r('A', 5, '+5% Dano'), r('B', 5, '+6% Dano'), r('C', 5, '+7% Dano')];
  assert.deepEqual(executar({ ofertas: [r('Outra', 5, '+8% Dano')], equipadas }), ['Não levar nenhuma']);
});
test('troca sem dano por dano da mesma raridade, mas não faz piora manual', () => {
  const equipadas = [r('Área', 5, '+5% Área'), r('B', 5, '+6% Dano'), r('C', 5, '+7% Dano')];
  assert.deepEqual(executar({ ofertas: [r('Nova', 5, '+8% Dano')], equipadas }), ['oferta:Nova', 'swap:Área']);
  assert.deepEqual(executar({ ofertas: [r('Fraca', 1, '+5% Dano')], equipadas, escolherManualmente: 0 }), ['Ficar com as minhas']);
});
test('espera se não conseguir confirmar o número de espaços equipados', () => {
  assert.deepEqual(executar({ ofertas: [r('Nova', 2, '+5% Dano')], equipadas: [r('Atual', 2, '+5% Área')], subtitulo: 'Carregando...' }), []);
});
