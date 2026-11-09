"""Extra helpers for the furniture/prop asset scripts (used alongside lib.py).

    import sys, os; sys.path.insert(0, os.path.dirname(__file__))
    from lib import *
    from lib_work import *
"""

import math

import bmesh
import bpy
from mathutils import Euler, Matrix, Vector

from lib import _assign, _from_bmesh, cyl, extrude_shape, lathe, tube

R90 = math.radians(90)


def rad(d):
    return math.radians(d)


# ------------------------------------------------------------------ 2D outlines


def rrect(w, h, r, seg=4, cx=0.0, cy=0.0):
    """Rounded rectangle outline (counter-clockwise), centered at (cx, cy)."""
    r = max(0.0, min(r, w / 2 - 1e-4, h / 2 - 1e-4))
    if r <= 0:
        return [(cx - w / 2, cy - h / 2), (cx + w / 2, cy - h / 2), (cx + w / 2, cy + h / 2), (cx - w / 2, cy + h / 2)]
    pts = []
    corners = [(w / 2 - r, -h / 2 + r, -90), (w / 2 - r, h / 2 - r, 0), (-w / 2 + r, h / 2 - r, 90), (-w / 2 + r, -h / 2 + r, 180)]
    for x, y, a0 in corners:
        for i in range(seg + 1):
            a = math.radians(a0 + 90 * i / seg)
            pts.append((cx + x + r * math.cos(a), cy + y + r * math.sin(a)))
    return pts


def circle_pts(r, n=32, cx=0.0, cy=0.0, a0=0.0):
    return [(cx + r * math.cos(a0 + 2 * math.pi * i / n), cy + r * math.sin(a0 + 2 * math.pi * i / n)) for i in range(n)]


def sector_pts(r_in, r_out, a0, a1, n=16, cx=0.0, cy=0.0):
    """Annular sector (angles in degrees, counter-clockwise). r_in = 0 gives a pie slice."""
    pts = []
    for i in range(n + 1):
        a = math.radians(a0 + (a1 - a0) * i / n)
        pts.append((cx + r_out * math.cos(a), cy + r_out * math.sin(a)))
    if r_in <= 1e-5:
        pts.append((cx, cy))
    else:
        for i in range(n, -1, -1):
            a = math.radians(a0 + (a1 - a0) * i / n)
            pts.append((cx + r_in * math.cos(a), cy + r_in * math.sin(a)))
    return pts


# ------------------------------------------------------------------ wall-facing geometry


def wall_shape(points, depth, y_back=0.0, material=None, round=0.0, name="wshape"):
    """Extrude a 2D outline given in world (x, z) toward -Y: back face at y_back, front at y_back - depth."""
    obj = extrude_shape(points, depth, loc=(0, y_back, 0), material=material, rot=(R90, 0, 0), round=round, name=name)
    return obj


def wall_slab(w, h, depth, cx=0.0, cz=0.0, y_back=0.0, material=None, r=0.0, round=0.0, seg=4, name="wslab"):
    return wall_shape(rrect(w, h, r, seg, cx, cz), depth, y_back, material, round, name)


def wall_disc(r, depth, cx=0.0, cz=0.0, y_back=0.0, material=None, verts=32, round=0.0, name="wdisc"):
    """Cylinder whose axis is Y, back face at y_back, extending toward -Y."""
    return cyl(r, depth, loc=(cx, y_back - depth / 2, cz), material=material, verts=verts, rot=(R90, 0, 0), round=round, name=name)


def quad(w, h, center, material=None, facing="-Y", name="quad"):
    """A single rectangle (2 triangles). facing '-Y'/'+Y': in the XZ plane; '+Z': in the XY plane (w along x, h along y)."""
    cx, cy, cz = center
    bm = bmesh.new()
    if facing == "-Y":
        co = [(cx - w / 2, cy, cz - h / 2), (cx + w / 2, cy, cz - h / 2), (cx + w / 2, cy, cz + h / 2), (cx - w / 2, cy, cz + h / 2)]
    elif facing == "+Y":
        co = [(cx + w / 2, cy, cz - h / 2), (cx - w / 2, cy, cz - h / 2), (cx - w / 2, cy, cz + h / 2), (cx + w / 2, cy, cz + h / 2)]
    else:
        co = [(cx - w / 2, cy - h / 2, cz), (cx + w / 2, cy - h / 2, cz), (cx + w / 2, cy + h / 2, cz), (cx - w / 2, cy + h / 2, cz)]
    vs = [bm.verts.new(c) for c in co]
    bm.faces.new(vs)
    return _assign(_from_bmesh(name, bm), material)


