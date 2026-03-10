"""
Measure crown.glb bounding box dimensions.
Run with: blender --background --python measure_crown.py
"""
import bpy
import mathutils

bpy.ops.import_scene.gltf(filepath='/Users/gorkem/workspace/gorkem/capybara-game/assets/models/crown.glb')

objs = [o for o in bpy.context.selected_objects if o.type == 'MESH']
print(f"Crown objects: {[o.name for o in objs]}")

mn = mathutils.Vector(( 1e9,  1e9,  1e9))
mx = mathutils.Vector((-1e9, -1e9, -1e9))
for obj in objs:
    for corner in obj.bound_box:
        w = obj.matrix_world @ mathutils.Vector(corner)
        mn.x = min(mn.x, w.x); mx.x = max(mx.x, w.x)
        mn.y = min(mn.y, w.y); mx.y = max(mx.y, w.y)
        mn.z = min(mn.z, w.z); mx.z = max(mx.z, w.z)

size = mx - mn
print(f"CROWN_SIZE_X={size.x:.6f}")
print(f"CROWN_SIZE_Y={size.y:.6f}")
print(f"CROWN_SIZE_Z={size.z:.6f}")
print(f"CROWN_DIAMETER={max(size.x, size.y):.6f}")
