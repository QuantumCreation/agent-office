"""Hanging pothos: ceiling-hung (origin = ceiling hook), macrame hanger, white pot, trailing vines (~0.9 drop)."""

import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_home import *  # noqa: E402,F401,F403

reset()
rnd = random.Random(21)
rope = mat("rope", "#efe3c8", roughness=0.9)
potm = mat("pot", "white", roughness=0.5)
soil = mat("soil", "#6b4a35")
leaf_a = mat("leaf", "#3f9e52")
leaf_b = mat("leaf_light", "#9ccf6a")

# ceiling cup + hook ring
cyl(0.035, 0.015, loc=(0, 0, -0.0075), material=potm, verts=16)
torus(0.022, 0.005, loc=(0, 0, -0.04), material=rope, rot=(math.pi / 2, 0, 0), major_seg=14, minor_seg=6)

pot_top = -0.42
pot_h = 0.17
r_top = 0.12
pot(r_top, pot_h, potm, soil, r_bot=0.085, rim=0.01, rim_h=0.025, segs=20, loc=(0, 0, pot_top - pot_h))
soil_z = pot_top - 0.03

# macrame cords: knot at the top, three cords to the rim, wrap under the pot, tassel below
sphere(0.016, loc=(0, 0, -0.07), material=rope, segments=8, rings=5)
for i in range(3):
    a = i * 2 * math.pi / 3 + 0.5
    c, s = math.cos(a), math.sin(a)
    pts = [(0, 0, -0.07), (c * 0.07, s * 0.07, -0.25), (c * (r_top + 0.014), s * (r_top + 0.014), pot_top - 0.02),
           (c * (0.105), s * (0.105), pot_top - 0.1), (c * 0.07, s * 0.07, pot_top - pot_h - 0.01), (0, 0, pot_top - pot_h - 0.05)]
    ptube(pts, 0.005, rope, sides=4)
    sphere(0.011, loc=(c * 0.115, s * 0.115, pot_top - 0.09), material=rope, segments=8, rings=5)  # knot on the pot side
sphere(0.02, loc=(0, 0, pot_top - pot_h - 0.05), material=rope, segments=8, rings=5)
for j in range(7):
    a = j * 2 * math.pi / 7
    tube([(0, 0, pot_top - pot_h - 0.06), (math.cos(a) * 0.015, math.sin(a) * 0.015, pot_top - pot_h - 0.16)], 0.004, rope, sides=4)

# leafy crown on top of the pot
for j in range(13):
    a = j * math.radians(137.5)
    rr = 0.02 + 0.08 * (j % 4) / 3
    p = (math.cos(a) * rr, math.sin(a) * rr, soil_z + 0.01)
    leaf(rnd.uniform(0.1, 0.12), 0.075, p, yaw=a, pitch=math.radians(rnd.uniform(15, 45)), roll=rnd.uniform(-0.3, 0.3),
         material=leaf_b if j % 3 == 0 else leaf_a, droop=0.8, fold=0.25, shape="heart", segs=5, thick=0.002)

# trailing vines
nv = 8
for v in range(nv):
    a = v * 2 * math.pi / nv + rnd.uniform(-0.2, 0.2)
    c, s = math.cos(a), math.sin(a)
    drop = rnd.uniform(0.22, 0.48)
    start = Vector((c * (r_top - 0.01), s * (r_top - 0.01), pot_top + 0.005))
    out = Vector((c * (r_top + 0.05), s * (r_top + 0.05), pot_top - 0.03))
    end = Vector((c * (r_top + 0.03 + rnd.uniform(0, 0.05)) + rnd.uniform(-0.03, 0.03), s * (r_top + 0.04) + rnd.uniform(-0.03, 0.03), pot_top - 0.03 - drop))
    pts = bezier(start, out, end, n=8)
    stem(pts, 0.0035, leaf_a, sides=4, taper=0.7)
    nl = int(drop / 0.052) + 2
    for k in range(nl):
        t = (k + 0.6) / (nl + 0.2)
        idx = t * (len(pts) - 1)
        p = Vector(pts[int(idx)]).lerp(Vector(pts[min(int(idx) + 1, len(pts) - 1)]), idx - int(idx))
        side = 1 if k % 2 else -1
        size = 0.085 - 0.03 * t + rnd.uniform(-0.008, 0.008)
        leaf(size, size * 0.8, tuple(p), yaw=a + side * rnd.uniform(0.5, 1.1), pitch=math.radians(rnd.uniform(-35, 5)), roll=side * 0.4,
             material=leaf_b if (k + v) % 4 == 0 else leaf_a, droop=0.6, fold=0.3, shape="heart", segs=4, thick=0.002)

finish_hung("plant_hanging")
