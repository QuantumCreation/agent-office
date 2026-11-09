"""Mid-century armchair: 0.9 x 0.9, seat top at 0.45, walnut frame with tapered legs and wooden arms,
plump seat and back cushions in `fabric_armchair`."""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_home import *  # noqa: E402,F401,F403

reset()
fabric = mat("fabric_armchair", "peach")
wood = mat("walnut")

X = 0.405  # side frame plane
for sx in (-1, 1):
    x = sx * X
    # front leg rises into the arm support; back leg splays back
    stem([(x, -0.38, 0.004), (x, -0.355, 0.33), (x, -0.33, 0.58)], 0.022, wood, sides=10, taper=1.25)
    stem([(x, 0.43, 0.006), (x, 0.35, 0.3)], 0.019, wood, sides=10, taper=1.4)
    # side rail joining the legs under the seat
    box((0.045, 0.72, 0.06), loc=(x, -0.01, 0.31), material=wood, round=0.015, segments=2)
    # arm rest: flat, rounded board
    box((0.085, 0.66, 0.035), loc=(x, -0.08, 0.6), material=wood, round=0.016, segments=3)
    # back post holding the reclined back
    stem([(x, 0.3, 0.3), (x, 0.38, 0.6), (x, 0.43, 0.8)], 0.02, wood, sides=10, taper=0.8)
# front and back seat rails
box((0.8, 0.045, 0.06), loc=(0, -0.37, 0.31), material=wood, round=0.015, segments=2)
box((0.8, 0.045, 0.06), loc=(0, 0.34, 0.31), material=wood, round=0.015, segments=2)
# back rail behind the cushion
box((0.8, 0.035, 0.06), loc=(0, 0.42, 0.72), material=wood, round=0.012, segments=2, rot=(math.radians(-18), 0, 0))

# seat cushion (top ~0.45)
soft_box((0.74, 0.72, 0.13), loc=(0, -0.03, 0.39), material=fabric, round=0.05, puff=(0, 0.01, 0.012))
# back cushion, reclined
soft_box((0.72, 0.15, 0.46), loc=(0, 0.3, 0.66), material=fabric, round=0.065, puff=(0, 0.03, 0.0), rot=(math.radians(-18), 0, 0))
# small lumbar pillow
pillow(0.36, 0.22, 0.1, loc=(0, 0.17, 0.56), material=fabric, rot=(math.radians(-18), 0, 0))

finish("armchair")
