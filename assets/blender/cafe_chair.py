"""Bentwood cafe chair (Thonet style): seat top at 0.46, ~0.5 x 0.5, walnut bentwood with a cane seat."""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_home import *  # noqa: E402,F401,F403

reset()
wood = mat("walnut")
cane = mat("rattan", "#e8cf9f", roughness=0.8)

S = 0.46
# seat: cane disc in a bentwood rim
cyl(0.2, 0.024, loc=(0, -0.01, S - 0.014), material=cane, verts=32)
torus(0.205, 0.016, loc=(0, -0.01, S - 0.016), material=wood, major_seg=32, minor_seg=8)
torus(0.195, 0.012, loc=(0, -0.01, S - 0.05), material=wood, major_seg=32, minor_seg=6)  # apron ring under the seat

# front legs, splayed
for sx in (-1, 1):
    stem([(sx * 0.13, -0.15, S - 0.03), (sx * 0.19, -0.21, 0.004)], 0.018, wood, sides=10, taper=0.75)

# back legs rise into the outer back hoop (one continuous bent piece)
pts = []
for sx in (-1,):
    pts += [(sx * 0.2, 0.24, 0.004), (sx * 0.165, 0.16, S - 0.04), (sx * 0.165, 0.18, S + 0.08)]
n = 16
for i in range(n + 1):
    t = math.pi - math.pi * i / n
    pts.append((0.175 * math.cos(t), 0.2 + 0.07 * math.sin(t), 0.62 + 0.3 * math.sin(t)))
pts += [(0.165, 0.18, S + 0.08), (0.165, 0.16, S - 0.04), (0.2, 0.24, 0.004)]
ptube(pts, 0.016, wood, sides=10)
# inner loop
pts = [(-0.1, 0.165, S - 0.01)]
for i in range(n + 1):
    t = math.pi - math.pi * i / n
    pts.append((0.1 * math.cos(t), 0.18 + 0.05 * math.sin(t), 0.56 + 0.22 * math.sin(t)))
pts.append((0.1, 0.165, S - 0.01))
ptube(pts, 0.011, wood, sides=8)
# leg ring
torus(0.19, 0.011, loc=(0, 0.0, 0.2), material=wood, major_seg=32, minor_seg=6)
for o in bpy.context.scene.objects:
    if o.name.startswith("torus") and abs(o.location.z - 0.2) < 1e-6:
        o.scale = (1.0, 1.05, 1.0)

finish("cafe_chair")
