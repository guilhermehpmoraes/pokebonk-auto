import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decidir, planejarFusoes } from '../src/decisao.mjs';

test('planejamento reserva ingredientes específicos e aceita alternativas flexíveis seguras', () => {
  const base = { golpes: [1, 2, 3, 4, 5, 6, 7], equipados: [1, 2, 3, 4], consumidos: [], concluidas: [], espacos: 4,
    receitas: [{ id: 'assinatura', pares: [[1, 2]] }, { id: 'flexivel', pares: [[1, 3], [3, 4], [3, 5]] }, { id: 'terceira', pares: [[5, 6]] }] };
  assert.deepEqual(planejarFusoes(base).fundir, [{ id: 'assinatura', par: [1, 2] }, { id: 'flexivel', par: [3, 4] }]);
  const depois = { ...base, equipados: [3, 4], consumidos: [1, 2], concluidas: ['assinatura'] };
  assert.ok(planejarFusoes(depois).aprender.includes(5));
  assert.ok(planejarFusoes(depois).fundir.some((r) => r.id === 'flexivel' && r.par[1] === 4));
  assert.equal(planejarFusoes({ ...base, equipados: [1, 1] }), null);
  assert.deepEqual(planejarFusoes({ ...base, receitas: [{ id: 'impossivel', pares: [[1, 2]] }, { id: 'outra', pares: [[1, 3]] }] }).fundir, []);
});

