"""Snack vending machine 0.9 x 0.8 x 1.85: glass front with rows of colorful snacks on a lit back,
glowing header sign, keypad column, pickup bin."""

import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_home import *  # noqa: E402,F401,F403

reset()
rnd = random.Random(4)
body = mat("vend_body", "#7fb8e6", roughness=0.4)
dark = mat("charcoal")
glass = mat("glass_front", "#dff2ff", alpha=0.25)
lit = mat("emissive_panel", "#fff6e0")
s1 = mat("snack_coral", "#ff7a6b")
s2 = mat("snack_butter", "#ffc94a")

W, D, H = 0.9, 0.8, 1.85
YB = D / 2
YF = -D / 2
BODY_F = YF + 0.1  # recessed display back
box((W - 0.04, D - 0.04, 0.06), loc=(0, 0, 0.03), material=dark)
box((W, YB - BODY_F, H - 0.06), loc=(0, (YB + BODY_F) / 2, 0.06 + (H - 0.06) / 2), material=body, round=0.03, segments=2)
# window opening and frame
X0, X1, Z0, Z1 = -0.41, 0.17, 0.52, 1.66
fr = 0.1
box((X0 + W / 2, fr, H - 0.06), loc=((X0 - W / 2) / 2, YF + fr / 2, 0.06 + (H - 0.06) / 2), material=body, round=0.02, segments=2)
box((W / 2 - X1, fr, H - 0.06), loc=((X1 + W / 2) / 2, YF + fr / 2, 0.06 + (H - 0.06) / 2), material=body, round=0.02, segments=2)
box((X1 - X0, fr, Z0 - 0.06), loc=((X0 + X1) / 2, YF + fr / 2, 0.06 + (Z0 - 0.06) / 2), material=body, round=0.01, segments=1)
box((X1 - X0, fr, H - Z1), loc=((X0 + X1) / 2, YF + fr / 2, Z1 + (H - Z1) / 2), material=body, round=0.01, segments=1)
# lit back + glass
box((X1 - X0, 0.01, Z1 - Z0), loc=((X0 + X1) / 2, BODY_F - 0.005, (Z0 + Z1) / 2), material=lit)
box((X1 - X0 + 0.01, 0.008, Z1 - Z0 + 0.01), loc=((X0 + X1) / 2, YF + 0.006, (Z0 + Z1) / 2), material=glass)
# header sign
box((W - 0.12, 0.01, 0.1), loc=(0, YF - 0.004, 1.75), material=lit, round=0.004, segments=1)

# shelves and snacks
rows = 5
rh = (Z1 - Z0) / rows
cols = 5
cw = (X1 - X0) / cols
mats = [s1, s2, dark]
for r in range(rows):
    zs = Z0 + r * rh + 0.012
    box((X1 - X0, 0.08, 0.012), loc=((X0 + X1) / 2, YF + 0.055, zs - 0.006), material=dark)
    box((X1 - X0, 0.006, 0.03), loc=((X0 + X1) / 2, YF + 0.014, zs + 0.01), material=dark)  # price rail
    kind = ["can", "bag", "bar", "bag", "box"][r]
    for c in range(cols):
        x = X0 + (c + 0.5) * cw
        m = mats[(r + c) % 3]
        y = YF + 0.05
        if kind == "can":
            cyl(0.03, 0.11, loc=(x, y, zs + 0.055), material=m, verts=12, round=0.006)
        elif kind == "bag":
            soft_box((0.085, 0.04, 0.15), loc=(x, y, zs + 0.075), material=m, round=0.015, cuts=2, puff=(0, 0.012, 0))
        elif kind == "bar":
            for k in range(2):
                box((0.085, 0.018, 0.05), loc=(x, y - 0.012 + k * 0.03, zs + 0.03 + k * 0.006), material=m, round=0.004, segments=1, rot=(math.radians(-10), 0, 0))
        else:
            box((0.075, 0.035, 0.13), loc=(x, y, zs + 0.065), material=m, round=0.006, segments=1)

# keypad column
kx = (X1 + W / 2) / 2
box((0.11, 0.006, 0.05), loc=(kx, YF - 0.003, 1.28), material=lit)
for r in range(4):
    for c in range(3):
        box((0.026, 0.008, 0.022), loc=(kx - 0.032 + c * 0.032, YF - 0.004, 1.2 - r * 0.03), material=dark, round=0.003, segments=1)
box((0.06, 0.008, 0.012), loc=(kx, YF - 0.004, 1.0), material=dark)  # coin slot
box((0.09, 0.008, 0.05), loc=(kx, YF - 0.004, 0.93), material=dark, round=0.006, segments=1)  # card reader
# pickup bin
box((0.46, 0.012, 0.16), loc=((X0 + X1) / 2, YF - 0.006, 0.3), material=dark, round=0.01, segments=2)
box((0.4, 0.008, 0.04), loc=((X0 + X1) / 2, YF - 0.012, 0.35), material=body, round=0.004, segments=1)

finish("vending_machine")
