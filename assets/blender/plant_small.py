"""Small tabletop plant (Pilea / coin plant): 0.25 m tall, round leaves on thin stalks, mint pot."""

import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_home import *  # noqa: E402,F401,F403

reset()
rnd = random.Random(5)
potm = mat("pot", "#bfe6d0", roughness=0.5)
soil = mat("soil", "#6b4a35")
leaf_a = mat("leaf", "#3f9e52")
leaf_b = mat("leaf_light", "#6cc072")

top = pot(0.065, 0.095, potm, soil, r_bot=0.05, rim=0.006, rim_h=0.018, segs=20, wall=0.006, soil_drop=0.012)
cyl(0.062, 0.012, loc=(0, 0, 0.006), material=potm, verts=20, round=0.004)  # saucer

n = 30
for i in range(n):
    f = i / (n - 1)
    yaw = i * math.radians(137.5) + rnd.uniform(-0.15, 0.15)
    reach = 0.105 - 0.07 * f
    tipx, tipy = math.cos(yaw) * reach, math.sin(yaw) * reach
    tipz = top + 0.035 + 0.115 * f ** 0.8 + rnd.uniform(-0.008, 0.008)
    stem(bezier((math.cos(yaw) * 0.01, math.sin(yaw) * 0.01, top), (tipx * 0.25, tipy * 0.25, tipz + 0.01), (tipx, tipy, tipz), n=3), 0.0022, leaf_a, sides=4, taper=0.8)
    size = 0.058 - 0.022 * f + rnd.uniform(-0.005, 0.005)
    leaf(
        size, size * 0.95, (tipx, tipy, tipz), yaw=yaw + rnd.uniform(-0.3, 0.3), pitch=math.radians(5 + 45 * f), roll=rnd.uniform(-0.3, 0.3),
        material=leaf_b if i % 3 == 0 else leaf_a, droop=0.6, fold=0.35, shape="round", segs=5, thick=0.002,
    )

finish("plant_small")
