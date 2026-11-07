import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { decidirPickup, decidirGasto, decidirLoteLoja } from '../src/decisao.mjs';

test('estima custo e aguarda quando não pode bancar a alternativa preferida', () => {
  assert.equal(decidirGasto({ saldo: 100, bola: 32, giro: 40, lojaEstimada: 130 }), 'bola');
  assert.equal(decidirGasto({ saldo: 1000, bola: 400, giro: 40, lojaEstimada: 130 }), 'loja');
  assert.equal(decidirGasto({ saldo: 1000, bola: 400, giro: 20, lojaEstimada: 130 }), 'cassino');
  assert.equal(decidirGasto({ saldo: 200, bola: 400, giro: 40, lojaEstimada: 130 }), 'aguardar');
  assert.equal(decidirGasto({ saldo: 200, bola: null, giro: 40 }), 'aguardar');
  assert.equal(decidirGasto({ saldo: 1000, bola: 400, giro: 40, lojaEstimada: 130, excluidos: ['loja'] }), 'cassino');
});

test('compra o lote reconhecido e acessível sem reavaliar a estratégia', () => {
  const lote = { saldo: 1000, bola: 400, giro: 80, precos: [80, 130, 220, 130], vendidos: [false, false, false, false] };
  assert.equal(decidirLoteLoja(lote), 'comprar');
  assert.equal(decidirLoteLoja({ ...lote, saldo: 500 }), 'aguardar');
  assert.equal(decidirLoteLoja({ ...lote, bola: 50 }), 'comprar');
  assert.equal(decidirLoteLoja({ ...lote, avaliar: true, bola: 50 }), 'sair');
  assert.equal(decidirLoteLoja({ ...lote, avaliar: true, bola: null }), 'aguardar');
  assert.equal(decidirLoteLoja({ ...lote, precos: [80, 130, null, 130] }), 'aguardar');
  assert.equal(decidirLoteLoja({ ...lote, vendidos: [true, true, true, true] }), 'concluido');
});

test('pickup aceita apenas interações gratuitas identificadas e bloqueia portais e despesas', () => {
  for (const texto of ['acordar o snorlax', 'rock smash', 'coletar oran berries', 'magnemite: atrai toda a experiencia', 'altar amaldicoado · um item raro em troca de uma maldicao', 'abrir poke bola amaldicoada (gratis... tem certeza?)', 'altar de gengar · +dificuldade, +xp e +saque', 'altar de desafio · invoca uma onda; se voce a derrotar, great ball']) {
    assert.equal(decidirPickup(texto).acao, 'interagir');
  }
  for (const texto of ['entrar no portal', 'invocar o lendario', 'abrir poke bola · 32 ₽', 'falar com o meowth (loja)', 'caca-niqueis · 40 ₽ por giro', '']) {
    assert.equal(decidirPickup(texto).acao, 'aguardar');
  }
});

test('liberta qualquer Pokémon da jaula por 30 ₽, mas aguarda valores ou avisos diferentes', () => {
  for (const texto of ['libertar pupitar · 30 ₽', 'libertar mr. mime · 30 ₽', 'libertar nidoran♀ · 30 ₽']) assert.equal(decidirPickup(texto).acao, 'interagir');
  for (const texto of ['libertar pupitar · 31 ₽', 'libertar pupitar · 300 ₽', 'libertar · 30 ₽', 'libertar pupitar · 30 ₽ extra']) assert.equal(decidirPickup(texto).acao, 'aguardar');
});

test('reconhece ovo com contagem variável sem acionar avisos de ninho indisponível', () => {
  for (const texto of ['pegar o ovo pokemon · choca apos 300 derrotas', 'pegar o ovo pokemon · choca apos 1.200 derrotas']) assert.equal(decidirPickup(texto).acao, 'interagir');
  for (const texto of ['ninho vazio', 'ninho com um ovo · voce ja carrega um', 'pegar o ovo pokemon · choca apos derrotas', 'pegar o ovo pokemon · choca apos 300 derrotas e abrir portal']) assert.equal(decidirPickup(texto).acao, 'aguardar');
});

test('identifica somente os estágios disponíveis do Rugido de Rhydon', () => {
  const inicial = 'rugido de rhydon · guardiao mais forte e com escolta, +1 great ball por rugido';
  const etapa = (n) => `rugido de rhydon (${n}/3) · outro rugido: guardiao +30% de hp e +1 great ball`;
  assert.equal(decidirPickup(inicial).estagioRhydon, 0);
  assert.equal(decidirPickup(etapa(1)).estagioRhydon, 1);
  assert.equal(decidirPickup(etapa(2)).estagioRhydon, 2);
  assert.equal(decidirPickup(etapa(3)).acao, 'aguardar');
  assert.equal(decidirPickup('rhydon descansa · 3 rugidos').acao, 'aguardar');
  assert.equal(decidirPickup('rugido de rhydon (1/3) · abrir portal').acao, 'aguardar');
});

