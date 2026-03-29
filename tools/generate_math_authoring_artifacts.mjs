import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getMathGardenActivityDescriptors } from '../capy-village/src/authoring/mathGardenAuthoring.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const schemaDir = path.join(repoRoot, 'capy-village', 'src', 'config', 'games', 'schemas');
const docsPath = path.join(repoRoot, 'docs', 'math_garden_authoring.md');

function fieldSchema(field) {
  switch (field.valueType) {
    case 'number':
      return { type: 'number' };
    case 'boolean':
      return { type: 'boolean' };
    case 'enum':
      return { type: 'string', enum: (field.options ?? []).map((option) => option.value) };
    case 'array':
      return { type: 'array' };
    case 'object':
      return { type: 'object' };
    default:
      return { type: 'string' };
  }
}

function buildLevelVariant(descriptor) {
  const sectionProperties = {};
  for (const section of descriptor.sections ?? []) {
    const sectionRequired = [];
    const properties = {};
    for (const field of section.fields ?? []) {
      const localPath = field.id.replace(`${section.id}.`, '');
      const firstSegment = localPath.split('.')[0];
      if (!properties[firstSegment]) {
        properties[firstSegment] = { type: 'object' };
      }
      sectionRequired.push(firstSegment);
    }
    sectionProperties[section.id] = {
      type: 'object',
      additionalProperties: true,
    };
  }

  return {
    type: 'object',
    additionalProperties: true,
    required: ['id', 'label', 'levelNum', 'activityType', 'objective', 'content', 'difficulty', 'scoring', 'presentation'],
    properties: {
      id: { type: 'string' },
      label: { type: 'string' },
      levelNum: { type: 'number' },
      slot: { type: 'number' },
      schemaVersion: { type: 'number' },
      activityType: { const: descriptor.id },
      sourcePresetId: { type: 'string' },
      objective: { type: 'object', additionalProperties: true },
      content: { type: 'object', additionalProperties: true },
      difficulty: { type: 'object', additionalProperties: true },
      scoring: { type: 'object', additionalProperties: true },
      presentation: { type: 'object', additionalProperties: true },
    },
  };
}

function buildGameSchema(descriptors) {
  const levelVariants = descriptors.map(buildLevelVariant);
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'Math Garden game config',
    type: 'object',
    additionalProperties: true,
    required: ['id', 'label', 'schemaVersion', 'worldIds', 'worldSelect', 'levelSelect', 'arcade', 'presets'],
    properties: {
      id: { const: 'math_garden' },
      label: { type: 'string' },
      schemaVersion: { type: 'number' },
      defaults: { type: 'object', additionalProperties: true },
      worldIds: { type: 'array', items: { type: 'string' } },
      worldSelect: { type: 'object', additionalProperties: true },
      levelSelect: { type: 'object', additionalProperties: true },
      presets: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: true,
          required: ['id', 'label', 'activityType'],
          properties: {
            id: { type: 'string' },
            label: { type: 'string' },
            description: { type: 'string' },
            activityType: { type: 'string', enum: descriptors.map((descriptor) => descriptor.id) },
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
        additionalProperties: true,
        properties: {
          enabled: { type: 'boolean' },
          activities: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: true,
              required: ['id', 'label', 'activityType', 'objective', 'content', 'difficulty', 'scoring', 'presentation'],
              properties: {
                id: { type: 'string' },
                label: { type: 'string' },
                activityType: { type: 'string', enum: descriptors.map((descriptor) => descriptor.id) },
                schemaVersion: { type: 'number' },
                weight: { type: 'number' },
                objective: { type: 'object', additionalProperties: true },
                content: { type: 'object', additionalProperties: true },
                difficulty: { type: 'object', additionalProperties: true },
                scoring: { type: 'object', additionalProperties: true },
                presentation: { type: 'object', additionalProperties: true },
              },
            },
          },
        },
      },
    },
    $defs: {
      level: {
        oneOf: levelVariants,
      },
    },
  };
}

function buildWorldSchema(descriptors) {
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'Math Garden world config',
    type: 'object',
    additionalProperties: true,
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
      unlockAfterWorldId: { type: 'string' },
      signBox: { type: 'object', additionalProperties: true },
      clickBox: { type: ['object', 'null'], additionalProperties: true },
      defaults: { type: 'object', additionalProperties: true },
      levels: {
        type: 'array',
        items: {
          oneOf: descriptors.map(buildLevelVariant),
        },
      },
    },
  };
}

function buildDocs(descriptors) {
  const lines = [
    '# Math Garden Authoring',
    '',
    'This document is generated from the new activity-type descriptors.',
    '',
    'Levels are authored directly as complete units with:',
    '- `activityType`',
    '- `objective`',
    '- `content`',
    '- `difficulty`',
    '- `scoring`',
    '- `presentation`',
    '',
    'Presets are optional convenience starters only. Runtime does not depend on them.',
    '',
  ];

  descriptors.forEach((descriptor) => {
    lines.push(`## \`${descriptor.id}\``, '', descriptor.description, '');
    (descriptor.sections ?? []).forEach((section) => {
      lines.push(`### ${section.label}`, '');
      (section.fields ?? []).forEach((field) => {
        lines.push(`- \`${field.id}\` (${field.editorControl})${field.required ? ' required' : ''}`);
        if (field.description) {
          lines.push(`  ${field.description}`);
        }
        if (field.options?.length) {
          lines.push(`  Options: ${field.options.map((option) => `\`${option.value}\``).join(', ')}`);
        }
      });
      lines.push('');
    });
  });

  return lines.join('\n');
}

await fs.mkdir(schemaDir, { recursive: true });
const descriptors = getMathGardenActivityDescriptors();
await fs.writeFile(path.join(schemaDir, 'math_garden.game.schema.json'), `${JSON.stringify(buildGameSchema(descriptors), null, 2)}\n`, 'utf8');
await fs.writeFile(path.join(schemaDir, 'math_garden.world.schema.json'), `${JSON.stringify(buildWorldSchema(descriptors), null, 2)}\n`, 'utf8');
await fs.writeFile(docsPath, `${buildDocs(descriptors)}\n`, 'utf8');
