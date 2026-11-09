"""Over-ear headphones resting flat on the desk (cups swivelled down, band arching to +Y).
Origin on the desk surface at the footprint center."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_work import *  # noqa: E402,F401,F403

reset()
shell = mat("accent_shell", "lilac")
dark = mat("charcoal")
metal = mat("steel")

CX = 0.085   # cup centers at x = +-CX
CY = -0.03
# cups: dark cushion at the bottom, colored shell on top, with a cap plate
for s in (-1, 1):
    x = s * CX
    for o in (
        cyl(0.045, 0.018, loc=(x, CY, 0.009), material=dark, verts=16, round=0.008),
        cyl(0.042, 0.022, loc=(x, CY, 0.028), material=shell, verts=16, round=0.008),
    ):
        o.modifiers["Bevel"].segments = 2
    cyl(0.03, 0.006, loc=(x, CY, 0.0395), material=dark, verts=14)
    # yoke: a fork on the outer side of each cup
    ptube([(x + s * 0.048, CY - 0.02, 0.026), (x + s * 0.052, CY, 0.028), (x + s * 0.048, CY + 0.02, 0.026)], 0.004, metal, sides=6)
    ptube([(x + s * 0.052, CY, 0.028), (x + s * 0.06, CY + 0.03, 0.03)], 0.004, metal, sides=6)

# headband: an arc in the XY plane from one yoke over to the other, lifting slightly in the middle
pts = []
for i in range(17):
    t = i / 16
    a = math.pi * t
    x = -math.cos(a) * (CX + 0.06)
    y = CY + 0.03 + math.sin(a) * 0.13
    z = 0.03 + 0.012 * math.sin(a)
    pts.append((x, y, z))
ptube(pts, 0.007, metal, sides=6, squash=0.6)
# padded top section
pad = pts[4:13]
ptube([(p[0], p[1], p[2] + 0.003) for p in pad], 0.012, dark, sides=8, squash=0.55)

done("headphones")