test('ativa os três rugidos, repete clique ignorado e respeita o limite mostrado', () => {
  function simular(inicio, aceitar) {
    let agora = 1000, intervalo, estagio = inicio, entradas = 0;
    const controles = [], tarefas = [];
    const rotulo = () => estagio === 0 ? 'Rugido de Rhydon · guardião mais forte e com escolta, +1 Great Ball por rugido'
      : estagio < 3 ? `Rugido de Rhydon (${estagio}/3) · outro rugido: guardião +30% de HP e +1 Great Ball` : 'Rhydon descansa · 3 rugidos';
    const prompt = { getClientRects: () => [1], get textContent() { return `E${rotulo()}`; }, querySelector: () => ({ textContent: 'E' }) };
    const document = { body: { appendChild: (el) => controles.push(el) }, createElement: () => ({ style: {}, addEventListener(tipo, fn) { this[tipo] = fn; } }),
      querySelectorAll(s) { return s === '#hud .prompt' ? [prompt] : []; } };
    class MutationObserver { observe() {} }
    class KeyboardEvent { constructor(type) { this.type = type; } }
    vm.runInNewContext(readFileSync(new URL('../pokebonk-autoselect.user.js', import.meta.url), 'utf8'), {
      document, localStorage: { getItem: () => null }, MutationObserver, KeyboardEvent,
      window: { dispatchEvent(evento) { if (evento.type === 'keydown') { entradas++; if (aceitar(entradas)) estagio++; } } },
      setTimeout(fn) { tarefas.push(fn); return tarefas.length; }, setInterval(fn) { intervalo = fn; }, Date: { now: () => agora }, Math,
    });
    const executar = () => { const pendentes = tarefas.splice(0); pendentes.forEach((fn) => fn()); };
    controles[2].click(); executar(); executar();
    for (let i = 0; i < 10; i++) { agora += 600; intervalo(); executar(); executar(); }
    return { entradas, estagio };
  }
  assert.deepEqual(simular(0, (n) => n > 1), { entradas: 4, estagio: 3 });
  assert.deepEqual(simular(1, () => true), { entradas: 2, estagio: 3 });
  assert.deepEqual(simular(0, () => false), { entradas: 3, estagio: 0 });
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
  texto = 'Rock Smash'; modal = false; controles[2].click(); controles[2].click(); executar(); executar();
  assert.deepEqual(eventos, ['keydown:KeyE', 'keyup:KeyE', 'keydown:KeyE', 'keyup:KeyE']);
  texto = 'Coletar Oran Berries'; controles[2].click(); controles[2].click(); executar(); executar();
  assert.deepEqual(eventos, ['keydown:KeyE', 'keyup:KeyE', 'keydown:KeyE', 'keyup:KeyE', 'keydown:KeyE', 'keyup:KeyE']);
  texto = 'Magnemite: atrai toda a experiência'; controles[2].click(); controles[2].click(); executar(); executar();
  assert.deepEqual(eventos, ['keydown:KeyE', 'keyup:KeyE', 'keydown:KeyE', 'keyup:KeyE', 'keydown:KeyE', 'keyup:KeyE', 'keydown:KeyE', 'keyup:KeyE']);
  texto = 'Libertar Pupitar · 30 ₽'; controles[2].click(); controles[2].click(); executar(); executar();
  assert.deepEqual(eventos, ['keydown:KeyE', 'keyup:KeyE', 'keydown:KeyE', 'keyup:KeyE', 'keydown:KeyE', 'keyup:KeyE', 'keydown:KeyE', 'keyup:KeyE', 'keydown:KeyE', 'keyup:KeyE']);
  texto = 'Altar amaldiçoado · um item raro em troca de uma maldição'; controles[2].click(); controles[2].click(); executar(); executar();
  assert.deepEqual(eventos, ['keydown:KeyE', 'keyup:KeyE', 'keydown:KeyE', 'keyup:KeyE', 'keydown:KeyE', 'keyup:KeyE', 'keydown:KeyE', 'keyup:KeyE', 'keydown:KeyE', 'keyup:KeyE', 'keydown:KeyE', 'keyup:KeyE']);
  texto = 'Pegar o Ovo Pokémon · choca após 300 derrotas'; controles[2].click(); controles[2].click(); executar(); executar();
  assert.deepEqual(eventos, ['keydown:KeyE', 'keyup:KeyE', 'keydown:KeyE', 'keyup:KeyE', 'keydown:KeyE', 'keyup:KeyE', 'keydown:KeyE', 'keyup:KeyE', 'keydown:KeyE', 'keyup:KeyE', 'keydown:KeyE', 'keyup:KeyE', 'keydown:KeyE', 'keyup:KeyE']);
});

