"""
Move hat_anchor bone:
  +Y = 75% of crown diameter  (toward capy's back, capy faces -Y)
  +Z = 15% of crown height

Crown measurements (from crown.glb):
  diameter = 0.455498
  height   = 0.219850

Offsets:
  dy = 0.75 * 0.455498 = 0.341624
  dz = 0.15 * 0.219850 = 0.032978

Run with: blender --background capy_idle.blend --python move_hat_anchor_v2.py
"""
import bpy

BLEND_PATH  = '/Users/gorkem/workspace/gorkem/capybara-game/assets/models/capy_idle.blend'
GLB_LOCAL   = '/Users/gorkem/workspace/gorkem/capybara-game/capy-village/public/capy_idle.glb'
BONE_NAME   = 'hat_anchor'

CROWN_DIAMETER = 0.455498
CROWN_HEIGHT   = 0.219850

DY = 0.75 * CROWN_DIAMETER   # +Y = toward back
DZ = 0.15 * CROWN_HEIGHT     # +Z = upward

print(f"Applying offsets: DY={DY:.6f}, DZ={DZ:.6f}")

# Find armature
arm = next((o for o in bpy.data.objects if o.type == 'ARMATURE'), None)
if arm is None:
    print("ERROR: No armature found."); raise SystemExit(1)

bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='EDIT')

bone = arm.data.edit_bones.get(BONE_NAME)
if bone is None:
    print(f"ERROR: Bone '{BONE_NAME}' not found.")
    print("Available:", [b.name for b in arm.data.edit_bones])
    bpy.ops.object.mode_set(mode='OBJECT')
    raise SystemExit(1)

print(f"Before: head={tuple(round(v,6) for v in bone.head)}")
bone.head.y += DY
bone.head.z += DZ
bone.tail.y += DY
bone.tail.z += DZ
print(f"After:  head={tuple(round(v,6) for v in bone.head)}")

bpy.ops.object.mode_set(mode='OBJECT')

# Save blend + export local GLB only (no push yet)
bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)
print(f"Saved: {BLEND_PATH}")

bpy.ops.export_scene.gltf(
    filepath=GLB_LOCAL,
    export_format='GLB',
    export_apply=True,
    export_normals=True,
    export_materials='EXPORT',
    export_cameras=False,
    export_lights=False,
)
print(f"Exported: {GLB_LOCAL}")
print("Done.")
