"""Three-seater sofa: 3.0 x 0.95 x ~0.82, seat top at 0.45. Soft cushions (3 seat + 3 back),
rounded arms, short walnut legs, two throw pillows. Upholstery material `fabric_sofa`."""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_home import *  # noqa: E402,F401,F403

reset()
fabric = mat("fabric_sofa", "sage")
pil = mat("accent_pillow", "butter")
wood = mat("walnut")

W, D = 3.0, 0.95
leg_h = 0.09
# legs: short tapered walnut pegs
for sx in (-1, 1):
    for y in (-0.36, 0.36):
        stem([(sx * 1.38, y, leg_h + 0.01), (sx * 1.4, y * 1.02, 0.004)], 0.03, wood, sides=12, taper=0.7)
for y in (-0.36, 0.36):
    stem([(0, y, leg_h + 0.01), (0, y, 0.002)], 0.028, wood, sides=12, taper=0.7)

# base / seat deck between the arms
soft_box((2.66, 0.93, 0.22), loc=(0, 0, leg_h + 0.11), material=fabric, round=0.06)
# back frame
soft_box((2.7, 0.2, 0.6), loc=(0, D / 2 - 0.1, leg_h + 0.3), material=fabric, round=0.08, puff=(0, 0.01, 0.01))
# arms: rounded, slightly puffy on top
for sx in (-1, 1):
    soft_box((0.2, D, 0.55), loc=(sx * (W / 2 - 0.1), 0, leg_h + 0.275), material=fabric, round=0.09, puff=(0.012, 0, 0.02))

# seat cushions (top at 0.45)
cw = 2.6 / 3
for i in range(3):
    x = (i - 1) * cw
    soft_box((cw - 0.02, 0.72, 0.15), loc=(x, -0.085, 0.37), material=fabric, round=0.055, puff=(0, 0.01, 0.012))
    # back cushions, leaning back
    soft_box((cw - 0.03, 0.2, 0.42), loc=(x, 0.2, 0.6), material=fabric, round=0.08, puff=(0, 0.035, 0.0), rot=(math.radians(-12), 0, 0))

# throw pillows
pillow(0.42, 0.42, 0.15, loc=(-0.98, 0.04, 0.64), material=pil, rot=(math.radians(-22), 0, math.radians(14)))
pillow(0.4, 0.4, 0.15, loc=(1.0, 0.04, 0.63), material=pil, rot=(math.radians(-20), 0, math.radians(-10)))

finish("sofa")
