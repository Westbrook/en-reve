import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { generateCem } from '../../../../../tooling/metadata/generate.ts';

test('CEM includes inherited size property and attribute with its documented mode type', async () => {
  const { manifest } = await generateCem({
    sourceRoot: fileURLToPath(new URL('../../../', import.meta.url)),
    sources: ['src/internal/en-element.ts', 'src/internal/tests/size-metadata-fixture.ts'],
  });
  const declarations = manifest.modules.flatMap((module: any) => module.declarations ?? []);
  const fixture = declarations.find((declaration: any) => declaration.name === 'SizeMetadataFixture');
  const property = fixture.members.find((member: any) => member.name === 'size');
  const attribute = fixture.attributes.find((attribute: any) => attribute.name === 'size');
  assert.equal(property.type.text, 'ElementSize');
  assert.equal(property.default, '"medium"');
  assert.equal(attribute.type.text, 'ElementSize');
  assert.equal(attribute.fieldName, 'size');
  assert.ok(property.description);
  assert.ok(attribute.description);
});
