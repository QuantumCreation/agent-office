"""Small standing photo frame (landscape) with a tiny sunny-hills picture. Origin on the desk surface."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_work import *  # noqa: E402,F401,F403

reset()
frame = mat("frame", "walnut")
sky = mat("photo_sky", "sky")
hill = mat("photo_hill", "leaf_light")
hill2 = mat("photo_hill2", "sage")
sun = mat("photo_sun", "butter")

FW, FH, FD = 0.18, 0.135, 0.016
tilt = rad(-12)  # lean back
base = (0, 0.0, 0.0)


def P(local):
    return xf((0, 0.012, 0.0), (tilt, 0, 0), local)


# frame body (rounded slab), picture recessed slightly on its front
f = box((FW, FD, FH), loc=P((0, 0, FH / 2)), material=frame, round=0.006, segments=3, rot=(tilt, 0, 0))
pw, ph = FW - 0.03, FH - 0.03
fy = -FD / 2 - 0.0006
s = quad(pw, ph, (0, 0, 0), sky, name="sky")
s.location = P((0, fy, FH / 2))
s.rotation_euler = (tilt, 0, 0)

# picture elements: built flat as thin wall shapes, then tilted with the frame
def pic(points, m, dz):
    o = wall_shape(points, 0.0008, y_back=0, material=m)
    o.location = P((0, fy - 0.0002 - dz, FH / 2))
    o.rotation_euler = (tilt + R90, 0, 0)
    return o


pic(circle_pts(0.016, 20, 0.035, 0.025), sun, 0.0)
pic([(-pw / 2, -ph / 2)] + [(x, -0.02 + 0.03 * math.exp(-((x + 0.03) / 0.04) ** 2)) for x in [i * pw / 14 - pw / 2 for i in range(15)]] + [(pw / 2, -ph / 2)], hill2, 0.0004)
pic([(-pw / 2, -ph / 2)] + [(x, -0.035 + 0.025 * math.exp(-((x - 0.03) / 0.05) ** 2)) for x in [i * pw / 14 - pw / 2 for i in range(15)]] + [(pw / 2, -ph / 2)], hill, 0.0008)

# kickstand behind
ks_top = P((0, FD / 2, FH * 0.6))
box((0.03, 0.006, 0.09), loc=((0, ks_top[1] + 0.03, 0.045)), material=frame, round=0.002, segments=1, rot=(rad(25), 0, 0))

done("photo_frame", views=[(0.6, 1.2, 0.5)])
