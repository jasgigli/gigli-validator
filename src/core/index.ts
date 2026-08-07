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
  let result: any;
  if (schema instanceof GigliSchema) {
    result = await schema.safeParseAsync(value);
  } else if (schema && typeof schema.safeParseAsync === 'function') {
    result = await schema.safeParseAsync(value);
  } else if (schema && typeof schema.parseAsync === 'function') {
    try {
      const data = await schema.parseAsync(value);
      result = { success: true, data };
    } catch (err: any) {
      result = { success: false, error: err };
    }
  } else {
    result = { success: true, data: value };
  }

  const isValid = result.success !== undefined ? result.success : true;
  const dataVal = result.data !== undefined ? result.data : result.value;
  const issuesList = result.error && result.error.issues ? result.error.issues.map((i: any) => i.message) : [];

  return {
    valid: isValid,
    value: dataVal,
    errors: issuesList,
    success: isValid,
    data: dataVal,
    error: result.error,
  };
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
