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
    ++ targets 7% Uber, 38% OU, and only 3% combined PU/ZU.
*/

const tierOddsProfiles = {
    "--": { ZU: 18, PU: 20, NU: 22, RU: 20, UU: 12, OU: 7, Uber: 1 },
    "-":  { ZU: 12, PU: 16, NU: 20, RU: 21, UU: 18, OU: 11.5, Uber: 1.5 },
    "=":  { ZU: 6, PU: 10, NU: 16, RU: 22, UU: 21, OU: 22.5, Uber: 2.5 },
    "+":  { ZU: 3, PU: 6, NU: 12, RU: 21, UU: 23, OU: 30.5, Uber: 4.5 },
    "++": { ZU: 1, PU: 2, NU: 9, RU: 18, UU: 25, OU: 38, Uber: 7 }
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
let revealAudioBufferPromise = null;
let activeRevealAudio = null;
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
    // Display a pool-specific comparison among eligible OU+ Pokémon.
    if (pokemon.tier !== "OU" && pokemon.tier !== "Uber" && pokemon.sourceTier !== "AG") return null;
    const probability = pokemon.upperPoolProbability;
    if (!Number.isFinite(probability) || probability <= 0 || probability > 1) return null;
    let label, className;
    if (probability <= 0.0001) {
        label = "Extremely Rare"; className = "rarity-extremely-rare";
    } else if (probability <= 0.001) {
        label = "Very Rare"; className = "rarity-very-rare";
    } else if (probability <= 0.01) {
        label = "Rare"; className = "rarity-rare";
    } else {
        label = ""; className = "rarity-standard";
    }
    const oddsText = "1 in " + Math.round(1 / probability).toLocaleString();
    return { label, className, oddsText,
        displayText: (label ? label + " · " : "") + oddsText + " among OU+ pulls" };

}

