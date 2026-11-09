"""24" monitor on a stand. Origin at the desk surface, center of the stand base.
Panel 0.62 x 0.38 x 0.03, center (0, 0.03, 0.34). Screen face (material `screen`) 0.58 x 0.34 on the -Y face."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_work import *  # noqa: E402,F401,F403

reset()
bezel = mat("charcoal")
stand = mat("slate")
screen = mat("screen", "#41507e", roughness=0.3)
led = mat("emissive_led", "#7dffa0")

PW, PH, PD = 0.62, 0.38, 0.03
PC = (0, 0.03, 0.34)
front_y = PC[1] - PD / 2  # 0.015

# Panel (bezel) with softly rounded edges
box((PW, PD, PH), loc=PC, material=bezel, round=0.008, segments=3)
# Rear housing bump
box((0.4, 0.028, 0.24), loc=(0, front_y + PD + 0.012, 0.33), material=bezel, round=0.012, segments=3)

# Screen: a single quad, 1 mm proud of the bezel front face
quad(0.58, 0.34, (0, front_y - 0.001, PC[2]), screen, facing="-Y", name="screen")

# Power LED on the bottom bezel, right side
box((0.012, 0.004, 0.004), loc=(0.26, front_y - 0.0015, PC[2] - PH / 2 + 0.01), material=led)

# Stand: rounded base plate + neck rising to the back of the panel
box((0.22, 0.18, 0.014), loc=(0, 0, 0.007), material=stand, round=0.006, segments=3)
box((0.12, 0.05, 0.012), loc=(0, 0.06, 0.018), material=stand, round=0.005, segments=2)
box((0.07, 0.024, 0.36), loc=(0, 0.075, 0.2), material=stand, round=0.01, segments=3, rot=(rad(-6), 0, 0))
# hinge block
box((0.1, 0.03, 0.06), loc=(0, 0.072, 0.36), material=stand, round=0.01, segments=2)
# cable-management hole hint on the neck
box((0.03, 0.006, 0.05), loc=(0, 0.0905, 0.15), material=bezel, round=0.003, segments=1, rot=(rad(-6), 0, 0))

done("monitor", report=("screen",))