test('confere preços completos com a carteira bruta quando o HUD abrevia os valores', () => {
  function simular({ aviso, bola, giro, bruto, saldo = 333400 }) {
    const controles = [], eventos = [], tarefas = [];
    const chip = (valor) => ({ getClientRects: () => [1], querySelector: () => ({ textContent: valor }) });
    const carteira = { getClientRects: () => [1], dataset: { g: String(saldo), ...(bruto ? { k: bruto } : {}) },
      querySelector(s) { if (s === '.wl-ball') return chip(bola); if (s === '.wl-slots') return chip(giro); if (s === '.wl-shop') return chip('273'); return null; } };
    const prompt = { getClientRects: () => [1], textContent: `E${aviso}`, querySelector: () => ({ textContent: 'E' }) };
    const document = { body: { appendChild: (el) => controles.push(el) }, createElement: () => ({ style: {}, addEventListener(tipo, fn) { this[tipo] = fn; } }),
      querySelector(s) { if (s === '#hud .wallet') return carteira; if (s === '#hud .ht-zone') return { textContent: 'Zona 2/3' }; return null; },
      querySelectorAll(s) { return s === '#hud .prompt' ? [prompt] : []; } };
    class MutationObserver { observe() {} }
    class KeyboardEvent { constructor(type) { this.type = type; } }
    vm.runInNewContext(readFileSync(new URL('../pokebonk-autoselect.user.js', import.meta.url), 'utf8'), {
      document, localStorage: { getItem: () => null }, MutationObserver, KeyboardEvent,
      window: { dispatchEvent(evento) { eventos.push(evento.type); } },
      setTimeout(fn) { tarefas.push(fn); return tarefas.length; }, setInterval() {}, Date, Math,
    });
    const executar = () => { const pendentes = tarefas.splice(0); pendentes.forEach((fn) => fn()); };
    controles[2].click(); executar(); executar();
    return eventos;
  }
  const caso = { aviso: 'Abrir Poké Bola · 14498 ₽', bola: '14.4k', giro: '343', bruto: '333400|14498|343|273' };
  assert.deepEqual(simular(caso), ['keydown', 'keyup']);
  assert.deepEqual(simular({ ...caso, bruto: '333400|14499|343|273' }), []);
  assert.deepEqual(simular({ ...caso, bruto: undefined }), []);
  assert.deepEqual(simular({ ...caso, bruto: undefined, bola: '14498' }), ['keydown', 'keyup']);
  assert.deepEqual(simular({ ...caso, saldo: 14497 }), []);
  assert.deepEqual(simular({ aviso: 'Caça-níqueis · 14498 ₽ por giro', bola: '32', giro: '14.4k', bruto: '333400|32|14498|273' }), ['keydown', 'keyup']);
});

test('indicador mantém o alvo no trajeto e permite trocá-lo manualmente', () => {
  let saldo = 1000, bola = 32, giro = 40, loja = 40, tarefa, intervalo;
  const controles = [];
  const chip = (valor) => ({ getClientRects: () => [1], querySelector: () => ({ textContent: String(valor) }) });
  const wallet = { getClientRects: () => [1], get dataset() { return { g: String(saldo) }; },
    querySelector(s) { return s === '.wl-ball' ? chip(bola) : s === '.wl-slots' ? chip(giro) : s === '.wl-shop' ? chip(loja) : null; } };
  const document = { body: { appendChild: (el) => controles.push(el) },
    createElement: () => ({ style: {}, addEventListener(tipo, fn) { this[tipo] = fn; } }),
    querySelector(s) { if (s === '#hud .wallet') return wallet; if (s === '#hud .ht-zone') return { textContent: 'Zona 1/3' }; return null; },
    querySelectorAll: () => [] };
  class MutationObserver { observe() {} }
  vm.runInNewContext(readFileSync(new URL('../pokebonk-autoselect.user.js', import.meta.url), 'utf8'), {
    document, localStorage: { getItem: () => null }, MutationObserver,
    setTimeout(fn) { tarefa = fn; return 1; }, setInterval(fn) { intervalo = fn; }, Date, Math,
  });
  const pickup = controles[2];
  assert.equal(pickup.textContent, 'Auto Pickup: desligado');
  pickup.click(); tarefa();
  assert.match(pickup.textContent, /Sugestão: Pokébola/);
  bola = 400; intervalo(); tarefa();
  assert.match(pickup.textContent, /Sugestão: Pokébola/);
  controles[3].click(); tarefa();
  assert.match(pickup.textContent, /Sugestão: Loja do Meowth/);
  giro = 20; intervalo(); tarefa();
  assert.match(pickup.textContent, /Sugestão: Loja do Meowth/);
  controles[3].click(); tarefa();
  assert.match(pickup.textContent, /Sugestão: Cassino/);
  saldo = 1; intervalo(); tarefa();
  assert.match(pickup.textContent, /Sugestão: Cassino/);
  controles[3].click(); tarefa();
  assert.match(pickup.textContent, /Aguardando dados ou saldo/);
  pickup.click();
  assert.equal(pickup.textContent, 'Auto Pickup: desligado');
});

