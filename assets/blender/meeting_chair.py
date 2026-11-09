"""Sled-base guest/meeting chair. Seat top at 0.47, footprint ~0.55 x 0.55.
Seat and back upholstery use `accent_fabric`; the person faces -Y."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_work import *  # noqa: E402,F401,F403

reset()
fabric = mat("accent_fabric", "coral")
shell = mat("shell", "white")
metal = mat("chrome", roughness=0.25)

SX = 0.235
for s in (-1, 1):
    x = s * SX
    # sled loop: floor runner, front leg up, under-seat rail, back leg down
    loop_tube([(x, -0.255, 0.014), (x, 0.255, 0.014), (x, 0.2, 0.41), (x, -0.205, 0.41)], 0.014, metal, corner=0.07, seg=5, sides=10)
    # back support strut rising from the rear corner to the backrest
    ptube(rounded_path([(x, 0.19, 0.41), (s * 0.19, 0.3, 0.55), (s * 0.17, 0.336, 0.74)], 0.06, 5), 0.012, metal, sides=10)
    # arm: a soft loop rising from the seat rail, with a white pad on top
    loop_tube([(x, -0.15, 0.41), (x, -0.15, 0.63), (x, 0.16, 0.63), (x, 0.16, 0.41)], 0.011, metal, corner=0.06, seg=4, sides=8, closed=False)
    box((0.05, 0.27, 0.024), loc=(x, 0.005, 0.645), material=shell, round=0.011, segments=2)
# cross bars under the seat
for y in (-0.15, 0.15):
    ptube([(-SX, y, 0.405), (SX, y, 0.405)], 0.01, metal, sides=8)

# seat: white shell + plump cushion (top at 0.47)
box((0.52, 0.5, 0.035), loc=(0, -0.01, 0.425), material=shell, round=0.016, segments=3)
box((0.5, 0.48, 0.05), loc=(0, -0.015, 0.445), material=fabric, round=0.024, segments=4)
box((0.48, 0.07, 0.045), loc=(0, -0.22, 0.443), material=fabric, round=0.022, segments=3)

# back: tilted shell with cushion
tilt = (rad(-12), 0, 0)
piv = (0, 0.24, 0.5)
box((0.5, 0.035, 0.34), loc=xf(piv, tilt, (0, 0.02, 0.24)), material=shell, round=0.016, segments=3, rot=tilt)
box((0.46, 0.05, 0.3), loc=xf(piv, tilt, (0, -0.012, 0.24)), material=fabric, round=0.024, segments=4, rot=tilt)

done("meeting_chair", views=[(0.9, 0.9, 0.5), (1.0, 0.0, 0.15)])
