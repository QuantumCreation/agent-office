"""Kitchen counter run, 4.6 (x) x 0.65 (y). Base cabinets (doors + drawers), worktop at 0.9, backsplash,
upper cabinets (bottom 1.45, top 2.2, depth 0.35) at the back (+Y), inset sink with gooseneck faucet,
kettle, fruit bowl and paper towel holder. Clear 0.5 m spot on the worktop at x = +1.4 for the coffee machine."""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_home import *  # noqa: E402,F401,F403

reset()
cab = mat("cabinet", "sage")
oak = mat("oak")
white = mat("white")
metal = mat("chrome", roughness=0.25)
coral = mat("coral")
butter = mat("butter")

W, D = 4.6, 0.65
TOP = 0.9
YB = D / 2  # back (+Y)
YF = -0.3  # carcass front
SINK = (-1.6, -1.0, -0.22, 0.16)  # x0, x1, y0, y1 of the worktop cut-out

# toe kick + carcass (lowered under the sink so the basin is visible)
box((W - 0.02, 0.55, 0.1), loc=(0, YB - 0.275, 0.05), material=cab)
for x0, x1, top in ((-2.3, -1.6, 0.86), (-1.6, -1.0, 0.68), (-1.0, 2.3, 0.86)):
    box((x1 - x0, YB - YF, top - 0.1), loc=((x0 + x1) / 2, (YB + YF) / 2, 0.1 + (top - 0.1) / 2), material=cab)
cabinet_fronts([(0.6, "d3"), (0.8, "doors2"), (0.6, "door_l"), (0.6, "d2"), (0.6, "door_r"), (0.8, "doors2"), (0.6, "d3")],
               -2.3, YF, 0.11, 0.85, cab, metal)

# worktop with a hole for the sink (3x3 slabs minus the middle one)
xs = [-2.3, SINK[0], SINK[1], 2.3]
ys = [-0.325, SINK[2], SINK[3], YB]
for i in range(3):
    for j in range(3):
        if i == 1 and j == 1:
            continue
        box((xs[i + 1] - xs[i], ys[j + 1] - ys[j], 0.04), loc=((xs[i] + xs[i + 1]) / 2, (ys[j] + ys[j + 1]) / 2, TOP - 0.02), material=oak)
# soft front nosing
box((W, 0.02, 0.04), loc=(0, -0.325 + 0.008, TOP - 0.02), material=oak, round=0.008, segments=2)

# sink basin, rim and drain
sx0, sx1, sy0, sy1 = SINK
cx, cy = (sx0 + sx1) / 2, (sy0 + sy1) / 2
bw, bd, bz = sx1 - sx0, sy1 - sy0, 0.7
box((bw - 0.01, bd - 0.01, 0.012), loc=(cx, cy, bz), material=metal)
for sgn in (-1, 1):
    box((0.008, bd, TOP - bz), loc=(cx + sgn * (bw / 2 - 0.004), cy, (TOP + bz) / 2), material=metal)
    box((bw, 0.008, TOP - bz), loc=(cx, cy + sgn * (bd / 2 - 0.004), (TOP + bz) / 2), material=metal)
    box((bw + 0.05, 0.025, 0.008), loc=(cx, cy + sgn * (bd / 2 + 0.0), TOP + 0.003), material=metal, round=0.003, segments=1)
    box((0.025, bd + 0.05, 0.008), loc=(cx + sgn * (bw / 2), cy, TOP + 0.003), material=metal, round=0.003, segments=1)
cyl(0.035, 0.008, loc=(cx, cy, bz + 0.008), material=white, verts=14)

# gooseneck faucet + lever + soap bottle
fx, fy = cx, sy1 + 0.07
cyl(0.03, 0.03, loc=(fx, fy, TOP + 0.015), material=metal, verts=14)
neck = [(fx, fy, TOP + 0.02), (fx, fy, TOP + 0.25)] + bezier((fx, fy, TOP + 0.25), (fx, fy, TOP + 0.4), (fx, fy - 0.2, TOP + 0.38), n=8, p3=(fx, fy - 0.2, TOP + 0.24))[1:]
ptube(neck, 0.013, metal, sides=10)
box((0.012, 0.07, 0.012), loc=(fx + 0.035, fy + 0.01, TOP + 0.09), material=metal, round=0.005, rot=(math.radians(20), 0, 0))
cyl(0.018, 0.04, loc=(fx + 0.02, fy, TOP + 0.08), material=metal, verts=10, rot=(0, math.pi / 2, 0))
cyl(0.032, 0.13, loc=(sx1 + 0.12, 0.2, TOP + 0.065), material=coral, verts=14)
ptube([(sx1 + 0.12, 0.2, TOP + 0.13), (sx1 + 0.12, 0.2, TOP + 0.17), (sx1 + 0.12, 0.17, TOP + 0.17)], 0.006, metal, sides=6)

