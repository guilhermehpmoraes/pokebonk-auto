// Falha fechada quando dados do jogo ou planos não permitem comprovar a segurança.
export function kitPodeSerBanido(nome, kits, pokedex, planos) {
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
