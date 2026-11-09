"""Kitchen island 3.0 x 1.1, top at 0.92, waterfall stone top. Closed cabinets face -Y; the +Y side
overhangs 0.45 m for stools (not included) with a fluted oak panel."""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_home import *  # noqa: E402,F401,F403

reset()
stone = mat("stone", "#f2efe9", roughness=0.3)
cab = mat("cabinet", "sage")
oak = mat("oak")
metal = mat("chrome", roughness=0.25)

W, D, TOP, T = 3.0, 1.1, 0.92, 0.05
box((W, D, T), loc=(0, 0, TOP - T / 2), material=stone, round=0.012, segments=2)
for sx in (-1, 1):
    box((T, D, TOP - T + 0.002), loc=(sx * (W / 2 - T / 2), 0, (TOP - T) / 2 + 0.001), material=stone, round=0.012, segments=2)

YF, YB = -0.52, 0.1  # cabinet front / back
IW = W - 2 * T - 0.02
box((IW, YB - YF - 0.06, 0.1), loc=(0, (YF + YB) / 2 + 0.03, 0.05), material=cab)
box((IW, YB - YF, TOP - T - 0.1), loc=(0, (YF + YB) / 2, 0.1 + (TOP - T - 0.1) / 2), material=cab)
cabinet_fronts([(0.6, "d3"), (0.84, "doors2"), (0.6, "d2"), (IW - 2.04, "doors2")], -IW / 2, YF, 0.11, TOP - T - 0.01, cab, metal)

# seating side: fluted oak panel under the overhang
n = 34
for i in range(n):
    x = -IW / 2 + (i + 0.5) * IW / n
    cyl(0.021, TOP - T - 0.1, loc=(x, YB + 0.01, 0.1 + (TOP - T - 0.1) / 2), material=oak, verts=8)
box((IW, 0.02, 0.1), loc=(0, YB + 0.005, 0.05), material=cab)

finish("kitchen_island")
