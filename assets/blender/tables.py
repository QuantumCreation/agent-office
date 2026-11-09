"""Tables with oak tops and charcoal legs (footprint is x by y; top surface heights as named):
table_conference 1.2 x 3.6 @0.74, table_meeting 1.2 x 2.6 @0.74, table_small 1.0 x 0.6 @0.74,
table_round D1.2 @0.74, table_cafe D0.9 @0.74, side_table D0.5 @0.55, high_table 1.2 x 1.8 @1.05."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_work import *  # noqa: E402,F401,F403


def materials():
    return mat("oak"), mat("oak_edge", "oak_dark"), mat("charcoal"), mat("steel")


def rect_top(w, d, top, t=0.04, corner=0.08):
    oak, edge, _, _ = materials()
    # rounded-corner slab with soft edges, and a darker underside band so the edge reads chunky
    extrude_shape(rrect(w, d, corner, 6), t, loc=(0, 0, top - t), material=oak, round=0.012)
    extrude_shape(rrect(w - 0.04, d - 0.04, corner * 0.8, 6), 0.012, loc=(0, 0, top - t - 0.01), material=edge, round=0.004)


def round_top(r, top, t=0.04, verts=48):
    oak, edge, _, _ = materials()
    cyl(r, t, loc=(0, 0, top - t / 2), material=oak, verts=verts, round=0.012)
    cyl(r - 0.03, 0.012, loc=(0, 0, top - t - 0.004), material=edge, verts=verts // 2 * 2)


def panel_leg(y, top, width, t=0.05):
    """A slab leg (along x) with a wide foot and a mounting rail, under a long table."""
    _, _, frame, _ = materials()
    h = top - 0.04 - 0.012
    box((width, t, h - 0.03), loc=(0, y, 0.03 + (h - 0.03) / 2), material=frame, round=0.015, segments=2)
    box((width + 0.1, 0.12, 0.03), loc=(0, y, 0.015), material=frame, round=0.012, segments=2)
    box((width - 0.1, 0.1, 0.02), loc=(0, y, h - 0.005), material=frame, round=0.006, segments=1)


def cable_port(top, y=0.0):
    _, _, frame, metal = materials()
    extrude_shape(rrect(0.24, 0.12, 0.04, 4), 0.004, loc=(0, y, top - 0.001), material=frame, round=0.0015)
    extrude_shape(rrect(0.2, 0.085, 0.03, 4), 0.002, loc=(0, y, top + 0.002), material=metal)
    box((0.003, 0.08, 0.0015), loc=(0, y, top + 0.004), material=frame)


def long_table(name, w, d, legs_y):
    reset()
    top = 0.74
    rect_top(w, d, top)
    for y in legs_y:
        panel_leg(y, top, w - 0.4)
    # spine beam between the legs
    _, _, frame, _ = materials()
    box((0.08, abs(legs_y[1] - legs_y[0]), 0.06), loc=(0, (legs_y[0] + legs_y[1]) / 2, top - 0.08), material=frame, round=0.012, segments=2)
    cable_port(top, 0.0)
    done(name)


long_table("table_conference", 1.2, 3.6, (-1.25, 1.25))
long_table("table_meeting", 1.2, 2.6, (-0.85, 0.85))

# ---- small phone-room desk: four slim tapered legs with an apron
reset()
oak, edge, frame, metal = materials()
rect_top(1.0, 0.6, 0.74, t=0.035, corner=0.05)
for sx in (-1, 1):
    for sy in (-1, 1):
        x, y = sx * 0.43, sy * 0.23
        cyl(0.024, 0.69, loc=(x, y, 0.345), material=frame, verts=12, radius2=0.03)
        cyl(0.022, 0.012, loc=(x, y, 0.006), material=frame, verts=12, round=0.004)
box((0.86, 0.02, 0.07), loc=(0, 0.23, 0.655), material=frame, round=0.008, segments=2)
box((0.86, 0.02, 0.07), loc=(0, -0.23, 0.655), material=frame, round=0.008, segments=2)
for sx in (-1, 1):
    box((0.02, 0.46, 0.07), loc=(sx * 0.43, 0, 0.655), material=frame, round=0.008, segments=2)
done("table_small")


def pedestal(top, base_r, col_r=0.045, foot="disc"):
    _, _, frame, _ = materials()
    h = top - 0.04 - 0.012
    cyl(col_r, h - 0.03, loc=(0, 0, 0.03 + (h - 0.03) / 2), material=frame, verts=20)
    cyl(col_r * 1.3, 0.04, loc=(0, 0, h - 0.02), material=frame, verts=20, round=0.01)
    box((0.3, 0.3, 0.015), loc=(0, 0, h - 0.004), material=frame, round=0.005, segments=1)
    if foot == "disc":
        lathe([(base_r, 0.0), (base_r + 0.005, 0.008), (base_r - 0.01, 0.022), (col_r * 2.5, 0.05), (col_r * 1.2, 0.065), (0.0, 0.066)], frame, segments=36)
    else:  # four-star foot
        for i in range(4):
            a = rad(45 + 90 * i)
            end = (math.cos(a) * base_r, math.sin(a) * base_r)
            ptube([(0, 0, 0.045), (end[0] * 0.6, end[1] * 0.6, 0.03), (end[0], end[1], 0.022)], 0.022, frame, sides=8, squash=0.7)
            cyl(0.025, 0.012, loc=(end[0], end[1], 0.006), material=frame, verts=12, round=0.004)
        cyl(0.07, 0.06, loc=(0, 0, 0.04), material=frame, verts=20, round=0.015)


reset()
round_top(0.6, 0.74)
pedestal(0.74, 0.34, col_r=0.05)
done("table_round")

reset()
round_top(0.45, 0.74, t=0.035, verts=40)
pedestal(0.74, 0.3, col_r=0.04, foot="star")
done("table_cafe")

# ---- side table: round top on three splayed legs, with a small lower shelf
reset()
oak, edge, frame, metal = materials()
round_top(0.25, 0.55, t=0.03, verts=36)
for i in range(3):
    a = rad(90 + 120 * i)
    top_p = (math.cos(a) * 0.15, math.sin(a) * 0.15, 0.51)
    bot_p = (math.cos(a) * 0.21, math.sin(a) * 0.21, 0.01)
    ptube([bot_p, top_p], [0.014, 0.018], frame, sides=10)
    cyl(0.015, 0.01, loc=(bot_p[0], bot_p[1], 0.005), material=frame, verts=10)
cyl(0.182, 0.02, loc=(0, 0, 0.2), material=oak, verts=32, round=0.007)
done("side_table")

# ---- high table: four square legs with a footrest ring
reset()
oak, edge, frame, metal = materials()
rect_top(1.2, 1.8, 1.05)
LX, LY = 0.46, 0.76
for sx in (-1, 1):
    for sy in (-1, 1):
        x, y = sx * LX, sy * LY
        box((0.06, 0.06, 0.995), loc=(x, y, 0.4975), material=frame, round=0.012, segments=2)
        box((0.07, 0.07, 0.012), loc=(x, y, 0.006), material=frame, round=0.004, segments=1)
# apron
box((2 * LX, 0.03, 0.08), loc=(0, LY, 0.96), material=frame, round=0.008, segments=1)
box((2 * LX, 0.03, 0.08), loc=(0, -LY, 0.96), material=frame, round=0.008, segments=1)
for sx in (-1, 1):
    box((0.03, 2 * LY, 0.08), loc=(sx * LX, 0, 0.96), material=frame, round=0.008, segments=1)
# footrest bar: a rounded rectangle tube just outside the legs
o = 0.045
loop_tube([(-LX - o, -LY - o, 0.3), (LX + o, -LY - o, 0.3), (LX + o, LY + o, 0.3), (-LX - o, LY + o, 0.3)], 0.018, metal, corner=0.08, seg=5, sides=10)
for sx in (-1, 1):
    for sy in (-1, 1):
        ptube([(sx * LX, sy * LY, 0.3), (sx * (LX + o), sy * (LY + o), 0.3)], 0.012, frame, sides=8)
done("high_table")
