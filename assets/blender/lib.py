"""Shared helpers for Agent Office asset scripts (run with Blender in background mode).

Conventions (keep every asset consistent with the game):
  * Units are meters. The origin is the center of the item's footprint on the floor (z = 0).
  * The item's FRONT faces Blender -Y (the side a person uses / sits at / looks at).
    The glTF exporter turns that into the game's +Z ("front faces south").
  * Style: chunky, friendly, slightly rounded (bevels everywhere), low-poly but smooth-shaded.
    Pastel palette from PALETTE. No textures; color comes from named materials.
  * Material names matter to the game:
      - "accent*"  -> recolored at runtime to the floor's theme accent (chair fabric, etc.)
      - "screen*"  -> unlit, used for monitor/TV faces the game may draw on
      - "glass*"   -> transparent glass
      - "emissive*"-> unlit glowing (lamp shades, LEDs)
      - anything else -> toon-shaded with its base color
  * Budget: aim for <= 3k triangles for small props, <= 8k for big furniture.
    Meshes are joined per material on export so each asset is only a few draw calls.

Usage inside an asset script:
    import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from lib import *
    reset()
    ...build with the helpers below...
    finish("office_chair")   # exports public/models/office_chair.glb + a preview PNG
"""

import math
import os
import sys

import bpy
import bmesh
from mathutils import Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
MODELS_DIR = os.path.join(ROOT, "public", "models")
PREVIEW_DIR = os.environ.get("ASSET_PREVIEW_DIR", os.path.join(ROOT, "assets", "previews"))

PALETTE = {
    "white": "#f6f4ef",
    "offwhite": "#ece6da",
    "paper": "#fbfaf6",
    "ink": "#2e3040",
    "charcoal": "#3a3c4e",
    "slate": "#55576a",
    "steel": "#9a9eab",
    "chrome": "#c9ced9",
    "oak": "#d9b48a",
    "oak_dark": "#b98d5e",
    "walnut": "#8a5a3c",
    "terracotta": "#d9825b",
    "leaf": "#5fb86a",
    "leaf_dark": "#3f9a52",
    "leaf_light": "#8fd18a",
    "sky": "#8fd3ff",
    "blue": "#6f9de0",
    "navy": "#3b4a7a",
    "coral": "#ff8f8f",
    "peach": "#ffb38a",
    "butter": "#ffd36b",
    "mint": "#a4e59a",
    "lilac": "#c9a7ff",
    "rose": "#f2a6a0",
    "sage": "#9fc4a8",
    "cream": "#fff3d6",
    "black": "#1f2130",
}


def hex_rgba(h):
    h = h.lstrip("#")
    r, g, b = (int(h[i : i + 2], 16) / 255 for i in (0, 2, 4))
    # convert sRGB -> linear for Blender
    lin = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return (lin(r), lin(g), lin(b), 1.0)


_materials = {}


def mat(name, color=None, alpha=1.0, roughness=0.6):
    """Get or create a named material. `color` is a hex string or a PALETTE key."""
    key = name
    if key in _materials:
        return _materials[key]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    c = PALETTE.get(color, color) if color else PALETTE.get(name, "#ffffff")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = hex_rgba(c)
        bsdf.inputs["Roughness"].default_value = roughness
        if alpha < 1.0:
            bsdf.inputs["Alpha"].default_value = alpha
    m.diffuse_color = hex_rgba(c)
    if alpha < 1.0:
        m.blend_method = "BLEND" if hasattr(m, "blend_method") else None
    _materials[key] = m
    return m


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    _materials.clear()


def _link(obj):
    bpy.context.collection.objects.link(obj)
    return obj


def _assign(obj, material):
    if material is None:
        return obj
    if isinstance(material, str):
        material = mat(material)
    obj.data.materials.clear()
    obj.data.materials.append(material)
    return obj


def _from_bmesh(name, bm):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    return _link(bpy.data.objects.new(name, me))


