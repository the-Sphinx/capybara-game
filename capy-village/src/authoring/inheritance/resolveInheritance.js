import {
  deepClone,
  deleteEmptyObjects,
  getAllFields,
  getPathSegments,
  mergeNested,
  setValueByPath,
} from '../descriptors/core.js';

function getValueByPath(source, path) {
  return getPathSegments(path).reduce((cursor, segment) => cursor?.[segment], source);
}

export function resolveInheritance(activityDescriptor, gameDefaults = {}, worldDefaults = {}, level = {}) {
  const resolved = {
    id: level.id,
    activityType: level.activityType,
    schemaVersion: level.schemaVersion ?? 1,
    label: level.label,
    levelNum: level.levelNum,
    slot: level.slot ?? null,
    objective: deepClone(level.objective ?? {}),
    content: deepClone(level.content ?? {}),
    difficulty: deepClone(level.difficulty ?? {}),
    scoring: deepClone(level.scoring ?? {}),
    presentation: deepClone(level.presentation ?? {}),
  };

  getAllFields(activityDescriptor).forEach((field) => {
    const [sectionId] = field.id.split('.');
    const mergedDefaults = mergeNested(gameDefaults?.[sectionId] ?? {}, worldDefaults?.[sectionId] ?? {});
    const currentValue = getValueByPath(resolved, field.id);
    const inheritability = field.inheritability ?? 'none';
    let candidateValue = currentValue;

    if (candidateValue == null && ['world_default', 'game_default', 'both'].includes(inheritability)) {
      candidateValue = getValueByPath({ [sectionId]: mergedDefaults }, field.id);
    }
    if (candidateValue == null && field.defaultValue !== undefined) {
      candidateValue = deepClone(field.defaultValue);
    }
    if (candidateValue != null) {
      setValueByPath(resolved, field.id, candidateValue);
    }
  });

  return {
    ...resolved,
    objective: deleteEmptyObjects(resolved.objective) ?? {},
    content: deleteEmptyObjects(resolved.content) ?? {},
    difficulty: deleteEmptyObjects(resolved.difficulty) ?? {},
    scoring: deleteEmptyObjects(resolved.scoring) ?? {},
    presentation: deleteEmptyObjects(resolved.presentation) ?? {},
  };
}
