// Gigli: Core isomorphic engine exports

export { GigliError, GigliIssue } from './errors';
export { GigliSchema, SafeParseResult } from './schema';
export {
  containsXss,
  isDangerousKey,
  isMongoInjectionPayload,
  sanitizeHtml,
  sanitizeObjectKeys,
} from './security';
export {
  GigliAny,
  GigliArray,
  GigliBigInt,
  GigliBoolean,
  GigliDate,
  GigliDiscriminatedUnion,
  GigliEnum,
  GigliIntersection,
  GigliLazy,
  GigliLiteral,
  GigliNativeEnum,
  GigliNever,
  GigliNull,
  GigliNumber,
  GigliObject,
  GigliRecord,
  GigliString,
  GigliTuple,
  GigliUndefined,
  GigliUnion,
  GigliUnknown,
} from './validators';

export { Infer, infer, v, VFactory } from './builder';
export { middleware, validateForm } from './mern';

// Parser & Registry
export { parse } from './parser/ruleParser';

// Codegen & Schema generators
export { generateJsonSchema } from './codegen/jsonSchema';
export { generateOpenApiSchema } from './codegen/openApi';

// Decorators
export {
  getClassAST,
  Refine,
  Rule,
  ValidatedModel,
} from './decorators/validatedModel';

import { v } from './builder';
import { GigliSchema } from './schema';

/**
 * Top-level validate helper.
 */
export async function validate(schema: any, value: any) {
  if (schema instanceof GigliSchema) {
    return schema.safeParseAsync(value);
  }
  if (schema && typeof schema.parseAsync === 'function') {
    return schema.parseAsync(value);
  }
  return { valid: true, value };
}

// Function shorthand exports
export const object = v.object.bind(v);
export const string = v.string.bind(v);
export const number = v.number.bind(v);
export const boolean = v.boolean.bind(v);
export const date = v.date.bind(v);
export const array = v.array.bind(v);
export const any = v.any.bind(v);
export const from = v.from.bind(v);
