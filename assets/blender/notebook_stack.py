"""A small stack of notebooks with a pen on top. Origin on the desk surface."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_work import *  # noqa: E402,F401,F403

reset()
paper = mat("paper")
covers = [mat("cover_a", "navy"), mat("cover_b", "coral"), mat("cover_c", "sage")]
pen = mat("charcoal")

z = 0.0
specs = [  # (w, d, thickness, rot deg, dx, dy, cover)
    (0.215, 0.285, 0.016, 4, 0.004, 0.0, 0),
    (0.17, 0.23, 0.013, -7, -0.008, -0.006, 1),
    (0.15, 0.21, 0.01, 10, 0.006, 0.004, 2),
]
for w, d, t, r, dx, dy, ci in specs:
    rot = (0, 0, rad(r))
    c = covers[ci]
    cv = 0.0016
    # covers
    box((w, d, cv), loc=(dx, dy, z + cv / 2), material=c, round=0.0007, segments=1, rot=rot)
    box((w, d, cv), loc=(dx, dy, z + t - cv / 2), material=c, round=0.0007, segments=1, rot=rot)
    # page block, inset on three sides
    pb = box((w - 0.008, d - 0.006, t - 2 * cv), loc=(0, 0, 0), material=paper, rot=rot)
    pb.location = xf((dx, dy, z + t / 2), rot, (0.004, 0, 0))
    # spine wrap on the -X side
    sp = box((0.006, d, t), loc=(0, 0, 0), material=c, round=0.0025, segments=2, rot=rot)
    sp.location = xf((dx, dy, z + t / 2), rot, (-w / 2 + 0.002, 0, 0))
    z += t

# elastic band on the top notebook
w, d, t, r, dx, dy, ci = specs[-1]
rot = (0, 0, rad(r))
eb = box((0.006, d + 0.002, 0.0012), loc=(0, 0, 0), material=pen, rot=rot)
eb.location = xf((dx, dy, z + 0.0004), rot, (w / 2 - 0.025, 0, 0))
# bookmark ribbon peeking out of the middle book
w2, d2, t2, r2, dx2, dy2, _ = specs[1]
rb = box((0.008, 0.03, 0.0008), loc=(0, 0, 0), material=covers[2], rot=(0, 0, rad(r2)))
rb.location = xf((dx2, dy2, specs[0][2] + t2 / 2), (0, 0, rad(r2)), (0.02, -d2 / 2 - 0.012, 0))

# pen lying diagonally on top
prot = (0, rad(90), rad(30))
L = 0.14
pz = z + 0.0055
cyl(0.0055, L, loc=(0.01, -0.02, pz), material=pen, verts=10, rot=prot)
tip = cyl(0.0055, 0.016, loc=(0, 0, 0), material=mat("pen_tip", "chrome"), verts=10, radius2=0.0012, rot=prot)
tip.location = xf((0.01, -0.02, pz), prot, (0, 0, L / 2 + 0.008))
clip = box((0.045, 0.003, 0.002), loc=(0, 0, 0), material=mat("pen_tip", "chrome"), rot=(0, 0, rad(30)))
clip.location = xf((0.01, -0.02, pz), prot, (0.0058, 0, -L / 2 + 0.03))
clip.rotation_euler = (0, 0, rad(30))
clip.location.z = pz + 0.0058

done("notebook_stack")
