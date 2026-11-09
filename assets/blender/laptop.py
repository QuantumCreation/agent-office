"""Open laptop, ~0.33 wide. Origin on the desk surface at the center of the base footprint.
The lid's display face uses material `screen`."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_work import *  # noqa: E402,F401,F403

reset()
alu = mat("chrome", "#c4c9d4", roughness=0.35)
dark = mat("charcoal")
screen = mat("screen", "#41507e", roughness=0.3)

W, D, BH = 0.33, 0.23, 0.014
box((W, D, BH), loc=(0, 0, BH / 2), material=alu, round=0.005, segments=3)
# keyboard well with key grid, and the trackpad
box((0.29, 0.105, 0.002), loc=(0, 0.035, BH + 0.0005), material=dark, round=0.0008, segments=1)
for r in range(5):
    y = 0.075 - r * 0.0195
    n = 13 if r < 4 else 9
    pitch = 0.0215
    for k in range(n):
        w = 0.017 if r < 4 else (0.017 if k not in (4,) else 0.1)
        if r == 4 and k > 4:
            pass
        x = -pitch * (n - 1) / 2 + k * pitch
        if r == 4:
            # bottom row: spacebar in the middle
            xs = [-0.12, -0.098, -0.076, 0.0, 0.076, 0.098, 0.12]
            ws = [0.017, 0.017, 0.017, 0.11, 0.017, 0.017, 0.017]
            if k >= len(xs):
                break
            x, w = xs[k], ws[k]
        box((w, 0.0155, 0.002), loc=(x, y, BH + 0.0015), material=alu)
box((0.1, 0.062, 0.001), loc=(0, -0.068, BH + 0.0002), material=mat("trackpad", "#b3b8c5"), round=0.0005, segments=1)

# Lid hinged at the back edge, opened ~105 degrees (leaning back 15 degrees)
hinge = (0, D / 2 - 0.006, BH + 0.002)
tilt = (rad(-15), 0, 0)
LH, LT = 0.222, 0.007
box((W, LT, LH), loc=xf(hinge, tilt, (0, 0, LH / 2)), material=alu, round=0.004, segments=3, rot=tilt)
# black bezel and the screen face (quad on the front of the lid)
box((W - 0.008, 0.0012, LH - 0.008), loc=xf(hinge, tilt, (0, -LT / 2 - 0.0004, LH / 2)), material=dark, rot=tilt)
s = quad(0.296, 0.188, (0, 0, 0), screen, facing="-Y", name="screen")
s.location = xf(hinge, tilt, (0, -LT / 2 - 0.0012, LH / 2 + 0.006))
s.rotation_euler = tilt
# hinge barrel
cyl(0.006, 0.26, loc=(0, hinge[1], hinge[2]), material=dark, verts=10, rot=(0, rad(90), 0))

done("laptop", report=("screen",))
