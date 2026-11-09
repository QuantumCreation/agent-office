"""Coffee mug with handle (mug) and a second color variant (mug_b)."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_work import *  # noqa: E402,F401,F403


def build(name, color, band):
    reset()
    body = mat("ceramic", color)
    stripe = mat("ceramic_band", band)
    coffee = mat("coffee", "walnut")
    R, H = 0.041, 0.095
    hollow_lathe(R, H, wall=0.005, bottom=0.01, lip=0.004, material=body, segments=28)
    # contrast band near the top
    ring_lathe([(R - 0.0002, H - 0.028), (R + 0.0012, H - 0.026), (R + 0.0012, H - 0.014), (R - 0.0002, H - 0.012)], stripe, segments=28)
    cyl(R - 0.0055, 0.004, loc=(0, 0, H - 0.017), material=coffee, verts=24)
    # handle: a partial torus standing in the XZ plane on the +X side
    ptube(arc_points((R - 0.004, 0, H * 0.5), 0.03, -80, 80, n=16, plane="XZ"), 0.0075, body, sides=10, squash=0.8)
    done(name)


build("mug", "coral", "cream")
build("mug_b", "sky", "navy")
