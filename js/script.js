/*
    GENERATOR SETTINGS
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
    DATASETS

    Later we can add things such as:

    gen6
    gen7
    natdex

    without rewriting the generator.
*/

const datasets = {
    gen5: GEN5_POKEMON
};


/*
    PAGE ELEMENTS
*/

const generateButton =
    document.getElementById("generate-button");

const poolSelect =
    document.getElementById("pool-select");

const tierSelect =
    document.getElementById("tier-select");

const pokemonCards =
    document.querySelectorAll(".pokemon-card");


generateButton.addEventListener("click", generatePokemon);


/*
    MAIN GENERATOR FUNCTION
*/

function generatePokemon() {

    /*
        Determine which Pokémon dataset
        the user selected.
    */

    const selectedPool = poolSelect.value;

    const pokemonPool =
        datasets[selectedPool];


    /*
        Determine the user's maximum tier.
    */

    const selectedTier = tierSelect.value;

    const selectedTierPosition =
        tierOrder.indexOf(selectedTier);


    /*
        Keep only Pokémon equal to or below
        the selected maximum tier.
    */

    const eligiblePokemon = pokemonPool.filter(function (pokemon) {

        const pokemonTierPosition =
            tierOrder.indexOf(pokemon.tier);

        return pokemonTierPosition <= selectedTierPosition;

    });


    /*
        Create a temporary copy of the pool.

        This lets us remove selected Pokémon
        without changing the original dataset.
    */

    const availablePokemon = [...eligiblePokemon];

    const generatedPokemon = [];


    /*
        Generate six different Pokémon.
    */

    for (let i = 0; i < 6; i++) {

        const randomIndex = Math.floor(
            Math.random() * availablePokemon.length
        );

        const selectedPokemon =
            availablePokemon[randomIndex];

        generatedPokemon.push(selectedPokemon);

        availablePokemon.splice(randomIndex, 1);

    }


    /*
        Display the results.
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