test('mantém a sugestão e coleta gratuitos e Pokébola fora dela no trajeto', () => {
  let agora = 1000, bola = 400, giro = 40, promptTexto = '', modalAberto = false, intervalo;
  const controles = [], eventos = [], tarefas = [];
  const visivel = () => [1];
  const chip = (valor) => ({ getClientRects: visivel, querySelector: () => ({ textContent: String(valor) }) });
  const wallet = { getClientRects: visivel, get dataset() { return { g: '1000', k: `1000|${bola}|${giro}|40` }; },
    querySelector(s) { return s === '.wl-ball' ? chip(bola) : s === '.wl-slots' ? chip(giro) : s === '.wl-shop' ? chip(40) : null; } };
  const prompt = { getClientRects: visivel, get textContent() { return `E${promptTexto}`; }, querySelector: () => ({ textContent: 'E' }) };
  const modal = { getClientRects: visivel, classList: { contains: () => false }, querySelector: () => null,
    querySelectorAll(s) { if (s === 'button.card') return [{ querySelector: () => ({}) }]; if (s === 'button') return [{ textContent: 'Nenhum (+10 ₽)' }]; return []; } };
  const document = { body: { appendChild: (el) => controles.push(el) }, createElement: () => ({ style: {}, addEventListener(tipo, fn) { this[tipo] = fn; } }),
    querySelector(s) { if (s === '#hud .wallet') return wallet; if (s === '#hud .ht-zone') return { textContent: 'Zona 1/3' }; return null; },
    querySelectorAll(s) { if (s === '#hud .prompt') return promptTexto ? [prompt] : []; if (s === '.modal') return modalAberto ? [modal] : []; return []; } };
  class MutationObserver { observe() {} }
  class KeyboardEvent { constructor(type) { this.type = type; } }
  vm.runInNewContext(readFileSync(new URL('../pokebonk-autoselect.user.js', import.meta.url), 'utf8'), {
    document, localStorage: { getItem: () => null }, MutationObserver, KeyboardEvent,
    window: { dispatchEvent(evento) { eventos.push(evento.type); } },
    setTimeout(fn) { tarefas.push(fn); return tarefas.length; }, setInterval(fn) { intervalo = fn; }, Date: { now: () => agora }, Math,
  });
  const executar = () => { const pendentes = tarefas.splice(0); pendentes.forEach((fn) => fn()); };
  const tick = () => { agora += 600; intervalo(); executar(); };
  controles[2].click(); executar();
  assert.match(controles[2].textContent, /Sugestão: Loja do Meowth/);
  giro = 1; promptTexto = ''; tick();
  assert.match(controles[2].textContent, /Sugestão: Loja do Meowth/);
  assert.deepEqual(eventos, []);
  promptTexto = 'Coletar Oran Berries'; tick(); executar();
  assert.deepEqual(eventos, ['keydown', 'keyup']);
  promptTexto = 'Abrir Poké Bola · 400 ₽'; tick(); executar();
  assert.deepEqual(eventos, ['keydown', 'keyup', 'keydown', 'keyup']);
  tick(); assert.match(controles[2].textContent, /Sugestão: Loja do Meowth/);
  modalAberto = true; tick();
  assert.match(controles[2].textContent, /aguardando escolha/);
  modalAberto = false; promptTexto = ''; bola = 401; tick();
  assert.match(controles[2].textContent, /Sugestão: Loja do Meowth/);
  controles[3].click(); executar();
  assert.match(controles[2].textContent, /Cassino/);
});

