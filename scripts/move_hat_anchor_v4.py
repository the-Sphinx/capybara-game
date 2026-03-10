"""
Set hat_anchor to an ABSOLUTE tilt from vertical.
Recomputes tail from scratch so angles don't compound.

TILT_DEG = 30  (temporary test — change back to 7 once confirmed working)

Run with: blender --background capy_idle.blend --python move_hat_anchor_v4.py
"""
import bpy
import math
import mathutils

BLEND_PATH = '/Users/gorkem/workspace/gorkem/capybara-game/assets/models/capy_idle.blend'
GLB_LOCAL  = '/Users/gorkem/workspace/gorkem/capybara-game/capy-village/public/capy_idle.glb'
BONE_NAME  = 'hat_anchor'

TILT_DEG = 30.0   # ← change this to tune; 7 = final value, 30 = test

arm = next((o for o in bpy.data.objects if o.type == 'ARMATURE'), None)
if not arm:
    print("ERROR: no armature"); raise SystemExit(1)

bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='EDIT')

bone = arm.data.edit_bones.get(BONE_NAME)
if not bone:
    print(f"ERROR: '{BONE_NAME}' not found"); raise SystemExit(1)

print(f"Before: head={tuple(round(v,6) for v in bone.head)}")
print(f"        tail={tuple(round(v,6) for v in bone.tail)}")

bone_length = (bone.tail - bone.head).length

# Recompute tail: start from (0,0,1) upward, rotate -TILT_DEG around X
# (negative X rotation tilts +Z toward +Y = capy's back)
rot = mathutils.Matrix.Rotation(-math.radians(TILT_DEG), 3, 'X')
new_dir = rot @ mathutils.Vector((0.0, 0.0, 1.0))
bone.tail = bone.head + new_dir * bone_length

print(f"After:  head={tuple(round(v,6) for v in bone.head)}")
print(f"        tail={tuple(round(v,6) for v in bone.tail)}")
print(f"Tilt applied: {TILT_DEG}° toward back (+Y)")

bpy.ops.object.mode_set(mode='OBJECT')

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
