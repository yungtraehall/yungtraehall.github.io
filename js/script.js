/*
    =========================================
    GENERATOR SETTINGS
    =========================================
*/


/*
    Tiers are ordered from weakest to strongest.

    This is used for the Maximum Tier ceiling.
*/

const tierOrder = [
    "ZU",
    "PU",
    "NU",
    "RU",
    "UU",
    "OU",
    "Uber"
];


/*
    TIER ODDS PROFILES

    Each profile totals 100% when all tiers through Uber are present.
    These percentages apply to individual team slots.

    A lower Maximum Tier removes stronger tiers and rebalances the rest.
    Structurally absent tiers fold into the nearest available tier, as before.
    ++ targets 7% Uber, 37.9% OU, and only 3% combined PU/ZU.
*/

const tierOddsProfiles = {
    "--": { ZU: 18, PU: 20, NU: 22, RU: 20, UU: 12.5, OU: 6.5, Uber: 1 },
    "-":  { ZU: 12, PU: 16, NU: 20, RU: 21, UU: 18.75, OU: 10.75, Uber: 1.5 },
    "=":  { ZU: 6, PU: 10, NU: 16, RU: 22, UU: 22, OU: 21.5, Uber: 2.5 },
    "+":  { ZU: 3, PU: 6, NU: 12, RU: 21, UU: 23.5, OU: 30, Uber: 4.5 },
    "++": { ZU: 1, PU: 2, NU: 9, RU: 18, UU: 25.1, OU: 37.9, Uber: 7 }
};


/*
    Individual Pokémon modifiers.

    For OU and Uber, a Pokémon with very high usage within its tier
    can be as low as 0.85x.

    A Pokémon with very low usage within its tier
    can be as high as 1.15x.

    Missing usage data stays neutral at 1.00x.
    UU and lower always have equal within-tier weights.
*/

const MIN_USAGE_MODIFIER = 0.85;
const MAX_USAGE_MODIFIER = 1.15;


/*
    =========================================
    DATASETS
    =========================================
*/

const datasets = {
    gen1: GEN1_POKEMON,
    gen2: GEN2_POKEMON,
    gen3: GEN3_POKEMON,
    gen4: GEN4_POKEMON,
    gen5: GEN5_POKEMON,
    gen6: GEN6_POKEMON,
    gen7: GEN7_POKEMON,
    gen8: GEN8_POKEMON,
    gen9: GEN9_POKEMON,
    championsou: CHAMPIONS_OU_POKEMON,
    nationaldex: NATIONAL_DEX_POKEMON,
    bananza: BANANZA_POKEMON
};


/*
    =========================================
    PAGE ELEMENTS
    =========================================
*/

const generateButton =
    document.getElementById("generate-button");

const poolSelect =
    document.getElementById("pool-select");

const tierSelect =
    document.getElementById("tier-select");

const maximumTierSetting = document.getElementById("maximum-tier-setting");
const revealPullChance = document.getElementById("reveal-pull-chance");

const oddsSelect =
    document.getElementById("odds-select");

const pokemonCards =
    document.querySelectorAll(".pokemon-card");

const revealOverlay =
    document.getElementById("reveal-overlay");

const revealTierName =
    document.getElementById("reveal-tier-name");

const revealPreviewSprite =
    document.getElementById("reveal-preview-sprite");

const revealPokemonName =
    document.getElementById("reveal-pokemon-name");

const revealContinueButton =
    document.getElementById("reveal-continue-button");


/*
    Colors used by the dramatic reveal.

    These intentionally match the tier badges.
*/

const revealTierColors = {
    "ZU": "#666666",
    "PU": "#2471a3",
    "NU": "#2e8b57",
    "RU": "#b7950b",
    "UU": "#ED9121",
    "OU": "#c0392b",
    "Uber": "#7d3c98"
};


let revealInProgress = false;
let audioContext = null;
let revealExplosionBufferPromise = null;
let revealExplosionMedia = null;
// Verified against Showdown's MP3 directory. Forms without distinct recordings
// deliberately share their species cry (e.g. Arceus types and Ogerpon masks).
const pokemonCryNames = {
    "aegislash": "aegislash",
    "alakazammega": "alakazam-mega",
    "annihilape": "annihilape",
    "arceus": "arceus",
    "arceusbug": "arceus",
    "arceusdark": "arceus",
    "arceusdragon": "arceus",
    "arceuselectric": "arceus",
    "arceusfairy": "arceus",
    "arceusfighting": "arceus",
    "arceusfire": "arceus",
    "arceusflying": "arceus",
    "arceusghost": "arceus",
    "arceusgrass": "arceus",
    "arceusground": "arceus",
    "arceusice": "arceus",
    "arceuspoison": "arceus",
    "arceuspsychic": "arceus",
    "arceusrock": "arceus",
    "arceussteel": "arceus",
    "arceuswater": "arceus",
    "archaludon": "archaludon",
    "baxcalibur": "baxcalibur",
    "baxcaliburmega": "baxcalibur-mega",
    "blastoisemega": "blastoise-mega",
    "blaziken": "blaziken",
    "blazikenmega": "blaziken-mega",
    "calyrexice": "calyrex-ice",
    "calyrexshadow": "calyrex-shadow",
    "celebi": "celebi",
    "chienpao": "chienpao",
    "chiyu": "chiyu",
    "cinderace": "cinderace",
    "cloyster": "cloyster",
    "darkrai": "darkrai",
    "darmanitangalar": "darmanitan",
    "darmanitangalarzen": "darmanitan",
    "deoxys": "deoxys",
    "deoxysattack": "deoxys",
    "deoxysdefense": "deoxys",
    "deoxysspeed": "deoxys",
    "dialga": "dialga",
    "dialgaorigin": "dialga",
    "dracovish": "dracovish",
    "dragapult": "dragapult",
    "espathra": "espathra",
    "eternatus": "eternatus",
    "fluttermane": "fluttermane",
    "garchomp": "garchomp",
    "genesect": "genesect",
    "genesectburn": "genesect",
    "genesectchill": "genesect",
    "genesectdouse": "genesect",
    "genesectshock": "genesect",
    "gengarmega": "gengar-mega",
    "gholdengo": "gholdengo",
    "giratina": "giratina",
    "giratinaorigin": "giratina",
    "gougingfire": "gougingfire",
    "greninja": "greninja",
    "groudon": "groudon",
    "groudonprimal": "groudon-primal",
    "hooh": "hooh",
    "hoopaunbound": "hoopa-unbound",
    "ironbundle": "ironbundle",
    "kangaskhanmega": "kangaskhan-mega",
    "kingambit": "kingambit",
    "koraidon": "koraidon",
    "kyogre": "kyogre",
    "kyogreprimal": "kyogre-primal",
    "kyurem": "kyurem",
    "kyuremblack": "kyurem-black",
    "kyuremwhite": "kyurem-white",
    "landorus": "landorus",
    "latias": "latias",
    "latios": "latios",
    "lucariomega": "lucario-mega",
    "lucariomegaz": "lucario-megaz",
    "lugia": "lugia",
    "lunala": "lunala",
    "machamp": "machamp",
    "magearna": "magearna",
    "magearnaoriginal": "magearna",
    "manaphy": "manaphy",
    "marshadow": "marshadow",
    "mawilemega": "mawile-mega",
    "metagrossmega": "metagross-mega",
    "mew": "mew",
    "mewtwo": "mewtwo",
    "mewtwomegax": "mewtwo-megax",
    "mewtwomegay": "mewtwo-megay",
    "miraidon": "miraidon",
    "naganadel": "naganadel",
    "necrozmadawnwings": "necrozma-dawnwings",
    "necrozmaduskmane": "necrozma-duskmane",
    "necrozmaultra": "necrozma-ultra",
    "ogerponhearthflame": "ogerpon",
    "ogerponwellspring": "ogerpon",
    "palafin": "palafin",
    "palafinhero": "palafin-hero",
    "palkia": "palkia",
    "palkiaorigin": "palkia",
    "pheromosa": "pheromosa",
    "raichumegay": "raichu-megay",
    "rayquaza": "rayquaza",
    "rayquazamega": "rayquaza-mega",
    "reshiram": "reshiram",
    "roaringmoon": "roaringmoon",
    "sableyemega": "sableye-mega",
    "salamence": "salamence",
    "salamencemega": "salamence-mega",
    "shayminsky": "shaymin-sky",
    "sneasler": "sneasler",
    "solgaleo": "solgaleo",
    "spectrier": "spectrier",
    "starmiemega": "starmie-mega",
    "terapagos": "terapagos",
    "terapagosstellar": "terapagos",
    "terapagosterastal": "terapagos",
    "thundurus": "thundurus",
    "tornadustherian": "tornadus-therian",
    "ursalunabloodmoon": "ursaluna",
    "urshifu": "urshifu",
    "urshifurapidstrike": "urshifu-rapidstrike",
    "volcarona": "volcarona",
    "walkingwake": "walkingwake",
    "wobbuffet": "wobbuffet",
    "xerneas": "xerneas",
    "yveltal": "yveltal",
    "zacian": "zacian",
    "zaciancrowned": "zacian-crowned",
    "zamazenta": "zamazenta",
    "zamazentacrowned": "zamazenta-crowned",
    "zekrom": "zekrom",
    "zygarde": "zygarde",
    "zygardecomplete": "zygarde-complete"
};
const revealCryBuffers = new Map();
const revealCryMedia = new Map();
const revealCryGain = 0.55 * Math.pow(10, -11 / 20);
const revealCryWetGain = 0.10 * Math.pow(10, -11 / 20);
const revealExplosionGain = 0.55 * Math.pow(10, 1 / 20);
let revealReverbBuffer = null;
const activeRevealAudios = new Set();
let revealAudioToken = 0;
const typePoolSelect = document.getElementById("type-pool-select");
const typePoolSetting = document.getElementById("type-pool-setting");
const typePoolNote = document.getElementById("type-pool-note");


