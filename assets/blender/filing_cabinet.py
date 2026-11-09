"""Filing cabinet 0.45 x 0.6 x 1.3 with 4 drawers (fronts face -Y): sage-painted steel,
recessed handles, label holders."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_work import *  # noqa: E402,F401,F403

reset()
body = mat("cabinet", "sage")
dark = mat("charcoal")
metal = mat("chrome")
paper = mat("paper")

W, D, H = 0.45, 0.6, 1.3
PL = 0.05  # plinth
CD = D - 0.025
box((W, CD, H - PL), loc=(0, D / 2 - CD / 2, PL + (H - PL) / 2), material=body, round=0.014, segments=3)
box((W - 0.03, D - 0.06, PL), loc=(0, 0.0, PL / 2), material=dark, round=0.006, segments=1)
# top cap
box((W + 0.004, CD + 0.004, 0.02), loc=(0, D / 2 - CD / 2, H - 0.01), material=body, round=0.008, segments=2)
fy = D / 2 - CD
# shadow recess behind the drawers
box((W - 0.03, 0.006, H - PL - 0.05), loc=(0, fy + 0.001, PL + (H - PL - 0.02) / 2), material=dark)
dh = (H - PL - 0.05) / 4
for i in range(4):
    zc = PL + 0.015 + dh * (i + 0.5)
    box((W - 0.02, 0.02, dh - 0.01), loc=(0, fy - 0.008, zc), material=body, round=0.008, segments=2)
    # recessed pull: a dark slot with a chrome lip
    box((0.16, 0.006, 0.035), loc=(0, fy - 0.0185, zc + dh * 0.12), material=dark, round=0.004, segments=1)
    box((0.17, 0.016, 0.01), loc=(0, fy - 0.024, zc + dh * 0.12 - 0.02), material=metal, round=0.004, segments=1)
    # label holder
    box((0.09, 0.006, 0.04), loc=(0, fy - 0.02, zc + dh * 0.33), material=metal, round=0.002, segments=1)
    box((0.078, 0.004, 0.03), loc=(0, fy - 0.022, zc + dh * 0.33), material=paper)
# lock
cyl(0.011, 0.008, loc=(0.16, fy - 0.02, H - 0.05), material=metal, verts=12, rot=(R90, 0, 0))

done("filing_cabinet")
