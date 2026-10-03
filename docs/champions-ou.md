# Pokémon Champions OU pool

The Pool menu now includes **Pokémon Champions OU**. It uses the supplied
Showdown Champions OU list, rather than the normal Generation 9 list.

| Generator tier | Eligible Pokémon/forms |
| --- | ---: |
| OU | 49 |
| UU | 74 |
| RU | 215 |
| Total | 338 |

The supplied list contained 339 entries. Pikachu is excluded because it is NFE
and Raichu is available. No other entry has an available evolution in this
pool. Farfetch’d stays eligible: its Galarian form is the one that evolves into
Sirfetch’d. Mega and regional forms remain separate entries, as in the existing
pools. Species Clause and a limit of one Mega per roll are not added.

Showdown labels are preserved in `sourceTier`. OU by technicality, shown as
`(OU)`, and UUBL map to the generator’s OU bucket. The OU-only snapshot does
not provide banned Uber Pokémon, so the pool does not add them.

Maximum Tier permits RU, UU, and OU. Selecting Champions while Uber is selected
moves the ceiling to OU; selecting it from ZU/PU/NU moves the ceiling to RU.
Switching back to another generation restores that generation’s available
ceilings.

## Usage and provisional odds

Usage comes from [Smogon September 2026 Champions OU, rating 0](https://www.smogon.com/stats/2026-09/gen9championsou-0.txt),
covering 145,642 battles. Rating 0 includes all ladder players, consistent with
the existing datasets. Usage is matched by exact Pokémon/form name.
328 eligible entries have usage records. The other 10 retain the neutral 1.00
modifier; another form’s usage is not copied onto them. Their names are recorded
in `CHAMPIONS_OU_DATASET_META.usageMissing`.

The existing Hybrid v0.1 model is retained, including within-tier usage
adjustments and the five odds settings. Final odds tuning remains future work.
The current build applies usage adjustments to every populated tier; this
addition preserves that behavior rather than implementing the proposed future
OU/Uber-only adjustment rule.

With OU as the maximum and standard `=` odds, the first Pokémon’s tier chances
are approximately RU 84.42%, UU 10.05%, OU 5.53%. These are **per first slot**,
not the chance of a whole pack containing that tier. The existing model folds
missing ZU/PU/NU weights into RU. Subsequent draws remove the chosen entry,
ensuring six distinct entries per roll.

## Validation

Run `node tests/validate-champions.cjs` from the repository root.

The check covers dataset counts, unique IDs, tier mapping, missing usage,
ceiling availability and switching, 100,005 Champions rolls across all valid
ceilings and odds settings, 100,000 first-slot probability draws, and regression
rolls for Generations 1–9. The seeded standard first-slot simulation produced
84,609 RU, 10,016 UU, and 5,375 OU draws, within 0.5 percentage points of the
expected distribution.

The dataset records the source snapshot’s SHA-256 and the Showdown Pokédex
commit used to verify evolutions. The uploaded HTML itself is not committed
because it also contains account and unrelated team information.

## Sprite backups and visual validation

27 of the 38 forms newly introduced to this project have verified hosted gen5
PNG fallbacks. The other 11 have exact-form, 128×128 PNG backups copied from
[Smogon’s sprite repository](https://github.com/smogon/sprites), commit
`bad55c7b7e7292f459366505460d41dcab08d4cd`, under `src/champions/`.
The existing animated-sprite sequence remains first; local images are the final
fallback. Pokémon artwork belongs to its respective rights holders.

Full browser rendering could not be verified in this workspace because the
browser installation download failed. Generator logic and sprite URL/assets
were checked separately; a visual check in the running website remains pending.