/*
    Before the generator starts, calculate the
    usage modifier for every Pokémon.

    This happens once when the page loads.
*/

Object.values(datasets).forEach(function (dataset) {
    assignUsageModifiers(dataset);
});


generateButton.addEventListener("click", generatePokemon);

poolSelect.addEventListener(
    "change",
    updateTierAvailability
);

typePoolSelect.addEventListener("change", updateTierAvailability);
updateTierAvailability();


/*
    Some historical generations do not have enough
    Pokémon in every low-tier ceiling to build a
    six-Pokémon team.

    Disable any Maximum Tier option that would leave
    fewer than six distinct eligible Pokémon. If the
    user switches pools while one of those options is
    selected, move to the nearest stronger valid ceiling.
*/

function getActivePokemonPool(poolName, selectedType = "All") {
    const pool = datasets[poolName] || [];
    if (poolName !== "bananza" || selectedType === "All") return pool;
    return pool.filter(pokemon => POKEMON_DETAILS_DATA[pokemon.id]?.modern.types.includes(selectedType));
}

function updateTierAvailability() {

    const isBananza = poolSelect.value === "bananza";
    typePoolSetting.hidden = !isBananza;
    const selectedType = isBananza ? (typePoolSelect.value || "All") : "All";
    const pokemonPool = getActivePokemonPool(poolSelect.value, selectedType);
    typePoolNote.textContent = pokemonPool.length + " Pokémon available. Dual-type Pokémon match either type.";
    if (!revealInProgress) generateButton.disabled = pokemonPool.length < 6;

    // Champions OU is an OU-only pool, even if Uber was selected before.
    const hasTierCeiling = poolSelect.value !== "bananza";
    maximumTierSetting.hidden = !hasTierCeiling;
    const maximumPosition = poolSelect.value === "bananza"
        ? tierOrder.length - 1
        : poolSelect.value === "championsou"
            ? tierOrder.indexOf(CHAMPIONS_OU_DATASET_META.maximumTier)
            : tierOrder.length - 1;
    if (!hasTierCeiling) tierSelect.value = "Uber";

    const selectedPosition = Math.min(
        tierOrder.indexOf(tierSelect.value),
        maximumPosition
    );

    for (const option of tierSelect.options) {

        const optionPosition =
            tierOrder.indexOf(
                option.value
            );

        const eligibleCount =
            pokemonPool.filter(function (pokemon) {

                const pokemonPosition =
                    tierOrder.indexOf(
                        pokemon.tier
                    );

                return (
                    pokemonPosition <=
                    optionPosition
                );

            }).length;

        option.disabled =
            eligibleCount < 6 || optionPosition > maximumPosition;

    }

    if (!tierSelect.selectedOptions[0].disabled) {
        return;
    }

    for (
        let position = Math.max(selectedPosition, 0);
        position <= maximumPosition;
        position++
    ) {

        const replacementTier =
            tierOrder[position];

        const replacementOption =
            Array.from(
                tierSelect.options
            ).find(function (option) {
                return (
                    option.value ===
                    replacementTier
                );
            });

        if (
            replacementOption &&
            !replacementOption.disabled
        ) {
            tierSelect.value =
                replacementTier;

            return;
        }

    }

}


/*
    =========================================
    MAIN BUTTON FUNCTION
    =========================================
*/

async function generatePokemon() {

    /*
        Do not allow a second roll to start while
        the current reveal animation is playing.
    */

    if (revealInProgress) {
        return;
    }

    revealInProgress = true;
    generateButton.disabled = true;
    generateButton.textContent = "Opening...";


    const selectedPool =
        poolSelect.value;

    const selectedType = selectedPool === "bananza" ? (typePoolSelect.value || "All") : "All";
    const pokemonPool = getActivePokemonPool(selectedPool, selectedType);

    const selectedTier = selectedPool === "bananza" ? "Uber" : tierSelect.value;

    const selectedOdds =
        oddsSelect.value;


    /*
        Generate the six Pokémon immediately.

        The animation does NOT affect the odds.
        It only hides the already-generated result.
    */

    const generatedPokemon =
        generateTeam(
            pokemonPool,
            selectedTier,
            selectedOdds
        );


    /*
        Find the strongest tier in the six.

        That tier decides the reveal color.
    */

    generatedPokemon.forEach(pokemon => { pokemon.selectedPool = selectedPool; pokemon.selectedType = selectedType; });

    const highestTier =
        getHighestTier(generatedPokemon);

    const previewPokemon =
        getPreviewPokemon(generatedPokemon);

    const previewIndex =
        generatedPokemon.findIndex(function (pokemon) {
            return pokemon.id === previewPokemon.id;
        });


    /*
        Build the result cards behind the overlay
        so the sprites can begin loading early.
    */

    renderTeam(generatedPokemon);


    try {

        await playRevealSequence(
            highestTier,
            previewPokemon
        );

        revealPokemonCards(previewIndex);

    } finally {

        revealInProgress = false;
        generateButton.disabled = false;
        generateButton.textContent = "Generate Pokémon";
        updateTierAvailability();

    }

}


