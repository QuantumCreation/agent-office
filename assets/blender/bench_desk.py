"""Bench desk: one desk of a back-to-back bench. Top 1.6 x 0.8, surface at 0.74.
The person sits at -Y; the cable tray and modesty panel are on the +Y (back) side."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_work import *  # noqa: E402,F401,F403

reset()
oak = mat("oak")
oak_edge = mat("oak_dark")
frame = mat("charcoal")
panel = mat("slate")

TOP = 0.74
T = 0.03

# Desktop: oak slab with a slightly darker rounded edge band underneath (reads as a thick, friendly top)
box((1.6, 0.8, T), loc=(0, 0, TOP - T / 2), material=oak, round=0.012, segments=3)
box((1.56, 0.76, 0.012), loc=(0, 0, TOP - T - 0.004), material=oak_edge, round=0.004, segments=1)

# Sled legs: a rounded rectangular loop of tube at each end
LEG_X = 0.72
for s in (-1, 1):
    x = s * LEG_X
    pts = [(x, -0.34, 0.022), (x, 0.34, 0.022), (x, 0.34, 0.69), (x, -0.34, 0.69)]
    loop_tube(pts, 0.022, frame, corner=0.08, seg=5, sides=10)
    # top mounting plate under the desktop
    box((0.07, 0.64, 0.016), loc=(x, 0, 0.701), material=frame, round=0.006, segments=1)
    # floor glides
    for y in (-0.31, 0.31):
        box((0.05, 0.06, 0.01), loc=(x, y, 0.005), material=panel, round=0.004, segments=1)

# Crossbeam linking the two legs, just under the top
box((2 * LEG_X, 0.05, 0.05), loc=(0, 0.12, 0.68), material=frame, round=0.012, segments=2)

# Short modesty panel at the back (+Y), between the legs
box((1.36, 0.018, 0.26), loc=(0, 0.33, 0.56), material=panel, round=0.008, segments=2)
for s in (-1, 1):
    box((0.06, 0.04, 0.06), loc=(s * 0.66, 0.33, 0.66), material=frame, round=0.01, segments=1)

# Cable tray under the back edge: a shallow open trough on two brackets, with cables lying in it
TY = 0.22
TZ = 0.6
L = 1.1
box((L, 0.16, 0.01), loc=(0, TY, TZ), material=frame, round=0.004, segments=1)
box((L, 0.01, 0.06), loc=(0, TY - 0.08, TZ + 0.025), material=frame, round=0.004, segments=1)
box((L, 0.01, 0.06), loc=(0, TY + 0.08, TZ + 0.025), material=frame, round=0.004, segments=1)
for x in (-0.4, 0.4):
    box((0.03, 0.02, 0.12), loc=(x, TY + 0.07, TZ + 0.06), material=frame)
for k, (y, r) in enumerate([(-0.03, 0.009), (0.0, 0.011), (0.03, 0.008)]):
    tube([(-0.62, TY + y + 0.02, TZ + 0.02), (-0.45, TY + y, TZ + 0.016), (0.0, TY + y * 1.3, TZ + 0.017),
          (0.45, TY + y, TZ + 0.016), (0.6, TY + y - 0.01, TZ + 0.03)], r, panel, sides=6)

done("bench_desk", views=[(-0.5, 1.2, 0.35), (0.3, -1.2, 0.12)])
