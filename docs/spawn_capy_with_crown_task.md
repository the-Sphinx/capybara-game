# Task: Spawn Capybara With Crown Accessory

## Goal

Test the accessory attachment system by spawning the capybara character
(`capy_idle.glb`) and attaching the crown model (`crown.glb`) to the
`hat_anchor` in Three.js.

------------------------------------------------------------------------

# Expected Result

When the scene loads:

-   The capybara appears in the scene.
-   The crown is attached to the head using `hat_anchor`.
-   When the capy head moves (animation or rotation), the crown follows
    correctly.

------------------------------------------------------------------------

# Files

Character:

    /assets/capy_idle.glb

Accessory:

    /assets/crown.glb

------------------------------------------------------------------------

# Steps

## 1. Load Capy Model

Use GLTFLoader to load the capy character.

``` javascript
const loader = new GLTFLoader();

loader.load('/assets/capy_idle.glb', (gltf) => {
    const capy = gltf.scene;
    scene.add(capy);
});
```

------------------------------------------------------------------------

## 2. Find the hat_anchor

After loading the capy model, search for the anchor.

``` javascript
const hatAnchor = capy.getObjectByName("hat_anchor");
```

Verify it exists:

``` javascript
console.log("Hat Anchor:", hatAnchor);
```

------------------------------------------------------------------------

## 3. Load the Crown Model

``` javascript
loader.load('/assets/crown.glb', (gltf) => {
    const crown = gltf.scene;
});
```

------------------------------------------------------------------------

## 4. Attach Crown to Anchor

Attach the crown as a child of `hat_anchor`.

``` javascript
hatAnchor.add(crown);
```

------------------------------------------------------------------------

## 5. Adjust Crown Transform

Because models may have different pivots, adjust if necessary.

Example:

``` javascript
crown.position.set(0, 0.02, 0);
crown.rotation.set(0, 0, 0);
crown.scale.set(1, 1, 1);
```

These values can be tuned later.

------------------------------------------------------------------------

# Debug Helpers

Print the scene hierarchy to verify anchors exist.

``` javascript
capy.traverse((obj) => {
    console.log(obj.name);
});
```

You should see:

    hat_anchor

------------------------------------------------------------------------

# Success Criteria

The system is working if:

-   crown appears on the capy head
-   crown follows head movement
-   crown stays aligned during animation

------------------------------------------------------------------------

# Notes

The crown must remain a **separate asset** so the game can dynamically
equip accessories.

Future accessories will attach to anchors:

    hat_anchor → hats
    face_anchor → glasses
    back_anchor → backpacks