/*
    =========================================
    RESULT DISPLAY
    =========================================
*/

function getRarityDetails(pokemon) {
    // Show the actual chance at this draw, rather than an OU+ comparison.
    const probability = pokemon.pullProbability;
    if (!Number.isFinite(probability) || probability <= 0 || probability > 1) return null;
    let label, className;
    if (probability < 0.0001) {
        label = "Ultra Rare"; className = "rarity-ultra-rare";
    } else if (probability < 0.001) {
        label = "Very Rare"; className = "rarity-very-rare";
    } else if (probability < 0.01) {
        label = "Rare"; className = "rarity-rare";
    } else {
        label = "Common"; className = "rarity-common";
    }
    // Prefer two decimals, retaining precision for tiny chances and whenever
    // rounding would put the displayed number into a different rarity level.
    const percentage = probability * 100;
    let decimals = percentage < 0.01
        ? Math.max(2, 1 - Math.floor(Math.log10(percentage))) : 2;
    const upperBound = label === "Ultra Rare" ? 0.01
        : (label === "Very Rare" ? 0.1 : (label === "Rare" ? 1 : Infinity));
    while (decimals < 100 && Number(percentage.toFixed(decimals)) >= upperBound) decimals++;
    const chanceText = (decimals > 100
        ? percentage.toExponential(1) : percentage.toFixed(decimals)) + "% Chance";
    return { probability, label, className, chanceText,
        displayText: label + " · " + chanceText };

}

function renderTeam(generatedPokemon) {

    for (let i = 0; i < pokemonCards.length; i++) {

        const pokemon =
            generatedPokemon[i];

        const tierLabel = pokemon.sourceTier === "AG" ? "AG" : pokemon.tier;
        const tierClass = "tier-" + tierLabel.toLowerCase();
        const rarity = getRarityDetails(pokemon);
        const special = getSpecialPresentation(pokemon);
        pokemonCards[i].classList.remove("special-ou", "special-uber", "special-ag");
        if (special) pokemonCards[i].classList.add(special.className);


        /*
            Start every new card hidden.

            After the color reveal finishes, the six
            cards are shown one after another.
        */

        pokemonCards[i].classList.remove("card-reveal");
        pokemonCards[i].classList.add("card-hidden");


        pokemonCards[i].innerHTML = `
            <div class="pokemon-sprite-container">
                <img
                    class="pokemon-sprite"
                    alt="${pokemon.name}"
                >
            </div>

            <div class="pokemon-name">
                ${pokemon.name}
            </div>

            <div class="pokemon-tier ${tierClass}">
                ${tierLabel}
            </div>
            ${getRarityCategory(pokemon).label !== "Standard" ? `<div class="pokemon-category">${getRarityCategory(pokemon).label}</div>` : ""}
            <button class="pokemon-details-button" type="button" aria-label="Details for ${pokemon.name}">Details</button>
            ${rarity ? `<div class="pokemon-pull-rarity ${rarity.className}" title="Chance of this exact Pokémon in its draw slot, using this team's pool, type filter, maximum tier and Odds setting. Earlier picks are excluded. This is not the chance of finding it anywhere in a six-Pokémon team.">${rarity.displayText}</div>` : ""}
        `;

        pokemonCards[i].querySelector(".pokemon-details-button").addEventListener("click", () => openPokemonDetails(pokemon));

        const spriteImage =
            pokemonCards[i].querySelector(
                ".pokemon-sprite"
            );

        setPokemonSpriteWithFallback(
            spriteImage,
            pokemon.name,
            pokemon.generation
        );

    }

}


function revealPokemonCards(previewIndex) {

    /*
        The featured Pokémon was already shown on the
        reveal screen, so show its card immediately.
    */

    const featuredCard =
        pokemonCards[previewIndex];

    featuredCard.classList.remove("card-hidden");
    featuredCard.classList.add("card-reveal");


    /*
        Then reveal only the remaining five Pokémon
        with a short stagger.
    */

    let remainingIndex = 0;

    pokemonCards.forEach(function (card, index) {

        if (index === previewIndex) {
            return;
        }

        remainingIndex++;

        setTimeout(function () {

            card.classList.remove("card-hidden");
            card.classList.add("card-reveal");

        }, remainingIndex * 110);

    });

}


/*
    =========================================
    DRAMATIC REVEAL
    =========================================
*/

function getHighestTier(team) {

    return team.reduce(function (highestTier, pokemon) {

        const currentPosition =
            tierOrder.indexOf(pokemon.tier);

        const highestPosition =
            tierOrder.indexOf(highestTier);

        if (currentPosition > highestPosition) {
            return pokemon.tier;
        }

        return highestTier;

    }, "ZU");

}


/*
    Prefer a curated Pokémon within the strongest tier,
    otherwise show the first Pokémon from that tier.

    This choice is deterministic and does not
    perform another random roll.
*/

function getPreviewPokemon(team) {

    const highestTier =
        getHighestTier(team);

    const strongest = team.filter(pokemon => pokemon.tier === highestTier);
    return strongest.find(pokemon => getSpecialPresentation(pokemon)) || strongest[0];

}


function sleep(milliseconds) {

    return new Promise(function (resolve) {
        setTimeout(resolve, milliseconds);
    });

}


function waitForContinue() {

    return new Promise(function (resolve) {

        revealContinueButton.addEventListener(
            "click",
            resolve,
            { once: true }
        );

    });

}


function prepareAudio() {

    /*
        Audio must begin from a user click in modern browsers.
        Creating/resuming the AudioContext here keeps it inside
        the Generate button interaction.
    */

    const AudioContextClass =
        window.AudioContext ||
        window.webkitAudioContext;

    if (!AudioContextClass) {
        return;
    }

    if (!audioContext) {
        audioContext = new AudioContextClass();
    }

    if (audioContext.state === "suspended") {
        audioContext.resume().catch(() => {});
    }

}


function playRevealTone(frequency) {

    if (!audioContext) {
        return;
    }

    const now =
        audioContext.currentTime;

    const oscillator =
        audioContext.createOscillator();

    const harmonic =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(
        frequency,
        now
    );

    harmonic.type = "triangle";
    harmonic.frequency.setValueAtTime(
        frequency * 2,
        now
    );


    /*
        Quick attack, then a short decay.
        The volume is deliberately modest.
    */

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(
        0.12,
        now + 0.025
    );
    gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + 0.28
    );


    oscillator.connect(gain);
    harmonic.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start(now);
    harmonic.start(now);

    oscillator.stop(now + 0.30);
    harmonic.stop(now + 0.30);

}


function shouldPlayRevealAudio(pokemon) {
    return pokemon.tier === "Uber" || pokemon.sourceTier === "AG" ||
        getSpecialPresentation(pokemon)?.className === "special-ou";
}

function getRevealAudioPath(pokemon) {
    if (!shouldPlayRevealAudio(pokemon)) return null;
    const name = pokemonCryNames[pokemon.id];
    return name ? "https://play.pokemonshowdown.com/audio/cries/" + name + ".mp3" : null;
}

function loadRevealAudio(pokemon) {
    const url = getRevealAudioPath(pokemon);
    if (!audioContext || !url) return Promise.resolve(null);
    if (!revealCryBuffers.has(url)) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const promise = fetch(url, { signal: controller.signal })
            .then(response => { if (!response.ok) throw new Error("Cry unavailable"); return response.arrayBuffer(); })
            .then(buffer => audioContext.decodeAudioData(buffer))
            .catch(() => { revealCryBuffers.delete(url); return null; })
            .finally(() => clearTimeout(timeout));
        revealCryBuffers.set(url, promise);
    }
    return revealCryBuffers.get(url);
}

