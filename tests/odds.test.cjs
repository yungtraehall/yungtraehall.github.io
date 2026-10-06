const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const revealMarkup = fs.readFileSync(path.join(root, "index.html"), "utf8");
const revealStyles = fs.readFileSync(path.join(root, "css", "styles.css"), "utf8");
assert.match(revealMarkup, /<div class="reveal-orb">\s*<svg class="reveal-rift"/);
assert.match(revealStyles, /\.reveal-type-overlay\s*\{[^}]*z-index:\s*4;[^}]*border-radius:\s*50%;[^}]*overflow:\s*hidden;/);
assert.doesNotMatch(revealMarkup, /reveal-type-sigil/);
assert.match(revealStyles, /\.reveal-overlay\.rare-reveal\.pokemon-revealed \.reveal-type-text \{ animation: type-text-fade 1\.9s/);
const tiers = ["ZU", "PU", "NU", "RU", "UU", "OU", "Uber"];
const elements = new Map();
const cards = [];

function element(id) {
    if (!elements.has(id)) {
        elements.set(id, {
            value: "",
            dataset: {},
            addEventListener() {},
            blur() {},
            classList: { add() {}, remove() {} },
            style: { setProperty() {} },
            setAttribute() {},
            removeAttribute(name) { delete this[name]; }
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
    "national-dex.js",
    "pokemon-details.js"
];
for (const filename of dataFiles) {
    vm.runInContext(fs.readFileSync(path.join(root, "data", filename), "utf8"), context);
}
vm.runInContext(fs.readFileSync(path.join(root, "js/script.js"), "utf8"), context);
vm.runInContext(`globalThis.generator = {
    datasets, tierOddsProfiles,
    generateTeam, getTierSelectionData, getPokemonPullWeight,
    simulateTeams, updateTierAvailability, getRarityCategory, getRarityDetails, getSpecialPresentation, getRevealTypes, getRevealUsageDetails, getPreviewPokemon, getActivePokemonPool, shouldPlayRevealAudio, FEATURED_RARE_UBERS, renderTeam, getPokemonSpriteUrls, getFinalToneDelay, RARE_OU_POKEMON
};`, context);
const generator = context.generator;

for (const profile of Object.values(generator.tierOddsProfiles)) {
    assert.equal(Object.values(profile).reduce((sum, value) => sum + value, 0), 100);
}

const strongest = generator.tierOddsProfiles["++"];
assert.ok(strongest.Uber >= 5 && strongest.Uber <= 8);
assert.ok(strongest.OU > strongest.UU);
assert.ok(strongest.PU + strongest.ZU <= 3);
for (const [mode, beforeUU, beforeOU] of [["--",12,7],["-",18,11.5],["=",21,22.5],["+",23,30.5],["++",25,38]]) {
    const profile = generator.tierOddsProfiles[mode];
    assert.ok(profile.UU > beforeUU && profile.OU < beforeOU);
    assert.ok(Math.abs(profile.UU + profile.OU - beforeUU - beforeOU) < 1e-12);
}
assert.ok(Math.abs(strongest.UU - 25 - .1) < 1e-12);

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
assert.equal(generator.getPokemonPullWeight({ id: "kyogreprimal", tier: "Uber", usageModifier: 0.85 }), 0.425);
assert.equal(generator.getRarityCategory({ id: "zaciancrowned", sourceTier: "AG", tier: "Uber" }).multiplier, 0.1);
assert.equal(generator.getRarityCategory({ id: "kyogre", tier: "Uber" }).multiplier, 1);
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
assert.equal(generator.getFinalToneDelay("UU"), 650);

// Every tier uses actual slot chance and the same probability scale.
for (const tier of tiers) {
    for (const [pullProbability, label, className] of [
        [0.00001, "Ultra Rare", "rarity-ultra-rare"],
        [0.00009999, "Ultra Rare", "rarity-ultra-rare"],
        [0.0001, "Very Rare", "rarity-very-rare"],
        [0.00099999, "Very Rare", "rarity-very-rare"],
        [0.001, "Rare", "rarity-rare"],
        [0.00999999, "Rare", "rarity-rare"],
        [0.01, "Common", "rarity-common"],
        [1, "Common", "rarity-common"]
    ]) {
        const rarity = generator.getRarityDetails({ tier, pullProbability });
        assert.equal(rarity.probability, pullProbability);
        assert.equal(rarity.label, label);
        assert.equal(rarity.className, className);
    }
    for (const pullProbability of [undefined, null, NaN, Infinity, 0, -1, 2]) {
        assert.equal(generator.getRarityDetails({ tier, pullProbability }), null);
    }
}
assert.equal(generator.getRarityDetails({ tier: "OU", upperPoolProbability: 1 / 392 }), null);
const exampleRarity = generator.getRarityDetails({ tier: "OU", pullProbability: 1 / 392, upperPoolProbability: 0.5 });
assert.equal(exampleRarity.displayText, "Rare · 0.26% Chance");
assert.equal(generator.getRarityDetails({ tier: "Uber", pullProbability: 0.00096552 }).displayText, "Very Rare · 0.097% Chance");
assert.equal(generator.getRarityDetails({ tier: "Uber", pullProbability: 0.00009999 }).displayText, "Ultra Rare · 0.009999% Chance");
assert.equal(generator.getRarityDetails({ tier: "OU", pullProbability: 0.00999999 }).displayText, "Rare · 0.999999% Chance");
assert.doesNotThrow(() => generator.getRarityDetails({ tier: "Uber", pullProbability: 1e-300 }));
assert.equal(generator.getRarityDetails({ tier: "Uber", pullProbability: 0.00001 }).chanceText, "0.0010% Chance");
assert.equal(generator.getRarityDetails({ tier: "Uber", pullProbability: 0.00000001 }).chanceText, "0.0000010% Chance");
assert.equal(generator.getRarityDetails({ id: "electrode", tier: "RU", pullProbability: 1 / 1763 }).displayText, "Very Rare · 0.06% Chance");
const zapdosRarity = generator.getRarityDetails({ id: "zapdos", tier: "OU", pullProbability: 1 / 234 });
assert.equal(zapdosRarity.label, "Rare");
assert.equal(zapdosRarity.chanceText, "0.43% Chance");
assert.equal(generator.getRarityDetails({ id: "volcarona", tier: "OU", pullProbability: 1 / 6 }).displayText, "Common · 16.67% Chance");
assert.equal(generator.getRarityDetails({ id: "xerneas", tier: "Uber", sourceTier: "AG", pullProbability: 1 / 296 }).displayText, "Rare · 0.34% Chance");
assert.equal(generator.getRarityDetails({ id: "zaciancrowned", tier: "Uber", pullProbability: 1 / 84 }).label, "Common");

// Render the reported examples using the real card renderer, not a copy of it.
for (let index = 0; index < 3; index++) {
    const image = {};
    const classes = new Set();
    cards.push({ innerHTML: "", classes,
        classList: { add(...names) { names.forEach(name => classes.add(name)); }, remove(...names) { names.forEach(name => classes.delete(name)); } },
        querySelector(selector) { return selector === ".pokemon-sprite" ? image : { addEventListener() {} }; }
    });
}
generator.renderTeam([
    { id: "electrode", name: "Electrode", tier: "RU", generation: 9, pullProbability: 1 / 1763 },
    { id: "zapdos", name: "Zapdos", tier: "OU", generation: 9, pullProbability: 1 / 234 },
    { id: "kyogreprimal", name: "Kyogre-Primal", tier: "Uber", generation: 9, pullProbability: 1 / 500 }
]);
assert.ok(cards[0].innerHTML.includes("pokemon-pull-rarity rarity-very-rare"));
assert.ok(cards[1].innerHTML.includes("pokemon-pull-rarity rarity-rare"));
assert.ok(!cards[0].innerHTML.includes("1 in 1,763"));
assert.ok(cards[1].innerHTML.includes("Rare · 0.43% Chance"));
assert.ok(cards[2].innerHTML.includes("Feature Rare Uber"));
assert.ok(cards[2].innerHTML.includes("Rare · 0.20% Chance"));
assert.equal((cards[2].innerHTML.match(/Feature Rare Uber/g) || []).length, 1);
generator.renderTeam([
    { id: "xerneas", name: "Xerneas", tier: "Uber", sourceTier: "AG", generation: 9, pullProbability: 1 / 296 },
    { id: "volcarona", name: "Volcarona", tier: "OU", generation: 9, pullProbability: 1 / 6 },
    { id: "ribombee", name: "Ribombee", tier: "RU", generation: 9 }
]);
assert.ok(cards[0].classes.has("special-ag"));
assert.ok(cards[0].innerHTML.includes("Rare · 0.34% Chance"));
assert.ok(cards[1].innerHTML.includes("Common · 16.67% Chance"));
generator.renderTeam([
    { id: "ribombee", name: "Ribombee", tier: "RU", generation: 9 },
    { id: "ribombee", name: "Ribombee", tier: "RU", generation: 9 },
    { id: "ribombee", name: "Ribombee", tier: "RU", generation: 9 }
]);
assert.ok(!cards[0].classes.has("special-ag"));
assert.ok(!cards[1].classes.has("special-ou"));
assert.ok(!cards[0].innerHTML.includes("pokemon-pull-rarity"));
cards.length = 0;

// Exact forms, all Arceus types, and generation-dependent tier colors.
assert.equal(generator.FEATURED_RARE_UBERS.size, 42);
assert.equal(generator.RARE_OU_POKEMON.size, 9);
for (const id of generator.FEATURED_RARE_UBERS) {
    assert.ok(Object.values(generator.datasets).some(pool => pool.some(p => p.id === id)), `Unknown featured form: ${id}`);
    assert.equal(generator.getSpecialPresentation({ id, tier: "Uber" }).color, "#DF00FF");
    assert.equal(generator.getPokemonPullWeight({ id, tier: "Uber", usageModifier: 1 }), 0.5);
}
for (const id of generator.RARE_OU_POKEMON) {
    assert.equal(generator.getSpecialPresentation({ id, tier: "OU" }).color, "#800020");
    assert.equal(generator.getPokemonPullWeight({ id, tier: "OU", usageModifier: 1 }), 0.75);
}
for (const id of ["kyogre", "groudon", "mewtwo", "rayquazamega", "garchompmega", "ogerponhearthflame"]) {
    assert.equal(generator.getSpecialPresentation({ id, tier: "Uber" }), null);
}
assert.equal(generator.getSpecialPresentation({ id: "garchomp", tier: "Uber" }).color, "#DF00FF");
assert.equal(generator.getSpecialPresentation({ id: "spectrier", tier: "OU" }).color, "#800020");
assert.equal(generator.getSpecialPresentation({ id: "garchomp", tier: "UU" }), null);
assert.deepEqual([...generator.getRevealTypes({ id: "volcarona" })], ["Bug", "Fire"]);
assert.deepEqual([...generator.getRevealTypes({ id: "garchomp" })], ["Dragon", "Ground"]);
// Rank and usage must come from the generated tier's ladder, not an OU/Uber
// export that happens to contain a lower-tier Pokémon.
const kyurem5 = generator.getRevealUsageDetails(generator.datasets.gen5.find(p => p.id === "kyurem"));
assert.equal(kyurem5.rankText, "Rank #74 · Gen5OU");
assert.equal(kyurem5.percentageText, "1.516% Usage · 2016-03");
const kyurem9 = generator.getRevealUsageDetails(generator.datasets.gen9.find(p => p.id === "kyurem"));
assert.equal(kyurem9.rankText, "Rank #12 · Gen9OU");
assert.equal(kyurem9.percentageText, "12.023% Usage · 2026-08");
for (const pool of ["nationaldex", "bananza"]) {
    const result = generator.getRevealUsageDetails({...generator.datasets[pool].find(p => p.id === "kyurem"), selectedPool: pool});
    assert.equal(result.rankText, kyurem9.rankText);
    assert.equal(result.percentageText, kyurem9.percentageText);
    assert.ok(result.description.startsWith("Best historical usage rank"));
}
const mismatch = generator.getRevealUsageDetails({id:"kyurem", generation:5, tier:"UU", usageSource:"gen5ou", usage:{recorded:true,rank:74,usagePct:1.51566}});
assert.equal(mismatch.rankText, kyurem9.rankText);
assert.equal(mismatch.percentageText, kyurem9.percentageText);
const yveltalFallback = generator.getRevealUsageDetails({id:"yveltal",generation:9,tier:"Uber",selectedPool:"nationaldex"});
assert.equal(yveltalFallback.rankText, "Rank #1 · Gen8Uber");
assert.equal(yveltalFallback.percentageText, "38.334% Usage · 2022-10");
const yveltal6 = generator.getRevealUsageDetails({id:"yveltal",generation:6,tier:"Uber"});
assert.equal(yveltal6.rankText, "Rank #6 · Gen6Uber");
assert.ok(!yveltal6.description.startsWith("Best historical"));
const noHistory = generator.getRevealUsageDetails({id:"yveltalmega",generation:9,tier:"Uber",selectedPool:"nationaldex"});
assert.ok(noHistory.rankText.startsWith("Usage unavailable"));
assert.ok(!noHistory.percentageText.includes("%"));
assert.equal(generator.getSpecialPresentation({id:"xerneas",tier:"Uber",sourceTier:"AG"}).color, "#ffe7a6");
assert.equal(generator.getSpecialPresentation({ id: "koraidon", tier: "Uber", sourceTier: "AG" }).className, "special-ag");
assert.equal(generator.getRarityCategory({ id: "arceus", tier: "Uber", sourceTier: "AG" }).multiplier, 0.1);
assert.equal(generator.getPreviewPokemon([{id:"mewtwo",tier:"Uber"},{id:"zacian",tier:"Uber"}]).id, "zacian");
assert.equal(generator.getPreviewPokemon([{id:"garchomp",tier:"OU"},{id:"mewtwo",tier:"Uber"}]).id, "mewtwo");

// Independently reconstruct the chance for each selected slot, including
// missing/exhausted tiers and the exact forms already excluded from this team.
function verifySlotProbabilities(team, pool, ceiling, mode) {
    const available = pool.filter(p => tiers.indexOf(p.tier) <= tiers.indexOf(ceiling));
    for (const pokemon of team) {
        const selection = generator.getTierSelectionData(available, pool, ceiling, mode);
        const tierTotal = selection.availableTiers.reduce((sum, tier) => sum + selection.tierWeights[tier], 0);
        const members = available.filter(p => p.tier === pokemon.tier);
        const speciesTotal = members.reduce((sum, p) => sum + generator.getPokemonPullWeight(p), 0);
        const expected = selection.tierWeights[pokemon.tier] / tierTotal * generator.getPokemonPullWeight(pokemon) / speciesTotal;
        assert.ok(Math.abs(pokemon.pullProbability - expected) < 1e-12);
        assert.ok(!Object.hasOwn(pokemon, "upperPoolProbability"));
        const badge = generator.getRarityDetails(pokemon);
        assert.equal(badge.probability, expected);
        assert.ok(badge.displayText.endsWith("% Chance"));
        available.splice(available.findIndex(p => p.id === pokemon.id), 1);
    }
}
function forceFirstPokemon(pool, id, mode, ceiling = "Uber") {
    const available = pool.filter(p => tiers.indexOf(p.tier) <= tiers.indexOf(ceiling));
    const target = available.find(p => p.id === id);
    assert.ok(target, id);
    const selection = generator.getTierSelectionData(available, pool, ceiling, mode);
    const tierTotal = selection.availableTiers.reduce((sum, tier) => sum + selection.tierWeights[tier], 0);
    const earlierTiers = selection.availableTiers.slice(0, selection.availableTiers.indexOf(target.tier));
    const tierRoll = (earlierTiers.reduce((sum, tier) => sum + selection.tierWeights[tier], 0) + selection.tierWeights[target.tier] / 2) / tierTotal;
    const members = available.filter(p => p.tier === target.tier);
    const weights = members.map(p => generator.getPokemonPullWeight(p));
    const index = members.findIndex(p => p.id === id);
    const speciesRoll = (weights.slice(0, index).reduce((sum, w) => sum + w, 0) + weights[index] / 2) / weights.reduce((sum, w) => sum + w, 0);
    const originalRandom = seededMath.random;
    let calls = 0;
    seededMath.random = () => calls++ === 0 ? tierRoll : (calls === 2 ? speciesRoll : originalRandom());
    let team;
    try { team = generator.generateTeam(pool, ceiling, mode); }
    finally { seededMath.random = originalRandom; }
    assert.equal(team[0].id, id);
    verifySlotProbabilities(team, pool, ceiling, mode);
    return team[0];
}
const mewtwoChances = ["gen1", "nationaldex", "bananza"].map(pool =>
    forceFirstPokemon(generator.datasets[pool], "mewtwo", "++").pullProbability);
assert.equal(new Set(mewtwoChances).size, 3);
const uuExample = generator.datasets.gen9.find(p => p.tier === "UU").id;
const rebalancedOU = forceFirstPokemon(generator.datasets.gen9, "kyurem", "++");
const rebalancedUU = forceFirstPokemon(generator.datasets.gen9, uuExample, "++");
const revisedProfile = generator.tierOddsProfiles["++"];
const savedOU = revisedProfile.OU, savedUU = revisedProfile.UU;
let previousOU, previousUU;
try {
    revisedProfile.OU = 38; revisedProfile.UU = 25;
    previousOU = forceFirstPokemon(generator.datasets.gen9, "kyurem", "++");
    previousUU = forceFirstPokemon(generator.datasets.gen9, uuExample, "++");
} finally { revisedProfile.OU = savedOU; revisedProfile.UU = savedUU; }
assert.ok(rebalancedOU.pullProbability < previousOU.pullProbability);
assert.ok(rebalancedUU.pullProbability > previousUU.pullProbability);
assert.equal(generator.getRarityDetails(rebalancedUU).probability, rebalancedUU.pullProbability);
console.log("Mewtwo actual slot percentages (Gen 1 / National Dex / Bananza, Uber++):", mewtwoChances.map(p => (p * 100).toFixed(6) + "%").join(" / "));
// Ordinary, featured OU/Uber, and AG probabilities all respond to Odds.
for (const id of ["mewtwo", "zacian", "dragapult", "koraidon"]) {
    const pool = generator.datasets.bananza;
    const pulled = modes.map(mode => forceFirstPokemon(pool, id, mode));
    for (let i = 1; i < pulled.length; i++) {
        assert.ok(pulled[i].pullProbability > pulled[i - 1].pullProbability);
        const rarityOrder = ["Common", "Rare", "Very Rare", "Ultra Rare"];
        assert.ok(rarityOrder.indexOf(generator.getRarityDetails(pulled[i]).label) <= rarityOrder.indexOf(generator.getRarityDetails(pulled[i - 1]).label));
    }
}
const visualScale = modes.map(mode => generator.getRarityDetails(forceFirstPokemon(generator.datasets.gen1, "mewtwo", mode)));
assert.equal(visualScale[0].label, "Rare");
assert.equal(visualScale.at(-1).label, "Common");
assert.notEqual(visualScale[0].className, visualScale.at(-1).className);

// Type filtering uses each exact form's modern typing, including either dual type.
const types = ["Bug", "Dark", "Dragon", "Electric", "Fairy", "Fighting", "Fire", "Flying", "Ghost", "Grass", "Ground", "Ice", "Normal", "Poison", "Psychic", "Rock", "Steel", "Water"];
vm.runInContext('globalThis.details = POKEMON_DETAILS_DATA;', context);
for (const type of types) {
    const pool = generator.getActivePokemonPool("bananza", type);
    assert.ok(pool.length >= 6, `Too few ${type} Pokemon`);
    assert.ok(pool.every(p => context.details[p.id].modern.types.includes(type)));
    for (const mode of ["--", "-", "=", "+", "++"]) {
        const team = generator.generateTeam(pool, "Uber", mode);
        assert.equal(new Set(team.map(p => p.id)).size, 6);
        assert.ok(team.every(p => context.details[p.id].modern.types.includes(type)));
        verifySlotProbabilities(team, pool, "Uber", mode);
    }
}
assert.ok(generator.getActivePokemonPool("bananza", "Bug").some(p => p.id === "volcarona"));
assert.ok(generator.getActivePokemonPool("bananza", "Fire").some(p => p.id === "volcarona"));
assert.ok(generator.getActivePokemonPool("bananza", "Steel").some(p => p.id === "zaciancrowned"));
assert.ok(!generator.getActivePokemonPool("bananza", "Steel").some(p => p.id === "zacian"));
assert.ok(generator.getActivePokemonPool("bananza", "Psychic").some(p => p.id === "mewtwo"));
assert.equal(generator.getActivePokemonPool("gen9", "Bug"), generator.datasets.gen9);
element("pool-select").value = "bananza";
element("type-pool-select").value = "Bug";
generator.updateTierAvailability();
assert.equal(element("type-pool-setting").hidden, false);
context.checkSimulationPool = pool => assert.ok(pool.every(p => context.details[p.id].modern.types.includes("Bug")));
vm.runInContext('const originalGenerateForTypeTest = generateTeam; generateTeam = (...args) => { checkSimulationPool(args[0]); return originalGenerateForTypeTest(...args); }; globalThis.generator.simulateTeams = simulateTeams;', context);
const typeSimulation = generator.simulateTeams(10);
vm.runInContext('generateTeam = originalGenerateForTypeTest;', context);
assert.equal(typeSimulation.selectedType, "Bug");
assert.equal(typeSimulation.totalPokemon, 60);
element("pool-select").value = "gen9";
generator.updateTierAvailability();
assert.equal(element("type-pool-setting").hidden, true);
for (const p of [{id:"garchomp",tier:"OU"},{id:"mewtwo",tier:"Uber"},{id:"zacian",tier:"Uber"},{id:"ag",sourceTier:"AG",tier:"Uber"}]) {
    assert.equal(generator.shouldPlayRevealAudio(p), true);
}
assert.equal(generator.shouldPlayRevealAudio({id:"zapdos",tier:"OU"}), false);
assert.equal(generator.shouldPlayRevealAudio({id:"volcarona",tier:"UU"}), false);

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
            verifySlotProbabilities(team, pool, ceiling, mode);
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

// Exercise the full reveal lifecycle in both motion modes, including transitions
// from a featured pull to an ordinary one. No browser or audio hardware needed.
(async () => {
    const overlay = element("reveal-overlay");
    let classes = new Set();
    Object.defineProperty(overlay, "className", {
        get: () => [...classes].join(" "),
        set: value => { classes = new Set(value.split(/\s+/)); }
    });
    overlay.classList = { add: (...values) => values.forEach(value => classes.add(value)), remove: (...values) => values.forEach(value => classes.delete(value)) };
    const properties = {};
    overlay.style.setProperty = (name, value) => { properties[name] = value; };
    context.window = { matchMedia: () => ({ matches: context.reducedMotion }) };
    context.revealSnapshots = [];
    context.oscillatorFrequencies = [];
    context.sampleStarts = 0;
    context.takeSnapshot = () => context.revealSnapshots.push({
        classes: overlay.className, color: properties["--reveal-color"],
        label: element("reveal-special-label").textContent,
        typeText: element("reveal-type-text").textContent
    });
    vm.runInContext(`
        sleep = async () => {};
        waitForContinue = async () => takeSnapshot();
        prepareAudio = () => {};
        revealAudioBufferPromise = Promise.resolve({});
        audioContext = {
            state: "running", currentTime: 0, destination: {},
            createBufferSource() { return { connect() {}, start() { sampleStarts++; }, stop() {}, disconnect() {} }; },
            createOscillator() { return { frequency: { setValueAtTime(value) { oscillatorFrequencies.push(value); } }, connect() {}, start() {}, stop() {}, disconnect() {} }; },
            createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} }; }
        };
    `, context);
    for (const reduced of [false, true]) {
        context.reducedMotion = reduced;
        for (const [id, tier, color, label, notes, sourceTier] of [
            ["zaciancrowned", "Uber", "#DF00FF", "Feature Rare Uber", 6],
            ["garchomp", "OU", "#800020", "Rare OU", 6],
            ["koraidon", "Uber", "#ffe7a6", "Anything Goes", 6, "AG"],
            ["mewtwo", "Uber", null, "", 6],
            ["zapdos", "OU", null, "", 6],
            ["ribombee", "RU", null, "", 6]
        ]) {
            context.oscillatorFrequencies.length = 0;
            context.sampleStarts = 0;
            context.preview = { id, name: id, generation: 9, tier, sourceTier, pullProbability: 0.00001 };
            await vm.runInContext('playRevealSequence(preview.tier, preview)', context);
            const snapshot = context.revealSnapshots.at(-1);
            assert.equal(snapshot.label, label);
            assert.ok(snapshot.classes.includes("rarity-ultra-rare"));
            assert.equal(element("reveal-pull-chance").className, "reveal-pull-chance rarity-ultra-rare");
            const shouldHaveEffect = generator.shouldPlayRevealAudio(context.preview);
            assert.equal(snapshot.typeText, shouldHaveEffect ? generator.getRevealTypes(context.preview).join(" ◆ ") : "");
            if (shouldHaveEffect) assert.ok(snapshot.classes.includes("rare-reveal"));
            assert.equal(snapshot.classes.includes("rift-reveal"), label === "Rare OU");
            assert.equal(snapshot.classes.includes("stardust-reveal"), tier === "Uber");
            if (color) assert.equal(snapshot.color, color);
            else assert.ok(!snapshot.classes.includes('special-'));
            assert.equal(overlay.className, 'reveal-overlay');
            assert.equal(element("reveal-hologram").src, undefined);
            assert.equal(element("reveal-preview-sprite").onload, null);
            assert.equal(element("reveal-usage-rank").textContent, "");
            assert.equal(element("reveal-usage-percentage").textContent, "");
            assert.equal(context.oscillatorFrequencies.length, reduced ? 0 : notes);
            assert.equal(context.sampleStarts, !reduced && generator.shouldPlayRevealAudio(context.preview) ? 1 : 0);
        }
    }
    // A late download must not start after the user has continued.
    context.sampleStarts = 0;
    const revealPhases = [];
    const previousSleep = vm.runInContext('sleep', context);
    context.capturePhase = () => {
        if (overlay.classList && overlay.className.includes("rarity-revealed")) {
            revealPhases.push({ classes: overlay.className, sprite: element("reveal-preview-sprite").src,
                hologram: element("reveal-hologram").src });
        }
    };
    context.reducedMotion = false;
    vm.runInContext('sleep = async () => capturePhase();', context);
    context.preview = { id: "garchomp", name: "Garchomp", tier: "OU", generation: 4, pullProbability: .002 };
    await vm.runInContext('playRevealSequence("OU", preview)', context);
    assert.ok(revealPhases.some(phase => phase.classes.includes("rift-reveal") && !phase.classes.includes("pokemon-revealed")));
    assert.ok(revealPhases.some(phase => phase.classes.includes("rift-reveal") && phase.classes.includes("pokemon-revealed")));
    for (const phase of revealPhases) assert.equal(phase.hologram, phase.sprite);
    assert.match(revealPhases[0].sprite, /sprites\/gen4\/garchomp\.png$/);
    context.sleep = previousSleep;

    context.sampleStarts = 0;
    vm.runInContext('revealAudioBufferPromise = new Promise(resolve => { globalThis.finishAudioLoad = resolve; });', context);
    const delayedPlayback = vm.runInContext('playRevealAudio({tier:"Uber",id:"mewtwo"})', context);
    vm.runInContext('stopRevealAudio(); finishAudioLoad({});', context);
    await delayedPlayback;
    assert.equal(context.sampleStarts, 0);
    console.log('PASS: curated reveal colors, normal/reduced-motion lifecycle, state reset, and uploaded audio playback.');
})().catch(error => { console.error(error); process.exitCode = 1; });
