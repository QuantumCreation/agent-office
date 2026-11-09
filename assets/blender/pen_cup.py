"""Pen cup with pens, a pencil and a ruler. Origin on the desk surface."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_work import *  # noqa: E402,F401,F403

reset()
cup = mat("cup", "sage")
dark = mat("charcoal")
yel = mat("pencil", "butter")
red = mat("pen_red", "coral")
blue = mat("pen_blue", "blue")

R, H = 0.038, 0.1
hollow_lathe(R, H, wall=0.004, bottom=0.008, lip=0.003, taper=-0.002, material=cup, segments=24)
# a darker inside floor
cyl(R - 0.006, 0.003, loc=(0, 0, 0.0095), material=dark, verts=20)


def pen(base, tilt_x, tilt_y, length, radius, body, cap, tip_len=0.014, hexa=False):
    rot = (rad(tilt_x), rad(tilt_y), 0)
    c = xf(base, rot, (0, 0, length / 2))
    cyl(radius, length, loc=c, material=body, verts=6 if hexa else 10, rot=rot)
    cap_c = xf(base, rot, (0, 0, length + tip_len / 2))
    cyl(radius * 1.02, tip_len, loc=cap_c, material=cap, verts=6 if hexa else 10, rot=rot, radius2=radius * (0.25 if hexa else 0.9))


# (base point on the cup floor, tilt x, tilt y, length)
pen((0.014, 0.008, 0.01), -12, 16, 0.14, 0.0045, blue, dark)
pen((-0.014, 0.01, 0.01), -10, -18, 0.135, 0.0045, red, dark)
pen((0.004, -0.01, 0.01), 8, 6, 0.15, 0.0042, dark, mat("cream"))
pen((-0.01, -0.008, 0.01), 10, -12, 0.155, 0.0045, yel, mat("cream"), tip_len=0.018, hexa=True)
# ruler
rot = (rad(-14), rad(4), rad(10))
box((0.022, 0.0025, 0.165), loc=xf((0.0, 0.016, 0.01), rot, (0, 0, 0.0825)), material=mat("cream"), rot=rot)

done("pen_cup")
