// ==UserScript==
// @name         PokéBonk Auto Select — protótipo de upgrades
// @namespace    local.pokebonk.autoselect
// @version      0.2.13
// @description  Protótipo: seleciona opções do plano na tela de upgrades.
// @match        https://pokebonk.com/*
// @updateURL    https://raw.githubusercontent.com/guilhermehpmoraes/pokebonk-auto/main/pokebonk-autoselect.user.js
// @downloadURL  https://raw.githubusercontent.com/guilhermehpmoraes/pokebonk-auto/main/pokebonk-autoselect.user.js
// @grant        none
// ==/UserScript==

(() => {
'use strict';
// Decide a partir de dados já identificados na tela; não interage com o jogo.
function decidirPickup(texto) {
  const gratuitos = [
    'abrir poke bola (gratis)',
    'abrir great ball (gratis)',
    'abrir poke bola amaldicoada (gratis... tem certeza?)',
    'acordar o snorlax',
    'altar de gengar · +dificuldade, +xp e +saque',
    'altar de desafio · invoca uma onda; se voce a derrotar, great ball',
  ];
  return gratuitos.includes(texto) ? { acao: 'interagir' } : { acao: 'aguardar' };
}

// Estimativas de custo por item: a Pokébola tem bônus pela escolha entre ofertas;
// no cassino 0,194 item/giro e retorno médio de 25% são valores sem sorte.
function decidirGasto({ saldo, bola, giro, lojaEstimada }) {
  if (![saldo, bola].every((n) => Number.isFinite(n) && n >= 0) || bola === 0) return 'aguardar';
  const custos = [{ tipo: 'bola', custo: bola / 1.3, acessivel: saldo >= bola }];
  if (Number.isFinite(giro) && giro > 0) custos.push({ tipo: 'cassino', custo: giro * 0.75 / 0.194 * 1.3, acessivel: saldo >= giro });
  if (Number.isFinite(lojaEstimada) && lojaEstimada > 0) custos.push({ tipo: 'loja', custo: lojaEstimada, acessivel: saldo >= lojaEstimada * 4 });
  custos.sort((a, b) => a.custo - b.custo);
  // Não desvia o dinheiro para a segunda opção só porque a melhor não cabe no saldo.
  return custos[0].acessivel ? custos[0].tipo : 'aguardar';
}

function decidirLoteLoja({ saldo, precos, vendidos, bola, giro, renovacao = 0 }) {
  if (!Number.isFinite(saldo) || !Number.isFinite(bola) || bola <= 0 || !Number.isFinite(renovacao) || renovacao < 0 ||
      !Array.isArray(precos) || !Array.isArray(vendidos) || precos.length !== 4 || vendidos.length !== 4 ||
      vendidos.some((v) => typeof v !== 'boolean') || precos.some((p, i) => !vendidos[i] && (!Number.isFinite(p) || p <= 0))) return 'aguardar';
  const restantes = precos.filter((_, i) => !vendidos[i]);
  if (!restantes.length) return 'concluido';
  const total = restantes.reduce((a, b) => a + b, 0);
  if (saldo < total) return 'aguardar';
  const custoUnitario = (total + renovacao) / restantes.length;
  const alternativas = [bola / 1.3];
  if (Number.isFinite(giro) && giro > 0) alternativas.push(giro * 0.75 / 0.194 * 1.3);
  return custoUnitario <= Math.min(...alternativas) ? 'comprar' : 'sair';
}

function decidir(tela, configuracao = {}, aleatorio = Math.random) {
  const opcoes = tela.opcoes ?? [];
  const maiorRaridade = (lista) => {
    if (lista.some((item) => !Number.isFinite(item.raridade))) return null;
    const maior = Math.max(...lista.map((item) => item.raridade));
    return lista.filter((item) => item.raridade === maior);
  };
  const sortear = (lista) => lista[Math.floor(aleatorio() * lista.length)];

  if (!opcoes.length) return { acao: 'aguardar', motivo: 'sem opções reconhecidas' };
  if (tela.tipo === 'reliquia') {
    const equipadas = tela.equipadas;
    const ordem = configuracao.status;
    if (!Array.isArray(ordem) || !Array.isArray(equipadas) || equipadas.length > 3 || [...opcoes, ...equipadas].some((item) => !Number.isFinite(item.raridade) || !Array.isArray(item.status) || !item.status.length || item.status.some((status) => typeof status !== 'string' || !status))) {
      return { acao: 'aguardar', motivo: 'relíquias não reconhecidas' };
    }
    const prioridade = (item) => Math.min(...item.status.map((status) => { const indice = ordem.indexOf(status); return indice < 0 ? ordem.length : indice; }));
    const comparar = (a, b) => a.raridade - b.raridade || prioridade(b) - prioridade(a);
    const melhor = opcoes.reduce((atual, item) => comparar(item, atual) > 0 ? item : atual);
    const melhores = opcoes.filter((item) => comparar(item, melhor) === 0);
    if (equipadas.length < 3) return { acao: 'selecionar', id: sortear(melhores).id };
    const pior = equipadas.reduce((atual, item) => comparar(item, atual) < 0 ? item : atual);
    if (comparar(melhor, pior) <= 0) return { acao: 'dispensar' };
    const piores = equipadas.filter((item) => comparar(item, pior) === 0);
    return { acao: 'selecionar', id: sortear(melhores).id, substituir: sortear(piores).id };
  }
  if (tela.tipo === 'build') {
    if (opcoes.some((item) => typeof item.noPlano !== 'boolean')) {
      return { acao: 'aguardar', motivo: 'indicador de plano desconhecido' };
    }
    if (opcoes.some((item) => !['novo', 'melhoria'].includes(item.estado))) {
      return { acao: 'aguardar', motivo: 'estado da opção desconhecido' };
    }
    let elegiveis = opcoes.filter((item) => item.noPlano);
    if (elegiveis.length) {
      const novos = elegiveis.filter((item) => item.estado === 'novo');
      if (novos.length) {
        const golpesNovos = novos.filter((item) => item.tipo === 'golpe');
        if (novos.some((item) => !['golpe', 'vitamina'].includes(item.tipo))) {
          return { acao: 'aguardar', motivo: 'tipo de opção desconhecido' };
        }
        // Golpes novos não exibem raridade; sorteia se houver mais de um.
        if (golpesNovos.length) return { acao: 'selecionar', id: sortear(golpesNovos).id };
        elegiveis = novos;
      }
      if (elegiveis.length === 1) return { acao: 'selecionar', id: elegiveis[0].id };
      const melhores = maiorRaridade(elegiveis);
      if (!melhores) return { acao: 'aguardar', motivo: 'raridade desconhecida' };
      if (melhores.some((item) => !['golpe', 'vitamina'].includes(item.tipo))) {
        return { acao: 'aguardar', motivo: 'tipo de opção desconhecido' };
      }
      const golpes = melhores.filter((item) => item.tipo === 'golpe');
      return { acao: 'selecionar', id: sortear(golpes.length ? golpes : melhores).id };
    }
    const melhorias = opcoes.filter((item) => item.estado === 'melhoria');
    if (melhorias.length) {
      if (melhorias.some((item) => !['golpe', 'vitamina'].includes(item.tipo))) {
        return { acao: 'aguardar', motivo: 'tipo de opção desconhecido' };
      }
      const melhores = maiorRaridade(melhorias);
      if (!melhores) return { acao: 'aguardar', motivo: 'raridade desconhecida' };
      const golpes = melhores.filter((item) => item.tipo === 'golpe');
      return { acao: 'selecionar', id: sortear(golpes.length ? golpes : melhores).id, foraDoPlano: true };
    }
    if ([tela.banimentos, tela.atualizacoes, tela.pulos].some((valor) => !Number.isInteger(valor) || valor < 0)) {
      return { acao: 'aguardar', motivo: 'recursos desconhecidos' };
    }
    if (tela.banimentos > 0) return { acao: 'banir', id: sortear(opcoes).id };
    if (tela.atualizacoes > 0) return { acao: 'atualizar' };
    if (tela.pulos > 0) return { acao: 'pular' };
    return { acao: 'selecionar', id: sortear(opcoes).id, foraDoPlano: true };
  }
  if (tela.tipo === 'status' || tela.tipo === 'powerup') {
    if (tela.tipo === 'status') {
      const ordem = configuracao.status ?? [];
      const elegiveis = opcoes.filter((item) => ordem.includes(item.status));
      if (!elegiveis.length) return { acao: 'aguardar', motivo: 'status sem prioridade configurada' };
      const melhorPrioridade = Math.min(...elegiveis.map((item) => ordem.indexOf(item.status)));
      const melhoresStatus = elegiveis.filter((item) => ordem.indexOf(item.status) === melhorPrioridade);
      if (melhoresStatus.length === 1) return { acao: 'selecionar', id: melhoresStatus[0].id };
      const melhores = maiorRaridade(melhoresStatus);
      if (!melhores) return { acao: 'aguardar', motivo: 'raridade desconhecida' };
      return { acao: 'selecionar', id: sortear(melhores).id };
    }
    const melhores = maiorRaridade(opcoes);
    if (!melhores) return { acao: 'aguardar', motivo: 'raridade desconhecida' };
    return { acao: 'selecionar', id: sortear(melhores).id };
  }
  return { acao: 'aguardar', motivo: 'tipo de tela desconhecido' };
}

// Falha fechada quando dados do jogo ou planos não permitem comprovar a segurança.
function kitPodeSerBanido(nome, kits, pokedex, planos) {
  const normalizarNome = (valor) => String(valor ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  if (!nome || typeof kits?.entries !== 'function' || typeof pokedex?.byId?.get !== 'function' ||
      typeof pokedex?.movesByKey?.get !== 'function' || typeof pokedex?.moves?.has !== 'function' ||
      !Array.isArray(planos) || !planos.length) return false;
  const encontrados = [...kits.entries()].filter(([id, kit]) => kit && Array.isArray(kit.kit) && normalizarNome(pokedex.byId.get(id)?.name) === normalizarNome(nome));
  if (encontrados.length !== 1) return false;
  const chaves = encontrados[0][1].kit;
  if (!chaves.length || chaves.some((key) => typeof key !== 'string')) return false;
  const ids = chaves.map((key) => pokedex.movesByKey.get(key)?.id);
  if (ids.some((id) => !Number.isInteger(id) || !pokedex.moves.has(id))) return false;
  for (const plano of planos) {
    if (!Array.isArray(plano?.moves) || !Array.isArray(plano?.fus) || plano.fus.length ||
        plano.moves.some((id) => !Number.isInteger(id) || !pokedex.moves.has(id))) return false;
    if (plano.moves.some((id) => ids.includes(id))) return false;
  }
  return true;
}

// Protótipo para a interface em português.
const normalizar = (texto) => (texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
const raridades = { comum: 1, incomum: 2, raro: 3, rara: 3, epico: 4, epica: 4, lendario: 5, lendaria: 5 };
let ativo = false;
let ultimoConjunto = '';
let banimentoPendente = null;
let selecaoPendente = null;
let avisoPendente = null;
let timer;
const chaveAvisos = 'pokebonk-auto-select-fora-da-build';
let avisosForaPlano = [];
try {
  const dados = JSON.parse(sessionStorage.getItem(chaveAvisos) || '[]');
  if (Array.isArray(dados)) avisosForaPlano = dados.filter((item) => item && typeof item.nome === 'string' && ['golpe', 'vitamina'].includes(item.tipo));
} catch (_) { /* mantém os avisos em memória */ }
let painelAvisos = null;
const chaveStatus = 'pokebonk-auto-select-status';
const chavePerfis = 'pokebonk-auto-select-perfis';
const catalogoStatus = [
  ['experiencia', 'Experiência', ['experiencia', 'exp']], ['dinheiro', 'Pokédólares', ['pokedolares', 'dinheiro', 'money']],
  ['sorte', 'Sorte', ['sorte', 'luck']], ['dano', 'Dano', ['dano']], ['dano fisico', 'Dano físico', ['dano fisico']],
  ['dano especial', 'Dano especial', ['dano especial']], ['dano critico', 'Dano crítico', ['dano critico']],
  ['chance critica', 'Chance de crítico', ['chance de critico', 'chance critica', 'chance crit', 'chance critico', 'critico']],
  ['vida', 'HP máximo', ['hp maximo', 'hp max', 'vida maxima']], ['regeneracao', 'Regeneração', ['regeneracao', 'regen']],
  ['armadura', 'Armadura', ['armadura', 'defesa']], ['evasao', 'Evasão', ['evasao']],
  ['velocidade', 'Velocidade de movimento', ['velocidade de movimento', 'velocidade movimento', 'velocidade']],
  ['velocidade ataque', 'Velocidade de ataque', ['velocidade de ataque']], ['area', 'Área', ['area']],
  ['duracao', 'Duração', ['duracao']], ['coleta', 'Alcance de coleta', ['alcance de coleta', 'coleta']],
  ['velocidade projetil', 'Velocidade de projéteis', ['velocidade de projeteis', 'velocidade do projetil', 'velocidade de projetil']],
  ['projeteis', 'Projéteis', ['projeteis', 'projetil']], ['roubo de vida', 'Roubo de vida', ['roubo de vida', 'lifesteal']],
  ['dano elites', 'Dano a elites e chefes', ['dano a elites', 'dano contra elites', 'dano a chefes', 'dano a elites e chefes', 'dano em elites e chefes']],
  ['recarga', 'Recarga', ['recarga', 'cooldown']], ['sorteio', 'Chance de status', ['chance de status']],
];
const aliasesStatus = { exp: 'experiencia', xp: 'experiencia', money: 'dinheiro', pokedolares: 'dinheiro', luck: 'sorte' };
const canonico = (nome) => {
  const texto = normalizar(nome);
  const candidato = texto.replace(/^novo:\s*/, '');
  return aliasesStatus[candidato] || catalogoStatus.find(([id, , termos]) => id === candidato || termos.includes(candidato))?.[0] || texto;
};
const ordemLegada = () => {
  let salva = [];
  try { const raw = localStorage.getItem(chaveStatus); if (raw) salva = raw.startsWith('[') ? JSON.parse(raw) : raw.split(','); } catch (_) { /* usa padrão */ }
  return [...new Set([...(Array.isArray(salva) ? salva : []).filter((item) => typeof item === 'string').map(canonico).filter(Boolean), ...catalogoStatus.map(([id]) => id)])];
};
function lerPerfis() {
  let salvo;
  try { salvo = JSON.parse(localStorage.getItem(chavePerfis)); } catch (_) { /* usa ordem anterior */ }
  const base = ordemLegada();
  const perfis = Array.from({ length: 5 }, (_, indice) => {
    const perfil = salvo?.perfis?.[indice];
    const ordem = Array.isArray(perfil?.ordem) ? perfil.ordem.filter((item) => typeof item === 'string').map(canonico) : base;
    return { nome: typeof perfil?.nome === 'string' && perfil.nome.trim() ? perfil.nome.trim().slice(0, 24) : `Preset ${indice + 1}`,
      ordem: [...new Set([...ordem, ...catalogoStatus.map(([id]) => id)])] };
  });
  return { ativo: Number.isInteger(salvo?.ativo) && salvo.ativo >= 0 && salvo.ativo < 5 ? salvo.ativo : 0, perfis };
}
function gravarPerfis(dados) { localStorage.setItem(chavePerfis, JSON.stringify(dados)); ultimoConjunto = ''; selecaoPendente = null; }
const ordemStatus = () => { const dados = lerPerfis(); return dados.perfis[dados.ativo].ordem; };
const salvarStatus = (ordem) => { const dados = lerPerfis(); dados.perfis[dados.ativo].ordem = [...ordem]; gravarPerfis(dados); };
function identificarStatus(texto, registrar = true) {
  const valor = normalizar(texto).replace(/^[+\-]?\d+(?:[.,]\d+)?\s*%?\s*(?:de\s+)?/, '').replace(/[.!]+$/, '').trim();
  if (!valor) return undefined;
  const conhecido = catalogoStatus.find(([, , termos]) => termos.includes(valor));
  if (conhecido) return conhecido[0];
  const novo = `novo: ${valor}`;
  const ordem = ordemStatus();
  if (registrar && !ordem.includes(novo)) salvarStatus([...ordem, novo]);
  return novo;
}
const painel = document.createElement('button');
painel.type = 'button';
painel.textContent = 'Auto Select: desligado';
Object.assign(painel.style, { position: 'fixed', bottom: '8px', right: '8px', zIndex: '2147483647', padding: '8px', background: '#242639', color: 'white', border: '2px solid #888', borderRadius: '8px', cursor: 'pointer' });
document.body.appendChild(painel);
const configuracao = document.createElement('button');
configuracao.type = 'button';
configuracao.textContent = 'Prioridade de status';
Object.assign(configuracao.style, { position: 'fixed', bottom: '8px', right: '205px', zIndex: '2147483647', padding: '8px', background: '#242639', color: 'white', border: '2px solid #888', borderRadius: '8px', cursor: 'pointer' });
document.body.appendChild(configuracao);
let pickupAtivo = false;
let ultimoPickup = '';
let pickupLiberado = true;
let pickupSessao = null;
let pickupAcao = null;
let custoRenovacao = 0;
let loteEmCurso = false;
const botaoPickup = document.createElement('button');
botaoPickup.type = 'button';
botaoPickup.textContent = 'Auto Pickup: desligado';
Object.assign(botaoPickup.style, { position: 'fixed', bottom: '48px', right: '8px', zIndex: '2147483647', padding: '8px', background: '#242639', color: 'white', border: '2px solid #888', borderRadius: '8px', cursor: 'pointer' });
document.body.appendChild(botaoPickup);
botaoPickup.addEventListener('click', () => {
  pickupAtivo = !pickupAtivo;
  ultimoPickup = '';
  pickupSessao = null; pickupAcao = null; custoRenovacao = 0; loteEmCurso = false;
  botaoPickup.textContent = pickupAtivo ? 'Auto Pickup: ligado' : 'Auto Pickup: desligado';
  agendar();
});

function numeroPickup(texto) {
  const valor = String(texto ?? '').trim();
  if (!/^\d{1,3}(?:[.,\s]\d{3})*$|^\d+$/.test(valor)) return null;
  return Number(valor.replace(/[.,\s]/g, ''));
}
function carteiraPickup() {
  const wallet = document.querySelector?.('#hud .wallet');
  if (!wallet || !wallet.getClientRects().length) return null;
  const ler = (seletor) => {
    const chip = wallet.querySelector(seletor);
    return chip && chip.getClientRects().length ? numeroPickup(chip.querySelector('em')?.textContent) : null;
  };
  const zona = /\bzona\s+(\d+)\s*\/\s*3\b/.exec(normalizar(document.querySelector('#hud .ht-zone')?.textContent));
  const escala = zona && Number(zona[1]) >= 1 && Number(zona[1]) <= 3 ? 2.2 ** (Number(zona[1]) - 1) : null;
  if (ler('.wl-shop') !== null && !escala) return null;
  return { saldo: numeroPickup(wallet.dataset.g), bola: ler('.wl-ball'), giro: ler('.wl-slots'),
    lojaEstimada: ler('.wl-shop') !== null && escala ? 130 * escala : null };
}
function acaoPickup(botao, assinatura) {
  if (!botao || botao.disabled || pickupAcao === assinatura) return;
  pickupAcao = assinatura;
  botao.click();
}
function observarModalPickup(modal, carteira) {
  if (!pickupSessao || !carteira || Date.now() - pickupSessao.inicio < 400) return;
  if (pickupSessao.tipo === 'cassino' && modal.querySelector('.sl-cab')) {
    const cabine = modal.querySelector('.sl-cab');
    if (cabine.classList.contains('spinning')) return;
    const botoes = [...modal.querySelectorAll('.actions button')];
    const girar = botoes.find((b) => /^girar\s*·\s*[\d.,\s]+\s*₽/i.test(normalizar(b.textContent)));
    const sair = botoes.find((b) => normalizar(b.textContent) === 'sair');
    const valor = numeroPickup(/girar\s*·\s*([\d.,\s]+)\s*₽/i.exec(girar?.textContent || '')?.[1]);
    const saldo = numeroPickup(/^\s*([\d.,\s]+)\s*₽\s*$/.exec(modal.querySelector('.sl-gold')?.textContent || '')?.[1]);
    if (!girar || !sair || valor === null || saldo === null) return;
    const decisao = decidirGasto({ ...carteira, saldo, giro: valor });
    if (decisao === 'aguardar') { acaoPickup(sair, `sair-cassino:${valor}`); return; }
    if (decisao !== 'cassino') { acaoPickup(sair, `sair-cassino:${valor}`); return; }
    acaoPickup(girar, `girar:${valor}:${saldo}`);
    return;
  }
  if (pickupSessao.tipo !== 'loja' || !modal.classList.contains('shop-modal')) return;
  const cartoes = [...modal.querySelectorAll('.cards > button.card')];
  if (cartoes.length !== 4) return;
  const dados = cartoes.map((cartao) => {
    const preco = cartao.querySelector('.price');
    const vendido = preco?.classList.contains('sold');
    const capacidade = /(?:voce tem)\s*(\d+)\s*\/\s*(\d+)/.exec(normalizar(cartao.querySelector('.cap')?.textContent));
    const valor = numeroPickup(/^\s*([\d.,\s]+)\s*₽\s*$/.exec(preco?.textContent || '')?.[1]);
    return { vendido, valor, capacidade, cartao };
  });
  if (dados.some((d) => typeof d.vendido !== 'boolean' || !d.capacidade || (!d.vendido && (d.valor === null || Number(d.capacidade[1]) >= Number(d.capacidade[2]))))) return;
  const saldo = numeroPickup(/·\s*([\d.,\s]+)\s*₽\s*$/.exec(modal.querySelector('h1')?.textContent || '')?.[1]);
  if (saldo === null) return;
  const resultado = decidirLoteLoja({ saldo, bola: carteira.bola, giro: carteira.giro, precos: dados.map((d) => d.valor), vendidos: dados.map((d) => d.vendido), renovacao: custoRenovacao });
  const assinatura = dados.map((d) => `${d.cartao.querySelector('h3')?.textContent}:${d.vendido}:${d.valor}`).join('|');
  if (resultado === 'comprar' || (loteEmCurso && resultado === 'sair')) {
    const proximo = dados.find((d) => !d.vendido);
    loteEmCurso = true;
    acaoPickup(proximo.cartao, `comprar:${assinatura}`);
    return;
  }
  if (resultado === 'concluido') {
    loteEmCurso = false;
    const renovar = modal.querySelector('button.shop-reroll');
    const valor = numeroPickup(/·\s*([\d.,\s]+)\s*₽/.exec(renovar?.textContent || '')?.[1]);
    const custoPrevisto = carteira.lojaEstimada;
    if (valor !== null && custoPrevisto && saldo >= valor + custoPrevisto * 4 &&
        decidirGasto({ ...carteira, saldo, lojaEstimada: custoPrevisto + valor / 4 }) === 'loja' && !renovar.disabled) {
      custoRenovacao = valor;
      acaoPickup(renovar, `renovar:${assinatura}:${valor}`);
      return;
    }
  }
  const sair = modal.querySelector('button.shop-exit');
  acaoPickup(sair, `sair-loja:${assinatura}:${saldo}`);
}
function observarPickup() {
  if (!pickupAtivo || modalAberto) return;
  if (document.activeElement?.matches?.('input, textarea, select, [contenteditable="true"]')) return;
  const visiveis = (seletor) => [...document.querySelectorAll(seletor)].filter((el) => el.getClientRects().length);
  const modais = visiveis('.modal');
  if (modais.length) {
    if (modais.length === 1) observarModalPickup(modais[0], carteiraPickup());
    return;
  }
  if (pickupSessao && Date.now() - pickupSessao.inicio > 3000) { pickupSessao = null; pickupAcao = null; custoRenovacao = 0; loteEmCurso = false; }
  if (pickupSessao) return;
  const prompts = visiveis('#hud .prompt');
  if (prompts.length !== 1) { ultimoPickup = ''; return; }
  const prompt = prompts[0];
  const tecla = prompt.querySelector('kbd')?.textContent?.trim();
  const texto = normalizar(prompt.textContent.slice(tecla?.length || 0));
  let tipo = null;
  const carteira = carteiraPickup();
  const preferencia = carteira ? decidirGasto(carteira) : 'aguardar';
  const precoBola = /^abrir poke bola · ([\d.,\s]+) ₽$/.exec(texto);
  const precoGiro = /^caca-niqueis · ([\d.,\s]+) ₽ por giro$/.exec(texto);
  if (precoBola && numeroPickup(precoBola[1]) === carteira?.bola && preferencia === 'bola') tipo = 'bola';
  if (precoGiro && numeroPickup(precoGiro[1]) === carteira?.giro && preferencia === 'cassino') tipo = 'cassino';
  if (texto === 'falar com o meowth (loja)' && preferencia === 'loja') tipo = 'loja';
  if (decidirPickup(texto).acao !== 'interagir' && !tipo || tecla !== 'E') { ultimoPickup = ''; return; }
  if (!pickupLiberado || ultimoPickup === texto) return;
  ultimoPickup = texto;
  if (tipo === 'cassino' || tipo === 'loja') { pickupSessao = { tipo, inicio: Date.now() }; pickupAcao = null; custoRenovacao = 0; loteEmCurso = false; }
  pickupLiberado = false;
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e', code: 'KeyE', bubbles: true }));
  setTimeout(() => {
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'e', code: 'KeyE', bubbles: true }));
    pickupLiberado = true;
  }, 100);
}
function atualizarAvisos() {
  try { sessionStorage.setItem(chaveAvisos, JSON.stringify(avisosForaPlano)); } catch (_) { /* mantém os avisos em memória */ }
  if (!avisosForaPlano.length && !painelAvisos) return;
  if (!painelAvisos) {
    painelAvisos = document.createElement('aside');
    painelAvisos.setAttribute('aria-label', 'Itens fora da build');
    painelAvisos.style.cssText = 'position:fixed;right:8px;bottom:58px;z-index:2147483647;width:min(360px,calc(100vw - 16px));max-height:38vh;overflow:auto;padding:12px;background:#38251c;color:#fff5e7;border:2px solid #f5a953;border-radius:12px;box-shadow:0 8px 28px #0008;font:13px system-ui,sans-serif';
    painelAvisos.addEventListener('click', (event) => event.stopPropagation());
    painelAvisos.addEventListener('pointerdown', (event) => event.stopPropagation());
    document.body.appendChild(painelAvisos);
  }
  painelAvisos.replaceChildren();
  painelAvisos.style.display = avisosForaPlano.length ? 'block' : 'none';
  if (!avisosForaPlano.length) return;
  const titulo = document.createElement('strong'); titulo.textContent = '⚠️ Fora da build — confira no Hypno';
  const descricao = document.createElement('div'); descricao.textContent = 'Confira se o item foi adquirido e remova-o se necessário.'; descricao.style.cssText = 'margin:4px 0 8px;color:#ffe3be';
  painelAvisos.append(titulo, descricao);
  avisosForaPlano.forEach((aviso) => {
    const linha = document.createElement('div'); linha.style.cssText = 'display:flex;gap:8px;align-items:center;margin-top:5px';
    const nome = document.createElement('span'); nome.style.cssText = 'flex:1;overflow-wrap:anywhere'; nome.textContent = `${aviso.nome} (${aviso.tipo})`;
    const resolver = document.createElement('button'); resolver.type = 'button'; resolver.textContent = 'Resolvido'; resolver.title = `Dispensar aviso de ${aviso.nome}`;
    resolver.style.cssText = 'border:0;border-radius:7px;padding:5px 8px;background:#f5a953;color:#291609;cursor:pointer;font-weight:700';
    resolver.addEventListener('click', () => { avisosForaPlano = avisosForaPlano.filter((item) => item !== aviso); atualizarAvisos(); });
    linha.append(nome, resolver); painelAvisos.append(linha);
  });
}
function registrarForaPlano(nome, tipo) {
  if (!nome || !['golpe', 'vitamina'].includes(tipo)) return;
  if (avisosForaPlano.some((item) => item.tipo === tipo && normalizar(item.nome) === normalizar(nome))) return;
  avisosForaPlano.push({ nome, tipo }); atualizarAvisos();
}
function verificarAvisoPendente() {
  if (!avisoPendente) return;
  const { botao, nome, tipo } = avisoPendente;
  if (botao.isConnected === false || !botao.getClientRects().length || botao.querySelector('h3')?.textContent?.trim() !== nome) {
    avisoPendente = null; registrarForaPlano(nome, tipo);
  }
}
atualizarAvisos();
let modalAberto = false;
configuracao.addEventListener('click', abrirPrioridades);
function abrirPrioridades() {
  if (modalAberto) return;
  modalAberto = true;
  let ordem = ordemStatus();
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(7,10,25,.78);display:flex;align-items:center;justify-content:center;padding:16px;font-family:system-ui,sans-serif;';
  overlay.innerHTML = `<section role="dialog" aria-modal="true" aria-label="Prioridade dos status" style="background:#191e32;color:#f5f6ff;width:min(540px,100%);max-height:85vh;border:1px solid #4a5374;border-radius:20px;box-shadow:0 24px 80px #0009;display:flex;flex-direction:column;overflow:hidden">
    <header style="padding:22px 24px 12px"><div style="color:#ffcd76;font-size:12px;font-weight:800;letter-spacing:.12em">POKÉBONK · AUTO SELECT</div><h2 style="margin:8px 0;font-size:24px">Prioridade dos status</h2><div style="color:#b7c0da;font-size:14px">Arraste pelo símbolo ⋮⋮ ou use as setas. A prioridade vem primeiro; a raridade desempata.</div></header>
    <div style="padding:4px 24px 8px"><div data-tabs role="tablist" aria-label="Predefinições" style="display:flex;gap:5px;overflow-x:auto;padding-bottom:8px"></div><label style="display:flex;align-items:center;gap:8px;color:#b7c0da;font-size:13px">Nome do preset <input data-name maxlength="24" aria-label="Nome do preset" style="min-width:0;flex:1;background:#282f49;color:#fff;border:1px solid #4a5374;border-radius:8px;padding:7px 9px"></label><div style="display:flex;align-items:center;gap:8px;margin-top:8px"><label for="pokebonk-copiar-origem" style="color:#b7c0da;font-size:13px;white-space:nowrap">Copiar de</label><select id="pokebonk-copiar-origem" data-copy-source style="min-width:0;flex:1;background:#282f49;color:#fff;border:1px solid #4a5374;border-radius:8px;padding:7px"><option value="">Selecione um preset</option></select><button type="button" data-copy disabled style="background:#39435f;color:white;border:0;border-radius:8px;padding:8px;cursor:pointer">Copiar para este</button></div></div>
    <ol style="margin:0;padding:8px 24px;overflow:auto;list-style:none;display:grid;gap:7px"></ol>
    <footer style="padding:16px 24px;display:flex;justify-content:space-between;align-items:center;gap:8px;border-top:1px solid #363d56"><small style="color:#aeb7d1">Salvo automaticamente neste navegador</small><button type="button" data-close style="background:#f5a953;color:#261705;border:0;border-radius:10px;padding:10px 20px;font-weight:800;cursor:pointer">Concluir</button></footer></section>`;
  overlay.addEventListener('keydown', (event) => { event.stopPropagation(); if (event.key === 'Escape') fechar(); });
  overlay.addEventListener('keyup', (event) => event.stopPropagation());
  overlay.addEventListener('click', (event) => event.stopPropagation());
  overlay.addEventListener('pointerdown', (event) => event.stopPropagation());
  overlay.addEventListener('pointerup', (event) => event.stopPropagation());
  const lista = overlay.querySelector('ol');
  const abas = overlay.querySelector('[data-tabs]');
  const campoNome = overlay.querySelector('[data-name]');
  const origemCopia = overlay.querySelector('[data-copy-source]');
  const botaoCopia = overlay.querySelector('[data-copy]');
  function renderizarAbas() {
    const dados = lerPerfis();
    abas.replaceChildren();
    origemCopia.replaceChildren();
    const placeholder = document.createElement('option'); placeholder.value = ''; placeholder.textContent = 'Selecione um preset'; origemCopia.append(placeholder);
    origemCopia.value = ''; botaoCopia.disabled = true;
    dados.perfis.forEach((perfil, indice) => {
      const botao = document.createElement('button');
      botao.type = 'button'; botao.textContent = perfil.nome; botao.title = `Selecionar ${perfil.nome}`;
      botao.setAttribute('role', 'tab'); botao.setAttribute('aria-selected', String(indice === dados.ativo));
      botao.style.cssText = `white-space:nowrap;border:1px solid ${indice === dados.ativo ? '#ffc16c' : '#4a5374'};border-radius:8px;padding:7px 9px;background:${indice === dados.ativo ? '#ffbd68' : '#282f49'};color:${indice === dados.ativo ? '#261705' : '#f5f6ff'};cursor:pointer;font-weight:700`;
      botao.addEventListener('click', () => { const atual = lerPerfis(); atual.ativo = indice; gravarPerfis(atual); ordem = ordemStatus(); renderizarAbas(); renderizar(); lista.scrollTop = 0; });
      abas.append(botao);
      if (indice !== dados.ativo) { const opcao = document.createElement('option'); opcao.value = String(indice); opcao.textContent = perfil.nome; origemCopia.append(opcao); }
    });
    campoNome.value = dados.perfis[dados.ativo].nome;
  }
  campoNome.addEventListener('change', () => { const dados = lerPerfis(); dados.perfis[dados.ativo].nome = campoNome.value.trim().slice(0, 24) || `Preset ${dados.ativo + 1}`; gravarPerfis(dados); renderizarAbas(); });
  origemCopia.addEventListener('change', () => { botaoCopia.disabled = origemCopia.value === ''; });
  botaoCopia.addEventListener('click', () => {
    const dados = lerPerfis();
    const origem = origemCopia.value === '' ? -1 : Number(origemCopia.value);
    if (!Number.isInteger(origem) || origem < 0 || origem >= dados.perfis.length || origem === dados.ativo) return;
    if (!confirm(`Substituir a ordem de "${dados.perfis[dados.ativo].nome}" pela de "${dados.perfis[origem].nome}"?`)) return;
    dados.perfis[dados.ativo].ordem = [...dados.perfis[origem].ordem];
    gravarPerfis(dados); ordem = ordemStatus(); renderizarAbas(); renderizar(); lista.scrollTop = 0;
  });
  function mover(de, para) { if (de < 0 || para < 0 || para >= ordem.length || de === para) return; const rolagem = lista.scrollTop; const [item] = ordem.splice(de, 1); ordem.splice(para, 0, item); salvarStatus(ordem); renderizar(); lista.scrollTop = rolagem; }
  function renderizar() {
    lista.replaceChildren();
    ordem.forEach((id, indice) => {
      const item = document.createElement('li'); item.dataset.statusId = id;
      item.style.cssText = 'background:#282f49;border:1px solid #414c6b;border-radius:11px;display:flex;align-items:center;gap:8px;padding:9px 12px';
      const numero = document.createElement('span'); numero.style.cssText = 'color:#ffbf69;font-size:12px;font-weight:800;min-width:24px'; numero.textContent = String(indice + 1).padStart(2, '0');
      const nome = document.createElement('span'); nome.style.cssText = 'flex:1;font-size:14px;font-weight:650'; nome.textContent = catalogoStatus.find((entrada) => entrada[0] === id)?.[1] || id;
      const criarSeta = (texto, titulo, destino) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = texto; b.title = titulo; b.setAttribute('aria-label', `${titulo}: ${nome.textContent}`); b.disabled = destino === indice; b.style.cssText = 'background:#39435f;color:white;border:0;border-radius:6px;padding:4px 7px;cursor:pointer'; b.onclick = () => mover(indice, destino); return b; };
      const alca = document.createElement('span'); alca.textContent = '⋮⋮'; alca.title = `Arrastar ${nome.textContent}`; alca.style.cssText = 'color:#aab6d3;cursor:grab;touch-action:none;user-select:none;padding:4px';
      let ponteiro = null;
      alca.addEventListener('pointerdown', (event) => { if (event.button !== 0) return; event.preventDefault(); event.stopPropagation(); ponteiro = event.pointerId; alca.setPointerCapture(ponteiro); alca.style.cursor = 'grabbing'; });
      alca.addEventListener('pointerup', (event) => { if (ponteiro !== event.pointerId) return; event.preventDefault(); event.stopPropagation(); const alvo = document.elementFromPoint(event.clientX, event.clientY)?.closest('li[data-status-id]'); ponteiro = null; alca.style.cursor = 'grab'; if (alvo && lista.contains(alvo)) mover(ordem.indexOf(id), ordem.indexOf(alvo.dataset.statusId)); });
      alca.addEventListener('pointercancel', () => { ponteiro = null; alca.style.cursor = 'grab'; });
      item.append(alca, numero, nome, criarSeta('⇈', 'Mover para o topo', 0), criarSeta('↑', 'Subir', Math.max(0, indice - 1)), criarSeta('↓', 'Descer', Math.min(ordem.length - 1, indice + 1)), criarSeta('⇊', 'Mover para o fim', ordem.length - 1));
      lista.append(item);
    });
  }
  function fechar() { overlay.remove(); modalAberto = false; agendar(); }
  overlay.querySelector('[data-close]').addEventListener('click', fechar);
  document.body.appendChild(overlay); renderizarAbas(); renderizar(); overlay.querySelector('[data-close]').focus();
}
painel.addEventListener('click', () => {
  ativo = !ativo;
  ultimoConjunto = '';
  banimentoPendente = null;
  selecaoPendente = null;
  painel.textContent = ativo ? 'Auto Select: ligado (protótipo)' : 'Auto Select: desligado';
  agendar();
});

