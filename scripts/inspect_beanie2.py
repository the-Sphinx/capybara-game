import bpy

for obj in bpy.data.objects:
    print(f"[b2] OBJ '{obj.name}'  type={obj.type}")
    print(f"[b2]   loc={[round(x,4) for x in obj.location]}")
    print(f"[b2]   scale={[round(x,4) for x in obj.scale]}")
    print(f"[b2]   rot={[round(x,4) for x in obj.rotation_euler]}")
    if obj.type == 'META':
        for i, elem in enumerate(obj.data.elements):
            print(f"[b2]   meta_elem[{i}]: type={elem.type}  co={[round(x,4) for x in elem.co]}  radius={elem.radius:.4f}")
    elif obj.type == 'MESH':
        verts = obj.data.vertices
        xs = [v.co.x for v in verts]
        ys = [v.co.y for v in verts]
        zs = [v.co.z for v in verts]
        print(f"[b2]   verts={len(verts)}  polys={len(obj.data.polygons)}")
        print(f"[b2]   Z=[{min(zs):.4f},{max(zs):.4f}]  X_diam={max(xs)-min(xs):.4f}  Y_diam={max(ys)-min(ys):.4f}")
