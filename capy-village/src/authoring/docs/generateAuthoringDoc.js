export function generateActivityBasedAuthoringDoc({ gameLabel, activityDescriptors }) {
  const lines = [
    '# Activity-Based Authoring',
    '',
    `This document is generated from the activity descriptors for ${gameLabel}.`,
    '',
    'Authoring hierarchy:',
    '- Game',
    '- World',
    '- Level',
    '- Activity Type',
    '',
    'Each level is standalone and owns these sections:',
    '- `objective`',
    '- `content`',
    '- `difficulty`',
    '- `scoring`',
    '- `presentation`',
    '',
    'Starters are editor-only convenience templates.',
    'They prefill form values, but runtime never depends on them.',
    '',
  ];

  activityDescriptors.forEach((descriptor) => {
    lines.push(`## \`${descriptor.id}\``, '', descriptor.description, '');
    (descriptor.sections ?? []).forEach((section) => {
      lines.push(`### ${section.label}`, '');
      (section.fields ?? []).forEach((field) => {
        const extras = [];
        if (field.required) extras.push('required');
        extras.push(field.editorControl);
        lines.push(`- \`${field.id}\` (${extras.join(', ')})`);
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
