const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const tiers = ["ZU", "PU", "NU", "RU", "UU", "OU", "Uber"];
const elements = new Map();
const cards = [];

function element(id) {
    if (!elements.has(id)) {
        elements.set(id, {
            value: "",
            addEventListener() {},
            classList: { add() {}, remove() {} },
            style: { setProperty() {} },
            setAttribute() {}
        });
    }
    return elements.get(id);
}

element("pool-select").value = "gen9";
element("tier-select").value = "Uber";
element("tier-select").options = tiers.map(value => ({ value, disabled: false }));
Object.defineProperty(element("tier-select"), "selectedOptions", {
    get() {
        return this.options.filter(option => option.value === this.value);
    }
});
element("odds-select").value = "++";

// Reproducible randomness; production functions and data are used unchanged.
let seed = 20261004;
const seededMath = Object.create(Math);
seededMath.random = function () {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
};

const context = vm.createContext({
    document: {
        getElementById: element,
        querySelectorAll: () => cards,
        body: { classList: { add() {}, remove() {} } }
    },
    Math: seededMath,
    console: { log() {}, table() {} }
});

const dataFiles = [
    ...Array.from({ length: 9 }, (_, index) => `gen${index + 1}.js`),
    "champions-ou.js",
    "national-dex.js"
];
for (const filename of dataFiles) {
    vm.runInContext(fs.readFileSync(path.join(root, "data", filename), "utf8"), context);
}
vm.runInContext(fs.readFileSync(path.join(root, "js/script.js"), "utf8"), context);
vm.runInContext(`globalThis.generator = {
    datasets, tierOddsProfiles,
    generateTeam, getTierSelectionData, getPokemonPullWeight,
    simulateTeams, updateTierAvailability, getRarityCategory, getRarityDetails, getPullOddsText, renderTeam, getPokemonSpriteUrls, getFinalToneDelay, RARE_OU_POKEMON
};`, context);
const generator = context.generator;

for (const profile of Object.values(generator.tierOddsProfiles)) {
    assert.equal(Object.values(profile).reduce((sum, value) => sum + value, 0), 100);
}

const strongest = generator.tierOddsProfiles["++"];
assert.ok(strongest.Uber >= 5 && strongest.Uber <= 8);
assert.ok(strongest.OU > strongest.UU);
assert.ok(strongest.PU + strongest.ZU <= 3);

const modes = ["--", "-", "=", "+", "++"];
for (let i = 1; i < modes.length; i++) {
    assert.ok(generator.tierOddsProfiles[modes[i]].Uber > generator.tierOddsProfiles[modes[i - 1]].Uber);
    assert.ok(generator.tierOddsProfiles[modes[i]].OU > generator.tierOddsProfiles[modes[i - 1]].OU);
}

assert.equal(generator.getPokemonPullWeight({ tier: "Uber", usageModifier: 0.85 }), 0.85);
assert.equal(generator.getPokemonPullWeight({ tier: "OU", usageModifier: 1.15 }), 1.15);
for (const tier of ["UU", "RU", "NU", "PU", "ZU"]) {
    assert.equal(generator.getPokemonPullWeight({ tier, usageModifier: 0.85 }), 1);
    assert.equal(generator.getPokemonPullWeight({ tier, usageModifier: 1.15 }), 1);
}

assert.equal(generator.getPokemonPullWeight({ id: "zaciancrowned", tier: "Uber", usageModifier: 1 }), 0.5);
assert.equal(generator.getPokemonPullWeight({ id: "kyogre", tier: "Uber", usageModifier: 0.85 }), 0.425);
assert.equal(generator.getRarityCategory({ id: "zaciancrowned", sourceTier: "AG", tier: "Uber" }).multiplier, 0.1);
assert.equal(generator.getRarityCategory({ id: "kyogreprimal", tier: "Uber" }).multiplier, 1);
generator.RARE_OU_POKEMON.add("example");
assert.equal(generator.getPokemonPullWeight({ id: "example", tier: "OU", usageModifier: 1 }), 0.75);
assert.equal(generator.getPokemonPullWeight({ id: "example", tier: "UU", usageModifier: 1 }), 1);
generator.RARE_OU_POKEMON.delete("example");
for (let gen = 1; gen <= 4; gen++) {
    const urls = generator.getPokemonSpriteUrls("Mewtwo", gen);
    assert.ok(urls.every(url => url.includes(`/gen${gen}/`) && url.endsWith(".png")));
}
assert.match(generator.getPokemonSpriteUrls("Mewtwo", 5)[0], /gen5ani\/mewtwo\.gif$/);
assert.match(generator.getPokemonSpriteUrls("Mewtwo", 9)[0], /sprites\/ani\/mewtwo\.gif$/);
assert.equal(generator.getFinalToneDelay("Uber") - generator.getFinalToneDelay("OU"), 250);
assert.equal(generator.getFinalToneDelay("UU"), generator.getFinalToneDelay("OU"));

