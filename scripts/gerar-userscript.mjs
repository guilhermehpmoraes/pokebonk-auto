import { readFile, writeFile } from 'node:fs/promises';

const decisao = (await readFile(new URL('../src/decisao.mjs', import.meta.url), 'utf8'))
  .replaceAll('export function ', 'function ');
const kits = (await readFile(new URL('../src/kits.mjs', import.meta.url), 'utf8'))
  .replace('export function kitPodeSerBanido', 'function kitPodeSerBanido');
const adaptador = await readFile(new URL('../src/adaptador.js', import.meta.url), 'utf8');
const cabecalho = `// ==UserScript==
// @name         PokéBonk Auto Select
// @namespace    local.pokebonk.autoselect
// @version      0.2.59
// @description  Automatiza escolhas de upgrades e interações no PokéBonk.
// @match        https://pokebonk.com/*
// @updateURL    https://raw.githubusercontent.com/guilhermehpmoraes/pokebonk-auto/main/pokebonk-autoselect.user.js
// @downloadURL  https://raw.githubusercontent.com/guilhermehpmoraes/pokebonk-auto/main/pokebonk-autoselect.user.js
// @grant        none
// ==/UserScript==

`;
await writeFile(new URL('../pokebonk-autoselect.user.js', import.meta.url), `${cabecalho}(() => {\n'use strict';\n${decisao}\n${kits}\n${adaptador}\n})();\n`);
