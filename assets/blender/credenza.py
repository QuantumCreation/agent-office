"""Credenza: 2.4 x 0.5 x 0.72 oak sideboard on charcoal legs, two doors and a bank of drawers.
A potted plant and a few books stand on top. Front faces -Y."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_work import *  # noqa: E402,F401,F403

reset()
oak = mat("oak")
dark = mat("charcoal")
white = mat("white")
leaf = mat("leaf")
coral = mat("book_a", "coral")
navy = mat("book_b", "navy")

W, D, H = 2.4, 0.5, 0.72
LEG_H = 0.14
BODY_H = H - LEG_H
# carcass (front face at y = -0.215 so fronts and handles stay inside the 0.5 depth)
CD = D - 0.035
box((W, CD, BODY_H), loc=(0, D / 2 - CD / 2, LEG_H + BODY_H / 2), material=oak, round=0.014, segments=3)
# dark recess behind the fronts (shows as shadow gaps)
box((W - 0.05, 0.01, BODY_H - 0.06), loc=(0, D / 2 - CD + 0.003, LEG_H + BODY_H / 2), material=dark)
# fronts: [door][drawers][drawers][door]
fw = (W - 0.05) / 4
g = 0.008
fy = D / 2 - CD - 0.01
fz0 = LEG_H + 0.03
fh = BODY_H - 0.06
for i in range(4):
    x = -W / 2 + 0.025 + fw * (i + 0.5)
    if i in (0, 3):
        box((fw - g, 0.02, fh - g), loc=(x, fy, fz0 + fh / 2), material=oak, round=0.006, segments=2)
        hx = x + (fw / 2 - 0.05) * (1 if i == 0 else -1)
        box((0.016, 0.02, 0.16), loc=(hx, fy - 0.014, fz0 + fh * 0.62), material=dark, round=0.006, segments=2)
    else:
        dh = fh / 3
        for k in range(3):
            zc = fz0 + dh * (k + 0.5)
            box((fw - g, 0.02, dh - g), loc=(x, fy, zc), material=oak, round=0.006, segments=2)
            box((0.12, 0.018, 0.014), loc=(x, fy - 0.013, zc + dh * 0.22), material=dark, round=0.006, segments=2)

# tapered legs, slightly splayed
for sx in (-1, 1):
    for sy in (-1, 1):
        x, y = sx * (W / 2 - 0.12), sy * (D / 2 - 0.08)
        cyl(0.022, LEG_H + 0.01, loc=(x, y, (LEG_H + 0.01) / 2), material=dark, verts=12, radius2=0.03)
for sx in (-1, 1):
    box((0.06, D - 0.1, 0.02), loc=(sx * (W / 2 - 0.12), 0, LEG_H - 0.005), material=dark, round=0.006, segments=1)

# ---- on top: a potted plant on the left
TOPZ = H
px = -0.75
soil_top = pot((px, 0.0, TOPZ), r=0.1, h=0.2, material=white, soil=dark, segments=22)
leafy_plant(soil_top, height=0.36, spread=0.12, leaf_mat=leaf, stem_mat=leaf, seed=4, n=26, leaf_len=0.085, leaf_w=0.045)

# ---- books: a stack lying flat and a row standing against a bookend
bx = 0.35
z = TOPZ
for i, (w, d, t, m, r) in enumerate([(0.3, 0.22, 0.045, navy, 3), (0.27, 0.2, 0.035, coral, -5), (0.24, 0.18, 0.03, white, 8)]):
    box((w, d, t), loc=(bx, 0.03, z + t / 2), material=m, round=0.004, segments=1, rot=(0, 0, rad(r)))
    z += t
x = 0.68
cols = [coral, navy, white, navy, coral, white, navy]
for i, m in enumerate(cols):
    th = 0.03 + (i % 3) * 0.008
    hgt = 0.22 + ((i * 37) % 5) * 0.012
    box((th, 0.17, hgt), loc=(x + th / 2, 0.04, TOPZ + hgt / 2), material=m, round=0.004, segments=1)
    x += th + 0.002
# last book leaning
box((0.03, 0.17, 0.24), loc=(x + 0.05, 0.04, TOPZ + 0.115), material=coral, round=0.004, segments=1, rot=(0, rad(-22), 0))
# bookends
for bx2 in (0.665, ):
    box((0.012, 0.12, 0.16), loc=(bx2, 0.04, TOPZ + 0.08), material=dark, round=0.003, segments=1)

done("credenza")
