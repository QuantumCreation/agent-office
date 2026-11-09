# Home / lounge / kitchen assets

Built with `lib.py` plus `lib_home.py`, which adds leaves, monstera leaves, soft boxes, pillows, pots, a twist-free tube, cabinet fronts, and `finish_hung` for ceiling items. Each asset has one script in `assets/blender/`. Sizes and triangle counts below come from the `ASSET ...` line (bounding box x × y × z, in meters).

| Asset | Size (m) | Tris | Script | Notes |
|---|---|---|---|---|
| `sofa` | 3.02 × 0.95 × 0.84 | 3776 | sofa.py | Seat top 0.45. Upholstery is `fabric_sofa` (sage). The 2 throw pillows use `accent_pillow`, so they take the floor theme color. Walnut peg legs. The arms bulge about 1 cm past 3.0. |
| `armchair` | 0.89 × 0.86 × 0.88 | 2068 | armchair.py | Mid-century walnut frame with wooden arms. Seat top 0.45. Seat, back and lumbar pillow use `fabric_armchair` (peach). |
| `coffee_table` | 1.60 × 0.80 × 0.56 | 3208 | coffee_table.py | Oak top at 0.40, slatted lower shelf. Books, a mug and a small potted plant on top, more books on the shelf. The height includes the plant. |
| `beanbag` | 0.90 × 0.90 × 0.57 | 1224 | beanbag.py | One deformed mesh: flattened base, back raised at +Y, seat dimple, soft wrinkles. `fabric_beanbag`. |
| `floor_lamp` | 0.44 × 1.31 × 1.91 | 1980 | floor_lamp.py | Origin is the center of the marble base. The brass arc reaches 0.92 m toward -Y, and the shade is centered at (0, -0.92). `emissive_shade` dome with a bulb. |
| `pendant_lamp` | 0.45 × 0.45 × 1.01 | 2400 | pendant_lamp.py | Origin at the ceiling, everything below z = 0. Canopy, 0.75 m cable, Ø 0.45 dome. The shade is `accent_shade` with a white inside and an `emissive_bulb`. |
| `pendant_lamp_linear` | 1.41 × 0.11 × 0.84 | 1020 | pendant_lamp.py | Origin at the ceiling. Hangs on two cables at x = ±0.55. 1.4 m `accent_shade` bar with an `emissive_bulb` strip underneath. |
| `plant_monstera` | 1.16 × 1.16 × 1.07 | 4768 | plant_monstera.py | Terracotta pot Ø 0.42. 13 split, heart-shaped leaves on petioles plus a young furled leaf. |
| `plant_fiddle` | 0.87 × 0.80 × 1.69 | 5888 | plant_fiddle.py | White pot Ø 0.45. Trunk and 4 branches carrying about 43 broad, violin-shaped leaves. |
| `plant_snake` | 0.42 × 0.46 × 0.78 | 2536 | plant_snake.py | Blush ceramic pot. 13 upright sword leaves in two greens. |
| `plant_small` | 0.31 × 0.28 × 0.26 | 2896 | plant_small.py | Coin plant (Pilea) in a mint pot with a saucer. Pot Ø 0.13, leaves spread to about 0.3. |
| `plant_hanging` | 0.47 × 0.41 × 0.92 | 4784 | plant_hanging.py | Origin at the ceiling hook. Macramé hanger, white pot, leafy crown, 8 trailing pothos vines. Drops 0.92. |
| `planter_box` | 1.97 × 0.73 × 0.94 | 4792 | planter_box.py | The box is exactly 1.6 × 0.4 × 0.5 (white with an oak plinth and rim). Foliage spills past it, which gives the bounding box above. Mixed lance clumps, bushes, grasses and ground cover. Scales along x without problems. |
| `kitchen_counter` | 4.60 × 0.67 × 2.23 | 4496 | kitchen_counter.py | Worktop at 0.90, sage cabinets, white backsplash. Upper cabinets run from 1.45 to 2.2 (crown to 2.23) and are 0.35 deep at +Y. Inset sink at x = -1.3 with a gooseneck faucet. Fruit bowl at x = -1.95, kettle at x = +0.5, paper towels at x = +2.05. **The worktop is clear for x = 1.15 to 1.65** for the coffee machine. Handles stick out about 2 cm past y = -0.325. |
| `kitchen_island` | 3.00 × 1.11 × 0.92 | 1816 | kitchen_island.py | Stone waterfall top at 0.92. Drawers and doors face -Y. The +Y side overhangs about 0.45 over a fluted oak panel, for stools. |
| `fridge` | 0.80 × 0.74 × 1.90 | 2148 | fridge.py | Retro rounded mint body. Top freezer and main door, long chrome handles on the left, chrome feet. |
| `coffee_machine` | 0.48 × 0.46 × 0.42 | 2060 | coffee_machine.py | Origin at the counter surface. Coral body, chrome panel, gauge, 3 buttons and an `emissive_led`. Group head and portafilter, an espresso cup on the drip tray, steam wand, cup-warmer rail with 2 cups. |
| `microwave` | 0.50 × 0.42 × 0.30 | 1248 | microwave.py | Origin at the counter surface. `glass_window` door, keypad, dial, `emissive_display`. |
| `water_cooler` | 0.41 × 0.42 × 1.15 | 2400 | water_cooler.py | White body. Inverted `glass_water` bottle in blue. Blue and red taps, drip tray, side cup dispenser. |
| `cafe_chair` | 0.44 × 0.52 × 0.94 | 2232 | cafe_chair.py | Thonet-style bentwood in walnut with a rattan seat. Seat top 0.46. Double back hoop and a leg ring. |
| `drinking_fountain` | 0.89 × 0.42 × 0.66 | 2880 | drinking_fountain.py | Back at y = 0 against the wall, extends to -Y (depth 0.42). Floor-relative heights: bowl rims at 0.95 (left) and 0.75 (right), wall plates go down to z = 0.34. Stainless bowls, bubblers, blue push buttons. |
| `rug_round` | 2.00 × 2.00 × 0.01 | 1148 | rugs.py | 8 mm. Body is `fabric_rug` (cream), border is `rug_border` (terracotta). |
| `rug_rect` | 2.40 × 1.60 × 0.01 | 748 | rugs.py | 8 mm. Body is `fabric_rug` (cream), border is `rug_border` (navy). Small fringe on the short ends, included in the 2.4. |
| `vending_machine` | 0.90 × 0.82 × 1.85 | 4040 | vending_machine.py | Blue body, `glass_front`, `emissive_panel` back light and header sign. 5 rows of cans, bags, bars and boxes. Keypad, card reader, pickup bin. |
| `umbrella_stand` | 0.31 × 0.28 × 0.99 | 1540 | umbrella_stand.py | Mint stand (Ø 0.27, 0.5 tall) holding 2 closed umbrellas, one with a J-hook handle. Slightly over the 1.5k small-prop budget. |
| `magazine_rack` | 0.42 × 0.34 × 0.46 | 892 | magazine_rack.py | Oak rack with a carry handle and 6 colorful magazines in 2 slots. |

Every asset uses 6 materials or fewer.
