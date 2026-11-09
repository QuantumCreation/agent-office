# Work-furniture asset manifest

Built by the scripts in `assets/blender/` (each imports `lib` and `lib_work`). They export to `public/models/<name>.glb` and render previews to `assets/previews/<name>.png`.
Sizes are the `ASSET` line bounds (x × y × z, in meters). Front faces -Y. Floor and desk items have their origin at the footprint center on the surface they stand on. Wall items have their origin on the floor at the wall: back at y = 0, extending toward -Y.

Note: glTF is Y-up. A Blender point (x, y, z) becomes (x, z, -y) in the exported file and in the game.

## Desks and workstation

| Asset | Size (x × y × z) | Tris | Mats | Notes |
|---|---|---|---|---|
| `bench_desk` | 1.60 × 0.80 × 0.74 | 2156 | 4 | Oak top 30 mm thick, surface at z = 0.74. Charcoal sled-loop legs at x = ±0.72. Cable tray under the +Y edge (z ≈ 0.6) with cables in it. Slate modesty panel at y = +0.33, z 0.43–0.69. |
| `monitor` | 0.62 × 0.19 × 0.53 | 1026 | 4 | Base 0.22 × 0.18 centered at the origin. Panel 0.62 × 0.38 × 0.03, center (0, 0.03, 0.34). **Screen face `screen`: center (0, 0.014, 0.34) in Blender (glTF: (0, 0.34, -0.014)). Plane y = 0.014 (bezel front at 0.015, 1 mm proud). Exactly 0.58 × 0.34. A single quad facing -Y.** `emissive_led` on the bottom-right bezel. |
| `keyboard` | 0.42 × 0.14 × 0.02 | 896 | 3 | 5 key rows. Two keys use `accent_key`. |
| `mouse` | 0.06 × 0.11 × 0.04 | 520 | 2 | Buttons toward -Y. |
| `mug` / `mug_b` | 0.11 × 0.08 × 0.09 | 932 | 3 | Coral with a cream band / sky with a navy band. Coffee inside. Handle on +X. |
| `laptop` | 0.33 × 0.28 × 0.23 | 1222 | 4 | Open about 105°, lid leaning back 15°. Screen face `screen` 0.296 × 0.188, center (0, 0.135, 0.130), tilted 15° back (facing -Y and slightly up). Base 0.33 × 0.23 centered at the origin. |
| `desk_lamp` | 0.16 × 0.34 × 0.38 | 1340 | 3 | Butter architect lamp. Base at the origin, arm reaching toward -Y. `emissive_bulb` inside the shade. |
| `notebook_stack` | 0.24 × 0.30 × 0.05 | 732 | 6 | 3 notebooks (navy, coral, sage) with a pen on top. |
| `pen_cup` | 0.12 × 0.10 × 0.18 | 632 | 6 | Sage cup with 3 pens, a pencil and a ruler. |
| `photo_frame` | 0.18 × 0.08 × 0.13 | 438 | 5 | Walnut frame leaning back on a kickstand. The picture is sun and hills made of geometry. |
| `succulent` | 0.16 × 0.16 × 0.10 | 1496 | 4 | Terracotta pot, echeveria rosette. 0.10 tall. |
| `headphones` | 0.30 × 0.22 × 0.05 | 1300 | 3 | Lying flat. Cup shells are `accent_shell`. Band arcs toward +Y. |
| `desk_divider` | 1.60 × 0.06 × 0.42 | 1268 | 3 | `accent_felt` panel in a chrome tube frame with a top cap rail. Two charcoal clamps at x = ±0.5. The clamp blocks are 0.05 deep, so the y extent is 0.06; the panel itself is 0.04. |
| `pedestal_drawers` | 0.40 × 0.57 × 0.58 | 1696 | 4 | White with 3 drawers (2 shallow, 1 file). Bar handles stick out 0.02 past y = -0.275. Charcoal casters. |

## Seating

| Asset | Size | Tris | Mats | Notes |
|---|---|---|---|---|
| `meeting_chair` | 0.52 × 0.62 × 0.90 | 3156 | 3 | Chrome sled base with arms. Seat top at 0.47 (cushion top 0.47). `accent_fabric` seat and back, white shell. The back leans to +Y, which makes the footprint 0.62 deep. |
| `bar_stool` | 0.40 × 0.40 × 0.75 | 2424 | 3 | Seat top at 0.75, Ø 0.40, `accent_fabric`. Four splayed charcoal legs and a steel footring at 0.28. |

## Tables (oak tops, charcoal frames)

| Asset | Size | Tris | Mats | Notes |
|---|---|---|---|---|
| `table_conference` | 1.20 × 3.60 × 0.74 | 1616 | 4 | Two panel legs at y = ±1.25 with a spine beam. Cable port (steel lid) at the center of the top. |
| `table_meeting` | 1.20 × 2.60 × 0.74 | 1616 | 4 | Same design, legs at y = ±0.85, cable port in the center. |
| `table_small` | 1.00 × 0.60 × 0.74 | 2024 | 3 | Four tapered round legs with an apron. |
| `table_round` | 1.20 × 1.20 × 0.74 | 1784 | 3 | Pedestal with a disc base. |
| `table_cafe` | 0.90 × 0.90 × 0.74 | 2472 | 3 | Pedestal with a 4-star foot. |
| `side_table` | 0.50 × 0.50 × 0.55 | 1436 | 3 | Three splayed legs and a lower oak shelf. |
| `high_table` | 1.20 × 1.80 × 1.05 | 2076 | 4 | Four square legs, apron, steel footrest ring at z = 0.30 just outside the legs. |
| `bar_counter` | 6.00 × 0.60 × 1.05 | 2548 | 4 | Oak top on 4 slim T-supports set toward +Y (the window). Steel footrail on the -Y side at y = -0.21, z = 0.24, with returns at the ends. |

