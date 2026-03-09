"""
add_capy_eyes.py
----------------
Adds eye_white_L/R and eye_dark_L/R sphere objects to capy_idle.blend.

Eye placement (measured from face surface raycast data):
  - Front face of head (front-facing, not side)
  - Z ≈ 0.90  (upper head, below ear bumps)
  - X ≈ ±0.26 (on the front face, not the side)
  - Y ≈ -1.13 (white, on actual front face surface Y≈-1.208 at that X/Z)
  - White sclera r=0.10, Dark pupil r=0.062

Run:
  /Applications/Blender.app/Contents/MacOS/Blender \\
    --background assets/models/capy_idle_backup.blend \\
    --python scripts/add_capy_eyes.py
"""

import bpy, math, mathutils, os

BLEND_PATH  = bpy.data.filepath
BLEND_DIR   = os.path.dirname(BLEND_PATH)
OUT_BLEND   = BLEND_PATH                         # overwrite in-place
ASSETS_GLB  = os.path.join(BLEND_DIR, "capy_idle.glb")
REPO_ROOT   = os.path.dirname(os.path.dirname(BLEND_DIR))
PUBLIC_GLB  = os.path.join(REPO_ROOT, "capy-village", "public", "capy_idle.glb")

# ---------------------------------------------------------------------------
# Eye geometry parameters
# ---------------------------------------------------------------------------
EYE_WHITE_R = 0.10
EYE_DARK_R  = 0.062

# Right-eye world positions (left eye mirrors X)
EYE_X       = 0.26
EYE_Z       = 0.90
WHITE_Y     = -1.13
DARK_Y      = WHITE_Y - EYE_WHITE_R * 0.85   # sits on front surface of white sphere

# ---------------------------------------------------------------------------
# 0. Remove any existing eye objects from a previous run
# ---------------------------------------------------------------------------
for name in ('eye_white_L', 'eye_white_R', 'eye_dark_L', 'eye_dark_R'):
    obj = bpy.data.objects.get(name)
    if obj:
        bpy.data.objects.remove(obj, do_unlink=True)
        print(f"[eyes] Removed existing '{name}'")

# ---------------------------------------------------------------------------
# 1. Materials
# ---------------------------------------------------------------------------
def get_or_create_mat(name, color_linear, roughness=0.3, metalness=0.0):
    mat = bpy.data.materials.get(name)
    if mat:
        return mat
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    if bsdf:
        bsdf.inputs['Base Color'].default_value = (*color_linear, 1.0)
        bsdf.inputs['Roughness'].default_value   = roughness
        bsdf.inputs['Metallic'].default_value    = metalness
    return mat

mat_white = get_or_create_mat('mat_eye_white', (0.880, 0.850, 0.820), roughness=0.25)
mat_dark  = get_or_create_mat('mat_eye_dark',  (0.020, 0.020, 0.025), roughness=0.05)

# ---------------------------------------------------------------------------
# 2. Helper: create one eye sphere
# ---------------------------------------------------------------------------
def make_eye(name, x, y, z, radius, mat):
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=radius, location=(0, 0, 0),
        segments=16, ring_count=12
    )
    obj = bpy.context.active_object
    obj.name      = name
    obj.data.name = name
    obj.location  = (x, y, z)
    bpy.ops.object.transform_apply(location=True, scale=True, rotation=True)

    # Shade smooth
    bpy.ops.object.shade_smooth()

    # Material
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)

    print(f"[eyes] Created '{name}'  loc=({x:.3f},{y:.3f},{z:.3f})  r={radius}")
    return obj

# Right side
ew_R = make_eye('eye_white_R',  EYE_X, WHITE_Y, EYE_Z, EYE_WHITE_R, mat_white)
ed_R = make_eye('eye_dark_R',   EYE_X, DARK_Y,  EYE_Z, EYE_DARK_R,  mat_dark)

# Left side (mirror X)
ew_L = make_eye('eye_white_L', -EYE_X, WHITE_Y, EYE_Z, EYE_WHITE_R, mat_white)
ed_L = make_eye('eye_dark_L',  -EYE_X, DARK_Y,  EYE_Z, EYE_DARK_R,  mat_dark)

print(f"[eyes] Dark Y = {DARK_Y:.4f}  (white front surface = {WHITE_Y - EYE_WHITE_R:.4f})")

# ---------------------------------------------------------------------------
# 3. Render before/after comparison
# ---------------------------------------------------------------------------
def setup_scene_for_render():
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.resolution_x = 600
    scene.render.resolution_y = 600
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    world = bpy.data.worlds.get('World') or bpy.data.worlds.new('World')
    world.use_nodes = True
    bg = world.node_tree.nodes.get('Background')
    if bg: bg.inputs[0].default_value = (0.85, 0.85, 0.85, 1)
    scene.world = world

def clear_cameras_lights():
    for o in list(bpy.data.objects):
        if o.type in ('CAMERA', 'LIGHT'):
            bpy.data.objects.remove(o, do_unlink=True)

def render_views(prefix):
    scene = bpy.context.scene
    # Target: center of face area (eyes at Z=0.90, Y≈-1.13)
    target = mathutils.Vector((0, -1.00, 0.90))

    views = {
        'front': mathutils.Vector((0,    -3.2, 0.90)),
        '3q':    mathutils.Vector((-2.0, -2.8, 1.00)),
        'side':  mathutils.Vector((-3.0, -0.5, 0.90)),
    }
    for name, cam_pos in views.items():
        bpy.ops.object.camera_add(location=cam_pos)
        cam = bpy.context.active_object
        cam.data.lens = 85
        direction = (target - cam_pos).normalized()
        cam.rotation_euler = direction.to_track_quat('-Z', 'Z').to_euler()
        scene.camera = cam
        scene.render.filepath = f'/tmp/capy_eyes_{prefix}_{name}.png'
        bpy.ops.render.render(write_still=True)
        bpy.data.objects.remove(cam, do_unlink=True)
        print(f"[eyes] Saved /tmp/capy_eyes_{prefix}_{name}.png")

setup_scene_for_render()
clear_cameras_lights()

# Sun light
bpy.ops.object.light_add(type='SUN', location=(-1, -4, 5))
sun = bpy.context.active_object
sun.data.energy = 3
sun.rotation_euler = (math.radians(50), 0, math.radians(-15))

# Render AFTER (eyes added)
print("[eyes] Rendering AFTER views...")
render_views('after')

# ---------------------------------------------------------------------------
# 4. Save blend + export GLB
# ---------------------------------------------------------------------------
bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)
print(f"[eyes] Saved blend: {OUT_BLEND}")

bpy.ops.object.select_all(action='SELECT')
for export_path in (ASSETS_GLB, PUBLIC_GLB):
    os.makedirs(os.path.dirname(export_path), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=export_path,
        export_format='GLB',
        export_apply=True,
        export_normals=True,
        export_materials='EXPORT',
        export_cameras=False,
        export_lights=False,
    )
    print(f"[eyes] Exported: {export_path}")

print("[eyes] Done.")
