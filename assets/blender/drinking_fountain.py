"""Wall-mounted high-low drinking fountain pair. Back at y = 0 (against the wall), extends to -Y.
Stainless bowls with rims at 0.95 (left) and 0.75 (right), ~0.9 m wide in total."""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_home import *  # noqa: E402,F401,F403

reset()
steel = mat("stainless", "chrome", roughness=0.25)
shroud = mat("steel", roughness=0.4)
dark = mat("charcoal")
blue = mat("blue")

for x, h in ((-0.225, 0.95), (0.225, 0.75)):
    # wall plate (back at y = 0)
    box((0.44, 0.025, 0.46), loc=(x, -0.0125, h - 0.18), material=shroud, round=0.01, segments=2)
    # bracket/shroud under the bowl
    box((0.16, 0.2, 0.16), loc=(x, -0.11, h - 0.15), material=shroud, round=0.03, segments=3)
    # bowl (round dish, slightly oval)
    prof = [(0.04, h - 0.2), (0.09, h - 0.17), (0.165, h - 0.075), (0.19, h - 0.03), (0.2, h - 0.008), (0.195, h), (0.184, h - 0.003),
            (0.168, h - 0.03), (0.12, h - 0.055), (0.03, h - 0.065)]
    b = lathe(prof, steel, segments=32)
    b.location = (x, -0.225, 0)
    b.scale = (1.05, 0.92, 1)
    cyl(0.022, 0.004, loc=(x, -0.225, h - 0.063), material=dark, verts=14)
    # bubbler near the back of the bowl
    cyl(0.018, 0.05, loc=(x, -0.1, h - 0.03), material=steel, verts=12, round=0.006)
    ptube([(x, -0.1, h - 0.01), (x, -0.11, h + 0.02), (x, -0.135, h + 0.03)], 0.009, steel, sides=8)
    # push button on the front
    cyl(0.022, 0.02, loc=(x, -0.408, h - 0.045), material=blue, verts=14, rot=(math.pi / 2, 0, 0), round=0.006)

finish("drinking_fountain")