function renderTeam(generatedPokemon) {

    for (let i = 0; i < pokemonCards.length; i++) {

        const pokemon =
            generatedPokemon[i];

        const tierLabel = pokemon.sourceTier === "AG" ? "AG" : pokemon.tier;
        const tierClass = "tier-" + tierLabel.toLowerCase();
        const rarity = getRarityDetails(pokemon);
        const special = getSpecialPresentation(pokemon);
        pokemonCards[i].classList.remove("special-ou", "special-uber");
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
            ${rarity ? `<div class="pokemon-pull-rarity ${rarity.className}" title="Comparison within the eligible OU-and-above pool at the selected odds setting, before team exclusions. Not the chance on any roll.">${rarity.displayText}</div>` : ""}
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
    loadRevealAudio();

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

function loadRevealAudio() {
    if (!audioContext) return Promise.resolve(null);
    if (!revealAudioBufferPromise) {
        revealAudioBufferPromise = fetch("audio/rare-reveal.wav")
            .then(response => { if (!response.ok) throw new Error("Audio unavailable"); return response.arrayBuffer(); })
            .then(buffer => audioContext.decodeAudioData(buffer))
            .catch(() => { revealAudioBufferPromise = null; return null; });
    }
    return revealAudioBufferPromise;
}

function stopRevealAudio() {
    revealAudioToken++;
    if (activeRevealAudio) {
        activeRevealAudio.stop();
        activeRevealAudio = null;
    }
}

async function playRevealAudio(pokemon) {
    if (!shouldPlayRevealAudio(pokemon) || !audioContext) return;
    const token = revealAudioToken;
    const buffer = await loadRevealAudio();
    if (!buffer || token !== revealAudioToken || audioContext.state !== "running") return;
    const source = audioContext.createBufferSource();
    const gain = audioContext.createGain();
    source.buffer = buffer;
    gain.gain.setValueAtTime(0.55, audioContext.currentTime);
    source.connect(gain);
    gain.connect(audioContext.destination);
    source.onended = () => {
        if (activeRevealAudio === source) activeRevealAudio = null;
        source.disconnect(); gain.disconnect();
    };
    activeRevealAudio = source;
    source.start();
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
    revealOverlay.className = "reveal-overlay";
    if (special) revealOverlay.classList.add(special.className);
    document.getElementById("reveal-special-label").textContent = special ? special.label : "";
    const previewTierLabel = previewPokemon.sourceTier === "AG" ? "AG" : previewPokemon.tier;
    revealTierName.textContent = previewTierLabel;
    revealPullChance.textContent = previewRarity ? previewRarity.displayText : "";

    setPokemonSpriteWithFallback(
        revealPreviewSprite,
        previewPokemon.name,
        previewPokemon.generation
    );


    /*
        Reduced-motion users get a short color cue
        without the full buildup.
    */

    if (prefersReducedMotion) {

        revealOverlay.style.setProperty(
            "--reveal-color",
            (special ? special.color : revealTierColors[highestTier])
        );

        revealTierName.textContent =
            previewTierLabel;

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
        revealPreviewSprite.src = "";
        revealPreviewSprite.alt = "";
        revealPreviewSprite.onerror = null;
        revealPokemonName.textContent = "";
        revealPullChance.textContent = "";

        return;

    }


    prepareAudio();


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
    if (previewRarity && previewRarity.className === "rarity-extremely-rare") {
        revealOverlay.classList.add("rarity-extremely-rare");
    }

    revealOverlay.style.setProperty(
        "--reveal-color",
        (special ? special.color : revealTierColors[highestTier])
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

    playRevealTone(300);
    pulseRevealStage(3);

    await sleep(360);


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
    void playRevealAudio(previewPokemon);

    await sleep(360);


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

    revealPokemonName.textContent = "";
    revealPullChance.textContent = "";
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

function getUpperPoolProbabilities(pokemonPool, selectedTier, selectedOdds) {
    const ceiling = tierOrder.indexOf(selectedTier);
    const profile = tierOddsProfiles[selectedOdds] || tierOddsProfiles["="];
    const candidates = pokemonPool.filter(pokemon =>
        (pokemon.tier === "OU" || pokemon.tier === "Uber") && tierOrder.indexOf(pokemon.tier) <= ceiling);
    const totals = { OU: 0, Uber: 0 };
    candidates.forEach(pokemon => { totals[pokemon.tier] += getPokemonPullWeight(pokemon); });
    // Normalize only the upper-tier profile weights. Lower-tier weights, sizes,
    // missing tiers, and earlier team picks cannot affect this display benchmark.
    const totalTierWeight = ["OU", "Uber"].reduce((sum, tier) => sum + (totals[tier] ? profile[tier] : 0), 0);
    const probabilities = new Map();
    candidates.forEach(pokemon => probabilities.set(pokemon.id,
        profile[pokemon.tier] / totalTierWeight * getPokemonPullWeight(pokemon) / totals[pokemon.tier]));
    return probabilities;
}

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
    const upperPoolProbabilities = getUpperPoolProbabilities(pokemonPool, selectedTier, selectedOdds);


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
            pullProbability: rolledTierChance * getPokemonPullWeight(selectedPokemon) / pokemonWeightTotal,
            upperPoolProbability: upperPoolProbabilities.get(selectedPokemon.id) ?? null
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
    if (!isFeaturedPokemon(pokemon)) return null;
    if (pokemon.tier === "Uber" || pokemon.sourceTier === "AG") {
        return { className: "special-uber", color: "#DF00FF", label: pokemon.sourceTier === "AG" ? "Featured AG" : "Featured rare Uber" };
    }
    if (pokemon.tier === "OU") {
        return { className: "special-ou", color: "#800020", label: "Rare OU" };
    }
    return null;
}

function getRarityCategory(pokemon) {
    if (pokemon.sourceTier === "AG") return { label: "Anything Goes", multiplier: 0.10 };
    const special = getSpecialPresentation(pokemon);
    if (special) return { label: special.label, multiplier: pokemon.tier === "Uber" ? 0.50 : 0.75 };
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