# backsplash
box((W, 0.015, 1.45 - TOP), loc=(0, YB - 0.0075, (TOP + 1.45) / 2), material=white)

# upper cabinets: carcass + 8 doors, handles near the bottom edge
UZ0, UZ1, UD = 1.45, 2.2, 0.35
box((W, UD - 0.02, UZ1 - UZ0), loc=(0, YB - (UD - 0.02) / 2, (UZ0 + UZ1) / 2), material=cab)
cabinet_fronts([(W / 8, "door_r" if i % 2 == 0 else "door_l") for i in range(8)], -W / 2, YB - (UD - 0.02), UZ0 + 0.005, UZ1 - 0.005, cab, metal, handle_at="bottom")
# crown trim
box((W, UD, 0.03), loc=(0, YB - UD / 2, UZ1 + 0.015), material=cab, round=0.008, segments=1)

# kettle (retro, coral) on its base
kx, ky = 0.5, 0.05
cyl(0.085, 0.02, loc=(kx, ky, TOP + 0.01), material=metal, verts=20)
lathe([(0.08, TOP + 0.02), (0.095, TOP + 0.05), (0.098, TOP + 0.1), (0.088, TOP + 0.16), (0.06, TOP + 0.2), (0.035, TOP + 0.21), (0.0, TOP + 0.215)], coral, segments=20).location = (kx, ky, 0)
sphere(0.016, loc=(kx, ky, TOP + 0.225), material=metal, segments=10, rings=6)
ptube([(kx + 0.06, ky, TOP + 0.19), (kx + 0.11, ky, TOP + 0.22), (kx + 0.14, ky, TOP + 0.17), (kx + 0.12, ky, TOP + 0.08), (kx + 0.093, ky, TOP + 0.06)], 0.012, coral, sides=8)
stem([(kx - 0.08, ky, TOP + 0.07), (kx - 0.13, ky, TOP + 0.13), (kx - 0.15, ky, TOP + 0.17)], 0.018, coral, sides=8, taper=0.5)

# fruit bowl with apples, lemons and bananas
bx, by = -1.95, 0.02
lathe([(0.0, TOP), (0.06, TOP), (0.08, TOP + 0.01), (0.15, TOP + 0.07), (0.155, TOP + 0.085), (0.145, TOP + 0.085), (0.075, TOP + 0.025), (0.0, TOP + 0.022)], white, segments=24).location = (bx, by, 0)
fruit = [(-0.05, -0.03, coral, 0.042), (0.05, -0.04, coral, 0.042), (0.0, 0.05, butter, 0.04), (0.07, 0.05, coral, 0.04), (-0.065, 0.045, butter, 0.038), (0.0, -0.0, coral, 0.042)]
for i, (dx, dy, m, r) in enumerate(fruit):
    zz = TOP + 0.06 + (0.035 if i == 5 else 0)
    if m is butter:
        sphere(r, loc=(bx + dx, by + dy, zz), material=m, scale=(1.25, 0.9, 0.9), segments=10, rings=6)
    else:
        sphere(r, loc=(bx + dx, by + dy, zz), material=m, segments=10, rings=6)
        cyl(0.003, 0.02, loc=(bx + dx, by + dy, zz + r), material=oak, verts=4)
ban = bezier((bx - 0.11, by + 0.02, TOP + 0.11), (bx, by - 0.06, TOP + 0.06), (bx + 0.11, by + 0.0, TOP + 0.12), n=8)
for k in range(2):
    stem([(x, y + k * 0.03, z + k * 0.01) for x, y, z in ban], 0.02, butter, sides=8, taper=0.5)

# paper towel holder
px, py = 2.05, 0.12
cyl(0.075, 0.02, loc=(px, py, TOP + 0.01), material=oak, verts=20)
cyl(0.008, 0.3, loc=(px, py, TOP + 0.16), material=metal, verts=8)
cyl(0.06, 0.25, loc=(px, py, TOP + 0.145), material=white, verts=20)
sphere(0.016, loc=(px, py, TOP + 0.315), material=oak, segments=10, rings=6)

finish("kitchen_counter")
