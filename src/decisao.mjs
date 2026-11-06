// Decide a partir de dados já identificados na tela; não interage com o jogo.
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
    if (!Array.isArray(equipadas) || equipadas.length > 3 || [...opcoes, ...equipadas].some((item) => !Number.isFinite(item.raridade) || typeof item.dano !== 'boolean')) {
      return { acao: 'aguardar', motivo: 'relíquias não reconhecidas' };
    }
    const comparar = (a, b) => a.raridade - b.raridade || Number(a.dano) - Number(b.dano);
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
