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
    gen5: GEN5_POKEMON
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


/*
    Colors used by the dramatic reveal.

    These intentionally match the tier badges.
*/

const revealTierColors = {
    "ZU": "#666666",
    "PU": "#2471a3",
    "NU": "#2e8b57",
    "RU": "#b7950b",
    "UU": "#d35400",
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


    /*
        Build the result cards behind the overlay
        so the sprites can begin loading early.
    */

    renderTeam(generatedPokemon);


    try {

        await playRevealSequence(highestTier);

        revealPokemonCards();

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

        const animatedSpriteUrl =
            getAnimatedPokemonSpriteUrl(pokemon.name);

        const staticSpriteUrl =
            getStaticPokemonSpriteUrl(pokemon.name);

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
                    src="${animatedSpriteUrl}"
                    alt="${pokemon.name}"
                    onerror="this.onerror=null; this.src='${staticSpriteUrl}'"
                >
            </div>

            <div class="pokemon-name">
                ${pokemon.name}
            </div>

            <div class="pokemon-tier ${tierClass}">
                ${pokemon.tier}
            </div>
        `;

    }

}


function revealPokemonCards() {

    pokemonCards.forEach(function (card, index) {

        setTimeout(function () {

            card.classList.remove("card-hidden");
            card.classList.add("card-reveal");

        }, index * 110);

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


function sleep(milliseconds) {

    return new Promise(function (resolve) {
        setTimeout(resolve, milliseconds);
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


async function playRevealSequence(highestTier) {

    const prefersReducedMotion =
        window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;


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
            "rarity-revealed"
        );

        revealOverlay.setAttribute(
            "aria-hidden",
            "false"
        );

        await sleep(350);

        revealOverlay.classList.remove(
            "active",
            "rarity-revealed"
        );

        revealOverlay.setAttribute(
            "aria-hidden",
            "true"
        );

        return;

    }


    prepareAudio();


    /*
        Reset the overlay so every click starts from
        a completely clean animation state.
    */

    revealOverlay.className =
        "reveal-overlay";

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

    await sleep(650);

    playRevealTone(300);
    pulseRevealStage(3);

    await sleep(360);


    /*
        Reveal only the color / highest tier first.
        The Pokémon themselves are still hidden.
    */

    revealOverlay.classList.add(
        "rarity-revealed"
    );

    await sleep(820);


    /*
        White flash, then remove the overlay.
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
    Pokémon Showdown's Generation 5 sprite folder
    uses lowercase file names.

    Examples:
        Dragonite       -> dragonite.png
        Rotom-Wash      -> rotom-wash.png
        Mr. Mime        -> mrmime.png
        Farfetch'd      -> farfetchd.png
*/

function getPokemonSpriteSlug(name) {

    return name
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[.'’]/g, "")
        .replace(/\s+/g, "");

}


function getAnimatedPokemonSpriteUrl(name) {

    const spriteSlug =
        getPokemonSpriteSlug(name);

    return (
        "https://play.pokemonshowdown.com/" +
        "sprites/xyani/" +
        spriteSlug +
        ".gif"
    );

}


function getStaticPokemonSpriteUrl(name) {

    const spriteSlug =
        getPokemonSpriteSlug(name);

    return (
        "https://play.pokemonshowdown.com/" +
        "sprites/gen5/" +
        spriteSlug +
        ".png"
    );

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
    selectedTier,
    selectedOdds
) {

    const selectedTierPosition =
        tierOrder.indexOf(selectedTier);


    /*
        Only tiers equal to or below the ceiling
        are allowed.
    */

    const allowedTiers =
        tierOrder
            .slice(0, selectedTierPosition + 1)
            .filter(function (tier) {

                /*
                    Also make sure this tier still
                    has at least one Pokémon available.
                */

                return availablePokemon.some(function (pokemon) {
                    return pokemon.tier === tier;
                });

            });


    /*
        Choose a tier using our Standard odds,
        tilted by the user's odds modifier.

        weightedRandomChoice automatically
        rebalances the probabilities when some
        tiers are unavailable.
    */

    return weightedRandomChoice(
        allowedTiers,
        function (tier) {

            const tierPosition =
                tierOrder.indexOf(tier);

            const strengthFactor =
                oddsStrengthFactors[selectedOdds];

            return (
                standardTierOdds[tier] *
                Math.pow(
                    strengthFactor,
                    tierPosition
                )
            );

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