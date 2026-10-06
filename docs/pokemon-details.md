# Pokémon details, historical sprites, and reveal sound

Every revealed team card now has a Details button. Its dialog shows typing and
abilities for the generation actually rolled, plus standard-generation history
from Gen 1 through Gen 9. Changing the dropdown after a roll does not change that
card’s details. National Dex, Bananza, and Champions use modern species profiles;
their history table describes standard generations, not National Dex ladders.

Species and historical changes come from Pokémon Showdown revision
`9fb3a5b99f1a0bea17f495c5cc1bfe04fdd19c3e`:
https://github.com/smogon/pokemon-showdown/tree/9fb3a5b99f1a0bea17f495c5cc1bfe04fdd19c3e/data
The generated data is cached locally in `data/pokemon-details.js`, so opening
Details does not require a live API call. It covers all 853 exact species/form
IDs across the pools, including Bananza-only entries.

Historical generation modifications are inherited from Gen 9 backwards.
Gen 1–2 have no abilities, hidden abilities start in Gen 5, and Gen 3 excludes
secondary abilities introduced in Gen 4. Cosmetic forms inherit their confirmed
base profile; no unrelated form is substituted for an unknown species.

Tier snapshots prefer the existing per-generation pool records. Other forms use
Showdown’s historical standard tier data, including its form-tier inheritance.
Borderline bans map to the next legal generator tier and retain their original
label. These are snapshot tiers, not an all-time maximum across a generation’s
competitive history. Unavailable forms and unintroduced species are explicit.

Usage is the unweighted (`-0.txt`) Smogon percentage and rank in that exact form’s
highest legal tier ladder. It is independent of the generator’s pull probability
and does not replace the original usage input used to weight pulls.

| Generation | Usage snapshot |
| --- | --- |
| 1 | June 2020 |
| 2 | July 2020 |
| 3 | August 2016; Ubers December 2016 |
| 4 | August 2016 |
| 5 | March 2016 |
| 6 | August 2017 |
| 7 | October 2019 |
| 8 | October 2022 |
| 9 | August 2026 |

Example source: https://www.smogon.com/stats/2026-08/gen9uu-0.txt
Every recorded row links its actual ladder and date. Missing ladders are labelled
“No published ladder for this snapshot.” A published table without the exact form
says “No recorded usage for this exact form”; neither is displayed as zero usage.

To regenerate on Node 24+ and Python 3 with public internet access:

```sh
node scripts/export-detail-pools.cjs
python scripts/fetch-detail-species.py
python scripts/fetch-detail-stats.py
node scripts/build-pokemon-details.cjs
node tests/details.test.cjs
node tests/odds.test.cjs --simulate
```

The download scripts cache intermediate data under `.build/`. Commit only the
generated details file and intentional source changes. The species revision is
pinned so rebuilding does not silently change historical profiles.

Gen 1–4 sprites use only the selected generation’s PNG directory. Gen 5 tries
`gen5ani` animations, then Gen 5 PNGs. Gen 6+ retains the existing `ani` and
`xyani` behavior, including National Dex and Bananza. Exact-form filename aliases
are tried within each era; a missing old asset is not replaced by a modern one.
Official sprite directory: https://play.pokemonshowdown.com/sprites/

The final chime delay is 650 ms for UU and lower tiers, 1,100 ms for OU, and 1,350 ms
for Uber: Uber’s final tone arrives 250 ms later than OU. Frequencies and the
other reveal timing stay unchanged.

The approved featured lists and neon reveal treatment are documented in
`featured-pulls.md`. Listed Pokémon use 0.50× within-tier weight when Uber,
0.75× when OU, and the existing 0.10× AG weight when applicable. The broader
OU/Uber tier probabilities are preserved.

Rarity presentation uses the original colored probability badges: Rare (≤1%),
Very Rare (≤0.1%), and Extremely Rare (≤0.01%), alongside “1 in …” odds.
Only OU, Uber, and AG can show these badges, on cards and above the reveal orb.
UU and below show no rarity or individual-odds line. Qualifying Pokémon above
1% show their OU+ comparison number without a qualitative rarity label. Curated categories remain
separate from displayed rarity and continue to set within-tier selection weights.
The approved Uber/OU lists now control curated group membership.

The displayed numbers compare only eligible OU, Rare OU, Uber, Rare Uber, and
AG Pokémon in the selected pool, maximum tier, and odds setting. They use the
full pool before team exclusions. Lower tiers do not contribute. The cards and
reveal explicitly say “among OU+ pulls”; actual all-tier roll chances are kept
separately. See `odds-balancing.md` for the formula and Mewtwo examples.
