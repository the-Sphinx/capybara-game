import registry from '../../../config/asset_registry.json';

const gameReadyAssetModules = import.meta.glob('../../../assets/game_ready/models/**/*.glb', {
  eager: true,
  import: 'default',
  query: '?url',
});

function getFileName(assetPath) {
  return assetPath.split('/').pop();
}

function getAssetIdFromModulePath(modulePath) {
  const fileName = getFileName(modulePath) ?? '';
  return fileName.replace(/\.glb$/i, '');
}

function getClassFromModulePath(modulePath) {
  if (modulePath.includes('/buildings/')) {
    return 'building';
  }

  if (modulePath.includes('/props/')) {
    return 'prop';
  }

  return 'asset';
}

function isEditorEligibleAsset(modulePath) {
  return !modulePath.includes('/characters/') && !modulePath.includes('/accessories/');
}

export function getAssetRegistry() {
  const eligibleAssets = Object.entries(gameReadyAssetModules)
    .filter(([modulePath]) => isEditorEligibleAsset(modulePath));
  const assetsById = new Map(
    eligibleAssets.map(([modulePath, url]) => [
      getAssetIdFromModulePath(modulePath),
      { modulePath, url },
    ]),
  );

  const registryAssets = registry.assets
    .map((asset) => {
      const matchingAsset = assetsById.get(asset.id);
      if (!matchingAsset?.url) {
        console.warn(`[Editor] Skipping asset "${asset.id}" because no matching game_ready GLB was found.`);
        return null;
      }

      return {
        ...asset,
        output: matchingAsset.modulePath,
        url: matchingAsset.url,
      };
    })
    .filter(Boolean);

  const seenIds = new Set(registryAssets.map((asset) => asset.id));
  const extraAssets = eligibleAssets
    .map(([modulePath, url]) => {
      const id = getAssetIdFromModulePath(modulePath);
      if (seenIds.has(id)) {
        return null;
      }

      return {
        id,
        source: modulePath,
        output: modulePath,
        class: getClassFromModulePath(modulePath),
        url,
      };
    })
    .filter(Boolean);

  return [...registryAssets, ...extraAssets];
}
