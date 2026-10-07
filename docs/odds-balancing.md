# Tier odds and rarity plan

## Tier profiles

Percentages below are per Pokemon slot, with Uber as the maximum and every tier represented. The odds settings affect probability; the selected Maximum Tier controls eligibility.

| Tier | -- | - | = | + | ++ |
| --- | ---: | ---: | ---: | ---: | ---: |
| Uber | 1% | 1.5% | 2.5% | 4.5% | 7% |
| OU | 6.5% | 10.75% | 21.5% | 30% | 37.9% |
| UU | 12.5% | 18.75% | 22% | 23.5% | 25.1% |
| RU | 20% | 21% | 22% | 21% | 18% |
| NU | 22% | 20% | 16% | 12% | 9% |
| PU | 20% | 16% | 10% | 6% | 2% |
| ZU | 18% | 12% | 6% | 3% | 1% |

The latest balance moves 0.5, 0.75, 1, 0.5, and 0.1 percentage points from OU to UU at --, -, =, +, and ++ respectively. All other tier weights are preserved. In particular, ++ changes only from 38% OU / 25% UU to 37.9% OU / 25.1% UU. The revised profiles retain the earlier overall OU/Uber boost.

Lower maximum tiers remove stronger tier weights and normalize the remaining weights. A tier absent from the pool folds into the nearest weaker tier, or the nearest stronger tier if none exists below it. This preserves the previous handling of historical and Champions pools. A tier exhausted by selecting its last member rebalances among remaining tiers. Teams still contain six distinct Pokemon/forms.

OU and Uber keep their existing individual usage adjustment. UU and lower are equal within their tiers. The tier increase therefore also increases individual OU and Uber chances.

## Displayed rarity

Every Pokémon, from ZU through AG, shows its actual draw-slot probability, formatted as a percentage: `Rare · 0.26% Chance` for a 1-in-392 chance. All tiers use the same probability thresholds and colors. This replaces the earlier OU-and-above-only badges and comparison among OU+ pulls.

The probability is the product of the chance to select the Pokémon's tier and its weighted share of the remaining Pokémon in that tier. It uses the selected generation/pool, Bananza type filter, maximum tier, Odds setting, missing-tier folding, and exclusions from earlier picks in this team. It describes the chance at that particular draw, rather than the chance of obtaining the Pokémon anywhere in a six-Pokémon team. Generation stores `pullProbability` with each result; later dropdown changes do not relabel an already generated team. The OU/UU profile adjustment is automatically reflected in each generated percentage and rarity color.

| Rarity | Actual slot chance | Badge color |
| --- | --- | --- |
| Common | ≥1% | Muted green |
| Rare | ≥0.10% and <1% | Blue |
| Very Rare | ≥0.01% and <0.10% | Purple |
| Ultra Rare | <0.01% | Gold |

Classifications use the unrounded probability. Percentages normally use two decimals; tiny chances retain significant digits so a positive chance never displays as zero. Extra precision is also kept whenever rounding would imply a different rarity level. Rarity colors appear on both result badges and the reveal odds line. Category styling is separate: Rare OU uses burgundy, Featured Ubers use magenta, and AG uses the Ultra Rare text gold (#ffe7a6). Category minimum labels are removed so changing Odds can move even a featured/AG Pokémon between rarity levels.

Rare OU uses a 0.70× individual weight (previously 0.75×), and Rare Uber uses
0.45× (previously 0.50×). Their pull chances decrease relative to other Pokémon
in the same tier. Tier profiles and AG's 0.10× modifier are preserved; displayed
percentages and colors use the new actual draw-slot probabilities.

At Uber++ in the first draw slot, Mewtwo has approximately 2.98% chance in Gen 1, 0.0995% in National Dex, and 0.0988% in Bananza with these category weights. The last two remain Very Rare. Strengthening Odds increases the OU/Uber chances when those tiers compete with lower tiers. If a type filter leaves only one available tier, its share is already 100%, and changing tier Odds cannot increase it further.

## Individual rarity categories

The reviewed category multipliers now apply within each tier. The user-approved lists contain 42 Uber forms and nine OU Pokémon; see `featured-pulls.md`. Listed Pokémon follow their actual pool tier when applying the 0.50× Uber or 0.75× OU modifier.

| Category | Multiplier | Pokemon |
| --- | ---: | --- |
| AG | 0.10x | Calyrex-Shadow, Koraidon, Miraidon, Rayquaza-Mega, Xerneas; Bananza only |
| Featured rare Ubers | 0.50x | 42 approved forms, including all 18 Arceus types (see `featured-pulls.md`) |
| Other Ubers | 1.00x | Includes Ho-Oh |
| Selected rare OU | 0.75x | Dragapult, Garchomp, Kingambit, Gholdengo, Ogerpon-Wellspring, Zamazenta, Volcarona, Kyurem, Raichu-Mega-Y |
| Other OU | 1.00x | Remaining OU entries |
| UU and lower | 1.00x | Equal within each tier |

Zacian-Crowned has no separate category. Category multipliers divide up their tier's share, rather than change how often the tier itself is rolled.

## Verification

Observed Generation 9 / Uber / ++ run: 100,000 teams, 600,000 Pokemon slots.

| Tier | Target | Simulation |
| --- | ---: | ---: |
| Uber | 7% | 7.04% |
| OU | 37.9% | 37.83% |
| UU | 25.1% | 25.13% |
| RU | 18% | 17.96% |
| NU | 9% | 9.01% |
| PU | 2% | 2.02% |
| ZU | 1% | 1.00% |

35.44% of teams contained at least one Uber. Combined PU/ZU pulls were 3.03% of slots.

Run the fast checks with `node tests/odds.test.cjs`.

Run the requested 100,000-team simulation with `node tests/odds.test.cjs --simulate`. This loads the actual production datasets and generator, calls `simulateTeams(100000)` with Generation 9 / Uber / ++, and checks all tier percentages against the profile. It also checks every pool's valid ceiling/odds combinations, duplicate prevention, equal lower-tier weights, AG probability, and Bananza's ceiling behavior.

The website console still supports `simulateTeams(100000)` using the current dropdown selections. Its returned report distinguishes Pokemon-slot percentages from the percentage of teams containing at least one Uber.
