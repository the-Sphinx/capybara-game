import argparse
import json
import math
import os
import sys

import bpy
from mathutils import Vector


def parse_args():
    argv = []
    if "--" in sys.argv:
        argv = sys.argv[sys.argv.index("--") + 1:]

    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--target-height", type=float, default=1.0)
    return parser.parse_args(argv)


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)

    for collection in (bpy.data.meshes, bpy.data.materials, bpy.data.images):
        for block in collection:
            if block.users == 0:
                collection.remove(block)


def get_root_objects():
    return [obj for obj in bpy.context.scene.objects if obj.parent is None]


def get_mesh_objects():
    return [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]


def compute_world_bounds(mesh_objects):
    mins = Vector((math.inf, math.inf, math.inf))
    maxs = Vector((-math.inf, -math.inf, -math.inf))

    for obj in mesh_objects:
        for corner in obj.bound_box:
            world = obj.matrix_world @ Vector(corner)
            mins.x = min(mins.x, world.x)
            mins.y = min(mins.y, world.y)
            mins.z = min(mins.z, world.z)
            maxs.x = max(maxs.x, world.x)
            maxs.y = max(maxs.y, world.y)
            maxs.z = max(maxs.z, world.z)

    return mins, maxs


def apply_root_rotation_and_scale(roots):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in roots:
        obj.select_set(True)
    if roots:
        bpy.context.view_layer.objects.active = roots[0]
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)


def align_to_ground_and_center(roots):
    mesh_objects = get_mesh_objects()
    if not mesh_objects:
        raise RuntimeError("No mesh objects found after import.")

    mins, maxs = compute_world_bounds(mesh_objects)
    center_x = (mins.x + maxs.x) * 0.5
    center_y = (mins.y + maxs.y) * 0.5

    for root in roots:
        root.location.x -= center_x
        root.location.y -= center_y
        root.location.z -= mins.z

    bpy.context.view_layer.update()
    return mins, maxs


def normalize_asset(roots, target_height):
    apply_root_rotation_and_scale(roots)
    align_to_ground_and_center(roots)

    mesh_objects = get_mesh_objects()
    mins, maxs = compute_world_bounds(mesh_objects)
    height = maxs.z - mins.z
    if height <= 0:
        raise RuntimeError("Imported asset has non-positive height.")

    scale_factor = target_height / height
    for root in roots:
        root.scale *= scale_factor

    bpy.context.view_layer.update()
    mins, maxs = align_to_ground_and_center(roots)

    return {
        "scale_factor": scale_factor,
        "height": maxs.z - mins.z,
        "min_z": mins.z,
        "max_z": maxs.z,
    }


def main():
    args = parse_args()
    clear_scene()

    bpy.ops.import_scene.gltf(filepath=args.input)
    roots = get_root_objects()
    report = normalize_asset(roots, args.target_height)

    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=args.output,
        export_format="GLB",
        export_apply=True,
        export_texcoords=True,
        export_normals=True,
        export_materials="EXPORT",
        export_image_format="AUTO",
        export_yup=True,
        use_selection=False,
    )

    print(json.dumps({"input": args.input, "output": args.output, **report}))


if __name__ == "__main__":
    main()
