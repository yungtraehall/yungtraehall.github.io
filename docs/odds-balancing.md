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

OU and Uber keep their existing individual usage adjustment. UU and lower are equal within their tiers. The tier increase therefore also increases the current individual OU and Uber chances. Rarity badges use the actual conditional chance for the slot, including removal of previous picks, and are displayed only for OU, Uber, and AG. The original colored presentation is restored: Rare at ≤1%, Very Rare at ≤0.1%, and Extremely Rare at ≤0.01%. UU and below show no rarity label or individual-odds line. Curated rarity categories continue to affect within-tier weights independently of the probability-based display.

## Individual rarity categories

The reviewed category multipliers now apply within each tier. The Rare OU category is ready but has no members until the user supplies the list.

| Category | Multiplier | Pokemon |
| --- | ---: | --- |
| AG | 0.10x | Calyrex-Shadow, Koraidon, Miraidon, Rayquaza-Mega, Xerneas; Bananza only |
| Featured rare Ubers | 0.50x | Calyrex-Ice, Kyogre, Eternatus, Necrozma-Dusk-Mane, Zacian-Crowned |
| Other Ubers | 1.00x | Includes Ho-Oh |
| Selected rare OU | 0.75x | Specific entries still need to be chosen |
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
