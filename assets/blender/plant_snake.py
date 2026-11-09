"""Snake plant (Sansevieria): upright sword leaves in a pastel pot, ~0.8 m tall."""

import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_home import *  # noqa: E402,F401,F403

reset()
rnd = random.Random(3)
potm = mat("pot", "#f3c9b8", roughness=0.7)  # soft blush ceramic
soil = mat("soil", "#6b4a35")
dark = mat("leaf_snake", "#2f6e45")
light = mat("leaf_snake_light", "#9cbf5a")

top = pot(0.15, 0.3, potm, soil, r_bot=0.13, rim=0.0, rim_h=0.0, segs=28)
# subtle band on the pot
torus(0.142, 0.008, loc=(0, 0, 0.06), material=potm, major_seg=28, minor_seg=6)

n = 13
for i in range(n):
    ang = rnd.uniform(0, 2 * math.pi)
    rr = 0.02 + 0.09 * math.sqrt(rnd.random())
    x, y = math.cos(ang) * rr, math.sin(ang) * rr
    L = rnd.uniform(0.4, 0.53) if rr > 0.06 else rnd.uniform(0.5, 0.56)
    lean = math.radians(rnd.uniform(4, 10) + rr * 90)
    leaf(
        L, rnd.uniform(0.075, 0.095), (x, y, top - 0.02),
        yaw=ang, pitch=math.pi / 2 - lean, roll=rnd.uniform(0, math.pi),
        material=light if i % 5 == 0 else dark,
        droop=rnd.uniform(0.05, 0.25), fold=0.35, shape="sword", segs=7, thick=0.004, wide=True,
    )

finish("plant_snake")
