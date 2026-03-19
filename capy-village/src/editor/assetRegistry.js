import registry from '../../../config/asset_registry.json';

const normalizedAssetModules = import.meta.glob('../../../assets/normalized_assets/*.glb', {
  eager: true,
  import: 'default',
  query: '?url',
});

function getFileName(assetPath) {
  return assetPath.split('/').pop();
}

export function getAssetRegistry() {
  return registry.assets.map((asset) => {
    const fileName = getFileName(asset.output);
    const matchingEntry = Object.entries(normalizedAssetModules).find(([modulePath]) => modulePath.endsWith(`/${fileName}`));

    return {
      ...asset,
      url: matchingEntry?.[1] ?? null,
    };
  });
}
