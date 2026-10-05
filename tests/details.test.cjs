const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const context = vm.createContext({});
for (let g = 1; g <= 9; g++) vm.runInContext(fs.readFileSync(path.join(root, `data/gen${g}.js`), 'utf8'), context);
for (const name of ['champions-ou', 'national-dex', 'pokemon-details']) vm.runInContext(fs.readFileSync(path.join(root, `data/${name}.js`), 'utf8'), context);
vm.runInContext(`globalThis.audit = { records: POKEMON_DETAILS_DATA,
    pools: [${Array.from({ length: 9 }, (_, i) => `GEN${i + 1}_POKEMON`).join(',')}, CHAMPIONS_OU_POKEMON, NATIONAL_DEX_POKEMON, BANANZA_POKEMON] };`, context);
const { records, pools } = context.audit;
for (const pool of pools) for (const pokemon of pool) {
    const record = records[pokemon.id];
    assert.ok(record, `Missing exact form: ${pokemon.name}`);
    assert.equal(record.history.length, 9);
    assert.ok(record.modern.types.length > 0);
    assert.ok(record.modern.abilities.length > 0);
    for (let i = 0; i < 9; i++) {
        const entry = record.history[i];
        if (entry.status !== 'available') continue;
        assert.ok(entry.types.length > 0);
        if (i < 2) assert.equal(entry.abilities.length, 0);
        if (i < 4) assert.ok(entry.abilities.every(ability => !ability.hidden));
        const usage = entry.usage;
        if (usage.status === 'recorded') {
            assert.ok(usage.pct >= 0 && usage.pct <= 100);
            assert.ok(usage.rank > 0);
            const suffix = { Uber: 'ubers', AG: 'anythinggoes' }[entry.tier] || entry.tier.toLowerCase();
            assert.equal(usage.format, `gen${i + 1}${suffix}`);
            assert.ok(usage.url.startsWith(`https://www.smogon.com/stats/${usage.period}/`));
        }
    }
}
assert.equal(records.clefable.history[4].types.join('/'), 'Normal');
assert.equal(records.clefable.history[5].types.join('/'), 'Fairy');
assert.ok(!records.clefable.history[2].abilities.some(ability => ability.name === 'Magic Guard'));
assert.equal(records.gengar.history[5].abilities[0].name, 'Levitate');
assert.equal(records.gengar.history[6].abilities[0].name, 'Cursed Body');
assert.equal(records.rotomwash.history[3].types.join('/'), 'Electric/Ghost');
assert.equal(records.rotomwash.history[4].types.join('/'), 'Electric/Water');
assert.equal(records.zaciancrowned.history[7].tier, 'AG');
assert.equal(records.zaciancrowned.history[7].usage.format, 'gen8anythinggoes');
assert.equal(records.mewtwo.history[0].usage.format, 'gen1ubers');
assert.equal(records.kyogre.history[1].status, 'not-introduced');
assert.equal(records.raichumegay.history[8].status, 'unavailable');
assert.equal(records.arceusfire.history[3].tier, 'AG');
console.log(`PASS: ${Object.keys(records).length} exact-form records; history, historical types/abilities, introduction, missing data, and usage matched to each tier.`);
