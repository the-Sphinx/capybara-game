"""
add_capy_eyes.py
----------------
Adds eye geometry (white sclera + dark pupil) to capy_idle.blend by
joining UV spheres into the existing capy_mesh so they deform with the
head bone via the armature modifier.

Eye positions are in capy_mesh LOCAL space (same coordinate space used
by the original mesh vertices and raycasts).

Run:
  /Applications/Blender.app/Contents/MacOS/Blender \\
    --background assets/models/capy_idle_backup.blend \\
    --python scripts/add_capy_eyes.py
"""

import bpy, math, mathutils, os

BLEND_PATH = bpy.data.filepath
BLEND_DIR  = os.path.dirname(BLEND_PATH)
# Save result as capy_idle.blend (not backup)
BLEND_DIR_PARENT = BLEND_DIR
OUT_BLEND  = os.path.join(BLEND_DIR, "capy_idle.blend")
ASSETS_GLB = os.path.join(BLEND_DIR, "capy_idle.glb")
REPO_ROOT  = os.path.dirname(os.path.dirname(BLEND_DIR))
PUBLIC_GLB = os.path.join(REPO_ROOT, "capy-village", "public", "capy_idle.glb")

# ---------------------------------------------------------------------------
# Eye geometry parameters (capy_mesh LOCAL space)
# ---------------------------------------------------------------------------
EYE_WHITE_R = 0.10
EYE_DARK_R  = 0.062

EYE_X   = 0.26
EYE_Z   = 0.90
WHITE_Y = -1.13
DARK_Y  = WHITE_Y - EYE_WHITE_R * 0.85   # sits on front surface of white sphere

# ---------------------------------------------------------------------------
# 0. Clean up any existing eye objects from previous runs
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

# Body fur material (slot 0) — Three.js overrides this with furMaterial
mat_fur   = get_or_create_mat('mat_fur',       (0.766, 0.486, 0.404), roughness=0.9)
mat_white = get_or_create_mat('mat_eye_white', (0.880, 0.850, 0.820), roughness=0.25)
mat_dark  = get_or_create_mat('mat_eye_dark',  (0.020, 0.020, 0.025), roughness=0.05)

# ---------------------------------------------------------------------------
# 2. Ensure capy_mesh has mat_fur as its first material slot
#    (so body faces don't inherit an eye material after the join)
# ---------------------------------------------------------------------------
capy_mesh = bpy.data.objects.get('capy_mesh')
if capy_mesh is None:
    raise RuntimeError("capy_mesh object not found in scene")

if len(capy_mesh.material_slots) == 0:
    capy_mesh.data.materials.append(mat_fur)
    print("[eyes] Added mat_fur as slot 0 to capy_mesh")
elif capy_mesh.material_slots[0].material != mat_fur:
    capy_mesh.material_slots[0].material = mat_fur
    print("[eyes] Set mat_fur as slot 0 on capy_mesh")

# ---------------------------------------------------------------------------
# 3. Helper: create one eye sphere in capy_mesh LOCAL space
# ---------------------------------------------------------------------------
def make_eye(name, x, y, z, radius, mat):
    """Create a UV sphere at the given LOCAL-space position."""
    # Compute world position: capy_mesh has identity world matrix so local = world
    world_pos = capy_mesh.matrix_world @ mathutils.Vector((x, y, z))

    bpy.ops.object.select_all(action='DESELECT')
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=radius, location=world_pos,
        segments=16, ring_count=12
    )
    obj = bpy.context.active_object
    obj.name      = name
    obj.data.name = name
    bpy.ops.object.transform_apply(location=True, scale=True, rotation=True)
    bpy.ops.object.shade_smooth()

    # Assign the eye material
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)

    # Assign ALL vertices to 'head' vertex group so armature deforms them
    vg = obj.vertex_groups.new(name='head')
    all_verts = [v.index for v in obj.data.vertices]
    vg.add(all_verts, 1.0, 'REPLACE')
    print(f"[eyes] Created '{name}' at world {tuple(round(v,3) for v in world_pos)}  r={radius}  verts={len(all_verts)}")
    return obj

# Right side
ew_R = make_eye('eye_white_R',  EYE_X, WHITE_Y, EYE_Z, EYE_WHITE_R, mat_white)
ed_R = make_eye('eye_dark_R',   EYE_X, DARK_Y,  EYE_Z, EYE_DARK_R,  mat_dark)
# Left side (mirror X)
ew_L = make_eye('eye_white_L', -EYE_X, WHITE_Y, EYE_Z, EYE_WHITE_R, mat_white)
ed_L = make_eye('eye_dark_L',  -EYE_X, DARK_Y,  EYE_Z, EYE_DARK_R,  mat_dark)

print(f"[eyes] DARK_Y={DARK_Y:.4f}")

# ---------------------------------------------------------------------------
# 4. Join eye spheres into capy_mesh
#    The eye materials become additional slots; vertices carry head vgroup.
# ---------------------------------------------------------------------------
bpy.ops.object.select_all(action='DESELECT')
for obj in (ew_R, ed_R, ew_L, ed_L, capy_mesh):
    obj.select_set(True)
bpy.context.view_layer.objects.active = capy_mesh
bpy.ops.object.join()
print("[eyes] Joined eye objects into capy_mesh")

# Verify
capy_mesh = bpy.data.objects.get('capy_mesh')
vcount = len(capy_mesh.data.vertices)
mats   = [ms.material.name if ms.material else 'None' for ms in capy_mesh.material_slots]
print(f"[eyes] Final capy_mesh: {vcount} verts, material slots: {mats}")
vg_names = [vg.name for vg in capy_mesh.vertex_groups]
print(f"[eyes] Vertex groups: {vg_names}")

# ---------------------------------------------------------------------------
# 5. Render verification (after-join front + 3/4 views)
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
    if bg:
        bg.inputs[0].default_value = (0.85, 0.85, 0.85, 1)
    scene.world = world

def clear_cameras_lights():
    for o in list(bpy.data.objects):
        if o.type in ('CAMERA', 'LIGHT'):
            bpy.data.objects.remove(o, do_unlink=True)

def render_views(prefix):
    scene  = bpy.context.scene
    target = mathutils.Vector((0, -1.00, 0.90))
    views  = {
        'front': mathutils.Vector((0,    -3.2, 0.90)),
        '3q':    mathutils.Vector((-2.0, -2.8, 1.00)),
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
        print(f"[eyes] Rendered: /tmp/capy_eyes_{prefix}_{name}.png")

setup_scene_for_render()
clear_cameras_lights()
bpy.ops.object.light_add(type='SUN', location=(-1, -4, 5))
sun = bpy.context.active_object
sun.data.energy = 3
sun.rotation_euler = (math.radians(50), 0, math.radians(-15))
render_views('joined')

# ---------------------------------------------------------------------------
# 6. Save blend + export GLB
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
