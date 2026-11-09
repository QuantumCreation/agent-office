"""Extra helpers for the home / lounge / kitchen assets (leaves, soft cushions, pots, rings).

Import alongside lib:
    import sys, os; sys.path.insert(0, os.path.dirname(__file__))
    from lib import *
    from lib_home import *

Everything here follows the conventions documented in lib.py.
"""

import math
import os
import random
import sys

import bmesh
import bpy
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(__file__))
from lib import *  # noqa: E402,F401,F403
from lib import _assign, _from_bmesh  # noqa: E402

# ------------------------------------------------------------------ small math helpers


def rot_matrix(yaw=0.0, pitch=0.0, roll=0.0):
    """Rotation that takes local +X (a leaf's length axis) to a direction with the given
    yaw (around Z, 0 = +X) and pitch (elevation above the horizon, + = up). Roll spins around
    the leaf's own axis."""
    return (Matrix.Rotation(yaw, 4, "Z") @ Matrix.Rotation(-pitch, 4, "Y") @ Matrix.Rotation(roll, 4, "X")).to_3x3()


def bezier(p0, p1, p2, n=8, p3=None):
    """Quadratic (or cubic when p3 is given) bezier points, for stems, vines and arcs."""
    p0, p1, p2 = Vector(p0), Vector(p1), Vector(p2)
    out = []
    for i in range(n + 1):
        t = i / n
        if p3 is None:
            p = (1 - t) ** 2 * p0 + 2 * (1 - t) * t * p1 + t * t * p2
        else:
            q3 = Vector(p3)
            p = (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t * t * p2 + t ** 3 * q3
        out.append(tuple(p))
    return out


def rrect(w, d, r, n=4):
    """Rounded-rectangle polygon (centered), for extrude_shape tops and slabs."""
    pts = []
    r = min(r, w / 2 - 1e-4, d / 2 - 1e-4)
    for cx, cy, a0 in ((w / 2 - r, d / 2 - r, 0), (-w / 2 + r, d / 2 - r, 90), (-w / 2 + r, -d / 2 + r, 180), (w / 2 - r, -d / 2 + r, 270)):
        for i in range(n + 1):
            a = math.radians(a0 + 90 * i / n)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def fix_normals(obj):
    me = obj.data
    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.to_mesh(me)
    bm.free()
    return obj


# ------------------------------------------------------------------ soft shapes


def soft_box(size, loc=(0, 0, 0), material=None, round=0.05, puff=(0, 0, 0), cuts=4, rot=(0, 0, 0), name="soft"):
    """A rounded box with optional pillowy bulges on its faces (cushions, mattresses, bodies).
    `puff` = bulge amount (m) on the +-X, +-Y, +-Z faces."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=2.0)
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=cuts, use_grid_fill=True)
    h = Vector(size) / 2
    r = min(round, min(h) - 1e-4)
    inner = Vector((h.x - r, h.y - r, h.z - r))
    for v in bm.verts:
        c = [math.copysign(abs(x) ** 0.55, x) for x in v.co]
        q = Vector((c[0] * h.x, c[1] * h.y, c[2] * h.z))
        k = Vector((max(-inner.x, min(inner.x, q.x)), max(-inner.y, min(inner.y, q.y)), max(-inner.z, min(inner.z, q.z))))
        d = q - k
        p = k + d.normalized() * r if d.length > 1e-9 else q
        n = Vector((p.x / h.x, p.y / h.y, p.z / h.z))
        off = Vector((0, 0, 0))
        for a in range(3):
            if puff[a]:
                f = 1.0
                for b in range(3):
                    if b != a:
                        f *= max(0.0, 1 - n[b] ** 2)
                off[a] = puff[a] * n[a] * f
        v.co = p + off
    obj = _from_bmesh(name, bm)
    obj.location = loc
    obj.rotation_euler = rot
    return _assign(obj, material)


def pillow(w, h, d, loc=(0, 0, 0), material=None, rot=(0, 0, 0), n=8, pinch=0.1, name="pillow"):
    """Throw pillow: w along X, h along Z, d = thickness along Y. Puffy middle, pinched corners."""
    bm = bmesh.new()
    gf, gb = {}, {}
    for i in range(n + 1):
        for j in range(n + 1):
            u = -1 + 2 * i / n
            v = -1 + 2 * j / n
            x = u * w / 2 * (1 - pinch * (1 - v * v))
            z = v * h / 2 * (1 - pinch * (1 - u * u))
            t = ((1 - u * u) * (1 - v * v)) ** 0.45 * d / 2
            edge = i in (0, n) or j in (0, n)
            vf = bm.verts.new((x, -t, z))
            gf[i, j] = vf
            gb[i, j] = vf if edge else bm.verts.new((x, t, z))
    for i in range(n):
        for j in range(n):
            bm.faces.new((gf[i, j], gf[i + 1, j], gf[i + 1, j + 1], gf[i, j + 1]))
            bm.faces.new((gb[i, j], gb[i, j + 1], gb[i + 1, j + 1], gb[i + 1, j]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    obj = _from_bmesh(name, bm)
    obj.location = loc
    obj.rotation_euler = rot
    return _assign(obj, material)


def annulus(r_in, r_out, h, loc=(0, 0, 0), material=None, segs=48, round_out=0.0, name="ring"):
    """Flat ring (rug borders, trims). Optional rounded outer edge."""
    prof = [(r_in, 0.0), (r_out - round_out, 0.0)]
    if round_out > 0:
        for i in range(1, 4):
            a = -math.pi / 2 + math.pi * i / 4
            prof.append((r_out - round_out + round_out * math.cos(a), h / 2 + (h / 2) * math.sin(a)))
    prof += [(r_out - round_out, h), (r_in, h)]
    bm = bmesh.new()
    rings = []
    for k in range(segs):
        a = 2 * math.pi * k / segs
        rings.append([bm.verts.new((r * math.cos(a), r * math.sin(a), z)) for r, z in prof])
    m = len(prof)
    for k in range(segs):
        r0, r1 = rings[k], rings[(k + 1) % segs]
        for i in range(m):
            j = (i + 1) % m
            bm.faces.new((r0[i], r0[j], r1[j], r1[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    obj = _from_bmesh(name, bm)
    obj.location = loc
    return _assign(obj, material)


# ------------------------------------------------------------------ plants


SHAPES = {
    "ellipse": lambda t: math.sin(math.pi * t ** 0.8) ** 0.75,
    "lance": lambda t: math.sin(math.pi * t ** 0.9) ** 0.9,
    "sword": lambda t: min(1.0, t * 5) ** 0.5 * max(0.0, 1 - t ** 3) ** 0.7,
    "fiddle": lambda t: (math.sin(math.pi / 2 * t / 0.64) ** 0.9) if t < 0.64 else max(0.0, 1 - ((t - 0.64) / 0.36) ** 2) ** 0.5,
    "heart": lambda t: math.sin(math.pi * t ** 0.62) ** 0.55,
    "round": lambda t: max(0.0, 1 - (2 * t - 1) ** 2) ** 0.5,
    "blade": lambda t: min(1.0, t * 8) ** 0.5 * (1 - t) ** 0.8,
}


def _arc(s, k):
    """Point and up-normal at arc length s along a leaf midrib bending down with curvature k."""
    if abs(k) < 1e-6:
        return Vector((s, 0, 0)), Vector((0, 0, 1))
    return Vector((math.sin(k * s) / k, 0, (math.cos(k * s) - 1) / k)), Vector((math.sin(k * s), 0, math.cos(k * s)))


def leaf(L, W, base, yaw=0.0, pitch=0.0, roll=0.0, material=None, droop=0.5, fold=0.25, shape="ellipse", segs=6, thick=0.003, wide=False, name="leaf"):
    """A single closed leaf (thin lofted shell) starting at `base`.
    yaw/pitch give the direction the leaf starts out in; `droop` is the total downward bend (radians)
    along its length; `fold` > 0 cups the edges up, < 0 arches them down."""
    k = droop / L
    f = SHAPES[shape] if isinstance(shape, str) else shape
    M = rot_matrix(yaw, pitch, roll)
    B = Vector(base)
    bm = bmesh.new()
    rings = []
    for i in range(segs + 1):
        t = i / segs
        pos, nrm = _arc(t * L, k)
        w = max(f(t) * W / 2, 0.0012)
        if wide:
            c = fold * w * 0.25
            sec = [(-w, fold * w), (-w * 0.5, c + thick), (0, thick), (w * 0.5, c + thick), (w, fold * w), (w * 0.5, c - thick), (0, -thick), (-w * 0.5, c - thick)]
        else:
            sec = [(-w, fold * w), (0, thick), (w, fold * w), (0, -thick)]
        rings.append([bm.verts.new(B + M @ (pos + Vector((0, y, 0)) + nrm * z)) for y, z in sec])
    m = len(rings[0])
    for i in range(segs):
        for j in range(m):
            bm.faces.new((rings[i][j], rings[i][(j + 1) % m], rings[i + 1][(j + 1) % m], rings[i + 1][j]))
    bm.faces.new(list(reversed(rings[0])))
    bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return _assign(_from_bmesh(name, bm), material)


def earclip(poly):
    """Triangulate a simple counter-clockwise 2D polygon (list of (x, y)). Returns index triples."""
    idx = list(range(len(poly)))
    tris = []

    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

    def inside(p, a, b, c):
        return cross(a, b, p) >= 0 and cross(b, c, p) >= 0 and cross(c, a, p) >= 0

    guard = 0
    while len(idx) > 3 and guard < 10000:
        guard += 1
        best = None
        for k in range(len(idx)):
            i0, i1, i2 = idx[k - 1], idx[k], idx[(k + 1) % len(idx)]
            a, b, c = poly[i0], poly[i1], poly[i2]
            if cross(a, b, c) <= 1e-12:
                continue
            if any(inside(poly[j], a, b, c) for j in idx if j not in (i0, i1, i2)):
                continue
            # prefer fat ears (largest minimum angle-ish): use area / longest edge^2
            e = max((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2, (b[0] - c[0]) ** 2 + (b[1] - c[1]) ** 2, (c[0] - a[0]) ** 2 + (c[1] - a[1]) ** 2)
            q = cross(a, b, c) / max(e, 1e-12)
            if best is None or q > best[0]:
                best = (q, k)
        if best is None:
            break
        k = best[1]
        tris.append((idx[k - 1], idx[k], idx[(k + 1) % len(idx)]))
        idx.pop(k)
    if len(idx) == 3:
        tris.append(tuple(idx))
    return tris


def _half_outline_leaf(bm, half_pts, mid_pts, thick, k, fold, halfw, M, B, sign):
    """Build one half of an outline leaf (polygon = midrib points + outline), extruded and bent."""
    poly = mid_pts + list(reversed(half_pts))
    poly = [(x, y * sign) for x, y in poly]
    if sign < 0:
        poly = list(reversed(poly))
    top = [bm.verts.new((x, y, thick)) for x, y in poly]
    bot = [bm.verts.new((x, y, -thick)) for x, y in poly]
    for a, b, c in earclip(poly):
        bm.faces.new((top[a], top[b], top[c]))
        bm.faces.new((bot[c], bot[b], bot[a]))
    n = len(poly)
    for i in range(n):
        bm.faces.new((bot[i], bot[(i + 1) % n], top[(i + 1) % n], top[i]))
    for v in top + bot:
        x, y, z = v.co
        pos, nrm = _arc(x, k)
        zz = z + fold * (y * y) / max(halfw, 1e-4)
        v.co = B + M @ (pos + Vector((0, y, 0)) + nrm * zz)


def monstera_leaf(L, W, base, yaw=0.0, pitch=0.0, roll=0.0, material=None, droop=0.6, fold=-0.25, slits=4, res=20, thick=0.003, seed=0, name="monstera"):
    """Big heart-shaped leaf with slits cut from the edge toward the midrib (Monstera deliciosa).
    The petiole attaches at `base` (the heart's sinus)."""
    rnd = random.Random(seed)
    sinus = 0.04

    def width(s):
        return W / 2 * math.sin(math.pi * max(s, 0.0) ** 0.8) ** 0.55

    def xs(s):
        return L * (s - 0.13)

    slit_s = [0.27 + i * (0.62 / max(slits - 1, 1)) + rnd.uniform(-0.02, 0.02) for i in range(slits)] if slits else []
    g = 0.022
    right = []
    for i in range(1, res + 1):
        s = (i / res) ** 1.15
        if any(abs(s - q) < g * 1.4 for q in slit_s):
            continue
        right.append((s, (xs(s), width(s))))
    for q in slit_s:
        right.append((q - g, (xs(q - g), width(q - g))))
        right.append((q, (xs(q - 0.11), width(q) * 0.3)))
        right.append((q + g, (xs(q + g), width(q + g))))
    right.sort(key=lambda e: e[0])
    outline = [p for _, p in right]
    tip = outline[-1]
    outline[-1] = (tip[0], 0.0)
    mid = [(L * sinus + (tip[0] - L * sinus) * i / 6, 0.0) for i in range(6)]  # midrib up to (not incl.) the tip
    bm = bmesh.new()
    M = rot_matrix(yaw, pitch, roll)
    k = droop / L
    for sign, pts in ((1, outline), (-1, [(x, y * (1 + rnd.uniform(-0.03, 0.03))) for x, y in outline])):
        _half_outline_leaf(bm, pts, mid, thick, k, fold, W / 2, M, Vector(base), sign)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return _assign(_from_bmesh(name, bm), material)


def ptube(points, radius, material=None, sides=10, name="tube"):
    """Like lib.tube, but with parallel-transported ring frames, so it never twists or pinches
    when the path turns vertical (bentwood hoops, arcs, cables)."""
    pts = [Vector(p) for p in points]
    n = len(pts)
    tans = []
    for i in range(n):
        if i == 0:
            t = pts[1] - pts[0]
        elif i == n - 1:
            t = pts[-1] - pts[-2]
        else:
            t = (pts[i + 1] - pts[i]).normalized() + (pts[i] - pts[i - 1]).normalized()
        tans.append(t.normalized())
    ref = Vector((0, 0, 1)) if abs(tans[0].z) < 0.9 else Vector((1, 0, 0))
    u = tans[0].cross(ref).normalized()
    bm = bmesh.new()
    rings = []
    for i, p in enumerate(pts):
        if i > 0:
            # rotate the previous frame by the rotation taking the previous tangent to this one
            q = tans[i - 1].rotation_difference(tans[i])
            u = (q @ u).normalized()
        v = tans[i].cross(u).normalized()
        rings.append([bm.verts.new(p + (u * math.cos(2 * math.pi * k / sides) + v * math.sin(2 * math.pi * k / sides)) * radius) for k in range(sides)])
    for i in range(n - 1):
        for k in range(sides):
            bm.faces.new((rings[i][k], rings[i][(k + 1) % sides], rings[i + 1][(k + 1) % sides], rings[i + 1][k]))
    bm.faces.new(list(reversed(rings[0])))
    bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return _assign(_from_bmesh(name, bm), material)


def stem(points, radius, material, sides=6, taper=0.6):
    """Tapered tube along points (radius shrinks to radius*taper at the end)."""
    obj = ptube(points, radius, material, sides=sides)
    # taper: scale each ring toward its centre
    me = obj.data
    n = len(points)
    for i, p in enumerate(points):
        f = 1 - (1 - taper) * i / max(n - 1, 1)
        c = Vector(p)
        for k in range(sides):
            v = me.vertices[i * sides + k]
            v.co = c + (v.co - c) * f
    return obj


def pot(r_top, h, material, soil=None, r_bot=None, rim=0.015, rim_h=0.035, segs=24, wall=0.012, soil_drop=0.03, loc=(0, 0, 0), name="pot"):
    """Tapered plant pot with a rolled rim; soil disc slightly below the rim. Returns soil top z."""
    r_bot = r_bot if r_bot is not None else r_top * 0.78
    x0, y0, z0 = loc
    prof = [
        (r_bot - 0.012, 0.0),
        (r_bot, 0.01),
        (r_top, h - rim_h),
        (r_top + rim, h - rim_h + 0.004),
        (r_top + rim, h - 0.005),
        (r_top + rim - 0.005, h),
        (r_top - wall, h),
        (r_top - wall, h - soil_drop - 0.01),
    ]
    o = lathe([(r, z + z0) for r, z in prof], material, segments=segs, name=name)
    o.location = (x0, y0, 0)
    top = z0 + h - soil_drop
    if soil is not None:
        ri = r_top - wall
        s = lathe([(ri + 0.002, top - 0.008), (ri * 0.6, top + 0.004), (0.0, top + 0.008)], soil, segments=segs, name="soil")
        s.location = (x0, y0, 0)
    return top


# ------------------------------------------------------------------ finishing for ceiling-hung items


def finish_hung(name, lift=0.4):
    """finish() for items whose origin is the ceiling point (everything at z < 0).
    The export is untouched; for the preview only, the model is lifted above the preview floor."""
    finish(name, preview=False)
    if os.environ.get("ASSET_NO_PREVIEW") == "1":
        return
    lo, hi = bounds()
    dz = -lo.z + lift
    for o in bpy.context.scene.objects:
        if o.type == "MESH":
            o.location.z += dz
    bpy.context.view_layer.update()
    out = render_preview(name)
    print(f"PREVIEW {name}: {out}")


# ------------------------------------------------------------------ cabinetry


def cabinet_fronts(modules, x0, y_front, z0, z1, front_mat, handle_mat, gap=0.006, thick=0.02, handle_at="top"):
    """Doors and drawers on a cabinet face at y = y_front (fronts stick out toward -Y).
    modules: list of (width, kind); kind in 'd3', 'd2', 'door_l', 'door_r', 'doors2', 'panel'."""
    x = x0
    hy = y_front - thick - 0.011
    for w, kind in modules:
        xc = x + w / 2
        if kind in ("d3", "d2"):
            fr = [0.24, 0.38, 0.38] if kind == "d3" else [0.5, 0.5]
            top = z1
            for f in fr:
                h = (z1 - z0) * f
                zc = top - h / 2
                box((w - gap, thick, h - gap), loc=(xc, y_front - thick / 2, zc), material=front_mat, round=0.008, segments=1)
                box((min(0.3, w * 0.5), 0.022, 0.016), loc=(xc, hy, top - min(0.07, h / 2)), material=handle_mat)
                top -= h
        elif kind == "panel":
            box((w - gap, thick, z1 - z0 - gap), loc=(xc, y_front - thick / 2, (z0 + z1) / 2), material=front_mat, round=0.008, segments=1)
        else:
            doors = [(x, w, "r" if kind == "door_l" else "l")] if kind != "doors2" else [(x, w / 2, "r"), (x + w / 2, w / 2, "l")]
            for dx, dw, hs in doors:
                box((dw - gap, thick, z1 - z0 - gap), loc=(dx + dw / 2, y_front - thick / 2, (z0 + z1) / 2), material=front_mat, round=0.008, segments=1)
                hx = dx + dw - 0.05 if hs == "r" else dx + 0.05
                hz = z1 - 0.12 if handle_at == "top" else z0 + 0.12
                box((0.016, 0.022, 0.16), loc=(hx, hy, hz), material=handle_mat)
        x += w
