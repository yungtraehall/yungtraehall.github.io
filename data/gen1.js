/*
    GENERATION 1 POKÉMON DATA

    Eligibility / tier source:
    - Pokémon Showdown Generation 1 teambuilder snapshot supplied for this project.

    Usage sources:
    - Smogon Gen 1 OU usage statistics, June 2020.
    - Smogon Gen 1 Ubers usage statistics, June 2020.

    Hybrid usage rule:
    - Uber-class Pokémon use the Gen 1 Ubers usage table.
    - OU and lower classes use the Gen 1 OU usage table.
    - The two ladders are never averaged together.
    - Missing usage stays null and receives the neutral 1.00x modifier.

    Eligibility / tier rules:
    - Fully evolved only in the Generation 1 environment.
    - A species is excluded if it has an evolution available in Gen 1.
    - Evolutions introduced in Generation 2 or later do not disqualify a Gen 1 Pokémon.
    - `sourceTier` preserves Showdown's historical label; `tier` is the generator class.
    - UUBL -> OU, RUBL -> UU, NUBL -> RU, PUBL -> NU, ZUBL -> PU.
    - `(OU)` remains preserved as the source label and maps to OU.

    Validation snapshot:
    - 54 Showdown tiered entries parsed.
    - 0 explicit NFE entries excluded.
    - 4 additional Pokémon that can still evolve in Gen 1 excluded.
    - 50 Pokémon retained.
    - Canonical tier counts: Uber 2, OU 11, UU 17, RU 0, NU 20, PU 0, ZU 0.
    - 50 retained Pokémon matched their designated usage source; 0 have no recorded row.
    - Usage battles: OU 14193; Ubers 1924.
*/

const GEN1_DATASET_META = {"generation":1,"format":"gen1","pokemonCount":50,"usageRecordedCount":50,"usageMissingCount":0,"usagePeriod":"2020-06","usageSources":{"gen1ou":"Smogon Gen 1 OU usage statistics","gen1ubers":"Smogon Gen 1 Ubers usage statistics"},"battles":{"gen1ou":14193,"gen1ubers":1924},"tierCounts":{"Uber":2,"OU":11,"UU":17,"NU":20}};

