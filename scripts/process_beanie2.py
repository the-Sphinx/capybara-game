"""
process_beanie2.py
------------------
Process knit_beanie_original2.blend:
  - Beanie body (mesh, ~8315 verts) — already has pompom removed
  - Mball (metaball) — ball-shaped pompom placed by user

Steps:
  1. Convert Mball → mesh
  2. Render before screenshots
  3. Decimate beanie body to 3k-5k range
  4. Decimate ball if over 2k verts
  5. Fix geometry: Z shift (brim→Z=0), uniform scale to match crown X diameter (0.4555)
  6. Name objects 'beanie_body' / 'beanie_pompom'
  7. Recalculate normals, save blend, export GLB x2

Run:
  /Applications/Blender.app/Contents/MacOS/Blender \
    --background assets/models/knit_beanie_original2.blend \
    --python scripts/process_beanie2.py
"""

import bpy, bmesh, os, math, mathutils

BLEND_PATH = bpy.data.filepath
BLEND_DIR  = os.path.dirname(BLEND_PATH)
OUT_BLEND  = os.path.join(BLEND_DIR, "knit_beanie.blend")
ASSETS_GLB = os.path.join(BLEND_DIR, "knit_beanie.glb")
REPO_ROOT  = os.path.dirname(os.path.dirname(BLEND_DIR))
PUBLIC_GLB = os.path.join(REPO_ROOT, "capy-village", "public", "knit_beanie.glb")

TARGET_DIAMETER       = 0.4555
BODY_DECIMATE_RATIO   = 0.45    # 8315 × 0.45 ≈ 3742 verts target
BALL_DECIMATE_MAX_V   = 2000    # decimate ball if it exceeds this

# ---------------------------------------------------------------------------
# 1. Find and label objects
# ---------------------------------------------------------------------------
meta_obj  = next((o for o in bpy.data.objects if o.type == 'META'),  None)
beanie_obj = next((o for o in bpy.data.objects if o.type == 'MESH'), None)

if not meta_obj:
    raise RuntimeError("No META object found")
if not beanie_obj:
    raise RuntimeError("No MESH object found")

print(f"[b2] Beanie mesh: '{beanie_obj.name}'  verts={len(beanie_obj.data.vertices)}")
print(f"[b2] Metaball   : '{meta_obj.name}'  loc={list(meta_obj.location)}")

# ---------------------------------------------------------------------------
# 2. Convert Metaball → Mesh
# ---------------------------------------------------------------------------
bpy.ops.object.select_all(action='DESELECT')
meta_obj.select_set(True)
bpy.context.view_layer.objects.active = meta_obj
bpy.ops.object.convert(target='MESH')
ball_obj = bpy.context.active_object
print(f"[b2] Ball after convert: verts={len(ball_obj.data.vertices)}  polys={len(ball_obj.data.polygons)}")

# Bake all transforms so vertex coords = world coords
bpy.ops.object.transform_apply(location=True, scale=True, rotation=True)

# ---------------------------------------------------------------------------
# 3. Before screenshots
# ---------------------------------------------------------------------------
import mathutils as mu

def look_at(cam_pos, target):
    direction = (mu.Vector(target) - mu.Vector(cam_pos)).normalized()
    return direction.to_track_quat('-Z', 'Y').to_euler()

def setup_render():
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.resolution_x = 512
    scene.render.resolution_y = 512
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    world = bpy.data.worlds.get('World') or bpy.data.worlds.new('World')
    world.use_nodes = True
    bg = world.node_tree.nodes.get('Background')
    if bg:
        bg.inputs[0].default_value = (0.12, 0.12, 0.12, 1)
    scene.world = world

def clear_cameras_lights():
    for o in list(bpy.data.objects):
        if o.type in ('CAMERA', 'LIGHT'):
            bpy.data.objects.remove(o, do_unlink=True)

def add_sun():
    bpy.ops.object.light_add(type='SUN', location=(3, -3, 6))
    sun = bpy.context.active_object
    sun.data.energy = 4
    sun.rotation_euler = (math.radians(40), 0, math.radians(-30))

def render_views(prefix, center):
    scene = bpy.context.scene
    d = 1.0
    views = {
        'front': (0,    -d*2.0, center[2]),
        'side':  (d*2.0, 0,     center[2]),
        '3q':    (d*1.3, -d*1.3, center[2] + d*0.3),
    }
    for name, cam_pos in views.items():
        bpy.ops.object.camera_add(location=cam_pos)
        cam = bpy.context.active_object
        cam.rotation_euler = look_at(cam_pos, center)
        scene.camera = cam
        scene.render.filepath = f'/tmp/beanie2_{prefix}_{name}.png'
        bpy.ops.render.render(write_still=True)
        print(f"[b2] Saved: /tmp/beanie2_{prefix}_{name}.png")
        bpy.data.objects.remove(cam, do_unlink=True)

# Compute combined bounding box center for screenshots
all_verts = (
    [beanie_obj.matrix_world @ v.co for v in beanie_obj.data.vertices] +
    [ball_obj.matrix_world   @ v.co for v in ball_obj.data.vertices]
)
xs = [v.x for v in all_verts]; ys = [v.y for v in all_verts]; zs = [v.z for v in all_verts]
center = ((max(xs)+min(xs))/2, (max(ys)+min(ys))/2, (max(zs)+min(zs))/2)