## Storage and equipment

| Asset | Size | Tris | Mats | Notes |
|---|---|---|---|---|
| `credenza` | 2.40 × 0.50 × 1.39 | 4880 | 6 | Cabinet 0.72 tall: 2 doors and 2 banks of 3 drawers, charcoal legs. Height 1.39 includes the potted plant on top (left). Books on the right, stacked flat and standing upright. Top surface at z = 0.72. |
| `bookshelf` | 2.00 × 0.38 × 2.00 | 5914 | 6 | Two bays, 5 levels (4 shelves + plinth + top). Books, box files, a globe, vases, a trailing plant, a bushy plant and a deco box. Open front at -Y. |
| `bookshelf_b` | 2.00 × 0.38 × 2.00 | 6834 | 6 | Same carcass with a different arrangement (2 pothos, 2 bushy plants, a globe, box files in two colors, vases). |
| `printer` | 0.70 × 0.67 × 1.05 | 2168 | 6 | Copier: 3-tray cabinet on casters, output bay with paper, scanner and feeder. The tilted control panel has `emissive_display` and `emissive_led`. The panel overhangs the front by 0.02, so the depth is 0.67. |
| `filing_cabinet` | 0.45 × 0.61 × 1.30 | 1404 | 4 | Sage steel, 4 drawers with recessed pulls and label holders. |
| `trash_bin` | 0.31 × 0.31 × 0.45 | 936 | 3 | Open slate tub with paper balls inside. |
| `recycling_bin` | 0.31 × 0.31 × 0.45 | 1632 | 4 | Blue tub, navy lid with a round opening, white recycle badge on the front. |
| `reception_desk` | 2.60 × 0.80 × 1.46 | 6874 | 6 | White front body, y -0.40 to -0.10, with oak slats and an `accent_stripe` band. Oak transaction ledge at z = 1.08. Receptionist work surface at z = 0.74 on +Y, with an end panel and a drawer pedestal. Monitor (back toward visitors; `screen` faces +Y), keyboard and plant on the work surface. The height 1.46 is the plant. **Deviation:** the service bell sits on the visitor ledge, not the work surface, so visitors can reach it. |
| `coat_rack` | 0.47 × 0.52 × 1.80 | 4356 | 5 | Charcoal dome base, oak pole and 6 hooks (1.75 to the finial; the hat makes it 1.80). Mustard coat, coral scarf, navy hat. Umbrella ring. |

## Wall-mounted (origin on the floor at the wall, back at y = 0)

| Asset | Size | Tris | Mats | Notes |
|---|---|---|---|---|
| `tv` | 2.20 × 0.06 × 1.24 | 354 | 4 | Center z = 1.55, front face at y = -0.06. **Screen face `screen`: center (0, -0.0605, 1.55) in Blender (glTF: (0, 1.55, 0.0605)). 2.17 × 1.20, a single quad facing -Y.** Small `emissive_led` under the screen. |
| `whiteboard` | 2.40 × 0.07 × 1.17 | 3256 | 6 | Board 2.4 × 1.15, center z = 1.45, white surface at y = -0.018. Aluminum frame. Tray (y extent 0.07) holds red, blue and green markers and an eraser. Doodles: bar chart, trend arrow, flow boxes, a circle, scribble lines and sticky notes. |
| `wall_art_a` | 0.80 × 0.04 × 1.00 | 976 | 6 | Center z = 1.6. Oak frame on cream: half-sun, arches, butter sun and dots on a navy ground. |
| `wall_art_b` | 1.20 × 0.03 × 0.80 | 1348 | 6 | Center z = 1.6. Charcoal frame: Bauhaus blocks, a rainbow, a quarter circle and dots. |
| `wall_art_c` | 0.60 × 0.03 × 0.60 | 680 | 6 | Center z = 1.6. White frame: four quarter-circle tiles (lilac, peach, sage, navy) and a center dot. |
| `wall_clock` | 0.35 × 0.05 × 0.35 | 1288 | 4 | Center z = 2.2. `accent_rim` ring, white face, ticks, hands at 10:10, terracotta second hand. |

## Material naming used

- `accent*`: `accent_fabric` (meeting_chair, bar_stool), `accent_felt` (desk_divider), `accent_stripe` (reception_desk), `accent_shell` (headphones), `accent_key` (keyboard), `accent_rim` (wall_clock).
- `screen`: monitor, laptop, tv, reception_desk (rear-facing monitor).
- `emissive*`: `emissive_led` (monitor, tv, printer), `emissive_display` (printer), `emissive_bulb` (desk_lamp).
- No `glass*` materials.

## Helpers

`assets/blender/lib_work.py` holds extra helpers:

- `rrect`, `circle_pts`, `sector_pts`: 2D outlines.
- `wall_shape`, `wall_slab`, `wall_disc`, `wall_frame`, `quad`: wall-facing geometry and single-quad screens.
- `ptube`: a tube that doesn't twist.
- `rounded_path`, `loop_tube`, `ring_lathe`, `hollow_lathe`.
- `pot`, `leafy_plant`.
- `xf`: rotate about a pivot.
- `done(name, report=..., views=...)`: calls `finish()`, then prints the material list and the bounds of a material such as the screen. Extra preview angles render only when `EXTRA_VIEW_DIR` is set.
