// ==UserScript==
// @name         PokéBonk Auto Select — protótipo de upgrades
// @namespace    local.pokebonk.autoselect
// @version      0.2.5
// @description  Protótipo: seleciona opções do plano na tela de upgrades.
// @match        https://pokebonk.com/*
// @updateURL    https://raw.githubusercontent.com/guilhermehpmoraes/pokebonk-auto/main/pokebonk-autoselect.user.js
// @downloadURL  https://raw.githubusercontent.com/guilhermehpmoraes/pokebonk-auto/main/pokebonk-autoselect.user.js
// @grant        none
// ==/UserScript==

(() => {
'use strict';
// Decide a partir de dados já identificados na tela; não interage com o jogo.
function decidir(tela, configuracao = {}, aleatorio = Math.random) {
  const opcoes = tela.opcoes ?? [];
  const maiorRaridade = (lista) => {
    if (lista.some((item) => !Number.isFinite(item.raridade))) return null;
    const maior = Math.max(...lista.map((item) => item.raridade));
    return lista.filter((item) => item.raridade === maior);
  };
  const sortear = (lista) => lista[Math.floor(aleatorio() * lista.length)];

  if (!opcoes.length) return { acao: 'aguardar', motivo: 'sem opções reconhecidas' };
  if (tela.tipo === 'build') {
    if (opcoes.some((item) => typeof item.noPlano !== 'boolean')) {
      return { acao: 'aguardar', motivo: 'indicador de plano desconhecido' };
    }
    let elegiveis = opcoes.filter((item) => item.noPlano);
    if (elegiveis.length) {
      if (elegiveis.some((item) => !['novo', 'melhoria'].includes(item.estado))) {
        return { acao: 'aguardar', motivo: 'estado da opção desconhecido' };
      }
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
    if (tela.banimentos > 0) return { acao: 'banir', id: sortear(opcoes).id };
    if (tela.atualizacoes > 0) return { acao: 'atualizar' };
    if (tela.pulos > 0) return { acao: 'pular' };
    return { acao: 'aguardar', motivo: 'nenhuma ação disponível' };
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

// Protótipo para a interface em português.
const normalizar = (texto) => (texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
const raridades = { comum: 1, incomum: 2, raro: 3, rara: 3, epico: 4, epica: 4, lendario: 5, lendaria: 5 };
let ativo = false;
let ultimoConjunto = '';
let banimentoPendente = null;
let selecaoPendente = null;
let timer;
const chaveStatus = 'pokebonk-auto-select-status';
const chavePerfis = 'pokebonk-auto-select-perfis';
const catalogoStatus = [
  ['experiencia', 'Experiência', ['experiencia', 'exp']], ['dinheiro', 'Pokédólares', ['pokedolares', 'dinheiro', 'money']],
  ['sorte', 'Sorte', ['sorte', 'luck']], ['dano', 'Dano', ['dano']], ['dano fisico', 'Dano físico', ['dano fisico']],
  ['dano especial', 'Dano especial', ['dano especial']], ['dano critico', 'Dano crítico', ['dano critico']],
  ['chance critica', 'Chance de crítico', ['chance de critico', 'chance critica', 'critico']],
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
function identificarStatus(texto) {
  const valor = normalizar(texto).replace(/^[+\-]?\d+(?:[.,]\d+)?\s*%?\s*(?:de\s+)?/, '').replace(/[.!]+$/, '').trim();
  if (!valor) return undefined;
  const conhecido = catalogoStatus.find(([, , termos]) => termos.includes(valor));
  if (conhecido) return conhecido[0];
  const novo = `novo: ${valor}`;
  const ordem = ordemStatus();
  if (!ordem.includes(novo)) salvarStatus([...ordem, novo]);
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
    <div style="padding:4px 24px 8px"><div data-tabs role="tablist" aria-label="Predefinições" style="display:flex;gap:5px;overflow-x:auto;padding-bottom:8px"></div><label style="display:flex;align-items:center;gap:8px;color:#b7c0da;font-size:13px">Nome do preset <input data-name maxlength="24" aria-label="Nome do preset" style="min-width:0;flex:1;background:#282f49;color:#fff;border:1px solid #4a5374;border-radius:8px;padding:7px 9px"></label></div>
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
  function renderizarAbas() {
    const dados = lerPerfis();
    abas.replaceChildren();
    dados.perfis.forEach((perfil, indice) => {
      const botao = document.createElement('button');
      botao.type = 'button'; botao.textContent = perfil.nome; botao.title = `Selecionar ${perfil.nome}`;
      botao.setAttribute('role', 'tab'); botao.setAttribute('aria-selected', String(indice === dados.ativo));
      botao.style.cssText = `white-space:nowrap;border:1px solid ${indice === dados.ativo ? '#ffc16c' : '#4a5374'};border-radius:8px;padding:7px 9px;background:${indice === dados.ativo ? '#ffbd68' : '#282f49'};color:${indice === dados.ativo ? '#261705' : '#f5f6ff'};cursor:pointer;font-weight:700`;
      botao.addEventListener('click', () => { const atual = lerPerfis(); atual.ativo = indice; gravarPerfis(atual); ordem = ordemStatus(); renderizarAbas(); renderizar(); lista.scrollTop = 0; });
      abas.append(botao);
    });
    campoNome.value = dados.perfis[dados.ativo].nome;
  }
  campoNome.addEventListener('change', () => { const dados = lerPerfis(); dados.perfis[dados.ativo].nome = campoNome.value.trim().slice(0, 24) || `Preset ${dados.ativo + 1}`; gravarPerfis(dados); renderizarAbas(); });
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
  if (selecaoPendente.tentativas >= 3 || (selecaoPendente.tentativas > 0 && agora - selecaoPendente.ultima < 500)) return;
  selecaoPendente.tentativas += 1;
  selecaoPendente.ultima = agora;
  botao.click();
}
function observar() {
  if (!ativo || modalAberto) return;
  const botoes = [...document.querySelectorAll('button.card.offer')].filter((e) => e.getClientRects().length && !e.disabled);
  if (!botoes.length) { banimentoPendente = null; observarBencao(); return; }
  // Reconhecer os três controles evita atuar em outras telas de escolhas.
  const controles = [...document.querySelectorAll('button')].filter((e) => e.getClientRects().length);
  const emBanimento = controles.some((b) => normalizar(b.textContent).includes('escolha o que banir'));
  const nomes = botoes.map((b) => b.querySelector('h3')?.textContent?.trim() || '');
  if (emBanimento) {
    if (!banimentoPendente) return;
    const pendente = banimentoPendente;
    banimentoPendente = null;
    if (Date.now() - pendente.inicio > 5000 || JSON.stringify(nomes) !== pendente.nomes ||
        botoes.some((b) => b.querySelector('.bp-badge'))) return;
    const alvo = botoes[pendente.indice];
    if (alvo && !alvo.querySelector('.bp-badge')) alvo.click();
    return;
  }
  if (banimentoPendente) {
    if (Date.now() - banimentoPendente.inicio > 5000) banimentoPendente = null;
    return;
  }
  if (!['banir', 'atualizar', 'pular'].every((texto) => controles.some((b) => normalizar(b.textContent).startsWith(texto)))) return;
  const opcoes = botoes.map((botao, indice) => {
    const tipo = botao.querySelector('.top .typeicon') ? 'golpe'
      : botao.querySelector('.top img[src*="assets/items/"]') ? 'vitamina' : undefined;
    const kind = normalizar(botao.querySelector('.kind')?.textContent);
    return { id: indice, tipo, noPlano: !!botao.querySelector('.bp-badge'),
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
    return botao && !botao.disabled && contador ? Number(contador[1]) : 0;
  };
  const decisao = decidir({ tipo: 'build', opcoes, banimentos: usos(banir), atualizacoes: usos(atualizar), pulos: usos(pular) });
  if (decisao.acao === 'aguardar') return;
  if (decisao.acao === 'selecionar') {
    selecionarComTentativa(botoes, decisao.id, assinatura);
    return;
  }
  if (assinatura === ultimoConjunto) return;
  ultimoConjunto = assinatura;
  if (decisao.acao === 'banir') {
    banimentoPendente = { indice: decisao.id, nomes: JSON.stringify(nomes), inicio: Date.now() };
    banir.click();
    agendar();
  }
  if (decisao.acao === 'atualizar') atualizar.click();
  if (decisao.acao === 'pular') pular.click();
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
