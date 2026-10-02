/*
    GENERATION 3 POKÉMON DATA

    Eligibility / tier source:
    - Pokémon Showdown Generation 3 teambuilder snapshot supplied for this project.

    Usage sources:
    - Smogon Gen 3 OU usage statistics, August 2016.
    - Smogon Gen 3 Ubers usage statistics, December 2016.

    Hybrid usage rule:
    - Uber-class Pokémon use the Gen 3 Ubers usage table.
    - OU and lower classes use the Gen 3 OU usage table.
    - The two ladders are never averaged together.
    - Missing usage stays null and receives the neutral 1.00x modifier.

    Eligibility / tier rules:
    - Fully evolved only in the Generation 3 environment.
    - A species/form is excluded if it has an evolution available by Gen 3.
    - Evolutions introduced in Generation 4 or later do not disqualify a Gen 3 Pokémon.
    - `sourceTier` preserves Showdown's historical label; `tier` is the generator class.
    - UUBL -> OU, RUBL -> UU, NUBL -> RU, PUBL -> NU, ZUBL -> PU.
    - `(OU)` remains preserved as the source label and maps to OU.

    Validation snapshot:
    - 285 Showdown entries parsed.
    - 16 entries from the explicit NFE section excluded.
    - 52 additional Pokémon that can still evolve in Gen 3 excluded.
    - 217 Pokémon/forms retained.
    - Canonical tier counts: Uber 14, OU 71, UU 39, RU 27, NU 25, PU 13, ZU 28.
    - 215 retained Pokémon/forms matched their designated usage source; 2 have no recorded row.
    - Usage battles: OU 23348; Ubers 714.
*/

const GEN3_DATASET_META = {"generation":3,"format":"gen3","pokemonCount":217,"usageRecordedCount":215,"usageMissingCount":2,"usagePeriods":{"gen3ou":"2016-08","gen3ubers":"2016-12"},"usageSources":{"gen3ou":"Smogon Gen 3 OU usage statistics","gen3ubers":"Smogon Gen 3 Ubers usage statistics"},"battles":{"gen3ou":23348,"gen3ubers":714},"tierCounts":{"Uber":14,"OU":71,"UU":39,"RU":27,"NU":25,"PU":13,"ZU":28}};

