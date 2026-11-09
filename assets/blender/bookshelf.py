"""Open bookshelf 2.0 (x) x 0.38 (y) x 2.0 tall with 5 shelves, filled with books of varied heights,
colors and leans, small plants, a vase, a globe and box files. Two variants: bookshelf and bookshelf_b.
Open front faces -Y."""

import os
import random
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib_work import *  # noqa: E402,F401,F403

W, D, H = 2.0, 0.38, 2.0
T = 0.03          # board thickness
SIDE = 0.035
N_SHELF = 5       # shelves = 5 storage levels


def carcass(wood, back):
    for s in (-1, 1):
        box((SIDE, D, H), loc=(s * (W / 2 - SIDE / 2), 0, H / 2), material=wood, round=0.008, segments=2)
    # center divider
    box((T, D - 0.02, H - 0.08), loc=(0, 0.01, H / 2 + 0.02), material=wood, round=0.006, segments=1)
    # plinth, top and shelf boards
    box((W - 2 * SIDE, D - 0.03, 0.06), loc=(0, 0.0, 0.03), material=wood, round=0.006, segments=1)
    box((W, D, T), loc=(0, 0, H - T / 2), material=wood, round=0.008, segments=2)
    # back panel
    box((W - 0.04, 0.012, H - 0.04), loc=(0, D / 2 - 0.006, H / 2), material=back)
    levels = []
    z = 0.06
    gap = (H - T - 0.06 - (N_SHELF - 1) * T) / N_SHELF
    for i in range(N_SHELF):
        levels.append(z)
        z += gap
        if i < N_SHELF - 1:
            box((W - 2 * SIDE, D - 0.02, T), loc=(0, 0.0, z + T / 2), material=wood, round=0.005, segments=1)
            z += T
    return levels, gap


def bay_ranges():
    """x ranges for the two bays (left and right of the divider)."""
    x0 = -W / 2 + SIDE + 0.01
    return [(x0, -T / 2 - 0.01), (T / 2 + 0.01, W / 2 - SIDE - 0.01)]


