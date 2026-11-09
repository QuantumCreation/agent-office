"""Water cooler 0.4 x 0.4 x ~1.15 including the inverted blue `glass_water` bottle; hot/cold taps."""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_home import *  # noqa: E402,F401,F403

reset()
body = mat("cooler", "white", roughness=0.4)
water = mat("glass_water", "#8fd3ff", alpha=0.55)
dark = mat("charcoal")
blue = mat("blue")
red = mat("coral")

B, BH = 0.34, 0.86
soft_box((B, B, BH - 0.03), loc=(0, 0.02, 0.03 + (BH - 0.03) / 2), material=body, round=0.04, cuts=4)
box((B - 0.04, B - 0.04, 0.03), loc=(0, 0.02, 0.015), material=dark, round=0.008, segments=1)  # plinth
YF = 0.02 - B / 2
# dispensing alcove + drip tray
box((0.22, 0.012, 0.2), loc=(0, YF - 0.002, 0.68), material=dark, round=0.01, segments=2)
box((0.24, 0.09, 0.025), loc=(0, YF - 0.04, 0.6), material=dark, round=0.008, segments=2)
box((0.21, 0.07, 0.005), loc=(0, YF - 0.04, 0.614), material=body)
# taps
for x, m in ((-0.05, blue), (0.05, red)):
    box((0.04, 0.05, 0.035), loc=(x, YF - 0.03, 0.75), material=m, round=0.01, segments=2)
    cyl(0.008, 0.03, loc=(x, YF - 0.045, 0.72), material=m, verts=8)
    box((0.03, 0.012, 0.045), loc=(x, YF - 0.06, 0.775), material=m, round=0.005, segments=1, rot=(math.radians(-15), 0, 0))
# cup dispenser on the side
cyl(0.04, 0.2, loc=(B / 2 + 0.03, 0.02, 0.6), material=body, verts=14, round=0.01)
lathe([(0.0, 0.48), (0.036, 0.48), (0.04, 0.5), (0.0, 0.5)], dark, segments=14).location = (B / 2 + 0.03, 0.02, 0)
# collar + inverted 5-gallon bottle
cyl(0.1, 0.03, loc=(0, 0.02, BH + 0.0), material=body, verts=24, round=0.01)
z0 = BH + 0.005
prof = [(0.0, z0), (0.035, z0), (0.035, z0 + 0.05), (0.05, z0 + 0.07), (0.12, z0 + 0.11), (0.138, z0 + 0.14),
        (0.138, z0 + 0.17), (0.132, z0 + 0.18), (0.138, z0 + 0.19), (0.138, z0 + 0.23), (0.132, z0 + 0.24), (0.138, z0 + 0.25),
        (0.136, z0 + 0.27), (0.12, z0 + 0.285), (0.0, z0 + 0.29)]
lathe(prof, water, segments=28).location = (0, 0.02, 0)

finish("water_cooler")
