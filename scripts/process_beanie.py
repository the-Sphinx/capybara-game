"""
process_beanie.py
-----------------
Blender headless script — decimate, separate pom-pom, fix geometry, export.

Run:
  /Applications/Blender.app/Contents/MacOS/Blender \
    --background assets/models/knit_beanie_original.blend \
    --python scripts/process_beanie.py

Decisions (all Z coords are in ORIGINAL/pre-transform space unless stated):
  - Decimate ratio 0.02  → ~8197 verts (0.012 rejected: pom-pom crystal-faceted)
  - Pompom classification: Z_center > 0.25 (more robust than Z_min; gap in data is huge)
  - Pompom trim: strip verts with Z < 0.25 from pompom set — removes the overlap zone
    where pompom strands dip inside the body and show white through yarn gaps
  - Hidden body bottom: body components with Z_max < -0.30 removed entirely
    (these are fully inside capy's head and not visible)
  - Output objects: 'beanie_body', 'beanie_pompom'
"""

import bpy
import bmesh
import os

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BLEND_PATH = bpy.data.filepath
BLEND_DIR  = os.path.dirname(BLEND_PATH)
OUT_BLEND  = os.path.join(BLEND_DIR, "knit_beanie.blend")
ASSETS_GLB = os.path.join(BLEND_DIR, "knit_beanie.glb")
REPO_ROOT  = os.path.dirname(os.path.dirname(BLEND_DIR))
PUBLIC_GLB = os.path.join(REPO_ROOT, "capy-village", "public", "knit_beanie.glb")

DECIMATE_RATIO         = 0.02
TARGET_DIAMETER        = 0.4555
POMPOM_Z_CENTER_THRESH = 0.25   # all 4 pompom strand components → white
# Overlap at base is handled in Three.js via polygonOffset on body material

# ---------------------------------------------------------------------------
# 1. Get mesh object
# ---------------------------------------------------------------------------
src = next((o for o in bpy.data.objects if o.type == 'MESH'), None)
if not src:
    raise RuntimeError("No MESH found")

print(f"[beanie] Source '{src.name}'  verts={len(src.data.vertices)}")

bpy.ops.object.select_all(action='DESELECT')
src.select_set(True)
bpy.context.view_layer.objects.active = src

# ---------------------------------------------------------------------------
# 2. Decimate
# ---------------------------------------------------------------------------
dec = src.modifiers.new(name="Decimate", type='DECIMATE')
dec.ratio = DECIMATE_RATIO
dec.decimate_type = 'COLLAPSE'
with bpy.context.temp_override(active_object=src, object=src, selected_objects=[src]):
    bpy.ops.object.modifier_apply(modifier="Decimate")

print(f"[beanie] After decimate: verts={len(src.data.vertices)}  polys={len(src.data.polygons)}")

# ---------------------------------------------------------------------------
# 3. Find connected components and classify each
# ---------------------------------------------------------------------------
bm = bmesh.new()
bm.from_mesh(src.data)
bm.verts.ensure_lookup_table()

visited = set()
components = []  # list of lists of vert indices

for start in bm.verts:
    if start.index in visited:
        continue
    queue = [start]
    comp = []
    while queue:
        v = queue.pop()
        if v.index in visited:
            continue
        visited.add(v.index)
        comp.append(v.index)
        for edge in v.link_edges:
            ov = edge.other_vert(v)
            if ov.index not in visited:
                queue.append(ov)
    components.append(comp)

print(f"[beanie] Components after decimate: {len(components)}")

pompom_vert_indices = set()
body_vert_indices   = set()
hidden_count        = 0

for comp in components:
    zs = [bm.verts[i].co.z for i in comp]
    z_min, z_max = min(zs), max(zs)
    z_center = (z_min + z_max) / 2

    if z_center > POMPOM_Z_CENTER_THRESH:
        pompom_vert_indices.update(comp)
    else:
        body_vert_indices.update(comp)

print(f"[beanie] body={len(body_vert_indices)}  pompom={len(pompom_vert_indices)}")

bm.free()

# ---------------------------------------------------------------------------
# 4. Extract two submesh objects
# ---------------------------------------------------------------------------
orig_mesh = src.data

