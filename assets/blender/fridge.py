"""Retro-modern fridge 0.8 x 0.75 x 1.9: rounded mint body, top freezer + main door, chrome handles."""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_home import *  # noqa: E402,F401,F403

reset()
body = mat("fridge", "#bfe6d0", roughness=0.35)
metal = mat("chrome", roughness=0.2)
dark = mat("charcoal")

W, D, H = 0.8, 0.75, 1.9
FEET = 0.05
YB = D / 2
# feet + body shell
for sx in (-1, 1):
    for y in (-0.22, 0.28):
        cyl(0.025, FEET, loc=(sx * 0.32, y, FEET / 2), material=metal, verts=12, round=0.008)
soft_box((W, 0.62, H - FEET), loc=(0, YB - 0.31, FEET + (H - FEET) / 2), material=body, round=0.09, cuts=5)
# doors (slightly proud, rounded), with a dark gasket line between them
YD = YB - 0.62  # body front
split = FEET + 1.24
soft_box((W - 0.01, 0.07, split - FEET - 0.03), loc=(0, YD - 0.02, FEET + 0.015 + (split - FEET - 0.03) / 2), material=body, round=0.03, cuts=4, puff=(0, 0.006, 0))
soft_box((W - 0.01, 0.07, H - split - 0.03), loc=(0, YD - 0.02, split + 0.015 + (H - split - 0.03) / 2), material=body, round=0.03, cuts=4, puff=(0, 0.006, 0))
box((W - 0.06, 0.02, 0.012), loc=(0, YD - 0.01, split), material=dark)
# long chrome handles on the left edge, on stand-offs
hx = -W / 2 + 0.07
for z0, z1 in ((split + 0.08, split + 0.48), (split - 0.62, split - 0.08)):
    ptube([(hx, YD - 0.06, z0 - 0.02), (hx, YD - 0.105, z0 + 0.04), (hx, YD - 0.105, z1 - 0.04), (hx, YD - 0.06, z1 + 0.02)], 0.014, metal, sides=10)
    for z in (z0, z1):
        cyl(0.012, 0.06, loc=(hx, YD - 0.07, z), material=metal, verts=8, rot=(math.pi / 2, 0, 0))
# badge + kick grille
box((0.12, 0.008, 0.03), loc=(0.22, YD - 0.058, split + 0.4), material=metal, round=0.004, segments=1)
box((W - 0.14, 0.01, 0.035), loc=(0, YD + 0.0, FEET + 0.035), material=dark, round=0.006, segments=1)

finish("fridge")
