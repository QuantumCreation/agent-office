"""Acoustic desk divider between back-to-back desks: 1.6 (x) x 0.04 (y) x 0.42 tall.
Origin on the desk surface on the divider's center line. Felt panel uses `accent_felt`."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_work import *  # noqa: E402,F401,F403

reset()
felt = mat("accent_felt", "sage")
frame = mat("frame", "chrome")
clamp = mat("charcoal")

W, H, D = 1.6, 0.42, 0.04
BOT = 0.035  # panel bottom edge above the desk
# felt panel: thick, softly rounded
fh = H - BOT - 0.012
box((W - 0.03, 0.032, fh), loc=(0, 0, BOT + 0.006 + fh / 2), material=felt, round=0.012, segments=3)
# thin aluminum frame: a rounded loop around the panel edge
x0, x1 = -W / 2 + 0.01, W / 2 - 0.01
z0, z1 = BOT, H - 0.01
loop_tube([(x0, 0, z0), (x1, 0, z0), (x1, 0, z1), (x0, 0, z1)], 0.01, frame, corner=0.04, seg=5, sides=10)
# a slim cap rail along the top edge
box((W - 0.06, 0.036, 0.008), loc=(0, 0, H - 0.012), material=frame, round=0.003, segments=1)

# two clamps at the bottom: a block on the desk gripping the frame, with a thumb screw
for x in (-0.5, 0.5):
    box((0.07, 0.05, 0.03), loc=(x, 0, 0.015), material=clamp, round=0.008, segments=2)
    box((0.05, 0.034, 0.02), loc=(x, 0, 0.038), material=clamp, round=0.006, segments=2)
    cyl(0.009, 0.012, loc=(x, -0.031, 0.015), material=frame, verts=12, rot=(R90, 0, 0))

done("desk_divider")