function preloadRevealCryMedia(pokemon) {
    const url = getRevealAudioPath(pokemon);
    if (!url || typeof Audio !== "function") return null;
    if (!revealCryMedia.has(url)) {
        // A plain media element can play Showdown's MP3 even when its response
        // cannot be read by fetch for Web Audio processing.
        const media = new Audio(url);
        media.preload = "auto";
        media.volume = revealCryGain;
        media.onerror = () => revealCryMedia.delete(url);
        media.load();
        revealCryMedia.set(url, media);
    }
    return revealCryMedia.get(url);
}

function pauseRevealCryMedia(media) {
    media.pause();
    try { media.currentTime = 0; } catch (_) { /* Metadata may not be loaded yet. */ }
}

async function playRevealMedia(media, token) {
    if (!media || token !== revealAudioToken) return false;
    let timeout;
    try {
        const started = await Promise.race([
            Promise.resolve(media.play()).then(() => true, () => false),
            new Promise(resolve => { timeout = setTimeout(() => resolve(false), 500); })
        ]);
        if (!started || token !== revealAudioToken) {
            pauseRevealCryMedia(media);
            return false;
        }
        const playback = { stop() { media.onended = null; pauseRevealCryMedia(media); activeRevealAudios.delete(playback); } };
        media.onended = () => activeRevealAudios.delete(playback);
        activeRevealAudios.add(playback);
        return true;
    } catch (_) {
        pauseRevealCryMedia(media);
        return false;
    } finally {
        clearTimeout(timeout);
    }
}

function playRevealCryMedia(pokemon, token) {
    return playRevealMedia(preloadRevealCryMedia(pokemon), token);
}

function preloadRevealExplosionMedia() {
    if (typeof Audio !== "function") return null;
    if (!revealExplosionMedia) {
        const media = new Audio("audio/rare-reveal.wav");
        media.preload = "auto";
        media.volume = revealExplosionGain;
        media.onerror = () => { if (revealExplosionMedia === media) revealExplosionMedia = null; };
        media.load();
        revealExplosionMedia = media;
    }
    return revealExplosionMedia;
}

function loadRevealExplosionAudio() {
    if (!audioContext) return Promise.resolve(null);
    if (!revealExplosionBufferPromise) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        revealExplosionBufferPromise = fetch("audio/rare-reveal.wav", { signal: controller.signal })
            .then(response => { if (!response.ok) throw new Error("Reveal sound unavailable"); return response.arrayBuffer(); })
            .then(buffer => audioContext.decodeAudioData(buffer))
            .catch(() => { revealExplosionBufferPromise = null; return null; })
            .finally(() => clearTimeout(timeout));
    }
    return revealExplosionBufferPromise;
}

function getRevealReverbBuffer() {
    if (revealReverbBuffer) return revealReverbBuffer;
    const length = Math.ceil(audioContext.sampleRate * 0.32);
    revealReverbBuffer = audioContext.createBuffer(2, length, audioContext.sampleRate);
    // A separate deterministic noise source leaves the generator's randomness alone.
    let seed = 7301;
    for (let channel = 0; channel < 2; channel++) {
        const samples = revealReverbBuffer.getChannelData(channel);
        for (let i = 0; i < length; i++) {
            seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
            samples[i] = (seed / 4294967296 * 2 - 1) * Math.pow(1 - i / length, 3);
        }
    }
    return revealReverbBuffer;
}

function stopRevealAudio() {
    revealAudioToken++;
    for (const playback of activeRevealAudios) playback.stop();
    activeRevealAudios.clear();
    for (const media of revealCryMedia.values()) {
        if (!media.paused) pauseRevealCryMedia(media);
    }
    if (revealExplosionMedia && !revealExplosionMedia.paused) pauseRevealCryMedia(revealExplosionMedia);
}

async function playRevealAudio(pokemon) {
    if (!shouldPlayRevealAudio(pokemon) || !audioContext) return false;
    const token = revealAudioToken;
    let timeout;
    const buffer = await Promise.race([
        loadRevealAudio(pokemon),
        new Promise(resolve => { timeout = setTimeout(() => resolve(null), 250); })
    ]);
    clearTimeout(timeout);
    if (token !== revealAudioToken || audioContext.state !== "running") return false;
    if (!buffer) return playRevealCryMedia(pokemon, token);
    const source = audioContext.createBufferSource();
    const dry = audioContext.createGain();
    const wet = audioContext.createGain();
    const reverb = audioContext.createConvolver();
    source.buffer = buffer;
    reverb.buffer = getRevealReverbBuffer();
    dry.gain.setValueAtTime(revealCryGain, audioContext.currentTime);
    wet.gain.setValueAtTime(revealCryWetGain, audioContext.currentTime);
    source.connect(dry);
    dry.connect(audioContext.destination);
    source.connect(reverb);
    reverb.connect(wet);
    wet.connect(audioContext.destination);
    let cleanupTimer, cleaned = false;
    const cleanup = () => {
        if (cleaned) return;
        cleaned = true;
        clearTimeout(cleanupTimer);
        source.disconnect(); dry.disconnect(); wet.disconnect(); reverb.disconnect();
        activeRevealAudios.delete(playback);
    };
    const playback = { stop() { source.onended = null; source.stop(); cleanup(); } };
    source.onended = () => { cleanupTimer = setTimeout(cleanup, 350); };
    activeRevealAudios.add(playback);
    source.start();
    return true;
}

// Preserve the original post-silhouette reveal cue as a second, separate effect.
async function playRevealExplosionAudio(pokemon) {
    if (!shouldPlayRevealAudio(pokemon) || !audioContext) return false;
    const token = revealAudioToken;
    if (await playRevealMedia(preloadRevealExplosionMedia(), token)) return true;
    if (token !== revealAudioToken) return false;
    let timeout;
    const buffer = await Promise.race([
        loadRevealExplosionAudio(),
        new Promise(resolve => { timeout = setTimeout(() => resolve(null), 250); })
    ]);
    clearTimeout(timeout);
    if (!buffer || token !== revealAudioToken || audioContext.state !== "running") return false;
    const source = audioContext.createBufferSource();
    const gain = audioContext.createGain();
    source.buffer = buffer;
    gain.gain.setValueAtTime(revealExplosionGain, audioContext.currentTime);
    source.connect(gain);
    gain.connect(audioContext.destination);
    let cleaned = false;
    const cleanup = () => {
        if (cleaned) return;
        cleaned = true;
        source.disconnect(); gain.disconnect();
        activeRevealAudios.delete(playback);
    };
    const playback = { stop() { source.onended = null; source.stop(); cleanup(); } };
    source.onended = cleanup;
    activeRevealAudios.add(playback);
    source.start();
    return true;
}

function pulseRevealStage(pulseNumber) {

    revealOverlay.classList.remove(
        "tone-pulse-1",
        "tone-pulse-2",
        "tone-pulse-3"
    );

    /*
        Force the browser to register the class removal
        so the same CSS animation can restart.
    */

    void revealOverlay.offsetWidth;

    revealOverlay.classList.add(
        "tone-pulse-" + pulseNumber
    );

}


