"""Mobile 3-drawer pedestal, 0.4 x 0.55 x 0.58, white with charcoal handles and casters. Drawers face -Y."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_work import *  # noqa: E402,F401,F403

reset()
body = mat("white")
front = mat("drawer_front", "offwhite")
dark = mat("charcoal")
metal = mat("chrome")

W, D, H = 0.4, 0.55, 0.58
CAST = 0.045
# carcass (slightly inset from the front so drawer fronts sit flush)
box((W, D - 0.02, H - CAST), loc=(0, 0.01, CAST + (H - CAST) / 2), material=body, round=0.012, segments=3)
# shadow gap recess behind the fronts
box((W - 0.03, 0.01, H - CAST - 0.03), loc=(0, -D / 2 + 0.02, CAST + (H - CAST) / 2), material=dark)

# drawer fronts: two shallow + one deep file drawer
gap = 0.008
z = H - 0.012
for h in (0.12, 0.13, 0.25):
    zc = z - h / 2
    box((W - 0.016, 0.022, h - gap), loc=(0, -D / 2 + 0.011, zc), material=front, round=0.008, segments=2)
    # bar handle on stand-offs
    hz = z - 0.035
    ptube([(-0.09, -D / 2 - 0.016, hz), (0.09, -D / 2 - 0.016, hz)], 0.0075, dark, sides=8)
    for x in (-0.08, 0.08):
        box((0.012, 0.02, 0.012), loc=(x, -D / 2 - 0.006, hz), material=dark)
    z -= h
# lock on the top drawer
cyl(0.009, 0.006, loc=(0.15, -D / 2 - 0.002, H - 0.04), material=metal, verts=12, rot=(R90, 0, 0))

# plinth and casters
box((W - 0.04, D - 0.06, 0.02), loc=(0, 0.0, CAST - 0.006), material=dark, round=0.005, segments=1)
for sx in (-1, 1):
    for sy in (-1, 1):
        x, y = sx * (W / 2 - 0.05), sy * (D / 2 - 0.06)
        cyl(0.02, 0.018, loc=(x, y, 0.02), material=dark, verts=12, rot=(0, R90, 0), round=0.006)
        box((0.026, 0.03, 0.02), loc=(x, y + 0.01, 0.034), material=dark, round=0.004, segments=1)

done("pedestal_drawers")
