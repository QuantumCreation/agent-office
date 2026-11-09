"""Fiddle-leaf fig tree: white pot (Ø 0.45), slim trunk, clusters of broad violin-shaped leaves, ~1.7 m."""

import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_home import *  # noqa: E402,F401,F403

reset()
rnd = random.Random(11)
potm = mat("pot", "white", roughness=0.5)
soil = mat("soil", "#6b4a35")
bark = mat("bark", "#8a6a4f")
leaf_a = mat("leaf_dark", "#2f8a48")
leaf_b = mat("leaf", "#4caf5f")

top = pot(0.21, 0.42, potm, soil, r_bot=0.17, rim=0.015, rim_h=0.03)
torus(0.2, 0.007, loc=(0, 0, 0.33), material=potm, major_seg=28, minor_seg=6)

# trunk + branches
trunk = bezier((0, 0, top - 0.02), (0.06, -0.02, 0.9), (-0.02, 0.01, 1.52), n=9)
stem(trunk, 0.03, bark, sides=8, taper=0.5)
branches = [
    (bezier((0.03, -0.01, 1.12), (0.17, -0.05, 1.24), (0.27, -0.08, 1.44), n=5), 26),
    (bezier((0.02, 0.0, 1.2), (-0.15, 0.07, 1.3), (-0.23, 0.14, 1.5), n=5), 30),
    (bezier((0.03, 0.0, 1.0), (-0.1, -0.1, 1.08), (-0.21, -0.18, 1.22), n=4), 20),
    (bezier((0.04, 0.0, 1.06), (0.12, 0.12, 1.14), (0.19, 0.22, 1.3), n=4), 20),
]
for pts, _ in branches:
    stem(pts, 0.016, bark, sides=6, taper=0.6)


def cluster(pts, count, tip_up=0.0):
    """Leaves spiral along the last part of a branch; each points outward and droops."""
    pts = [Vector(p) for p in pts]
    for j in range(count):
        f = j / max(count - 1, 1)
        idx = 1 + f * (len(pts) - 2)
        a, b = pts[int(idx)], pts[min(int(idx) + 1, len(pts) - 1)]
        p = a.lerp(b, idx - int(idx))
        yaw = j * math.radians(137.5) + rnd.uniform(-0.25, 0.25)
        L = rnd.uniform(0.27, 0.34) * (0.8 + 0.2 * (1 - f))
        pitch = math.radians(rnd.uniform(10, 35) + 30 * f + tip_up)
        leaf(
            L, L * rnd.uniform(0.66, 0.74), tuple(p), yaw=yaw, pitch=pitch, roll=rnd.uniform(-0.35, 0.35),
            material=leaf_b if rnd.random() < 0.3 else leaf_a,
            droop=rnd.uniform(0.7, 1.1) * (1.1 - 0.5 * f), fold=-0.2, shape="fiddle", segs=6, thick=0.003, wide=True,
        )


cluster(trunk[5:], 15, tip_up=10)
for pts, _ in branches:
    cluster(pts[1:], 7)

finish("plant_fiddle")
