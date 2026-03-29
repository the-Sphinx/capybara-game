function deepFreeze(value) {
  if (!value || typeof value !== 'object') {
    return value;
  }
  Object.freeze(value);
  Object.values(value).forEach((entry) => {
    if (entry && typeof entry === 'object' && !Object.isFrozen(entry)) {
      deepFreeze(entry);
    }
  });
  return value;
}

export function deepClone(value) {
  return structuredClone(value);
}

export function defineActivityType(descriptor) {
  return deepFreeze({
    version: 1,
    category: 'general',
    sections: [],
    docs: {},
    starters: [],
    ...descriptor,
  });
}

export function getAllFields(activityDescriptor) {
  return (activityDescriptor.sections ?? []).flatMap((section) =>
    (section.fields ?? []).map((field) => ({
      sectionId: section.id,
      sectionLabel: section.label,
      ...field,
    })),
  );
}

export function getFieldById(activityDescriptor, fieldId) {
  return getAllFields(activityDescriptor).find((field) => field.id === fieldId) ?? null;
}

export function getValueByPath(source, path) {
  return getPathSegments(path).reduce((current, segment) => current?.[segment], source);
}

export function getPathSegments(path) {
  return String(path)
    .split('.')
    .filter(Boolean)
    .map((segment) => (/^\d+$/.test(segment) ? Number(segment) : segment));
}

export function setValueByPath(target, path, value) {
  const segments = getPathSegments(path);
  let cursor = target;
  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    const next = segments[index + 1];
    if (cursor[segment] == null) {
      cursor[segment] = typeof next === 'number' ? [] : {};
    }
    cursor = cursor[segment];
  }
  cursor[segments[segments.length - 1]] = value;
}

export function deleteEmptyObjects(value) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => deleteEmptyObjects(entry))
      .filter((entry) => entry != null && (!(typeof entry === 'object') || Object.keys(entry).length > 0));
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  const result = {};
  Object.entries(value).forEach(([key, entry]) => {
    const normalized = deleteEmptyObjects(entry);
    if (normalized == null) return;
    if (Array.isArray(normalized) && normalized.length === 0) return;
    if (normalized && typeof normalized === 'object' && Object.keys(normalized).length === 0) return;
    result[key] = normalized;
  });
  return result;
}

export function mergeNested(base = {}, override = {}) {
  const result = deepClone(base ?? {});
  for (const [key, value] of Object.entries(override ?? {})) {
    if (isPlainObject(value) && isPlainObject(result[key])) {
      result[key] = mergeNested(result[key], value);
    } else {
      result[key] = deepClone(value);
    }
  }
  return result;
}

export function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function isMissingValue(value) {
  return value == null || value === '' || (Array.isArray(value) && value.length === 0);
}

export function normalizeEnumOptions(options = []) {
  return options.map((option) => (typeof option === 'string' ? { value: option, label: option } : option));
}

export function fieldSchemaFromDescriptor(field) {
  switch (field.valueType) {
    case 'number':
      return { type: 'number' };
    case 'boolean':
      return { type: 'boolean' };
    case 'enum':
      return { type: 'string', enum: normalizeEnumOptions(field.options).map((option) => option.value) };
    case 'array':
      if (field.editorControl === 'range_pair') {
        return {
          type: ['array', 'null'],
          minItems: 2,
          maxItems: 2,
          items: { type: 'number' },
        };
      }
      return { type: 'array' };
    case 'object':
      return { type: 'object' };
    default:
      return { type: 'string' };
  }
}

export function evaluateVisibilityRule(rule, source) {
  const currentValue = getValueByPath(source, rule.dependsOn);
  switch (rule.operator) {
    case 'equals':
      return currentValue === rule.value;
    case 'not_equals':
      return currentValue !== rule.value;
    case 'in':
      return Array.isArray(rule.value) && rule.value.includes(currentValue);
    case 'truthy':
      return Boolean(currentValue);
    case 'falsy':
      return !currentValue;
    default:
      return true;
  }
}

export function isFieldVisible(field, source) {
  if (!field.visibility?.length) {
    return true;
  }
  return field.visibility.every((rule) => evaluateVisibilityRule(rule, source));
}

export function buildEmptySections(activityDescriptor) {
  return Object.fromEntries(
    (activityDescriptor.sections ?? []).map((section) => [section.id, {}]),
  );
}