clear_cameras_lights(); add_sun(); setup_render()
print("[b2] Rendering BEFORE screenshots...")
render_views('before', center)

# ---------------------------------------------------------------------------
# 4. Decimate beanie body
# ---------------------------------------------------------------------------
bpy.ops.object.select_all(action='DESELECT')
beanie_obj.select_set(True)
bpy.context.view_layer.objects.active = beanie_obj

dec = beanie_obj.modifiers.new(name="Decimate", type='DECIMATE')
dec.ratio = BODY_DECIMATE_RATIO
dec.decimate_type = 'COLLAPSE'
with bpy.context.temp_override(active_object=beanie_obj, object=beanie_obj,
                                selected_objects=[beanie_obj]):
    bpy.ops.object.modifier_apply(modifier="Decimate")
print(f"[b2] Beanie after decimate: verts={len(beanie_obj.data.vertices)}")

# ---------------------------------------------------------------------------
# 5. Decimate ball if needed
# ---------------------------------------------------------------------------
ball_verts = len(ball_obj.data.vertices)
if ball_verts > BALL_DECIMATE_MAX_V:
    ratio = BALL_DECIMATE_MAX_V / ball_verts
    bpy.ops.object.select_all(action='DESELECT')
    ball_obj.select_set(True)
    bpy.context.view_layer.objects.active = ball_obj
    dec2 = ball_obj.modifiers.new(name="Decimate", type='DECIMATE')
    dec2.ratio = ratio
    dec2.decimate_type = 'COLLAPSE'
    with bpy.context.temp_override(active_object=ball_obj, object=ball_obj,
                                    selected_objects=[ball_obj]):
        bpy.ops.object.modifier_apply(modifier="Decimate")
    print(f"[b2] Ball after decimate: verts={len(ball_obj.data.vertices)}")
else:
    print(f"[b2] Ball kept at: verts={ball_verts}")

# ---------------------------------------------------------------------------
# 6. Measure combined bounding box for Z-shift and scale
# ---------------------------------------------------------------------------
all_vx, all_vy, all_vz = [], [], []
for obj in (beanie_obj, ball_obj):
    for v in obj.data.vertices:
        all_vx.append(v.co.x); all_vy.append(v.co.y); all_vz.append(v.co.z)

z_min      = min(all_vz)
x_diameter = max(all_vx) - min(all_vx)
scale_f    = TARGET_DIAMETER / x_diameter
print(f"[b2] z_min={z_min:.4f}  x_diam={x_diameter:.4f}  scale={scale_f:.4f}")

def transform_verts(obj, z_shift, scale):
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    for v in bm.verts:
        v.co.z -= z_shift
        v.co.x *= scale; v.co.y *= scale; v.co.z *= scale
    bm.to_mesh(obj.data); bm.free(); obj.data.update()

transform_verts(beanie_obj, z_min, scale_f)
transform_verts(ball_obj,   z_min, scale_f)

# Recalculate normals
for obj in (beanie_obj, ball_obj):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode='OBJECT')
    obj.select_set(False)

# ---------------------------------------------------------------------------
# 7. Rename objects
# ---------------------------------------------------------------------------
beanie_obj.name      = 'beanie_body'
beanie_obj.data.name = 'beanie_body'
ball_obj.name        = 'beanie_pompom'
ball_obj.data.name   = 'beanie_pompom'

# ---------------------------------------------------------------------------
# 8. After screenshots
# ---------------------------------------------------------------------------
all_vx2, all_vy2, all_vz2 = [], [], []
for obj in (beanie_obj, ball_obj):
    for v in obj.data.vertices:
        all_vx2.append(v.co.x); all_vy2.append(v.co.y); all_vz2.append(v.co.z)
center2 = ((max(all_vx2)+min(all_vx2))/2, (max(all_vy2)+min(all_vy2))/2, (max(all_vz2)+min(all_vz2))/2)
clear_cameras_lights(); add_sun()
print("[b2] Rendering AFTER screenshots...")
render_views('after', center2)

# ---------------------------------------------------------------------------
# 9. Verify
# ---------------------------------------------------------------------------
print("\n[b2] ---- FINAL VERIFICATION ----")
for obj in (beanie_obj, ball_obj):
    xs = [v.co.x for v in obj.data.vertices]
    ys = [v.co.y for v in obj.data.vertices]
    zs = [v.co.z for v in obj.data.vertices]
    print(f"[b2] '{obj.name}': verts={len(obj.data.vertices)}  polys={len(obj.data.polygons)}")
    print(f"[b2]   Z=[{min(zs):.4f},{max(zs):.4f}]  X_diam={max(xs)-min(xs):.4f}  Y_diam={max(ys)-min(ys):.4f}")

# ---------------------------------------------------------------------------
# 10. Save + export
# ---------------------------------------------------------------------------
bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)
print(f"\n[b2] Saved: {OUT_BLEND}")

bpy.ops.object.select_all(action='SELECT')
for export_path in (ASSETS_GLB, PUBLIC_GLB):
    os.makedirs(os.path.dirname(export_path), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=export_path, export_format='GLB',
        export_apply=True, export_normals=True,
        export_materials='EXPORT',
        export_cameras=False, export_lights=False,
    )
    print(f"[b2] Exported: {export_path}")
print("[b2] Done.")
