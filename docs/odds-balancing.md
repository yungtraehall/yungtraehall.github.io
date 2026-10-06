# Tier odds and rarity plan

## Tier profiles

Percentages below are per Pokemon slot, with Uber as the maximum and every tier represented. The odds settings affect probability; the selected Maximum Tier controls eligibility.

| Tier | -- | - | = | + | ++ |
| --- | ---: | ---: | ---: | ---: | ---: |
| Uber | 1% | 1.5% | 2.5% | 4.5% | 7% |
| OU | 7% | 11.5% | 22.5% | 30.5% | 38% |
| UU | 12% | 18% | 21% | 23% | 25% |
| RU | 20% | 21% | 22% | 21% | 18% |
| NU | 22% | 20% | 16% | 12% | 9% |
| PU | 20% | 16% | 10% | 6% | 2% |
| ZU | 18% | 12% | 6% | 3% | 1% |

This replaces the original baseline plus exponential strength modifier, which gave Generation 9 Uber++ about 3.91% Uber, 23.87% OU, 24.11% UU, and 15.98% combined PU/ZU. Each new setting increases OU and Uber shares relative to its previous counterpart.

Lower maximum tiers remove stronger tier weights and normalize the remaining weights. A tier absent from the pool folds into the nearest weaker tier, or the nearest stronger tier if none exists below it. This preserves the previous handling of historical and Champions pools. A tier exhausted by selecting its last member rebalances among remaining tiers. Teams still contain six distinct Pokemon/forms.

OU and Uber keep their existing individual usage adjustment. UU and lower are equal within their tiers. The tier increase therefore also increases the current individual OU and Uber chances. Displayed rarity compares the Pokémon only with eligible OU-and-above Pokémon in the selected pool and settings. It uses the full eligible pool before any team exclusions, so the same Pokémon has a stable number throughout a roll. Lower-tier species counts, weights, missing tiers, and previously drawn Pokémon do not enter this calculation. Displayed numbers are explicitly labelled “among OU+ pulls”; they are not the chance on any roll.

The display calculation is `(tier profile weight / sum of present eligible OU+ tier profile weights) × (Pokémon weight / sum of Pokémon weights in its tier)`. Rare OU and Rare Uber keep their within-tier multipliers; AG remains inside Uber with its 0.10× multiplier. Maximum Tier and Odds settings apply. Pools with no eligible OU+ members have no comparison numbers.

Rare (≤1%), Very Rare (≤0.1%), and Extremely Rare (≤0.01%) colors now use this upper-pool probability. Above 1%, an OU+ Pokémon still shows its comparison number without a qualitative rarity label. UU and below show neither. The separate `pullProbability` field retains the actual slot chance for the unchanged generator; `upperPoolProbability` supplies only the displayed comparison.

For Mewtwo at Uber++, the baseline comparisons are approximately 1 in 15 in Gen 1, 1 in 466 in National Dex, and 1 in 469 in Bananza, among OU+ pulls.

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
| OU | 38% | 37.94% |
| UU | 25% | 25.03% |
| RU | 18% | 17.96% |
| NU | 9% | 9.01% |
| PU | 2% | 2.02% |
| ZU | 1% | 1.00% |

35.43% of teams contained at least one Uber. Combined PU/ZU pulls were 3.03% of slots.

Run the fast checks with `node tests/odds.test.cjs`.

Run the requested 100,000-team simulation with `node tests/odds.test.cjs --simulate`. This loads the actual production datasets and generator, calls `simulateTeams(100000)` with Generation 9 / Uber / ++, and checks all tier percentages against the profile. It also checks every pool's valid ceiling/odds combinations, duplicate prevention, equal lower-tier weights, AG probability, and Bananza's ceiling behavior.

The website console still supports `simulateTeams(100000)` using the current dropdown selections. Its returned report distinguishes Pokemon-slot percentages from the percentage of teams containing at least one Uber.