test('interage com cassino fora da sugestão, gira uma vez e não reabre enquanto permanece perto', () => {
  let agora = 1000, atual = 'mapa', perto = false, tarefas = [], intervalo, giros = 0;
  const controles = [], acoes = [];
  const visivel = () => [1];
  const chip = (valor) => ({ getClientRects: visivel, querySelector: () => ({ textContent: String(valor) }) });
  const carteira = { getClientRects: visivel, dataset: { g: '1000', k: '1000|32|40|40' },
    querySelector(s) { return s === '.wl-ball' ? chip(32) : s === '.wl-slots' ? chip(40) : s === '.wl-shop' ? chip(40) : null; } };
  const prompt = { getClientRects: visivel, textContent: 'ECaça-níqueis · 40 ₽ por giro', querySelector: () => ({ textContent: 'E' }) };
  const cabine = { classList: { contains: () => false }, querySelector: () => ({ textContent: String(giros) }) };
  const girar = { disabled: false, textContent: 'Girar · 40 ₽E', click() { giros++; acoes.push('girar'); } };
  const sair = { disabled: false, textContent: 'Sair', click() { acoes.push('sair'); atual = 'mapa'; } };
  const modal = { getClientRects: visivel, classList: { contains: () => false }, querySelector(s) { if (s === '.sl-cab') return cabine; if (s === '.sl-gold') return { textContent: '1000 ₽' }; return null; },
    querySelectorAll(s) { return s === '.actions button' ? [girar, sair] : []; } };
  const document = { body: { appendChild: (el) => controles.push(el) }, createElement: () => ({ style: {}, addEventListener(tipo, fn) { this[tipo] = fn; } }),
    querySelector(s) { if (s === '#hud .wallet') return carteira; if (s === '#hud .ht-zone') return { textContent: 'Zona 1/3' }; return null; },
    querySelectorAll(s) { if (s === '.modal') return atual === 'modal' ? [modal] : []; if (s === '#hud .prompt') return perto && atual === 'mapa' ? [prompt] : []; return []; } };
  class MutationObserver { observe() {} }
  class KeyboardEvent { constructor(type) { this.type = type; } }
  vm.runInNewContext(readFileSync(new URL('../pokebonk-autoselect.user.js', import.meta.url), 'utf8'), {
    document, localStorage: { getItem: () => null }, MutationObserver, KeyboardEvent,
    window: { dispatchEvent(evento) { if (evento.type === 'keydown') { acoes.push('abrir'); atual = 'modal'; } } },
    setTimeout(fn) { tarefas.push(fn); return tarefas.length; }, setInterval(fn) { intervalo = fn; }, Date: { now: () => agora }, Math,
  });
  const executar = () => { const pendentes = tarefas; tarefas = []; pendentes.forEach((fn) => fn()); };
  const tick = () => { agora += 600; intervalo(); executar(); };
  controles[2].click(); executar();
  assert.match(controles[2].textContent, /Sugestão: Pokébola/);
  perto = true; tick(); executar();
  assert.deepEqual(acoes, ['abrir']);
  tick(); tick(); tick();
  assert.deepEqual(acoes, ['abrir', 'girar', 'sair']);
  assert.match(controles[2].textContent, /Sugestão: Pokébola/);
  tick(); assert.deepEqual(acoes, ['abrir', 'girar', 'sair']);
  perto = false; tick(); perto = true; tick();
  assert.deepEqual(acoes, ['abrir', 'girar', 'sair', 'abrir']);
});