# ------------------------------------------------------------------ paths and tubes


def rounded_path(points, r, seg=4, closed=False):
    """Fillet the corners of a polyline with quadratic-bezier arcs of approx radius r."""
    pts = [Vector(p) for p in points]
    n = len(pts)
    out = []
    idx = range(n) if closed else range(n)
    for i in idx:
        p = pts[i]
        if not closed and (i == 0 or i == n - 1):
            out.append(p)
            continue
        a = pts[i - 1]
        b = pts[(i + 1) % n]
        da = (a - p)
        db = (b - p)
        rr = min(r, da.length * 0.49, db.length * 0.49)
        p1 = p + da.normalized() * rr
        p2 = p + db.normalized() * rr
        for k in range(seg + 1):
            t = k / seg
            out.append((1 - t) ** 2 * p1 + 2 * (1 - t) * t * p + t ** 2 * p2)
    if closed:
        # close by repeating the first point plus a tiny overlap, then start mid-way along the first segment
        mid = (out[-1] + out[0]) / 2
        out = [mid] + out + [mid]
    return [tuple(v) for v in out]


def loop_tube(points, radius, material=None, corner=0.05, seg=4, sides=10, closed=True, name="loop"):
    return tube(rounded_path(points, corner, seg, closed), radius, material, sides=sides, name=name)


def arc_points(center, radius, a0, a1, n=12, plane="XZ"):
    """Points along a circular arc (degrees). plane 'XZ' (x, z), 'XY' (x, y) or 'YZ' (y, z)."""
    cx, cy, cz = center
    out = []
    for i in range(n + 1):
        a = math.radians(a0 + (a1 - a0) * i / n)
        c, s = math.cos(a) * radius, math.sin(a) * radius
        if plane == "XZ":
            out.append((cx + c, cy, cz + s))
        elif plane == "XY":
            out.append((cx + c, cy + s, cz))
        else:
            out.append((cx, cy + c, cz + s))
    return out


# ------------------------------------------------------------------ transforms


def xf(pivot, rot, local):
    """World position of `local` offset rotated by Euler `rot` (radians) around `pivot`."""
    return tuple(Vector(pivot) + Euler(rot).to_matrix() @ Vector(local))


def hollow_lathe(r_out, h, wall=0.004, bottom=0.006, lip=0.002, taper=0.0, material=None, segments=28, name="cup"):
    """Open-top vessel (cup/pot/bin). taper = how much wider the top is than the bottom (radius)."""
    rb = r_out - taper
    prof = [
        (rb - 0.004, 0.0),
        (rb, 0.003),
        (r_out, h - lip),
        (r_out - lip * 0.5, h),
        (r_out - wall, h - lip * 0.5),
        (rb - wall, bottom),
    ]
    return lathe(prof, material, segments=segments, name=name)


# ------------------------------------------------------------------ reporting


def mat_bounds(material_name):
    lo = Vector((1e9, 1e9, 1e9))
    hi = Vector((-1e9, -1e9, -1e9))
    found = False
    for o in bpy.context.scene.objects:
        if o.type != "MESH" or not o.data.materials:
            continue
        for slot_i, m in enumerate(o.data.materials):
            if m and m.name == material_name:
                for poly in o.data.polygons:
                    if poly.material_index != slot_i:
                        continue
                    for vi in poly.vertices:
                        w = o.matrix_world @ o.data.vertices[vi].co
                        lo = Vector((min(lo.x, w.x), min(lo.y, w.y), min(lo.z, w.z)))
                        hi = Vector((max(hi.x, w.x), max(hi.y, w.y), max(hi.z, w.z)))
                        found = True
    if not found:
        return None
    return lo, hi