async function playRevealSequence(
    highestTier,
    previewPokemon
) {

    const prefersReducedMotion =
        window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;


    /*
        Prepare the strongest Pokémon's animated
        Showdown sprite before the reveal begins.

        If its GIF fails, automatically fall back
        to the matching generation's PNG.
    */

    stopRevealAudio();
    revealPreviewSprite.alt =
        previewPokemon.name;

    revealPokemonName.textContent = previewPokemon.name;
    const previewRarity = getRarityDetails(previewPokemon);
    const special = getSpecialPresentation(previewPokemon);
    const revealColor = special ? special.color : revealTierColors[highestTier];
    revealOverlay.className = "reveal-overlay";
    if (special) revealOverlay.classList.add(special.className);
    document.getElementById("reveal-special-label").textContent = special ? special.label : "";
    const hasRareRevealEffect = shouldPlayRevealAudio(previewPokemon);
    // Curated OU gets a rift; every Uber (including AG) gets stardust.
    if (special?.className === "special-ou") revealOverlay.classList.add("rift-reveal");
    if (previewPokemon.tier === "Uber" || previewPokemon.sourceTier === "AG") {
        revealOverlay.classList.add("stardust-reveal");
    }
    const hologram = document.getElementById("reveal-hologram");
    const syncHologram = () => {
        if (hasRareRevealEffect && !prefersReducedMotion) hologram.src = revealPreviewSprite.src;
    };
    // Keep the shine on the same exact form and generation, including fallbacks.
    revealPreviewSprite.onload = syncHologram;
    const revealTypes = getRevealTypes(previewPokemon);
    const typeText = document.getElementById("reveal-type-text");
    typeText.textContent = hasRareRevealEffect ? revealTypes.join(" ◆ ") : "";
    revealOverlay.style.setProperty("--special-color", revealColor);
    revealOverlay.style.setProperty(
        "--special-neon",
        special?.className === "special-ag" ? "#ffd670" :
        special?.className === "special-ou" ? "#ff3971" :
            (special ? "#f073ff" : (highestTier === "Uber" ? "#d5a7ff" : "#ff8a78"))
    );
    revealOverlay.style.setProperty(
        "--special-text",
        special?.className === "special-ag" ? "#ffe7a6" :
        special?.className === "special-ou" ? "#ffd2de" :
            (special ? "#f9c7ff" : "#fff0fb")
    );
    const previewTierLabel = previewPokemon.sourceTier === "AG" ? "AG" : previewPokemon.tier;
    const usageDetails = getRevealUsageDetails(previewPokemon);
    const revealUsageRank = document.getElementById("reveal-usage-rank");
    const revealUsagePercentage = document.getElementById("reveal-usage-percentage");
    revealUsageRank.textContent = usageDetails.rankText;
    revealUsagePercentage.textContent = usageDetails.percentageText;
    document.getElementById("reveal-usage").setAttribute("title", usageDetails.description);
    revealTierName.textContent = previewTierLabel;
    revealPullChance.textContent = previewRarity ? previewRarity.displayText : "";
    revealPullChance.className = "reveal-pull-chance" + (previewRarity ? " " + previewRarity.className : "");
    revealPullChance.setAttribute("title", previewRarity
        ? "Chance of this exact Pokémon in its draw slot, using this team's pool and settings, after excluding earlier picks."
        : "");
    if (previewRarity?.className === "rarity-ultra-rare") {
        revealOverlay.classList.add("rarity-ultra-rare");
    }

    setPokemonSpriteWithFallback(
        revealPreviewSprite,
        previewPokemon.name,
        previewPokemon.generation
    );
    syncHologram();


    /*
        Reduced-motion users get a short color cue
        without the full buildup.
    */

    if (prefersReducedMotion) {

        revealOverlay.style.setProperty(
            "--reveal-color",
            revealColor
        );

        revealTierName.textContent =
            previewTierLabel;

        if (hasRareRevealEffect) revealOverlay.classList.add("rare-reveal");
        revealOverlay.classList.add(
            "active",
            "rarity-revealed",
            "pokemon-revealed",
            "awaiting-continue"
        );

        revealOverlay.setAttribute(
            "aria-hidden",
            "false"
        );

        await waitForContinue();

        revealOverlay.classList.remove(
            "active",
            "rarity-revealed",
            "pokemon-revealed",
            "awaiting-continue"
        );

        revealOverlay.setAttribute(
            "aria-hidden",
            "true"
        );

        revealOverlay.className = "reveal-overlay";
        document.getElementById("reveal-special-label").textContent = "";
        typeText.textContent = "";
        revealPreviewSprite.src = "";
        revealPreviewSprite.alt = "";
        revealPreviewSprite.onerror = null;
        revealPreviewSprite.onload = null;
        hologram.removeAttribute("src");
        revealPokemonName.textContent = "";
        revealPullChance.textContent = "";
        revealUsageRank.textContent = "";
        revealUsagePercentage.textContent = "";

        return;

    }


    prepareAudio();
    // Prepare both cry paths while the first two tones play.
    if (hasRareRevealEffect) {
        preloadRevealCryMedia(previewPokemon);
        loadRevealAudio(previewPokemon);
    }
    // Also preload the legacy explosion effect for its original reveal moment.
    if (hasRareRevealEffect) {
        preloadRevealExplosionMedia();
        loadRevealExplosionAudio();
    }


    /*
        Reset the overlay so every click starts from
        a completely clean animation state.
    */

    /*
        OU and Uber get their own premium reveal effects.

        These classes only change presentation. They do not
        affect the already-generated Pokémon or any odds.
    */

    if (highestTier === "OU") {
        revealOverlay.classList.add("reveal-ou");
    }

    if (highestTier === "Uber") {
        revealOverlay.classList.add("reveal-uber");
    }
    if (hasRareRevealEffect) {
        revealOverlay.classList.add("rare-reveal");
    }

    revealOverlay.style.setProperty(
        "--reveal-color",
        revealColor
    );

    revealOverlay.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.classList.add(
        "reveal-active"
    );

    revealOverlay.classList.add(
        "active"
    );


    /*
        Three spaced tones create the buildup.

        The actual rarity color remains hidden until
        AFTER the third tone.
    */

    await sleep(260);

    playRevealTone(185);
    pulseRevealStage(1);

    await sleep(650);

    playRevealTone(235);
    pulseRevealStage(2);


    /*
        OU and Uber get a longer pause before
        the final tone so the cadence feels like:

            1, 2... 3

        UU and lower keep the quicker standard cadence.
    */

    const finalToneDelay = getFinalToneDelay(highestTier);

    await sleep(finalToneDelay);

    // Eligible reveals replace tone three with their cry. A failed/slow
    // download falls back to the tone without playing a late cry afterward.
    const cryPlayed = hasRareRevealEffect && await playRevealAudio(previewPokemon);
    if (!cryPlayed) playRevealTone(300);
    pulseRevealStage(3);

    // Let the cry ring out before the silhouette and full-reveal sound arrive.
    await sleep(cryPlayed ? 2000 : 360);


    /*
        First reveal the tier color and a silhouette
        of the featured Pokémon.
    */

    revealOverlay.classList.add(
        "rarity-revealed"
    );

    await sleep(620);


    /*
        Then resolve the silhouette into the full GIF.
    */

    revealOverlay.classList.add(
        "pokemon-revealed"
    );
    await playRevealExplosionAudio(previewPokemon);


    /*
        Hold the featured pull on screen until the
        user chooses to continue.
    */

    revealOverlay.classList.add(
        "awaiting-continue"
    );

    await waitForContinue();
    stopRevealAudio();


    /*
        White flash, then remove the overlay and
        reveal the remaining five Pokémon.
    */

    revealOverlay.classList.add(
        "final-flash"
    );

    await sleep(260);

    revealOverlay.classList.add(
        "leaving"
    );

    await sleep(360);


    revealOverlay.className =
        "reveal-overlay";

    revealOverlay.setAttribute(
        "aria-hidden",
        "true"
    );

    revealPreviewSprite.src = "";
    revealPreviewSprite.alt = "";
    revealPreviewSprite.onerror = null;
    revealPreviewSprite.onload = null;
    hologram.removeAttribute("src");

    revealPokemonName.textContent = "";
    revealPullChance.textContent = "";
    revealUsageRank.textContent = "";
    revealUsagePercentage.textContent = "";
    typeText.textContent = "";
    revealContinueButton.blur();

    document.body.classList.remove(
        "reveal-active"
    );

}


