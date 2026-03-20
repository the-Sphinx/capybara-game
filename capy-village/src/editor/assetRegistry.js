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
  return eligibleAssets.map(([modulePath, url]) => ({
    id: getAssetIdFromModulePath(modulePath),
    source: modulePath,
    output: modulePath,
    class: getClassFromModulePath(modulePath),
    url,
  }));
}