function agendar() {
  if (timer) return;
  timer = setTimeout(() => { timer = null; observar(); }, 150);
}
function selecionarComTentativa(botoes, indice, assinatura) {
  const botao = selecaoPendente?.assinatura === assinatura && botoes.includes(selecaoPendente.botao)
    ? selecaoPendente.botao : botoes[indice];
  const agora = Date.now();
  if (!selecaoPendente || selecaoPendente.assinatura !== assinatura || selecaoPendente.botao !== botao) {
    selecaoPendente = { assinatura, botao, tentativas: 0, ultima: 0 };
  }
  if (selecaoPendente.tentativas >= 3 || (selecaoPendente.tentativas > 0 && agora - selecaoPendente.ultima < 500)) return null;
  selecaoPendente.tentativas += 1;
  selecaoPendente.ultima = agora;
  botao.click();
  return botao;
}
function lerPlanosDeBuild() {
  try {
    const chaves = Object.keys(localStorage).filter((chave) => /^pokebonk\.buildPlan\.(?!.*\.at$)/.test(chave)).sort();
    if (!chaves.length) return null;
    const bruto = chaves.map((chave) => [chave, localStorage.getItem(chave)]);
    const planos = [];
    for (const [, valor] of bruto) {
      const dados = JSON.parse(valor);
      if (!dados || typeof dados !== 'object' || Array.isArray(dados)) return null;
      for (const plano of Object.values(dados)) {
        if (!plano || typeof plano !== 'object' || !Array.isArray(plano.moves) || !Array.isArray(plano.fus)) return null;
        planos.push(plano);
      }
    }
    return planos.length ? { planos, assinatura: JSON.stringify(bruto) } : null;
  } catch (_) { return null; }
}
async function verificarKitSeguro(nome) {
  try {
    const entradas = performance.getEntriesByType('resource').map((item) => item.name);
    const urls = (prefixo) => [...new Set(entradas.flatMap((entrada) => {
      try { const url = new URL(entrada, location.href); return url.origin === location.origin && new RegExp(`^/assets/${prefixo}-[A-Za-z0-9_-]+\\.js$`).test(url.pathname) ? [url.href] : []; }
      catch (_) { return []; }
    }))];
    const kits = urls('defineProperty'); const menus = urls('menus');
    if (kits.length !== 1 || menus.length !== 1) return null;
    const [moduloKits, moduloMenus] = await Promise.all([import(kits[0]), import(menus[0])]);
    const dados = lerPlanosDeBuild();
    if (!dados || !kitPodeSerBanido(nome, moduloKits.vr, moduloMenus.ts, dados.planos)) return null;
    return dados.assinatura;
  } catch (_) { return null; }
}
function observar() {
  verificarAvisoPendente();
  observarPickup();
  if (!ativo || modalAberto) return;
  if (observarReliquias()) return;
  const botoes = [...document.querySelectorAll('button.card.offer')].filter((e) => e.getClientRects().length && !e.disabled);
  if (!botoes.length) { banimentoPendente = null; observarBencao(); return; }
  // Reconhecer os três controles evita atuar em outras telas de escolhas.
  const controles = [...document.querySelectorAll('button')].filter((e) => e.getClientRects().length);
  const emBanimento = controles.some((b) => normalizar(b.textContent).includes('escolha o que banir'));
  const nomes = botoes.map((b) => b.querySelector('h3')?.textContent?.trim() || '');
  const confirmacaoVisivel = controles.some((b) => normalizar(b.textContent).startsWith('banir ') && normalizar(b.textContent).includes('toque outra vez'));
  if (banimentoPendente) {
    const pendente = banimentoPendente;
    if (Date.now() - pendente.inicio > 5000 || JSON.stringify(nomes) !== pendente.nomes ||
        botoes.some((b) => b.querySelector('.bp-badge'))) { banimentoPendente = null; return; }
    const alvo = botoes[pendente.indice];
    if (!alvo || alvo.querySelector('.bp-badge')) { banimentoPendente = null; return; }
    if (emBanimento && (pendente.fase === 'escolher' || (pendente.fase === 'confirmar' && pendente.tentativas < 3 && Date.now() - pendente.ultima >= 500))) {
      pendente.fase = 'confirmar'; pendente.ultima = Date.now(); pendente.tentativas += 1;
      alvo.click(); agendar(); return;
    }
    const nome = normalizar(nomes[pendente.indice]);
    const confirmacao = controles.find((b) => normalizar(b.textContent).startsWith(`banir ${nome}?`) && normalizar(b.textContent).includes('toque outra vez'));
    if (pendente.fase === 'confirmar' && confirmacao) {
      const botaoKit = controles.find((b) => !b.disabled && /^banir todo o kit de\s+.+/.test(normalizar(b.textContent)));
      if (botaoKit && pendente.kit === undefined) {
        const nomeKit = botaoKit.textContent.trim().replace(/^banir todo o kit de\s+/i, '').trim();
        pendente.kit = 'verificando';
        Promise.race([verificarKitSeguro(nomeKit), new Promise((resolve) => setTimeout(() => resolve(null), 1200))]).then((assinatura) => {
          if (banimentoPendente !== pendente) return;
          pendente.kit = assinatura || null; agendar();
        });
        return;
      }
      if (pendente.kit === 'verificando') return;
      const kitSeguro = botaoKit && pendente.kit && lerPlanosDeBuild()?.assinatura === pendente.kit;
      banimentoPendente = null;
      if (kitSeguro) botaoKit.click(); else alvo.click();
    }
    return;
  }
  // Confirmações iniciadas manualmente ficam sob controle do jogador.
  if (emBanimento || confirmacaoVisivel) return;
  if (!['banir', 'atualizar', 'pular'].every((texto) => controles.some((b) => normalizar(b.textContent).startsWith(texto)))) return;
  const opcoes = botoes.map((botao, indice) => {
    const tipo = botao.querySelector('.top .typeicon') ? 'golpe'
      : botao.querySelector('.top img[src*="assets/items/"]') ? 'vitamina' : undefined;
    const kind = normalizar(botao.querySelector('.kind')?.textContent);
    const descricao = normalizar(botao.querySelector('.bd > .sub')?.textContent);
    // Uma melhoria de fusão já equipada pode aparecer sem o selo do plano.
    const fusaoEquipada = tipo === 'golpe' && kind === 'melhoria' && /^fusao\s*★/.test(descricao);
    return { id: indice, tipo, noPlano: !!botao.querySelector('.bp-badge') || fusaoEquipada,
      estado: kind === 'novo' || kind === 'nova' ? 'novo' : kind === 'melhoria' ? 'melhoria' : undefined,
      raridade: raridades[normalizar(botao.querySelector('.rar')?.textContent)] };
  });
  // Não gastar recursos se a tela estiver incompleta ou tiver um formato desconhecido.
  if (opcoes.some((item, i) => !nomes[i] || !item.tipo || !item.estado)) return;
  const assinatura = botoes.map((b) => b.outerHTML).join('|');
  const controle = (nome) => controles.find((b) => normalizar(b.textContent).startsWith(nome));
  const banir = controle('banir');
  const atualizar = controle('atualizar');
  const pular = controle('pular');
  const usos = (botao) => {
    const contador = botao?.textContent.match(/\((\d+)\)/);
    return botao && contador ? (botao.disabled ? 0 : Number(contador[1])) : null;
  };
  const decisao = decidir({ tipo: 'build', opcoes, banimentos: usos(banir), atualizacoes: usos(atualizar), pulos: usos(pular) });
  if (decisao.acao === 'aguardar') return;
  if (decisao.acao === 'selecionar') {
    const selecionado = selecionarComTentativa(botoes, decisao.id, assinatura);
    if (selecionado && decisao.foraDoPlano) {
      const indiceSelecionado = botoes.indexOf(selecionado);
      avisoPendente = { botao: selecionado, nome: nomes[indiceSelecionado], tipo: opcoes[indiceSelecionado].tipo };
      verificarAvisoPendente();
    }
    return;
  }
  if (assinatura === ultimoConjunto) return;
  ultimoConjunto = assinatura;
  if (decisao.acao === 'banir') {
    banimentoPendente = { indice: decisao.id, nomes: JSON.stringify(nomes), inicio: Date.now(), fase: 'escolher', tentativas: 0 };
    banir.click();
    agendar();
  }
  if (decisao.acao === 'atualizar') atualizar.click();
  if (decisao.acao === 'pular') pular.click();
}
function observarReliquias() {
  const visivel = (elemento) => !!elemento && elemento.getClientRects().length > 0;
  const janelas = [...document.querySelectorAll('.rl-wrap')].filter(visivel);
  if (!janelas.length) return false;
  if (janelas.length !== 1) return true;
  const janela = janelas[0];
  const lerReliquia = (elemento, indice, equipado = false) => {
    const raridadeClasse = [...elemento.classList].map((classe) => /^r([0-4])$/.exec(classe)).find(Boolean);
    const raridadePorClasse = raridadeClasse ? Number(raridadeClasse[1]) + 1 : undefined;
    const textoRaridade = elemento.querySelector('.rl-rar');
    const raridadeTexto = textoRaridade ? raridades[normalizar(textoRaridade.textContent)] : undefined;
    const stats = elemento.querySelector(equipado ? '.rl-chip-bd span' : '.rl-stats');
    const nome = elemento.querySelector(equipado ? '.rl-chip-bd b' : '.rl-bd h3')?.textContent?.trim();
    if (!nome || !stats || !raridadePorClasse || (textoRaridade && raridadeTexto !== raridadePorClasse)) return null;
    const status = stats.textContent.split(/\s*[·•]\s*/).map((trecho) => identificarStatus(trecho, false));
    if (!status.length || status.some((item) => !item)) return null;
    return { id: indice, nome, raridade: raridadePorClasse, status };
  };
  const swaps = [...janela.querySelectorAll('button.rl-card.rl-swap')].filter(visivel);
  const ofertas = [...janela.querySelectorAll('button.rl-card:not(.rl-swap)')].filter(visivel);
  const acaoUnica = (texto, assinatura) => {
    const botao = [...janela.querySelectorAll('.actions button')].find((item) => visivel(item) && !item.disabled && normalizar(item.textContent) === texto);
    if (!botao || assinatura === ultimoConjunto) return;
    ultimoConjunto = assinatura;
    botao.click();
  };
  if (swaps.length) {
    const previa = janela.querySelector('.rl-incoming .rl-card');
    if (!visivel(previa) || swaps.length !== 3) return true;
    const nova = lerReliquia(previa, 0);
    const equipadas = swaps.map((item, indice) => lerReliquia(item, indice));
    if (!nova || equipadas.some((item) => !item)) return true;
    const decisao = decidir({ tipo: 'reliquia', opcoes: [nova], equipadas }, { status: ordemStatus() });
    const assinatura = `reliquia-troca:${previa.outerHTML}:${swaps.map((item) => item.outerHTML).join('|')}`;
    if (decisao.acao === 'dispensar') acaoUnica('ficar com as minhas', assinatura);
    if (decisao.acao === 'selecionar' && Number.isInteger(decisao.substituir)) selecionarComTentativa(swaps, decisao.substituir, assinatura);
    return true;
  }
  if (!ofertas.length) return true;
  const subtitulo = normalizar(janela.querySelector('.rl-sub')?.textContent);
  const livres = /\((\d+)\s*\/\s*3\s+espacos\)/.exec(subtitulo);
  const quantidade = livres ? Number(livres[1]) : /\b3 espacos estao cheios\b/.test(subtitulo) ? 3 : undefined;
  const chips = [...janela.querySelectorAll('.rl-mine .rl-chip')].filter(visivel);
  if (!Number.isInteger(quantidade) || quantidade > 3 || chips.length !== quantidade) return true;
  const equipadas = chips.map((item, indice) => lerReliquia(item, indice, true));
  const opcoes = ofertas.map((item, indice) => lerReliquia(item, indice));
  if (equipadas.some((item) => !item) || opcoes.some((item) => !item)) return true;
  const decisao = decidir({ tipo: 'reliquia', opcoes, equipadas }, { status: ordemStatus() });
  const assinatura = `reliquia-oferta:${ofertas.map((item) => item.outerHTML).join('|')}:${chips.map((item) => item.outerHTML).join('|')}`;
  if (decisao.acao === 'dispensar') acaoUnica('nao levar nenhuma', assinatura);
  if (decisao.acao === 'selecionar') selecionarComTentativa(ofertas, decisao.id, assinatura);
  return true;
}
function observarBencao() {
  const botoes = [...document.querySelectorAll('button.card')].filter((e) => e.getClientRects().length && !e.disabled && e.querySelector('.top img[src*="assets/ui/icons/blessing.png"]'));
  if (!botoes.length) { observarItens(); return; }
  const opcoes = botoes.map((botao, indice) => {
    const texto = normalizar(botao.querySelector('h3')?.textContent);
    const status = identificarStatus(texto);
    return { id: indice, status,
      raridade: raridades[normalizar(botao.querySelector('.rar')?.textContent)] };
  });
  const prioridade = ordemStatus();
  const assinatura = botoes.map((b) => b.outerHTML).join('|');
  const decisao = decidir({ tipo: 'status', opcoes }, { status: prioridade });
  if (decisao.acao !== 'selecionar') return;
  selecionarComTentativa(botoes, decisao.id, assinatura);
}
function observarItens() {
  const visivel = (e) => e.getClientRects().length && !e.disabled;
  const nenhum = [...document.querySelectorAll('button')].some((b) => visivel(b) && normalizar(b.textContent).startsWith('nenhum'));
  const botoes = [...document.querySelectorAll('button.card')].filter((e) => visivel(e) && !e.classList.contains('offer') && e.querySelector('.cap') && e.querySelector('.top img[src*="assets/items/"]'));
  if (!nenhum || !botoes.length) { observarItemUnico(); return; }
  const opcoes = botoes.map((botao, indice) => ({ id: indice, raridade: raridades[normalizar(botao.querySelector('.rar')?.textContent)] }));
  const assinatura = botoes.map((b) => b.outerHTML).join('|');
  const decisao = decidir({ tipo: 'powerup', opcoes });
  if (decisao.acao !== 'selecionar') return;
  selecionarComTentativa(botoes, decisao.id, assinatura);
}
function observarItemUnico() {
  const visivel = (e) => e.getClientRects().length && !e.disabled;
  const titulo = [...document.querySelectorAll('h1,h2,h3,div,span')].some((e) => visivel(e) && normalizar(e.textContent) === 'voce encontrou um item!');
  const botoes = [...document.querySelectorAll('button')].filter(visivel);
  const pegar = botoes.find((b) => /^pegar\s*e?$/.test(normalizar(b.textContent)));
  const vender = botoes.some((b) => normalizar(b.textContent).startsWith('vender'));
  if (!titulo || !pegar || !vender) { ultimoConjunto = ''; selecaoPendente = null; return; }
  const assinatura = `item-unico:${document.querySelector('.card h3')?.textContent || ''}:${pegar.outerHTML}`;
  if (assinatura === ultimoConjunto) return;
  ultimoConjunto = assinatura;
  pegar.click();
}
new MutationObserver(agendar).observe(document.body, { childList: true, subtree: true, characterData: true });
// Algumas mudanças só alteram estilos ou atributos; faz uma conferência periódica.
setInterval(agendar, 500);

})();
