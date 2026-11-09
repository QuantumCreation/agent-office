"""Long planter box 1.6 x 0.4 x 0.5 (box height) with mixed foliage. The game may scale it along X."""

import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_home import *  # noqa: E402,F401,F403

reset()
rnd = random.Random(9)
body = mat("planter", "white", roughness=0.5)
oak = mat("oak")
soil = mat("soil", "#6b4a35")
dark = mat("leaf_dark", "#2f8a48")
mid = mat("leaf", "#4caf5f")
light = mat("leaf_light", "#8fd18a")

W, D, H = 1.6, 0.4, 0.5
# body on a recessed oak plinth, oak cap rail around the rim
box((W - 0.06, D - 0.06, 0.05), loc=(0, 0, 0.025), material=oak, round=0.01, segments=2)
box((W, D, H - 0.09), loc=(0, 0, 0.05 + (H - 0.09) / 2), material=body, round=0.025, segments=3)
for sx in (-1, 1):
    box((0.04, D, 0.04), loc=(sx * (W / 2 - 0.02), 0, H - 0.02), material=oak, round=0.01, segments=2)
for sy in (-1, 1):
    box((W, 0.04, 0.04), loc=(0, sy * (D / 2 - 0.02), H - 0.02), material=oak, round=0.01, segments=2)
# grooves on the long faces (two thin oak bands)
for z in (0.17, 0.31):
    for sy in (-1, 1):
        box((W - 0.06, 0.006, 0.012), loc=(0, sy * (D / 2 + 0.001), z), material=oak)
box((W - 0.08, D - 0.08, 0.02), loc=(0, 0, H - 0.035), material=soil)
sz = H - 0.025


def lance_clump(x, n, height):
    for j in range(n):
        a = j * math.radians(137.5) + rnd.uniform(-0.2, 0.2)
        p = (x + math.cos(a) * 0.025, math.sin(a) * 0.025, sz)
        leaf(rnd.uniform(0.8, 1.0) * height, 0.13, p, yaw=a, pitch=math.radians(rnd.uniform(62, 86)), roll=rnd.uniform(-0.3, 0.3),
             material=dark if j % 3 else mid, droop=rnd.uniform(0.6, 1.0), fold=0.3, shape="lance", segs=5)


def bush(x, n, r, h):
    for j in range(n):
        a = j * math.radians(137.5)
        rr = r * math.sqrt((j + 0.5) / n)
        p = (x + math.cos(a) * rr * 0.6, math.sin(a) * rr * 0.45, sz + h * (1 - (rr / r) ** 2) + 0.04)
        if j % 2 == 0:
            stem([(x + math.cos(a) * 0.02, math.sin(a) * 0.02, sz), p], 0.005, mid, sides=4)
        leaf(rnd.uniform(0.17, 0.21), 0.13, p, yaw=a, pitch=math.radians(rnd.uniform(20, 55)), roll=rnd.uniform(-0.4, 0.4),
             material=light if j % 2 else mid, droop=0.8, fold=0.3, shape="ellipse", segs=4)


def fern(x, n):
    for j in range(n):
        a = j * math.radians(137.5)
        p = (x + math.cos(a) * 0.03, math.sin(a) * 0.03, sz)
        leaf(rnd.uniform(0.34, 0.44), 0.06, p, yaw=a, pitch=math.radians(rnd.uniform(60, 85)), roll=0,
             material=light if j % 3 == 0 else mid, droop=rnd.uniform(1.0, 1.5), fold=0.4, shape="blade", segs=5)


def groundcover(n):
    # low leaves along both long edges, spilling a little over the rim, hiding the soil
    for j in range(n):
        x = -0.72 + 1.44 * (j + 0.5) / n + rnd.uniform(-0.03, 0.03)
        sy = -1 if j % 2 == 0 else 1
        p = (x, sy * rnd.uniform(0.0, 0.1), sz + 0.01)
        leaf(rnd.uniform(0.15, 0.19), 0.1, p, yaw=sy * math.pi / 2 + rnd.uniform(-0.6, 0.6), pitch=math.radians(rnd.uniform(15, 35)),
             roll=rnd.uniform(-0.3, 0.3), material=dark if j % 3 == 0 else mid, droop=1.1, fold=0.3, shape="ellipse", segs=4)


groundcover(26)
lance_clump(-0.6, 9, 0.5)
bush(-0.34, 14, 0.17, 0.2)
fern(-0.12, 8)
lance_clump(0.1, 9, 0.55)
bush(0.36, 14, 0.17, 0.18)
fern(0.56, 7)
lance_clump(0.7, 6, 0.42)
fern(-0.76, 4)

finish("planter_box")