/*
    =========================================
    POKÉMON SPRITES
    =========================================
*/

/*
    Pokémon Showdown's historical sprite folders
    use lowercase file names.

    Examples:
        Dragonite       -> dragonite.png
        Rotom-Wash      -> rotom-wash.png
        Mr. Mime        -> mrmime.png
        Farfetch'd      -> farfetchd.png
*/

function getPokemonSpriteSlugs(name) {

    const normalizedName =
        name
            .normalize("NFKD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9-]+/g, "")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");

    const pieces =
        normalizedName
            .split("-")
            .filter(Boolean);

    const candidates = [];


    /*
        Exact overrides for known Showdown sprite
        filenames that do not map cleanly from the
        display name.

        Keep these ahead of the generic candidates
        so the correct asset is always tried first.
    */

    const exactSpriteSlugs = {
        "charizard-mega-x": "charizard-megax",
        "charizard-mega-y": "charizard-megay",
        "mewtwo-mega-x": "mewtwo-megax",
        "mewtwo-mega-y": "mewtwo-megay",
        "ho-oh": "hooh",
        "porygon-z": "porygonz"
    };

    const exactSpriteSlug =
        exactSpriteSlugs[normalizedName];

    if (exactSpriteSlug) {
        candidates.push(exactSpriteSlug);
    }


    /*
        Pokémon Showdown sprite filenames are not
        generated by one simple "keep every hyphen"
        rule.

        Examples:
            Ho-Oh              -> hooh
            Porygon-Z          -> porygonz
            Rotom-Wash         -> rotom-wash
            Charizard-Mega-Y   -> charizard-megay
            Mewtwo-Mega-X      -> mewtwo-megax
            Basculin-Blue-Striped
                               -> basculin-bluestriped

        We therefore try a small ordered set of valid
        Showdown-style filename patterns instead of
        assuming one spelling for every Pokémon/form.
    */

    if (pieces.length > 1) {

        /*
            Treat the first piece as the base species
            and compact the form name after it.

            This is the important Mega-X / Mega-Y fix.
        */

        candidates.push(
            pieces[0] +
            "-" +
            pieces.slice(1).join("")
        );

    }

    candidates.push(normalizedName);

    candidates.push(
        pieces.join("")
    );


    /*
        Remove duplicate candidates while preserving
        their preferred order.
    */

    return candidates.filter(
        function (candidate, index) {

            return (
                candidate &&
                candidates.indexOf(candidate) === index
            );

        }
    );

}


function getPokemonSpriteUrls(
    name,
    generation
) {

    const slugs =
        getPokemonSpriteSlugs(name);

    const urls = [];

    // Historical pools stay in their own era, including on fallback.
    if (generation >= 1 && generation <= 5) {
        if (generation === 5) {
            slugs.forEach(slug => urls.push(`https://play.pokemonshowdown.com/sprites/gen5ani/${slug}.gif`));
        }
        slugs.forEach(slug => urls.push(`https://play.pokemonshowdown.com/sprites/gen${generation}/${slug}.png`));
        return urls;
    }

    /*
        Use Showdown's current animated sprite folder
        first. Keep xyani as a compatibility fallback
        for older assets, then try the matching
        generation's static PNG folder.
    */

    slugs.forEach(function (slug) {

        urls.push(
            "https://play.pokemonshowdown.com/" +
            "sprites/ani/" +
            slug +
            ".gif"
        );

    });

    slugs.forEach(function (slug) {

        urls.push(
            "https://play.pokemonshowdown.com/" +
            "sprites/xyani/" +
            slug +
            ".gif"
        );

    });

    slugs.forEach(function (slug) {

        urls.push(
            "https://play.pokemonshowdown.com/" +
            "sprites/gen" +
            generation +
            "/" +
            slug +
            ".png"
        );

    });


    /*
        Newer Pokémon do not always have a
        generation-numbered static directory.

        Showdown's gen5 directory contains its
        current pixel-style static sprites,
        including Generation 9 Pokémon/forms.
        HOME sprites are a final broad fallback.
    */

    slugs.forEach(function (slug) {

        urls.push(
            "https://play.pokemonshowdown.com/" +
            "sprites/gen5/" +
            slug +
            ".png"
        );

    });

    slugs.forEach(function (slug) {

        urls.push(
            "https://play.pokemonshowdown.com/" +
            "sprites/home/" +
            slug +
            ".png"
        );

    });

    // New Champions forms may lack a hosted animated/static sprite.
    // Keep an exact-form local image as the final fallback.
    if (CHAMPIONS_OU_LOCAL_SPRITES[name]) {
        urls.push(CHAMPIONS_OU_LOCAL_SPRITES[name]);
    }

    return urls.filter(
        function (url, index) {
            return urls.indexOf(url) === index;
        }
    );

}


function setPokemonSpriteWithFallback(
    imageElement,
    name,
    generation
) {

    const urls =
        getPokemonSpriteUrls(
            name,
            generation
        );

    let urlIndex = 0;

    imageElement.onerror = function () {

        urlIndex++;

        if (urlIndex >= urls.length) {

            this.onerror = null;
            return;

        }

        this.src =
            urls[urlIndex];

    };

    imageElement.src =
        urls[urlIndex];

}


/*
    =========================================
    GENERATE SIX POKÉMON
    =========================================
*/

function generateTeam(
    pokemonPool,
    selectedTier,
    selectedOdds
) {

    const selectedTierPosition =
        tierOrder.indexOf(selectedTier);


    /*
        Apply the user's Maximum Tier ceiling.
    */

    const eligiblePokemon =
        pokemonPool.filter(function (pokemon) {

            const pokemonTierPosition =
                tierOrder.indexOf(pokemon.tier);

            return pokemonTierPosition <= selectedTierPosition;

        });


    /*
        Make a temporary copy.

        Pokémon will be removed from this copy
        after they are selected so duplicates
        cannot occur within one team.
    */

    const availablePokemon =
        [...eligiblePokemon];

    const generatedPokemon = [];


    /*
        Generate six Pokémon.
    */

    for (let i = 0; i < 6; i++) {

        /*
            STAGE 1:
            Roll the Smogon rarity tier.
        */

        const tierSelection = getTierSelectionData(availablePokemon, pokemonPool, selectedTier, selectedOdds);
        const rolledTier = weightedRandomChoice(tierSelection.availableTiers, tier => tierSelection.tierWeights[tier]);
        const tierWeightTotal = tierSelection.availableTiers.reduce((total, tier) => total + tierSelection.tierWeights[tier], 0);
        const rolledTierChance = tierSelection.tierWeights[rolledTier] / tierWeightTotal;


        /*
            Find all remaining Pokémon
            belonging to the rolled tier.
        */

        const pokemonInTier =
            availablePokemon.filter(function (pokemon) {

                return pokemon.tier === rolledTier;

            });


        /*
            STAGE 2:
            Select a Pokémon inside that tier.

            Apply the small OU/Uber usage adjustment.
            UU and lower remain equal within a tier.
        */

        const selectedPokemon =
            weightedRandomChoice(
                pokemonInTier,
                function (pokemon) {
                    return getPokemonPullWeight(pokemon);
                }
            );


        const pokemonWeightTotal = pokemonInTier.reduce((total, pokemon) => total + getPokemonPullWeight(pokemon), 0);
        generatedPokemon.push({ ...selectedPokemon,
            pullProbability: rolledTierChance * getPokemonPullWeight(selectedPokemon) / pokemonWeightTotal
        });


        /*
            Remove this exact Pokémon/form from
            the current six-Pokémon generation.
        */

        const selectedIndex =
            availablePokemon.findIndex(function (pokemon) {

                return pokemon.id === selectedPokemon.id;

            });


        availablePokemon.splice(selectedIndex, 1);

    }


    return generatedPokemon;

}


