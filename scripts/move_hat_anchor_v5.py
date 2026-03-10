"""
Reset hat_anchor bone tilt back to vertical (0 degrees).
Head position is kept exactly as-is (from v3 — the good position).
Tilt will be handled in Three.js config, not the bone.

Run with: blender --background capy_idle.blend --python move_hat_anchor_v5.py
"""
import bpy
import mathutils

BLEND_PATH = '/Users/gorkem/workspace/gorkem/capybara-game/assets/models/capy_idle.blend'
GLB_LOCAL  = '/Users/gorkem/workspace/gorkem/capybara-game/capy-village/public/capy_idle.glb'
BONE_NAME  = 'hat_anchor'

arm = next((o for o in bpy.data.objects if o.type == 'ARMATURE'), None)
if not arm:
    print("ERROR: no armature"); raise SystemExit(1)

bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='EDIT')

bone = arm.data.edit_bones.get(BONE_NAME)
if not bone:
    print(f"ERROR: '{BONE_NAME}' not found"); raise SystemExit(1)

bone_length = (bone.tail - bone.head).length
print(f"Before: head={tuple(round(v,6) for v in bone.head)}, tail={tuple(round(v,6) for v in bone.tail)}")

# Reset tail to be directly above head (pure +Z, no tilt)
bone.tail = bone.head + mathutils.Vector((0.0, 0.0, 1.0)) * bone_length

print(f"After:  head={tuple(round(v,6) for v in bone.head)}, tail={tuple(round(v,6) for v in bone.tail)}")

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