function makeGen1Id(name) {
    return name
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[’']/g, "")
        .replace(/[^a-z0-9]+/g, "");
}

// Row layout:
// [name, sourceTier, tier, usageSource, rank, usagePct, raw, rawPct, real, realPct]
const GEN1_ROWS = [
    ["Mew","Uber","Uber","gen1ubers",2,62.47401,2404,62.474,1541,57.712],
    ["Mewtwo","Uber","Uber","gen1ubers",1,83.47193,3212,83.472,2622,98.196],
    ["Alakazam","OU","OU","gen1ou",4,52.2335,14827,52.233,13036,55.749],
    ["Chansey","OU","OU","gen1ou",2,55.12929,15649,55.129,13260,56.707],
    ["Cloyster","OU","OU","gen1ou",13,13.82372,3924,13.824,3200,13.685],
    ["Exeggutor","OU","OU","gen1ou",5,51.17664,14527,51.177,12768,54.603],
    ["Gengar","OU","OU","gen1ou",8,26.25238,7452,26.252,6259,26.767],
    ["Jynx","OU","OU","gen1ou",11,15.76834,4476,15.768,4297,18.376],
    ["Rhydon","OU","OU","gen1ou",7,29.53216,8383,29.532,6665,28.503],
    ["Snorlax","OU","OU","gen1ou",3,55.00599,15614,55.006,12618,53.961],
    ["Starmie","OU","OU","gen1ou",6,32.41034,9200,32.41,8035,34.362],
    ["Tauros","OU","OU","gen1ou",1,61.26259,17390,61.263,13191,56.412],
    ["Zapdos","OU","OU","gen1ou",9,22.6344,6425,22.634,5115,21.874],
    ["Articuno","UU","UU","gen1ou",19,6.72162,1908,6.722,1540,6.586],
    ["Clefable","UU","UU","gen1ou",53,0.96174,273,0.962,250,1.069],
    ["Dodrio","UU","UU","gen1ou",33,1.78609,507,1.786,436,1.865],
    ["Dragonite","UU","UU","gen1ou",15,9.61037,2728,9.61,2129,9.105],
    ["Dugtrio","UU","UU","gen1ou",36,1.67336,475,1.673,407,1.741],
    ["Electabuzz","UU","UU","gen1ou",50,1.0639,302,1.064,248,1.061],
    ["Gyarados","UU","UU","gen1ou",24,3.60389,1023,3.604,844,3.609],
    ["Hypno","UU","UU","gen1ou",30,1.95871,556,1.959,484,2.07],
    ["Jolteon","UU","UU","gen1ou",10,17.66716,5015,17.667,4234,18.107],
    ["Kangaskhan","UU","UU","gen1ou",49,1.0639,302,1.064,266,1.138],
    ["Lapras","UU","UU","gen1ou",14,13.34461,3788,13.345,3117,13.33],
    ["Moltres","UU","UU","gen1ou",29,2.22645,632,2.226,482,2.061],
    ["Ninetales","UU","UU","gen1ou",48,1.078,306,1.078,259,1.108],
    ["Persian","UU","UU","gen1ou",21,5.29486,1503,5.295,1231,5.264],
    ["Raichu","UU","UU","gen1ou",28,2.2652,643,2.265,540,2.309],
    ["Rapidash","UU","UU","gen1ou",71,0.54252,154,0.543,118,0.505],
    ["Slowbro","UU","UU","gen1ou",12,14.19009,4028,14.19,3207,13.715],
    ["Aerodactyl","NU","NU","gen1ou",34,1.77552,504,1.776,394,1.685],
    ["Arcanine","NU","NU","gen1ou",25,3.44888,979,3.449,801,3.425],
    ["Blastoise","NU","NU","gen1ou",22,4.70302,1335,4.703,1112,4.755],
    ["Charizard","NU","NU","gen1ou",16,9.59628,2724,9.596,2240,9.579],
    ["Dewgong","NU","NU","gen1ou",74,0.48263,137,0.483,118,0.505],
    ["Electrode","NU","NU","gen1ou",31,1.9411,551,1.941,486,2.078],
    ["Fearow","NU","NU","gen1ou",78,0.36285,103,0.363,85,0.364],
    ["Golem","NU","NU","gen1ou",17,8.53942,2424,8.539,2022,8.647],
    ["Kabutops","NU","NU","gen1ou",68,0.64468,183,0.645,154,0.659],
    ["Magneton","NU","NU","gen1ou",67,0.66934,190,0.669,171,0.731],
    ["Mr. Mime","NU","NU","gen1ou",69,0.64116,182,0.641,146,0.624],
    ["Omastar","NU","NU","gen1ou",70,0.55309,157,0.553,132,0.565],
    ["Poliwrath","NU","NU","gen1ou",38,1.5254,433,1.525,346,1.48],
    ["Raticate","NU","NU","gen1ou",75,0.47911,136,0.479,116,0.496],
    ["Seadra","NU","NU","gen1ou",81,0.35229,100,0.352,86,0.368],
    ["Tangela","NU","NU","gen1ou",82,0.32763,93,0.328,81,0.346],
    ["Tentacruel","NU","NU","gen1ou",42,1.21187,344,1.212,277,1.185],
    ["Vaporeon","NU","NU","gen1ou",43,1.13788,323,1.138,268,1.146],
    ["Venomoth","NU","NU","gen1ou",58,0.83492,237,0.835,191,0.817],
    ["Victreebel","NU","NU","gen1ou",18,7.26767,2063,7.268,1581,6.761],
];

const GEN1_POKEMON = GEN1_ROWS.map(function (row) {
    const [
        name,
        sourceTier,
        tier,
        usageSource,
        rank,
        usagePct,
        raw,
        rawPct,
        real,
        realPct
    ] = row;

    const recorded = rank !== null;

    return {
        id: makeGen1Id(name),
        name: name,
        generation: 1,
        format: "gen1",
        usageSource: usageSource,
        sourceTier: sourceTier,
        tier: tier,
        fullyEvolved: true,
        usage: {
            recorded: recorded,
            rank: rank,
            usagePct: usagePct,
            raw: raw,
            rawPct: rawPct,
            real: real,
            realPct: realPct
        },
        usageModifier: 1.00
    };
});