function makeGen3Id(name) {
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
const GEN3_ROWS = [
    ["Deoxys","Uber","Uber","gen3ubers",28,4.69188,67,4.692,53,5.473],
    ["Deoxys-Attack","Uber","Uber","gen3ubers",7,20.09804,287,20.098,216,22.306],
    ["Deoxys-Defense","Uber","Uber","gen3ubers",11,13.79552,197,13.796,185,19.105],
    ["Deoxys-Speed","Uber","Uber","gen3ubers",31,3.85154,55,3.852,38,3.924],
    ["Groudon","Uber","Uber","gen3ubers",2,42.507,607,42.507,404,41.721],
    ["Ho-Oh","Uber","Uber","gen3ubers",6,24.71989,353,24.72,210,21.687],
    ["Kyogre","Uber","Uber","gen3ubers",1,46.28852,661,46.289,470,48.537],
    ["Latias","Uber","Uber","gen3ubers",10,15.54622,222,15.546,126,13.012],
    ["Latios","Uber","Uber","gen3ubers",8,17.78711,254,17.787,143,14.768],
    ["Lugia","Uber","Uber","gen3ubers",5,26.61064,380,26.611,246,25.404],
    ["Mew","Uber","Uber","gen3ubers",22,7.14286,102,7.143,75,7.745],
    ["Mewtwo","Uber","Uber","gen3ubers",4,34.80392,497,34.804,352,36.351],
    ["Rayquaza","Uber","Uber","gen3ubers",3,37.95518,542,37.955,373,38.52],
    ["Wobbuffet","Uber","Uber","gen3ubers",19,8.33333,119,8.333,88,9.088],
    ["Aerodactyl","OU","OU","gen3ou",12,14.35886,6705,14.359,4962,13.646],
    ["Blissey","OU","OU","gen3ou",7,23.69836,11065,23.696,8583,23.605],
    ["Breloom","OU","OU","gen3ou",26,6.19656,2894,6.198,2129,5.855],
    ["Celebi","OU","OU","gen3ou",9,18.57582,8674,18.575,6940,19.086],
    ["Charizard","OU","OU","gen3ou",31,5.78585,2703,5.789,2047,5.63],
    ["Claydol","OU","OU","gen3ou",29,5.96261,2784,5.962,2169,5.965],
    ["Cloyster","OU","OU","gen3ou",38,4.67756,2184,4.677,1793,4.931],
    ["Dugtrio","OU","OU","gen3ou",10,15.8296,7391,15.828,5466,15.033],
    ["Flygon","OU","OU","gen3ou",22,8.46088,3952,8.463,2909,8],
    ["Forretress","OU","OU","gen3ou",20,10.49453,4900,10.493,4213,11.587],
    ["Gengar","OU","OU","gen3ou",1,31.76793,14833,31.765,11340,31.187],
    ["Gyarados","OU","OU","gen3ou",18,12.81088,5982,12.811,4726,12.997],
    ["Heracross","OU","OU","gen3ou",13,14.02575,6549,14.025,4751,13.066],
    ["Jirachi","OU","OU","gen3ou",24,7.07467,3304,7.076,2509,6.9],
    ["Jolteon","OU","OU","gen3ou",17,13.18077,6155,13.181,5105,14.04],
    ["Magneton","OU","OU","gen3ou",14,13.79873,6444,13.8,4713,12.962],
    ["Medicham","OU","OU","gen3ou",39,4.43126,2069,4.431,1459,4.013],
    ["Metagross","OU","OU","gen3ou",2,27.78581,12976,27.788,10236,28.151],
    ["Milotic","OU","OU","gen3ou",19,11.03689,5154,11.037,3931,10.811],
    ["Moltres","OU","OU","gen3ou",67,1.25078,584,1.251,499,1.372],
    ["Raikou","OU","OU","gen3ou",30,5.81697,2716,5.816,2143,5.894],
    ["Registeel","OU","OU","gen3ou",72,1.02804,480,1.028,401,1.103],
    ["Salamence","OU","OU","gen3ou",5,26.37339,12314,26.371,9528,26.204],
    ["Skarmory","OU","OU","gen3ou",6,23.82258,11123,23.82,9776,26.886],
    ["Snorlax","OU","OU","gen3ou",8,23.17414,10822,23.175,8398,23.096],
    ["Starmie","OU","OU","gen3ou",11,15.08377,7043,15.083,5189,14.271],
    ["Suicune","OU","OU","gen3ou",16,13.52295,6314,13.522,4995,13.737],
    ["Swampert","OU","OU","gen3ou",4,27.39236,12790,27.39,10282,28.278],
    ["Tyranitar","OU","OU","gen3ou",3,27.65151,12911,27.649,10386,28.564],
    ["Zapdos","OU","OU","gen3ou",15,13.5717,6337,13.571,5343,14.694],
    ["Porygon2","(OU)","OU","gen3ou",45,3.0327,1416,3.032,1041,2.863],
    ["Regice","(OU)","OU","gen3ou",41,4.15069,1938,4.15,1500,4.125],
    ["Alakazam","UUBL","OU","gen3ou",21,9.03121,4218,9.033,3224,8.867],
    ["Armaldo","UUBL","OU","gen3ou",64,1.38571,647,1.386,489,1.345],
    ["Articuno","UUBL","OU","gen3ou",76,0.831,388,0.831,313,0.861],
    ["Blaziken","UUBL","OU","gen3ou",28,6.0033,2803,6.003,2085,5.734],
    ["Crobat","UUBL","OU","gen3ou",47,2.8528,1333,2.855,1049,2.885],
    ["Dodrio","UUBL","OU","gen3ou",69,1.1544,539,1.154,364,1.001],
    ["Donphan","UUBL","OU","gen3ou",60,1.55705,727,1.557,529,1.455],
    ["Dragonite","UUBL","OU","gen3ou",35,5.08021,2372,5.08,1815,4.992],
    ["Dusclops","UUBL","OU","gen3ou",40,4.24443,1982,4.244,1570,4.318],
    ["Entei","UUBL","OU","gen3ou",103,0.47547,222,0.475,161,0.443],
    ["Espeon","UUBL","OU","gen3ou",62,1.4778,690,1.478,539,1.482],
    ["Exeggutor","UUBL","OU","gen3ou",48,2.7864,1301,2.786,962,2.646],
    ["Gardevoir","UUBL","OU","gen3ou",43,3.30471,1543,3.304,1098,3.02],
    ["Hariyama","UUBL","OU","gen3ou",63,1.44996,677,1.45,552,1.518],
    ["Houndoom","UUBL","OU","gen3ou",37,4.92222,2300,4.925,1698,4.67],
    ["Jynx","UUBL","OU","gen3ou",83,0.7389,345,0.739,305,0.839],
    ["Kingdra","UUBL","OU","gen3ou",42,3.91938,1831,3.921,1418,3.9],
    ["Linoone","UUBL","OU","gen3ou",75,0.85191,398,0.852,286,0.787],
    ["Ludicolo","UUBL","OU","gen3ou",44,3.15693,1474,3.157,1174,3.229],
    ["Machamp","UUBL","OU","gen3ou",53,2.05821,961,2.058,711,1.955],
    ["Marowak","UUBL","OU","gen3ou",52,2.12889,994,2.129,711,1.955],
    ["Miltank","UUBL","OU","gen3ou",61,1.54419,721,1.544,514,1.414],
    ["Regirock","UUBL","OU","gen3ou",74,0.99163,463,0.992,364,1.001],
    ["Rhydon","UUBL","OU","gen3ou",58,1.60202,748,1.602,584,1.606],
    ["Sceptile","UUBL","OU","gen3ou",33,5.30887,2479,5.309,1946,5.352],
    ["Scizor","UUBL","OU","gen3ou",46,2.93204,1369,2.932,1030,2.833],
    ["Slaking","UUBL","OU","gen3ou",49,2.32858,1088,2.33,878,2.415],
    ["Slowbro","UUBL","OU","gen3ou",59,1.56347,730,1.563,568,1.562],
    ["Smeargle","UUBL","OU","gen3ou",55,1.77172,828,1.773,672,1.848],
    ["Steelix","UUBL","OU","gen3ou",50,2.26382,1057,2.264,896,2.464],
    ["Swellow","UUBL","OU","gen3ou",93,0.55685,260,0.557,179,0.492],
    ["Tauros","UUBL","OU","gen3ou",66,1.2829,599,1.283,466,1.282],
    ["Typhlosion","UUBL","OU","gen3ou",80,0.75603,353,0.756,280,0.77],
    ["Umbreon","UUBL","OU","gen3ou",23,8.00154,3737,8.003,3282,9.026],
    ["Ursaring","UUBL","OU","gen3ou",99,0.50331,235,0.503,163,0.448],
    ["Vaporeon","UUBL","OU","gen3ou",27,6.14894,2871,6.148,2230,6.133],
    ["Venusaur","UUBL","OU","gen3ou",25,6.64255,3103,6.645,2569,7.065],
    ["Weezing","UUBL","OU","gen3ou",36,4.97476,2323,4.975,1837,5.052],
    ["Zangoose","UUBL","OU","gen3ou",82,0.75175,351,0.752,269,0.74],
    ["Altaria","UU","UU","gen3ou",109,0.40643,190,0.407,143,0.393],
    ["Ampharos","UU","UU","gen3ou",104,0.46047,215,0.46,173,0.476],
    ["Arcanine","UU","UU","gen3ou",34,5.30572,2478,5.307,1898,5.22],
    ["Blastoise","UU","UU","gen3ou",54,1.77979,831,1.78,651,1.79],
    ["Cradily","UU","UU","gen3ou",70,1.0623,496,1.062,325,0.894],
    ["Electabuzz","UU","UU","gen3ou",85,0.6875,321,0.687,241,0.663],
    ["Electrode","UU","UU","gen3ou",77,0.79459,371,0.795,352,0.968],
    ["Feraligatr","UU","UU","gen3ou",132,0.20775,97,0.208,75,0.206],
    ["Girafarig","UU","UU","gen3ou",193,0.02998,14,0.03,12,0.033],
    ["Gligar","UU","UU","gen3ou",100,0.4926,230,0.493,169,0.465],
    ["Golduck","UU","UU","gen3ou",140,0.15849,74,0.158,55,0.151],
    ["Golem","UU","UU","gen3ou",101,0.4824,226,0.484,177,0.487],
    ["Gorebyss","UU","UU","gen3ou",138,0.1692,79,0.169,53,0.146],
    ["Granbull","UU","UU","gen3ou",160,0.08353,39,0.084,32,0.088],
    ["Grumpig","UU","UU","gen3ou",139,0.16063,75,0.161,60,0.165],
    ["Hitmonlee","UU","UU","gen3ou",102,0.47547,222,0.475,161,0.443],
    ["Hitmontop","UU","UU","gen3ou",106,0.44334,207,0.443,166,0.457],
    ["Kangaskhan","UU","UU","gen3ou",86,0.67465,315,0.675,233,0.641],
    ["Lanturn","UU","UU","gen3ou",84,0.6875,321,0.687,266,0.732],
    ["Lapras","UU","UU","gen3ou",51,2.24669,1049,2.246,803,2.208],
    ["Lunatone","UU","UU","gen3ou",147,0.11351,53,0.114,41,0.113],
    ["Misdreavus","UU","UU","gen3ou",92,0.57827,270,0.578,227,0.624],
    ["Muk","UU","UU","gen3ou",122,0.25273,118,0.253,91,0.25],
    ["Nidoking","UU","UU","gen3ou",71,1.0361,484,1.036,323,0.888],
    ["Nidoqueen","UU","UU","gen3ou",129,0.21417,100,0.214,79,0.217],
    ["Omastar","UU","UU","gen3ou",89,0.65323,305,0.653,231,0.635],
    ["Pinsir","UU","UU","gen3ou",154,0.08781,41,0.088,29,0.08],
    ["Quagsire","UU","UU","gen3ou",123,0.25058,117,0.251,99,0.272],
    ["Qwilfish","UU","UU","gen3ou",125,0.23345,109,0.233,100,0.275],
    ["Sandslash","UU","UU","gen3ou",115,0.34268,160,0.343,113,0.311],
    ["Slowking","UU","UU","gen3ou",110,0.39836,186,0.398,147,0.404],
    ["Solrock","UU","UU","gen3ou",105,0.44334,207,0.443,150,0.413],
    ["Tentacruel","UU","UU","gen3ou",78,0.76246,356,0.762,284,0.781],
    ["Vileplume","UU","UU","gen3ou",108,0.41336,193,0.413,136,0.374],
    ["Walrein","UU","UU","gen3ou",95,0.53758,251,0.538,186,0.512],
    ["Fearow","RUBL","UU","gen3ou",152,0.09209,43,0.092,35,0.096],
    ["Jumpluff","RUBL","UU","gen3ou",127,0.2206,103,0.221,79,0.217],
    ["Manectric","RUBL","UU","gen3ou",88,0.65537,306,0.655,231,0.635],
    ["Ninjask","RUBL","UU","gen3ou",32,5.72752,2675,5.729,2383,6.554],
    ["Absol","RU","RU","gen3ou",94,0.53972,252,0.54,191,0.525],
    ["Aggron","RU","RU","gen3ou",65,1.33002,621,1.33,435,1.196],
    ["Azumarill","RU","RU","gen3ou",126,0.2206,103,0.221,80,0.22],
    ["Banette","RU","RU","gen3ou",119,0.30199,141,0.302,106,0.292],
    ["Camerupt","RU","RU","gen3ou",90,0.6361,297,0.636,244,0.671],
    ["Clefable","RU","RU","gen3ou",120,0.28057,131,0.281,93,0.256],
    ["Exploud","RU","RU","gen3ou",124,0.24416,114,0.244,60,0.165],
    ["Hypno","RU","RU","gen3ou",91,0.61783,290,0.621,198,0.545],
    ["Kabutops","RU","RU","gen3ou",114,0.34961,164,0.351,108,0.297],
    ["Magmar","RU","RU","gen3ou",135,0.19704,92,0.197,63,0.173],
    ["Mantine","RU","RU","gen3ou",133,0.20347,95,0.203,74,0.204],
    ["Meganium","RU","RU","gen3ou",118,0.31055,145,0.311,120,0.33],
    ["Mr. Mime","RU","RU","gen3ou",57,1.6727,781,1.673,580,1.595],
    ["Ninetales","RU","RU","gen3ou",68,1.22079,570,1.221,473,1.301],
    ["Persian","RU","RU","gen3ou",149,0.09638,45,0.096,35,0.096],
    ["Politoed","RU","RU","gen3ou",153,0.09209,43,0.092,30,0.083],
    ["Poliwrath","RU","RU","gen3ou",73,1.01947,476,1.019,354,0.974],
    ["Primeape","RU","RU","gen3ou",112,0.35125,164,0.351,127,0.349],
    ["Raichu","RU","RU","gen3ou",79,0.75818,354,0.758,260,0.715],
    ["Rapidash","RU","RU","gen3ou",130,0.21203,99,0.212,80,0.22],
    ["Sharpedo","RU","RU","gen3ou",121,0.25273,118,0.253,86,0.237],
    ["Shiftry","RU","RU","gen3ou",128,0.21632,101,0.216,83,0.228],
    ["Sneasel","RU","RU","gen3ou",157,0.08781,41,0.088,25,0.069],
    ["Stantler","RU","RU","gen3ou",162,0.07924,37,0.079,32,0.088],
    ["Victreebel","RU","RU","gen3ou",145,0.12208,57,0.122,41,0.113],
    ["Xatu","RU","RU","gen3ou",180,0.04498,21,0.045,15,0.041],
    ["Glalie","NUBL","RU","gen3ou",97,0.52901,247,0.529,203,0.558],
    ["Bellossom","NU","NU","gen3ou",183,0.03855,18,0.039,15,0.041],
    ["Cacturne","NU","NU","gen3ou",56,1.68555,787,1.685,573,1.576],
    ["Chimecho","NU","NU","gen3ou",170,0.05783,27,0.058,10,0.028],
    ["Crawdaunt","NU","NU","gen3ou",155,0.08781,41,0.088,32,0.088],
    ["Dewgong","NU","NU","gen3ou",151,0.09424,44,0.094,35,0.096],
    ["Flareon","NU","NU","gen3ou",98,0.50545,236,0.505,154,0.424],
    ["Hitmonchan","NU","NU","gen3ou",142,0.14564,68,0.146,53,0.146],
    ["Huntail","NU","NU","gen3ou",226,0.01285,6,0.013,5,0.014],
    ["Kecleon","NU","NU","gen3ou",146,0.1178,55,0.118,45,0.124],
    ["Murkrow","NU","NU","gen3ou",197,0.02784,13,0.028,11,0.03],
    ["Octillery","NU","NU","gen3ou",131,0.21203,99,0.212,75,0.206],
    ["Pelipper","NU","NU","gen3ou",181,0.04069,19,0.041,14,0.039],
    ["Pidgeot","NU","NU","gen3ou",117,0.3234,151,0.323,110,0.303],
    ["Plusle","NU","NU","gen3ou",null,null,null,null,null,null],
    ["Raticate","NU","NU","gen3ou",196,0.02784,13,0.028,8,0.022],
    ["Relicanth","NU","NU","gen3ou",161,0.08139,38,0.081,34,0.094],
    ["Roselia","NU","NU","gen3ou",167,0.06425,30,0.064,19,0.052],
    ["Sableye","NU","NU","gen3ou",111,0.37909,177,0.379,139,0.382],
    ["Sudowoodo","NU","NU","gen3ou",158,0.08781,41,0.088,27,0.074],
    ["Torkoal","NU","NU","gen3ou",136,0.19276,90,0.193,70,0.193],
    ["Venomoth","NU","NU","gen3ou",208,0.01713,8,0.017,5,0.014],
    ["Wailord","NU","NU","gen3ou",116,0.3234,151,0.323,125,0.344],
    ["Whiscash","NU","NU","gen3ou",143,0.13065,61,0.131,53,0.146],
    ["Dunsparce","PUBL","NU","gen3ou",171,0.05354,25,0.054,13,0.036],
    ["Piloswine","PUBL","NU","gen3ou",174,0.04926,23,0.049,20,0.055],
    ["Arbok","PU","PU","gen3ou",194,0.02998,14,0.03,8,0.022],
    ["Furret","PU","PU","gen3ou",150,0.09638,45,0.096,45,0.124],
    ["Kingler","PU","PU","gen3ou",144,0.13065,61,0.131,47,0.129],
    ["Lickitung","PU","PU","gen3ou",258,0.00428,2,0.004,1,0.003],
    ["Mawile","PU","PU","gen3ou",96,0.52901,247,0.529,194,0.534],
    ["Mightyena","PU","PU","gen3ou",137,0.1692,79,0.169,59,0.162],
    ["Minun","PU","PU","gen3ou",237,0.00857,4,0.009,2,0.006],
    ["Seviper","PU","PU","gen3ou",163,0.07496,35,0.075,31,0.085],
    ["Shuckle","PU","PU","gen3ou",107,0.4155,194,0.415,162,0.446],
    ["Swalot","PU","PU","gen3ou",148,0.1028,48,0.103,33,0.091],
    ["Tangela","PU","PU","gen3ou",195,0.02784,13,0.028,10,0.028],
    ["Togetic","PU","PU","gen3ou",178,0.04498,21,0.045,15,0.041],
    ["Wigglytuff","PU","PU","gen3ou",176,0.04712,22,0.047,17,0.047],
    ["Aipom","ZU","ZU","gen3ou",188,0.03641,17,0.036,9,0.025],
    ["Ariados","ZU","ZU","gen3ou",225,0.01285,6,0.013,4,0.011],
    ["Beautifly","ZU","ZU","gen3ou",189,0.03641,17,0.036,14,0.039],
    ["Beedrill","ZU","ZU","gen3ou",168,0.06425,30,0.064,24,0.066],
    ["Butterfree","ZU","ZU","gen3ou",159,0.08567,40,0.086,38,0.105],
    ["Castform","ZU","ZU","gen3ou",202,0.02142,10,0.021,9,0.025],
    ["Corsola","ZU","ZU","gen3ou",235,0.00857,4,0.009,3,0.008],
    ["Delcatty","ZU","ZU","gen3ou",185,0.03641,17,0.036,15,0.041],
    ["Delibird","ZU","ZU","gen3ou",265,0.00428,2,0.004,2,0.006],
    ["Ditto","ZU","ZU","gen3ou",165,0.06854,32,0.069,27,0.074],
    ["Dustox","ZU","ZU","gen3ou",230,0.01071,5,0.011,4,0.011],
    ["Farfetch’d","ZU","ZU","gen3ou",200,0.02142,10,0.021,5,0.014],
    ["Illumise","ZU","ZU","gen3ou",249,0.00643,3,0.006,3,0.008],
    ["Ledian","ZU","ZU","gen3ou",207,0.01713,8,0.017,6,0.017],
    ["Luvdisc","ZU","ZU","gen3ou",280,0.00214,1,0.002,1,0.003],
    ["Magcargo","ZU","ZU","gen3ou",173,0.0514,24,0.051,16,0.044],
    ["Masquerain","ZU","ZU","gen3ou",229,0.01071,5,0.011,2,0.006],
    ["Noctowl","ZU","ZU","gen3ou",201,0.02142,10,0.021,10,0.028],
    ["Nosepass","ZU","ZU","gen3ou",209,0.01713,8,0.017,6,0.017],
    ["Parasect","ZU","ZU","gen3ou",169,0.06211,29,0.062,24,0.066],
    ["Seaking","ZU","ZU","gen3ou",250,0.00643,3,0.006,3,0.008],
    ["Shedinja","ZU","ZU","gen3ou",113,0.35125,164,0.351,117,0.322],
    ["Spinda","ZU","ZU","gen3ou",284,0.00214,1,0.002,1,0.003],
    ["Sunflora","ZU","ZU","gen3ou",212,0.01713,8,0.017,5,0.014],
    ["Tropius","ZU","ZU","gen3ou",141,0.14564,68,0.146,43,0.118],
    ["Unown","ZU","ZU","gen3ou",null,null,null,null,null,null],
    ["Volbeat","ZU","ZU","gen3ou",177,0.04498,21,0.045,19,0.052],
    ["Yanma","ZU","ZU","gen3ou",156,0.08781,41,0.088,36,0.099],
];

const GEN3_POKEMON = GEN3_ROWS.map(function (row) {
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
        id: makeGen3Id(name),
        name: name,
        generation: 3,
        format: "gen3",
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
