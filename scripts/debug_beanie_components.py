"""Print all component Z ranges after decimation to find mis-classified ones."""
import bpy, bmesh

DECIMATE_RATIO  = 0.02
POMPOM_Z_THRESH = 0.15  # current threshold

obj = next(o for o in bpy.data.objects if o.type == 'MESH')
bpy.context.view_layer.objects.active = obj
bpy.ops.object.select_all(action='DESELECT')
obj.select_set(True)

dec = obj.modifiers.new(name="Decimate", type='DECIMATE')
dec.ratio = DECIMATE_RATIO
dec.decimate_type = 'COLLAPSE'
with bpy.context.temp_override(active_object=obj, object=obj, selected_objects=[obj]):
    bpy.ops.object.modifier_apply(modifier="Decimate")

bm = bmesh.new()
bm.from_mesh(obj.data)
bm.verts.ensure_lookup_table()

visited = set()
components = []
for start in bm.verts:
    if start.index in visited:
        continue
    queue = [start]
    comp = []
    while queue:
        v = queue.pop()
        if v.index in visited: continue
        visited.add(v.index)
        comp.append(v.index)
        for e in v.link_edges:
            ov = e.other_vert(v)
            if ov.index not in visited: queue.append(ov)
    components.append(comp)

bm.free()

print(f"\n[debug] {len(components)} components after decimation at {DECIMATE_RATIO}")
print(f"[debug] Threshold={POMPOM_Z_THRESH}  | label: B=body  P=pompom")
print(f"[debug] {'idx':>4}  {'verts':>6}  {'Z_min':>8}  {'Z_max':>8}  {'X_diam':>8}  label")

for i, comp in enumerate(sorted(components, key=lambda c: min(bm2.verts[j].co.z if False else 0 for j in c))):
    # Re-read after bm freed — use mesh directly
    pass

# Re-read from mesh
bm2 = bmesh.new()
bm2.from_mesh(obj.data)
bm2.verts.ensure_lookup_table()

visited2 = set()
components2 = []
for start in bm2.verts:
    if start.index in visited2:
        continue
    queue = [start]
    comp = []
    while queue:
        v = queue.pop()
        if v.index in visited2: continue
        visited2.add(v.index)
        comp.append(v.index)
        for e in v.link_edges:
            ov = e.other_vert(v)
            if ov.index not in visited2: queue.append(ov)
    components2.append(comp)

for i, comp in enumerate(sorted(components2, key=lambda c: min(bm2.verts[j].co.z for j in c))):
    zs = [bm2.verts[j].co.z for j in comp]
    xs = [bm2.verts[j].co.x for j in comp]
    z_min, z_max = min(zs), max(zs)
    x_diam = max(xs) - min(xs)
    label = 'P' if z_min > POMPOM_Z_THRESH else 'B'
    print(f"[debug] {i:>4}  {len(comp):>6}  {z_min:>8.4f}  {z_max:>8.4f}  {x_diam:>8.4f}  {label}")

bm2.free()