/*
    =========================================
    STAGE 1: CHOOSE A TIER
    =========================================
*/

function getTierSelectionData(
    availablePokemon,
    pokemonPool,
    selectedTier,
    selectedOdds
) {
    const selectedTierPosition = tierOrder.indexOf(selectedTier);
    const ceilingTiers = tierOrder.slice(0, selectedTierPosition + 1);
    const profile = tierOddsProfiles[selectedOdds] || tierOddsProfiles["="];

    const structuralTiers = ceilingTiers.filter(function (tier) {
        return pokemonPool.some(function (pokemon) {
            return pokemon.tier === tier;
        });
    });

    const availableTiers = structuralTiers.filter(function (tier) {
        return availablePokemon.some(function (pokemon) {
            return pokemon.tier === tier;
        });
    });

    const tierWeights = {};
    structuralTiers.forEach(function (tier) {
        tierWeights[tier] = 0;
    });

    ceilingTiers.forEach(function (tier) {
        const tierPosition = tierOrder.indexOf(tier);
        let targetTier = tier;

        if (!structuralTiers.includes(tier)) {
            targetTier = null;

            // Prefer the nearest weaker tier; otherwise use a stronger tier.
            for (let position = tierPosition - 1; position >= 0; position--) {
                const candidate = tierOrder[position];
                if (structuralTiers.includes(candidate)) {
                    targetTier = candidate;
                    break;
                }
            }

            if (!targetTier) {
                for (
                    let position = tierPosition + 1;
                    position <= selectedTierPosition;
                    position++
                ) {
                    const candidate = tierOrder[position];
                    if (structuralTiers.includes(candidate)) {
                        targetTier = candidate;
                        break;
                    }
                }
            }
        }

        if (targetTier) {
            tierWeights[targetTier] += profile[tier];
        }
    });

    // Exhausted tiers are omitted so remaining tier weights rebalance.
    return { availableTiers, tierWeights };
}

function chooseTier(availablePokemon,pokemonPool,selectedTier,selectedOdds) {
 const s=getTierSelectionData(availablePokemon,pokemonPool,selectedTier,selectedOdds);
 return weightedRandomChoice(s.availableTiers,tier=>s.tierWeights[tier]);
}

/*
    =========================================
    STAGE 2: USAGE MODIFIERS
    =========================================
*/

const FEATURED_RARE_UBERS = new Set([
    "groudonprimal", "zaciancrowned", "zacian", "zamazentacrowned", "solgaleo",
    "necrozmaduskmane", "necrozmadawnwings", "necrozmaultra", "kyogreprimal",
    "eternatus", "rayquaza", "blazikenmega", "lucariomega", "calyrexice",
    "naganadel", "spectrier", "giratinaorigin", "gengarmega", "mewtwomegax", "mewtwomegay", "marshadow", "zygarde", "zygardecomplete", "lunala",
    "arceus", ...["bug", "dark", "dragon", "electric", "fairy", "fighting", "fire",
        "flying", "ghost", "grass", "ground", "ice", "poison", "psychic", "rock", "steel", "water"]
        .map(type => "arceus" + type)
]);
const RARE_OU_POKEMON = new Set([
    "dragapult", "garchomp", "kingambit", "gholdengo", "ogerponwellspring", "zamazenta", "volcarona", "kyurem", "raichumegay"
]);

function isFeaturedPokemon(pokemon) {
    return FEATURED_RARE_UBERS.has(pokemon.id) || RARE_OU_POKEMON.has(pokemon.id);
}

function getSpecialPresentation(pokemon) {
    if (pokemon.sourceTier === "AG") {
        return { className: "special-ag", color: "#ffe7a6", label: "Anything Goes" };
    }
    if (!isFeaturedPokemon(pokemon)) return null;
    if (pokemon.tier === "Uber" || pokemon.sourceTier === "AG") {
        return { className: "special-uber", color: "#DF00FF", label: pokemon.sourceTier === "AG" ? "Featured AG" : "Feature Rare Uber" };
    }
    if (pokemon.tier === "OU") {
        return { className: "special-ou", color: "#800020", label: "Rare OU" };
    }
    return null;
}

function getRevealTypes(pokemon) {
    return POKEMON_DETAILS_DATA[pokemon.id]?.modern.types || [];
}

function getRevealUsageDetails(pokemon) {
    const tier = pokemon.sourceTier === "AG" ? "AG" : pokemon.tier;
    const pool = pokemon.selectedPool || pokemon.format || "gen" + pokemon.generation;
    const ladderSuffix = tier === "Uber" ? "ubers" : (tier === "AG" ? "anythinggoes" : tier.toLowerCase());
    let ladder = "Gen" + pokemon.generation + tier;
    let usage = null;
    let period = "";
    let historicalFallback = false;
    if (["nationaldex", "gen9nationaldex", "bananza"].includes(pool)) {
        // Standard-generation usage would describe a different ladder.
        ladder = (pool === "bananza" ? "Bananza " : "National Dex ") + tier;
    } else if (["championsou", "gen9championsou"].includes(pool)) {
        ladder = "Champions " + tier;
        period = CHAMPIONS_OU_DATASET_META.usagePeriod;
        if (tier === "OU" && pokemon.usageSource === "gen9championsou" && pokemon.usage?.recorded) {
            usage = { rank: pokemon.usage.rank, pct: pokemon.usage.usagePct };
        }
    } else {
        const entry = POKEMON_DETAILS_DATA[pokemon.id]?.history[pokemon.generation - 1];
        const expectedFormat = "gen" + pokemon.generation + ladderSuffix;
        if (entry?.usage?.format === expectedFormat) {
            period = entry.usage.period;
            if (entry.usage.status === "recorded") usage = entry.usage;
        }
        // A dataset fallback is valid only when its explicitly named ladder matches.
        if (!usage && pokemon.usage?.recorded && (pokemon.usageSource || pokemon.format) === expectedFormat) {
            usage = { rank: pokemon.usage.rank, pct: pokemon.usage.usagePct };
        }
    }
    const validUsage = record => record && Number.isInteger(record.rank) && record.rank > 0 && Number.isFinite(record.pct) && record.pct >= 0;
    if (!validUsage(usage)) {
        // Use the exact form's best historical rank, retaining its real ladder/date.
        // Higher usage breaks rank ties, followed by the newer generation.
        const records = (POKEMON_DETAILS_DATA[pokemon.id]?.history || []).flatMap((entry, index) => {
            const record = entry.usage;
            const match = record?.format?.match(/^gen([1-9])(ubers|anythinggoes|ou|uu|ru|nu|pu|zu)$/);
            if (entry.status !== "available" || record?.status !== "recorded" || !validUsage(record) || !match || Number(match[1]) !== index + 1) return [];
            const recordTier = match[2] === "ubers" ? "Uber" : (match[2] === "anythinggoes" ? "AG" : match[2].toUpperCase());
            if (recordTier !== entry.tier) return [];
            return [{ usage: record, generation: index + 1, ladder: "Gen" + match[1] + recordTier }];
        });
        records.sort((a, b) => a.usage.rank - b.usage.rank || b.usage.pct - a.usage.pct || b.generation - a.generation);
        if (records.length) {
            usage = records[0].usage;
            ladder = records[0].ladder;
            period = usage.period;
            historicalFallback = true;
        }
    }
    if (validUsage(usage)) {
        return { rankText: "Rank #" + usage.rank + " · " + ladder,
            percentageText: usage.pct.toFixed(3) + "% Usage" + (period ? " · " + period : ""),
            description: (historicalFallback ? "Best historical usage rank; the selected pool/tier has no matching record. " : "") + "Recorded ladder usage for " + ladder + (period ? " in " + period : "") + ". This is separate from the generator's pull chance." };
    }
    return { rankText: "Usage unavailable · " + ladder,
        percentageText: period ? "Snapshot · " + period : "No tier usage record",
        description: "No published exact-form usage record for this pool and generated tier, or a historical fallback. Missing usage is not zero usage." };
}

