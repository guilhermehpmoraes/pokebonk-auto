// Protótipo para a interface em português.
const normalizar = (texto) => (texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
const raridades = { comum: 1, incomum: 2, raro: 3, rara: 3, epico: 4, epica: 4, lendario: 5, lendaria: 5 };
let ativo = false;
let ultimoConjunto = '';
let banimentoPendente = null;
let timer;
const chaveStatus = 'pokebonk-auto-select-status';
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
  ['dano elites', 'Dano a elites e chefes', ['dano a elites', 'dano contra elites', 'dano a chefes', 'dano a elites e chefes']],
  ['recarga', 'Recarga', ['recarga', 'cooldown']], ['sorteio', 'Chance de status', ['chance de status']],
];
const aliasesStatus = { exp: 'experiencia', xp: 'experiencia', money: 'dinheiro', pokedolares: 'dinheiro', luck: 'sorte' };
const canonico = (nome) => aliasesStatus[normalizar(nome)] || normalizar(nome);
const ordemStatus = () => {
  let salva = [];
  try { const raw = localStorage.getItem(chaveStatus); if (raw) salva = raw.startsWith('[') ? JSON.parse(raw) : raw.split(','); } catch (_) { /* usa padrão */ }
  return [...new Set([...salva.map(canonico).filter(Boolean), ...catalogoStatus.map(([id]) => id)])];
};
const salvarStatus = (ordem) => { localStorage.setItem(chaveStatus, JSON.stringify(ordem)); ultimoConjunto = ''; };
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
    <header style="padding:22px 24px 12px"><div style="color:#ffcd76;font-size:12px;font-weight:800;letter-spacing:.12em">POKÉBONK · AUTO SELECT</div><h2 style="margin:8px 0;font-size:24px">Prioridade dos status</h2><div style="color:#b7c0da;font-size:14px">Arraste para ordenar. A prioridade vem primeiro; a raridade desempata.</div></header>
    <ol style="margin:0;padding:8px 24px;overflow:auto;list-style:none;display:grid;gap:7px"></ol>
    <footer style="padding:16px 24px;display:flex;justify-content:space-between;align-items:center;gap:8px;border-top:1px solid #363d56"><small style="color:#aeb7d1">Salvo automaticamente neste navegador</small><button type="button" data-close style="background:#f5a953;color:#261705;border:0;border-radius:10px;padding:10px 20px;font-weight:800;cursor:pointer">Concluir</button></footer></section>`;
  overlay.addEventListener('keydown', (event) => { event.stopPropagation(); if (event.key === 'Escape') fechar(); });
  overlay.addEventListener('keyup', (event) => event.stopPropagation());
  overlay.addEventListener('click', (event) => event.stopPropagation());
  const lista = overlay.querySelector('ol');
  let arrastado = null;
  function mover(de, para) { if (de < 0 || para < 0 || para >= ordem.length || de === para) return; const [item] = ordem.splice(de, 1); ordem.splice(para, 0, item); salvarStatus(ordem); renderizar(); }
  function renderizar() {
    lista.replaceChildren();
    ordem.forEach((id, indice) => {
      const item = document.createElement('li'); item.draggable = true;
      item.style.cssText = 'background:#282f49;border:1px solid #414c6b;border-radius:11px;display:flex;align-items:center;gap:12px;padding:9px 12px;cursor:grab';
      const numero = document.createElement('span'); numero.style.cssText = 'color:#ffbf69;font-size:12px;font-weight:800;min-width:24px'; numero.textContent = String(indice + 1).padStart(2, '0');
      const nome = document.createElement('span'); nome.style.cssText = 'flex:1;font-size:14px;font-weight:650'; nome.textContent = catalogoStatus.find((entrada) => entrada[0] === id)?.[1] || id;
      const criarSeta = (texto, deslocamento) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = texto; b.setAttribute('aria-label', `${deslocamento < 0 ? 'Subir' : 'Descer'} ${nome.textContent}`); b.disabled = indice + deslocamento < 0 || indice + deslocamento >= ordem.length; b.style.cssText = 'background:#39435f;color:white;border:0;border-radius:6px;padding:4px 8px;cursor:pointer'; b.onclick = () => mover(indice, indice + deslocamento); return b; };
      const alca = document.createElement('span'); alca.textContent = '⋮⋮'; alca.style.color = '#8995b7';
      item.append(alca, numero, nome, criarSeta('↑', -1), criarSeta('↓', 1));
      item.addEventListener('dragstart', (e) => { arrastado = id; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', id); });
      item.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
      item.addEventListener('drop', (e) => { e.preventDefault(); mover(ordem.indexOf(arrastado), ordem.indexOf(id)); arrastado = null; });
      lista.append(item);
    });
  }
  function fechar() { overlay.remove(); modalAberto = false; agendar(); }
  overlay.querySelector('[data-close]').addEventListener('click', fechar);
  document.body.appendChild(overlay); renderizar(); overlay.querySelector('[data-close]').focus();
}
painel.addEventListener('click', () => {
  ativo = !ativo;
  ultimoConjunto = '';
  banimentoPendente = null;
  painel.textContent = ativo ? 'Auto Select: ligado (protótipo)' : 'Auto Select: desligado';
  agendar();
});

function agendar() {
  if (timer) return;
  timer = setTimeout(() => { timer = null; observar(); }, 150);
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
  if (document.querySelector('.ban-warn')) return;
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
  if (assinatura === ultimoConjunto) return;
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
  ultimoConjunto = assinatura;
  if (decisao.acao === 'selecionar') botoes[decisao.id].click();
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
  if (assinatura === ultimoConjunto) return;
  const decisao = decidir({ tipo: 'status', opcoes }, { status: prioridade });
  if (decisao.acao !== 'selecionar') return;
  ultimoConjunto = assinatura;
  botoes[decisao.id].click();
}
function observarItens() {
  const visivel = (e) => e.getClientRects().length && !e.disabled;
  const nenhum = [...document.querySelectorAll('button')].some((b) => visivel(b) && normalizar(b.textContent).startsWith('nenhum'));
  const botoes = [...document.querySelectorAll('button.card')].filter((e) => visivel(e) && !e.classList.contains('offer') && e.querySelector('.cap') && e.querySelector('.top img[src*="assets/items/"]'));
  if (!nenhum || !botoes.length) { observarItemUnico(); return; }
  const opcoes = botoes.map((botao, indice) => ({ id: indice, raridade: raridades[normalizar(botao.querySelector('.rar')?.textContent)] }));
  const assinatura = botoes.map((b) => b.outerHTML).join('|');
  if (assinatura === ultimoConjunto) return;
  const decisao = decidir({ tipo: 'powerup', opcoes });
  if (decisao.acao !== 'selecionar') return;
  ultimoConjunto = assinatura;
  botoes[decisao.id].click();
}
function observarItemUnico() {
  const visivel = (e) => e.getClientRects().length && !e.disabled;
  const titulo = [...document.querySelectorAll('h1,h2,h3,div,span')].some((e) => visivel(e) && normalizar(e.textContent) === 'voce encontrou um item!');
  const botoes = [...document.querySelectorAll('button')].filter(visivel);
  const pegar = botoes.find((b) => /^pegar\s*e?$/.test(normalizar(b.textContent)));
  const vender = botoes.some((b) => normalizar(b.textContent).startsWith('vender'));
  if (!titulo || !pegar || !vender) { ultimoConjunto = ''; return; }
  const assinatura = `item-unico:${document.querySelector('.card h3')?.textContent || ''}:${pegar.outerHTML}`;
  if (assinatura === ultimoConjunto) return;
  ultimoConjunto = assinatura;
  pegar.click();
}
new MutationObserver(agendar).observe(document.body, { childList: true, subtree: true, characterData: true });
// Algumas mudanças só alteram estilos ou atributos; faz uma conferência periódica.
setInterval(agendar, 500);
