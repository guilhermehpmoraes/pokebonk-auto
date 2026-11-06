import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kitPodeSerBanido } from '../src/kits.mjs';

const kits = new Map([[200, { kit: ['poltergeist', 'hex'] }], [25, { kit: ['thunderbolt'] }]]);
const pokedex = {
  byId: new Map([[200, { name: 'Misdreavus' }], [25, { name: 'Pikachu' }]]),
  movesByKey: new Map([['poltergeist', { id: 1 }], ['hex', { id: 2 }], ['thunderbolt', { id: 3 }]]),
  moves: new Map([[1, {}], [2, {}], [3, {}]]),
};

test('só permite banir kit quando nenhum golpe está em qualquer plano', () => {
  assert.equal(kitPodeSerBanido('Misdreavus', kits, pokedex, [{ moves: [3], fus: [] }]), true);
  assert.equal(kitPodeSerBanido('Misdreavus', kits, pokedex, [{ moves: [3], fus: [] }, { moves: [2], fus: [] }]), false);
});
test('impede kit quando planos ou dados estão incompletos ou ambíguos', () => {
  assert.equal(kitPodeSerBanido('Misdreavus', kits, pokedex, []), false);
  assert.equal(kitPodeSerBanido('Misdreavus', kits, pokedex, [{ moves: [3], fus: ['fusao'] }]), false);
  assert.equal(kitPodeSerBanido('Misdreavus', kits, pokedex, [{ moves: [999], fus: [] }]), false);
  assert.equal(kitPodeSerBanido('Misdreavus', kits, { ...pokedex, movesByKey: new Map() }, [{ moves: [], fus: [] }]), false);
  assert.equal(kitPodeSerBanido('Desconhecido', kits, pokedex, [{ moves: [], fus: [] }]), false);
  assert.equal(kitPodeSerBanido('Misdreavus', new Map([...kits, [201, { kit: ['hex'] }]]),
    { ...pokedex, byId: new Map([...pokedex.byId, [201, { name: 'Misdreavus' }]]) }, [{ moves: [], fus: [] }]), false);
});