def report_mat(material_name, label=None):
    b = mat_bounds(material_name)
    if b is None:
        print(f"ASSET-NOTE {label or material_name}: not found")
        return
    lo, hi = b
    c = (lo + hi) / 2
    print(
        f"ASSET-NOTE {label or material_name}: center ({c.x:.4f}, {c.y:.4f}, {c.z:.4f}) "
        f"size {hi.x - lo.x:.4f} x {hi.y - lo.y:.4f} x {hi.z - lo.z:.4f}"
    )


def material_count():
    names = set()
    for o in bpy.context.scene.objects:
        if o.type == "MESH":
            for m in o.data.materials:
                if m and not m.name.startswith("_"):
                    names.add(m.name)
    return sorted(names)


def ptube(points, radius, material=None, sides=10, squash=1.0, caps=True, name="ptube"):
    """Tube with rotation-minimising frames (no twisting at vertical tangents).
    `squash` < 1 flattens the cross-section along the frame's second axis (ribbons, scarves).
    `radius` may be a number or a list (one per point) for tapering."""
    bm = bmesh.new()
    pts = [Vector(p) for p in points]
    n = len(pts)
    radii = radius if isinstance(radius, (list, tuple)) else [radius] * n
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
    rings = []
    for i in range(n):
        if i > 0:
            # parallel transport u from the previous tangent to this one
            u = (u - tans[i] * u.dot(tans[i])).normalized()
        v = tans[i].cross(u).normalized()
        ring = []
        for k in range(sides):
            a = 2 * math.pi * k / sides
            ring.append(bm.verts.new(pts[i] + (u * math.cos(a) + v * math.sin(a) * squash) * radii[i]))
        rings.append(ring)
    for i in range(n - 1):
        for k in range(sides):
            bm.faces.new((rings[i][k], rings[i][(k + 1) % sides], rings[i + 1][(k + 1) % sides], rings[i + 1][k]))
    if caps:
        bm.faces.new(list(reversed(rings[0])))
        bm.faces.new(rings[-1])
    obj = _from_bmesh(name, bm)
    return _assign(obj, material)


def ring_lathe(profile, material=None, segments=28, name="ring"):
    """Revolve a profile around Z without end caps (bands, rims, lips)."""
    bm = bmesh.new()
    rings = []
    for k in range(segments):
        a = 2 * math.pi * k / segments
        rings.append([bm.verts.new((r * math.cos(a), r * math.sin(a), z)) for r, z in profile])
    for k in range(segments):
        r0 = rings[k]
        r1 = rings[(k + 1) % segments]
        for i in range(len(profile) - 1):
            bm.faces.new((r0[i], r1[i], r1[i + 1], r0[i + 1]))
    return _assign(_from_bmesh(name, bm), material)


def extra_view(name, direction=(0.75, -1.25, 0.8), dist=1.65, suffix="b", out_dir=None):
    """Re-render the current (finished) scene from another direction, after finish()."""
    import os

    scene = bpy.context.scene
    cam = scene.camera
    lo = Vector((1e9, 1e9, 1e9))
    hi = Vector((-1e9, -1e9, -1e9))
    for o in scene.objects:
        if o.type != "MESH" or (o.data.materials and o.data.materials[0].name == "_floor"):
            continue
        for v in o.data.vertices:
            w = o.matrix_world @ v.co
            lo = Vector((min(lo.x, w.x), min(lo.y, w.y), min(lo.z, w.z)))
            hi = Vector((max(hi.x, w.x), max(hi.y, w.y), max(hi.z, w.z)))
    center = (lo + hi) / 2
    size = max((hi - lo).length, 0.3)
    d = Vector(direction).normalized()
    cam.location = center + d * size * dist
    cam.rotation_euler = (center - cam.location).to_track_quat("-Z", "Y").to_euler()
    out_dir = out_dir or os.environ.get("EXTRA_VIEW_DIR")
    if not out_dir:
        return  # extra views are only for iterating (set EXTRA_VIEW_DIR)
    os.makedirs(out_dir, exist_ok=True)
    scene.render.filepath = os.path.join(out_dir, f"{name}_{suffix}.png")
    bpy.ops.render.render(write_still=True)
    print(f"PREVIEW-EXTRA {name}: {scene.render.filepath}")


