"""Tiny potted succulent (echeveria rosette), under 0.15 tall. Origin on the desk surface."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_work import *  # noqa: E402,F401,F403

reset()
pot = mat("pot", "terracotta")
soil = mat("soil", "walnut")
leaf_o = mat("leaf_outer", "sage")
leaf_i = mat("leaf_inner", "mint")

# Pot with a rolled rim
lathe([(0.032, 0.0), (0.035, 0.004), (0.04, 0.05), (0.046, 0.052), (0.047, 0.066), (0.043, 0.068),
       (0.039, 0.064), (0.036, 0.056)], pot, segments=16)
cyl(0.036, 0.004, loc=(0, 0, 0.056), material=soil, verts=14)

# Rosette: three rings of plump pointed leaves, tilting up more toward the center
rings = [(8, 0.03, 62, 0.034, leaf_o, 0), (6, 0.018, 40, 0.028, leaf_o, 22), (4, 0.008, 18, 0.022, leaf_i, 45)]
for count, rr, tilt, L, m, a0 in rings:
    for i in range(count):
        a = rad(a0 + 360 * i / count)
        # leaf = squashed cone-ish sphere pointing outward and up
        lf = sphere(1.0, material=m, segments=8, rings=5)
        lf.scale = (L * 0.5, L * 0.32, L)
        # rotate: leaf long axis is Z; tilt it outward by `tilt` degrees then spin around Z
        lf.rotation_euler = (0, rad(tilt), a)
        base = (math.cos(a) * rr, math.sin(a) * rr, 0.058)
        lf.location = xf(base, (0, rad(tilt), a), (0, 0, L * 0.7))
sphere(0.009, loc=(0, 0, 0.074), material=leaf_i, segments=6, rings=4)

done("succulent")
