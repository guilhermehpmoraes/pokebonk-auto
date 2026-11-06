import { readFile, writeFile } from 'node:fs/promises';

const decisao = (await readFile(new URL('../src/decisao.mjs', import.meta.url), 'utf8'))
  .replace('export function decidir', 'function decidir');
const adaptador = await readFile(new URL('../src/adaptador.js', import.meta.url), 'utf8');
const cabecalho = `// ==UserScript==
// @name         PokéBonk Auto Select — protótipo de upgrades
// @namespace    local.pokebonk.autoselect
// @version      0.2.0
// @description  Protótipo: seleciona opções do plano na tela de upgrades.
// @match        https://pokebonk.com/*
// @grant        none
// ==/UserScript==

`;
await writeFile(new URL('../pokebonk-autoselect.user.js', import.meta.url), `${cabecalho}(() => {\n'use strict';\n${decisao}\n${adaptador}\n})();\n`);
