import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decidir } from '../src/decisao.mjs';

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
  const tela = { tipo: 'build', opcoes: [item('fora', 'golpe', 1, false)], banimentos: 1, atualizacoes: 1, pulos: 1 };
  assert.deepEqual(decidir(tela, {}, primeiro), { acao: 'banir', id: 'fora' });
  tela.banimentos = 0;
  assert.equal(decidir(tela).acao, 'atualizar');
  tela.atualizacoes = 0;
  assert.equal(decidir(tela).acao, 'pular');
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
test('relíquias priorizam raridade e depois bônus de dano', () => {
  const opcoes = [{ id: 'dano comum', raridade: 1, dano: true }, { id: 'sem dano incomum', raridade: 2, dano: false }, { id: 'dano incomum', raridade: 2, dano: true }];
  assert.equal(decidir({ tipo: 'reliquia', opcoes, equipadas: [] }, {}, primeiro).id, 'dano incomum');
  assert.equal(decidir({ tipo: 'reliquia', opcoes: opcoes.slice(0, 2), equipadas: [] }, {}, primeiro).id, 'sem dano incomum');
});
test('relíquia só substitui uma equipada quando melhora raridade ou dano', () => {
  const equipadas = [{ id: 'area', raridade: 2, dano: false }, { id: 'dano', raridade: 2, dano: true }, { id: 'fraca', raridade: 1, dano: true }];
  assert.deepEqual(decidir({ tipo: 'reliquia', equipadas, opcoes: [{ id: 'nova', raridade: 5, dano: true }] }, {}, primeiro), { acao: 'selecionar', id: 'nova', substituir: 'fraca' });
  assert.deepEqual(decidir({ tipo: 'reliquia', equipadas: equipadas.slice(0, 2).concat({ id: 'outra', raridade: 2, dano: true }), opcoes: [{ id: 'nova', raridade: 2, dano: true }] }, {}, primeiro), { acao: 'selecionar', id: 'nova', substituir: 'area' });
  assert.equal(decidir({ tipo: 'reliquia', equipadas: [{ id: 1, raridade: 5, dano: true }, { id: 2, raridade: 5, dano: true }, { id: 3, raridade: 5, dano: true }], opcoes: [{ id: 'nova', raridade: 5, dano: true }] }).acao, 'dispensar');
});
test('não escolhe nem descarta relíquias se faltarem dados para comparar', () => {
  assert.equal(decidir({ tipo: 'reliquia', equipadas: [{ id: 1, raridade: null, dano: false }], opcoes: [{ id: 2, raridade: 2, dano: true }] }).acao, 'aguardar');
  assert.equal(decidir({ tipo: 'reliquia', opcoes: [{ id: 2, raridade: 2, dano: true }] }).acao, 'aguardar');
});
test('não age quando informações essenciais não foram reconhecidas', () => {
  assert.equal(decidir({ tipo: 'build', opcoes: [item('a', 'golpe', undefined), item('b', 'vitamina', 1)] }).acao, 'aguardar');
  assert.equal(decidir({ tipo: 'build', opcoes: [{ id: 'a' }], banimentos: 1 }).acao, 'aguardar');
});