test('tenta novamente uma interação paga ignorada sem repetir indefinidamente', () => {
  let agora = 1000, intervalo;
  const controles = [], eventos = [], tarefas = [];
  const chip = (valor) => ({ getClientRects: () => [1], querySelector: () => ({ textContent: String(valor) }) });
  const carteira = { getClientRects: () => [1], dataset: { g: '1000', k: '1000|32|40|40' },
    querySelector(s) { return s === '.wl-ball' ? chip(32) : s === '.wl-slots' ? chip(40) : s === '.wl-shop' ? chip(40) : null; } };
  const prompt = { getClientRects: () => [1], textContent: 'EAbrir Poké Bola · 32 ₽', querySelector: () => ({ textContent: 'E' }) };
  const document = { body: { appendChild: (el) => controles.push(el) }, createElement: () => ({ style: {}, addEventListener(tipo, fn) { this[tipo] = fn; } }),
    querySelector(s) { if (s === '#hud .wallet') return carteira; if (s === '#hud .ht-zone') return { textContent: 'Zona 1/3' }; return null; },
    querySelectorAll(s) { return s === '#hud .prompt' ? [prompt] : []; } };
  class MutationObserver { observe() {} }
  class KeyboardEvent { constructor(type) { this.type = type; } }
  vm.runInNewContext(readFileSync(new URL('../pokebonk-autoselect.user.js', import.meta.url), 'utf8'), {
    document, localStorage: { getItem: () => null }, MutationObserver, KeyboardEvent,
    window: { dispatchEvent(evento) { eventos.push(evento.type); } },
    setTimeout(fn) { tarefas.push(fn); return tarefas.length; }, setInterval(fn) { intervalo = fn; }, Date: { now: () => agora }, Math,
  });
  const executar = () => { const pendentes = tarefas.splice(0); pendentes.forEach((fn) => fn()); };
  controles[2].click(); executar(); executar();
  for (let i = 0; i < 5; i++) { agora += 3100; intervalo(); executar(); executar(); }
  assert.equal(eventos.filter((evento) => evento === 'keydown').length, 3);
});

function simularLoja({ saldoInicial, precos, raridades, vendidosIniciais, iteracoes, precosRenovados, precosCompactos = false, verificarIndicador = false, bolaHud = 400 }) {
  let tempo = 1000, saldo = saldoInicial, atual = 'prompt', tarefa, intervalo;
  const controles = [], acoes = [], vendidos = [...vendidosIniciais];
  const valores = [...precos];
  const visivel = () => [1];
  const textoPreco = (valor) => ({ textContent: String(valor) });
  const chip = (valor) => ({ getClientRects: visivel, querySelector: () => textoPreco(valor) });
  const wallet = { getClientRects: visivel, get dataset() { return { g: String(saldo) }; },
    querySelector(s) { return s === '.wl-ball' ? chip(bolaHud) : s === '.wl-slots' ? chip(40) : s === '.wl-shop' ? chip(40) : null; } };
  const cartoes = valores.map((_, i) => ({ getClientRects: visivel,
    querySelector(s) {
      if (s === '.price') return { classList: { contains: () => vendidos[i] }, textContent: vendidos[i] ? 'VENDIDO' : `${precosCompactos ? (valores[i] / 1000).toFixed(1) + 'k' : valores[i]} ₽` };
      if (s === '.cap') return { textContent: 'Você tem 0/10' };
      if (s === '.rar') return { textContent: raridades[i] };
      if (s === 'h3') return { textContent: `Item ${i}` };
    }, click() { vendidos[i] = true; saldo -= valores[i]; acoes.push(`comprou ${i}`); } }));
  const sair = { click() { acoes.push('sair'); atual = 'prompt'; }, disabled: false };
  const renovar = { textContent: 'Renovar estoque · 40 ₽', disabled: false, click() { acoes.push('renovar'); saldo -= 40; vendidos.fill(false); if (precosRenovados) valores.splice(0, 4, ...precosRenovados); } };
  const modal = { getClientRects: visivel, classList: { contains: (s) => s === 'shop-modal' },
    querySelectorAll(s) { return s === '.cards > button.card' ? cartoes : []; },
    querySelector(s) { if (s === 'h1') return { textContent: `Meowth · ${(saldo / 1000).toFixed(1)}k ₽` }; if (s === 'button.shop-exit') return sair; if (s === 'button.shop-reroll') return renovar; return null; } };
  const prompt = { getClientRects: visivel, textContent: 'EFalar com o Meowth (loja)', querySelector: () => ({ textContent: 'E' }) };
  const criar = () => ({ style: {}, addEventListener(tipo, fn) { this[tipo] = fn; } });
  const document = { body: { appendChild: (el) => controles.push(el) }, createElement: criar,
    querySelector(s) { if (s === '#hud .wallet') return wallet; if (s === '#hud .ht-zone') return { textContent: 'Zona 1/3' }; return null; },
    querySelectorAll(s) { if (s === '.modal') return atual === 'modal' ? [modal] : []; if (s === '#hud .prompt') return atual === 'prompt' ? [prompt] : []; return []; } };
  class MutationObserver { observe() {} }
  class KeyboardEvent { constructor(type) { this.type = type; } }
  vm.runInNewContext(readFileSync(new URL('../pokebonk-autoselect.user.js', import.meta.url), 'utf8'), {
    document, localStorage: { getItem: () => null }, MutationObserver, KeyboardEvent,
    window: { dispatchEvent(evento) { if (evento.type === 'keydown') { atual = 'modal'; acoes.push('abrir'); } } },
    setTimeout(fn) { tarefa = fn; return 1; }, setInterval(fn) { intervalo = fn; }, Date: { now: () => tempo }, Math,
  });
  const tick = () => { tempo += 600; intervalo(); const fn = tarefa; tarefa = null; fn(); };
  controles[2].click(); tarefa();
  assert.deepEqual(acoes, ['abrir']);
  // Conclui o keyup pendente e, em seguida, observa cada atualização da loja.
  tarefa();
  for (let i = 0; i < iteracoes; i++) tick();
  if (verificarIndicador) {
    tick(); const depoisDaLoja = controles[2].textContent;
    tempo += 61000; tick();
    return { depoisDaLoja, depoisDeExpirar: controles[2].textContent };
  }
  return acoes;
}

