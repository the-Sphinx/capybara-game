"""
process_neck_scarf.py
---------------------
Exports assets/models/scarf.blend → neck_scarf.glb
The scarf geometry already has the correct orientation (hole along Blender Z-axis,
which becomes Three.js Y after GLB export — ideal for a neck collar).

The original mesh is 1.0m × 0.84m × 0.86m — too large at scale=1.0 (full capy height).
We scale it to 0.35× in Blender, baking the transform, so it appears as a proper
collar (0.30m tall, 0.35m wide) when loaded in Three.js with scale=1.0.

Run:
  /Applications/Blender.app/Contents/MacOS/Blender \\
    --background assets/models/scarf.blend \\
    --python scripts/process_neck_scarf.py
"""

import bpy
import os

# ── Paths ────────────────────────────────────────────────────────────────────
BLEND_PATH = bpy.data.filepath                                # scarf.blend
REPO_ROOT  = os.path.dirname(os.path.dirname(os.path.dirname(BLEND_PATH)))
# Fallback in case the blend is opened relative to CWD
if not os.path.isdir(os.path.join(REPO_ROOT, 'capy-village')):
    REPO_ROOT = '/Users/gorkem/workspace/gorkem/capybara-game'

ASSETS_GLB = os.path.join(REPO_ROOT, 'assets', 'models', 'neck_scarf.glb')
PUBLIC_GLB = os.path.join(REPO_ROOT, 'capy-village', 'public', 'neck_scarf.glb')

print(f"[scarf] Blend: {BLEND_PATH}")
print(f"[scarf] Repo root: {REPO_ROOT}")

# ── Find the scarf mesh (largest mesh by vertex count, skips any stray primitives) ──
mesh_obj = max(
    (o for o in bpy.data.objects if o.type == 'MESH'),
    key=lambda o: len(o.data.vertices),
    default=None
)

if mesh_obj is None:
    raise RuntimeError("No MESH object found in scarf.blend")

print(f"[scarf] Found mesh: '{mesh_obj.name}' ({len(mesh_obj.data.vertices)} verts)")

# ── Rename object + mesh data ─────────────────────────────────────────────────
mesh_obj.name      = 'neck_scarf'
mesh_obj.data.name = 'neck_scarf'
print(f"[scarf] Renamed to 'neck_scarf'")

# ── Center at origin, rotate so hole axis = Blender Z → Three.js Y (vertical) ──
import math
bpy.ops.object.select_all(action='DESELECT')
mesh_obj.select_set(True)
bpy.context.view_layer.objects.active = mesh_obj
# Move to origin so vertices are centered — mount positions it via neck_anchor bone
mesh_obj.location = (0.0, 0.0, 0.0)
# Scarf hole is along Blender Y. Rotate +90° around Blender X to move hole to Blender Z.
# After GLB export: Blender Z → Three.js Y → collar lies horizontal (flat around neck).
mesh_obj.rotation_euler.x += math.radians(90)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
print(f"[scarf] Centered at origin, rotated 90° around X (hole now vertical), applied transforms")

# Scale down to collar size
COLLAR_SCALE = 0.55
mesh_obj.scale = (COLLAR_SCALE, COLLAR_SCALE, COLLAR_SCALE)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
print(f"[scarf] Scaled to {COLLAR_SCALE}× and baked transforms")

# ── Set material to double-sided so GLB exports with doubleSided:true ─────────
for mat in mesh_obj.data.materials:
    if mat:
        mat.use_backface_culling = False
print(f"[scarf] Set material to double-sided (no backface culling)")

# ── Print geometry summary ────────────────────────────────────────────────────
verts  = len(mesh_obj.data.vertices)
polys  = len(mesh_obj.data.polygons)
bbox   = [mesh_obj.bound_box[i] for i in range(8)]
xs = [v[0] for v in bbox]; ys = [v[1] for v in bbox]; zs = [v[2] for v in bbox]
print(f"[scarf] Vertices: {verts}  Polygons: {polys}")
print(f"[scarf] X range: {min(xs):.4f} → {max(xs):.4f}  (span {max(xs)-min(xs):.4f} m)")
print(f"[scarf] Y range: {min(ys):.4f} → {max(ys):.4f}  (span {max(ys)-min(ys):.4f} m)")
print(f"[scarf] Z range: {min(zs):.4f} → {max(zs):.4f}  (span {max(zs)-min(zs):.4f} m)")

# ── Export GLB ────────────────────────────────────────────────────────────────
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
    size_kb = os.path.getsize(export_path) / 1024
    print(f"[scarf] Exported: {export_path}  ({size_kb:.1f} KB)")

print("[scarf] Done.")
