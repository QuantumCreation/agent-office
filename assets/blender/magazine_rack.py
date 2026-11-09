"""Oak magazine rack with a carry handle and colorful magazines in two slots."""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_home import *  # noqa: E402,F401,F403

reset()
oak = mat("oak")
coral = mat("coral")
blue = mat("blue")
butter = mat("butter")
white = mat("white")

W = 0.42  # along X
# end panels: flared trapezoid with rounded corners, extruded along X (local x = -z, local y = y)
prof = [(-0.0, -0.12), (-0.0, 0.12), (-0.33, 0.17), (-0.36, 0.15), (-0.36, -0.15), (-0.33, -0.17)]
for sx in (-1, 1):
    extrude_shape(prof, 0.025, loc=(sx * (W / 2) - (0.025 if sx > 0 else 0), 0, 0), material=oak, rot=(0, math.pi / 2, 0), round=0.008)
# centre divider + handle
extrude_shape([(-0.03, -0.006), (-0.03, 0.006), (-0.3, 0.006), (-0.3, -0.006)], W - 0.05, loc=(-(W - 0.05) / 2, 0, 0), material=oak, rot=(0, math.pi / 2, 0))
box((W - 0.03, 0.03, 0.05), loc=(0, 0, 0.43), material=oak, round=0.012, segments=2)
for sx in (-1, 1):
    box((0.03, 0.03, 0.14), loc=(sx * (W / 2 - 0.04), 0, 0.36), material=oak, round=0.008, segments=1)
# bottom board and side slats
box((W - 0.03, 0.26, 0.02), loc=(0, 0, 0.03), material=oak, round=0.006, segments=1)
for sy in (-1, 1):
    for z in (0.12, 0.24):
        y = sy * (0.13 + (z / 0.36) * 0.05)
        box((W - 0.03, 0.012, 0.035), loc=(0, y, z), material=oak, round=0.004, segments=1, rot=(sy * math.radians(-8), 0, 0))

# magazines leaning in both slots
cols = [coral, blue, butter, white, coral, butter]
k = 0
for sy in (-1, 1):
    for i in range(3):
        y = sy * (0.04 + i * 0.022)
        lean = sy * math.radians(-(6 + i * 3))
        box((0.3 - 0.02 * (i % 2), 0.006, 0.36), loc=(0.02 * (i - 1) * sy, y, 0.04 + 0.18), material=cols[k], round=0.002, segments=1, rot=(lean, 0, 0))
        k += 1

finish("magazine_rack")
