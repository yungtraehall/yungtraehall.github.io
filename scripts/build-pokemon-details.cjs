// Input: pinned Pokemon Showdown data under .build/showdown and cached Smogon
// stats from fetch-detail-stats.py. Ability callbacks in the data tables are never invoked.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { stripTypeScriptTypes } = require('node:module');
const root = path.resolve(__dirname, '..');
const input = JSON.parse(fs.readFileSync(path.join(root, '.build/pools.json')));
const stats = JSON.parse(fs.readFileSync(path.join(root, '.build/stats/manifest.json')));
const id = name => name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
function table(file, symbol) {
    const filename = path.join(root, '.build/showdown', file);
    if (!fs.existsSync(filename)) return {};
    const code = stripTypeScriptTypes(fs.readFileSync(filename, 'utf8')).replace('export const ', 'const ');
    return vm.runInNewContext(`${code}\n${symbol}`, {}, { timeout: 5000 });
}
function inherit(parent, patches) {
    const result = { ...parent };
    for (const [key, patch] of Object.entries(patches)) {
        result[key] = patch.inherit ? { ...parent[key], ...patch } : patch;
    }
    return result;
}
const base = table('data/pokedex.ts', 'Pokedex');
const abilities = table('data/abilities.ts', 'Abilities');
const dexes = { 9: base };
const formats = { 9: table('data/formats-data.ts', 'FormatsData') };
for (let g = 8; g >= 1; g--) {
    dexes[g] = inherit(dexes[g + 1], table(`data/mods/gen${g}/pokedex.ts`, 'Pokedex'));
    formats[g] = inherit(formats[g + 1], table(`data/mods/gen${g}/formats-data.ts`, 'FormatsData'));
}
const cosmetics = {};
for (const [key, species] of Object.entries(base)) {
    for (const name of species.cosmeticFormes || []) cosmetics[id(name)] = key;
}
function introduced(species) {
    if (species.gen) return species.gen;
    const number = species.num, form = species.forme || '';
    if (number >= 906 || form.includes('Paldea')) return 9;
    if (number >= 810 || ['Gmax', 'Galar', 'Galar-Zen', 'Hisui'].includes(form)) return 8;
    if (number >= 722 || form.startsWith('Alola') || form === 'Starter') return 7;
    if (number >= 650 || form.includes('Mega') || form === 'Primal') return 6;
    if (number >= 494) return 5;
    if (number >= 387) return 4;
    if (number >= 252) return 3;
    if (number >= 152) return 2;
    return 1;
}
const upward = { UUBL: 'OU', RUBL: 'UU', NUBL: 'RU', PUBL: 'NU', ZUBL: 'PU', '(OU)': 'OU', Ubers: 'Uber' };
const all = new Map();
for (const pool of [...input.generations.map(entry => entry.pool), input.champions, input.nationaldex, input.bananza]) {
    for (const pokemon of pool) all.set(pokemon.id, pokemon.name);
}
const records = {}, missing = [];
for (const [key, name] of all) {
    const dexKey = base[key] ? key : cosmetics[key];
    if (!dexKey) { missing.push(name); continue; }
    const species = base[dexKey];
    const history = [];
    for (let generation = 1; generation <= 9; generation++) {
        if (introduced(species) > generation) { history.push({ status: 'not-introduced' }); continue; }
        const historic = dexes[generation][dexKey];
        const poolEntry = input.generations[generation - 1].pool.find(pokemon => pokemon.id === key);
        const format = formats[generation][dexKey] || {};
        if (!poolEntry && (format.isNonstandard || historic.isNonstandard || format.tier === 'Illegal')) {
            history.push({ status: 'unavailable' }); continue;
        }
        const inheritedFormat = formats[generation][id(typeof historic.battleOnly === 'string' ? historic.battleOnly : historic.baseSpecies || '')] || {};
        const sourceTier = poolEntry?.sourceTier || format.tier || inheritedFormat.tier || null;
        const tier = poolEntry?.tier || upward[sourceTier] || sourceTier;
        let abilityList = [];
        if (generation >= 3) {
            abilityList = Object.entries(historic.abilities || {}).filter(([slot, name]) =>
                (generation >= 5 || slot !== 'H') &&
                !(generation === 3 && slot === '1' && (abilities[id(name)]?.gen === 4 || (abilities[id(name)]?.num >= 77 && abilities[id(name)]?.num <= 123)))
            ).map(([slot, name]) => ({ name, hidden: slot === 'H' }));
        }
        const ladder = stats[generation][sourceTier === 'AG' ? 'AG' : tier];
        let usage = { status: 'unpublished' };
        if (ladder) {
            const row = ladder.rows?.[key];
            usage = { status: ladder.status === 'published' ? (row ? 'recorded' : 'no-row') : ladder.status,
                format: ladder.format, period: ladder.period, url: ladder.url, ...row };
        }
        history.push({ status: 'available', types: historic.types || [], abilities: abilityList,
            tier: sourceTier === 'AG' ? 'AG' : tier, sourceTier, usage });
    }
    records[key] = { name, history, modern: { types: species.types || [], abilities:
        Object.entries(species.abilities || {}).map(([slot, name]) => ({ name, hidden: slot === 'H' })) } };
}
fs.writeFileSync(path.join(root, 'data/pokemon-details.js'),
    '// Pokemon Showdown species data and dated Smogon usage snapshots. See docs/pokemon-details.md.\n' +
    `const POKEMON_DETAILS_DATA = ${JSON.stringify(records)};\n`);
fs.writeFileSync(path.join(root, '.build/details-audit.json'), JSON.stringify({ count: all.size, records: Object.keys(records).length, missing }, null, 2));
console.log(`Built ${Object.keys(records).length}/${all.size} records; missing: ${missing.join(', ') || 'none'}`);
