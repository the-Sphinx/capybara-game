"""
Nudge hat_anchor bone head +0.005 in Z. Tail moves with it.
Run with: blender --background capy_idle.blend --python move_hat_anchor_v6.py
"""
import bpy

BLEND_PATH = '/Users/gorkem/workspace/gorkem/capybara-game/assets/models/capy_idle.blend'
GLB_LOCAL  = '/Users/gorkem/workspace/gorkem/capybara-game/capy-village/public/capy_idle.glb'
BONE_NAME  = 'hat_anchor'

arm = next((o for o in bpy.data.objects if o.type == 'ARMATURE'), None)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='EDIT')

bone = arm.data.edit_bones[BONE_NAME]
print(f"Before: head Z={bone.head.z:.6f}")
bone.head.z += 0.005
bone.tail.z += 0.005
print(f"After:  head Z={bone.head.z:.6f}")

bpy.ops.object.mode_set(mode='OBJECT')
bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)
bpy.ops.export_scene.gltf(
    filepath=GLB_LOCAL, export_format='GLB',
    export_apply=True, export_normals=True,
    export_materials='EXPORT', export_cameras=False, export_lights=False,
)
print("Done.")
