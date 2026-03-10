"""Check connected components in knit_beanie mesh."""
import bpy, bmesh

obj = next(o for o in bpy.data.objects if o.type == 'MESH')
bpy.context.view_layer.objects.active = obj

bm = bmesh.new()
bm.from_mesh(obj.data)
bm.verts.ensure_lookup_table()

visited = set()
components = []

for start in bm.verts:
    if start.index in visited:
        continue
    # BFS
    queue = [start]
    comp = []
    while queue:
        v = queue.pop()
        if v.index in visited:
            continue
        visited.add(v.index)
        comp.append(v)
        for edge in v.link_edges:
            other = edge.other_vert(v)
            if other.index not in visited:
                queue.append(other)
    components.append(comp)

print(f"[beanie] Connected components: {len(components)}")
for i, comp in enumerate(sorted(components, key=lambda c: -len(c))):
    zs = [v.co.z for v in comp]
    xs = [v.co.x for v in comp]
    ys = [v.co.y for v in comp]
    print(f"[beanie]   comp[{i}]: {len(comp)} verts  Z=[{min(zs):.4f},{max(zs):.4f}]  X_diam={max(xs)-min(xs):.4f}")

bm.free()
