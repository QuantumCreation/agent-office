"""Three framed abstract prints (wall-mounted, center at z = 1.6, origin on the floor at the wall,
back at y = 0). Compositions are colored geometry slightly proud of the canvas."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_work import *  # noqa: E402,F401,F403

CZ = 1.6


def frame(w, h, frame_mat, canvas_mat, fw=0.035, depth=0.035):
    """Frame: four rounded rails around a recessed canvas. Returns the canvas front-plane y."""
    wall_slab(w - 0.01, h - 0.01, 0.012, 0, CZ, 0.0, canvas_mat)  # backer/canvas (front at -0.012)
    # passe-partout effect: the canvas sits 0.012 proud; rails stand 0.035
    wall_frame(w, h, fw, depth, 0, CZ, 0.0, frame_mat, round=0.007)
    return -0.012


def layer(points, m, y, k, cx=0.0, cz=CZ):
    """Extrude a 2D shape (relative to the canvas center) 4 mm, stacked by layer index k."""
    pts = [(x + cx, z + cz) for x, z in points]
    return wall_shape(pts, 0.004, y - 0.0015 * k, m)


# ---------------------------------------------------------------- A: 0.8 x 1.0 portrait, sun over arches
reset()
oak = mat("frame_oak", "oak")
canvas = mat("canvas", "cream")
terra = mat("art_terracotta", "terracotta")
sage = mat("art_sage", "sage")
butter = mat("art_butter", "butter")
navy = mat("art_navy", "navy")
W, H = 0.8, 1.0
y = frame(W, H, oak, canvas)
# ground block
layer(rrect(0.62, 0.22, 0.0, cx=0, cy=-0.31), navy, y, 0)
# big terracotta half-sun sitting on the ground
layer(sector_pts(0, 0.24, 0, 180, 24, cx=-0.06, cy=-0.2), terra, y, 1)
# sage arches (rainbow bands)
layer(sector_pts(0.1, 0.15, 0, 180, 18, cx=0.16, cy=-0.2), sage, y, 2)
layer(sector_pts(0.0, 0.06, 0, 180, 12, cx=0.16, cy=-0.2), sage, y, 2)
# butter sun
layer(circle_pts(0.09, 28, 0.13, 0.22), butter, y, 1)
# small floating dots and a bar
for (cx, cz, r) in ((-0.2, 0.3, 0.025), (-0.12, 0.36, 0.015), (-0.24, 0.18, 0.012)):
    layer(circle_pts(r, 16, cx, cz), navy, y, 1)
layer(rrect(0.2, 0.018, 0.009, 3, cx=-0.16, cy=0.06), terra, y, 1)
done("wall_art_a")

# ---------------------------------------------------------------- B: 1.2 x 0.8 landscape, Bauhaus blocks & rainbow
reset()
fr = mat("frame_charcoal", "charcoal")
canvas = mat("canvas", "paper")
coral = mat("art_coral", "coral")
sky = mat("art_sky", "sky")
butter = mat("art_butter", "butter")
mint = mat("art_mint", "mint")
W, H = 1.2, 0.8
y = frame(W, H, fr, canvas, fw=0.03, depth=0.03)
# left: big sky block with a coral circle overlapping
layer(rrect(0.36, 0.5, 0.0, cx=-0.32, cy=0.0), sky, y, 0)
layer(circle_pts(0.14, 32, -0.2, 0.1), coral, y, 1)
# middle: rainbow of three arcs
for i, (m, r0) in enumerate(((coral, 0.2), (butter, 0.145), (mint, 0.09))):
    layer(sector_pts(r0, r0 + 0.05, 0, 180, 22, cx=0.12, cy=-0.2), m, y, 1)
# right: stacked blocks and a quarter circle
layer(rrect(0.14, 0.14, 0.0, cx=0.42, cy=0.18), butter, y, 0)
layer(sector_pts(0.0, 0.14, 180, 270, 12, cx=0.49, cy=0.04), mint, y, 1)
layer(rrect(0.14, 0.2, 0.0, cx=0.42, cy=-0.17), sky, y, 0)
layer(circle_pts(0.035, 16, 0.42, -0.17), coral, y, 1)
# a little line of dots across the top
for i in range(5):
    layer(circle_pts(0.012, 12, -0.02 + i * 0.05, 0.27), coral if i % 2 == 0 else sky, y, 1)
done("wall_art_b")

# ---------------------------------------------------------------- C: 0.6 x 0.6, quarter-circle tiles
reset()
fr = mat("frame_white", "white")
canvas = mat("canvas", "cream")
cols = [mat("art_lilac", "lilac"), mat("art_peach", "peach"), mat("art_sage", "sage"), mat("art_navy", "navy")]
W, H = 0.6, 0.6
y = frame(W, H, fr, canvas, fw=0.03, depth=0.03)
T = 0.235  # tile size; 2 x 2 tiles centered
corners = [(180, 270), (270, 360), (90, 180), (0, 90)]
tiles = [(-1, 1), (1, 1), (-1, -1), (1, -1)]
for i, (sx, sz) in enumerate(tiles):
    cx, cz = sx * T / 2, sz * T / 2
    # tile background then a quarter circle pivoting on one corner of the tile
    layer(rrect(T - 0.006, T - 0.006, 0.0, cx=cx, cy=cz), cols[i], y, 0)
    a0, a1 = [(0, 90), (90, 180), (270, 360), (180, 270)][i]
    pcx = cx - sx * T / 2 + 0.003 * sx
    pcz = cz - sz * T / 2 + 0.003 * sz
    pcx, pcz = cx + (T / 2 - 0.003) * (-1 if a0 in (0, 270) else 1), cz + (T / 2 - 0.003) * (-1 if a0 in (0, 90) else 1)
    layer(sector_pts(0, T - 0.02, a0, a1, 14, cx=pcx, cy=pcz), cols[(i + 2) % 4], y, 1)
# small center dot
layer(circle_pts(0.03, 20, 0, 0), mat("art_peach", "peach"), y, 2)
done("wall_art_c")
