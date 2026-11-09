"""Computer mouse, origin on the desk surface. Buttons toward -Y."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_work import *  # noqa: E402,F401,F403

reset()
body = mat("white")
dark = mat("charcoal")

# Dome body: lathe a soft profile, then squash into an egg shape (taller toward the back)
prof = [(0.92, 0.0), (1.0, 0.08), (1.0, 0.25), (0.94, 0.5), (0.78, 0.74), (0.52, 0.92), (0.25, 0.99), (0.01, 1.0)]
m = lathe(prof, body, segments=24, name="mouse")
m.scale = (0.031, 0.054, 0.033)
m.location = (0, 0.004, 0)
# dark rubber skirt
cyl(0.03, 0.004, loc=(0, 0.004, 0.002), material=dark, verts=24).scale = (1.0, 1.75, 1.0)
# button split line and scroll wheel
cyl(0.0065, 0.005, loc=(0, -0.02, 0.0285), material=dark, verts=12, rot=(0, rad(90), 0))

done("mouse")