const primeiro = () => 0;
const item = (id, tipo, raridade, noPlano = true, estado = 'melhoria') => ({ id, tipo, raridade, noPlano, estado });
test('raridade prevalece sobre tipo e o plano filtra opções', () => {
  const opcoes = [item('golpe', 'golpe', 1), item('vitamina', 'vitamina', 2), item('fora', 'vitamina', 4, false)];
  assert.equal(decidir({ tipo: 'build', opcoes }, {}, primeiro).id, 'vitamina');
});
test('golpe vence empate na raridade', () => {
  const opcoes = [item('vitamina', 'vitamina', 2), item('golpe', 'golpe', 2)];
  assert.equal(decidir({ tipo: 'build', opcoes }, {}, primeiro).id, 'golpe');
});
test('opção nova da build precede melhoria de maior raridade', () => {
  const opcoes = [item('melhoria', 'golpe', 4), item('nova', 'vitamina', 1, true, 'novo')];
  assert.equal(decidir({ tipo: 'build', opcoes }).id, 'nova');
});
test('seleciona um único golpe novo mesmo sem raridade', () => {
  const opcoes = [item('golpe novo', 'golpe', undefined, true, 'novo'), item('melhoria', 'vitamina', 3)];
  assert.equal(decidir({ tipo: 'build', opcoes }).id, 'golpe novo');
});
test('golpe novo precede vitamina nova mesmo sem raridade', () => {
  const opcoes = [item('golpe novo', 'golpe', undefined, true, 'novo'), item('vitamina nova', 'vitamina', 3, true, 'novo')];
  assert.equal(decidir({ tipo: 'build', opcoes }).id, 'golpe novo');
});
test('sorteia entre golpes novos da build', () => {
  const opcoes = [item('a', 'golpe', undefined, true, 'novo'), item('b', 'golpe', undefined, true, 'novo')];
  assert.equal(decidir({ tipo: 'build', opcoes }, {}, () => 0.9).id, 'b');
});
test('usa banimento, atualização e pulo nessa ordem', () => {
  const tela = { tipo: 'build', opcoes: [item('fora', 'golpe', 1, false, 'novo')], banimentos: 1, atualizacoes: 1, pulos: 1 };
  assert.deepEqual(decidir(tela, {}, primeiro), { acao: 'banir', id: 'fora' });
  tela.banimentos = 0;
  assert.equal(decidir(tela).acao, 'atualizar');
  tela.atualizacoes = 0;
  assert.equal(decidir(tela).acao, 'pular');
});
test('melhoria existente fora do plano antecede recursos e prioriza raridade', () => {
  const opcoes = [item('golpe', 'golpe', 1, false), item('vitamina', 'vitamina', 2, false), item('novo', 'golpe', 3, false, 'novo')];
  assert.deepEqual(decidir({ tipo: 'build', opcoes, banimentos: 1, atualizacoes: 1, pulos: 1 }, {}, primeiro), { acao: 'selecionar', id: 'vitamina', foraDoPlano: true });
  opcoes[0].raridade = 2;
  assert.equal(decidir({ tipo: 'build', opcoes }, {}, primeiro).id, 'golpe');
});
test('seleciona aleatoriamente fora do plano apenas após esgotar recursos', () => {
  const opcoes = [item('a', 'golpe', undefined, false, 'novo'), item('b', 'vitamina', 1, false, 'novo')];
  const tela = { tipo: 'build', opcoes, banimentos: 0, atualizacoes: 0, pulos: 0 };
  assert.deepEqual(decidir(tela, {}, () => 0.99), { acao: 'selecionar', id: 'b', foraDoPlano: true });
  tela.banimentos = null;
  assert.equal(decidir(tela).acao, 'aguardar');
});
test('opção do plano prevalece sobre melhoria fora do plano', () => {
  const opcoes = [item('nova planejada', 'vitamina', 1, true, 'novo'), item('melhoria fora', 'golpe', 5, false)];
  assert.deepEqual(decidir({ tipo: 'build', opcoes }), { acao: 'selecionar', id: 'nova planejada' });
});
test('melhora ataque inicial fora da build em qualquer nível após opções do plano', () => {
  for (let nivel = 1; nivel < 8; nivel++) {
    const inicial = { ...item('ataque inicial', 'golpe', 1, false), nivel };
    const tela = { tipo: 'build', opcoes: [inicial], banimentos: 2, atualizacoes: 2, pulos: 2 };
    assert.deepEqual(decidir(tela, {}, primeiro), { acao: 'selecionar', id: 'ataque inicial', foraDoPlano: true });
    tela.opcoes.push(item('nova da build', 'vitamina', 1, true, 'novo'));
    assert.equal(decidir(tela, {}, primeiro).id, 'nova da build');
  }
});
test('status prioriza a ordem configurada antes da raridade', () => {
  const tela = { tipo: 'status', opcoes: [{ id: 'exp', status: 'exp', raridade: 1 }, { id: 'luck', status: 'luck', raridade: 2 }] };
  assert.equal(decidir(tela, { status: ['exp', 'luck'] }).id, 'exp');
});
test('status repetido usa a maior raridade para desempatar', () => {
  const opcoes = [{ id: 'comum', status: 'exp', raridade: 1 }, { id: 'raro', status: 'exp', raridade: 3 }];
  assert.equal(decidir({ tipo: 'status', opcoes }, { status: ['exp'] }).id, 'raro');
});
test('powerups empatados usam sorteio', () => {
  const opcoes = [{ id: 'a', raridade: 2 }, { id: 'b', raridade: 2 }];
  assert.equal(decidir({ tipo: 'powerup', opcoes }, {}, () => 0.99).id, 'b');
});
test('powerups priorizam lendários, depois atributo e raridade', () => {
  const config = { status: ['dano', 'sorte'] };
  const opcoes = [{ id: 'dano', raridade: 1, status: ['dano'] }, { id: 'sorte', raridade: 4, status: ['sorte'] }];
  assert.equal(decidir({ tipo: 'powerup', opcoes }, config, primeiro).id, 'dano');
  assert.equal(decidir({ tipo: 'powerup', opcoes: [...opcoes, { id: 'revive', raridade: 5, status: [] }] }, config, primeiro).id, 'revive');
  assert.equal(decidir({ tipo: 'powerup', opcoes: [...opcoes, { id: 'dano-raro', raridade: 3, status: ['dano', 'sorte'] }] }, config, primeiro).id, 'dano-raro');
  assert.equal(decidir({ tipo: 'powerup', opcoes: [{ id: 'a', raridade: 1, status: [] }, { id: 'b', raridade: 4, status: [] }] }, config, primeiro).id, 'b');
  assert.equal(decidir({ tipo: 'powerup', opcoes: [...opcoes, { id: 'desconhecido' }] }, config, primeiro).acao, 'aguardar');
});
test('relíquias priorizam raridade e depois o melhor atributo do preset', () => {
  const opcoes = [{ id: 'dano comum', raridade: 1, status: ['dano'] }, { id: 'area incomum', raridade: 2, status: ['area'] }, { id: 'dano incomum', raridade: 2, status: ['dano', 'sorte'] }];
  assert.equal(decidir({ tipo: 'reliquia', opcoes, equipadas: [] }, { status: ['sorte', 'area', 'dano'] }, primeiro).id, 'dano incomum');
  assert.equal(decidir({ tipo: 'reliquia', opcoes, equipadas: [] }, { status: ['area', 'sorte', 'dano'] }, primeiro).id, 'area incomum');
  assert.equal(decidir({ tipo: 'reliquia', opcoes: opcoes.slice(0, 2), equipadas: [] }, { status: ['dano', 'area'] }, primeiro).id, 'area incomum');
});
test('relíquia só substitui outra ao melhorar raridade ou prioridade do preset', () => {
  const cfg = { status: ['dano', 'area'] };
  const equipadas = [{ id: 'area', raridade: 2, status: ['area'] }, { id: 'dano', raridade: 2, status: ['dano'] }, { id: 'fraca', raridade: 1, status: ['dano'] }];
  assert.deepEqual(decidir({ tipo: 'reliquia', equipadas, opcoes: [{ id: 'nova', raridade: 5, status: ['dano'] }] }, cfg, primeiro), { acao: 'selecionar', id: 'nova', substituir: 'fraca' });
  assert.deepEqual(decidir({ tipo: 'reliquia', equipadas: equipadas.slice(0, 2).concat({ id: 'outra', raridade: 2, status: ['dano'] }), opcoes: [{ id: 'nova', raridade: 2, status: ['dano'] }] }, cfg, primeiro), { acao: 'selecionar', id: 'nova', substituir: 'area' });
  assert.equal(decidir({ tipo: 'reliquia', equipadas: [{ id: 1, raridade: 5, status: ['dano'] }, { id: 2, raridade: 5, status: ['dano'] }, { id: 3, raridade: 5, status: ['dano'] }], opcoes: [{ id: 'nova', raridade: 5, status: ['dano'] }] }, cfg).acao, 'dispensar');
});
test('não escolhe nem descarta relíquias se faltarem dados para comparar', () => {
  assert.equal(decidir({ tipo: 'reliquia', equipadas: [{ id: 1, raridade: null, status: ['area'] }], opcoes: [{ id: 2, raridade: 2, status: ['dano'] }] }, { status: ['dano', 'area'] }).acao, 'aguardar');
  assert.equal(decidir({ tipo: 'reliquia', opcoes: [{ id: 2, raridade: 2, status: ['dano'] }] }, { status: ['dano'] }).acao, 'aguardar');
  assert.equal(decidir({ tipo: 'reliquia', equipadas: [], opcoes: [{ id: 2, raridade: 2, status: [] }] }, { status: ['dano'] }).acao, 'aguardar');
});
test('não age quando informações essenciais não foram reconhecidas', () => {
  assert.equal(decidir({ tipo: 'build', opcoes: [item('a', 'golpe', undefined), item('b', 'vitamina', 1)] }).acao, 'aguardar');
  assert.equal(decidir({ tipo: 'build', opcoes: [{ id: 'a' }], banimentos: 1 }).acao, 'aguardar');
});
