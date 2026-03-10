"""
compare_decimate.py
-------------------
Renders 4-angle screenshots of chef_hat BEFORE and AFTER decimation so we can
visually confirm shape preservation before committing.

Run:
  /Applications/Blender.app/Contents/MacOS/Blender \
    --background assets/models/chef_hat_original.blend \
    --python scripts/compare_decimate.py -- <ratio>

  <ratio>  float 0..1  decimate face ratio (e.g. 0.15 → ~3900 verts target)
  Default: 0.15

Outputs  /tmp/chef_hat_before_<angle>.png
         /tmp/chef_hat_after_<ratio>_<angle>.png
"""

import bpy
import bmesh
import math
import sys
import mathutils

# ---------------------------------------------------------------------------
# Parse ratio argument (after '--' separator)
# ---------------------------------------------------------------------------
argv = sys.argv
ratio = 0.15
if '--' in argv:
    after = argv[argv.index('--') + 1:]
    if after:
        ratio = float(after[0])
print(f"[compare] Decimate ratio: {ratio}")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def clear_cameras_lights():
    for obj in list(bpy.data.objects):
        if obj.type in ('CAMERA', 'LIGHT'):
            bpy.data.objects.remove(obj, do_unlink=True)

def add_sun():
    bpy.ops.object.light_add(type='SUN', location=(3, -3, 6))
    sun = bpy.context.active_object
    sun.data.energy = 4
    sun.rotation_euler = (math.radians(40), 0, math.radians(-30))

def look_at(camera_pos, target):
    """Return Euler rotation so camera's -Z axis points at target."""
    direction = (mathutils.Vector(target) - mathutils.Vector(camera_pos)).normalized()
    rot_quat  = direction.to_track_quat('-Z', 'Y')
    return rot_quat.to_euler()

def setup_render():
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.resolution_x = 512
    scene.render.resolution_y = 512
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    # Simple world background
    world = bpy.data.worlds['World'] if 'World' in bpy.data.worlds else bpy.data.worlds.new('World')
    world.use_nodes = True
    bg = world.node_tree.nodes.get('Background')
    if bg:
        bg.inputs[0].default_value = (0.12, 0.12, 0.12, 1)
    scene.world = world

def render_views(prefix, obj, center):
    """Render front/side/top/3q views of obj, save to /tmp/."""
    scene = bpy.context.scene
    d = 1.0  # base camera distance

    views = {
        'front': (0,    -d*2.0, center[2]),
        'side':  (d*2.0, 0,     center[2]),
        'top':   (0,     0,     d*3.0   ),
        '3q':    (d*1.3, -d*1.3, center[2] + d*0.5),
    }

    for name, cam_pos in views.items():
        bpy.ops.object.camera_add(location=cam_pos)
        cam_obj = bpy.context.active_object
        cam_obj.rotation_euler = look_at(cam_pos, center)
        scene.camera = cam_obj

        out_path = f'/tmp/chef_hat_{prefix}_{name}.png'
        scene.render.filepath = out_path
        bpy.ops.render.render(write_still=True)
        print(f"[compare] Saved: {out_path}")

        bpy.data.objects.remove(cam_obj, do_unlink=True)

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
mesh_obj = next((o for o in bpy.data.objects if o.type == 'MESH'), None)
if not mesh_obj:
    raise RuntimeError("No MESH found")

print(f"[compare] Mesh: '{mesh_obj.name}'  verts={len(mesh_obj.data.vertices)}")

# Object bounding box center in world space
xs = [v.co.x for v in mesh_obj.data.vertices]
ys = [v.co.y for v in mesh_obj.data.vertices]
zs = [v.co.z for v in mesh_obj.data.vertices]
center = ((max(xs)+min(xs))/2, (max(ys)+min(ys))/2, (max(zs)+min(zs))/2)
print(f"[compare] BBox center: {center}")

bpy.context.view_layer.objects.active = mesh_obj
mesh_obj.select_set(True)

clear_cameras_lights()
add_sun()
setup_render()

# ------ BEFORE ------
print("[compare] Rendering BEFORE views...")
render_views('before', mesh_obj, center)
print(f"[compare] BEFORE: verts={len(mesh_obj.data.vertices)}, polys={len(mesh_obj.data.polygons)}")

# ------ DECIMATE ------
bpy.ops.object.select_all(action='DESELECT')
mesh_obj.select_set(True)
bpy.context.view_layer.objects.active = mesh_obj

dec = mesh_obj.modifiers.new(name="Decimate", type='DECIMATE')
dec.ratio = ratio
dec.decimate_type = 'COLLAPSE'

with bpy.context.temp_override(active_object=mesh_obj, object=mesh_obj,
                                selected_objects=[mesh_obj]):
    bpy.ops.object.modifier_apply(modifier="Decimate")

print(f"[compare] AFTER decimate: verts={len(mesh_obj.data.vertices)}, polys={len(mesh_obj.data.polygons)}")

# Update center for post-decimate mesh
xs = [v.co.x for v in mesh_obj.data.vertices]
ys = [v.co.y for v in mesh_obj.data.vertices]
zs = [v.co.z for v in mesh_obj.data.vertices]
center = ((max(xs)+min(xs))/2, (max(ys)+min(ys))/2, (max(zs)+min(zs))/2)

# ------ AFTER ------
label = str(ratio).replace('.', 'p')
print(f"[compare] Rendering AFTER views (ratio={ratio})...")
render_views(f'after_{label}', mesh_obj, center)

print("[compare] Done. Compare:")
print(f"  /tmp/chef_hat_before_*.png  vs  /tmp/chef_hat_after_{label}_*.png")
