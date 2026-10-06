const detailsDialog = document.getElementById("pokemon-details-dialog");
const detailsContent = document.getElementById("pokemon-details-content");
const detailsTitle = document.getElementById("pokemon-details-title");
document.getElementById("pokemon-details-close").addEventListener("click", () => detailsDialog.close());
detailsDialog.addEventListener("click", event => {
    if (event.target === detailsDialog) {
        const rect = detailsDialog.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) detailsDialog.close();
    }
});

function detailsEscape(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
}

function describeAbilities(abilities, generation) {
    if (generation < 3) return "No abilities in this generation";
    if (!abilities?.length) return "Data unavailable";
    return abilities.map(ability => detailsEscape(ability.name) + (ability.hidden ? " (Hidden)" : "")).join(", ");
}

function describeUsage(usage) {
    if (!usage || usage.status === "unpublished") return "No published ladder for this snapshot";
    if (usage.status === "unavailable") return "Usage data unavailable";
    const source = `<a href="${detailsEscape(usage.url)}" target="_blank" rel="noopener noreferrer">${detailsEscape(usage.format)} · ${detailsEscape(usage.period)}</a>`;
    const value = usage.status === "recorded" ? `${usage.pct.toFixed(3)}% · Rank #${usage.rank}` : "No recorded usage for this exact form";
    return `${value}<small>${source}</small>`;
}

function openPokemonDetails(pokemon) {
    const record = POKEMON_DETAILS_DATA[pokemon.id];
    detailsTitle.textContent = pokemon.name;
    if (!record) {
        detailsContent.innerHTML = "<p>Details for this exact form are not available yet.</p>";
        detailsDialog.showModal();
        return;
    }
    const selectedGeneration = pokemon.generation;
    const selected = record.history[selectedGeneration - 1];
    // National Dex includes forms unavailable in standard Gen 9.
    const profile = selected?.status === "available" ? selected : record.modern;
    const category = getRarityCategory(pokemon);
    const poolNames = { gen1: "Generation 1", gen2: "Generation 2", gen3: "Generation 3", gen4: "Generation 4", gen5: "Generation 5", gen6: "Generation 6", gen7: "Generation 7", gen8: "Generation 8", gen9: "Generation 9", championsou: "Pokémon Champions OU", gen9championsou: "Pokémon Champions OU", gen9nationaldex: "National Dex", nationaldex: "National Dex", bananza: "Bananza" };
    const poolLabel = (poolNames[pokemon.selectedPool || pokemon.format] || `Generation ${selectedGeneration}`) + (pokemon.selectedType && pokemon.selectedType !== "All" ? " · " + pokemon.selectedType : "");
    const rows = record.history.map((entry, index) => {
        const generation = index + 1;
        if (entry.status !== "available") {
            return `<tr><th scope="row">Gen ${generation}</th><td colspan="4">${entry.status === "not-introduced" ? "Not introduced yet" : "Not available in standard play"}</td></tr>`;
        }
        const tier = entry.tier || "No tier record";
        const source = entry.sourceTier && entry.sourceTier !== tier ? ` (${entry.sourceTier})` : "";
        return `<tr><th scope="row">Gen ${generation}</th><td>${detailsEscape(tier + source)}</td><td>${describeUsage(entry.usage)}</td><td>${entry.types.map(detailsEscape).join(" / ")}</td><td>${describeAbilities(entry.abilities, generation)}</td></tr>`;
    }).join("");
    detailsContent.innerHTML = `
        <p class="details-pool">${detailsEscape(poolLabel)} · ${detailsEscape(pokemon.sourceTier === "AG" ? "AG" : pokemon.tier)}${category.label !== "Standard" ? " · " + detailsEscape(category.label) : ""}</p>
        <dl class="details-profile"><div><dt>Typing</dt><dd>${profile.types.map(detailsEscape).join(" / ")}</dd></div><div><dt>Abilities</dt><dd>${describeAbilities(profile.abilities, selectedGeneration)}</dd></div></dl>
        <h3>Generation history</h3>
        <p class="details-note">Highest tier in the recorded standard-generation snapshot. Usage is from that tier’s own ladder; it is not your chance of pulling this Pokémon. Borderline bans use the next legal tier.</p>
        <div class="details-table-wrap" tabindex="0" role="region" aria-label="Generation history, scroll horizontally for more columns"><table class="details-table"><thead><tr><th scope="col">Generation</th><th scope="col">Highest tier</th><th scope="col">Usage in that tier</th><th scope="col">Typing</th><th scope="col">Abilities</th></tr></thead><tbody>${rows}</tbody></table></div>
        <p class="details-note">Historical records use dated, unweighted Smogon statistics, not live usage. National Dex and Bananza share this standard-generation history. <a href="https://github.com/smogon/pokemon-showdown" target="_blank" rel="noopener noreferrer">Species data: Pokémon Showdown</a>.</p>`;
    detailsDialog.showModal();
    detailsContent.scrollTop = 0;
}
