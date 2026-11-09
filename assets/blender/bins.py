"""Waste bins: trash_bin (D0.3 x 0.45, open top with a crumpled paper ball) and
recycling_bin (blue, same size, lid with a round opening and a recycle mark)."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_work import *  # noqa: E402,F401,F403

R, H = 0.15, 0.45


def body(m, rim_m, h=H):
    # gently tapered tub, wider at the top, with a rolled rim
    lathe([(R - 0.03, 0.0), (R - 0.022, 0.006), (R - 0.008, h - 0.03), (R, h - 0.025), (R, h - 0.004),
           (R - 0.006, h), (R - 0.014, h - 0.006), (R - 0.03, 0.03)], m, segments=32)
    # foot ring
    ring_lathe([(R - 0.034, 0.0), (R - 0.02, 0.0), (R - 0.018, 0.012), (R - 0.024, 0.016)], rim_m, segments=32)


# ---------------------------------------------------------------- trash bin
reset()
tub = mat("bin_body", "slate")
rim = mat("charcoal")
paper = mat("paper")
body(tub, rim)
# rim band
ring_lathe([(R - 0.001, H - 0.03), (R + 0.006, H - 0.028), (R + 0.006, H - 0.002), (R - 0.004, H + 0.002)], rim, segments=32)
# a crumpled paper ball peeking out
ico(0.05, loc=(0.03, 0.02, H - 0.05), material=paper, subdiv=1, scale=(1, 0.9, 0.85), rot=(0.4, 0.7, 0.2))
ico(0.04, loc=(-0.05, -0.02, H - 0.07), material=paper, subdiv=1, scale=(1, 0.9, 0.8), rot=(1.1, 0.2, 0.6))
done("trash_bin")

# ---------------------------------------------------------------- recycling bin
reset()
tub = mat("bin_blue", "blue")
lid_m = mat("lid", "navy")
white = mat("white")
body(tub, lid_m, h=H - 0.035)
# domed lid with a round opening (a ring of lid around a dark hole)
lid = lathe([(R + 0.006, H - 0.04), (R + 0.007, H - 0.025), (R - 0.01, H - 0.005), (0.07, H), (0.06, H - 0.004), (0.058, H - 0.03)], lid_m, segments=32)
cyl(0.06, 0.004, loc=(0, 0, H - 0.028), material=mat("charcoal"), verts=24)
# recycle badge on the front: a white disc tangent to the tub with three blue chevrons on it
cz = 0.24
cyl(0.055, 0.016, loc=(0, -0.132, cz), material=white, verts=24, rot=(R90, 0, 0), round=0.004)
fy = -0.1405
for i in range(3):
    a = math.radians(90 + 120 * i)
    px, pz = math.cos(a) * 0.026, cz + math.sin(a) * 0.026
    tang = a + math.radians(90)
    chev = [(x * 0.62, z * 0.62) for x, z in [(-0.022, -0.008), (0.012, -0.008), (0.012, -0.018), (0.032, 0.0), (0.012, 0.018), (0.012, 0.008), (-0.022, 0.008)]]
    pts = [(px + x * math.cos(tang) - z * math.sin(tang), pz + x * math.sin(tang) + z * math.cos(tang)) for x, z in chev]
    wall_shape(pts, 0.003, fy + 0.001, tub)
done("recycling_bin")
