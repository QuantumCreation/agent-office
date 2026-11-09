"""Espresso machine ~0.45 x 0.4 x 0.42 sitting on the counter (origin = counter surface).
Group head + portafilter, cup on the drip tray, cups on the warmer, gauge, buttons, `emissive_led`."""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_home import *  # noqa: E402,F401,F403

reset()
body = mat("coffee_body", "coral", roughness=0.4)
metal = mat("chrome", roughness=0.2)
dark = mat("charcoal")
white = mat("white")
led = mat("emissive_led", "#7dff9a")

# feet + main body
for sx in (-1, 1):
    for y in (-0.08, 0.13):
        cyl(0.016, 0.012, loc=(sx * 0.18, y, 0.006), material=dark, verts=6)
soft_box((0.45, 0.29, 0.36), loc=(0, 0.025, 0.012 + 0.18), material=body, round=0.045, cuts=3)
# front head housing (overhang)
soft_box((0.45, 0.1, 0.14), loc=(0, -0.13, 0.31), material=body, round=0.04, cuts=3)
box((0.38, 0.012, 0.09), loc=(0, -0.181, 0.31), material=metal, round=0.006, segments=2)  # chrome face plate

# drip tray + grate
box((0.34, 0.12, 0.03), loc=(0, -0.15, 0.027), material=dark, round=0.008, segments=2)
box((0.32, 0.1, 0.006), loc=(0, -0.15, 0.044), material=metal, round=0.002, segments=1)

# group head + portafilter
cyl(0.045, 0.04, loc=(0, -0.14, 0.22), material=metal, verts=14, round=0.008)
cyl(0.04, 0.03, loc=(0, -0.14, 0.188), material=metal, verts=16)
ptube([(0, -0.17, 0.188), (0, -0.22, 0.182), (0, -0.265, 0.176)], 0.014, dark, sides=8)
sphere(0.017, loc=(0, -0.27, 0.176), material=dark, segments=10, rings=6)

# espresso cup + saucer on the tray
cyl(0.045, 0.006, loc=(0, -0.15, 0.05), material=white, verts=12)
lathe([(0.0, 0.053), (0.026, 0.053), (0.032, 0.1), (0.027, 0.1), (0.0, 0.066)], white, segments=12).location = (0, -0.15, 0)
torus(0.012, 0.004, loc=(0.035, -0.15, 0.08), material=white, rot=(math.pi / 2, 0, 0), major_seg=10, minor_seg=5)

# pressure gauge + buttons + led
gx, gz = -0.13, 0.31
cyl(0.034, 0.014, loc=(gx, -0.19, gz), material=metal, verts=14, rot=(math.pi / 2, 0, 0))
cyl(0.027, 0.004, loc=(gx, -0.197, gz), material=white, verts=14, rot=(math.pi / 2, 0, 0))
box((0.003, 0.002, 0.022), loc=(gx + 0.005, -0.2, gz + 0.006), material=dark, rot=(0, math.radians(-30), 0))
for i, x in enumerate((0.08, 0.12, 0.16)):
    cyl(0.013, 0.012, loc=(x, -0.19, 0.31), material=dark, verts=10, rot=(math.pi / 2, 0, 0))
sphere(0.006, loc=(0.12, -0.188, 0.345), material=led, segments=8, rings=5)

# steam wand + knob on the right
ptube([(0.2, -0.13, 0.27), (0.24, -0.15, 0.25), (0.25, -0.16, 0.18), (0.25, -0.16, 0.1)], 0.007, metal, sides=8)
cyl(0.018, 0.03, loc=(0.235, -0.1, 0.33), material=dark, verts=10, rot=(0, math.pi / 2, 0))

# cup warmer rail on top with two cups
top = 0.372
rail = [(-0.19, -0.07, top), (-0.19, 0.14, top), (0.19, 0.14, top), (0.19, -0.07, top)]
for a, b in zip(rail, rail[1:] + rail[:1]):
    ptube([a, b], 0.005, metal, sides=5)
for p in rail:
    cyl(0.005, 0.03, loc=(p[0], p[1], top - 0.015), material=metal, verts=5)
for x in (-0.07, 0.07):
    lathe([(0.0, top - 0.01), (0.028, top - 0.01), (0.034, top + 0.05), (0.028, top + 0.05), (0.0, top + 0.004)], white, segments=10).location = (x, 0.035, 0)

finish("coffee_machine")
