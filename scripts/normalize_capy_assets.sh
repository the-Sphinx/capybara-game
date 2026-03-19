#!/bin/zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BLENDER_BIN="${BLENDER_BIN:-/Applications/Blender.app/Contents/MacOS/Blender}"

SCALE_FACTOR="$(
  cd "$ROOT_DIR" &&
    node --input-type=module - <<'JS'
import { loadGlb, computeBounds } from './tools/lib/gltf_node.ts';
const { scene } = await loadGlb('./assets/game_ready/models/characters/capy_idle.glb');
const bounds = computeBounds(scene);
if (!bounds || bounds.height <= 0) {
  throw new Error('Could not compute current capy bounds.');
}
process.stdout.write(String(1 / bounds.height));
JS
)"

if [[ "${CAPY_NORMALIZE_SOURCE_BLENDS:-0}" == "1" ]]; then
  echo "[Capy] Normalizing source blends with scale factor ${SCALE_FACTOR}"

  python3 - <<PY
import pathlib, textwrap

scale_factor = float("${SCALE_FACTOR}")

def write_script(path, body):
    path.write_text(textwrap.dedent(body))

character_script = pathlib.Path('/tmp/capy_blend_character.py')
write_script(character_script, f'''
import bpy
import mathutils
scale_factor = {scale_factor}
roots = [obj for obj in bpy.data.objects if obj.type == 'ARMATURE' and obj.parent is None]
def walk(root):
    yield root
    for child in root.children:
        yield from walk(child)
relevant = []
seen = set()
for root in roots:
    for obj in walk(root):
        if obj.type not in {{'ARMATURE', 'MESH', 'EMPTY'}}:
            continue
        if obj.name in seen:
            continue
        seen.add(obj.name)
        relevant.append(obj)
meshes = [obj for obj in relevant if obj.type == 'MESH']
scale_matrix = mathutils.Matrix.Scale(scale_factor, 4)
for root in roots:
    root.matrix_world = scale_matrix @ root.matrix_world
depsgraph = bpy.context.evaluated_depsgraph_get()
min_z = 1e9
for obj in meshes:
    evaluated = obj.evaluated_get(depsgraph)
    mesh = evaluated.to_mesh()
    for vertex in mesh.vertices:
        world = evaluated.matrix_world @ vertex.co
        min_z = min(min_z, world.z)
    evaluated.to_mesh_clear()
shift = -min_z
for root in roots:
    root.matrix_world = mathutils.Matrix.Translation((0.0, 0.0, shift)) @ root.matrix_world
bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
print('saved blend', bpy.data.filepath, flush=True)
''')

accessory_script = pathlib.Path('/tmp/capy_blend_accessory.py')
write_script(accessory_script, f'''
import bpy
import mathutils
scale_factor = {scale_factor}
roots = [obj for obj in bpy.data.objects if obj.type == 'MESH' and obj.parent is None and len(obj.data.vertices) >= 100]
scale_matrix = mathutils.Matrix.Scale(scale_factor, 4)
for root in roots:
    root.matrix_world = scale_matrix @ root.matrix_world
bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
print('saved blend', bpy.data.filepath, flush=True)
''')
PY

  "$BLENDER_BIN" --factory-startup --background "$ROOT_DIR/assets/source/models/characters/capy_idle_with_eyes.blend" --python /tmp/capy_blend_character.py
  "$BLENDER_BIN" --factory-startup --background "$ROOT_DIR/assets/source/models/accessories/crown.blend" --python /tmp/capy_blend_accessory.py
  "$BLENDER_BIN" --factory-startup --background "$ROOT_DIR/assets/source/models/accessories/chef_hat.blend" --python /tmp/capy_blend_accessory.py
  "$BLENDER_BIN" --factory-startup --background "$ROOT_DIR/assets/source/models/accessories/knit_beanie.blend" --python /tmp/capy_blend_accessory.py
  "$BLENDER_BIN" --factory-startup --background "$ROOT_DIR/assets/source/models/accessories/scarf_v2.blend" --python /tmp/capy_blend_accessory.py
else
  echo "[Capy] Skipping source blend normalization. Set CAPY_NORMALIZE_SOURCE_BLENDS=1 to include the Blender source-blend step."
fi

cd "$ROOT_DIR"
node --experimental-strip-types ./tools/normalize_capy_assets.ts
