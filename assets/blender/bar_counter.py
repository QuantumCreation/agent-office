"""Window bar counter: 6.0 (x) x 0.6 (y), oak top at 1.05 on slim charcoal supports,
chrome footrail on the -Y (seating) side."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_work import *  # noqa: E402,F401,F403

reset()
oak = mat("oak")
edge = mat("oak_edge", "oak_dark")
frame = mat("charcoal")
metal = mat("steel", roughness=0.3)

W, D, TOP, T = 6.0, 0.6, 1.05, 0.045
extrude_shape(rrect(W, D, 0.06, 5), T, loc=(0, 0, TOP - T), material=oak, round=0.014)
box((W - 0.06, D - 0.08, 0.012), loc=(0, 0.01, TOP - T - 0.006), material=edge, round=0.004, segments=1)

# slim supports: a post set toward the window side, with a cantilever arm under the top and a foot
POST_Y = 0.12
xs = [-2.7, -0.9, 0.9, 2.7]
for x in xs:
    box((0.06, 0.06, TOP - T - 0.03), loc=(x, POST_Y, (TOP - T - 0.03) / 2 + 0.012), material=frame, round=0.012, segments=2)
    box((0.06, 0.5, 0.035), loc=(x, 0.0, TOP - T - 0.0175 - 0.012), material=frame, round=0.01, segments=2)
    box((0.1, 0.34, 0.024), loc=(x, 0.06, 0.012), material=frame, round=0.008, segments=2)
    # footrail bracket from the post to the rail
    ptube([(x, POST_Y, 0.24), (x, -0.2, 0.24)], 0.012, frame, sides=8)

# footrail with soft returns at the ends
RY, RZ = -0.21, 0.24
r = 0.022
pts = [(-2.9, POST_Y - 0.02, RZ), (-2.9, RY, RZ), (2.9, RY, RZ), (2.9, POST_Y - 0.02, RZ)]
ptube(rounded_path(pts, 0.1, 6), r, metal, sides=12)
for x in (-2.9, 2.9):
    cyl(r + 0.004, 0.02, loc=(x, POST_Y - 0.02, RZ), material=frame, verts=12, rot=(R90, 0, 0), round=0.006)
    ptube([(x, POST_Y - 0.02, RZ), (x, POST_Y - 0.02, 0.012)], 0.012, frame, sides=8)

done("bar_counter", views=[(0.4, -1.0, 0.25)])
