import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('userscript publicado informa versão e URLs de atualização', () => {
  const script = readFileSync(new URL('../pokebonk-autoselect.user.js', import.meta.url), 'utf8');
  const url = 'https://raw.githubusercontent.com/guilhermehpmoraes/pokebonk-auto/main/pokebonk-autoselect.user.js';
  assert.match(script, /^\/\/ @version\s+\d+\.\d+\.\d+$/m);
  assert.ok(script.includes(`// @updateURL    ${url}`));
  assert.ok(script.includes(`// @downloadURL  ${url}`));
});