function getRarityCategory(pokemon) {
    if (pokemon.sourceTier === "AG") return { label: "Anything Goes", multiplier: 0.10 };
    const special = getSpecialPresentation(pokemon);
    if (special) return { label: special.label, multiplier: pokemon.tier === "Uber" ? 0.45 : 0.70 };
    return { label: "Standard", multiplier: 1.00 };
}

function getFinalToneDelay(tier) {
    return tier === "Uber" ? 1350 : (tier === "OU" ? 1100 : 650);
}

function getPokemonPullWeight(pokemon) {
    // UU and lower share their tier equally. OU/Uber keep their usage adjustment.
    if (pokemon.tier !== "Uber" && pokemon.tier !== "OU") {
        return 1.00;
    }

    return (pokemon.usageModifier || 1.00) * getRarityCategory(pokemon).multiplier;
}


function assignUsageModifiers(pokemonPool) {

    /*
        Process each Smogon tier separately.

        This is important.

        We compare an OU Pokémon only with other
        OU Pokémon, an Uber only with other Ubers,
        and so on.
    */

    tierOrder.forEach(function (tier) {

        const pokemonInTier =
            pokemonPool.filter(function (pokemon) {
                return pokemon.tier === tier;
            });


        /*
            Start everyone at the neutral value.
        */

        pokemonInTier.forEach(function (pokemon) {
            pokemon.usageModifier = 1.00;
        });

        // Only OU and Uber receive individual usage adjustments.
        if (tier !== "Uber" && tier !== "OU") {
            return;
        }


        /*
            Only Pokémon with actual usage records
            participate in the usage adjustment.
        */

        const recordedPokemon =
            pokemonInTier.filter(function (pokemon) {

                return (
                    pokemon.usage &&
                    pokemon.usage.recorded &&
                    typeof pokemon.usage.usagePct === "number"
                );

            });


        /*
            If there is not enough data to compare,
            leave the tier neutral.
        */

        if (recordedPokemon.length < 2) {
            return;
        }


        /*
            Give each Pokémon a position relative
            to the other recorded Pokémon in
            the SAME tier.

            Higher usage:
                closer to 0.85x

            Lower usage:
                closer to 1.15x
        */

        recordedPokemon.forEach(function (pokemon) {

            const usage =
                pokemon.usage.usagePct;


            const higherUsageCount =
                recordedPokemon.filter(function (otherPokemon) {

                    return (
                        otherPokemon.usage.usagePct > usage
                    );

                }).length;


            /*
                If several Pokémon have exactly the
                same usage percentage, treat them equally.
            */

            const equalUsageCount =
                recordedPokemon.filter(function (otherPokemon) {

                    return (
                        otherPokemon.usage.usagePct === usage
                    );

                }).length;


            const averageRankPosition =
                higherUsageCount +
                ((equalUsageCount - 1) / 2);


            const percentile =
                averageRankPosition /
                (recordedPokemon.length - 1);


            pokemon.usageModifier =
                MIN_USAGE_MODIFIER +
                (
                    percentile *
                    (
                        MAX_USAGE_MODIFIER -
                        MIN_USAGE_MODIFIER
                    )
                );

        });

    });

}


/*
    =========================================
    GENERIC WEIGHTED RANDOM SELECTION
    =========================================
*/

/*
    This function is our reusable lottery machine.

    Example:

        Item A = weight 10
        Item B = weight 5
        Item C = weight 1

    Item A is more likely to be selected,
    but Item C is still possible.
*/

function weightedRandomChoice(items, getWeight) {

    let totalWeight = 0;


    items.forEach(function (item) {
        totalWeight += getWeight(item);
    });


    let randomNumber =
        Math.random() * totalWeight;


    for (let i = 0; i < items.length; i++) {

        randomNumber -=
            getWeight(items[i]);


        if (randomNumber <= 0) {
            return items[i];
        }

    }


    /*
        Safety fallback for extremely tiny
        floating-point rounding differences.
    */

    return items[items.length - 1];

}


/*
    =========================================
    TESTING / SIMULATION TOOL
    =========================================
*/

/*
    This does NOT affect the actual generator.

    Later we can run:

        simulateTeams(10000)

    in the browser console to test thousands
    of generations very quickly.
*/

function simulateTeams(numberOfTeams = 10000) {

    const selectedPool =
        poolSelect.value;

    const selectedTier = selectedPool === "bananza"
        ? "Uber"
        : tierSelect.value;

    const selectedOdds =
        oddsSelect.value;

    const selectedType = selectedPool === "bananza" ? (typePoolSelect.value || "All") : "All";
    const pokemonPool = getActivePokemonPool(selectedPool, selectedType);


    const tierCounts = {
        "Uber": 0,
        "OU": 0,
        "UU": 0,
        "RU": 0,
        "NU": 0,
        "PU": 0,
        "ZU": 0
    };


    let teamsWithUber = 0;


    for (let i = 0; i < numberOfTeams; i++) {

        const team =
            generateTeam(
                pokemonPool,
                selectedTier,
                selectedOdds
            );


        let containsUber = false;


        team.forEach(function (pokemon) {

            tierCounts[pokemon.tier]++;

            if (pokemon.tier === "Uber") {
                containsUber = true;
            }

        });


        if (containsUber) {
            teamsWithUber++;
        }

    }


    const totalPokemon =
        numberOfTeams * 6;


    const results = {};


    tierOrder
        .slice()
        .reverse()
        .forEach(function (tier) {

            results[tier] = {
                count: tierCounts[tier],

                percentage:
                    (
                        tierCounts[tier] /
                        totalPokemon *
                        100
                    ).toFixed(2) + "%"
            };

        });


    console.log(
        "Odds modifier:",
        selectedOdds
    );


    console.table(results);


    console.log(
        "Teams containing at least one Uber:",
        (
            teamsWithUber /
            numberOfTeams *
            100
        ).toFixed(2) + "%"
    );


    return {
        numberOfTeams,
        totalPokemon,
        selectedPool,
        selectedType,
        selectedTier,
        selectedOdds,
        tierCounts,
        results,
        teamsWithUber,
        teamsWithUberPercentage: teamsWithUber / numberOfTeams * 100
    };
}
