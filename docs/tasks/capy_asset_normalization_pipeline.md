
# Capy Village — Feature 1 Implementation
## Asset Normalization Pipeline

This document specifies the **Asset Normalization System** that prepares all 3D assets before they are used in the game world.

The goal is to ensure every asset:

• sits correctly on the ground  
• has a consistent pivot  
• is normalized to a unit height for layout-driven sizing  
• belongs to a known asset category  
• can be safely placed in layouts later

The normalization script will process assets from `assets/pipeline/models/raw/` and produce corrected assets in `assets/pipeline/models/normalized/`.

The original files must NEVER be modified.

---

# Folder Structure

The project must contain the following structure.

```
assets/
    source/
    pipeline/
        models/
            raw/
            normalized/
    game_ready/
        models/
config/
    asset_registry.json
tools/
    normalize_assets.ts
```

---

# Asset Registry

The registry describes every asset and its category.

File:

```
config/asset_registry.json
```

Example:

```json
{
  "assets": [
    {
      "id": "hut_round_small",
      "source": "assets/pipeline/models/raw/hut_round_small.glb",
      "output": "assets/pipeline/models/normalized/hut_round_small.glb",
      "class": "house"
    },
    {
      "id": "center_book_statue",
      "source": "assets/pipeline/models/raw/center_book_statue.glb",
      "output": "assets/pipeline/models/normalized/center_book_statue.glb",
      "class": "centerpiece"
    }
  ]
}
```

---

# Asset Classes

The registry still records the asset class so the layout/editor pipeline knows what kind of asset it is.

Asset class is metadata only during normalization.

The normalization script must not infer final in-world size from class.

---

# World Scale Convention

Use the following world assumptions when assigning final scale in layout data:

```
player capy height ≈ 1 unit
hut door height ≈ 1.6 – 1.8 units
tree height ≈ 2 – 4 units
```

Normalization itself should not bake these world sizes into the exported GLBs.

---

# Normalization Script Behavior

The script:

```
tools/normalize_assets.ts
```

must perform the following steps for each asset.

---

## Step 1 — Load GLB

Load the GLB file using GLTF loader.

Read all meshes in the scene.

---

## Step 2 — Compute Bounding Box

Calculate the full asset bounding box.

```
width
height
depth
minY
maxY
```

---

## Step 3 — Ground Alignment

Assets must sit on the ground.

Procedure:

1. Detect lowest vertex (minY).
2. Shift entire asset so lowest point becomes:

```
Y = 0
```

After this step the asset base touches the ground.

---

## Step 4 — Horizontal Pivot

Center the pivot horizontally.

Compute:

```
centerX
centerZ
```

Translate mesh so pivot becomes:

```
(0, 0, 0)
```

But keep the base at Y = 0.

Result:

```
pivot = bottom center
```

---

## Step 5 — Scale Normalization

Determine asset height:

```
height = maxY - minY
```

Normalize every asset so:

```
targetHeight = 1
```

Compute scale factor:

```
scaleFactor = targetHeight / height
```

Apply uniform scale to the model.

This creates a canonical unit-height asset. Its true in-world height will be specified later in the layout JSON.

---

## Step 6 — Freeze Transform

Bake the transformations into the mesh.

After export:

```
scale = 1
rotation = 0
position = 0
```

---

## Step 7 — Export Normalized GLB

Export result to:

```
assets/pipeline/models/normalized/
```

Never overwrite raw files.

---

# Command Line Usage

The script must support:

```
npm run normalize-assets
```

which processes **all assets** in the registry.

Optional:

```
npm run normalize-assets hut_round_small
```

to normalize a single asset.

---

# Validation Output

For each asset print a report.

Example:

```
Asset: hut_round_small

Original Height: 5.4
Target Height: 1
Scale Applied: 0.185

Pivot Adjusted: YES
Ground Adjusted: YES

Exported To:
assets/pipeline/models/normalized/hut_round_small.glb
```

---

# Error Handling

The script must warn if:

• asset contains no mesh  
• bounding box cannot be computed  
• asset class is missing  

---

# Final Goal

After running the normalization pipeline:

• all assets share the same ground alignment  
• pivots are predictable  
• scale is consistent  
• assets are ready for layout placement

This guarantees the upcoming **Layout Editor** can place assets reliably.
