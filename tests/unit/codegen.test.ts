import { describe, expect, it } from 'vitest';
import { generateJsonSchema, generateOpenApiSchema, v } from '../../src';

describe('Unit Testing: Schema Codegen (JSON Schema & OpenAPI)', () => {
  it('generates valid JSON Schema from Gigli schemas', () => {
    const userSchema = v.object({
      id: v.string(),
      age: v.number(),
      active: v.boolean(),
      tags: v.array(v.string()),
    });

    const jsonSchema = generateJsonSchema(userSchema);
    expect(jsonSchema.type).toBe('object');
    expect(jsonSchema.properties.id).toEqual({ type: 'string' });
    expect(jsonSchema.properties.age).toEqual({ type: 'number' });
    expect(jsonSchema.properties.active).toEqual({ type: 'boolean' });
    expect(jsonSchema.properties.tags).toEqual({ type: 'array', items: { type: 'string' } });
    expect(jsonSchema.required).toEqual(['id', 'age', 'active', 'tags']);
  });

  it('generates OpenAPI 3.0 compliant schema definitions', () => {
    const apiSchema = v.object({
      title: v.string(),
      createdAt: v.date(),
    });

    const openApi = generateOpenApiSchema(apiSchema);
    expect(openApi.type).toBe('object');
    expect(openApi.properties.createdAt).toEqual({ type: 'string', format: 'date-time' });
  });
});
