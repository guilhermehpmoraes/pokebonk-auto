import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { decidirPickup } from '../src/decisao.mjs';

test('pickup aceita apenas interações gratuitas identificadas e bloqueia portais e despesas', () => {
  for (const texto of ['acordar o snorlax', 'abrir poke bola amaldicoada (gratis... tem certeza?)', 'altar de gengar · +dificuldade, +xp e +saque', 'altar de desafio · invoca uma onda; se voce a derrotar, great ball']) {
    assert.equal(decidirPickup(texto).acao, 'interagir');
  }
  for (const texto of ['entrar no portal', 'invocar o lendario', 'abrir poke bola · 32 ₽', 'falar com o meowth (loja)', 'caca-niqueis · 40 ₽ por giro', '']) {
    assert.equal(decidirPickup(texto).acao, 'aguardar');
  }
});

test('pickup inicia desligado, interage uma vez e ignora modalidades desconhecidas', () => {
  const controles = [], eventos = [], timers = [];
  let texto = 'Acordar o Snorlax', tecla = 'E', modal = false;
  const criar = () => ({ style: {}, addEventListener(nome, fn) { this[nome] = fn; } });
  const prompt = { getClientRects: () => [1], get textContent() { return tecla + texto; }, querySelector: () => ({ textContent: tecla }) };
  const document = { body: { appendChild: (el) => controles.push(el) }, createElement: criar,
    querySelectorAll(seletor) { if (seletor === '#hud .prompt') return [prompt]; if (seletor === '.modal') return modal ? [{ getClientRects: () => [1] }] : []; return []; } };
  class MutationObserver { observe() {} }
  class KeyboardEvent { constructor(type, options) { this.type = type; this.code = options.code; } }
  vm.runInNewContext(readFileSync(new URL('../pokebonk-autoselect.user.js', import.meta.url), 'utf8'), {
    document, localStorage: { getItem: () => null }, MutationObserver, KeyboardEvent,
    window: { dispatchEvent: (evento) => eventos.push(evento.type + ':' + evento.code) },
    setTimeout: (fn) => { timers.push(fn); return timers.length; }, setInterval() {}, Date, Math,
  });
  const executar = () => { const tarefas = timers.splice(0); tarefas.forEach((tarefa) => tarefa()); };
  assert.deepEqual(eventos, []);
  controles[2].click(); executar();
  assert.deepEqual(eventos, ['keydown:KeyE']);
  executar();
  assert.deepEqual(eventos, ['keydown:KeyE', 'keyup:KeyE']);
  texto = 'Entrar no portal'; controles[2].click(); controles[2].click(); executar();
  assert.equal(eventos.length, 2);
  texto = 'Acordar o Snorlax'; modal = true; controles[2].click(); controles[2].click(); executar();
  assert.equal(eventos.length, 2);
});
