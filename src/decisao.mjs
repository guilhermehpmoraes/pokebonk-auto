// Decide a partir de dados já identificados na tela; não interage com o jogo.
export function decidirPickup(texto) {
  const primeiroRugido = 'rugido de rhydon · guardiao mais forte e com escolta, +1 great ball por rugido';
  const proximoRugido = /^rugido de rhydon \(([12])\/3\) · outro rugido: guardiao \+\d+% de hp e \+1 great ball$/.exec(texto);
  if (texto === primeiroRugido || proximoRugido) return { acao: 'interagir', estagioRhydon: proximoRugido ? Number(proximoRugido[1]) : 0 };
  const gratuitos = [
    'abrir poke bola (gratis)',
    'abrir great ball (gratis)',
    'lancar poke bola',
    'abrir poke bola amaldicoada (gratis... tem certeza?)',
    'acordar o snorlax',
    'rock smash',
    'coletar oran berries',
    'magnemite: atrai toda a experiencia',
    'altar amaldicoado · um item raro em troca de uma maldicao',
    'altar de gengar · +dificuldade, +xp e +saque',
    'altar de desafio · invoca uma onda; se voce a derrotar, great ball',
  ];
  const jaula = /^libertar\s+\S(?:.*\S)?\s+·\s+(\d+)\s+₽$/.exec(texto);
  const ovo = /^pegar o ovo pokemon · choca apos \d+(?:[.,]\d{3})* derrotas$/.test(texto);
  const alfa = /^friend ball: luta com voce nesta partida \(\d+ s\) · apoio: .+$/.test(texto);
  if (jaula) return { acao: 'interagir', custoJaula: Number(jaula[1]) };
  return gratuitos.includes(texto) || ovo || alfa ? { acao: 'interagir' } : { acao: 'aguardar' };
}

export function decidirAlfa({ existentes, novo, prioridade }) {
  if (!Array.isArray(existentes) || !existentes.length || !Array.isArray(prioridade) || !prioridade.length ||
      !novo || !existentes.every((alfa) => alfa && prioridade.includes(alfa.status)) || !prioridade.includes(novo.status)) return null;
  let pior = existentes[0];
  for (const alfa of existentes.slice(1)) if (prioridade.indexOf(alfa.status) > prioridade.indexOf(pior.status)) pior = alfa;
  return prioridade.indexOf(novo.status) < prioridade.indexOf(pior.status) ? pior.id : novo.id;
}

// Estimativas de custo por item: a Pokébola tem bônus pela escolha entre ofertas;
// no cassino 0,194 item/giro e retorno médio de 25% são valores sem sorte.
export function decidirGasto({ saldo, bola, giro, lojaEstimada, excluidos = [], bolasRestantes = null }) {
  if (![saldo, bola].every((n) => Number.isFinite(n) && n >= 0) || bola === 0) return 'aguardar';
  if (bolasRestantes === 0 && !excluidos.includes('bola')) excluidos = [...excluidos, 'bola'];
  if (!excluidos.includes('bola')) return saldo >= bola ? 'bola' : 'aguardar';
  const custos = [{ tipo: 'bola', custo: bola / 1.3, acessivel: saldo >= bola }];
  if (Number.isFinite(giro) && giro > 0) custos.push({ tipo: 'cassino', custo: giro * 0.75 / 0.194 * 1.3, acessivel: saldo >= giro });
  if (Number.isFinite(lojaEstimada) && lojaEstimada > 0) custos.push({ tipo: 'loja', custo: lojaEstimada, acessivel: saldo >= lojaEstimada * 4 });
  const elegiveis = custos.filter((item) => !excluidos.includes(item.tipo));
  elegiveis.sort((a, b) => a.custo - b.custo);
  // Não desvia o dinheiro para a segunda opção só porque a melhor não cabe no saldo.
  return elegiveis[0]?.acessivel ? elegiveis[0].tipo : 'aguardar';
}

// Mantém o preço de uma próxima Pokébola e tolera até o dobro do custo
// estimado por item dela para evitar viagens entre opções por diferenças pequenas.
export function gastoViavel({ saldo, bola, custo, itens = 1, reserva = bola }) {
  if (![saldo, bola, custo, itens].every(Number.isFinite) || saldo < 0 || bola <= 0 || custo <= 0 || itens <= 0) return false;
  if (!Number.isFinite(reserva) || reserva < 0) return false;
  return saldo >= custo + reserva && custo / itens <= 2 * bola / 1.3;
}

export function decidirLoteLoja({ saldo, precos, vendidos, avaliar = false, bola, giro, renovacao = 0, reserva = bola }) {
  if (!Number.isFinite(saldo) || saldo < 0 ||
      !Array.isArray(precos) || !Array.isArray(vendidos) || precos.length !== 4 || vendidos.length !== 4 ||
      vendidos.some((v) => typeof v !== 'boolean') || precos.some((p, i) => !vendidos[i] && (!Number.isFinite(p) || p <= 0))) return 'aguardar';
  const restantes = precos.filter((_, i) => !vendidos[i]);
  if (!restantes.length) return 'concluido';
  const total = restantes.reduce((a, b) => a + b, 0);
  if (saldo < total || (Number.isFinite(reserva) && saldo < total + reserva)) return 'aguardar';
  if (avaliar) {
    if (!Number.isFinite(bola) || bola <= 0 || !Number.isFinite(renovacao) || renovacao < 0) return 'aguardar';
    if ((total + renovacao) / restantes.length > 2 * bola / 1.3) return 'sair';
  }
  return 'comprar';
}

// Projeta a curva atual de preço; bônus futuros ou alterações do jogo mudam a previsão.
export function estimarReservaBolas({ saldo, bola, compradas, restantes }) {
  if (![saldo, bola, compradas, restantes].every(Number.isSafeInteger) || saldo < 0 || bola <= 0 || compradas < 0 || restantes < 0 || restantes > 1000) return null;
  if (!restantes) return { reserva: 0, acessiveis: 0, total: 0 };
  const curva = (n) => {
    let t = 35 * n;
    if (n > 10) t += 300 * (n - 10);
    if (n > 20) t += 550 * (n - 20);
    if (n > 30) t += 1200 * (n - 30);
    if (n > 40) t += 2400 * (n - 30);
    if (n > 50) t += 4500 * (n - 30);
    return (1.22 ** n + t / 30) * 1.12 ** Math.max(0, n - 12);
  };
  const base = curva(compradas);
  if (!Number.isFinite(base) || base <= 0) return null;
  let total = 0, reserva = 0, acessiveis = 0;
  for (let i = 0; i < restantes; i++) {
    const custo = i === 0 ? bola : Math.ceil((bola + 0.5) * curva(compradas + i) / base);
    if (!Number.isSafeInteger(custo) || !Number.isSafeInteger(total + custo)) return null;
    total += custo;
    if (total <= saldo) { reserva = total; acessiveis++; }
  }
  return { reserva: acessiveis ? reserva : bola, acessiveis, total };
}

export function decidir(tela, configuracao = {}, aleatorio = Math.random) {
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