// Screenshot regression: a crowded RU pool gave Electrode a smaller individual
// probability than OU Zapdos. Neither ordinary Pokémon gets a rarity badge.
assert.equal(generator.getRarityDetails({ id: "electrode", tier: "RU", pullProbability: 1 / 1763 }), null);
assert.equal(generator.getRarityDetails({ id: "zapdos", tier: "OU", pullProbability: 1 / 234 }), null);
assert.equal(generator.getPullOddsText(1 / 1763), "Pull odds this slot: 1 in 1,763");
assert.equal(generator.getPullOddsText(1 / 234), "Pull odds this slot: 1 in 234");
assert.equal(generator.getRarityDetails({ id: "kyogre", tier: "Uber", pullProbability: 0.1 }).label, "Featured rare Uber");
assert.equal(generator.getRarityDetails({ id: "kyogre", tier: "Uber", pullProbability: 0.00001 }).label, "Featured rare Uber");
assert.equal(generator.getRarityDetails({ id: "miraidon", tier: "Uber", sourceTier: "AG" }).label, "Rare AG");
generator.RARE_OU_POKEMON.add("zapdos");
assert.equal(generator.getRarityDetails({ id: "zapdos", tier: "OU" }).label, "Rare OU");
assert.equal(generator.getRarityDetails({ id: "zapdos", tier: "UU" }), null);
generator.RARE_OU_POKEMON.delete("zapdos");
for (const probability of [undefined, null, NaN, Infinity, 0, -1, 2]) {
    assert.equal(generator.getPullOddsText(probability), "");
}

// Render the reported examples using the real card renderer, not a copy of it.
for (let index = 0; index < 3; index++) {
    const image = {};
    cards.push({ innerHTML: "", classList: { add() {}, remove() {} },
        querySelector(selector) { return selector === ".pokemon-sprite" ? image : { addEventListener() {} }; }
    });
}
generator.renderTeam([
    { id: "electrode", name: "Electrode", tier: "RU", generation: 9, pullProbability: 1 / 1763 },
    { id: "zapdos", name: "Zapdos", tier: "OU", generation: 9, pullProbability: 1 / 234 },
    { id: "kyogre", name: "Kyogre", tier: "Uber", generation: 9, pullProbability: 1 / 500 }
]);
assert.ok(!cards[0].innerHTML.includes("pokemon-pull-rarity"));
assert.ok(!cards[1].innerHTML.includes("pokemon-pull-rarity"));
assert.ok(cards[0].innerHTML.includes("Pull odds this slot: 1 in 1,763"));
assert.ok(cards[1].innerHTML.includes("Pull odds this slot: 1 in 234"));
assert.ok(cards[2].innerHTML.includes("Featured rare Uber"));
assert.equal((cards[2].innerHTML.match(/Featured rare Uber/g) || []).length, 1);
cards.length = 0;

// All selectable ceilings and modes must yield six eligible, distinct Pokemon.
for (const [poolName, pool] of Object.entries(generator.datasets)) {
    for (const ceiling of tiers) {
        if (poolName === "bananza" && ceiling !== "Uber") continue;
        if (poolName === "championsou" && ceiling === "Uber") continue;
        const eligible = pool.filter(pokemon => tiers.indexOf(pokemon.tier) <= tiers.indexOf(ceiling));
        if (eligible.length < 6) continue;
        for (const mode of modes) {
            const team = generator.generateTeam(pool, ceiling, mode);
            assert.equal(team.length, 6);
            assert.equal(new Set(team.map(pokemon => pokemon.id)).size, 6);
            for (const pokemon of team) {
                assert.ok(tiers.indexOf(pokemon.tier) <= tiers.indexOf(ceiling));
                assert.ok(pokemon.pullProbability > 0 && pokemon.pullProbability <= 1);
            }
        }
    }
}

// Force an AG pull and independently verify its exact first-slot probability.
const random = seededMath.random;
let calls = 0;
seededMath.random = () => calls++ % 2 === 0 ? 0.999999 : 0;
const bananza = generator.datasets.bananza;
const weightedUberTotal = bananza.filter(pokemon => pokemon.tier === "Uber")
    .reduce((sum, pokemon) => sum + generator.getPokemonPullWeight(pokemon), 0);
const forcedTeam = generator.generateTeam(bananza, "Uber", "++");
assert.equal(forcedTeam[0].sourceTier, "AG");
assert.ok(Math.abs(forcedTeam[0].pullProbability - 0.07 * 0.10 / weightedUberTotal) < 1e-12);
assert.equal(new Set(forcedTeam.map(pokemon => pokemon.id)).size, 6);
seededMath.random = random;

element("pool-select").value = "bananza";
element("tier-select").value = "RU";
generator.updateTierAvailability();
assert.equal(element("maximum-tier-setting").hidden, true);
assert.equal(element("tier-select").value, "Uber");
element("pool-select").value = "gen9";
generator.updateTierAvailability();
assert.equal(element("maximum-tier-setting").hidden, false);

console.log("PASS: profiles, OU/Uber usage weights, equal lower-tier weights, all pools/ceilings/modes, duplicate prevention, exact AG probability, Bananza ceiling handling, screenshot rarity regression, card labels, and Uber chime delay.");

if (process.argv.includes("--simulate")) {
    const result = generator.simulateTeams(100000);
    assert.equal(result.totalPokemon, 600000);
    const percentages = {};
    for (const tier of tiers) {
        percentages[tier] = result.tierCounts[tier] / result.totalPokemon * 100;
        assert.ok(Math.abs(percentages[tier] - strongest[tier]) < 0.3,
            `${tier}: simulated ${percentages[tier]}, target ${strongest[tier]}`);
    }
    assert.ok(percentages.Uber >= 5 && percentages.Uber <= 8);
    assert.ok(percentages.OU > percentages.UU);
    assert.ok(percentages.PU + percentages.ZU < 3.3);
    console.log(JSON.stringify({
        pool: result.selectedPool,
        maximumTier: result.selectedTier,
        odds: result.selectedOdds,
        teams: result.numberOfTeams,
        pokemon: result.totalPokemon,
        percentages,
        teamsWithUberPercentage: result.teamsWithUberPercentage
    }, null, 2));
}
