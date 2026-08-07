import { GigliSchema } from '../schema';
import {
  GigliArray,
  GigliBoolean,
  GigliDate,
  GigliNumber,
  GigliObject,
  GigliString,
} from '../validators';

export function generateJsonSchema(nodeOrSchema: any): any {
  if (!nodeOrSchema) return {};

  if (nodeOrSchema instanceof GigliString) {
    return { type: 'string' };
  }
  if (nodeOrSchema instanceof GigliNumber) {
    return { type: 'number' };
  }
  if (nodeOrSchema instanceof GigliBoolean) {
    return { type: 'boolean' };
  }
  if (nodeOrSchema instanceof GigliDate) {
    return { type: 'string', format: 'date-time' };
  }
  if (nodeOrSchema instanceof GigliObject) {
    const properties: Record<string, any> = {};
    const required: string[] = [];
    for (const key of Object.keys(nodeOrSchema.shape)) {
      const field = nodeOrSchema.shape[key];
      properties[key] = generateJsonSchema(field);
      required.push(key);
    }
    return {
      type: 'object',
      properties,
      required: required.length ? required : undefined,
    };
  }
  if (nodeOrSchema instanceof GigliArray) {
    return {
      type: 'array',
      items: generateJsonSchema(nodeOrSchema.elementSchema),
    };
  }

  // AST node fallbacks
  const node = typeof nodeOrSchema.toAST === 'function' ? nodeOrSchema.toAST() : nodeOrSchema;

  if (node.type === 'primitive') {
    let type: string = node.primitive;
    if (type === 'any') type = 'string';
    return { type };
  }
  if (node.type === 'object' && node.fields) {
    const properties: Record<string, any> = {};
    const required: string[] = [];
    for (const key in node.fields) {
      properties[key] = generateJsonSchema(node.fields[key]);
      required.push(key);
    }
    return {
      type: 'object',
      properties,
      required: required.length ? required : undefined,
    };
  }
  if (node.type === 'array' && node.element) {
    return {
      type: 'array',
      items: generateJsonSchema(node.element),
    };
  }

  return { type: 'object' };
}
