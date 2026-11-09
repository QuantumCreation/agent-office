"""Umbrella stand: mint metal cylinder with two closed umbrellas (one with a J handle)."""

import math
import os
import sys

from mathutils import Euler, Matrix, Vector

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_home import *  # noqa: E402,F401,F403

reset()
stand = mat("stand", "mint")
coral = mat("coral")
blue = mat("blue")
wood = mat("walnut")
metal = mat("chrome", roughness=0.25)

R, H = 0.13, 0.5
lathe([(R - 0.01, 0.0), (R, 0.012), (R, H - 0.012), (R + 0.006, H - 0.004), (R, H), (R - 0.008, H), (R - 0.008, 0.03)], stand, segments=18)
for z in (0.12, 0.38):
    torus(R + 0.002, 0.006, loc=(0, 0, z), material=stand, major_seg=20, minor_seg=4)
# little feet ring
torus(R - 0.02, 0.008, loc=(0, 0, 0.006), material=metal, major_seg=16, minor_seg=4)


def umbrella(color, handle, loc, tilt, yaw):
    objs = []
    prof = [(0.0, 0.03), (0.012, 0.035), (0.03, 0.12), (0.045, 0.32), (0.05, 0.5), (0.04, 0.62), (0.022, 0.7), (0.012, 0.72)]
    objs.append(lathe(prof, color, segments=10))  # folded canopy (10 facets read as pleats)
    objs.append(torus(0.04, 0.006, loc=(0, 0, 0.45), material=color, major_seg=12, minor_seg=5))  # strap
    objs.append(cyl(0.007, 0.16, loc=(0, 0, 0.79), material=metal, verts=8))
    objs.append(cyl(0.004, 0.03, loc=(0, 0, 0.03), material=metal, verts=6))
    if handle == "j":
        objs.append(cyl(0.016, 0.08, loc=(0, 0, 0.9), material=wood, verts=8))
        objs.append(torus(0.045, 0.015, loc=(0.045, 0, 0.94), material=wood, rot=(math.pi / 2, 0, 0), major_seg=14, minor_seg=8, arc=0.55))
    else:
        objs.append(cyl(0.02, 0.12, loc=(0, 0, 0.92), material=wood, verts=10))
    bpy.context.view_layer.update()
    M = Matrix.Translation(Vector(loc)) @ Euler((0, tilt, yaw), "ZYX").to_matrix().to_4x4()
    for o in objs:
        o.matrix_world = M @ o.matrix_world


umbrella(coral, "j", (-0.04, 0.02, 0.0), math.radians(7), math.radians(15))
umbrella(blue, "knob", (0.045, -0.025, 0.0), math.radians(-7), math.radians(-25))

finish("umbrella_stand")
