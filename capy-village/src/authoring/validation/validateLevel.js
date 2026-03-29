import { getAllFields, getValueByPath, isFieldVisible, isMissingValue } from '../descriptors/core.js';

function fail(path, message) {
  throw new Error(`${path}: ${message}`);
}

export function validateResolvedLevel(activityDescriptor, level, path) {
  getAllFields(activityDescriptor).forEach((field) => {
    if (!field.required) return;
    if (!isFieldVisible(field, level)) return;
    const value = getValueByPath(level, field.id);
    if (isMissingValue(value)) {
      fail(`${path}.${field.id}`, 'is required');
    }
  });
  activityDescriptor.validateResolvedLevel?.({ level, path, fail });
}