def done(name, report=(), views=()):
    """finish() plus a material list, optional material-bounds report (e.g. the screen face)
    and optional extra preview directions (only rendered when EXTRA_VIEW_DIR is set)."""
    from lib import finish

    finish(name)
    print(f"ASSET-MATS {name}: {len(material_count())} {material_count()}")
    for m in report:
        report_mat(m, f"{name}.{m}")
    for i, d in enumerate(views):
        extra_view(name, d, suffix=f"v{i}")



def leafy_plant(pos, height=0.4, spread=0.18, leaf_mat=None, stem_mat=None, seed=1, n=14, leaf_len=0.08, leaf_w=0.035,
                droop=0.0, segs=8):
    """A bushy potted-plant crown: stems from `pos` (top of the soil) out to almond-shaped leaves.
    droop > 0 makes outer leaves hang lower (trailing plants)."""
    import random

    from lib import sphere

    rng = random.Random(seed)
    px, py, pz = pos
    golden = math.pi * (3 - math.sqrt(5))
    for i in range(n):
        t = (i + 0.5) / n
        a = i * golden + rng.uniform(-0.3, 0.3)
        rr = spread * math.sqrt(t) * rng.uniform(0.75, 1.05)
        z = pz + height * (1 - 0.65 * t) * rng.uniform(0.85, 1.05) - droop * t * height
        tip = Vector((px + math.cos(a) * rr, py + math.sin(a) * rr, z))
        base = Vector((px + math.cos(a) * 0.01, py + math.sin(a) * 0.01, pz))
        mid = base.lerp(tip, 0.5) + Vector((0, 0, height * 0.12))
        if stem_mat is not None:
            ptube([base, mid, tip], 0.0045, stem_mat, sides=5, caps=False)
        # leaf points outward and up from the stem tip
        d = (tip - mid).normalized()
        d = (d + Vector((math.cos(a), math.sin(a), 0.35))).normalized()
        L = leaf_len * rng.uniform(0.8, 1.15)
        lf = sphere(1.0, material=leaf_mat, segments=segs, rings=4)
        lf.scale = (leaf_w, leaf_w * 0.35, L)
        q = d.to_track_quat("Z", "Y")
        lf.rotation_euler = q.to_euler()
        lf.location = tuple(tip + d * L * 0.85)


def pot(pos, r=0.1, h=0.18, material=None, soil=None, segments=20, rim=True):
    """Simple tapered planter with a rim and a soil disc. Returns the soil-top position."""
    px, py, pz = pos
    rb = r * 0.82
    prof = [(rb - 0.006, pz), (rb, pz + 0.006), (r, pz + h - 0.02)]
    if rim:
        prof += [(r + 0.008, pz + h - 0.018), (r + 0.008, pz + h), (r - 0.006, pz + h), (r - 0.008, pz + h - 0.02)]
    else:
        prof += [(r, pz + h), (r - 0.008, pz + h)]
    o = lathe(prof, material, segments=segments, name="pot")
    o.location = (px, py, 0)
    if soil is not None:
        cyl(r - 0.008, 0.006, loc=(px, py, pz + h - 0.022), material=soil, verts=segments)
    return (px, py, pz + h - 0.02)


def wall_frame(w, h, fw, depth, cx=0.0, cz=0.0, y_back=0.0, material=None, round=0.006):
    """Picture-frame border made of four mitered rails, facing -Y (back at y_back)."""
    x0, x1, z0, z1 = cx - w / 2, cx + w / 2, cz - h / 2, cz + h / 2
    sides = [
        [(x0, z0), (x1, z0), (x1 - fw, z0 + fw), (x0 + fw, z0 + fw)],
        [(x1, z0), (x1, z1), (x1 - fw, z1 - fw), (x1 - fw, z0 + fw)],
        [(x1, z1), (x0, z1), (x0 + fw, z1 - fw), (x1 - fw, z1 - fw)],
        [(x0, z1), (x0, z0), (x0 + fw, z0 + fw), (x0 + fw, z1 - fw)],
    ]
    return [wall_shape(s, depth, y_back, material, round=round) for s in sides]