test('loja com saldo abreviado conclui lote parcialmente vendido e renova conforme estratégia', () => {
  const acoes = simularLoja({ saldoInicial: 67000, precos: [130, 115, 316, 187], raridades: ['Incomum', 'Comum', 'Raro', 'Incomum'], vendidosIniciais: [true, false, false, false], iteracoes: 6 });
  assert.deepEqual(acoes, ['abrir', 'comprou 1', 'comprou 2', 'comprou 3', 'renovar', 'comprou 0', 'comprou 1']);
});

test('compra os itens da loja encontrada mesmo quando a sugestão é Pokébola', () => {
  const acoes = simularLoja({ saldoInicial: 67000, precos: [130, 115, 316, 187], raridades: ['Incomum', 'Comum', 'Raro', 'Incomum'], vendidosIniciais: [true, false, false, false], iteracoes: 4, bolaHud: 32 });
  assert.deepEqual(acoes, ['abrir', 'comprou 1', 'comprou 2', 'comprou 3', 'sair']);
});

test('não renova loja com itens caros mesmo se a renovação for barata', () => {
  const acoes = simularLoja({ saldoInicial: 60200, precos: [9092, 5001, 9092, 9092], raridades: ['Épico', 'Raro', 'Épico', 'Épico'], vendidosIniciais: [false, false, false, false], iteracoes: 5 });
  assert.deepEqual(acoes, ['abrir', 'comprou 0', 'comprou 1', 'comprou 2', 'comprou 3', 'sair']);
});

test('custos observados na loja influenciam a preferência temporariamente', () => {
  const resultado = simularLoja({ saldoInicial: 60200, precos: [9092, 5001, 9092, 9092], raridades: ['Épico', 'Raro', 'Épico', 'Épico'], vendidosIniciais: [false, false, false, false], iteracoes: 5, verificarIndicador: true });
  assert.match(resultado.depoisDaLoja, /Sugestão: Cassino/);
  assert.match(resultado.depoisDeExpirar, /Sugestão: Cassino/);
});

test('ao sair da loja sem preços observados prioriza outra opção em vez de voltar à loja', () => {
  const resultado = simularLoja({ saldoInicial: 67000, precos: [130, 115, 316, 187], raridades: ['Incomum', 'Comum', 'Raro', 'Incomum'], vendidosIniciais: [true, true, true, true], iteracoes: 1, verificarIndicador: true });
  assert.match(resultado.depoisDaLoja, /Sugestão: Cassino/);
  assert.match(resultado.depoisDeExpirar, /Sugestão: Cassino/);
});

test('interpreta preços abreviados com limite conservador', () => {
  const acoes = simularLoja({ saldoInicial: 60200, precos: [9092, 5001, 9092, 9092], raridades: ['Épico', 'Raro', 'Épico', 'Épico'], vendidosIniciais: [false, false, false, false], iteracoes: 5, precosCompactos: true });
  assert.deepEqual(acoes, ['abrir', 'comprou 0', 'comprou 1', 'comprou 2', 'comprou 3', 'sair']);
});

test('não renova quando não observou preço de nenhum item', () => {
  const acoes = simularLoja({ saldoInicial: 67000, precos: [130, 115, 316, 187], raridades: ['Incomum', 'Comum', 'Raro', 'Incomum'], vendidosIniciais: [true, true, true, true], iteracoes: 1 });
  assert.deepEqual(acoes, ['abrir', 'sair']);
});

test('não reabre loja fechada enquanto o jogador permanece sobre ela', () => {
  const acoes = simularLoja({ saldoInicial: 67000, precos: [130, 115, 316, 187], raridades: ['Incomum', 'Comum', 'Raro', 'Incomum'], vendidosIniciais: [true, true, true, true], iteracoes: 8 });
  assert.deepEqual(acoes, ['abrir', 'sair']);
});

