"""Low-profile keyboard, 0.42 x 0.14, origin on the desk surface."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_work import *  # noqa: E402,F401,F403

reset()
base = mat("charcoal")
keys = mat("offwhite")
acc = mat("accent_key", "coral")

W, D = 0.42, 0.14
# Slim slightly wedged base
box((W, D, 0.012), loc=(0, 0, 0.006), material=base, round=0.005, segments=2)
# raised back edge (low wedge feel)
box((W - 0.01, 0.014, 0.006), loc=(0, D / 2 - 0.009, 0.013), material=base, round=0.003, segments=1)

PITCH = 0.0235
KW = 0.019
rows = [
    # (y, list of key widths in units), top row (+Y, far) to bottom (-Y, near)
    [1] * 13 + [1.6],
    [1.5] + [1] * 12 + [1.1],
    [1.8] + [1] * 11 + [1.8],
    [2.3] + [1] * 10 + [2.3],
    [1.2, 1.2, 1.4, 6.4, 1.4, 1.2, 1, 1, 1],
]
z_top = 0.012
n_rows = len(rows)
for ri, row in enumerate(rows):
    y = 0.045 - ri * 0.0225
    total = sum(row) * PITCH
    x = -total / 2
    for ki, u in enumerate(row):
        w = u * PITCH - (PITCH - KW)
        m = acc if (ri == 0 and ki == 0) or (ri == 2 and ki == len(row) - 1) else keys
        box((w, 0.018, 0.006), loc=(x + u * PITCH / 2, y, z_top + 0.003), material=m)
        x += u * PITCH

done("keyboard")
