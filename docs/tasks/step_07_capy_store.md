# Step 07 — Replace Placeholder Building with capy_store.glb

## Goal

Integrate the Capy Store building created in Blender into the game and replace the placeholder building.

This step only replaces the **visual asset**.  
All gameplay systems should remain unchanged.

---

# Expected Result

After this step:

- The placeholder building disappears
- The Capy Store model appears in the village
- Capy cannot walk through the building
- The interaction prompt still works
- Occlusion fade still works when capy walks behind the building
- The building faces the correct direction

---

# 1. Place the Model in the Project

Copy the exported file from Blender into the project.

Recommended folder structure:

    assets/
     ├── models/
     │    └── capy_idle.glb
     │
     ├── buildings/
     │    └── capy_store.glb

Final path:

    assets/buildings/capy_store.glb

---

# 2. Replace Placeholder Building

Find the part of the code where the placeholder building mesh is created.

Remove the placeholder mesh and load the GLB model instead.

Conceptually this should look like:

    loadGLB("assets/buildings/capy_store.glb")

The GLB should be used as the **visual mesh only**.

---

# 3. Position the Building

Place the building at the same position where the placeholder used to be.

Example transform:

    position.set(x, 0, z)
    rotation.set(0, 0, 0)
    scale.set(1, 1, 1)

Adjust scale later if needed.

---

# 4. Collision

Do NOT generate the collider from the mesh.

Instead keep using a simple box collider.

Example:

    collider.width = buildingWidth
    collider.depth = buildingDepth
    collider.height = 2

This keeps player movement smooth and predictable.

---

# 5. Interaction Zone

Keep the interaction trigger in front of the door.

Concept example:

    interactionZone
      width: 2
      depth: 1.5
      offset: in front of door

The prompt should remain:

    Press [E] to enter Capy Store

You may need to slightly adjust the trigger location once the model is visible.

---

# 6. Occlusion System

Register the building mesh with the occlusion system.

Concept example:

    occlusionSystem.registerBuilding(capyStoreMesh)

Expected behavior:

    capy behind building → building fades
    capy visible again → building returns to normal

---

# 7. Orientation Check

The door should face the path.

If the building loads facing the wrong direction:

    rotation.y = Math.PI

---

# 8. Scale Adjustment

If the building looks too large or too small compared to capy, adjust scale.

Examples:

    scale.set(0.8, 0.8, 0.8)

or

    scale.set(1.2, 1.2, 1.2)

Start testing with scale = 1.

---

# 9. Testing Checklist

Walk around the building and verify the following.

Collision:

    capy cannot walk through the building

Occlusion:

    building fades when capy walks behind it

Interaction:

Stand near the door:

    Press [E] to enter Capy Store

Move away:

    prompt disappears

Visual alignment:

- door faces the path
- building sits correctly on the ground
- scale looks natural next to capy

---

# 10. Known Normal Adjustments

It is normal to tweak:

- building scale
- building rotation
- interaction zone position

These are typical adjustments when integrating new assets.

---

# Completion Criteria

Step 07 is complete when:

- Capy Store model loads successfully
- Placeholder building is removed
- Collision works
- Occlusion fade works
- Interaction prompt works
- Building scale and orientation look correct