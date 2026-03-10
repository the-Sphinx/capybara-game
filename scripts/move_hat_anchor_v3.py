"""
Adjustments to hat_anchor:
  +Z nudge:  +0.005
  Tilt:       7 degrees toward capy's back (+Y in Blender)
              achieved by rotating tail around bone head, -7° on X axis
              (right-hand rule: negative X rotation tilts +Z toward +Y)

Run with: blender --background capy_idle.blend --python move_hat_anchor_v3.py
"""
import bpy
import math
import mathutils

BLEND_PATH = '/Users/gorkem/workspace/gorkem/capybara-game/assets/models/capy_idle.blend'
GLB_LOCAL  = '/Users/gorkem/workspace/gorkem/capybara-game/capy-village/public/capy_idle.glb'
BONE_NAME  = 'hat_anchor'

DZ         = 0.005
TILT_DEG   = 7.0          # degrees toward +Y (capy's back)
TILT_RAD   = math.radians(TILT_DEG)

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

# 1. Z nudge — move both head and tail
bone.head.z += DZ
bone.tail.z += DZ

# 2. Tilt toward back: rotate tail around bone head, -TILT_DEG on X axis
#    (negative = from +Z toward +Y = toward capy's back)
rot = mathutils.Matrix.Rotation(-TILT_RAD, 3, 'X')
direction = bone.tail - bone.head
bone.tail = bone.head + rot @ direction

print(f"After:  head={tuple(round(v,6) for v in bone.head)}")
print(f"        tail={tuple(round(v,6) for v in bone.tail)}")

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
