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

const pokemonCards =
    document.querySelectorAll(".pokemon-card");


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

function generatePokemon() {

    const selectedPool =
        poolSelect.value;

    const pokemonPool =
        datasets[selectedPool];

    const selectedTier =
        tierSelect.value;


    /*
        Generate a six-Pokémon team using
        the Hybrid probability engine.
    */

    const generatedPokemon =
        generateTeam(pokemonPool, selectedTier);


    /*
        Display the six results.
    */

    for (let i = 0; i < pokemonCards.length; i++) {

        pokemonCards[i].innerHTML = `
            <div>${generatedPokemon[i].name}</div>

            <div class="pokemon-tier">
                ${generatedPokemon[i].tier}
            </div>
        `;

    }

}


/*
    =========================================
    GENERATE SIX POKÉMON
    =========================================
*/

function generateTeam(pokemonPool, selectedTier) {

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
                selectedTier
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

function chooseTier(availablePokemon, selectedTier) {

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
        Choose a tier using our Standard odds.

        weightedRandomChoice automatically
        rebalances the probabilities when some
        tiers are unavailable.
    */

    return weightedRandomChoice(
        allowedTiers,
        function (tier) {
            return standardTierOdds[tier];
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
                selectedTier
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