"""Wall-mounted 2.2 m (16:9) TV. Origin on the floor at the wall: back at y = 0, extends toward -Y.
Center at z = 1.55. The display face uses material `screen`."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_work import *  # noqa: E402,F401,F403

reset()
body = mat("charcoal")
back = mat("slate")
screen = mat("screen", "#2f3a5c", roughness=0.25)
led = mat("emissive_led", "#ff9a7a")

W, H, CZ = 2.2, 1.24, 1.55
# wall bracket + rear housing
box((0.5, 0.025, 0.36), loc=(0, -0.0125, CZ), material=back, round=0.006, segments=1)
box((1.5, 0.02, 0.8), loc=(0, -0.035, CZ - 0.04), material=back, round=0.01, segments=2)
# slim panel (bezel), front face at y = -0.06
box((W, 0.025, H), loc=(0, -0.0475, CZ), material=body, round=0.008, segments=3)
SW, SH = 2.17, 1.2
quad(SW, SH, (0, -0.0605, CZ), screen, facing="-Y", name="screen")
# small chin logo / LED under the screen
box((0.016, 0.004, 0.006), loc=(0, -0.0605, CZ - H / 2 + 0.008), material=led)

done("tv", report=("screen",))