def extract_submesh(vert_set, name):
    new_mesh = bpy.data.meshes.new(name)
    new_obj  = bpy.data.objects.new(name, new_mesh)
    bpy.context.collection.objects.link(new_obj)

    bm2 = bmesh.new()
    bm2.from_mesh(orig_mesh)
    bm2.verts.ensure_lookup_table()
    bm2.faces.ensure_lookup_table()

    faces_to_remove = [f for f in bm2.faces
                       if not all(v.index in vert_set for v in f.verts)]
    bmesh.ops.delete(bm2, geom=faces_to_remove, context='FACES')

    orphans = [v for v in bm2.verts if not v.link_faces]
    bmesh.ops.delete(bm2, geom=orphans, context='VERTS')

    bm2.to_mesh(new_mesh)
    bm2.free()
    new_mesh.update()
    print(f"[beanie] '{name}': verts={len(new_mesh.vertices)}  polys={len(new_mesh.polygons)}")
    return new_obj

body_obj   = extract_submesh(body_vert_indices,   'beanie_body')
pompom_obj = extract_submesh(pompom_vert_indices, 'beanie_pompom')

bpy.data.objects.remove(src, do_unlink=True)

# ---------------------------------------------------------------------------
# 5. Measure bounding box and apply Z shift + uniform scale
# ---------------------------------------------------------------------------
all_x, all_y, all_z = [], [], []
for obj in (body_obj, pompom_obj):
    for v in obj.data.vertices:
        all_x.append(v.co.x)
        all_y.append(v.co.y)
        all_z.append(v.co.z)

z_min      = min(all_z)
x_diameter = max(all_x) - min(all_x)
scale_f    = TARGET_DIAMETER / x_diameter

print(f"[beanie] Transform: z_min={z_min:.4f}  x_diam={x_diameter:.4f}  scale={scale_f:.4f}")

def transform_obj(obj, z_shift, scale):
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    for v in bm.verts:
        v.co.z -= z_shift
        v.co.x *= scale
        v.co.y *= scale
        v.co.z *= scale
    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()

transform_obj(body_obj,   z_min, scale_f)
transform_obj(pompom_obj, z_min, scale_f)

body_z_max   = max(v.co.z for v in body_obj.data.vertices)
pompom_z_min = min(v.co.z for v in pompom_obj.data.vertices)
print(f"[beanie] body_z_max={body_z_max:.4f}  pompom_z_min={pompom_z_min:.4f}")

# Recalculate normals
for obj in (body_obj, pompom_obj):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode='OBJECT')
    obj.select_set(False)

# ---------------------------------------------------------------------------
# 6. Verify
# ---------------------------------------------------------------------------
print(f"\n[beanie] ---- FINAL VERIFICATION ----")
total_verts = 0
for obj in (body_obj, pompom_obj):
    xs = [v.co.x for v in obj.data.vertices]
    ys = [v.co.y for v in obj.data.vertices]
    zs = [v.co.z for v in obj.data.vertices]
    total_verts += len(obj.data.vertices)
    print(f"[beanie] '{obj.name}': verts={len(obj.data.vertices)}  polys={len(obj.data.polygons)}")
    print(f"[beanie]   Z=[{min(zs):.4f},{max(zs):.4f}]  X_diam={max(xs)-min(xs):.4f}")
print(f"[beanie] Total verts: {total_verts}")

# ---------------------------------------------------------------------------
# 7. Save + export
# ---------------------------------------------------------------------------
bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)
print(f"\n[beanie] Saved: {OUT_BLEND}")

bpy.ops.object.select_all(action='SELECT')

bpy.ops.export_scene.gltf(
    filepath=ASSETS_GLB,
    export_format='GLB',
    export_apply=True, export_normals=True,
    export_materials='EXPORT',
    export_cameras=False, export_lights=False,
)
print(f"[beanie] Exported: {ASSETS_GLB}")

os.makedirs(os.path.dirname(PUBLIC_GLB), exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=PUBLIC_GLB,
    export_format='GLB',
    export_apply=True, export_normals=True,
    export_materials='EXPORT',
    export_cameras=False, export_lights=False,
)
print(f"[beanie] Exported: {PUBLIC_GLB}")
print("[beanie] Done.")
