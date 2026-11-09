"""Multifunction copier 0.7 x 0.65 x 1.05: cabinet with paper trays, body with output bay,
scanner/feeder on top, tilted control panel with an `emissive_led`. Front faces -Y."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_work import *  # noqa: E402,F401,F403

reset()
white = mat("white")
grey = mat("printer_grey", "#cfd3dc")
dark = mat("charcoal")
paper = mat("paper")
led = mat("emissive_led", "#7dffa0")
disp = mat("emissive_display", "#9fd8ff")

W, D = 0.7, 0.65
CAST = 0.04
# lower cabinet with three paper trays
CAB_H = 0.5
box((W, D - 0.04, CAB_H), loc=(0, 0.02, CAST + CAB_H / 2), material=grey, round=0.015, segments=2)
th = (CAB_H - 0.04) / 3
for i in range(3):
    zc = CAST + 0.02 + th * (i + 0.5)
    box((W - 0.03, 0.02, th - 0.012), loc=(0, -D / 2 + 0.026, zc), material=white, round=0.008, segments=2)
    box((0.2, 0.012, 0.03), loc=(0, -D / 2 + 0.012, zc + th * 0.18), material=dark, round=0.006, segments=2)
    # paper-level window
    box((0.04, 0.004, 0.02), loc=(W / 2 - 0.08, -D / 2 + 0.015, zc), material=dark)
# casters
for sx in (-1, 1):
    for sy in (-1, 1):
        cyl(0.02, 0.02, loc=(sx * (W / 2 - 0.06), sy * (D / 2 - 0.07), 0.02), material=dark, verts=12, rot=(0, R90, 0))

# main body
MB0 = CAST + CAB_H
MB_H = 0.355
box((W, D - 0.02, MB_H), loc=(0, 0.01, MB0 + MB_H / 2), material=white, round=0.02, segments=3)
# output bay: a dark recess on the front-left with paper sheets
BAY_H = 0.12
box((W - 0.22, 0.4, BAY_H), loc=(-0.08, -D / 2 + 0.18, MB0 + MB_H - 0.1), material=dark, round=0.01, segments=1)
for k in range(3):
    box((0.3, 0.22, 0.004), loc=(-0.08, -D / 2 + 0.16, MB0 + MB_H - 0.155 + k * 0.006), material=paper, rot=(0, 0, rad(3 * k - 3)))
# front panel door seam and a toner door handle
box((W - 0.04, 0.006, 0.1), loc=(0, -D / 2 + 0.018, MB0 + 0.08), material=grey, round=0.003, segments=1)
box((0.14, 0.012, 0.022), loc=(0, -D / 2 + 0.012, MB0 + 0.08), material=dark, round=0.006, segments=2)

# scanner bed + document feeder on top
SC0 = MB0 + MB_H
box((W - 0.02, D - 0.04, 0.07), loc=(0, 0.01, SC0 + 0.035), material=grey, round=0.015, segments=2)
box((W - 0.12, D - 0.12, 0.055), loc=(-0.03, 0.03, SC0 + 0.095), material=white, round=0.02, segments=3)
# feeder tray with a sheet
box((0.34, 0.26, 0.012), loc=(-0.05, 0.04, SC0 + 0.13), material=grey, round=0.005, segments=1, rot=(rad(-6), 0, 0))
box((0.28, 0.22, 0.003), loc=(-0.05, 0.04, SC0 + 0.139), material=paper, rot=(rad(-6), 0, 0))

# control panel: tilted slab at the front right, with a small display and buttons
tilt = (rad(28), 0, 0)
cp = (0.2, -D / 2 + 0.045, SC0 + 0.065)
box((0.26, 0.15, 0.03), loc=cp, material=dark, round=0.01, segments=2, rot=tilt)
s = box((0.13, 0.08, 0.004), loc=xf(cp, tilt, (-0.045, 0.0, 0.016)), material=disp, rot=tilt)
box((0.014, 0.014, 0.006), loc=xf(cp, tilt, (0.095, 0.035, 0.016)), material=led, round=0.002, segments=1, rot=tilt)
for i in range(3):
    for j in range(2):
        box((0.018, 0.016, 0.006), loc=xf(cp, tilt, (0.05 + i * 0.024, -0.01 - j * 0.026, 0.016)), material=grey, round=0.002, segments=1, rot=tilt)

done("printer", views=[(1.2, -0.3, 0.6)])
