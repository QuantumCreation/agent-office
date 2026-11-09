"""Slouchy beanbag, ~0.9 diameter, squashed with a seat dimple and a raised back. `fabric_beanbag`."""

import math
import os
import sys

import bmesh

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib import _assign, _from_bmesh  # noqa: E402
from lib_home import *  # noqa: E402,F401,F403

reset()
fabric = mat("fabric_beanbag", "coral")

R = 0.45
bm = bmesh.new()
bmesh.ops.create_uvsphere(bm, u_segments=36, v_segments=18, radius=1.0)
for v in bm.verts:
    ux, uy, uz = v.co
    ang = math.atan2(uy, ux)
    h = math.sqrt(max(0.0, 1 - uz * uz))
    up = max(uz, 0.0)
    # horizontal: widest just above the floor, slightly lumpy
    rxy = R * (1.0 - 0.25 * up ** 1.5) * (1 + 0.025 * math.sin(5 * ang + 0.7))
    x, y = math.cos(ang) * rxy * h, math.sin(ang) * rxy * h
    if uz < 0:
        z = 0.17 * (1 + uz) ** 0.8  # squashed onto the floor
    else:
        # target top surface: high at the back (+Y), low lip at the front, dimple in the seat
        yy = y / R
        top = 0.48 + 0.22 * yy + 0.05 * (x / R) ** 2
        top -= 0.2 * math.exp(-(x ** 2 + 1.3 * (y + 0.04) ** 2) / 0.05)
        z = 0.17 + (top - 0.17) * (1 - (1 - up) ** 2.2)
        z += 0.008 * math.sin(7 * ang) * up
    v.co = (x, y, z)
_assign(_from_bmesh("beanbag", bm), fabric)

finish("beanbag")
