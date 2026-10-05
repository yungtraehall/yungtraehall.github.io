# Featured pulls

The approved selection contains 44 exact forms: 38 from the Uber list (including
all 18 Arceus types), and six from the OU list. A listed Pokémon receives the
treatment when its selected pool classifies it as OU, Uber, or AG. Its current
tier controls color and weight: burgundy `#800020` and 0.75× for OU, magenta
`#DF00FF` and 0.50× for Uber. AG retains 0.10× and uses the magenta treatment
when the exact form is listed. UU and below remain ordinary pulls.

## Approved Uber forms

Groudon-Primal, Zacian-Crowned, Zacian, Zamazenta-Crowned, Solgaleo,
Necrozma-Dusk-Mane, Necrozma-Dawn-Wings, Necrozma-Ultra, Kyogre-Primal,
Eternatus, Rayquaza, Blaziken-Mega, Lucario-Mega, Calyrex-Ice, Naganadel,
Spectrier, Giratina-Origin, Gengar-Mega, Mewtwo-Mega-X, Mewtwo-Mega-Y,
and Arceus (Normal plus Bug, Dark, Dragon, Electric, Fairy, Fighting, Fire,
Flying, Ghost, Grass, Ground, Ice, Poison, Psychic, Rock, Steel, Water).

The supplied name “Necrozma-Dawn-Mane” is resolved to the existing
Necrozma-Dawn-Wings form. Exact form IDs prevent these entries from also
selecting regular Groudon/Kyogre, regular Mewtwo, Mega Rayquaza, or Mega Garchomp.
The previous placeholder Kyogre entry is replaced by the requested Primal form.

## Approved OU entries

Dragapult, Garchomp, Kingambit, Gholdengo, Ogerpon-Wellspring, Zamazenta.

## Presentation

- Listed pulls have a matching tier badge, category label, colored card border,
  and neon glow. Probability-based rarity labels still appear only at OU and
  above, using the previous thresholds and numerical odds.
- The reveal has a neon frame, a single expanding halo, a colored sprite glow,
  and a featured label. The odds stay above the orb with space above the label.
- Uber gets a four-note ascending flourish; OU gets a softer three-note flourish.
  These play after the Pokémon appears, at modest volume, without changing the
  three-tone buildup or Uber's extra 0.25-second final-tone pause.
- Reduced motion uses a static frame and glow, with no halo or flourish.
- Within the strongest tier of the team, a listed Pokémon takes reveal priority.
  This is deterministic and does not reroll the team or alter its probabilities.
- The reveal and card classes reset between pulls. The fully revealed sprite
  stays visible even when the probability badge is Extremely Rare.

## Validation

`node tests/odds.test.cjs --simulate` checks every approved ID against the actual
pools, all rarity thresholds, exact-form exclusions, tier-dependent colors and
weights, preview priority, normal/reduced-motion reveal reset, and audio note
counts. It also runs the production 100,000-team Generation 9 Uber++ simulation.
The tier totals remain approximately 7.04% Uber and 37.94% OU; the new lists
redistribute individual chances within each tier.
