"""
process_chef_hat.py
-------------------
Blender headless script — decimate, fix geometry origin, and export chef_hat.

Run:
  /Applications/Blender.app/Contents/MacOS/Blender \
    --background assets/models/chef_hat_original.blend \
    --python scripts/process_chef_hat.py

Target crown standard:
  - Object transforms: location/scale/rotation all identity
  - Vertex Z_min ≈ 0.0  (brim at mount point)
  - Vertex X/Y centered ≈ 0
  - Outer X diameter ≈ 0.4555  (matches crown)
"""

import bpy
import bmesh
import os

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BLEND_PATH    = bpy.data.filepath          # opened by --background
BLEND_DIR     = os.path.dirname(BLEND_PATH)

# Output: overwrite chef_hat.blend (not the _original backup)
OUT_BLEND     = os.path.join(BLEND_DIR, "chef_hat.blend")
ASSETS_GLB    = os.path.join(BLEND_DIR, "chef_hat.glb")

# capy-village/public — two levels up from assets/models
REPO_ROOT     = os.path.dirname(os.path.dirname(BLEND_DIR))
PUBLIC_GLB    = os.path.join(REPO_ROOT, "capy-village", "public", "chef_hat.glb")

TARGET_DIAMETER = 0.4555   # match crown outer X diameter
DECIMATE_RATIO  = 0.25     # 52515 faces × 0.25 ≈ 13127 target faces → ~6581 verts
                           # 0.15 (3956v) caused visible hat-band faceting; 0.25 preserves shape

# ---------------------------------------------------------------------------
# 1. Find the chef hat mesh object
# ---------------------------------------------------------------------------
mesh_obj = None
for obj in bpy.data.objects:
    if obj.type == 'MESH':
        mesh_obj = obj
        break

if mesh_obj is None:
    raise RuntimeError("No MESH object found in blend file")

print(f"[chef_hat] Found mesh: '{mesh_obj.name}'")
print(f"[chef_hat] Vertices before decimate: {len(mesh_obj.data.vertices)}")
print(f"[chef_hat] Polygons before decimate: {len(mesh_obj.data.polygons)}")

bpy.context.view_layer.objects.active = mesh_obj
mesh_obj.select_set(True)
bpy.ops.object.select_all(action='DESELECT')
mesh_obj.select_set(True)
bpy.context.view_layer.objects.active = mesh_obj

# ---------------------------------------------------------------------------
# 2. Decimate — apply via temp_override (Blender 3.2+ / 4.x headless-safe)
# ---------------------------------------------------------------------------
dec = mesh_obj.modifiers.new(name="Decimate", type='DECIMATE')
dec.ratio = DECIMATE_RATIO
dec.decimate_type = 'COLLAPSE'

with bpy.context.temp_override(active_object=mesh_obj, object=mesh_obj,
                                selected_objects=[mesh_obj]):
    bpy.ops.object.modifier_apply(modifier="Decimate")

print(f"[chef_hat] Vertices after decimate: {len(mesh_obj.data.vertices)}")
print(f"[chef_hat] Polygons after decimate: {len(mesh_obj.data.polygons)}")

# ---------------------------------------------------------------------------
# 3. Measure current vertex extents
#    (object transforms are identity → vertex coords = world coords)
# ---------------------------------------------------------------------------
verts      = mesh_obj.data.vertices
xs         = [v.co.x for v in verts]
ys         = [v.co.y for v in verts]
zs         = [v.co.z for v in verts]

z_min      = min(zs)
z_max      = max(zs)
x_min, x_max = min(xs), max(xs)
y_min, y_max = min(ys), max(ys)
x_diameter = x_max - x_min

print(f"[chef_hat] Z range before fix : [{z_min:.4f}, {z_max:.4f}]")
print(f"[chef_hat] X diameter before  : {x_diameter:.4f}")
print(f"[chef_hat] X center before    : {(x_max+x_min)/2:.4f}")
print(f"[chef_hat] Y center before    : {(y_max+y_min)/2:.4f}")

# ---------------------------------------------------------------------------
# 4. Transform vertices in-place via bmesh
#    a) shift Z so brim sits at Z=0
#    b) uniform scale so outer X diameter = TARGET_DIAMETER
# ---------------------------------------------------------------------------
bm = bmesh.new()
bm.from_mesh(mesh_obj.data)

scale_factor = TARGET_DIAMETER / x_diameter

for v in bm.verts:
    v.co.z -= z_min           # brim → Z=0
    v.co.x *= scale_factor
    v.co.y *= scale_factor
    v.co.z *= scale_factor

bm.to_mesh(mesh_obj.data)
bm.free()
mesh_obj.data.update()

# ---------------------------------------------------------------------------
# 5. Recalculate normals
# ---------------------------------------------------------------------------
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.normals_make_consistent(inside=False)
bpy.ops.object.mode_set(mode='OBJECT')

# ---------------------------------------------------------------------------
# 6. Verify final state
# ---------------------------------------------------------------------------
verts2 = mesh_obj.data.vertices
xs2 = [v.co.x for v in verts2]
ys2 = [v.co.y for v in verts2]
zs2 = [v.co.z for v in verts2]

print(f"\n[chef_hat] ---- FINAL VERIFICATION ----")
print(f"[chef_hat] Vertex count : {len(verts2)}")
print(f"[chef_hat] Polygon count: {len(mesh_obj.data.polygons)}")
print(f"[chef_hat] Z range      : [{min(zs2):.4f}, {max(zs2):.4f}]")
print(f"[chef_hat] X diameter   : {max(xs2)-min(xs2):.4f}")
print(f"[chef_hat] Y diameter   : {max(ys2)-min(ys2):.4f}")
print(f"[chef_hat] X center     : {(max(xs2)+min(xs2))/2:.4f}")
print(f"[chef_hat] Y center     : {(max(ys2)+min(ys2))/2:.4f}")
print(f"[chef_hat] Obj location : {list(mesh_obj.location)}")
print(f"[chef_hat] Obj scale    : {list(mesh_obj.scale)}")
print(f"[chef_hat] Obj rotation : {list(mesh_obj.rotation_euler)}")

# ---------------------------------------------------------------------------
# 7. Save processed blend (as chef_hat.blend, not the _original backup)
# ---------------------------------------------------------------------------
bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)
print(f"\n[chef_hat] Saved .blend: {OUT_BLEND}")

# ---------------------------------------------------------------------------
# 8. Export GLB — assets/models/chef_hat.glb
# ---------------------------------------------------------------------------
bpy.ops.export_scene.gltf(
    filepath=ASSETS_GLB,
    export_format='GLB',
    export_apply=True,
    export_normals=True,
    export_materials='EXPORT',
    export_cameras=False,
    export_lights=False,
)
print(f"[chef_hat] Exported GLB: {ASSETS_GLB}")

# ---------------------------------------------------------------------------
# 9. Export GLB — capy-village/public/chef_hat.glb
# ---------------------------------------------------------------------------
os.makedirs(os.path.dirname(PUBLIC_GLB), exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=PUBLIC_GLB,
    export_format='GLB',
    export_apply=True,
    export_normals=True,
    export_materials='EXPORT',
    export_cameras=False,
    export_lights=False,
)
print(f"[chef_hat] Exported GLB: {PUBLIC_GLB}")
print("[chef_hat] Done.")
