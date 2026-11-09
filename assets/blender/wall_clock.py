"""Wall clock, D0.35, center at z = 2.2. Origin on the floor at the wall (back at y = 0). Shows 10:10."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_work import *  # noqa: E402,F401,F403

reset()
rim = mat("accent_rim", "coral")
face = mat("white")
dark = mat("charcoal")
red = mat("hand_red", "terracotta")

R, CZ = 0.175, 2.2
# rim: a chunky ring (lathed profile turned to face -Y)
ring = ring_lathe([(R - 0.02, 0.0), (R, 0.0), (R + 0.0, 0.0), (R, 0.038), (R - 0.008, 0.046), (R - 0.02, 0.044), (R - 0.022, 0.03)], rim, segments=40)
ring.rotation_euler = (R90, 0, 0)
ring.location = (0, 0, CZ)
wall_disc(R - 0.004, 0.006, 0, CZ, 0.0, rim, verts=40)  # back plate
wall_disc(R - 0.018, 0.004, 0, CZ, -0.026, face, verts=40)  # face at y = -0.03
FY = -0.03
# ticks
for i in range(12):
    a = math.radians(90 - 30 * i)
    L = 0.03 if i % 3 == 0 else 0.016
    w = 0.012 if i % 3 == 0 else 0.007
    rr = R - 0.04 - L / 2
    box((w, 0.003, L), loc=(math.cos(a) * rr, FY - 0.0015, CZ + math.sin(a) * rr), material=dark, rot=(0, math.pi / 2 - a, 0))


def hand(angle_deg, length, width, y, m, tail=0.02):
    a = math.radians(angle_deg)
    # angle measured clockwise from 12 o'clock
    dx, dz = math.sin(a), math.cos(a)
    cx, cz = dx * (length - tail) / 2, dz * (length - tail) / 2
    box((width, 0.003, length + tail), loc=(cx, y, CZ + cz), material=m, round=0.0012, segments=1, rot=(0, a, 0))


hand(305, 0.085, 0.014, FY - 0.004, dark)        # hour (10)
hand(60, 0.125, 0.009, FY - 0.008, dark)         # minute (10)
hand(190, 0.13, 0.004, FY - 0.011, red, 0.035)    # second
cyl(0.011, 0.012, loc=(0, FY - 0.008, CZ), material=red, verts=14, rot=(R90, 0, 0), round=0.003)

done("wall_clock")
