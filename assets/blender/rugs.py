"""Rugs (8 mm high, pattern free, contrasting border in its own material):
  rug_round: Ø 2.0      rug_rect: 2.4 x 1.6 (with little fringe on the short ends)."""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_home import *  # noqa: E402,F401,F403

H = 0.008

reset()
cyl(0.905, H - 0.0005, loc=(0, 0, (H - 0.0005) / 2), material=mat("fabric_rug", "cream"), verts=64)
annulus(0.9, 1.0, H, material=mat("rug_border", "terracotta"), segs=64, round_out=0.003)
finish("rug_round")

reset()
body = mat("fabric_rug", "cream")
border = mat("rug_border", "navy")
Lx, Ly, b = 2.32, 1.6, 0.11
box((Lx - 2 * b + 0.01, Ly - 2 * b + 0.01, H - 0.0005), loc=(0, 0, (H - 0.0005) / 2), material=body)
for sy in (-1, 1):
    box((Lx, b, H), loc=(0, sy * (Ly / 2 - b / 2), H / 2), material=border, round=0.003, segments=1)
for sx in (-1, 1):
    box((b, Ly - 2 * b, H), loc=(sx * (Lx / 2 - b / 2), 0, H / 2), material=border)
    n = 26
    for i in range(n):
        y = -Ly / 2 + 0.06 + (Ly - 0.12) * i / (n - 1)
        box((0.045, 0.012, 0.004), loc=(sx * (Lx / 2 + 0.02), y, 0.002), material=body)
finish("rug_rect")
