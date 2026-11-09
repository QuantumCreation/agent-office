"""Task chair: five-star base with casters, gas lift, padded seat and back, armrests.
Sized for bloops (a little wider than a human chair). Seat top at 0.505 m. Front faces -Y.

Exports three models:
  office_chair       the whole chair (previews, anything static)
  office_chair_base  the parts that stay put (star base, casters, lower gas lift)
  office_chair_top   the parts that swivel (lift column, seat, back, arms); origin on the swivel axis
"""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403


def materials():
    return mat("accent_fabric", "blue"), mat("charcoal"), mat("chrome", roughness=0.25)


def build_base():
    fabric, frame, metal = materials()
    for i in range(5):
        a = math.radians(90 + i * 72)
        end = (math.cos(a) * 0.3, math.sin(a) * 0.3)
        tube([(0, 0, 0.1), (end[0] * 0.55, end[1] * 0.55, 0.085), (end[0], end[1], 0.075)], 0.022, frame, sides=8)
        cyl(0.032, 0.03, loc=(end[0], end[1], 0.035), material=frame, verts=14, rot=(math.radians(90), 0, a), round=0.012)
        box((0.03, 0.03, 0.04), loc=(end[0], end[1], 0.06), material=frame)
    cyl(0.055, 0.06, loc=(0, 0, 0.1), material=frame, verts=16, round=0.015)
    cyl(0.034, 0.16, loc=(0, 0, 0.2), material=frame, verts=16)  # gas lift sleeve


def build_top():
    fabric, frame, metal = materials()
    cyl(0.022, 0.14, loc=(0, 0, 0.34), material=metal, verts=14)  # lift column

    # Seat mechanism and seat
    box((0.24, 0.26, 0.04), loc=(0, 0.02, 0.405), material=frame, round=0.01)
    box((0.58, 0.5, 0.05), loc=(0, 0, 0.43), material=frame, round=0.02)  # seat shell
    box((0.57, 0.49, 0.07), loc=(0, -0.005, 0.47), material=fabric, round=0.035, segments=4)  # cushion
    box((0.55, 0.06, 0.05), loc=(0, -0.23, 0.465), material=fabric, round=0.024, segments=4)  # waterfall edge

    # Back support spine and backrest (tilted back ~10°)
    tilt = math.radians(-10)
    box((0.07, 0.04, 0.32), loc=(0, 0.26, 0.58), material=frame, round=0.015, rot=(tilt, 0, 0))
    box((0.54, 0.05, 0.5), loc=(0, 0.3, 0.86), material=frame, round=0.025, rot=(tilt, 0, 0))  # back shell
    box((0.51, 0.05, 0.46), loc=(0, 0.275, 0.86), material=fabric, round=0.03, segments=4, rot=(tilt, 0, 0))  # pad
    box((0.42, 0.04, 0.1), loc=(0, 0.245, 0.71), material=fabric, round=0.018, rot=(tilt, 0, 0))  # lumbar

    # Armrests
    for s in (-1, 1):
        tube([(s * 0.26, 0.05, 0.43), (s * 0.32, 0.05, 0.47), (s * 0.32, 0.05, 0.6)], 0.016, frame, sides=8)
        box((0.07, 0.26, 0.035), loc=(s * 0.32, 0.02, 0.625), material=frame, round=0.015)


reset()
build_base()
build_top()
finish("office_chair")

reset()
build_base()
finish("office_chair_base", preview=False)

reset()
build_top()
finish("office_chair_top", preview=False)