def bevel(obj, width=0.02, segments=3, angle=60):
    mod = obj.modifiers.new("Bevel", "BEVEL")
    mod.width = width
    mod.segments = segments
    mod.limit_method = "ANGLE"
    mod.angle_limit = math.radians(angle)
    mod.harden_normals = False
    return obj


def box(size, loc=(0, 0, 0), material=None, round=0.0, segments=3, rot=(0, 0, 0), name="box"):
    """Axis-aligned box. `size` = (x, y, z) full extents, `loc` = center."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector((v.co.x * size[0], v.co.y * size[1], v.co.z * size[2]))
    obj = _from_bmesh(name, bm)
    obj.location = loc
    obj.rotation_euler = rot
    if round > 0:
        bevel(obj, width=min(round, min(size) / 2 - 1e-4), segments=segments)
    return _assign(obj, material)


def cyl(radius, depth, loc=(0, 0, 0), material=None, verts=24, rot=(0, 0, 0), round=0.0, radius2=None, name="cyl"):
    """Cylinder (or cone when radius2 is given) along Z, centered at loc."""
    bm = bmesh.new()
    r2 = radius if radius2 is None else radius2
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=verts, radius1=radius, radius2=r2, depth=depth)
    obj = _from_bmesh(name, bm)
    obj.location = loc
    obj.rotation_euler = rot
    if round > 0:
        bevel(obj, width=min(round, depth / 2 - 1e-4), segments=3)
    return _assign(obj, material)


def sphere(radius, loc=(0, 0, 0), material=None, scale=(1, 1, 1), segments=20, rings=12, name="sphere"):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=segments, v_segments=rings, radius=radius)
    obj = _from_bmesh(name, bm)
    obj.location = loc
    obj.scale = scale
    return _assign(obj, material)


def ico(radius, loc=(0, 0, 0), material=None, subdiv=1, scale=(1, 1, 1), rot=(0, 0, 0), name="ico"):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=subdiv, radius=radius)
    obj = _from_bmesh(name, bm)
    obj.location = loc
    obj.scale = scale
    obj.rotation_euler = rot
    return _assign(obj, material)


def torus(major, minor, loc=(0, 0, 0), material=None, rot=(0, 0, 0), major_seg=24, minor_seg=8, arc=1.0, name="torus"):
    """Torus in the XY plane (rotate to orient). `arc` < 1 makes a partial ring."""
    bm = bmesh.new()
    segs = []
    n = major_seg
    arcn = max(2, int(round(n * arc)))
    closed = arc >= 0.999
    rings = []
    for i in range(arcn + (0 if closed else 1)):
        a = 2 * math.pi * arc * i / arcn
        ring = []
        for j in range(minor_seg):
            b = 2 * math.pi * j / minor_seg
            r = major + minor * math.cos(b)
            ring.append(bm.verts.new((r * math.cos(a), r * math.sin(a), minor * math.sin(b))))
        rings.append(ring)
    for i in range(len(rings) - (0 if closed else 1)):
        r0 = rings[i]
        r1 = rings[(i + 1) % len(rings)]
        for j in range(minor_seg):
            bm.faces.new((r0[j], r0[(j + 1) % minor_seg], r1[(j + 1) % minor_seg], r1[j]))
    if not closed:
        bm.faces.new(list(reversed(rings[0])))
        bm.faces.new(rings[-1])
    del segs
    obj = _from_bmesh(name, bm)
    obj.location = loc
    obj.rotation_euler = rot
    return _assign(obj, material)


def tube(points, radius, material=None, sides=10, name="tube"):
    """A round tube following a list of (x, y, z) points (for frames, handles, cables)."""
    bm = bmesh.new()
    pts = [Vector(p) for p in points]
    rings = []
    for i, p in enumerate(pts):
        if i == 0:
            t = (pts[1] - pts[0]).normalized()
        elif i == len(pts) - 1:
            t = (pts[-1] - pts[-2]).normalized()
        else:
            t = ((pts[i + 1] - pts[i]).normalized() + (pts[i] - pts[i - 1]).normalized()).normalized()
        up = Vector((0, 0, 1)) if abs(t.z) < 0.95 else Vector((1, 0, 0))
        u = t.cross(up).normalized()
        v = t.cross(u).normalized()
        ring = [bm.verts.new(p + (u * math.cos(2 * math.pi * k / sides) + v * math.sin(2 * math.pi * k / sides)) * radius) for k in range(sides)]
        rings.append(ring)
    for i in range(len(rings) - 1):
        for k in range(sides):
            bm.faces.new((rings[i][k], rings[i][(k + 1) % sides], rings[i + 1][(k + 1) % sides], rings[i + 1][k]))
    bm.faces.new(list(reversed(rings[0])))
    bm.faces.new(rings[-1])
    obj = _from_bmesh(name, bm)
    return _assign(obj, material)


def lathe(profile, material=None, segments=28, name="lathe"):
    """Revolve a 2D profile [(radius, z), ...] around Z (pots, vases, lamp shades, cups)."""
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
    # caps where the profile touches the axis are left open on purpose; close the ends with fans
    if profile[0][0] > 1e-4:
        c = bm.verts.new((0, 0, profile[0][1]))
        for k in range(segments):
            bm.faces.new((c, rings[(k + 1) % segments][0], rings[k][0]))
    if profile[-1][0] > 1e-4:
        c = bm.verts.new((0, 0, profile[-1][1]))
        for k in range(segments):
            bm.faces.new((c, rings[k][-1], rings[(k + 1) % segments][-1]))
    obj = _from_bmesh(name, bm)
    return _assign(obj, material)


def extrude_shape(points2d, depth, loc=(0, 0, 0), material=None, rot=(0, 0, 0), round=0.0, name="shape"):
    """Extrude a 2D polygon (in XY) by `depth` along Z."""
    bm = bmesh.new()
    bottom = [bm.verts.new((x, y, 0)) for x, y in points2d]
    top = [bm.verts.new((x, y, depth)) for x, y in points2d]
    bm.faces.new(list(reversed(bottom)))
    bm.faces.new(top)
    n = len(points2d)
    for i in range(n):
        bm.faces.new((bottom[i], bottom[(i + 1) % n], top[(i + 1) % n], top[i]))
    obj = _from_bmesh(name, bm)
    obj.location = loc
    obj.rotation_euler = rot
    if round > 0:
        bevel(obj, width=round, segments=2)
    return _assign(obj, material)


def mirror_x(obj):
    """Duplicate an object mirrored across X=0 (returns the copy)."""
    dup = obj.copy()
    dup.data = obj.data.copy()
    dup.modifiers.clear()
    for m in obj.modifiers:
        nm = dup.modifiers.new(m.name, m.type)
        for attr in ("width", "segments", "limit_method", "angle_limit"):
            if hasattr(m, attr):
                setattr(nm, attr, getattr(m, attr))
    dup.location.x = -obj.location.x
    dup.rotation_euler.y = -obj.rotation_euler.y
    dup.rotation_euler.z = -obj.rotation_euler.z
    _link(dup)
    return dup


def array(obj, count, offset, name=None):
    """Duplicate obj `count-1` times shifted by `offset` each time. Returns all copies incl. original."""
    out = [obj]
    for i in range(1, count):
        dup = obj.copy()
        dup.data = obj.data
        dup.location = obj.location + Vector(offset) * i
        _link(dup)
        out.append(dup)
    return out


# ------------------------------------------------------------------ finishing


def _apply_all():
    bpy.ops.object.select_all(action="DESELECT")
    for o in bpy.context.scene.objects:
        if o.type != "MESH":
            continue
        o.select_set(True)
        bpy.context.view_layer.objects.active = o
        if o.data.users > 1:
            o.data = o.data.copy()
    bpy.ops.object.convert(target="MESH")  # applies modifiers
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)


def _join_by_material():
    groups = {}
    for o in list(bpy.context.scene.objects):
        if o.type != "MESH" or not o.data.materials:
            continue
        groups.setdefault(o.data.materials[0].name, []).append(o)
    for name, objs in groups.items():
        bpy.ops.object.select_all(action="DESELECT")
        for o in objs:
            o.select_set(True)
        bpy.context.view_layer.objects.active = objs[0]
        if len(objs) > 1:
            bpy.ops.object.join()
        bpy.context.view_layer.objects.active.name = name


def _smooth():
    bpy.ops.object.select_all(action="SELECT")
    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    if not meshes:
        return
    bpy.context.view_layer.objects.active = meshes[0]
    try:
        bpy.ops.object.shade_smooth_by_angle(angle=math.radians(40))
    except Exception:
        bpy.ops.object.shade_smooth()


def stats():
    tris = 0
    for o in bpy.context.scene.objects:
        if o.type == "MESH":
            o.data.calc_loop_triangles()
            tris += len(o.data.loop_triangles)
    return tris


def bounds():
    lo = Vector((1e9, 1e9, 1e9))
    hi = Vector((-1e9, -1e9, -1e9))
    for o in bpy.context.scene.objects:
        if o.type != "MESH":
            continue
        for v in o.data.vertices:
            w = o.matrix_world @ v.co
            lo = Vector((min(lo.x, w.x), min(lo.y, w.y), min(lo.z, w.z)))
            hi = Vector((max(hi.x, w.x), max(hi.y, w.y), max(hi.z, w.z)))
    return lo, hi


def render_preview(name):
    os.makedirs(PREVIEW_DIR, exist_ok=True)
    scene = bpy.context.scene
    lo, hi = bounds()
    center = (lo + hi) / 2
    size = max((hi - lo).length, 0.3)
    # camera at a 3/4 front view (front is -Y)
    cam_data = bpy.data.cameras.new("cam")
    cam_data.lens = 50
    cam = bpy.data.objects.new("cam", cam_data)
    scene.collection.objects.link(cam)
    direction = Vector((0.75, -1.25, 0.8)).normalized()
    cam.location = center + direction * size * 1.65
    cam.rotation_euler = (center - cam.location).to_track_quat("-Z", "Y").to_euler()
    scene.camera = cam
    # lights
    sun_data = bpy.data.lights.new("sun", "SUN")
    sun_data.energy = 3.5
    sun = bpy.data.objects.new("sun", sun_data)
    sun.rotation_euler = (math.radians(50), math.radians(10), math.radians(30))
    scene.collection.objects.link(sun)
    world = bpy.data.worlds.new("w")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.82, 0.86, 0.92, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 1.0
    scene.world = world
    # floor
    bpy.ops.mesh.primitive_plane_add(size=size * 6, location=(center.x, center.y, 0))
    floor = bpy.context.active_object
    floor.data.materials.append(mat("_floor", "#dfe3ea"))
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 640
    scene.render.resolution_y = 640
    scene.render.film_transparent = False
    scene.render.filepath = os.path.join(PREVIEW_DIR, name + ".png")
    try:
        scene.eevee.taa_render_samples = 16
    except Exception:
        pass
    bpy.ops.render.render(write_still=True)
    return scene.render.filepath


def finish(name, preview=True):
    """Apply modifiers, join per material, smooth, export GLB, then render a preview."""
    _apply_all()
    _join_by_material()
    _smooth()
    tris = stats()
    lo, hi = bounds()
    os.makedirs(MODELS_DIR, exist_ok=True)
    path = os.path.join(MODELS_DIR, name + ".glb")
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_materials="EXPORT",
        export_normals=True,
    )
    print(f"ASSET {name}: {tris} tris, size {hi.x - lo.x:.2f} x {hi.y - lo.y:.2f} x {hi.z - lo.z:.2f} m, min z {lo.z:.3f} -> {path}")
    if preview and os.environ.get("ASSET_NO_PREVIEW") != "1":
        out = render_preview(name)
        print(f"PREVIEW {name}: {out}")
