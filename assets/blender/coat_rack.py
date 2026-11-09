"""Standing coat rack (~1.75 tall): weighted base, oak pole, hook crown,
a mustard coat and a coral scarf hanging on it."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_work import *  # noqa: E402,F401,F403
from mathutils import Vector  # noqa: E402

reset()
wood = mat("oak_dark")
metal = mat("charcoal")
coat_m = mat("coat", "butter")
scarf_m = mat("scarf", "coral")
hat_m = mat("hat", "navy")

HT = 1.75
# weighted base: a low dome
lathe([(0.2, 0.0), (0.205, 0.008), (0.195, 0.025), (0.12, 0.05), (0.04, 0.062), (0.0, 0.063)], metal, segments=32)
# pole
cyl(0.022, HT - 0.1, loc=(0, 0, 0.05 + (HT - 0.1) / 2), material=wood, verts=14)
sphere(0.04, loc=(0, 0, HT - 0.02), material=wood, segments=14, rings=8)
cyl(0.03, 0.03, loc=(0, 0, HT - 0.07), material=metal, verts=14, round=0.008)
# umbrella ring partway up
torus(0.1, 0.008, loc=(0, 0, 0.42), material=metal, major_seg=28, minor_seg=6)
for i in range(3):
    a = rad(90 + 120 * i)
    ptube([(0, 0, 0.42), (math.cos(a) * 0.1, math.sin(a) * 0.1, 0.42)], 0.006, metal, sides=6)

# hook crown: 6 curved hooks with ball tips
HZ = HT - 0.12
hooks = []
for i in range(6):
    a = rad(30 + 60 * i)
    c, s = math.cos(a), math.sin(a)
    pts = [(c * 0.02, s * 0.02, HZ), (c * 0.09, s * 0.09, HZ - 0.02), (c * 0.14, s * 0.14, HZ + 0.02), (c * 0.15, s * 0.15, HZ + 0.07)]
    ptube(rounded_path(pts, 0.04, 4), 0.009, wood, sides=8)
    sphere(0.016, loc=(c * 0.15, s * 0.15, HZ + 0.08), material=wood, segments=10, rings=6)
    hooks.append((a, Vector((c * 0.11, s * 0.11, HZ - 0.005))))

# coat hanging from the hook facing -X-ish (a = 210 deg)
a, hp = hooks[3]
c, s = math.cos(a), math.sin(a)
# coat body: lathed garment silhouette, flattened along the radial direction
coat = lathe([(0.02, 0.0), (0.06, -0.03), (0.13, -0.09), (0.14, -0.2), (0.135, -0.5), (0.15, -0.85), (0.155, -0.9), (0.001, -0.9)][:-1], coat_m, segments=20)
coat.scale = (0.45, 1.0, 1.0)
coat.rotation_euler = (0, 0, a)
coat.location = tuple(hp + Vector((c * 0.075, s * 0.075, 0.0)))
# sleeves hanging at the sides
for side in (-1, 1):
    tx, ty = -s * side, c * side  # tangent direction
    base = hp + Vector((c * 0.07 + tx * 0.13, s * 0.07 + ty * 0.13, -0.1))
    ptube([base, base + Vector((tx * 0.015, ty * 0.015, -0.3)), base + Vector((tx * 0.01, ty * 0.01, -0.55))], [0.042, 0.04, 0.036], coat_m, sides=10)
# collar
torus(0.05, 0.016, loc=tuple(hp + Vector((c * 0.065, s * 0.065, -0.02))), material=coat_m, rot=(0, 0, 0), major_seg=16, minor_seg=6).scale = (0.8, 0.8, 0.6)
# buttons
for k in range(3):
    sphere(0.011, loc=tuple(hp + Vector((c * (0.075 + 0.065), s * (0.075 + 0.065), -0.25 - k * 0.15))), material=metal, segments=8, rings=4)

# scarf draped over the hook at a = 30 deg: a flat band looping over and hanging down both sides
a, hp = hooks[0]
c, s = math.cos(a), math.sin(a)
tx, ty = -s, c
top = hp + Vector((0, 0, 0.012))
for side, L in ((-1, 0.55), (1, 0.42)):
    p0 = top + Vector((tx * side * 0.01, ty * side * 0.01, 0))
    pts = [p0, p0 + Vector((c * 0.02 + tx * side * 0.03, s * 0.02 + ty * side * 0.03, -0.05)),
           p0 + Vector((c * 0.03 + tx * side * 0.04, s * 0.03 + ty * side * 0.04, -L * 0.5)),
           p0 + Vector((c * 0.035 + tx * side * 0.04, s * 0.035 + ty * side * 0.04, -L))]
    ptube(pts, 0.05, scarf_m, sides=8, squash=0.22)
ptube([top + Vector((-tx * 0.02, -ty * 0.02, 0)), top + Vector((0, 0, 0.012)), top + Vector((tx * 0.02, ty * 0.02, 0))], 0.05, scarf_m, sides=8, squash=0.25)

# a hat on the hook at the back
a, hp = hooks[1]
c, s = math.cos(a), math.sin(a)
hc = Vector((c * 0.15, s * 0.15, HZ + 0.07))
cyl(0.11, 0.012, loc=tuple(hc + Vector((0, 0, -0.01))), material=hat_m, verts=24, round=0.005)
lathe([(0.075, 0.0), (0.072, 0.07), (0.05, 0.095), (0.0, 0.1)], hat_m, segments=20).location = tuple(hc + Vector((0, 0, -0.005)))

done("coat_rack", views=[(-1.0, -0.6, 0.4)])
