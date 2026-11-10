// Adaptador para a interface em português.
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
let inventarioAvisosAnterior = null;
let catalogoVitaminas = null;
let catalogoVitaminasCarregando = false;
let ultimaBuscaVitaminas = 0;
const chaveStatus = 'pokebonk-auto-select-status';
const chavePerfis = 'pokebonk-auto-select-perfis';
const catalogoStatus = [
  ['experiencia', 'Experiência', ['experiencia', 'exp']], ['dinheiro', 'Pokédólares', ['pokedolares', 'dinheiro', 'money']],
  ['sorte', 'Sorte', ['sorte', 'luck']], ['dano', 'Dano', ['dano']], ['dano fisico', 'Dano físico', ['dano fisico']],
  ['dano especial', 'Dano especial', ['dano especial']], ['dano critico', 'Dano crítico', ['dano critico']],
  ['chance critica', 'Chance de crítico', ['chance de critico', 'chance critica', 'chance crit', 'chance critico', 'critico']],
  ['vida', 'HP máximo', ['hp maximo', 'hp max', 'vida maxima']], ['regeneracao', 'Regeneração', ['regeneracao', 'regen']],
  ['cura', 'Cura', ['cura']],
  ['armadura', 'Armadura', ['armadura', 'defesa']], ['evasao', 'Evasão', ['evasao']],
  ['velocidade', 'Velocidade de movimento', ['velocidade de movimento', 'velocidade movimento', 'velocidade']],
  ['velocidade ataque', 'Velocidade de ataque', ['velocidade de ataque', 'vel. de ataque']], ['area', 'Área', ['area']],
  ['duracao', 'Duração', ['duracao']], ['coleta', 'Alcance de coleta', ['alcance de coleta', 'coleta']],
  ['velocidade projetil', 'Velocidade de projéteis', ['velocidade de projeteis', 'velocidade do projetil', 'velocidade de projetil']],
  ['projeteis', 'Projéteis', ['projeteis', 'projetil']], ['roubo de vida', 'Roubo de vida', ['roubo de vida', 'lifesteal']],
  ['dano elites', 'Dano a elites e chefes', ['dano a elites', 'dano em elites', 'dano contra elites', 'dano a chefes', 'dano a elites e chefes', 'dano em elites e chefes']],
  ['recarga', 'Recarga', ['recarga', 'cooldown']], ['sorteio', 'Chance de status', ['chance de status']],
  ['dano status', 'Dano de status', ['dano de status', 'dano status']],
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
function statusDeItem(texto) {
  const descricao = normalizar(texto);
  const termos = catalogoStatus.flatMap(([id, , aliases]) => aliases.map((termo) => ({ id, termo })))
    .sort((a, b) => b.termo.length - a.termo.length);
  const encontrados = [];
  let resto = descricao;
  let primeiro = true;
  while (resto) {
    const prefixo = (primeiro ? /^\+\d+(?:[.,]\d+)?\s*%?\s*(?:de\s+)?/ : /^\s*(?:[,;·]|e)\s*\+\d+(?:[.,]\d+)?\s*%?\s*(?:de\s+)?/).exec(resto);
    if (!prefixo) break;
    resto = resto.slice(prefixo[0].length);
    const correspondente = termos.find(({ termo }) => resto.startsWith(termo) && (!resto[termo.length] || /[\s.,;:!?]/.test(resto[termo.length])));
    if (!correspondente) break;
    if (!encontrados.includes(correspondente.id)) encontrados.push(correspondente.id);
    resto = resto.slice(correspondente.termo.length);
    primeiro = false;
  }
  return encontrados;
}
const painel = document.createElement('button');
painel.type = 'button';
painel.textContent = 'Auto Select: desligado';
Object.assign(painel.style, { position: 'fixed', top: '40vh', left: '8px', zIndex: '2147483647', height: '30px', boxSizing: 'border-box', padding: '4px 8px', background: '#242639', color: 'white', border: '2px solid #888', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' });
document.body.appendChild(painel);
const configuracao = document.createElement('button');
configuracao.type = 'button';
configuracao.textContent = 'Prioridade de status';
Object.assign(configuracao.style, { position: 'fixed', top: 'calc(40vh + 34px)', left: '8px', zIndex: '2147483647', height: '30px', boxSizing: 'border-box', padding: '4px 8px', background: '#242639', color: 'white', border: '2px solid #888', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' });
document.body.appendChild(configuracao);
let pickupAtivo = false;
let ultimoPickup = '';
let pickupLiberado = true;
let pickupSessao = null;
let pickupAcao = null;
let custoLojaObservado = null;
let ultimoTempoPartida = null;
let alvoGasto = null;
let zonaPlanejamento = null;
let visitaManual = null;
let bloqueiosGasto = {};
let ultimoEncontroPago = null;
let tentativasEncontro = 0;
let repetirEncontro = false;
let interacaoLivre = null;
let tentativaRhydon = null;
let ultimaTentativaFenda = 0;
let fendaAtiva = false;
let ultimoAvisoEntradaFenda = '';
let visitaHypnoAutomatica = false;
const botaoPickup = document.createElement('button');
botaoPickup.type = 'button';
botaoPickup.textContent = 'Auto Pickup: desligado';
Object.assign(botaoPickup.style, { position: 'fixed', top: 'calc(40vh + 68px)', left: '8px', zIndex: '2147483647', height: '30px', maxWidth: 'calc(100vw - 16px)', boxSizing: 'border-box', padding: '4px 8px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', background: '#242639', color: 'white', border: '2px solid #888', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' });
document.body.appendChild(botaoPickup);
const trocarAlvo = document.createElement('button');
trocarAlvo.type = 'button';
trocarAlvo.textContent = 'Trocar sugestão';
Object.assign(trocarAlvo.style, { position: 'fixed', top: 'calc(40vh + 136px)', left: '8px', zIndex: '2147483647', height: '30px', boxSizing: 'border-box', padding: '4px 8px', background: '#39435f', color: 'white', border: '1px solid #888', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', display: 'none' });
document.body.appendChild(trocarAlvo);
const painelMapa = document.createElement('div');
Object.assign(painelMapa.style, { position: 'fixed', top: 'calc(40vh + 170px)', left: '8px', zIndex: '2147483646', padding: '8px', maxWidth: 'min(240px, calc(100vw - 16px))', maxHeight: 'max(48px, calc(60vh - 302px))', overflow: 'auto', whiteSpace: 'pre-line', background: 'rgba(25, 28, 46, .9)', color: 'white', border: '1px solid #888', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', display: 'none' });
painelMapa.title = 'Clique para recolher ou expandir';
document.body.appendChild(painelMapa);
const botaoFenda = document.createElement('button');
botaoFenda.type = 'button';
botaoFenda.textContent = 'Auto Fenda: desligado';
Object.assign(botaoFenda.style, { position: 'fixed', top: 'calc(40vh + 102px)', left: '8px', zIndex: '2147483647', height: '30px', boxSizing: 'border-box', padding: '4px 8px', background: '#242639', color: 'white', border: '2px solid #888', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' });
document.body.appendChild(botaoFenda);
botaoFenda.addEventListener('click', () => {
  fendaAtiva = !fendaAtiva;
  ultimoAvisoEntradaFenda = '';
  botaoFenda.textContent = fendaAtiva ? 'Auto Fenda: ligado' : 'Auto Fenda: desligado';
  agendar();
});
let ultimaPosicaoInterface = '';
function reposicionarInterface() {
  const largura = typeof window === 'undefined' ? null : window.innerWidth;
  const janela = Number.isFinite(largura) && largura > 0 ? largura : 1200;
  const larguraMapa = Math.min(180, Math.max(90, Math.floor(janela * 0.2)));
  const disponivel = Math.min(820, Math.max(160, janela - larguraMapa - 24));
  const assinatura = `${disponivel}:${larguraMapa}`;
  if (assinatura === ultimaPosicaoInterface) return;
  ultimaPosicaoInterface = assinatura;
  const proporcoes = [0.17, 0.18, 0.48, 0.17];
  const inicio = (disponivel + larguraMapa + 4) / 2;
  let deslocamento = larguraMapa + 4;
  [painel, configuracao, botaoPickup, botaoFenda].forEach((elemento, indice) => {
    const coluna = disponivel * proporcoes[indice];
    Object.assign(elemento.style, { top: 'auto', bottom: '8px', left: `calc(50% - ${inicio}px + ${deslocamento}px)`, width: `${coluna - 4}px`, height: 'auto', minHeight: '30px', whiteSpace: 'normal', overflowWrap: 'anywhere', overflow: 'visible', textOverflow: 'clip' });
    deslocamento += coluna;
  });
  Object.assign(trocarAlvo.style, { top: 'auto', bottom: '74px', left: `calc(50% - ${inicio}px + ${larguraMapa + 4 + disponivel * 0.35}px)` });
  Object.assign(painelMapa.style, { top: 'auto', bottom: '8px', left: `calc(50% - ${inicio}px)`, width: `${larguraMapa}px`, boxSizing: 'border-box', maxHeight: 'min(160px, 25vh)' });
}
let mapaRecolhido = false, mapaInstancia = null, mapaHookInstalado = false, mapaCarregando = false, mapaUltimaBusca = 0;
let moduloDadosJogo = null;
painelMapa.addEventListener('click', () => { mapaRecolhido = !mapaRecolhido; agendar(); });
const nomesMapa = { chest: 'Pokébolas pagas', freechest: 'Pokébolas grátis', cursedchest: 'Pokébolas amaldiçoadas', altar: 'Altares Unown', cursed: 'Altares amaldiçoados', challenge: 'Desafios', cage: 'Jaulas', rock: 'Rock Smash', shroom: 'Cogumelos', slots: 'Cassinos', magnet: 'Magnemite', berry: 'Oran Berries', meowth: 'Lojas Meowth', greed: 'Altares Gengar', ditto: 'Ditto', hypno: 'Hypno', snorlax: 'Snorlax', fossil: 'Fósseis', rhydon: 'Rhydon', porygon: 'Porygon', dojo: 'Dojo', nest: 'Ovos', bill: 'Máquinas de Bill', boss: 'Guardião', portal: 'Portais', shrine: 'Santuário', bonk: 'Bonkoins', comet: 'Fragmentos de cometa' };
async function instalarLeituraMapa() {
  if (mapaHookInstalado || mapaCarregando || typeof performance === 'undefined' || typeof location === 'undefined' || Date.now() - mapaUltimaBusca < 3000) return;
  mapaUltimaBusca = Date.now(); mapaCarregando = true;
  try {
    const urls = [...new Set(performance.getEntriesByType('resource').map((r) => r.name).filter((endereco) => {
      try { const url = new URL(endereco, location.href); return url.origin === location.origin && /^\/assets\/menus-[A-Za-z0-9_-]+\.js$/.test(url.pathname); } catch (_) { return false; }
    }))];
    // A entrada de performance pode ter sido descartada quando o navegador
    // atingiu o limite do buffer. Esta URL foi conferida na build indicada.
    if (!urls.length) {
      const arquivos = { mw88813m: 'menus-DqU5mYee-mw88813m.js', mwaj5w8h: 'menus-CchmOi1N-mwaj5w8h.js' };
      const arquivo = arquivos[document.querySelector('meta[name="pokebonk-build"]')?.content];
      if (arquivo) urls.push(new URL(`/assets/${arquivo}`, location.href).href);
    }
    if (urls.length !== 1) return;
    const modulo = await import(urls[0]);
    moduloDadosJogo = modulo;
    const classes = [...new Set(Object.values(modulo).filter((classe) => typeof classe === 'function' && typeof classe.prototype?.markers === 'function' && typeof classe.prototype?.chestCost === 'function' && typeof classe.prototype?.add === 'function'))];
    if (classes.length !== 1) return;
    const prototipo = classes[0].prototype;
    // O HUD consulta o preço mesmo quando o minimapa não pede marcadores.
    for (const metodo of ['markers', 'chestCost']) {
      const original = prototipo[metodo];
      prototipo[metodo] = function (...args) {
        const resultado = original.apply(this, args);
        if (!this.disposed && this.run?.interactables === this && Array.isArray(this.list) &&
            (metodo !== 'markers' || Array.isArray(resultado))) mapaInstancia = this;
        return resultado;
      };
    }
    // Durante a construção o jogo preenche a lista antes de atribuir
    // run.interactables; confira novamente após terminar a construção.
    const adicionar = prototipo.add, pendentes = new WeakSet();
    prototipo.add = function (...args) {
      const resultado = adicionar.apply(this, args);
      if (!pendentes.has(this)) {
        pendentes.add(this);
        setTimeout(() => {
          pendentes.delete(this);
          if (!this.disposed && this.run?.interactables === this && Array.isArray(this.list)) mapaInstancia = this;
        }, 0);
      }
      return resultado;
    };
    mapaHookInstalado = true;
  } catch (_) { /* Jogo incompatível: mantém a leitura indisponível. */ }
  finally { mapaCarregando = false; }
}
function lerMapa(carteira) {
  const instancia = mapaInstancia;
  if (!instancia || instancia.disposed || instancia.run?.interactables !== instancia || !Array.isArray(instancia.list)) return null;
  try {
    const objetos = instancia.markers();
    if (!Array.isArray(objetos) || objetos.some((objeto) => !objeto || typeof objeto.kind !== 'string' || typeof objeto.used !== 'boolean')) return null;
    const contagem = {};
    for (const objeto of objetos) {
      const tipo = objeto.data?.comet ? 'comet' : objeto.kind;
      contagem[tipo] = (contagem[tipo] || 0) + 1;
    }
    const restantes = objetos.filter((objeto) => objeto.kind === 'chest' && !objeto.used && !objeto.data?.comet).length;
    const compilacao = document.querySelector('meta[name="pokebonk-build"]')?.content;
    const previsao = compilacao === 'mw6akj2h' && carteira?.bolaBruta === instancia.chestCost()
      ? estimarReservaBolas({ saldo: carteira.saldo, bola: carteira.bolaBruta, compradas: instancia.run.chestsBought, restantes }) : null;
    return { contagem, restantes, previsao };
  } catch (_) { return null; }
}
function atualizarMapa(carteira) {
  void instalarLeituraMapa();
  if (!carteira) { painelMapa.style.display = 'none'; return null; }
  const mapa = lerMapa(carteira);
  painelMapa.style.display = 'block';
  let texto = 'Mapa · clique para ' + (mapaRecolhido ? 'expandir' : 'recolher');
  if (!mapa) texto += '\nAguardando dados do jogo';
  else if (!mapaRecolhido) {
    const linhas = Object.entries(mapa.contagem).sort(([a], [b]) => a === 'chest' ? -1 : b === 'chest' ? 1 : (nomesMapa[a] || a).localeCompare(nomesMapa[b] || b));
    texto += '\n' + (linhas.length ? linhas.map(([tipo, quantidade]) => `${nomesMapa[tipo] || tipo}: ${quantidade}`).join('\n') : 'Nenhum objeto restante');
    if (mapa.previsao) texto += `\nBolas pagas no saldo: ${mapa.previsao.acessiveis}/${mapa.restantes}\nPara todas: ${mapa.previsao.total.toLocaleString('pt-BR')} ₽\nReserva estimada: ${mapa.previsao.reserva.toLocaleString('pt-BR')} ₽`;
    else if (mapa.restantes) texto += '\nReserva: preço da próxima bola (estimativa indisponível)';
  }
  if (painelMapa.textContent !== texto) painelMapa.textContent = texto;
  return mapa;
}
function limparAlvo() { alvoGasto = null; visitaManual = null; ultimoPickup = ''; }
function concluirAlvo(tipo) {
  if (tipo === 'loja') bloqueiosGasto.loja = Date.now() + 30000;
  if (tipo === alvoGasto) limparAlvo();
  else { visitaManual = null; ultimoPickup = ''; }
}
trocarAlvo.addEventListener('click', () => {
  if (!pickupAtivo || pickupSessao || !alvoGasto) return;
  bloqueiosGasto[alvoGasto] = Date.now() + 30000;
  limparAlvo(); agendar();
});
botaoPickup.addEventListener('click', () => {
  pickupAtivo = !pickupAtivo;
  visitaHypnoAutomatica = false;
  ultimoPickup = '';
  pickupSessao = null; pickupAcao = null; limparAlvo(); bloqueiosGasto = {}; ultimoEncontroPago = null; tentativasEncontro = 0; repetirEncontro = false; interacaoLivre = null; tentativaRhydon = null;
  trocarAlvo.style.display = 'none';
  botaoPickup.textContent = pickupAtivo ? 'Auto Pickup: ligado' : 'Auto Pickup: desligado';
  agendar();
});

function numeroPickup(texto, limite = 'estimado') {
  const valor = String(texto ?? '').trim();
  const compacto = /^(\d+)(?:[.,](\d+))?\s*([kmb])$/i.exec(valor);
  if (compacto) {
    const escala = { k: 1e3, m: 1e6, b: 1e9 }[compacto[3].toLowerCase()];
    const precisao = compacto[2]?.length || 0;
    const unidade = escala / 10 ** precisao;
    const estimado = Number(`${compacto[1]}.${compacto[2] || '0'}`) * escala;
    if (!Number.isSafeInteger(Math.round(estimado)) || !Number.isFinite(unidade)) return null;
    if (limite === 'inferior') return Math.max(0, Math.floor(estimado - unidade));
    if (limite === 'superior') return Math.ceil(estimado + unidade);
    return Math.round(estimado);
  }
  if (!/^\d{1,3}(?:[.,\s]\d{3})*$|^\d+$/.test(valor)) return null;
  return Number(valor.replace(/[.,\s]/g, ''));
}
function carteiraPickup() {
  const wallet = document.querySelector?.('#hud .wallet');
  if (!wallet || !wallet.getClientRects().length) { custoLojaObservado = null; return null; }
  const ler = (seletor) => {
    const chip = wallet.querySelector(seletor);
    return chip && chip.getClientRects().length ? numeroPickup(chip.querySelector('em')?.textContent) : null;
  };
  const lerExato = (seletor) => {
    const chip = wallet.querySelector(seletor);
    const texto = chip && chip.getClientRects().length ? chip.querySelector('em')?.textContent?.trim() : '';
    return texto && !/[kmb]/i.test(texto) ? numeroPickup(texto) : null;
  };
  const zona = /\bzona\s+(\d+)\s*\/\s*3\b/.exec(normalizar(document.querySelector('#hud .ht-zone')?.textContent));
  const numeroZona = zona ? Number(zona[1]) : null;
  const escala = numeroZona >= 1 && numeroZona <= 3 ? 2.2 ** (numeroZona - 1) : null;
  const tempo = /^(\d+):(\d{2})(?:[.,]\d+)?$/.exec(document.querySelector('#hud .runclock b')?.textContent?.trim() || '');
  if (tempo) {
    const segundos = Number(tempo[1]) * 60 + Number(tempo[2]);
    if (ultimoTempoPartida !== null && segundos < ultimoTempoPartida - 5) { custoLojaObservado = null; limparAlvo(); bloqueiosGasto = {}; pickupSessao = null; ultimoEncontroPago = null; }
    ultimoTempoPartida = segundos;
  }
  if (numeroZona && zonaPlanejamento && numeroZona !== zonaPlanejamento) { limparAlvo(); bloqueiosGasto = {}; pickupSessao = null; ultimoEncontroPago = null; }
  if (numeroZona) zonaPlanejamento = numeroZona;
  if (custoLojaObservado && (custoLojaObservado.zona !== numeroZona || Date.now() - custoLojaObservado.em > 60000 || Date.now() < custoLojaObservado.em)) custoLojaObservado = null;
  if (ler('.wl-shop') !== null && !escala) return null;
  const dadosBrutos = /^\d+\|(\d+|-)\|(\d+|-)(?:\||$)/.exec(wallet.dataset.k || '');
  const bolaVisivel = ler('.wl-ball');
  const giroVisivel = ler('.wl-slots');
  const bolaBruta = bolaVisivel === null ? null : dadosBrutos ? numeroPickup(dadosBrutos[1]) : lerExato('.wl-ball');
  const giroBruto = giroVisivel === null ? null : dadosBrutos ? numeroPickup(dadosBrutos[2]) : lerExato('.wl-slots');
  return { saldo: numeroPickup(wallet.dataset.g), bola: bolaBruta ?? bolaVisivel, bolaBruta, giro: giroBruto ?? giroVisivel, giroBruto, zona: numeroZona,
    lojaEstimada: ler('.wl-shop') !== null && escala ? (custoLojaObservado?.valor ?? 130 * escala) : null };
}
function atualizarIndicadorPickup(texto) {
  const conteudo = `Auto Pickup: ligado · ${texto}`;
  if (botaoPickup.textContent !== conteudo) botaoPickup.textContent = conteudo;
  botaoPickup.title = conteudo;
}
function acaoPickup(botao, assinatura) {
  if (!botao || botao.disabled || pickupAcao === assinatura) return;
  pickupAcao = assinatura;
  botao.click();
}
function observarModalPickup(modal, carteira) {
  if (!pickupSessao || Date.now() - pickupSessao.inicio < 400) return;
  if (pickupSessao.tipo === 'cassino' && modal.querySelector('.sl-cab')) {
    const cabine = modal.querySelector('.sl-cab');
    const botoes = [...modal.querySelectorAll('.actions button')];
    const resumo = modal.querySelector('.sl-sum');
    if (resumo) {
      const titulo = normalizar(resumo.querySelector?.('h3')?.textContent);
      const botoesResumo = [...(resumo.querySelectorAll?.('button') || [])].filter((b) => {
        const tecla = b.querySelector?.('kbd')?.textContent || '';
        const texto = b.textContent || '';
        return ['ver meus premios', 'continuar girando'].includes(normalizar(tecla && texto.endsWith(tecla) ? texto.slice(0, -tecla.length) : texto));
      });
      if (!/^resumo de (?:[2-9]|10) giros$/.test(titulo) || botoesResumo.length !== 1 || botoesResumo[0].disabled) return;
      let tentativa = pickupSessao.resumo;
      if (!tentativa || tentativa.elemento !== resumo) tentativa = pickupSessao.resumo = { elemento: resumo, quantidade: 0, ultima: 0 };
      const agora = Date.now();
      if (tentativa.quantidade < 3 && (!tentativa.quantidade || agora - tentativa.ultima >= 800)) {
        tentativa.quantidade++; tentativa.ultima = agora; botoesResumo[0].click();
      }
      return;
    }
    pickupSessao.resumo = null;
    if (cabine.classList.contains('spinning')) {
      const pular = botoes.filter((b) => {
        const tecla = b.querySelector?.('kbd')?.textContent || '';
        const texto = b.textContent || '';
        return normalizar(tecla && texto.endsWith(tecla) ? texto.slice(0, -tecla.length) : texto) === 'pular animacao';
      });
      if (pular.length !== 1 || pular[0].disabled) return;
      const giros = numeroPickup(cabine.querySelector?.('.sl-led span:nth-child(2) b')?.textContent);
      let tentativa = pickupSessao.salto;
      if (!tentativa || tentativa.giros !== giros) tentativa = pickupSessao.salto = { giros, quantidade: 0, ultima: 0 };
      const agora = Date.now();
      if (tentativa.quantidade < 3 && (!tentativa.quantidade || agora - tentativa.ultima >= 400)) {
        tentativa.quantidade++; tentativa.ultima = agora; pular[0].click();
      }
      return;
    }
    pickupSessao.salto = null;
    if (!carteira) return;
    const girar = botoes.find((b) => /^girar\s*·\s*[\d.,\s]+[kmb]?\s*₽/i.test(normalizar(b.textContent)));
    const sair = botoes.find((b) => normalizar(b.textContent) === 'sair');
    const valor = numeroPickup(/girar\s*·\s*([\d.,\s]+[kmb]?)\s*₽/i.exec(girar?.textContent || '')?.[1], 'superior');
    const primeiroMinimo = numeroPickup(/girar\s*·\s*([\d.,\s]+[kmb]?)\s*₽/i.exec(girar?.textContent || '')?.[1], 'inferior');
    const saldo = numeroPickup(/^\s*([\d.,\s]+[kmb]?)\s*₽\s*$/i.exec(modal.querySelector('.sl-gold')?.textContent || '')?.[1], 'inferior');
    if (!girar || !sair || valor === null || saldo === null) return;
    const giros = numeroPickup(cabine.querySelector?.('.sl-led span:nth-child(2) b')?.textContent);
    const assinatura = `${valor}:${saldo}:${giros}`;
    if (!gastoViavel({ saldo, bola: carteira.bola, reserva: carteira.reserva, custo: valor, itens: 0.194 / (0.75 * 1.3) })) { pickupSessao.saiuPorEstrategia = true; acaoPickup(sair, `sair-cassino:${valor}`); return; }
    let tentativa = pickupSessao.giro;
    const lotes = botoes.filter((b) => b.classList?.contains('sl-x10') && !b.disabled);
    const lote = lotes.length === 1 ? lotes[0] : null;
    const dadosLote = /^\s*×\s*(\d+)\s*·\s*([\d.,\s]+[kmb]?)\s*₽/i.exec(lote?.textContent || '');
    const quantidade = dadosLote ? Number(dadosLote[1]) : null;
    const custo = dadosLote ? numeroPickup(dadosLote[2], 'superior') : null;
    const usarLote = lote && loteCassinoViavel({ saldo, bola: carteira.bola, reserva: carteira.reserva, custo, primeiroMinimo, quantidade });
    const botao = usarLote ? lote : girar;
    const assinaturaAcao = `${assinatura}:${usarLote ? `lote:${quantidade}:${custo}` : 'individual'}`;
    if (!tentativa || tentativa.assinatura !== assinaturaAcao) tentativa = pickupSessao.giro = { assinatura: assinaturaAcao, quantidade: 0, ultima: 0 };
    const agora = Date.now();
    if (!botao.disabled && tentativa.quantidade < 3 && (!tentativa.quantidade || agora - tentativa.ultima >= 800)) {
      if (!pickupSessao.giroInicialAssinatura) pickupSessao.giroInicialAssinatura = assinatura;
      tentativa.quantidade++; tentativa.ultima = agora; botao.click();
    }
    return;
  }
  if (!carteira || pickupSessao.tipo !== 'loja' || !modal.classList.contains('shop-modal')) return;
  const cartoes = [...modal.querySelectorAll('.cards > button.card')];
  if (cartoes.length < 1 || cartoes.length > 4) return;
  const dados = cartoes.map((cartao) => {
    const preco = cartao.querySelector('.price');
    const vendido = preco?.classList.contains('sold');
    const capacidade = /(?:voce tem)\s*(\d+)\s*\/\s*(\d+)/.exec(normalizar(cartao.querySelector('.cap')?.textContent));
    const valor = numeroPickup(/^\s*([\d.,\s]+[kmb]?)\s*₽\s*$/i.exec(preco?.textContent || '')?.[1], 'superior');
    const raridade = raridades[normalizar(cartao.querySelector('.rar')?.textContent)];
    return { vendido, valor, capacidade, cartao, raridade };
  });
  if (dados.some((d) => typeof d.vendido !== 'boolean' || !d.capacidade || (!d.vendido && d.valor === null))) return;
  // Os itens compartilham um multiplicador de preço; inferi-lo dos preços
  // visíveis evita confundir a renovação barata com um estoque barato.
  const bases = [80, 130, 220, 400, 750];
  const estimativas = dados.filter((d) => !d.vendido && d.valor !== null && d.raridade >= 1 && d.raridade <= 5)
    .map((d) => d.valor / bases[d.raridade - 1] * 130);
  if (estimativas.length) {
    pickupSessao.custoMedio = Math.max(pickupSessao.custoMedio || 0, ...estimativas);
    if (carteira.zona >= 1 && carteira.zona <= 3) custoLojaObservado = { zona: carteira.zona, valor: pickupSessao.custoMedio, em: Date.now() };
  }
  const saldo = numeroPickup(/·\s*([\d.,\s]+[kmb]?)\s*₽\s*$/i.exec(modal.querySelector('h1')?.textContent || '')?.[1], 'inferior');
  if (saldo === null) return;
  const indisponiveis = dados.map((d) => d.vendido || Number(d.capacidade[1]) >= Number(d.capacidade[2]));
  const resultado = decidirLoteLoja({ saldo, precos: dados.map((d) => d.valor), vendidos: indisponiveis,
    avaliar: !pickupSessao.loteIniciado, bola: carteira.bola, reserva: carteira.reserva, giro: carteira.giro, renovacao: pickupSessao.custoRenovacao || 0 });
  const assinatura = dados.map((d) => `${d.cartao.querySelector('h3')?.textContent}:${d.vendido}:${d.valor}`).join('|');
  if (resultado === 'comprar') {
    const proximo = dados.find((_, i) => !indisponiveis[i]);
    pickupSessao.loteIniciado = true;
    acaoPickup(proximo.cartao, `comprar:${assinatura}`);
    return;
  }
  if (resultado === 'concluido') {
    const renovar = modal.querySelector('button.shop-reroll');
    const valor = numeroPickup(/·\s*([\d.,\s]+[kmb]?)\s*₽/i.exec(renovar?.textContent || '')?.[1], 'superior');
    const custoPrevisto = pickupSessao.custoMedio;
    if (valor !== null && custoPrevisto &&
        gastoViavel({ saldo, bola: carteira.bola, reserva: carteira.reserva, custo: valor + custoPrevisto * 4, itens: 4 }) && !renovar.disabled) {
      pickupSessao.custoRenovacao = valor;
      pickupSessao.loteIniciado = false;
      acaoPickup(renovar, `renovar:${assinatura}:${valor}`);
      return;
    }
  }
  const sair = modal.querySelector('button.shop-exit');
  acaoPickup(sair, `sair-loja:${assinatura}:${saldo}`);
}
function modalDoAlvo(modal, tipo) {
  if (tipo === 'cassino') return !!modal.querySelector?.('.sl-cab');
  if (tipo === 'loja') return !!modal.classList?.contains('shop-modal') && !!modal.querySelector?.('button.shop-exit');
  if (tipo !== 'bola') return false;
  const cards = [...(modal.querySelectorAll?.('button.card') || [])];
  const botoes = [...(modal.querySelectorAll?.('button') || [])];
  return cards.some((card) => !!card.querySelector?.('.top img[src*="assets/items/"]')) &&
    botoes.some((botao) => normalizar(botao.textContent).startsWith('nenhum'));
}
function modalRecompensaCassino(modal) {
  if (modalDoAlvo(modal, 'bola')) return true;
  const titulos = [...(modal.querySelectorAll?.('h1,h2,h3,div,span') || [])];
  const botoes = [...(modal.querySelectorAll?.('button') || [])];
  return titulos.some((el) => normalizar(el.textContent) === 'voce encontrou um item!') &&
    botoes.some((el) => /^pegar\s*e?$/.test(normalizar(el.textContent))) &&
    botoes.some((el) => normalizar(el.textContent).startsWith('vender'));
}
function observarFenda() {
  if (!fendaAtiva || modalAberto || pickupSessao || interacaoLivre || !pickupLiberado) return;
  if ([...document.querySelectorAll('.modal')].some((el) => el.getClientRects().length)) return;
  if (document.activeElement?.matches?.('input, textarea, select, [contenteditable="true"]')) return;
  const instancia = mapaInstancia;
  const run = instancia?.run;
  const botao = document.querySelector?.('#hud .inc');
  if (!botao?.getClientRects().length || !botao.classList.contains('ready') || normalizar(botao.querySelector('kbd')?.textContent) !== 'c') return;
  try {
    if (instancia) {
      if (instancia.disposed || run?.interactables !== instancia || run.state !== 'play' || run.player?.dead) return;
      const fendas = run.teamRifts?.enabled ? run.teamRifts : run.rifts;
      if (typeof fendas?.useBlock !== 'function' || fendas.useBlock() !== null) return;
    }
    if (Date.now() - ultimaTentativaFenda < (instancia ? 2000 : 5000)) return;
    ultimaTentativaFenda = Date.now();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', code: 'KeyC', bubbles: true }));
    setTimeout(() => window.dispatchEvent(new KeyboardEvent('keyup', { key: 'c', code: 'KeyC', bubbles: true })), 100);
  } catch (_) { /* Não abre a Fenda se os dados do jogo forem ambíguos. */ }
}
function entradaDeFenda(texto) {
  try {
    const instancia = mapaInstancia, run = instancia?.run, fendas = run?.rifts;
    // O aviso de entrada só aparece na interação de Fenda solo; o próprio jogo
    // verifica impedimentos ao receber E, mesmo se a captura do mapa falhar.
    if (!instancia) return /^entrar na fenda de [a-z ]+ \((?:comum|incomum|rara|epica|lendaria)\) · (?:\d+ ondas|\d+ s de ondas) e seu alfa$/.test(texto);
    if (!instancia || instancia.disposed || run?.interactables !== instancia || run.state !== 'play' ||
        typeof fendas?.nearEntrance !== 'function' || !fendas.nearEntrance() ||
        typeof fendas.enterBlock !== 'function' || fendas.enterBlock() !== null ||
        typeof fendas.entranceLabel !== 'function') return false;
    const aviso = normalizar(fendas.entranceLabel()).replace(/^\[e\]\s*/, '');
    return !!aviso && aviso === texto;
  } catch (_) { return false; }
}
function observarEntradaFenda() {
  if (!fendaAtiva || modalAberto || pickupSessao || !pickupLiberado) return;
  if ([...document.querySelectorAll('.modal')].some((el) => el.getClientRects().length) ||
      document.activeElement?.matches?.('input, textarea, select, [contenteditable="true"]')) return;
  if (interacaoLivre && (interacaoLivre.viuModal || Date.now() - interacaoLivre.inicio > 3000)) interacaoLivre = null;
  if (interacaoLivre) return;
  const prompts = [...document.querySelectorAll('#hud .prompt')].filter((el) => el.getClientRects().length);
  if (prompts.length !== 1) { ultimoAvisoEntradaFenda = ''; return; }
  const prompt = prompts[0], tecla = prompt.querySelector('kbd')?.textContent?.trim();
  const texto = normalizar(prompt.textContent.slice(tecla?.length || 0));
  if (tecla !== 'E' || !entradaDeFenda(texto)) { ultimoAvisoEntradaFenda = ''; return; }
  if (ultimoAvisoEntradaFenda === texto) return;
  ultimoAvisoEntradaFenda = texto;
  interacaoLivre = { inicio: Date.now(), viuModal: false };
  pickupLiberado = false;
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e', code: 'KeyE', bubbles: true }));
  setTimeout(() => { window.dispatchEvent(new KeyboardEvent('keyup', { key: 'e', code: 'KeyE', bubbles: true })); pickupLiberado = true; }, 100);
}
function observarPickup() {
  const carteira = carteiraPickup();
  const mapa = atualizarMapa(carteira);
  if (carteira) { carteira.bolasRestantes = mapa?.restantes ?? null; carteira.reserva = mapa?.previsao?.reserva ?? carteira.bola; }
  if (!pickupAtivo || modalAberto) return;
  const nomes = { bola: 'Sugestão: Pokébola', cassino: 'Sugestão: Cassino', loja: 'Sugestão: Loja do Meowth', aguardar: 'Aguardando dados ou saldo' };
  const visiveis = (seletor) => [...document.querySelectorAll(seletor)].filter((el) => el.getClientRects().length);
  const modais = visiveis('.modal');
  const indicadores = () => {
    trocarAlvo.style.display = alvoGasto && !pickupSessao && !visitaManual && !modais.length ? 'block' : 'none';
    return nomes[alvoGasto] || nomes.aguardar;
  };
  if (document.activeElement?.matches?.('input, textarea, select, [contenteditable="true"]')) { atualizarIndicadorPickup(indicadores()); return; }
  if (modais.length) {
    let texto = indicadores();
    if (modais.length === 1) {
      if (interacaoLivre) interacaoLivre.viuModal = true;
      if (pickupSessao && modalDoAlvo(modais[0], pickupSessao.tipo)) pickupSessao.viuModal = true;
      if (pickupSessao?.tipo === 'cassino' && pickupSessao.giroInicialAssinatura && !pickupSessao.saiuPorEstrategia && modalRecompensaCassino(modais[0])) pickupSessao.recompensa = true;
      if (!pickupSessao && !interacaoLivre && alvoGasto && modalDoAlvo(modais[0], alvoGasto)) visitaManual = alvoGasto;
      if (pickupSessao?.tipo === 'loja' && modais[0].classList.contains('shop-modal')) texto = 'Loja: avaliando itens';
      if (pickupSessao?.tipo === 'cassino' && modais[0].querySelector('.sl-cab')) texto = 'Cassino: avaliando giro';
      if (pickupSessao?.tipo === 'bola' && pickupSessao.viuModal) texto = 'Pokébola: aguardando escolha';
      atualizarIndicadorPickup(texto);
      observarModalPickup(modais[0], carteira);
    } else atualizarIndicadorPickup(texto);
    return;
  }
  if (interacaoLivre && (interacaoLivre.viuModal || Date.now() - interacaoLivre.inicio > 3000)) interacaoLivre = null;
  if (pickupSessao) {
    if (pickupSessao.tipo === 'cassino' && pickupSessao.viuModal && pickupSessao.giroInicialAssinatura && !pickupSessao.saiuPorEstrategia && !pickupSessao.recompensa) {
      pickupSessao.fechouEm ??= Date.now();
      if (Date.now() - pickupSessao.fechouEm < 3000) { atualizarIndicadorPickup('Cassino: aguardando possível recompensa'); return; }
    }
    const bolaComprada = pickupSessao.tipo === 'bola' && carteira && pickupSessao.precoBase !== null &&
      (carteira.bolaBruta ?? carteira.bola) !== null && (carteira.bolaBruta ?? carteira.bola) !== pickupSessao.precoBase;
    if (pickupSessao.viuModal || bolaComprada) {
      if (pickupSessao.tipo === 'cassino' && pickupSessao.recompensa && !pickupSessao.saiuPorEstrategia && carteira &&
          gastoViavel({ saldo: carteira.saldo, bola: carteira.bola, reserva: carteira.reserva, custo: carteira.giro, itens: 0.194 / (0.75 * 1.3) })) {
        ultimoEncontroPago = null; ultimoPickup = ''; tentativasEncontro = 0;
      }
      concluirAlvo(pickupSessao.tipo); pickupSessao = null; pickupAcao = null;
    } else if (Date.now() - pickupSessao.inicio > 3000) {
      pickupSessao = null; pickupAcao = null; ultimoPickup = ''; repetirEncontro = true;
    } else { atualizarIndicadorPickup(indicadores()); return; }
  }
  if (visitaManual) concluirAlvo(visitaManual);
  if (!alvoGasto && carteira) {
    const excluidos = Object.keys(bloqueiosGasto).filter((tipo) => bloqueiosGasto[tipo] > Date.now());
    if (ultimoEncontroPago && !excluidos.includes(ultimoEncontroPago)) excluidos.push(ultimoEncontroPago);
    const escolhido = decidirGasto({ ...carteira, excluidos });
    if (escolhido !== 'aguardar') alvoGasto = escolhido;
  }
  atualizarIndicadorPickup(indicadores());
  if (ativo) {
    const estado = estadoPlanoPartida();
    if (estado?.errados.length) atualizarIndicadorPickup('Procure Hypno: ataque fora do plano');
    else if (estado?.ceder.length) atualizarIndicadorPickup('Procure Hypno: liberar espaço para a build');
  }
  const prompts = visiveis('#hud .prompt');
  if (prompts.length !== 1) { ultimoPickup = ''; ultimoEncontroPago = null; tentativasEncontro = 0; repetirEncontro = false; tentativaRhydon = null; return; }
  const prompt = prompts[0];
  const tecla = prompt.querySelector('kbd')?.textContent?.trim();
  const texto = normalizar(prompt.textContent.slice(tecla?.length || 0));
  let tipo = null;
  const precoBola = /^abrir poke bola · ([\d.,\s]+[kmb]?) ₽$/.exec(texto);
  const precoGiro = /^caca-niqueis · ([\d.,\s]+[kmb]?) ₽ por giro$/.exec(texto);
  const encontro = precoBola ? 'bola' : precoGiro ? 'cassino' : texto === 'falar com o meowth (loja)' ? 'loja' : null;
  if (encontro !== ultimoEncontroPago) { ultimoEncontroPago = null; tentativasEncontro = 0; repetirEncontro = false; }
  if (precoBola && carteira?.bolaBruta !== null && carteira?.bolaBruta !== undefined && numeroPickup(precoBola[1]) === carteira.bolaBruta && carteira.saldo >= carteira.bolaBruta) tipo = 'bola';
  if (precoGiro && carteira?.giroBruto !== null && carteira?.giroBruto !== undefined && numeroPickup(precoGiro[1]) === carteira.giroBruto && carteira.saldo >= carteira.giroBruto) tipo = 'cassino';
  if (encontro === 'loja' && carteira && Number.isFinite(carteira.saldo) && carteira.saldo > 0) tipo = 'loja';
  const decisaoLivre = decidirPickup(texto);
  let interacaoBuild = false;
  if (ativo && pickupAtivo && tecla === 'E' && /^(?:maquina do bill · (?:uma fusao pronta|uma fusao, a escolher entre \d+ pares)|hypno: (?:esqueca e aprenda · licao pronta|esqueca um ataque ou vitamina))$/.test(texto)) {
    const estado = estadoPlanoPartida();
    if (estado && estado.run.state === 'play') {
      if (texto.startsWith('maquina do bill')) {
        interacaoBuild = operacoesProntas(estado).length > 0;
        if (!interacaoBuild) atualizarIndicadorPickup(estado.decisao.fundir.length
          ? 'Bill: par seguro ainda não está no nível 8' : 'Bill: nenhuma operação planejada segura');
      }
      else if ((estado.errados.length || estado.ceder.length) && estado.presentes.length > 1) { interacaoBuild = true; visitaHypnoAutomatica = true; }
    } else if (!estado) atualizarIndicadorPickup(`${texto.startsWith('maquina do bill') ? 'Bill' : 'Hypno'}: ${motivoPlano}`);
    else atualizarIndicadorPickup('Aguardando partida ficar ativa');
  }
  if (decisaoLivre.custoJaula !== undefined && (!carteira || !Number.isSafeInteger(decisaoLivre.custoJaula) || carteira.saldo < decisaoLivre.custoJaula)) return;
  if (decisaoLivre.acao !== 'interagir' && !tipo && !interacaoBuild || tecla !== 'E') { ultimoPickup = ''; tentativaRhydon = null; return; }
  const estagioRhydon = decisaoLivre.estagioRhydon;
  if (estagioRhydon === undefined) tentativaRhydon = null;
  else if (!tentativaRhydon || tentativaRhydon.estagio !== estagioRhydon) tentativaRhydon = { estagio: estagioRhydon, tentativas: 0, ultima: 0 };
  const repetirRhydon = tentativaRhydon && tentativaRhydon.tentativas < 3 && (!tentativaRhydon.tentativas || Date.now() - tentativaRhydon.ultima >= 800);
  if (!pickupLiberado || (ultimoPickup === texto && !repetirRhydon) || (tentativaRhydon && !repetirRhydon) || (tipo && ultimoEncontroPago === tipo && (!repetirEncontro || tentativasEncontro >= 3))) return;
  ultimoPickup = texto;
  if (tentativaRhydon) { tentativaRhydon.tentativas++; tentativaRhydon.ultima = Date.now(); }
  if (tipo) { ultimoEncontroPago = tipo; tentativasEncontro++; repetirEncontro = false; pickupSessao = { tipo, inicio: Date.now(), precoBase: tipo === 'bola' ? (carteira.bolaBruta ?? carteira.bola) : null }; pickupAcao = null; }
  else interacaoLivre = { inicio: Date.now(), viuModal: false };
  pickupLiberado = false;
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e', code: 'KeyE', bubbles: true }));
  setTimeout(() => {
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'e', code: 'KeyE', bubbles: true }));
    pickupLiberado = true;
  }, 100);
}
function atualizarVisibilidadeAvisos() {
  if (!painelAvisos) return;
  const hud = document.querySelector('#hud .wallet');
  painelAvisos.style.display = avisosForaPlano.length && hud?.getClientRects().length ? 'block' : 'none';
}
function atualizarAvisos() {
  try { sessionStorage.setItem(chaveAvisos, JSON.stringify(avisosForaPlano)); } catch (_) { /* mantém os avisos em memória */ }
  if (!avisosForaPlano.length && !painelAvisos) return;
  if (!painelAvisos) {
    painelAvisos = document.createElement('aside');
    painelAvisos.setAttribute('aria-label', 'Itens fora da build');
    painelAvisos.style.cssText = 'position:fixed;left:50%;bottom:42px;z-index:2147483647;width:min(280px,calc(50vw - 16px));max-height:120px;overflow:auto;padding:8px;background:#38251c;color:#fff5e7;border:2px solid #f5a953;border-radius:12px;box-shadow:0 8px 28px #0008;font:13px system-ui,sans-serif';
    painelAvisos.addEventListener('click', (event) => event.stopPropagation());
    painelAvisos.addEventListener('pointerdown', (event) => event.stopPropagation());
    document.body.appendChild(painelAvisos);
  }
  painelAvisos.replaceChildren();
  atualizarVisibilidadeAvisos();
  if (!avisosForaPlano.length) return;
  const titulo = document.createElement('strong'); titulo.textContent = '⚠️ Fora da build — confira no Hypno';
  const descricao = document.createElement('div'); descricao.textContent = 'Remova os itens fora do plano no Hypno.'; descricao.style.cssText = 'margin:4px 0 8px;color:#ffe3be';
  painelAvisos.append(titulo, descricao);
  avisosForaPlano.forEach((aviso) => {
    const linha = document.createElement('div'); linha.style.cssText = 'display:flex;gap:8px;align-items:center;margin-top:5px';
    const nome = document.createElement('span'); nome.style.cssText = 'flex:1;overflow-wrap:anywhere'; nome.textContent = `${aviso.nome} (${aviso.tipo})`;
    linha.append(nome); painelAvisos.append(linha);
  });
}
function registrarForaPlano(nome, tipo) {
  if (!nome || !['golpe', 'vitamina'].includes(tipo)) return;
  if (avisosForaPlano.some((item) => item.tipo === tipo && normalizar(item.nome) === normalizar(nome))) return;
  avisosForaPlano.push({ nome, tipo }); inventarioAvisosAnterior = null; atualizarAvisos();
}
function verificarAvisoPendente() {
  if (!avisoPendente) return;
  const { botao, nome, tipo } = avisoPendente;
  if (botao.isConnected === false || !botao.getClientRects().length || botao.querySelector('h3')?.textContent?.trim() !== nome) {
    avisoPendente = null; registrarForaPlano(nome, tipo);
  }
}

async function carregarCatalogoVitaminas() {
  if (catalogoVitaminas || catalogoVitaminasCarregando || typeof performance === 'undefined' || typeof location === 'undefined' ||
      document.querySelector?.('meta[name="pokebonk-build"]')?.content !== 'mw88813m' || Date.now() - ultimaBuscaVitaminas < 3000) return;
  ultimaBuscaVitaminas = Date.now(); catalogoVitaminasCarregando = true;
  try {
    const urls = [...new Set(performance.getEntriesByType('resource').map((item) => item.name).filter((endereco) => {
      try { const url = new URL(endereco, location.href); return url.origin === location.origin && /^\/assets\/defineProperty-[A-Za-z0-9_-]+\.js$/.test(url.pathname); } catch (_) { return false; }
    }))];
    if (!urls.length) urls.push(new URL('/assets/defineProperty-Cvp-y8z_-mw88813m.js', location.href).href);
    if (urls.length !== 1) return;
    const modulo = await import(urls[0]);
    if (typeof modulo.ao?.get === 'function') { catalogoVitaminas = modulo.ao; inventarioAvisosAnterior = null; agendar(); }
  } catch (_) { /* Conserva os avisos quando o catálogo não pode ser identificado. */ }
  finally { catalogoVitaminasCarregando = false; }
}

function sincronizarAvisosComInventario() {
  if (!avisosForaPlano.length) { inventarioAvisosAnterior = null; return; }
  const instancia = mapaInstancia, run = instancia?.run, player = run?.player;
  if (document.querySelector?.('meta[name="pokebonk-build"]')?.content !== 'mw88813m' ||
      !instancia || instancia.disposed || run?.interactables !== instancia || !['play', 'modal', 'paused'].includes(run.state) ||
      !Array.isArray(player?.moves) || !Number.isInteger(player.moveSlots) || player.moveSlots < 1 ||
      player.moves.length < player.moveSlots || player.moveSlots > 4) { inventarioAvisosAnterior = null; return; }
  const inventario = { golpe: [], vitamina: null };
  try {
    for (const movimento of player.moves) {
      if (!movimento) continue;
      if (typeof movimento.def?.name !== 'string' || !movimento.def.name.trim() || !Array.isArray(movimento.parents)) throw new Error();
      inventario.golpe.push(normalizar(movimento.def.name));
      if (movimento.link) {
        if (typeof movimento.link.def?.name !== 'string' || !movimento.link.def.name.trim()) throw new Error();
        inventario.golpe.push(normalizar(movimento.link.def.name));
      }
      for (const id of movimento.parents) {
        if (document.querySelector?.('meta[name="pokebonk-build"]')?.content !== 'mw88813m' || typeof moduloDadosJogo?.Qi !== 'function') throw new Error();
        const pai = moduloDadosJogo.Qi(id, player.roster?.id ?? 0);
        if (!pai || typeof pai.name !== 'string' || !pai.name.trim()) throw new Error();
        inventario.golpe.push(normalizar(pai.name));
      }
    }
  } catch (_) { inventario.golpe = null; }
  if (avisosForaPlano.some((aviso) => aviso.tipo === 'vitamina')) {
    if (!catalogoVitaminas) void carregarCatalogoVitaminas();
    try {
      if (typeof player.vitamins?.entries !== 'function' || !Number.isInteger(player.vitamins.size) || !catalogoVitaminas) throw new Error();
      const vitaminas = [...player.vitamins.entries()];
      if (vitaminas.length !== player.vitamins.size) throw new Error();
      inventario.vitamina = vitaminas.map(([key]) => {
        const nome = catalogoVitaminas.get(key)?.name;
        if (typeof key !== 'string' || typeof nome !== 'string' || !nome.trim()) throw new Error();
        return normalizar(nome);
      });
    } catch (_) { inventario.vitamina = null; }
  }
  const assinatura = JSON.stringify(inventario), agora = Date.now();
  if (!inventarioAvisosAnterior || inventarioAvisosAnterior.run !== run || inventarioAvisosAnterior.player !== player || inventarioAvisosAnterior.assinatura !== assinatura) {
    inventarioAvisosAnterior = { run, player, assinatura, inicio: agora }; return;
  }
  if (agora - inventarioAvisosAnterior.inicio < 500) return;
  const restantes = reconciliarAvisos(avisosForaPlano, inventario);
  if (restantes.length !== avisosForaPlano.length) { avisosForaPlano = restantes; atualizarAvisos(); }
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
  painel.textContent = ativo ? 'Auto Select: ligado' : 'Auto Select: desligado';
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

// Usa apenas a build interna conferida; em qualquer incompatibilidade, não age.
let cacheReceitasBill = null;
let motivoPlano = 'aguardando dados da partida';
function falhaPlano(motivo) { motivoPlano = motivo; return null; }
function estadoPlanoPartida() {
  try {
    const instancia = mapaInstancia, run = instancia?.run, player = run?.player, plano = run?.planSnap;
    const compilacao = document.querySelector?.('meta[name="pokebonk-build"]')?.content;
    const exportsPorBuild = { mw88813m: ['Qi', 'Dr'], mwaj5w8h: ['$i', 'Or'] };
    const exports = exportsPorBuild[compilacao];
    if (!exports) return falhaPlano('versão do jogo não reconhecida');
    if (!instancia || instancia.disposed || run?.interactables !== instancia) return falhaPlano('aguardando dados da partida');
    const definirGolpe = moduloDadosJogo?.[exports[0]], combinarGolpes = moduloDadosJogo?.[exports[1]];
    if (typeof definirGolpe !== 'function' || typeof combinarGolpes !== 'function') return falhaPlano('catálogo do jogo indisponível');
    if (!plano || !Array.isArray(plano.moves) || !Array.isArray(plano.fus) || !Array.isArray(plano.links)) return falhaPlano('plano da partida indisponível');
    if (!Array.isArray(player?.moves) || !Array.isArray(run.fusions) || typeof run.banished?.has !== 'function' ||
        !Number.isInteger(player.moveSlots) || player.moveSlots < 1 || player.moveSlots > 4) return falhaPlano('ataques equipados não reconhecidos');
    if (!plano.moves.length || plano.moves.length > 8 || plano.fus.length + plano.links.length > 3 || plano.moves.some((id) => !Number.isInteger(id)) ||
        plano.links.some((par) => !Array.isArray(par) || par.length !== 2 || par[0] === par[1] || par.some((id) => !plano.moves.includes(id))) ||
        new Set(plano.links.flat()).size !== plano.links.length * 2) return falhaPlano('plano de ataques inválido');
    if (plano.moves.some((id) => run.banished.has(`m${id}`))) return falhaPlano('plano contém ataque banido');
    const assinatura = JSON.stringify([plano.moves, plano.fus, plano.links, player.roster?.id]);
    if (!cacheReceitasBill || cacheReceitasBill.run !== run || cacheReceitasBill.assinatura !== assinatura) {
      const defs = plano.moves.map((id) => definirGolpe(id, player.roster?.id ?? 0));
      if (defs.some((def, i) => !def || def.id !== plano.moves[i] || !def.key || !def.name || !def.type)) return falhaPlano('catálogo de ataques incompleto');
      const falso = Object.create(player);
      Object.defineProperty(falso, 'moves', { value: defs.map((def) => ({ def, level: 8, parents: [], link: null })) });
      const pares = combinarGolpes({ player: falso, banished: new Set() });
      if (!Array.isArray(pares)) return falhaPlano('combinações de ataque indisponíveis');
      const receitas = plano.fus.map((id) => { const encontrados = pares.filter((p) => p?.r?.key === id && p.a >= 0 && p.b >= 0 && p.a < defs.length && p.b < defs.length); return { id, nome: encontrados[0]?.r?.name, pares: encontrados.map((p) => [defs[p.a].id, defs[p.b].id]) }; });
      if (receitas.some((r) => !r.pares.length)) return falhaPlano('receita do plano sem par reconhecido');
      const paresUniao = pares.filter((p) => p && p.boon && Number.isInteger(p.a) && Number.isInteger(p.b) && p.a >= 0 && p.b >= 0 && p.a < defs.length && p.b < defs.length && p.a !== p.b)
        .map((p) => [defs[p.a].id, defs[p.b].id]);
      if (plano.links.some((par) => !paresUniao.some((p) => p.includes(par[0]) && p.includes(par[1])))) return falhaPlano('união do plano incompatível');
      const livres = Math.min(3 - plano.fus.length, Math.floor((plano.moves.length - 2 * plano.fus.length) / 2));
      const receitasUniao = plano.links.map((par, i) => ({ id: `uniao:plano:${i}`, pares: [par], uniao: true, planejada: true }));
      for (let i = receitasUniao.length; i < livres && paresUniao.length; i++) receitasUniao.push({ id: `uniao:livre:${i}`, pares: paresUniao, uniao: true });
      receitas.push(...receitasUniao);
      cacheReceitasBill = { run, assinatura, defs, receitas };
    }
    const presentes = player.moves.filter(Boolean);
    if (presentes.some((m) => !m?.def || !Array.isArray(m.parents) || (m.link && (!m.link.def || m.def.fusion || m.link.def.fusion || m.link.link)))) return falhaPlano('ataques unidos ou dados incompletos');
    const fusoesConcluidas = presentes.filter((m) => m.def.fusion).map((m) => m.def.key);
    if (fusoesConcluidas.some((id) => !plano.fus.includes(id)) || new Set(fusoesConcluidas).size !== fusoesConcluidas.length ||
        run.fusions.some((id) => plano.fus.includes(id) && !fusoesConcluidas.includes(id))) return falhaPlano('fusões equipadas não correspondem ao plano');
    const consumidos = presentes.filter((m) => m.def.fusion).flatMap((m) => m.parents);
    if (consumidos.length !== 2 * fusoesConcluidas.length || consumidos.some((id) => !plano.moves.includes(id))) return falhaPlano('ingredientes da fusão não reconhecidos');
    const concluidas = [...fusoesConcluidas];
    for (const movimento of presentes.filter((m) => m.link)) {
      const par = [movimento.def.id, movimento.link.def.id];
      if (par[0] === par[1] || par.some((id) => !plano.moves.includes(id) || consumidos.includes(id))) return falhaPlano('união equipada não corresponde ao plano');
      const receita = cacheReceitasBill.receitas.filter((r) => r.uniao && !concluidas.includes(r.id) && r.pares.some((p) => p.includes(par[0]) && p.includes(par[1])))
        .sort((a, b) => Number(!!b.planejada) - Number(!!a.planejada))[0];
      if (!receita) return falhaPlano('união equipada não corresponde ao plano');
      consumidos.push(...par); concluidas.push(receita.id);
    }
    const normais = presentes.filter((m) => !m.def.fusion && !m.link);
    if (normais.some((m) => { const def = cacheReceitasBill.defs.find((d) => d.id === m.def.id); return def && (def.key !== m.def.key || def.type !== m.def.type); })) return falhaPlano('ataques divergem do catálogo');
    const assinaturaAtuais = JSON.stringify(player.moves.map((m) => m ? [m.def?.id, m.level, !!m.link, !!m.def?.fusion] : null));
    if (cacheReceitasBill.atual !== assinaturaAtuais) {
      const atuais = combinarGolpes(run);
      if (!Array.isArray(atuais)) return falhaPlano('combinações equipadas indisponíveis');
      for (const par of atuais) {
        if (par.a < 0 || par.b < 0) continue;
        const a = player.moves[par.a]?.def?.id, b = player.moves[par.b]?.def?.id;
        if (!plano.moves.includes(a) || !plano.moves.includes(b)) continue;
        const receita = cacheReceitasBill.receitas.find((r) => !r.uniao && r.pares.some((p) => p.includes(a) && p.includes(b)));
        if (receita && receita.id !== par.r?.key) return falhaPlano('combinação diverge da receita');
      }
      cacheReceitasBill.atual = assinaturaAtuais;
    }
    const errados = normais.filter((m) => !plano.moves.includes(m.def.id));
    const equipados = normais.filter((m) => plano.moves.includes(m.def.id)).map((m) => m.def.id);
    const espacos = player.moveSlots - errados.length;
    const entrada = { golpes: plano.moves, equipados, consumidos, concluidas, receitas: cacheReceitasBill.receitas, espacos };
    const decisao = planejarFusoes(entrada);
    if (!decisao) return falhaPlano('dados insuficientes para planejar');
    const ceder = errados.length ? [] : golpesParaAbrirEspaco(entrada);
    motivoPlano = '';
    const aprenderAposHypno = golpesAposRemoverErrados({ entrada, errados: errados.length, espacosTotais: player.moveSlots });
    return { run, plano, defs: cacheReceitasBill.defs, receitas: cacheReceitasBill.receitas, presentes, errados, ceder, decisao, entrada, aprenderAposHypno };
  } catch (erro) {
    const classe = ['TypeError', 'RangeError', 'ReferenceError'].includes(erro?.name) ? ` (${erro.name})` : '';
    return falhaPlano(`erro ao ler dados da partida${classe}`);
  }
}

function operacoesProntas(estado) {
  return estado.decisao.fundir.filter(({ par }) => par.every((id) => estado.presentes.some((m) => !m.def.fusion && !m.link && m.def.id === id && Number.isInteger(m.level) && m.level >= 8)));
}

function pesoGolpeNaPartida(estado, id) {
  const calcular = (receitas) => prioridadeGolpePlano({ receitas, concluidas: estado.entrada.concluidas,
    equipados: estado.entrada.equipados, id });
  return 100 * calcular(estado.receitas.filter((r) => !r.uniao)) + calcular(estado.receitas.filter((r) => r.uniao && r.planejada));
}

function observarBuildEspecial() {
  if (!ativo || !pickupAtivo || modalAberto) return false;
  const modais = [...document.querySelectorAll('.modal')].filter((el) => el.getClientRects().length);
  const estado = estadoPlanoPartida();
  if (!estado) return false;
  for (const erro of estado.errados) registrarForaPlano(erro.def.name, 'golpe');
  if (modais.length !== 1) { if (!modais.length && !interacaoLivre) visitaHypnoAutomatica = false; return false; }
  const modal = modais[0], bill = modal.querySelector?.('.bm-win');
  if (bill) {
    const prontas = operacoesProntas(estado);
    const linhas = [...(bill.querySelectorAll?.('button.bm-row') || [])];
    const nomes = new Map(estado.defs.map((def) => [def.id, normalizar(def.name)]));
    const candidatos = linhas.flatMap((linha) => {
      if (linha.disabled || linha.classList.contains('off')) return [];
      const par = normalizar(linha.querySelector('.bm-pair')?.textContent).split('+').map((n) => n.trim());
      const resultado = normalizar(linha.querySelector('.bm-rtx b')?.textContent);
      if (par.length !== 2 || !resultado) return [];
      return prontas.filter((f) => {
        const receita = estado.receitas.find((r) => r.id === f.id);
        const esperado = f.par.map((id) => nomes.get(id)).sort();
        return (receita?.uniao || resultado === normalizar(receita?.nome)) && JSON.stringify(par.slice().sort()) === JSON.stringify(esperado);
      }).map((f) => ({ linha, f }));
    });
    if (!candidatos.length) return true;
    candidatos.sort((a, b) => {
      const ra = estado.receitas.find((r) => r.id === a.f.id), rb = estado.receitas.find((r) => r.id === b.f.id);
      return Number(!!ra.uniao) - Number(!!rb.uniao) || Number(!!rb.planejada) - Number(!!ra.planejada);
    });
    const alvo = candidatos[0];
    if (!alvo.linha.classList.contains('sel')) { alvo.linha.click(); agendar(); return true; }
    const receitaAlvo = estado.receitas.find((r) => r.id === alvo.f.id);
    const tipo = receitaAlvo.uniao ? 'link' : 'fuse';
    const abas = [...(bill.querySelectorAll?.('.bm-tabs button.bm-tab') || [])];
    const aba = abas.find((b) => normalizar(b.querySelector?.('b')?.textContent) === (tipo === 'link' ? 'unir' : 'fundir'));
    if (aba && !aba.classList.contains('on')) { if (!aba.disabled) { aba.click(); agendar(); } return true; }
    if (tipo === 'link') {
      const cartao = bill.querySelector('.bm-card.link'), go = bill.querySelector('button.bm-go.link');
      const movimentos = [...(cartao?.querySelectorAll?.('.bm-lmove b') || [])].map((el) => normalizar(el.textContent)).sort();
      const esperados = alvo.f.par.map((id) => nomes.get(id)).sort();
      if (!cartao || JSON.stringify(movimentos) !== JSON.stringify(esperados) || !go || go.disabled ||
          !normalizar(go.textContent).startsWith('unir os dois ataques')) return true;
      selecionarComTentativa([go], 0, `bill:${alvo.f.id}:${alvo.f.par.join(':')}`);
      return true;
    }
    const cartao = bill.querySelector('.bm-card.fuse'), go = bill.querySelector('button.bm-go.fuse');
    const nome = estado.receitas.find((r) => r.id === alvo.f.id)?.nome;
    if (!cartao || normalizar(cartao.querySelector('h3')?.textContent) !== normalizar(nome) || !go || go.disabled ||
        !normalizar(go.textContent).startsWith(`fundir em ${normalizar(nome)}`)) return true;
    selecionarComTentativa([go], 0, `bill:${alvo.f.id}:${alvo.f.par.join(':')}`);
    return true;
  }
  if (!modal.classList?.contains('hy-modal')) return false;
  const titulo = normalizar(modal.querySelector('h1')?.textContent);
  if (titulo === 'hypno te ensina') {
    const cartoes = [...(modal.querySelectorAll?.('.cards > button.card.offer') || [])];
    if (!cartoes.length || cartoes.some((c) => !c.querySelector('h3')?.textContent || normalizar(c.querySelector('.kind')?.textContent) !== 'novo')) return true;
    const opcoes = cartoes.flatMap((c) => {
      const defs = estado.defs.filter((d) => estado.decisao.aprender.includes(d.id) && normalizar(d.name) === normalizar(c.querySelector('h3').textContent));
      return defs.length === 1 ? [{ cartao: c, peso: pesoGolpeNaPartida(estado, defs[0].id) }] : [];
    });
    if (opcoes.length) {
      const maior = Math.max(...opcoes.map((o) => o.peso)), melhores = opcoes.filter((o) => o.peso === maior).map((o) => o.cartao);
      selecionarComTentativa(melhores, Math.floor(Math.random() * melhores.length), `hypno-licao:${cartoes.map((c) => c.outerHTML).join('|')}`);
    }
    else {
      const botoes = [...(modal.querySelectorAll?.('.actions button') || [])].filter((b) => normalizar(b.textContent) === 'agora nao (guardar a licao)');
      if (botoes.length === 1 && !botoes[0].disabled) selecionarComTentativa(botoes, 0, `hypno-guardar:${cartoes.map((c) => c.outerHTML).join('|')}`);
    }
    return true;
  }
  if (titulo !== 'hypno') return true;
  const listas = [...(modal.querySelectorAll?.('.hy-list') || [])];
  if (!listas.length) return true;
  const linhas = [...(listas[0].querySelectorAll?.('.hy-row') || [])];
  const cediveis = estado.presentes.filter((m) => estado.ceder.includes(m.def.id)).sort((a, b) => a.level - b.level);
  for (const errado of (estado.errados.length ? estado.errados : cediveis)) {
    const alvo = linhas.filter((linha) => {
      const nome = normalizar(linha.querySelector('h4')?.textContent);
      return nome === `${normalizar(errado.def.name)} · nv. ${errado.level}` && !!linha.querySelector('.hy-share') && !linha.querySelector('.hy-mem');
    });
    if (alvo.length !== 1) return true;
    const botao = alvo[0].querySelector('button');
    if (botao && !botao.disabled && /^esquecer \(\+[\d.,\s]+ ₽\)$/.test(normalizar(botao.textContent))) selecionarComTentativa([botao], 0, `hypno-remover:${errado.def.id}:${errado.level}`);
    return true;
  }
  if (visitaHypnoAutomatica) {
    const sair = modal.querySelector('button.shop-exit');
    if (sair && normalizar(sair.textContent) === 'pronto' && !sair.disabled) { visitaHypnoAutomatica = false; sair.click(); }
  }
  return true;
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
  reposicionarInterface();
  atualizarVisibilidadeAvisos();
  verificarAvisoPendente();
  observarPickup();
  sincronizarAvisosComInventario();
  observarFenda();
  observarEntradaFenda();
  if (observarBuildEspecial()) return;
  if (pickupAtivo && !modalAberto && observarAlfa()) return;
  if (pickupAtivo && !modalAberto && observarFossil()) return;
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
        JSON.stringify(botoes.map((b) => !!b.querySelector('.bp-badge'))) !== pendente.selos ||
        (pendente.plano && JSON.stringify(mapaInstancia?.run?.planSnap) !== pendente.plano)) { banimentoPendente = null; return; }
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
  const estadoBuild = estadoPlanoPartida();
  if (!estadoBuild && (mapaInstancia?.run?.planSnap?.fus?.length || mapaInstancia?.run?.planSnap?.links?.length)) {
    if (pickupAtivo) atualizarIndicadorPickup(`Plano: ${motivoPlano}`);
    return;
  }
  if (estadoBuild && estadoBuild.receitas.length) {
    const novas = opcoes.filter((o) => o.noPlano && o.tipo === 'golpe' && o.estado === 'novo');
    if (novas.length) {
      const baniveis = opcoes.filter((o) => !o.noPlano && o.estado === 'novo' &&
        !estadoBuild.defs.some((def) => normalizar(def.name) === normalizar(nomes[o.id]))).map((o) => o.id);
      const candidatas = novas.flatMap((opcao) => {
        const encontrados = estadoBuild.defs.filter((def) => normalizar(def.name) === normalizar(nomes[opcao.id]));
        if (encontrados.length !== 1) return [];
        const direto = estadoBuild.decisao.aprender.includes(encontrados[0].id);
        if (!direto && (!pickupAtivo || !estadoBuild.aprenderAposHypno.includes(encontrados[0].id))) return [];
        const pontuacao = pesoGolpeNaPartida(estadoBuild, encontrados[0].id);
        return [{ opcao, pontuacao, direto }];
      });
      if (candidatas.length) {
        const diretas = candidatas.filter((c) => c.direto);
        const elegiveis = diretas.length ? diretas : candidatas;
        const maior = Math.max(...elegiveis.map((c) => c.pontuacao));
        const melhores = elegiveis.filter((c) => c.pontuacao === maior);
        selecionarComTentativa(botoes, melhores[Math.floor(Math.random() * melhores.length)].opcao.id, assinatura);
        return;
      }
      for (const opcao of novas) opcao.noPlano = false;
      if (!opcoes.some((opcao) => opcao.noPlano || opcao.estado === 'melhoria')) {
        const temporarios = pickupAtivo && !estadoBuild.errados.length ? novas.flatMap((opcao) => {
          const defs = estadoBuild.defs.filter((def) => normalizar(def.name) === normalizar(nomes[opcao.id]));
          if (defs.length !== 1 || estadoBuild.entrada.equipados.includes(defs[0].id) || estadoBuild.entrada.consumidos.includes(defs[0].id)) return [];
          const depois = { ...estadoBuild.entrada, equipados: [...estadoBuild.entrada.equipados, defs[0].id] };
          return golpesParaAbrirEspaco(depois).includes(defs[0].id) ? [opcao.id] : [];
        }) : [];
        const acao = decidirSemGolpeSeguro({ banimentos: usos(banir), baniveis, atualizacoes: usos(atualizar), pulos: usos(pular), temporarios });
        if (acao.acao === 'aguardar' && pickupAtivo) atualizarIndicadorPickup(estadoBuild.errados.length ? 'Plano: confira ataque errado no Hypno' : 'Plano: aguardando escolha segura');
        if (acao.acao === 'selecionar') selecionarComTentativa(botoes, acao.id, assinatura);
        else if (acao.acao !== 'aguardar' && assinatura !== ultimoConjunto) {
          ultimoConjunto = assinatura;
          if (acao.acao === 'banir') {
            banimentoPendente = { indice: acao.id, nomes: JSON.stringify(nomes), selos: JSON.stringify(botoes.map((b) => !!b.querySelector('.bp-badge'))), plano: JSON.stringify(estadoBuild.plano), inicio: Date.now(), fase: 'escolher', tentativas: 0 };
            banir.click(); agendar();
          } else (acao.acao === 'atualizar' ? atualizar : pular).click();
        }
        return;
      }
    }
  }
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
    banimentoPendente = { indice: decisao.id, nomes: JSON.stringify(nomes), selos: JSON.stringify(botoes.map((b) => !!b.querySelector('.bp-badge'))), inicio: Date.now(), fase: 'escolher', tentativas: 0 };
    banir.click();
    agendar();
  }
  if (decisao.acao === 'atualizar') atualizar.click();
  if (decisao.acao === 'pular') pular.click();
}
function observarFossil() {
  const modais = [...document.querySelectorAll('.modal')].filter((el) => el.getClientRects().length);
  if (modais.length !== 1) return false;
  const cartoes = [...(modais[0].querySelectorAll?.('button.card.pact.trade') || [])];
  if (!cartoes.length) return false;
  const opcoes = cartoes.map((cartao, id) => ({ id,
    nome: normalizar(cartao.querySelector('h3')?.textContent),
    ganho: normalizar(cartao.querySelector('.pact-line.boon b')?.textContent),
    custo: normalizar(cartao.querySelector('.pact-line.bane b')?.textContent).replace(/[.!]+$/, ''),
  }));
  const indice = decidirFossil(opcoes);
  if (indice === null || cartoes[indice].disabled || !cartoes[indice].getClientRects().length) return true;
  selecionarComTentativa(cartoes, indice, 'fossil:' + cartoes.map((cartao) => cartao.outerHTML).join('|'));
  return true;
}
function observarAlfa() {
  const modais = [...document.querySelectorAll('.modal')].filter((el) => el.getClientRects().length);
  if (modais.length !== 1) return false;
  const modal = modais[0];
  const titulo = normalizar(modal.querySelector?.('h1')?.textContent);
  const ajuda = normalizar(modal.querySelector?.('.help')?.textContent);
  const alfa = titulo.endsWith('quer se juntar a sua equipe!') && ajuda.startsWith('sua equipe esta completa: escolha quem libertar');
  const brilhante = titulo.endsWith('brilhante quer te acompanhar!') && ajuda.startsWith('so um brilhante pode te acompanhar: escolha qual libertar.');
  if (!alfa && !brilhante) return false;
  const cartoes = [...(modal.querySelectorAll?.('.cards > button.card') || [])];
  if (cartoes.length < 2 || cartoes.length > 5 || (brilhante && cartoes.length !== 2)) return true;
  const prioridade = ordemStatus();
  const dados = cartoes.map((cartao, id) => {
    const selo = normalizar(cartao.querySelector('.rar')?.textContent);
    const acao = normalizar(cartao.querySelector('.key')?.textContent);
    const status = identificarStatus(cartao.querySelector('.bd > p')?.textContent, false);
    return { id, status, novo: selo === 'novo' && acao === 'libertar o novo', existente: /^vinculo \d+$/.test(selo) && acao === 'libertar' };
  });
  const novos = dados.filter((item) => item.novo), existentes = dados.filter((item) => item.existente);
  if (novos.length !== 1 || existentes.length !== dados.length - 1) return true;
  const indice = decidirAlfa({ existentes, novo: novos[0], prioridade });
  if (indice === null) return true;
  const assinatura = (brilhante ? 'brilhante:' : 'alfa:') + cartoes.map((cartao) => cartao.outerHTML).join('|');
  selecionarComTentativa(cartoes, indice, assinatura);
  return true;
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
  const opcoes = botoes.map((botao, indice) => ({ id: indice, raridade: raridades[normalizar(botao.querySelector('.rar')?.textContent)],
    status: statusDeItem(botao.querySelector('.bd > p')?.textContent) }));
  const assinatura = botoes.map((b) => b.outerHTML).join('|');
  const decisao = decidir({ tipo: 'powerup', opcoes }, { status: ordemStatus() });
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
  selecionarComTentativa([pegar], 0, assinatura);
}
new MutationObserver(agendar).observe(document.body, { childList: true, subtree: true, characterData: true });
// Algumas mudanças só alteram estilos ou atributos; faz uma conferência periódica.
setInterval(agendar, 500);
