"""Articulated desk lamp. Origin on the desk surface at the center of the round base; the arm
reaches forward (-Y) and the shade (with `emissive_bulb`) points down at the desk."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_work import *  # noqa: E402,F401,F403
from mathutils import Vector  # noqa: E402

reset()
body = mat("lamp_body", "butter")
joint = mat("charcoal")
bulb = mat("emissive_bulb", "#fff1c4")

# Weighted base
lathe([(0.075, 0.0), (0.078, 0.006), (0.076, 0.016), (0.066, 0.024), (0.02, 0.03), (0.0, 0.031)], body, segments=20)
cyl(0.022, 0.03, loc=(0, 0.0, 0.04), material=joint, verts=12, round=0.006).modifiers["Bevel"].segments = 2

P0 = Vector((0, 0.0, 0.05))     # shoulder
P1 = Vector((0, 0.07, 0.29))    # elbow
P2 = Vector((0, -0.13, 0.36))   # head pivot

# Double-rod arms (classic architect lamp)
for a, b in ((P0, P1), (P1, P2)):
    for s in (-1, 1):
        off = Vector((s * 0.012, 0, 0))
        ptube([a + off, b + off], 0.0055, body, sides=8)
# tension spring between the lower rods
a = P0.lerp(P1, 0.12)
b = P0.lerp(P1, 0.62)
ptube([a + Vector((0, 0.0, 0.0)), b], 0.006, joint, sides=8)
# joints
for p in (P0, P1, P2):
    cyl(0.017, 0.04, loc=tuple(p), material=joint, verts=12, rot=(0, rad(90), 0), round=0.004).modifiers["Bevel"].segments = 1

# Shade: a flared cone pointing down and slightly back toward the base area
shade = lathe(
    [(0.008, 0.0), (0.03, -0.006), (0.052, -0.05), (0.068, -0.1), (0.072, -0.104),
     (0.066, -0.102), (0.048, -0.056), (0.026, -0.012), (0.006, -0.008)],
    body, segments=18, name="shade")
shade.location = tuple(P2 + Vector((0, -0.03, -0.004)))
shade.rotation_euler = (rad(-12), 0, 0)
cap = cyl(0.02, 0.03, loc=tuple(P2 + Vector((0, -0.03, 0.006))), material=joint, verts=12, rot=(rad(-12), 0, 0), round=0.006)
cap.modifiers["Bevel"].segments = 2
# bulb inside the shade
b = sphere(0.032, material=bulb, segments=10, rings=6)
b.location = xf(tuple(P2 + Vector((0, -0.03, -0.004))), (rad(-12), 0, 0), (0, 0, -0.075))
b.scale = (1, 1, 0.75)

done("desk_lamp", views=[(-1.0, -0.4, 0.3)])
