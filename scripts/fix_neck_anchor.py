"""
fix_neck_anchor.py
------------------
Opens capy_idle_with_eyes.blend, sets (or creates) the neck_anchor bone
at local Z=0.93 (≈ Three.js world Y 1.04 — just below the head, at collar level),
then exports capy_idle.glb.

Bone coordinate formula:
  Three.js world_Y = -0.6411 + armature_local_Z + 0.748
  → Z=1.249 (hat_anchor) → world_Y ≈ 1.356  (head top)
  → Z=0.93  (neck_anchor) → world_Y ≈ 1.037  (collar, below head)

Run:
  /Applications/Blender.app/Contents/MacOS/Blender \\
    --background assets/models/capy_idle_with_eyes.blend \\
    --python scripts/fix_neck_anchor.py
"""

import bpy
import os

# ── Paths ─────────────────────────────────────────────────────────────────────
BLEND_PATH  = bpy.data.filepath
BLEND_DIR   = os.path.dirname(BLEND_PATH)
REPO_ROOT   = os.path.dirname(os.path.dirname(BLEND_DIR))
if not os.path.isdir(os.path.join(REPO_ROOT, 'capy-village')):
    REPO_ROOT = '/Users/gorkem/workspace/gorkem/capybara-game'

OUT_BLEND  = os.path.join(BLEND_DIR, 'capy_idle_with_eyes.blend')
ASSETS_GLB = os.path.join(REPO_ROOT, 'assets', 'models', 'capy_idle.glb')
PUBLIC_GLB = os.path.join(REPO_ROOT, 'capy-village', 'public', 'capy_idle.glb')

# Target neck_anchor position (armature local space, Blender coords)
# hat_anchor is at Z=1.249, Y=-0.661 (Three.js Y=1.354, Z=0.397).
# We use Z=1.00, Y=-0.60 → Three.js Y=1.105 (25cm below hat) and Z=0.336
# (7cm in front of the body's front surface, similar to hat_anchor convention).
# This makes the ring clearly visible in front of the capy's neck area.
NECK_HEAD = (0.0, -0.60, 0.75)    # collar level: Three.js Y≈0.855 (below chin)
NECK_TAIL = (0.0, -0.60, 0.65)    # 10 cm below (defines bone direction)

print(f"[neck] Blend: {BLEND_PATH}")
print(f"[neck] Repo root: {REPO_ROOT}")

# ── Find armature ─────────────────────────────────────────────────────────────
arm = next((o for o in bpy.data.objects if o.type == 'ARMATURE'), None)
if arm is None:
    raise RuntimeError("No ARMATURE found in scene")
print(f"[neck] Armature: '{arm.name}'")

# ── Enter Edit Mode ───────────────────────────────────────────────────────────
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='EDIT')

# ── Get or create neck_anchor bone ───────────────────────────────────────────
if 'neck_anchor' in arm.data.edit_bones:
    bone = arm.data.edit_bones['neck_anchor']
    print(f"[neck] neck_anchor exists — current head={tuple(round(v,4) for v in bone.head)}")
else:
    bone = arm.data.edit_bones.new('neck_anchor')
    print("[neck] Created new neck_anchor bone")

# ── Set position ──────────────────────────────────────────────────────────────
bone.head = NECK_HEAD
bone.tail = NECK_TAIL
print(f"[neck] neck_anchor set → head={NECK_HEAD}  tail={NECK_TAIL}")

# ── Exit Edit Mode ────────────────────────────────────────────────────────────
bpy.ops.object.mode_set(mode='OBJECT')

# ── Save blend ────────────────────────────────────────────────────────────────
bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)
print(f"[neck] Saved blend: {OUT_BLEND}")

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
    print(f"[neck] Exported: {export_path}  ({size_kb:.1f} KB)")

print("[neck] Done.")
