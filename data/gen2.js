/*
    GENERATION 2 POKÉMON DATA

    Eligibility / tier source:
    - Pokémon Showdown Generation 2 teambuilder snapshot supplied for this project.

    Usage sources:
    - Smogon Gen 2 OU usage statistics, July 2020.
    - Smogon Gen 2 Ubers usage statistics, July 2020.

    Hybrid usage rule:
    - Uber-class Pokémon use the Gen 2 Ubers usage table.
    - OU and lower classes use the Gen 2 OU usage table.
    - The two ladders are never averaged together.
    - Missing usage stays null and receives the neutral 1.00x modifier.

    Eligibility / tier rules:
    - Fully evolved only in the Generation 2 environment.
    - A species/form is excluded if it has an evolution available by Gen 2.
    - Evolutions introduced in Generation 3 or later do not disqualify a Gen 2 Pokémon.
    - `sourceTier` preserves Showdown's historical label; `tier` is the generator class.
    - UUBL -> OU, RUBL -> UU, NUBL -> RU, PUBL -> NU, ZUBL -> PU.
    - `(OU)` remains preserved as the source label and maps to OU.

    Validation snapshot:
    - 195 Showdown entries parsed before the LC section.
    - 6 entries from the explicit NFE section excluded.
    - 51 additional Pokémon that can still evolve in Gen 2 excluded.
    - 138 Pokémon/forms retained.
    - Canonical tier counts: Uber 5, OU 47, UU 33, RU 3, NU 22, PU 18, ZU 10.
    - 138 retained Pokémon/forms matched their designated usage source; 0 have no recorded row.
    - Usage battles: OU 6576; Ubers 924.
*/

const GEN2_DATASET_META = {"generation":2,"format":"gen2","pokemonCount":138,"usageRecordedCount":138,"usageMissingCount":0,"usagePeriod":"2020-07","usageSources":{"gen2ou":"Smogon Gen 2 OU usage statistics","gen2ubers":"Smogon Gen 2 Ubers usage statistics"},"battles":{"gen2ou":6576,"gen2ubers":924},"tierCounts":{"Uber":5,"OU":47,"UU":33,"RU":3,"NU":22,"PU":18,"ZU":10}};

