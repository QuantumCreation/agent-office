"""Monstera floor plant: terracotta pot (Ø 0.42), big split leaves on long petioles, ~1.1 m tall."""

import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_home import *  # noqa: E402,F401,F403

reset()
rnd = random.Random(7)
terra = mat("terracotta", roughness=0.8)
soil = mat("soil", "#6b4a35")
leaf_a = mat("leaf_dark", "#2f8a48")
leaf_b = mat("leaf", "#47a85a")
stem_m = mat("stem", "#5a9a4e")

top = pot(0.195, 0.38, terra, soil, r_bot=0.15, rim=0.016, rim_h=0.05)

golden = math.radians(137.5)
n = 13
for i in range(n):
    f = i / (n - 1)  # 0 = outer/low, 1 = inner/high
    yaw = i * golden + rnd.uniform(-0.2, 0.2)
    rd = 0.36 - 0.26 * f + rnd.uniform(-0.03, 0.03)
    hb = 0.58 + 0.34 * f + rnd.uniform(-0.03, 0.03)
    L = 0.36 + 0.06 * math.sin(f * math.pi) + rnd.uniform(-0.03, 0.03)
    bx, by = math.cos(yaw) * rd, math.sin(yaw) * rd
    sx, sy = math.cos(yaw) * 0.03, math.sin(yaw) * 0.03
    base = (bx, by, hb)
    stem(bezier((sx, sy, top - 0.01), (bx * 0.15, by * 0.15, hb * 0.85), base, n=7), 0.011, stem_m, sides=6, taper=0.7)
    monstera_leaf(
        L, L * 0.82, base,
        yaw=yaw, pitch=math.radians(38 - 14 * (1 - f)), roll=rnd.uniform(-0.25, 0.25),
        material=leaf_b if i % 3 == 2 else leaf_a,
        droop=1.05 + 0.25 * (1 - f), fold=-0.12, slits=4 if L > 0.34 else 3, seed=i, res=15,
    )
# a young curled leaf at the centre
leaf(0.18, 0.05, (0.0, 0.0, 0.9), yaw=1.0, pitch=math.radians(80), material=leaf_b, droop=0.4, fold=0.9, shape="lance")
stem(bezier((0, 0, top), (0.0, 0.0, 0.7), (0.0, 0.0, 0.9), n=4), 0.009, stem_m, sides=6)

finish("plant_monstera")
