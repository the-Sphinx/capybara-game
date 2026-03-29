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

export function defineActivityType(descriptor) {
  return deepFreeze({
    version: 1,
    category: 'general',
    sections: [],
    docs: {},
    presets: [],
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

function getValueByPath(source, path) {
  return String(path)
    .split('.')
    .filter(Boolean)
    .reduce((current, segment) => current?.[segment], source);
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
