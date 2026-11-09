"""Reception desk 2.6 (x) x 0.8 (y). Visitor side faces -Y with a raised oak transaction ledge at 1.08;
the receptionist works on the +Y side at 0.74. White body with an oak ledge, an `accent` stripe,
and a monitor (back visible from the visitor side) and a plant on the work surface,
and a service bell on the visitor ledge."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_work import *  # noqa: E402,F401,F403

reset()
oak = mat("oak")
white = mat("white")
accent = mat("accent_stripe", "coral")
dark = mat("charcoal")
leaf = mat("leaf")

W, D = 2.6, 0.8
LEDGE = 1.08
WORK = 0.74
FRONT_D = 0.3      # depth of the tall front body (y from -0.4 to -0.1)
fy0, fy1 = -D / 2, -D / 2 + FRONT_D

# tall front body (visitor side), white, softly rounded
box((W - 0.04, FRONT_D - 0.04, LEDGE - 0.05), loc=(0, (fy0 + fy1) / 2 + 0.01, (LEDGE - 0.05) / 2 + 0.02), material=white, round=0.02, segments=3)
# recessed kick plinth
box((W - 0.12, FRONT_D - 0.1, 0.04), loc=(0, (fy0 + fy1) / 2 + 0.03, 0.02), material=dark, round=0.006, segments=1)
# accent stripe wrapping the front at mid height
box((W - 0.02, FRONT_D - 0.02, 0.07), loc=(0, (fy0 + fy1) / 2 + 0.01, 0.62), material=accent, round=0.012, segments=2)
# vertical oak slats on the front face for texture
for i in range(13):
    x = -1.08 + i * 0.18
    box((0.05, 0.015, 0.46), loc=(x, fy0 + 0.023, 0.31), material=oak, round=0.006, segments=2)
for i in range(13):
    x = -1.08 + i * 0.18
    box((0.05, 0.015, 0.3), loc=(x, fy0 + 0.023, 0.84), material=oak, round=0.006, segments=2)

# transaction ledge: oak, overhanging the visitor side, top at 1.08
LT = 0.04
extrude_shape(rrect(W, 0.36, 0.04, 4, cy=fy0 + 0.18), LT, loc=(0, 0, LEDGE - LT), material=oak, round=0.012)

# receptionist work surface on the +Y side, top at 0.74
WT = 0.035
extrude_shape(rrect(W - 0.06, D - FRONT_D + 0.02, 0.04, 4, cy=(fy1 + D / 2) / 2 - 0.01), WT, loc=(0, 0, WORK - WT), material=oak, round=0.01)
# end panels supporting the work surface (white), plus a small modesty rail
for s in (-1, 1):
    box((0.04, D - FRONT_D, WORK - WT), loc=(s * (W / 2 - 0.04), (fy1 + D / 2) / 2, (WORK - WT) / 2), material=white, round=0.012, segments=2)
# drawer pedestal under the work surface (right)
box((0.42, 0.42, WORK - WT - 0.02), loc=(0.8, 0.17, (WORK - WT - 0.02) / 2 + 0.01), material=white, round=0.012, segments=2)
for k in range(3):
    zc = 0.12 + k * 0.2
    box((0.12, 0.02, 0.016), loc=(0.8, 0.39, zc + 0.06), material=dark, round=0.006, segments=2)
    box((0.4, 0.006, 0.004), loc=(0.8, 0.384, zc - 0.035), material=dark)

# ---- on the work surface
# monitor (back toward the visitor): panel facing +Y, back shell and stand visible from the front
mx, my = -0.35, 0.05
box((0.2, 0.16, 0.012), loc=(mx, my + 0.03, WORK + 0.006), material=dark, round=0.005, segments=2)
box((0.06, 0.022, 0.3), loc=(mx, my, WORK + 0.16), material=dark, round=0.008, segments=2, rot=(rad(6), 0, 0))
box((0.56, 0.028, 0.34), loc=(mx, my + 0.02, WORK + 0.33), material=dark, round=0.008, segments=2)
box((0.3, 0.02, 0.2), loc=(mx, my, WORK + 0.32), material=dark, round=0.012, segments=2)
quad(0.52, 0.3, (mx, my + 0.0345, WORK + 0.335), mat("screen", "#41507e"), facing="+Y", name="screen")
# keyboard
box((0.38, 0.13, 0.014), loc=(mx, 0.28, WORK + 0.007), material=white, round=0.005, segments=2)

# service bell on the ledge (visitor side)
bx, by = 0.7, -0.24
cyl(0.065, 0.016, loc=(bx, by, LEDGE + 0.008), material=dark, verts=20, round=0.005)
lathe([(0.058, 0.0), (0.057, 0.026), (0.045, 0.052), (0.023, 0.067), (0.0, 0.07)], accent, segments=20).location = (bx, by, LEDGE + 0.016)
cyl(0.005, 0.016, loc=(bx, by, LEDGE + 0.092), material=dark, verts=8)
sphere(0.01, loc=(bx, by, LEDGE + 0.104), material=dark, segments=8, rings=5)

# plant on the work surface, left end (tall enough to peek over the ledge)
top = pot((-1.05, 0.15, WORK), r=0.09, h=0.22, material=white, soil=dark, segments=18)
leafy_plant(top, height=0.4, spread=0.13, leaf_mat=leaf, stem_mat=leaf, seed=11, n=20, leaf_len=0.08, leaf_w=0.04, segs=6)

done("reception_desk", views=[(-0.8, 1.2, 0.7)])
