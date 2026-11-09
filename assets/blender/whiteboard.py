"""Wall-mounted whiteboard 2.4 x 1.15, center at z = 1.45. Origin on the floor at the wall (back at y = 0).
Aluminum frame, marker tray with three markers and an eraser, and some doodles."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_work import *  # noqa: E402,F401,F403

reset()
board = mat("white")
alu = mat("chrome")
dark = mat("charcoal")
c_red = mat("ink_red", "coral")
c_blue = mat("ink_blue", "blue")
c_green = mat("ink_green", "leaf")

W, H, CZ = 2.4, 1.15, 1.45
BD = 0.018
wall_slab(W - 0.02, H - 0.02, BD, 0, CZ, 0.0, board)
fy = -BD  # board surface plane
# frame rails
F = 0.028
box((W, 0.03, F), loc=(0, -0.015, CZ + H / 2 - F / 2), material=alu, round=0.008, segments=2)
box((W, 0.03, F), loc=(0, -0.015, CZ - H / 2 + F / 2), material=alu, round=0.008, segments=2)
for s in (-1, 1):
    box((F, 0.03, H), loc=(s * (W / 2 - F / 2), -0.015, CZ), material=alu, round=0.008, segments=2)
    for t in (-1, 1):
        box((0.05, 0.034, 0.05), loc=(s * (W / 2 - 0.025), -0.017, CZ + t * (H / 2 - 0.025)), material=dark, round=0.012, segments=2)

# marker tray along the bottom
TZ = CZ - H / 2 - 0.012
box((1.0, 0.07, 0.012), loc=(0.3, -0.035, TZ), material=alu, round=0.004, segments=1)
box((1.0, 0.008, 0.026), loc=(0.3, -0.068, TZ + 0.008), material=alu, round=0.003, segments=1)
for i, m in enumerate((c_red, c_blue, c_green)):
    x = 0.05 + i * 0.13
    cyl(0.009, 0.1, loc=(x, -0.035, TZ + 0.015), material=dark, verts=10, rot=(0, R90, 0))
    cyl(0.0095, 0.035, loc=(x + 0.066, -0.035, TZ + 0.015), material=m, verts=10, rot=(0, R90, 0), round=0.003)
# eraser
box((0.13, 0.05, 0.02), loc=(0.6, -0.035, TZ + 0.016), material=dark, round=0.006, segments=2)
box((0.12, 0.045, 0.022), loc=(0.6, -0.035, TZ + 0.035), material=c_blue, round=0.008, segments=2)

# ---- doodles: thin colored strokes just proud of the surface
D = 0.0015
y0 = fy
def stroke(points, m, w=0.009):
    o = ptube([(x, 0.0, z) for x, z in points], w, m, sides=6)
    o.scale = (1, 0.25, 1)
    o.location = (0, y0 - 0.0005, 0)

# bar chart on the left
bx, bz = -0.85, CZ - 0.3
for i, (h, m) in enumerate([(0.18, c_blue), (0.3, c_green), (0.24, c_blue), (0.42, c_red)]):
    wall_slab(0.07, h, D, bx + i * 0.1, bz + h / 2, y0, m)
stroke([(bx - 0.06, bz + 0.5), (bx - 0.06, bz), (bx + 0.42, bz)], dark)
# trend line with an arrow
stroke([(bx - 0.02, bz + 0.12), (bx + 0.1, bz + 0.25), (bx + 0.2, bz + 0.2), (bx + 0.33, bz + 0.45)], c_red)
stroke([(bx + 0.27, bz + 0.44), (bx + 0.33, bz + 0.45), (bx + 0.33, bz + 0.39)], c_red)
# a flow diagram: two boxes and a circle connected by arrows
def rbox_outline(cx, cz, w, h, m):
    stroke(rounded_path([(cx - w / 2, cz - h / 2), (cx + w / 2, cz - h / 2), (cx + w / 2, cz + h / 2), (cx - w / 2, cz + h / 2), (cx - w / 2, cz - h / 2 + 0.001)], 0.03, 3), m)
rbox_outline(-0.05, CZ + 0.25, 0.3, 0.16, c_blue)
rbox_outline(0.55, CZ + 0.25, 0.3, 0.16, c_blue)
stroke([(0.11, CZ + 0.25), (0.38, CZ + 0.25)], dark)
stroke([(0.34, CZ + 0.28), (0.385, CZ + 0.25), (0.34, CZ + 0.22)], dark)
circ = [(0.25 + 0.11 * math.cos(a), CZ - 0.12 + 0.11 * math.sin(a)) for a in [2 * math.pi * k / 20 for k in range(21)]]
stroke(circ, c_green)
stroke([(0.55, CZ + 0.16), (0.55, CZ - 0.05), (0.37, CZ - 0.11)], dark)
# scribbled "text" lines
for i, L in enumerate((0.42, 0.34, 0.38)):
    z = CZ + 0.42 - i * 0.07
    pts = [(-0.95 + t * L, z + 0.008 * math.sin(t * 40)) for t in [k / 12 for k in range(13)]]
    stroke(pts, dark, 0.006)
# sticky-note style blocks top right
wall_slab(0.12, 0.12, 0.003, 0.95, CZ + 0.3, y0, c_red, r=0.004)
wall_slab(0.12, 0.12, 0.003, 0.82, CZ + 0.26, y0, c_green, r=0.004)
wall_slab(0.12, 0.12, 0.003, 0.95, CZ + 0.15, y0, c_blue, r=0.004)

done("whiteboard")
