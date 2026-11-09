"""Oak coffee table 1.6 x 0.8, top at 0.4, slatted lower shelf; on top: books, a small plant, a mug."""

import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_home import *  # noqa: E402,F401,F403

reset()
rnd = random.Random(2)
oak = mat("oak")
white = mat("white")
coral = mat("coral")
blue = mat("blue")
green = mat("leaf", "#3f9e52")
brown = mat("walnut")

T = 0.4
extrude_shape(rrect(1.6, 0.8, 0.1, n=5), 0.045, loc=(0, 0, T - 0.045), material=oak, round=0.012)
# apron
for sy in (-1, 1):
    box((1.36, 0.03, 0.06), loc=(0, sy * 0.3, T - 0.075), material=oak, round=0.008, segments=2)
for sx in (-1, 1):
    box((0.03, 0.56, 0.06), loc=(sx * 0.68, 0, T - 0.075), material=oak, round=0.008, segments=2)
# legs, tapered and slightly splayed
for sx in (-1, 1):
    for sy in (-1, 1):
        stem([(sx * 0.66, sy * 0.28, T - 0.045), (sx * 0.7, sy * 0.31, 0.004)], 0.03, oak, sides=12, taper=0.62)
# slatted lower shelf
for sx in (-1, 1):
    box((0.035, 0.6, 0.03), loc=(sx * 0.665, 0, 0.12), material=oak, round=0.008, segments=2)
for i in range(7):
    box((1.3, 0.06, 0.018), loc=(0, -0.24 + i * 0.08, 0.142), material=oak, round=0.006, segments=1)


def book(w, d, h, loc, cover, yaw=0.0):
    x, y, z = loc
    rot = (0, 0, yaw)
    box((w - 0.01, d - 0.008, h - 0.006), loc=(x, y, z + h / 2), material=white, rot=rot)
    for zz in (z + 0.0025, z + h - 0.0025):
        box((w, d, 0.005), loc=(x, y, zz), material=cover, round=0.002, segments=1, rot=rot)
    c, s = math.cos(yaw), math.sin(yaw)
    box((0.006, d, h), loc=(x - c * (w / 2 - 0.003), y - s * (w / 2 - 0.003), z + h / 2), material=cover, rot=rot)


# books on the top and on the shelf
book(0.3, 0.22, 0.035, (-0.42, 0.06, T), coral, yaw=0.12)
book(0.26, 0.19, 0.03, (-0.42, 0.05, T + 0.035), blue, yaw=-0.08)
book(0.24, 0.18, 0.04, (-0.4, 0.06, T + 0.065), white if False else coral, yaw=0.25)
book(0.32, 0.24, 0.03, (0.35, 0.0, 0.151), blue, yaw=-0.1)
book(0.3, 0.22, 0.03, (0.36, 0.0, 0.181), coral, yaw=0.15)

# mug
mx, my = 0.1, -0.16
lathe([(0.0, T), (0.044, T), (0.05, T + 0.008), (0.05, T + 0.1), (0.043, T + 0.1), (0.043, T + 0.014), (0.0, T + 0.014)], blue, segments=18).location = (mx, my, 0)
cyl(0.043, 0.004, loc=(mx, my, T + 0.085), material=brown, verts=18)
torus(0.027, 0.0075, loc=(mx + 0.055, my, T + 0.052), material=blue, rot=(math.pi / 2, 0, 0), major_seg=12, minor_seg=6)

# small potted plant
px, py = 0.5, 0.12
lathe([(0.0, T), (0.06, T), (0.072, T + 0.1), (0.078, T + 0.106), (0.068, T + 0.106), (0.068, T + 0.095), (0.0, T + 0.095)], white, segments=20).location = (px, py, 0)
cyl(0.066, 0.006, loc=(px, py, T + 0.098), material=brown, verts=16)
for j in range(14):
    a = j * math.radians(137.5)
    f = j / 13
    leaf(0.12 - 0.035 * f, 0.07, (px + math.cos(a) * 0.015, py + math.sin(a) * 0.015, T + 0.1), yaw=a, pitch=math.radians(25 + 45 * f), roll=0.2,
         material=green, droop=0.9, fold=0.3, shape="ellipse", segs=4, thick=0.002)

finish("coffee_table")
