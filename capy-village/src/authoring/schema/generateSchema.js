import { fieldSchemaFromDescriptor, getAllFields, getPathSegments, isPlainObject } from '../descriptors/core.js';

function deepMergeSchema(target, patch) {
  const result = structuredClone(target);
  Object.entries(patch).forEach(([key, value]) => {
    if (isPlainObject(value) && isPlainObject(result[key])) {
      result[key] = deepMergeSchema(result[key], value);
    } else {
      result[key] = structuredClone(value);
    }
  });
  return result;
}

function setSchemaAtPath(root, path, schema, required) {
  const segments = getPathSegments(path);
  let cursor = root;
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    const isLeaf = index === segments.length - 1;
    cursor.properties ??= {};
    if (!cursor.properties[segment]) {
      cursor.properties[segment] = isLeaf
        ? schema
        : { type: 'object', additionalProperties: false, properties: {} };
    } else if (isLeaf) {
      cursor.properties[segment] = deepMergeSchema(cursor.properties[segment], schema);
    }
    if (required && !cursor.required?.includes(segment)) {
      cursor.required ??= [];
      cursor.required.push(segment);
    }
    cursor = cursor.properties[segment];
  }
}

function buildAuthoredActivitySchemaVariant(activityDescriptor, { includeLevelIdentity = true } = {}) {
  const sectionSchemas = {};
  for (const section of activityDescriptor.sections ?? []) {
    const schema = { type: 'object', additionalProperties: false, properties: {} };
    (section.fields ?? []).forEach((field) => {
      const localPath = field.id.replace(`${section.id}.`, '');
      const conditionallyVisible = Array.isArray(field.visibility) && field.visibility.length > 0;
      setSchemaAtPath(schema, localPath, fieldSchemaFromDescriptor(field), field.required && !conditionallyVisible);
    });
    sectionSchemas[section.id] = schema;
  }

  return {
    type: 'object',
    additionalProperties: false,
    required: [
      'id',
      'label',
      ...(includeLevelIdentity ? ['levelNum'] : []),
      'activityType',
      'objective',
      'content',
      'difficulty',
      'scoring',
      'presentation',
    ],
    properties: {
      id: { type: 'string' },
      label: { type: 'string' },
      ...(includeLevelIdentity ? { levelNum: { type: 'number' }, slot: { type: 'number' } } : {}),
      schemaVersion: { type: 'number' },
      activityType: { const: activityDescriptor.id },
      ...sectionSchemas,
    },
  };
}

export function buildLevelSchemaVariant(activityDescriptor) {
  return buildAuthoredActivitySchemaVariant(activityDescriptor, { includeLevelIdentity: true });
}

export function buildGameSchema({ gameId, gameLabel, activityDescriptors }) {
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: `${gameLabel} game config`,
    type: 'object',
    additionalProperties: false,
    required: ['id', 'label', 'schemaVersion', 'worldIds', 'worldSelect', 'levelSelect', 'arcade', 'starters'],
    properties: {
      id: { const: gameId },
      label: { type: 'string' },
      schemaVersion: { type: 'number' },
      defaults: { type: 'object', additionalProperties: true },
      worldIds: { type: 'array', items: { type: 'string' } },
      worldSelect: { type: 'object', additionalProperties: true },
      levelSelect: { type: 'object', additionalProperties: true },
      starters: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'label', 'activityType'],
          properties: {
            id: { type: 'string' },
            label: { type: 'string' },
            description: { type: 'string' },
            activityType: { type: 'string', enum: activityDescriptors.map((descriptor) => descriptor.id) },
            objective: { type: 'object', additionalProperties: true },
            content: { type: 'object', additionalProperties: true },
            difficulty: { type: 'object', additionalProperties: true },
            scoring: { type: 'object', additionalProperties: true },
            presentation: { type: 'object', additionalProperties: true },
          },
        },
      },
      arcade: {
        type: 'object',
        additionalProperties: false,
        properties: {
          enabled: { type: 'boolean' },
          activities: {
            type: 'array',
            items: {
              oneOf: activityDescriptors.map((descriptor) => buildAuthoredActivitySchemaVariant(descriptor, { includeLevelIdentity: false })),
            },
          },
        },
      },
    },
  };
}

export function buildWorldSchema({ gameLabel, activityDescriptors }) {
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: `${gameLabel} world config`,
    type: 'object',
    additionalProperties: false,
    required: ['id', 'title', 'levels'],
    properties: {
      id: { type: 'string' },
      title: { type: 'string' },
      subtitle: { type: 'string' },
      label: { type: 'string' },
      theme: { type: 'string' },
      learningObjective: { type: 'string' },
      unlockRequirementText: { type: 'string' },
      startsUnlocked: { type: 'boolean' },
      unlockAfterWorldId: { type: ['string', 'null'] },
      signBox: { type: 'object', additionalProperties: true },
      clickBox: { type: ['object', 'null'], additionalProperties: true },
      defaults: { type: 'object', additionalProperties: true },
      levels: {
        type: 'array',
        items: {
          oneOf: activityDescriptors.map(buildLevelSchemaVariant),
        },
      },
    },
  };
}
