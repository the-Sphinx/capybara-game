"""
Reposition hat_anchor bone upward by +0.30 in Blender Z,
then re-export capy_idle.glb to both output paths.
Run with: blender --background capy_idle.blend --python reposition_hat_anchor.py
"""
import bpy
import os

BLEND_PATH  = '/Users/gorkem/workspace/gorkem/capybara-game/assets/models/capy_idle.blend'
GLB_ASSETS  = '/Users/gorkem/workspace/gorkem/capybara-game/assets/models/capy_idle.glb'
GLB_PUBLIC  = '/Users/gorkem/workspace/gorkem/capybara-game/capy-village/public/capy_idle.glb'
BONE_NAME   = 'hat_anchor'
Z_DELTA     = 0.30  # Blender units upward

def main():
    # ── Find armature ──────────────────────────────────────────────────────────
    armature_obj = None
    for obj in bpy.data.objects:
        if obj.type == 'ARMATURE':
            armature_obj = obj
            break

    if armature_obj is None:
        print("ERROR: No armature found in scene.")
        return

    print(f"Found armature: {armature_obj.name}")

    # ── Enter Edit Mode ────────────────────────────────────────────────────────
    bpy.context.view_layer.objects.active = armature_obj
    bpy.ops.object.mode_set(mode='EDIT')

    edit_bones = armature_obj.data.edit_bones
    bone = edit_bones.get(BONE_NAME)

    if bone is None:
        print(f"ERROR: Bone '{BONE_NAME}' not found. Available: {[b.name for b in edit_bones]}")
        bpy.ops.object.mode_set(mode='OBJECT')
        return

    print(f"Before: {BONE_NAME} head={tuple(bone.head)}, tail={tuple(bone.tail)}")

    # Move both head and tail upward by Z_DELTA
    bone.head.z += Z_DELTA
    bone.tail.z += Z_DELTA

    print(f"After:  {BONE_NAME} head={tuple(bone.head)}, tail={tuple(bone.tail)}")

    bpy.ops.object.mode_set(mode='OBJECT')

    # ── Save blend file ────────────────────────────────────────────────────────
    bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)
    print(f"Saved blend: {BLEND_PATH}")

    # ── Export GLB ─────────────────────────────────────────────────────────────
    for out_path in [GLB_ASSETS, GLB_PUBLIC]:
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        bpy.ops.export_scene.gltf(
            filepath=out_path,
            export_format='GLB',
            export_apply=True,
            export_normals=True,
            export_materials='EXPORT',
            export_cameras=False,
            export_lights=False,
        )
        print(f"Exported GLB: {out_path}")

    print("Done.")

main()
