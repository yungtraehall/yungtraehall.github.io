const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const context = vm.createContext({});
for (let generation = 1; generation <= 9; generation++) {
    vm.runInContext(fs.readFileSync(path.join(root, `data/gen${generation}.js`), 'utf8'), context);
}
for (const filename of ['champions-ou.js', 'national-dex.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, 'data', filename), 'utf8'), context);
}
const code = `JSON.stringify({generations: [${Array.from({ length: 9 }, (_, i) =>
    `{pool:GEN${i + 1}_POKEMON,meta:GEN${i + 1}_DATASET_META}`).join(',')}], champions: CHAMPIONS_OU_POKEMON, nationaldex: NATIONAL_DEX_POKEMON, bananza: BANANZA_POKEMON})`;
fs.mkdirSync(path.join(root, '.build'), { recursive: true });
fs.writeFileSync(path.join(root, '.build/pools.json'), vm.runInContext(code, context));
