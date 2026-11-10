"""Ceiling pendants (origin = ceiling attachment point, everything hangs below in -Z).
  pendant_lamp:        canopy, 1.45 m cable, dome shade Ø 0.45 (accent colored), `emissive_bulb`.
  pendant_lamp_linear: 1.4 m linear pendant on two 1.45 m cables, for over the conference table.
Cables are sized for the office's 3.6 m ceiling: shades hang about 1.9 m above the floor."""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_home import *  # noqa: E402,F401,F403

# ---------------------------------------------------------------- dome pendant
reset()
dark = mat("charcoal")
shade = mat("accent_shade", "sage")
inner = mat("white")
bulb = mat("emissive_bulb", "#fff4d6")

cyl(0.06, 0.025, loc=(0, 0, -0.0125), material=dark, verts=20, round=0.008)
CABLE = 1.45
top = -0.025 - CABLE
tube([(0, 0, -0.025), (0, 0, top)], 0.004, dark, sides=6)
cyl(0.028, 0.04, loc=(0, 0, top - 0.01), material=dark, verts=14, round=0.01)
R = 0.225
outer = [(0.035, top - 0.025)]
inn = []
for i in range(1, 9):
    t = i / 8
    a = t * math.pi / 2
    outer.append((0.035 + (R - 0.035) * math.sin(a), top - 0.025 - 0.2 * (1 - math.cos(a)) ** 0.9))
outer.append((R, top - 0.235))
lathe(outer + [(R - 0.006, top - 0.235)], shade, segments=36)
for r, z in reversed(outer[:-1]):
    inn.append((max(r - 0.007, 0.02), z - 0.004))
lathe([(R - 0.006, top - 0.233)] + inn, inner, segments=36)
cyl(0.02, 0.05, loc=(0, 0, top - 0.06), material=dark, verts=12)
sphere(0.055, loc=(0, 0, top - 0.13), material=bulb, segments=16, rings=10)
finish_hung("pendant_lamp")

# ---------------------------------------------------------------- linear pendant
reset()
dark = mat("charcoal")
shade = mat("accent_shade", "sage")
bulb = mat("emissive_bulb", "#fff4d6")
L = 1.4
z0 = -CABLE
for sx in (-1, 1):
    x = sx * 0.55
    cyl(0.045, 0.02, loc=(x, 0, -0.01), material=dark, verts=16, round=0.006)
    tube([(x, 0, -0.02), (x, 0, z0)], 0.003, dark, sides=6)
    cyl(0.012, 0.02, loc=(x, 0, z0 - 0.005), material=dark, verts=10)
soft_box((L, 0.11, 0.07), loc=(0, 0, z0 - 0.045), material=shade, round=0.022, cuts=3)
box((L - 0.06, 0.07, 0.012), loc=(0, 0, z0 - 0.082), material=bulb, round=0.005, segments=2)
for sx in (-1, 1):
    cyl(0.036, 0.004, loc=(sx * (L / 2 + 0.001), 0, z0 - 0.045), material=dark, verts=14, rot=(0, math.pi / 2, 0))
finish_hung("pendant_lamp_linear")
