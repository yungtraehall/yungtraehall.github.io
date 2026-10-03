// Run with: node tests/validate-champions.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const tiers = ['ZU', 'PU', 'NU', 'RU', 'UU', 'OU', 'Uber'];
const options = tiers.map(value => ({value, disabled: false}));
const poolSelect = {value: 'championsou', addEventListener() {}};
const tierSelect = {value: 'Uber', options,
    get selectedOptions() { return options.filter(o => o.value === this.value); }};
const dummy = {addEventListener() {}};
let seed = 371;
const seededMath = Object.create(Math);
seededMath.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
const context = vm.createContext({console, Math: seededMath, document: {
    getElementById: id => id === 'pool-select' ? poolSelect : id === 'tier-select' ? tierSelect : dummy,
    querySelectorAll: () => []
}});
for (const file of [...Array.from({length: 9}, (_, i) => `data/gen${i + 1}.js`), 'data/champions-ou.js', 'js/script.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, {filename: file});
}
const run = code => vm.runInContext(code, context);
const data = run('CHAMPIONS_OU_POKEMON');
assert.equal(data.length, 338);
assert.equal(new Set(data.map(p => p.id)).size, 338);
assert(data.every(p => p.fullyEvolved && p.format === 'gen9championsou'));
assert(!data.some(p => p.name === 'Pikachu' || p.tier === 'Uber'));
for (const [tier, count] of Object.entries({OU: 49, UU: 74, RU: 215})) {
    assert.equal(data.filter(p => p.tier === tier).length, count);
}
assert(data.filter(p => p.sourceTier === '(OU)' || p.sourceTier === 'UUBL').every(p => p.tier === 'OU'));
assert.equal(data.filter(p => p.usage.recorded).length, 328);
assert(data.every(p => p.usageModifier >= 0.85 && p.usageModifier <= 1.15));
assert(data.filter(p => !p.usage.recorded).every(p => p.usageModifier === 1));
assert.equal(data.find(p => p.name === 'Corviknight').usage.usagePct, 33.63522);
assert.equal(tierSelect.value, 'OU');
assert.deepEqual(options.filter(o => !o.disabled).map(o => o.value), ['RU', 'UU', 'OU']);
poolSelect.value = 'gen9'; run('updateTierAvailability()');
assert.equal(options.find(o => o.value === 'Uber').disabled, false);
tierSelect.value = 'ZU'; poolSelect.value = 'championsou'; run('updateTierAvailability()');
assert.equal(tierSelect.value, 'RU');
tierSelect.value = 'UU'; run('updateTierAvailability()'); assert.equal(tierSelect.value, 'UU');
run(`
    for (const ceiling of ['RU', 'UU', 'OU']) {
        for (const odds of ['--', '-', '=', '+', '++']) {
            for (let i = 0; i < 6667; i++) {
                const team = generateTeam(CHAMPIONS_OU_POKEMON, ceiling, odds);
                if (team.length !== 6 || new Set(team.map(p => p.id)).size !== 6 ||
                    team.some(p => !p || tierOrder.indexOf(p.tier) > tierOrder.indexOf(ceiling))) {
                    throw new Error('Champions eligibility, duplicates, or ceiling failed');
                }
            }
        }
    }
    const championProbabilityCounts = {RU: 0, UU: 0, OU: 0};
    for (let i = 0; i < 100000; i++) {
        championProbabilityCounts[chooseTier(CHAMPIONS_OU_POKEMON,
            CHAMPIONS_OU_POKEMON, 'OU', '=')]++;
    }
    for (const [key, pool] of Object.entries(datasets)) {
        if (key === 'championsou') continue;
        for (const ceiling of tierOrder) {
            if (pool.filter(p => tierOrder.indexOf(p.tier) <= tierOrder.indexOf(ceiling)).length < 6) continue;
            for (const odds of ['--', '-', '=', '+', '++']) {
                for (let i = 0; i < 50; i++) {
                    const team = generateTeam(pool, ceiling, odds);
                    if (new Set(team.map(p => p.id)).size !== 6 ||
                        team.some(p => tierOrder.indexOf(p.tier) > tierOrder.indexOf(ceiling))) {
                        throw new Error(key + ' regression failed');
                    }
                }
            }
        }
    }
`);
const counts = run('championProbabilityCounts');
for (const [tier, weight] of Object.entries({RU: 84, UU: 10, OU: 5.5})) {
    assert(Math.abs(weight / 99.5 - counts[tier] / 100000) < 0.005, `${tier} probability outside tolerance`);
}
const localSprites = run('CHAMPIONS_OU_LOCAL_SPRITES');
assert.equal(Object.keys(localSprites).length, 11);
for (const [name, file] of Object.entries(localSprites)) {
    const bytes = fs.readFileSync(path.join(root, file));
    assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
    assert.equal(bytes.readUInt32BE(16), 128);
    assert.equal(bytes.readUInt32BE(20), 128);
    const urls = run(`getPokemonSpriteUrls(${JSON.stringify(name)}, 9)`);
    assert.equal(urls[urls.length - 1], file);
}
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert(html.indexOf('data/gen9.js') < html.indexOf('data/champions-ou.js'));
assert(html.indexOf('data/champions-ou.js') < html.indexOf('js/script.js'));
assert(html.includes('<option value="championsou">Pokémon Champions OU</option>'));
if (process.argv.includes('--sprite-urls')) {
    const existing = run('new Set(Object.entries(datasets).filter(([key]) => key !== "championsou").flatMap(([, pool]) => pool.map(p => p.id)))');
    fs.writeFileSync(path.join(root, '../new-champions-sprite-urls.json'), JSON.stringify(data.filter(p => !existing.has(p.id)).map(p => ({name: p.name, urls: run(`getPokemonSpriteUrls(${JSON.stringify(p.name)}, 9)`)}))));
}
console.log('PASS: 338 forms, tier mapping, usage, pool switching, 100,005 Champions rolls,');
console.log('100,000 first-slot probability draws, and Gen 1–9 regression checks.');
console.log('Standard first-slot counts:', counts);
