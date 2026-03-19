import layoutSchema from '../../../config/layout_schemas/village_layout.schema.json';

function isVectorTriplet(value) {
  return Array.isArray(value) && value.length === 3 && value.every((item) => Number.isFinite(item));
}

function roundNumber(value) {
  return Number(value.toFixed(4));
}

function normalizeTransformArray(values) {
  return values.map((value) => roundNumber(value));
}

export class LayoutSerializer {
  static createEmptyLayout(layoutName = 'village_hub_v1') {
    return {
      layoutName,
      objects: [],
    };
  }

  static serialize(layoutName, objects) {
    return {
      layoutName,
      objects: objects.map((object) => ({
        id: object.id,
        assetId: object.assetId,
        position: normalizeTransformArray(object.position),
        rotation: normalizeTransformArray(object.rotation),
        scale: normalizeTransformArray(object.scale),
      })),
    };
  }

  static validate(layout) {
    if (!layout || typeof layout !== 'object') {
      return { valid: false, error: 'Layout JSON must be an object.' };
    }

    if (typeof layout.layoutName !== 'string' || layout.layoutName.trim() === '') {
      return { valid: false, error: 'Layout JSON is missing a valid "layoutName".' };
    }

    if (!Array.isArray(layout.objects)) {
      return { valid: false, error: 'Layout JSON is missing an "objects" array.' };
    }

    for (const [index, object] of layout.objects.entries()) {
      if (!object || typeof object !== 'object') {
        return { valid: false, error: `Layout object at index ${index} must be an object.` };
      }

      if (typeof object.id !== 'string' || object.id.trim() === '') {
        return { valid: false, error: `Layout object at index ${index} is missing a valid "id".` };
      }

      if (typeof object.assetId !== 'string' || object.assetId.trim() === '') {
        return { valid: false, error: `Layout object "${object.id}" is missing a valid "assetId".` };
      }

      if (!isVectorTriplet(object.position)) {
        return { valid: false, error: `Layout object "${object.id}" has an invalid "position".` };
      }

      if (!isVectorTriplet(object.rotation)) {
        return { valid: false, error: `Layout object "${object.id}" has an invalid "rotation".` };
      }

      if (!isVectorTriplet(object.scale)) {
        return { valid: false, error: `Layout object "${object.id}" has an invalid "scale".` };
      }
    }

    return { valid: true, error: null };
  }

  static parse(text) {
    try {
      const parsed = JSON.parse(text);
      const validation = LayoutSerializer.validate(parsed);
      if (!validation.valid) {
        return { layout: null, error: validation.error };
      }
      return { layout: parsed, error: null };
    } catch (error) {
      return {
        layout: null,
        error: `Layout JSON malformed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  static getSchema() {
    return layoutSchema;
  }
}
