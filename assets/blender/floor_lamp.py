"""Arc floor lamp, ~1.9 m tall: marble block base (origin at its centre), brass arc reaching ~0.9 m
toward the front (-Y), dome shade `emissive_shade`."""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_home import *  # noqa: E402,F401,F403

reset()
marble = mat("marble", "#ece9e4", roughness=0.3)
brass = mat("brass", "#d6b46a", roughness=0.3)
shade = mat("emissive_shade", "#fff1cf")

# marble block with a softly rounded top and a brass collar
box((0.26, 0.34, 0.13), loc=(0, 0, 0.065), material=marble, round=0.025, segments=3)
cyl(0.035, 0.03, loc=(0, 0.06, 0.145), material=brass, verts=16, round=0.008)

# arc: straight rise, then a smooth curve over to the shade
reach = -0.92
pts = [(0, 0.06, 0.13), (0, 0.06, 0.6)] + bezier((0, 0.06, 0.6), (0, 0.06, 1.85), (0, -0.62, 2.1), n=16, p3=(0, reach, 1.74))[1:]
ptube(pts, 0.018, brass, sides=10)
# shade: dome with a little brass cap
sz = 1.74
cyl(0.03, 0.04, loc=(0, reach, sz - 0.005), material=brass, verts=14, round=0.01)
prof = [(0.03, sz - 0.02), (0.09, sz - 0.03), (0.15, sz - 0.07), (0.195, sz - 0.13), (0.215, sz - 0.19), (0.22, sz - 0.215),
        (0.205, sz - 0.215), (0.2, sz - 0.19), (0.18, sz - 0.13), (0.135, sz - 0.075), (0.08, sz - 0.042), (0.03, sz - 0.035)]
lathe(prof, shade, segments=32).location = (0, reach, 0)
sphere(0.055, loc=(0, reach, sz - 0.13), material=shade, segments=14, rings=8)

finish("floor_lamp")