class Filler:
    def __init__(self, seed, book_mats, plant_mats, deco):
        self.rng = random.Random(seed)
        self.books = book_mats
        self.leaf, self.pot = plant_mats
        self.deco = deco

    def book_row(self, x0, x1, z, gap, lean_end=True, y=0.0):
        rng = self.rng
        x = x0
        last_h = None
        while x < x1 - 0.03:
            th = rng.choice([0.022, 0.026, 0.03, 0.034, 0.04, 0.05])
            h = min(gap - 0.04, rng.uniform(0.2, 0.31))
            d = rng.uniform(0.17, 0.24)
            if x + th > x1:
                break
            m = rng.choice(self.books)
            # books in rows are plain boxes (no bevel) to stay inside the triangle budget
            box((th, d, h), loc=(x + th / 2, y + (0.24 - d) / 2 * 0.5 - 0.02, z + h / 2), material=m)
            x += th + 0.002
            last_h = h
        # a leaning book at the end of the row
        if lean_end and x < x1 - 0.06 and last_h:
            h = min(gap - 0.05, 0.27)
            ang = rng.uniform(14, 24)
            th = 0.03
            dx = math.sin(math.radians(ang)) * h / 2
            box((th, 0.2, h), loc=(x + th / 2 + dx + 0.004, -0.02, z + math.cos(math.radians(ang)) * h / 2 + 0.002),
                material=rng.choice(self.books), round=0.004, segments=1, rot=(0, math.radians(ang), 0))
            x += 2 * dx + th + 0.01
        return x

    def stack(self, xc, z, n=None, y=-0.01):
        rng = self.rng
        n = n or rng.randint(3, 5)
        for i in range(n):
            t = rng.uniform(0.025, 0.04)
            w = rng.uniform(0.2, 0.26)
            box((w, rng.uniform(0.16, 0.2), t), loc=(xc, y, z + t / 2), material=rng.choice(self.books), round=0.004, segments=1,
                rot=(0, 0, math.radians(rng.uniform(-6, 6))))
            z += t
        return z

    def plant(self, xc, z, kind=0, y=-0.02):
        top = pot((xc, y, z), r=0.065, h=0.11, material=self.pot, soil=None, segments=14)
        if kind == 0:  # bushy
            leafy_plant(top, height=0.16, spread=0.09, leaf_mat=self.leaf, stem_mat=None, seed=self.rng.randint(0, 999), n=10,
                        leaf_len=0.05, leaf_w=0.028, segs=6)
        else:  # trailing pothos hanging over the shelf edge
            for i, a in enumerate((-0.6, 0.3, 1.2, 2.6, 3.8)):
                pts = [top, (top[0] + math.cos(a) * 0.06, top[1] + math.sin(a) * 0.04 - 0.03, top[2] + 0.03),
                       (top[0] + math.cos(a) * 0.1, top[1] - 0.09, top[2] - 0.02),
                       (top[0] + math.cos(a) * 0.12, top[1] - 0.11, top[2] - 0.12 - 0.05 * (i % 2))]
                ptube(pts, 0.004, self.leaf, sides=4, caps=False)
                for k, p in enumerate(pts[1:]):
                    ico(0.022, loc=p, material=self.leaf, subdiv=1, scale=(1, 0.5, 0.8))

    def vase(self, xc, z, m, y=-0.02):
        o = lathe([(0.035, 0.0), (0.05, 0.03), (0.055, 0.08), (0.03, 0.15), (0.025, 0.2), (0.032, 0.21), (0.02, 0.205)], m, segments=16)
        o.location = (xc, y, z)

    def globe(self, xc, z, sea, land, stand, y=-0.03):
        cyl(0.05, 0.012, loc=(xc, y, z + 0.006), material=stand, verts=14)
        cyl(0.008, 0.04, loc=(xc, y, z + 0.03), material=stand, verts=8)
        tilt = (0, math.radians(23), 0)
        sphere(0.085, loc=(xc, y, z + 0.13), material=sea, segments=16, rings=10)
        ptube(arc_points((xc, y, z + 0.13), 0.095, -110, 110, 14, "XZ"), 0.004, stand, sides=5)
        for (u, v, s) in ((0.6, 0.3, 0.04), (-0.3, 0.6, 0.05), (2.2, -0.2, 0.045)):
            p = (xc + 0.083 * math.cos(v) * math.cos(u), y + 0.083 * math.cos(v) * math.sin(u) - 0.0, z + 0.13 + 0.083 * math.sin(v))
            ico(s, loc=p, material=land, subdiv=1, scale=(1, 1, 0.55), rot=(0.4, v, u)).scale = (0.9, 0.9, 0.35)

    def box_files(self, x0, z, n, m, label, y=-0.0):
        for i in range(n):
            x = x0 + i * 0.085
            box((0.08, 0.26, 0.3), loc=(x + 0.04, y, z + 0.15), material=m, round=0.006, segments=1)
            box((0.05, 0.004, 0.08), loc=(x + 0.04, y - 0.131, z + 0.19), material=label)
            cyl(0.012, 0.004, loc=(x + 0.04, y - 0.131, z + 0.09), material=label, verts=10, rot=(R90, 0, 0))
        return x0 + n * 0.085

    def deco_box(self, xc, z, m, w=0.18, h=0.12, y=-0.02):
        box((w, 0.2, h), loc=(xc, y, z + h / 2), material=m, round=0.008, segments=2)
        box((w + 0.006, 0.206, 0.025), loc=(xc, y, z + h - 0.012), material=m, round=0.008, segments=2)


