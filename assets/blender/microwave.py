"""Countertop microwave 0.5 x 0.38 x 0.3 (origin = counter surface). Window door, keypad, glowing display."""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_home import *  # noqa: E402,F401,F403

reset()
body = mat("microwave", "#f4f1ea", roughness=0.4)
dark = mat("charcoal")
glass = mat("glass_window", "#4a5266", alpha=0.45)
disp = mat("emissive_display", "#9dffb0")
metal = mat("chrome", roughness=0.25)

W, D, H = 0.5, 0.38, 0.3
for sx in (-1, 1):
    for y in (-0.13, 0.13):
        cyl(0.014, 0.012, loc=(sx * 0.21, y, 0.006), material=dark, verts=8)
soft_box((W, D, H - 0.012), loc=(0, 0, 0.012 + (H - 0.012) / 2), material=body, round=0.03, cuts=3)
YF = -D / 2
# door: dark frame, window, interior visible through it
dw = 0.35
dx = -W / 2 + 0.015 + dw / 2
box((dw, 0.016, H - 0.05), loc=(dx, YF - 0.006, 0.012 + (H - 0.012) / 2), material=body, round=0.012, segments=2)
box((dw - 0.06, 0.006, H - 0.12), loc=(dx, YF - 0.016, 0.012 + (H - 0.012) / 2), material=glass)
box((dw - 0.04, 0.004, H - 0.1), loc=(dx, YF - 0.013, 0.012 + (H - 0.012) / 2), material=dark)
box((0.016, 0.03, H - 0.11), loc=(dx + dw / 2 - 0.025, YF - 0.03, 0.012 + (H - 0.012) / 2), material=metal, round=0.006, segments=2)
# control panel
cx = W / 2 - 0.07
box((0.11, 0.006, H - 0.05), loc=(cx, YF - 0.002, 0.012 + (H - 0.012) / 2), material=dark, round=0.004, segments=1)
box((0.08, 0.004, 0.03), loc=(cx, YF - 0.006, H - 0.055), material=disp)
for r in range(3):
    for c in range(3):
        box((0.02, 0.006, 0.016), loc=(cx - 0.025 + c * 0.025, YF - 0.007, H - 0.1 - r * 0.026), material=body, round=0.003, segments=1)
cyl(0.022, 0.016, loc=(cx, YF - 0.01, 0.07), material=metal, verts=16, rot=(math.pi / 2, 0, 0), round=0.004)

finish("microwave")
