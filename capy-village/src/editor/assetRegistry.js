import registry from '../../../config/asset_registry.json';

const gameReadyAssetModules = import.meta.glob('../../../assets/game_ready/models/**/*.glb', {
  eager: true,
  import: 'default',
  query: '?url',
});

function getFileName(assetPath) {
  return assetPath.split('/').pop();
}

function isEditorEligibleAsset(modulePath) {
  return !modulePath.includes('/characters/') && !modulePath.includes('/accessories/');
}

export function getAssetRegistry() {
  const eligibleAssets = Object.entries(gameReadyAssetModules).filter(([modulePath]) => isEditorEligibleAsset(modulePath));

  return registry.assets.map((asset) => {
    const fileName = getFileName(asset.output);
    const matchingEntry = eligibleAssets.find(([modulePath]) => modulePath.endsWith(`/${fileName}`));

    return {
      ...asset,
      url: matchingEntry?.[1] ?? null,
    };
  });
}