function makeGen2Id(name) {
    return name
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[’']/g, "")
        .replace(/[^a-z0-9]+/g, "");
}

// Row layout:
// [name, sourceTier, tier, usageSource, rank, usagePct, raw, rawPct, real, realPct]
// A null rank means no usage row was recorded in that Pokémon/form's designated source.
const GEN2_ROWS = [
    ["Celebi","Uber","Uber","gen2ubers",8,22.72727,420,22.727,320,22.074],
    ["Ho-Oh","Uber","Uber","gen2ubers",5,32.41342,599,32.413,485,33.456],
    ["Lugia","Uber","Uber","gen2ubers",2,50.54113,934,50.541,639,44.079],
    ["Mew","Uber","Uber","gen2ubers",4,47.34848,875,47.348,616,42.493],
    ["Mewtwo","Uber","Uber","gen2ubers",1,62.71645,1159,62.716,945,65.187],
    ["Alakazam","OU","OU","gen2ou",32,5.23114,688,5.231,544,5.037],
    ["Blissey","OU","OU","gen2ou",13,14.27159,1877,14.272,1481,13.714],
    ["Cloyster","OU","OU","gen2ou",2,37.7129,4960,37.713,4344,40.224],
    ["Exeggutor","OU","OU","gen2ou",7,21.44921,2821,21.449,2392,22.149],
    ["Forretress","OU","OU","gen2ou",12,14.33242,1885,14.332,1715,15.88],
    ["Gengar","OU","OU","gen2ou",6,23.83668,3135,23.837,2489,23.047],
    ["Golem","OU","OU","gen2ou",20,10.30262,1355,10.303,1106,10.241],
    ["Heracross","OU","OU","gen2ou",17,12.00578,1579,12.006,1219,11.288],
    ["Jolteon","OU","OU","gen2ou",27,6.75943,889,6.759,737,6.824],
    ["Jynx","OU","OU","gen2ou",21,8.82755,1161,8.828,1003,9.287],
    ["Machamp","OU","OU","gen2ou",8,19.35067,2545,19.351,1888,17.482],
    ["Marowak","OU","OU","gen2ou",14,13.14629,1729,13.146,1380,12.778],
    ["Miltank","OU","OU","gen2ou",23,8.51582,1120,8.516,856,7.926],
    ["Misdreavus","OU","OU","gen2ou",22,8.81995,1160,8.82,969,8.973],
    ["Nidoking","OU","OU","gen2ou",10,14.65937,1928,14.659,1663,15.399],
    ["Raikou","OU","OU","gen2ou",4,27.98054,3680,27.981,3275,30.325],
    ["Rhydon","OU","OU","gen2ou",30,5.59611,736,5.596,587,5.435],
    ["Skarmory","OU","OU","gen2ou",9,17.48783,2300,17.488,1954,18.093],
    ["Snorlax","OU","OU","gen2ou",1,63.99027,8416,63.99,6924,64.114],
    ["Starmie","OU","OU","gen2ou",15,13.11588,1725,13.116,1381,12.788],
    ["Steelix","OU","OU","gen2ou",11,14.37044,1890,14.37,1594,14.76],
    ["Suicune","OU","OU","gen2ou",18,10.78923,1419,10.789,1153,10.676],
    ["Tyranitar","OU","OU","gen2ou",5,26.44465,3478,26.445,2760,25.557],
    ["Umbreon","OU","OU","gen2ou",16,12.75091,1677,12.751,1440,13.334],
    ["Vaporeon","OU","OU","gen2ou",25,8.08242,1063,8.082,809,7.491],
    ["Zapdos","OU","OU","gen2ou",3,32.03315,4213,32.033,3676,34.039],
    ["Porygon2","(OU)","OU","gen2ou",56,1.27737,168,1.277,144,1.333],
    ["Articuno","UUBL","OU","gen2ou",73,0.68431,90,0.684,66,0.611],
    ["Charizard","UUBL","OU","gen2ou",19,10.34063,1360,10.341,1096,10.149],
    ["Clefable","UUBL","OU","gen2ou",55,1.36861,180,1.369,150,1.389],
    ["Donphan","UUBL","OU","gen2ou",52,1.52828,201,1.528,167,1.546],
    ["Dragonite","UUBL","OU","gen2ou",29,6.32603,832,6.326,680,6.297],
    ["Entei","UUBL","OU","gen2ou",46,1.83242,241,1.832,183,1.695],
    ["Espeon","UUBL","OU","gen2ou",31,5.53528,728,5.535,567,5.25],
    ["Houndoom","UUBL","OU","gen2ou",28,6.41727,844,6.417,630,5.834],
    ["Kangaskhan","UUBL","OU","gen2ou",68,0.77555,102,0.776,80,0.741],
    ["Kingdra","UUBL","OU","gen2ou",38,2.82847,372,2.828,293,2.713],
    ["Lapras","UUBL","OU","gen2ou",49,1.68796,222,1.688,165,1.528],
    ["Meganium","UUBL","OU","gen2ou",35,4.92701,648,4.927,554,5.13],
    ["Moltres","UUBL","OU","gen2ou",40,2.56995,338,2.57,274,2.537],
    ["Scizor","UUBL","OU","gen2ou",26,7.12439,937,7.124,762,7.056],
    ["Smeargle","UUBL","OU","gen2ou",33,5.22354,687,5.224,648,6],
    ["Tauros","UUBL","OU","gen2ou",58,1.15572,152,1.156,125,1.157],
    ["Tentacruel","UUBL","OU","gen2ou",47,1.7792,234,1.779,182,1.685],
    ["Typhlosion","UUBL","OU","gen2ou",34,5.04866,664,5.049,547,5.065],
    ["Ursaring","UUBL","OU","gen2ou",50,1.68035,221,1.68,184,1.704],
    ["Venusaur","UUBL","OU","gen2ou",24,8.47019,1114,8.47,954,8.834],
    ["Aerodactyl","UU","UU","gen2ou",36,3.52798,464,3.528,386,3.574],
    ["Ampharos","UU","UU","gen2ou",39,2.82086,371,2.821,309,2.861],
    ["Arcanine","UU","UU","gen2ou",48,1.73358,228,1.734,173,1.602],
    ["Bellossom","UU","UU","gen2ou",86,0.53224,70,0.532,59,0.546],
    ["Blastoise","UU","UU","gen2ou",41,2.28863,301,2.289,229,2.12],
    ["Crobat","UU","UU","gen2ou",45,1.84002,242,1.84,198,1.833],
    ["Dodrio","UU","UU","gen2ou",53,1.52068,200,1.521,171,1.583],
    ["Electabuzz","UU","UU","gen2ou",54,1.49027,196,1.49,171,1.583],
    ["Electrode","UU","UU","gen2ou",72,0.69951,92,0.7,74,0.685],
    ["Feraligatr","UU","UU","gen2ou",37,2.96533,390,2.965,328,3.037],
    ["Girafarig","UU","UU","gen2ou",90,0.4562,60,0.456,46,0.426],
    ["Gligar","UU","UU","gen2ou",106,0.35736,47,0.357,44,0.407],
    ["Granbull","UU","UU","gen2ou",158,0.05322,7,0.053,6,0.056],
    ["Gyarados","UU","UU","gen2ou",63,0.95803,126,0.958,103,0.954],
    ["Hypno","UU","UU","gen2ou",123,0.2281,30,0.228,25,0.231],
    ["Jumpluff","UU","UU","gen2ou",60,0.99605,131,0.996,109,1.009],
    ["Kabutops","UU","UU","gen2ou",126,0.2129,28,0.213,25,0.231],
    ["Lanturn","UU","UU","gen2ou",70,0.70712,93,0.707,77,0.713],
    ["Magneton","UU","UU","gen2ou",78,0.59307,78,0.593,66,0.611],
    ["Mr. Mime","UU","UU","gen2ou",105,0.36496,48,0.365,40,0.37],
    ["Muk","UU","UU","gen2ou",51,1.53589,202,1.536,156,1.445],
    ["Nidoqueen","UU","UU","gen2ou",69,0.74513,98,0.745,83,0.769],
    ["Omastar","UU","UU","gen2ou",85,0.53224,70,0.532,61,0.565],
    ["Piloswine","UU","UU","gen2ou",79,0.58546,77,0.585,66,0.611],
    ["Pinsir","UU","UU","gen2ou",121,0.25091,33,0.251,26,0.241],
    ["Politoed","UU","UU","gen2ou",98,0.40298,53,0.403,45,0.417],
    ["Quagsire","UU","UU","gen2ou",43,2.0149,265,2.015,214,1.982],
    ["Qwilfish","UU","UU","gen2ou",67,0.78315,103,0.783,97,0.898],
    ["Sandslash","UU","UU","gen2ou",59,1.07968,142,1.08,122,1.13],
    ["Slowbro","UU","UU","gen2ou",84,0.53224,70,0.532,50,0.463],
    ["Slowking","UU","UU","gen2ou",92,0.441,58,0.441,41,0.38],
    ["Victreebel","UU","UU","gen2ou",71,0.69951,92,0.7,74,0.685],
    ["Vileplume","UU","UU","gen2ou",75,0.65389,86,0.654,77,0.713],
    ["Golduck","NUBL","RU","gen2ou",66,0.78315,103,0.783,84,0.778],
    ["Poliwrath","NUBL","RU","gen2ou",64,0.86679,114,0.867,98,0.907],
    ["Raichu","NUBL","RU","gen2ou",44,1.97689,260,1.977,203,1.88],
    ["Dewgong","NU","NU","gen2ou",115,0.30414,40,0.304,34,0.315],
    ["Dugtrio","NU","NU","gen2ou",101,0.38777,51,0.388,44,0.407],
    ["Fearow","NU","NU","gen2ou",89,0.47141,62,0.471,50,0.463],
    ["Flareon","NU","NU","gen2ou",87,0.52464,69,0.525,47,0.435],
    ["Hitmonlee","NU","NU","gen2ou",74,0.6691,88,0.669,64,0.593],
    ["Hitmontop","NU","NU","gen2ou",83,0.54745,72,0.547,60,0.556],
    ["Kingler","NU","NU","gen2ou",161,0.04562,6,0.046,6,0.056],
    ["Ledian","NU","NU","gen2ou",103,0.37257,49,0.373,34,0.315],
    ["Lickitung","NU","NU","gen2ou",141,0.10645,14,0.106,11,0.102],
    ["Magmar","NU","NU","gen2ou",93,0.43339,57,0.433,44,0.407],
    ["Ninetales","NU","NU","gen2ou",124,0.2281,30,0.228,25,0.231],
    ["Octillery","NU","NU","gen2ou",113,0.31934,42,0.319,37,0.343],
    ["Persian","NU","NU","gen2ou",116,0.28893,38,0.289,31,0.287],
    ["Pidgeot","NU","NU","gen2ou",82,0.56265,74,0.563,56,0.519],
    ["Primeape","NU","NU","gen2ou",61,0.98844,130,0.988,105,0.972],
    ["Rapidash","NU","NU","gen2ou",88,0.50943,67,0.509,62,0.574],
    ["Shuckle","NU","NU","gen2ou",57,1.26977,167,1.27,154,1.426],
    ["Stantler","NU","NU","gen2ou",168,0.03802,5,0.038,5,0.046],
    ["Sudowoodo","NU","NU","gen2ou",109,0.35736,47,0.357,39,0.361],
    ["Weezing","NU","NU","gen2ou",100,0.38777,51,0.388,43,0.398],
    ["Wigglytuff","NU","NU","gen2ou",131,0.19009,25,0.19,19,0.176],
    ["Xatu","NU","NU","gen2ou",91,0.4562,60,0.456,48,0.444],
    ["Arbok","PU","PU","gen2ou",122,0.2281,30,0.228,21,0.194],
    ["Azumarill","PU","PU","gen2ou",81,0.57026,75,0.57,54,0.5],
    ["Corsola","PU","PU","gen2ou",142,0.09884,13,0.099,13,0.12],
    ["Delibird","PU","PU","gen2ou",97,0.40298,53,0.403,52,0.482],
    ["Dunsparce","PU","PU","gen2ou",146,0.07603,10,0.076,10,0.093],
    ["Farfetch’d","PU","PU","gen2ou",129,0.19769,26,0.198,20,0.185],
    ["Furret","PU","PU","gen2ou",111,0.33455,44,0.335,38,0.352],
    ["Hitmonchan","PU","PU","gen2ou",117,0.28893,38,0.289,35,0.324],
    ["Magcargo","PU","PU","gen2ou",133,0.16727,22,0.167,18,0.167],
    ["Mantine","PU","PU","gen2ou",150,0.06843,9,0.068,8,0.074],
    ["Murkrow","PU","PU","gen2ou",128,0.20529,27,0.205,21,0.194],
    ["Noctowl","PU","PU","gen2ou",65,0.86679,114,0.867,85,0.787],
    ["Raticate","PU","PU","gen2ou",104,0.36496,48,0.365,44,0.407],
    ["Seaking","PU","PU","gen2ou",152,0.06843,9,0.068,7,0.065],
    ["Sneasel","PU","PU","gen2ou",77,0.60827,80,0.608,62,0.574],
    ["Tangela","PU","PU","gen2ou",112,0.31934,42,0.319,35,0.324],
    ["Venomoth","PU","PU","gen2ou",118,0.28133,37,0.281,35,0.324],
    ["Beedrill","ZUBL","PU","gen2ou",130,0.19009,25,0.19,17,0.157],
    ["Aipom","ZU","ZU","gen2ou",108,0.35736,47,0.357,43,0.398],
    ["Ariados","ZU","ZU","gen2ou",132,0.19009,25,0.19,19,0.176],
    ["Butterfree","ZU","ZU","gen2ou",137,0.14446,19,0.144,18,0.167],
    ["Ditto","ZU","ZU","gen2ou",114,0.30414,40,0.304,33,0.306],
    ["Parasect","ZU","ZU","gen2ou",120,0.25852,34,0.259,32,0.296],
    ["Sunflora","ZU","ZU","gen2ou",127,0.20529,27,0.205,24,0.222],
    ["Togetic","ZU","ZU","gen2ou",76,0.63869,84,0.639,62,0.574],
    ["Unown","ZU","ZU","gen2ou",156,0.05322,7,0.053,5,0.046],
    ["Wobbuffet","ZU","ZU","gen2ou",95,0.41058,54,0.411,45,0.417],
    ["Yanma","ZU","ZU","gen2ou",138,0.14446,19,0.144,16,0.148],
];

const GEN2_POKEMON = GEN2_ROWS.map(function (row) {
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
        id: makeGen2Id(name),
        name: name,
        generation: 2,
        format: "gen2",
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
