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
    STANDARD TIER ODDS

    These are our Hybrid Model v0.1 odds.

    When Uber is the maximum tier, these values
    add up to exactly 100%.

    If the user selects a lower maximum tier,
    unavailable tiers are removed automatically
    and the remaining weights are rebalanced.
*/

const standardTierOdds = {
    "ZU": 30,
    "PU": 22,
    "NU": 18,
    "RU": 14,
    "UU": 10,
    "OU": 5.5,
    "Uber": 0.5
};


/*
    ODDS MODIFIERS

    These modify how strongly the generator favors
    higher or lower competitive tiers.

    =   Standard odds
    +   Stronger Pokémon become more common
    ++  Stronger Pokémon become much more common
    -   Weaker Pokémon become more common
    --  Weaker Pokémon become much more common

    These do NOT change eligibility.
*/

const oddsStrengthFactors = {
    "--": 0.65,
    "-": 0.80,
    "=": 1.00,
    "+": 1.40,
    "++": 1.80
};


/*
    Individual Pokémon modifiers.

    A Pokémon with very high usage within its tier
    can be as low as 0.85x.

    A Pokémon with very low usage within its tier
    can be as high as 1.15x.

    Missing usage data stays neutral at 1.00x.
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
    gen6: GEN6_POKEMON
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

function updateTierAvailability() {

    const pokemonPool =
        datasets[poolSelect.value] || [];

    const selectedPosition =
        tierOrder.indexOf(
            tierSelect.value
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
            eligibleCount < 6;

    }

    if (!tierSelect.selectedOptions[0].disabled) {
        return;
    }

    for (
        let position = Math.max(selectedPosition, 0);
        position < tierOrder.length;
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

    const pokemonPool =
        datasets[selectedPool];

    const selectedTier =
        tierSelect.value;

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

    }

}


/*
    =========================================
    RESULT DISPLAY
    =========================================
*/

function renderTeam(generatedPokemon) {

    for (let i = 0; i < pokemonCards.length; i++) {

        const pokemon =
            generatedPokemon[i];

        const tierClass =
            "tier-" + pokemon.tier.toLowerCase();


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
                ${pokemon.tier}
            </div>
        `;

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
    Pick the first Pokémon belonging to the
    strongest tier in the generated six.

    This choice is deterministic and does not
    perform another random roll.
*/

function getPreviewPokemon(team) {

    const highestTier =
        getHighestTier(team);

    return team.find(function (pokemon) {
        return pokemon.tier === highestTier;
    });

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
        audioContext.resume();
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

    revealPreviewSprite.alt =
        previewPokemon.name;

    revealPokemonName.textContent =
        previewPokemon.name;

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
            revealTierColors[highestTier]
        );

        revealTierName.textContent =
            highestTier;

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

        revealPreviewSprite.src = "";
        revealPreviewSprite.alt = "";
        revealPreviewSprite.onerror = null;
        revealPokemonName.textContent = "";

        return;

    }


    prepareAudio();


    /*
        Reset the overlay so every click starts from
        a completely clean animation state.
    */

    revealOverlay.className =
        "reveal-overlay";

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

    revealOverlay.style.setProperty(
        "--reveal-color",
        revealTierColors[highestTier]
    );

    revealTierName.textContent =
        highestTier;

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
        UU, OU, and Uber get a longer pause before
        the final tone so the cadence feels like:

            1, 2... 3

        Lower tiers keep the quicker standard cadence.
    */

    const finalToneDelay =
        (
            highestTier === "UU" ||
            highestTier === "OU" ||
            highestTier === "Uber"
        )
            ? 1100
            : 650;

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

    await sleep(360);


    /*
        Hold the featured pull on screen until the
        user chooses to continue.
    */

    revealOverlay.classList.add(
        "awaiting-continue"
    );

    await waitForContinue();


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

        const rolledTier =
            chooseTier(
                availablePokemon,
                pokemonPool,
                selectedTier,
                selectedOdds
            );


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

            usageModifier provides the small
            individual adjustment.
        */

        const selectedPokemon =
            weightedRandomChoice(
                pokemonInTier,
                function (pokemon) {
                    return pokemon.usageModifier;
                }
            );


        generatedPokemon.push(selectedPokemon);


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

function chooseTier(
    availablePokemon,
    pokemonPool,
    selectedTier,
    selectedOdds
) {

    const selectedTierPosition =
        tierOrder.indexOf(selectedTier);

    const ceilingTiers =
        tierOrder.slice(
            0,
            selectedTierPosition + 1
        );

    /*
        Historical generations do not always have
        every modern generator bucket.

        Generation 1, for example, has no structural
        ZU, PU, or RU bucket after fully-evolved
        filtering.

        Instead of deleting those probability weights
        and accidentally making OU/Uber much more
        common, fold a structurally missing tier into
        the nearest tier that actually exists in that
        generation.

        This keeps the broad Standard odds meaningful
        across generations. It does NOT affect tiers
        that merely become empty during one six-Pokémon
        roll; those continue to rebalance as before.
    */

    const structuralTiers =
        ceilingTiers.filter(function (tier) {

            return pokemonPool.some(function (pokemon) {
                return pokemon.tier === tier;
            });

        });

    const availableTiers =
        structuralTiers.filter(function (tier) {

            return availablePokemon.some(function (pokemon) {
                return pokemon.tier === tier;
            });

        });

    const strengthFactor =
        oddsStrengthFactors[selectedOdds];

    const tierWeights = {};

    structuralTiers.forEach(function (tier) {
        tierWeights[tier] = 0;
    });

    ceilingTiers.forEach(function (tier) {

        const tierPosition =
            tierOrder.indexOf(tier);

        const weight =
            standardTierOdds[tier] *
            Math.pow(
                strengthFactor,
                tierPosition
            );

        let targetTier = tier;

        if (!structuralTiers.includes(tier)) {

            targetTier = null;

            /*
                Prefer the nearest weaker existing tier.
                If none exists, use the nearest stronger
                existing tier.
            */

            for (
                let position =
                    tierPosition - 1;
                position >= 0;
                position--
            ) {

                const candidate =
                    tierOrder[position];

                if (
                    structuralTiers.includes(
                        candidate
                    )
                ) {
                    targetTier = candidate;
                    break;
                }

            }

            if (!targetTier) {

                for (
                    let position =
                        tierPosition + 1;
                    position <=
                        selectedTierPosition;
                    position++
                ) {

                    const candidate =
                        tierOrder[position];

                    if (
                        structuralTiers.includes(
                            candidate
                        )
                    ) {
                        targetTier =
                            candidate;
                        break;
                    }

                }

            }

        }

        if (targetTier) {
            tierWeights[targetTier] +=
                weight;
        }

    });


    /*
        If a real tier has been exhausted during the
        current six-Pokémon roll, omit it here.

        weightedRandomChoice then rebalances only the
        tiers that still have Pokémon available.
    */

    return weightedRandomChoice(
        availableTiers,
        function (tier) {
            return tierWeights[tier];
        }
    );

}


/*
    =========================================
    STAGE 2: USAGE MODIFIERS
    =========================================
*/

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

    const selectedTier =
        tierSelect.value;

    const selectedOdds =
        oddsSelect.value;

    const pokemonPool =
        datasets[selectedPool];


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

}