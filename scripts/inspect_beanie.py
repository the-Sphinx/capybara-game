import bpy
for obj in bpy.data.objects:
    if obj.type == 'MESH':
        verts = len(obj.data.vertices)
        polys = len(obj.data.polygons)
        xs = [v.co.x for v in obj.data.vertices]
        ys = [v.co.y for v in obj.data.vertices]
        zs = [v.co.z for v in obj.data.vertices]
        mats = [m.name if m else 'None' for m in obj.data.materials]
        print(f"[beanie] OBJ '{obj.name}'  verts={verts}  polys={polys}")
        print(f"[beanie]   Z=[{min(zs):.4f}, {max(zs):.4f}]  X_diam={max(xs)-min(xs):.4f}  Y_diam={max(ys)-min(ys):.4f}")
        print(f"[beanie]   X_center={(max(xs)+min(xs))/2:.4f}  Y_center={(max(ys)+min(ys))/2:.4f}")
        print(f"[beanie]   loc={list(obj.location)}  scale={list(obj.scale)}  rot={list(obj.rotation_euler)}")
        print(f"[beanie]   materials={mats}")
    elif obj.type not in ('CAMERA', 'LIGHT'):
        print(f"[beanie] OBJ '{obj.name}'  type={obj.type}")
