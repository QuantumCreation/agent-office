"""Bar stool: round padded seat (accent_fabric) at 0.75, D0.4, four slim splayed legs and a footring."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_work import *  # noqa: E402,F401,F403

reset()
fabric = mat("accent_fabric", "coral")
frame = mat("charcoal")
metal = mat("steel", roughness=0.3)

SEAT = 0.75
# padded seat: a plump cushion on a thin charcoal pan
lathe([(0.17, SEAT - 0.06), (0.196, SEAT - 0.055), (0.2, SEAT - 0.035), (0.196, SEAT - 0.012), (0.18, SEAT - 0.002),
       (0.12, SEAT), (0.0, SEAT)][:-1] + [(0.001, SEAT)], fabric, segments=32)
cyl(0.18, 0.02, loc=(0, 0, SEAT - 0.065), material=frame, verts=28, round=0.008)
cyl(0.07, 0.03, loc=(0, 0, SEAT - 0.085), material=frame, verts=16, round=0.008)

# four legs splaying out
TOP_R, BOT_R, LEG_TOP = 0.12, 0.195, SEAT - 0.075
for i in range(4):
    a = rad(45 + 90 * i)
    c, s = math.cos(a), math.sin(a)
    ptube([(c * BOT_R, s * BOT_R, 0.012), (c * TOP_R, s * TOP_R, LEG_TOP)], 0.017, frame, sides=10)
    cyl(0.019, 0.012, loc=(c * BOT_R, s * BOT_R, 0.006), material=frame, verts=10, round=0.004)

# footring wrapped around the legs
FZ = 0.28
fr = BOT_R + (TOP_R - BOT_R) * (FZ - 0.012) / (LEG_TOP - 0.012)
torus(fr + 0.006, 0.013, loc=(0, 0, FZ), material=metal, major_seg=32, minor_seg=8)

done("bar_stool")
