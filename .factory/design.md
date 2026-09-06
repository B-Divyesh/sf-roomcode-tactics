# Roomcode Tactics visual thesis

## Direction

Roomcode Tactics is a folded field-map game board. The page opens on a usable
seven-by-seven paper map, not a title screen. Fold lines divide the board into
four map panels; blocked squares read as compact forest blocks; cyan markers
are the objective system. The rough paper panel and ink edges make the board
feel like a finite correspondence game while the surrounding page stays plain
and readable.

## Palette

| Token | Value | Use |
| --- | --- | --- |
| Ink | `#102b27` | text, borders, map linework |
| Forest | `#173d35` | room panel, north scout |
| Forest light | `#42724b` | blocked forest cells |
| Sand | `#e8d7a6` | folded board, surfaces |
| Paper | `#fff9e8` | page and readable fields |
| Cyan | `#19c7d2` | move affordance and map markers |
| Coral | `#ee785c` | south scout and selected move |

The interface is deliberately a light map treatment; it has an optional
high-contrast setting rather than a second theme. Ink on paper and paper on
forest both exceed 4.5:1 contrast. Cyan is paired with outline and text labels,
so it never carries state alone.

## Type, spacing, shape

The type stack uses the device system sans serif for no-download loading and
clear names at small sizes. Headings use tight, heavy letter spacing; body copy
uses normal spacing and a 1.5 line height. The layout uses an 8px rhythm.
Rectangles use 2–3px ink borders and short hard shadows, echoing map folds
instead of generic rounded cards. Board controls maintain a 44px touch target
at the phone breakpoint.

## Interaction and motion

Only legal adjacent cells receive a cyan inset outline. A coral inset marks the
pending choice. Resolutions briefly scale scouts from their board positions;
the effect lasts 300ms and becomes effectively instant under reduced motion.
There is no looping motion, flashing, sound, or screen shake. Arrow keys move
focus across the board; Enter or Space activates a focused legal cell.

## Asset plan and provenance

`public/favicon.svg`, `public/apple-touch-icon.svg`, `public/apple-touch-icon.png`,
`public/social-card.svg`, and `public/social-card.png` are hand-made folded-map
compositions; the game board is drawn with product CSS. `public/folded-map.webp` is an original generated
background texture, used at low opacity beneath the playable board. Its source
is `assets/src/folded-map-source.png`; the exact prompt and factory-image
deployment metadata are in its adjacent JSON sidecar (generated 2026-09-05).
It was reviewed for text, watermark, brand, and map-art artifacts before use.
No stock imagery, third-party fonts, copied maps, or external art is loaded.

## Board content

Real rooms use a deterministic generator. Every room stores one visible
`RCT-` map seed, so a reload or service restart recreates the same seven-by-seven
board. The seed sequence cycles through difficulty 1–5: each level adds one
ordinary blocked trail, then repeats with a new seeded layout. The protected
centre corridor keeps the short five-turn match fair while the outer routes
become progressively tighter.

Weather is a game rule, not a label. Rain, mist, and dry wind close two marked
trails, and the service rejects a move onto those weather closures. Objective
rules also rotate: all markers can be worth one point, the centre can be worth
two, or the two outer markers can be worth two. The board shows each rule and
the value of every two-point marker. Higher score wins after turn five; equal
scores draw. The sample always uses Cypress Pass so tests and first-time play
remain deterministic.