test('sai sem comprar quando o estoque renovado aparece caro demais', () => {
  const acoes = simularLoja({ saldoInicial: 67000, precos: [130, 115, 316, 187], raridades: ['Incomum', 'Comum', 'Raro', 'Incomum'], vendidosIniciais: [true, false, false, false], precosRenovados: [9092, 5001, 9092, 9092], iteracoes: 5 });
  assert.deepEqual(acoes, ['abrir', 'comprou 1', 'comprou 2', 'comprou 3', 'renovar', 'sair']);
});

test('cassino pula cada animação, repete clique ignorado e reavalia antes de girar', () => {
  let tempo = 1000, saldo = 19500, giro = 34, atual = 'prompt', tarefa, intervalo, tentativas = 0, giros = 0, emGiro = false, walletVisivel = true, rotuloPular = 'Pular animação', pularDesabilitado = false;
  const controles = [], acoes = [];
  const visivel = () => [1];
  const chip = (valor) => ({ getClientRects: visivel, querySelector: () => ({ textContent: String(valor) }) });
  const wallet = { getClientRects: () => walletVisivel ? [1] : [], get dataset() { return { g: String(saldo) }; },
    querySelector(s) { return s === '.wl-ball' ? chip(256) : s === '.wl-slots' ? chip(34) : null; } };
  const girar = { get disabled() { return emGiro && pularDesabilitado; }, get textContent() { return emGiro ? `${rotuloPular}E` : `Girar · ${giro} ₽E`; },
    querySelector(s) { return s === 'kbd' ? { textContent: 'E' } : null; },
    click() { if (emGiro) { acoes.push('pular'); emGiro = false; return; } acoes.push('girar'); if (++tentativas > 1) { saldo -= giro; emGiro = true; if (++giros === 2) giro = 50; } } };
  const sair = { disabled: false, textContent: 'Sair', click() { acoes.push('sair'); atual = 'prompt'; } };
  const cabine = { classList: { contains: () => emGiro }, querySelector: () => ({ textContent: String(giros) }) };
  const modal = { getClientRects: visivel, querySelector(s) { if (s === '.sl-cab') return cabine; if (s === '.sl-gold') return { textContent: `${(saldo / 1000).toFixed(1)}k ₽` }; return null; },
    querySelectorAll(s) { return s === '.actions button' ? [girar, sair] : []; } };
  const prompt = { getClientRects: visivel, textContent: 'ECaça-níqueis · 34 ₽ por giro', querySelector: () => ({ textContent: 'E' }) };
  const document = { body: { appendChild: (el) => controles.push(el) }, createElement: () => ({ style: {}, addEventListener(tipo, fn) { this[tipo] = fn; } }),
    querySelector(s) { if (s === '#hud .wallet') return wallet; if (s === '#hud .ht-zone') return { textContent: 'Zona 1/3' }; return null; },
    querySelectorAll(s) { if (s === '.modal') return atual === 'modal' ? [modal] : []; if (s === '#hud .prompt') return atual === 'prompt' ? [prompt] : []; return []; } };
  class MutationObserver { observe() {} }
  class KeyboardEvent { constructor(type) { this.type = type; } }
  vm.runInNewContext(readFileSync(new URL('../pokebonk-autoselect.user.js', import.meta.url), 'utf8'), {
    document, localStorage: { getItem: () => null }, MutationObserver, KeyboardEvent,
    window: { dispatchEvent(evento) { if (evento.type === 'keydown') { atual = 'modal'; acoes.push('abrir'); } } },
    setTimeout(fn) { tarefa = fn; return 1; }, setInterval(fn) { intervalo = fn; }, Date: { now: () => tempo }, Math,
  });
  const tick = () => { tempo += 600; intervalo(); tarefa(); };
  controles[2].click(); tarefa(); tarefa();
  tick(); tick(); tick();
  rotuloPular = 'Outro botão'; tick();
  rotuloPular = 'Pular animação'; pularDesabilitado = true; tick();
  assert.deepEqual(acoes, ['abrir', 'girar', 'girar']);
  pularDesabilitado = false;
  walletVisivel = false; tick(); // Pular é gratuito, mesmo se o HUD deixar de estar visível.
  walletVisivel = true; tick(); tick(); tick();
  assert.deepEqual(acoes, ['abrir', 'girar', 'girar', 'pular', 'girar', 'pular', 'sair']);
});
