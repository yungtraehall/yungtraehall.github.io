# Featured pulls

The approved selection contains 51 exact forms: 42 from the Uber list (including
all 18 Arceus types), and nine from the OU list. A listed Pokémon receives the
treatment when its selected pool classifies it as OU, Uber, or AG. Its current
tier controls color and weight: burgundy `#800020` and 0.75× for OU, magenta
`#DF00FF` and 0.50× for Uber. AG retains 0.10× and uses gold `#ffe7a6`
for its cards, badges, portal, frame, glow, and reveal effects. UU and below
keep ordinary tier styling while also displaying probability rarity badges.

## Approved Uber forms

Groudon-Primal, Zacian-Crowned, Zacian, Zamazenta-Crowned, Solgaleo,
Necrozma-Dusk-Mane, Necrozma-Dawn-Wings, Necrozma-Ultra, Kyogre-Primal,
Marshadow, Zygarde, Zygarde-Complete, Lunala,
Eternatus, Rayquaza, Blaziken-Mega, Lucario-Mega, Calyrex-Ice, Naganadel,
Spectrier, Giratina-Origin, Gengar-Mega, Mewtwo-Mega-X, Mewtwo-Mega-Y,
and Arceus (Normal plus Bug, Dark, Dragon, Electric, Fairy, Fighting, Fire,
Flying, Ghost, Grass, Ground, Ice, Poison, Psychic, Rock, Steel, Water).

The supplied name “Necrozma-Dawn-Mane” is resolved to the existing
Necrozma-Dawn-Wings form. Exact form IDs prevent these entries from also
selecting regular Groudon/Kyogre, regular Mewtwo, Mega Rayquaza, or Mega Garchomp.
The previous placeholder Kyogre entry is replaced by the requested Primal form.

## Approved OU entries

Dragapult, Garchomp, Kingambit, Gholdengo, Ogerpon-Wellspring, Zamazenta,
Volcarona, Kyurem (supplied as “Kyreum”), Raichu-Mega-Y.

## Presentation

- Listed pulls have a matching tier badge, category label, colored card border,
  and neon glow. Rarity badges appear on every Pokémon and show the actual
  percentage chance for that draw slot. Common, Rare, Very Rare, and Ultra Rare
  labels and badge colors follow unrounded probability using the thresholds in
  `odds-balancing.md`. Featured/AG categories do not impose a minimum label.
  Featured frames remain burgundy/magenta/gold independently of the rarity badge.
- The reveal has a neon frame, a single expanding halo, a colored sprite glow,
  and a featured label. The screenshot-based layout puts the percentage rarity
  above a centered orb, name at the lower left, usage at the lower right, and
  tier and Continue below. Font sizes adapt to narrower screens.
- Usage displays the exact form's rank, generated-tier ladder, percentage, and
  snapshot date (e.g. Kyurem: `Rank #74 · Gen5OU`, `1.516% Usage · 2016-03`,
  or `Rank #12 · Gen9OU`, `12.023% Usage · 2026-08`). It uses that tier's
  history record, not an unrelated OU/Uber export. If matching usage is absent
  (including National Dex and Bananza), it falls back to the exact form's best
  historical usage rank, then higher usage percentage and newer generation for
  ties. The fallback displays its actual ladder and date; its tooltip explains
  the historical source. Yveltal shows `Rank #1 · Gen8Uber`,
  `38.334% Usage · 2022-10`. Champions prefers its own cached OU ladder for OU
  Pokémon. Forms with no recorded history remain unavailable, never zero.
- On every Rare OU, Uber, and AG pull, the colored portal begins as the
  silhouette appears. When the name and full sprite resolve, a transparent
  full typing appears as translucent text (for example, `Bug ◆ Steel`) in front
  of the sprite, within a circular layer aligned to the orb, and fades out
  slowly after the full sprite appears. Type sigils are omitted.
  AG keeps its larger gold shockwave as an extra flourish.
- Rare OU opens a thin burgundy rift behind the silhouette; it seals as the
  full sprite and name appear. Every Uber, including AG, gets 12 soft rising
  stardust particles for up to 2.6 seconds after the full reveal. Both groups
  get a single 1.05-second holographic sprite sweep. Background effects are
  children of the actual orb and are clipped by its circular boundary; the
  shine follows the sprite's transparent outline and exact-generation fallback.
  These accents start with the reveal, without waiting for the audio to finish,
  and all disappear without looping. Ordinary OU and lower tiers omit them.
- Rare OU, any Uber (ordinary or featured), and AG play the user-supplied
  `audio/rare-reveal.wav` when the Pokémon appears. This replaces the synthesized
  flourishes. The 2.936-second WAV is copied unchanged from the latest attachment,
  played at 0.55 gain, and stopped when leaving the reveal. It loads once through
  Web Audio; unavailable/blocked audio does not interrupt generation. Late loads
  are cancelled on Continue. Ordinary OU and UU/below do not play the clip.
- UU uses the normal 650 ms final-tone spacing. OU keeps 1,100 ms and Uber keeps
  1,350 ms (250 ms beyond OU).
- Reduced motion uses a static frame and glow, with no portal, crystal,
  shockwave, rift, stardust, holographic sweep, or audio clip.
- Within the strongest tier of the team, a listed Pokémon takes reveal priority.
  This is deterministic and does not reroll the team or alter its probabilities.
- The reveal and card classes reset between pulls. The fully revealed sprite
  stays visible even when the probability badge is Ultra Rare.

## Validation

`node tests/odds.test.cjs --simulate` checks every approved ID against the actual
pools, all rarity thresholds, exact-form exclusions, tier-dependent colors and
weights, preview priority, normal/reduced-motion reveal reset, uploaded audio eligibility/cancellation. It also runs the production 100,000-team Generation 9 Uber++ simulation.
The latest tier totals are approximately 7.04% Uber, 37.83% OU, and 25.13% UU; the lists
redistribute individual chances within each tier.

## Bananza type pools

Bananza has All types plus the 18 standard types. Each exact form is matched
against the cached modern species typing; either type of a dual-type Pokémon
qualifies. Type filtering applies to the generator, console simulations, and the
draw-slot probability calculation. The result details retain the selected type even
if the dropdown later changes. Other pools ignore the hidden type selection.