def build(name, seed, layout):
    reset()
    wood = mat("oak")
    back = wood  # keep the material count at 6
    books = [mat("book_a", "coral"), mat("book_b", "navy"), mat("book_c", "sage"), mat("book_d", "butter")]
    leaf = mat("leaf")
    # pots and deco reuse book colors to keep the material count low (<= 6)
    f = Filler(seed, books, (leaf, books[0]), None)
    levels, gap = carcass(wood, back)
    bays = bay_ranges()
    for li, z in enumerate(levels):
        for bi, (x0, x1) in enumerate(bays):
            layout(f, li, bi, x0, x1, z + 0.002, gap, books, leaf, wood)
    done(name)


def layout_a(f, li, bi, x0, x1, z, gap, books, leaf, wood):
    key = (li, bi)
    if key == (0, 0):
        f.box_files(x0 + 0.02, z, 4, books[1], books[3])
        f.book_row(x0 + 0.38, x1, z, gap)
    elif key == (0, 1):
        x = f.book_row(x0, x0 + 0.55, z, gap)
        f.stack(x1 - 0.17, z)
    elif key == (1, 0):
        f.book_row(x0, x0 + 0.5, z, gap)
        f.plant(x1 - 0.14, z, 0)
    elif key == (1, 1):
        f.stack(x0 + 0.15, z, 3)
        f.vase(x0 + 0.38, z, books[2])
        f.book_row(x0 + 0.5, x1, z, gap, lean_end=False)
    elif key == (2, 0):
        f.globe(x0 + 0.14, z, books[1], books[2], wood)
        f.book_row(x0 + 0.3, x1, z, gap)
    elif key == (2, 1):
        f.book_row(x0, x0 + 0.62, z, gap)
        f.deco_box(x1 - 0.13, z, books[3])
    elif key == (3, 0):
        f.plant(x0 + 0.12, z, 1)
        f.book_row(x0 + 0.3, x1 - 0.2, z, gap)
    elif key == (3, 1):
        f.book_row(x0, x1, z, gap)
    elif key == (4, 0):
        f.book_row(x0, x0 + 0.4, z, gap)
        f.stack(x1 - 0.2, z, 2)
    elif key == (4, 1):
        f.vase(x0 + 0.12, z, books[0])
        f.plant(x1 - 0.14, z, 0)


def layout_b(f, li, bi, x0, x1, z, gap, books, leaf, wood):
    key = (li, bi)
    if key == (0, 0):
        f.stack(x0 + 0.16, z, 5)
        f.book_row(x0 + 0.33, x1, z, gap)
    elif key == (0, 1):
        f.box_files(x0 + 0.02, z, 3, books[2], books[3])
        f.box_files(x0 + 0.29, z, 2, books[0], books[3])
        f.deco_box(x1 - 0.14, z, books[1], w=0.2, h=0.16)
    elif key == (1, 0):
        f.plant(x0 + 0.12, z, 1)
        f.book_row(x0 + 0.28, x1, z, gap)
    elif key == (1, 1):
        f.book_row(x0, x1 - 0.32, z, gap)
        f.globe(x1 - 0.14, z, books[1], books[2], wood)
    elif key == (2, 0):
        f.book_row(x0, x1, z, gap)
    elif key == (2, 1):
        f.vase(x0 + 0.1, z, books[3])
        f.vase(x0 + 0.22, z, books[0])
        f.stack(x1 - 0.2, z, 3)
    elif key == (3, 0):
        f.deco_box(x0 + 0.13, z, books[0])
        f.book_row(x0 + 0.28, x1, z, gap)
    elif key == (3, 1):
        f.book_row(x0, x0 + 0.5, z, gap)
        f.plant(x1 - 0.14, z, 0)
    elif key == (4, 0):
        f.plant(x0 + 0.14, z, 0)
        f.stack(x1 - 0.2, z, 2)
    elif key == (4, 1):
        f.book_row(x0, x0 + 0.45, z, gap)
        f.plant(x1 - 0.14, z, 1)


build("bookshelf", 7, layout_a)
build("bookshelf_b", 21, layout_b)
