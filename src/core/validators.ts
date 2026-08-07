import { GigliIssue } from './errors';
import { GigliOptional, GigliSchema } from './schema';
import {
  containsXss,
  isDangerousKey,
  isMongoInjectionPayload,
  sanitizeHtml,
  sanitizeObjectKeys,
} from './security';

export interface StringCheck {
  kind: string;
  fn: (val: string) => boolean | string;
  message?: string;
  transform?: (val: string) => string;
}

export class GigliString extends GigliSchema<string> {
  private checks: StringCheck[] = [];

  _parse(input: unknown, path: (string | number)[]) {
    if (typeof input !== 'string') {
      return {
        issues: [
          {
            code: 'invalid_type',
            path,
            message: 'Expected string, received ' + (input === null ? 'null' : typeof input),
            expected: 'string',
            received: String(input),
          },
        ],
      };
    }

    const rawVal = input;
    let currentVal = input;
    const issues: GigliIssue[] = [];

    // Run string transformations (trim, lowerCase, upperCase, sanitize, etc.)
    for (const check of this.checks) {
      if (check.transform) {
        currentVal = check.transform(currentVal);
      }
    }

    // Evaluate string validation checks on currentVal (or rawVal for xss)
    for (const check of this.checks) {
      if (check.fn) {
        const valToCheck = check.kind === 'xss' ? rawVal : currentVal;
        const res = check.fn(valToCheck);
        if (res === false) {
          issues.push({
            code: check.kind,
            path,
            message: check.message || `Invalid string check: ${check.kind}`,
          });
        } else if (typeof res === 'string') {
          issues.push({
            code: check.kind,
            path,
            message: res,
          });
        }
      }
    }

    if (issues.length > 0) {
      return { issues };
    }
    return { value: currentVal, issues: [] };
  }

  min(length: number, message?: string): this {
    this.checks.push({
      kind: 'min',
      fn: (val) => val.length >= length,
      message: message || `String must contain at least ${length} character(s)`,
    });
    return this;
  }

  max(length: number, message?: string): this {
    this.checks.push({
      kind: 'max',
      fn: (val) => val.length <= length,
      message: message || `String must contain at most ${length} character(s)`,
    });
    return this;
  }

  length(length: number, message?: string): this {
    this.checks.push({
      kind: 'length',
      fn: (val) => val.length === length,
      message: message || `String must be exactly ${length} character(s)`,
    });
    return this;
  }

  email(message?: string): this {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    this.checks.push({
      kind: 'email',
      fn: (val) => emailRegex.test(val),
      message: message || 'Invalid email address',
    });
    return this;
  }

  url(message?: string): this {
    this.checks.push({
      kind: 'url',
      fn: (val) => {
        try {
          new URL(val);
          return true;
        } catch {
          return false;
        }
      },
      message: message || 'Invalid URL',
    });
    return this;
  }

  uuid(message?: string): this {
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
    this.checks.push({
      kind: 'uuid',
      fn: (val) => uuidRegex.test(val),
      message: message || 'Invalid UUID',
    });
    return this;
  }

  objectId(message?: string): this {
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    this.checks.push({
      kind: 'objectId',
      fn: (val) => objectIdRegex.test(val),
      message: message || 'Invalid MongoDB ObjectId',
    });
    return this;
  }

  alphanumeric(message?: string): this {
    const alphaRegex = /^[a-zA-Z0-9]+$/;
    this.checks.push({
      kind: 'alphanumeric',
      fn: (val) => alphaRegex.test(val),
      message: message || 'String must contain only letters and numbers',
    });
    return this;
  }

  regex(pattern: RegExp, message?: string): this {
    this.checks.push({
      kind: 'regex',
      fn: (val) => pattern.test(val),
      message: message || 'String does not match pattern',
    });
    return this;
  }

  trim(): this {
    this.checks.push({
      kind: 'trim',
      fn: () => true,
      transform: (val) => val.trim(),
    });
    return this;
  }

  toLowerCase(): this {
    this.checks.push({
      kind: 'toLowerCase',
      fn: () => true,
      transform: (val) => val.toLowerCase(),
    });
    return this;
  }

  toUpperCase(): this {
    this.checks.push({
      kind: 'toUpperCase',
      fn: () => true,
      transform: (val) => val.toUpperCase(),
    });
    return this;
  }

  xss(message?: string): this {
    this.checks.push({
      kind: 'xss',
      fn: (val) => !containsXss(val),
      message: message || 'Security violation: Potential XSS script injection detected',
    });
    return this;
  }

  sanitize(): this {
    this.checks.push({
      kind: 'sanitize',
      fn: () => true,
      transform: (val) => sanitizeHtml(val),
    });
    return this;
  }

  mongoInjection(message?: string): this {
    this.checks.push({
      kind: 'mongoInjection',
      fn: (val) => !val.startsWith('$'),
      message: message || 'Security violation: NoSQL operator injection detected',
    });
    return this;
  }
}

export interface NumberCheck {
  kind: string;
  fn: (val: number) => boolean;
  message?: string;
}

export class GigliNumber extends GigliSchema<number> {
  private checks: NumberCheck[] = [];

  _parse(input: unknown, path: (string | number)[]) {
    if (typeof input !== 'number' || Number.isNaN(input)) {
      return {
        issues: [
          {
            code: 'invalid_type',
            path,
            message: 'Expected number, received ' + (Number.isNaN(input) ? 'NaN' : typeof input),
            expected: 'number',
            received: String(input),
          },
        ],
      };
    }

    const issues: GigliIssue[] = [];
    for (const check of this.checks) {
      if (!check.fn(input)) {
        issues.push({
          code: check.kind,
          path,
          message: check.message || `Invalid number check: ${check.kind}`,
        });
      }
    }

    if (issues.length > 0) {
      return { issues };
    }
    return { value: input, issues: [] };
  }

  min(value: number, message?: string): this {
    this.checks.push({
      kind: 'min',
      fn: (val) => val >= value,
      message: message || `Number must be greater than or equal to ${value}`,
    });
    return this;
  }

  max(value: number, message?: string): this {
    this.checks.push({
      kind: 'max',
      fn: (val) => val <= value,
      message: message || `Number must be less than or equal to ${value}`,
    });
    return this;
  }

  int(message?: string): this {
    this.checks.push({
      kind: 'int',
      fn: (val) => Number.isInteger(val),
      message: message || 'Expected integer',
    });
    return this;
  }

  positive(message?: string): this {
    this.checks.push({
      kind: 'positive',
      fn: (val) => val > 0,
      message: message || 'Number must be positive',
    });
    return this;
  }

  negative(message?: string): this {
    this.checks.push({
      kind: 'negative',
      fn: (val) => val < 0,
      message: message || 'Number must be negative',
    });
    return this;
  }

  nonnegative(message?: string): this {
    this.checks.push({
      kind: 'nonnegative',
      fn: (val) => val >= 0,
      message: message || 'Number must be non-negative',
    });
    return this;
  }

  nonpositive(message?: string): this {
    this.checks.push({
      kind: 'nonpositive',
      fn: (val) => val <= 0,
      message: message || 'Number must be non-positive',
    });
    return this;
  }

  multipleOf(step: number, message?: string): this {
    this.checks.push({
      kind: 'multipleOf',
      fn: (val) => val % step === 0,
      message: message || `Number must be a multiple of ${step}`,
    });
    return this;
  }

  finite(message?: string): this {
    this.checks.push({
      kind: 'finite',
      fn: (val) => Number.isFinite(val),
      message: message || 'Number must be finite',
    });
    return this;
  }
}

export class GigliBoolean extends GigliSchema<boolean> {
  _parse(input: unknown, path: (string | number)[]) {
    if (typeof input !== 'boolean') {
      return {
        issues: [
          {
            code: 'invalid_type',
            path,
            message: 'Expected boolean, received ' + typeof input,
            expected: 'boolean',
            received: String(input),
          },
        ],
      };
    }
    return { value: input, issues: [] };
  }
}

export class GigliDate extends GigliSchema<Date> {
  private minDate?: Date;
  private minMsg?: string;
  private maxDate?: Date;
  private maxMsg?: string;

  _parse(input: unknown, path: (string | number)[]) {
    let d: Date;
    if (input instanceof Date) {
      d = input;
    } else if (typeof input === 'string' || typeof input === 'number') {
      d = new Date(input);
    } else {
      return {
        issues: [
          {
            code: 'invalid_type',
            path,
            message: 'Expected Date instance or date string, received ' + typeof input,
            expected: 'Date',
            received: String(input),
          },
        ],
      };
    }

    if (Number.isNaN(d.getTime())) {
      return {
        issues: [
          {
            code: 'invalid_date',
            path,
            message: 'Invalid date value',
          },
        ],
      };
    }

    if (this.minDate && d < this.minDate) {
      return {
        issues: [
          {
            code: 'min_date',
            path,
            message: this.minMsg || `Date must be after or on ${this.minDate.toISOString()}`,
          },
        ],
      };
    }

    if (this.maxDate && d > this.maxDate) {
      return {
        issues: [
          {
            code: 'max_date',
            path,
            message: this.maxMsg || `Date must be before or on ${this.maxDate.toISOString()}`,
          },
        ],
      };
    }

    return { value: d, issues: [] };
  }

  min(date: Date, message?: string): this {
    this.minDate = date;
    this.minMsg = message;
    return this;
  }

  max(date: Date, message?: string): this {
    this.maxDate = date;
    this.maxMsg = message;
    return this;
  }
}

export class GigliBigInt extends GigliSchema<bigint> {
  _parse(input: unknown, path: (string | number)[]) {
    if (typeof input !== 'bigint') {
      return {
        issues: [
          {
            code: 'invalid_type',
            path,
            message: 'Expected bigint, received ' + typeof input,
            expected: 'bigint',
            received: String(input),
          },
        ],
      };
    }
    return { value: input, issues: [] };
  }
}

export class GigliLiteral<T extends string | number | boolean | null | undefined> extends GigliSchema<T> {
  constructor(public value: T) {
    super();
  }

  _parse(input: unknown, path: (string | number)[]) {
    if (input !== this.value) {
      return {
        issues: [
          {
            code: 'invalid_literal',
            path,
            message: `Expected literal value ${JSON.stringify(this.value)}, received ${JSON.stringify(input)}`,
            expected: String(this.value),
            received: String(input),
          },
        ],
      };
    }
    return { value: this.value, issues: [] };
  }
}

export class GigliEnum<T extends readonly [string, ...string[]]> extends GigliSchema<T[number]> {
  constructor(public values: T) {
    super();
  }

  _parse(input: unknown, path: (string | number)[]) {
    if (typeof input !== 'string' || !this.values.includes(input as any)) {
      return {
        issues: [
          {
            code: 'invalid_enum',
            path,
            message: `Expected one of [${this.values.join(', ')}], received ${JSON.stringify(input)}`,
            expected: this.values.join(' | '),
            received: String(input),
          },
        ],
      };
    }
    return { value: input as T[number], issues: [] };
  }
}

export class GigliNativeEnum<T extends Record<string, string | number>> extends GigliSchema<T[keyof T]> {
  constructor(public enumObj: T) {
    super();
  }

  _parse(input: unknown, path: (string | number)[]) {
    const validValues = Object.values(this.enumObj);
    if (!validValues.includes(input as any)) {
      return {
        issues: [
          {
            code: 'invalid_native_enum',
            path,
            message: `Invalid enum value. Expected one of [${validValues.join(', ')}], received ${JSON.stringify(input)}`,
          },
        ],
      };
    }
    return { value: input as T[keyof T], issues: [] };
  }
}

export type ObjectShape = Record<string, GigliSchema<any>>;

export class GigliObject<Shape extends ObjectShape> extends GigliSchema<{
  [K in keyof Shape]: Shape[K]['_type'];
}> {
  private mode: 'strip' | 'strict' | 'passthrough' = 'strip';
  private noSqlSecurity = false;

  constructor(public shape: Shape) {
    super();
  }

  strict(): this {
    this.mode = 'strict';
    return this;
  }

  strip(): this {
    this.mode = 'strip';
    return this;
  }

  passthrough(): this {
    this.mode = 'passthrough';
    return this;
  }

  noSqlGuard(): this {
    this.noSqlSecurity = true;
    return this;
  }

  extend<NewShape extends ObjectShape>(newShape: NewShape): GigliObject<Shape & NewShape> {
    return new GigliObject({ ...this.shape, ...newShape });
  }

  merge<OtherShape extends ObjectShape>(other: GigliObject<OtherShape>): GigliObject<Shape & OtherShape> {
    return new GigliObject({ ...this.shape, ...other.shape });
  }

  pick<K extends keyof Shape>(...keys: K[]): GigliObject<Pick<Shape, K>> {
    const newShape: any = {};
    for (const key of keys) {
      if (key in this.shape) {
        newShape[key] = this.shape[key];
      }
    }
    return new GigliObject(newShape);
  }

  omit<K extends keyof Shape>(...keys: K[]): GigliObject<Omit<Shape, K>> {
    const newShape: any = { ...this.shape };
    for (const key of keys) {
      delete newShape[key];
    }
    return new GigliObject(newShape);
  }

  partial(): GigliObject<{ [K in keyof Shape]: GigliSchema<Shape[K]['_type'] | undefined> }> {
    const newShape: any = {};
    for (const key in this.shape) {
      newShape[key] = this.shape[key].optional();
    }
    return new GigliObject(newShape);
  }

  _parse(input: unknown, path: (string | number)[]) {
    if (input === null || typeof input !== 'object' || Array.isArray(input)) {
      return {
        issues: [
          {
            code: 'invalid_type',
            path,
            message: 'Expected object, received ' + (input === null ? 'null' : typeof input),
            expected: 'object',
            received: String(input),
          },
        ],
      };
    }

    if (this.noSqlSecurity && isMongoInjectionPayload(input)) {
      return {
        issues: [
          {
            code: 'security_nosql',
            path,
            message: 'Security violation: NoSQL injection operator payload detected in object input',
          },
        ],
      };
    }

    const inputObj = input as Record<string, any>;
    const output: Record<string, any> = {};
    const issues: GigliIssue[] = [];

    // Prototype pollution guard
    for (const key of Object.keys(inputObj)) {
      if (isDangerousKey(key) && this.mode === 'strict') {
        issues.push({
          code: 'security_prototype_pollution',
          path: [...path, key],
          message: `Security violation: Forbidden property '${key}' detected`,
        });
      }
    }

    const shapeKeys = Object.keys(this.shape);
    const inputKeys = Object.keys(inputObj);

    // Validate shape fields
    let hasAsync = false;
    const promises: Promise<any>[] = [];

    for (const key of shapeKeys) {
      const schema = this.shape[key];
      const val = inputObj[key];
      const res = schema._parse(val, [...path, key]);

      if (res instanceof Promise) {
        hasAsync = true;
        promises.push(
          res.then((resolved) => {
            if (resolved.issues.length > 0) {
              issues.push(...resolved.issues);
            } else if (resolved.value !== undefined) {
              output[key] = resolved.value;
            }
          })
        );
      } else {
        if (res.issues.length > 0) {
          issues.push(...res.issues);
        } else if (res.value !== undefined) {
          output[key] = res.value;
        }
      }
    }

    // Handle unknown keys based on mode
    for (const key of inputKeys) {
      if (!shapeKeys.includes(key) && !isDangerousKey(key)) {
        if (this.mode === 'strict') {
          issues.push({
            code: 'unrecognized_keys',
            path: [...path, key],
            message: `Unrecognized key '${key}' in object`,
          });
        } else if (this.mode === 'passthrough') {
          output[key] = inputObj[key];
        }
      }
    }

    if (hasAsync) {
      return Promise.all(promises).then(() => {
        if (issues.length > 0) return { issues };
        return { value: output as any, issues: [] };
      });
    }

    if (issues.length > 0) return { issues };
    return { value: output as any, issues: [] };
  }
}

export class GigliArray<ElementSchema extends GigliSchema<any>> extends GigliSchema<
  ElementSchema['_type'][]
> {
  private minLength?: number;
  private maxLength?: number;
  private isUnique = false;

  constructor(public elementSchema: ElementSchema) {
    super();
  }

  min(length: number, message?: string): this {
    this.minLength = length;
    return this;
  }

  max(length: number, message?: string): this {
    this.maxLength = length;
    return this;
  }

  length(length: number, message?: string): this {
    this.minLength = length;
    this.maxLength = length;
    return this;
  }

  nonempty(message?: string): this {
    this.minLength = 1;
    return this;
  }

  unique(): this {
    this.isUnique = true;
    return this;
  }

  _parse(input: unknown, path: (string | number)[]) {
    if (!Array.isArray(input)) {
      return {
        issues: [
          {
            code: 'invalid_type',
            path,
            message: 'Expected array, received ' + typeof input,
            expected: 'array',
            received: String(input),
          },
        ],
      };
    }

    const issues: GigliIssue[] = [];
    if (this.minLength !== undefined && input.length < this.minLength) {
      issues.push({
        code: 'too_small',
        path,
        message: `Array must contain at least ${this.minLength} element(s)`,
      });
    }
    if (this.maxLength !== undefined && input.length > this.maxLength) {
      issues.push({
        code: 'too_big',
        path,
        message: `Array must contain at most ${this.maxLength} element(s)`,
      });
    }

    if (this.isUnique) {
      const seen = new Set();
      for (const item of input) {
        const key = typeof item === 'object' ? JSON.stringify(item) : item;
        if (seen.has(key)) {
          issues.push({
            code: 'duplicate_element',
            path,
            message: 'Array elements must be unique',
          });
          break;
        }
        seen.add(key);
      }
    }

    const output: any[] = [];
    let hasAsync = false;
    const promises: Promise<any>[] = [];

    for (let i = 0; i < input.length; i++) {
      const res = this.elementSchema._parse(input[i], [...path, i]);
      if (res instanceof Promise) {
        hasAsync = true;
        promises.push(
          res.then((resolved) => {
            if (resolved.issues.length > 0) {
              issues.push(...resolved.issues);
            } else {
              output[i] = resolved.value;
            }
          })
        );
      } else {
        if (res.issues.length > 0) {
          issues.push(...res.issues);
        } else {
          output[i] = res.value;
        }
      }
    }

    if (hasAsync) {
      return Promise.all(promises).then(() => {
        if (issues.length > 0) return { issues };
        return { value: output, issues: [] };
      });
    }

    if (issues.length > 0) return { issues };
    return { value: output, issues: [] };
  }
}

export class GigliTuple<T extends [GigliSchema<any>, ...GigliSchema<any>[]]> extends GigliSchema<{
  [K in keyof T]: T[K] extends GigliSchema<any> ? T[K]['_type'] : never;
}> {
  constructor(public schemas: T) {
    super();
  }

  _parse(input: unknown, path: (string | number)[]) {
    if (!Array.isArray(input)) {
      return {
        issues: [
          {
            code: 'invalid_type',
            path,
            message: 'Expected tuple array, received ' + typeof input,
          },
        ],
      };
    }

    if (input.length !== this.schemas.length) {
      return {
        issues: [
          {
            code: 'invalid_tuple_length',
            path,
            message: `Expected tuple of length ${this.schemas.length}, received array of length ${input.length}`,
          },
        ],
      };
    }

    const output: any[] = [];
    const issues: GigliIssue[] = [];

    for (let i = 0; i < this.schemas.length; i++) {
      const res = this.schemas[i]._parse(input[i], [...path, i]);
      if (res instanceof Promise) {
        throw new Error('Async tuple element parsing not supported in sync parse');
      }
      if (res.issues.length > 0) {
        issues.push(...res.issues);
      } else {
        output[i] = res.value;
      }
    }

    if (issues.length > 0) return { issues };
    return { value: output as any, issues: [] };
  }
}

export class GigliRecord<KeySchema extends GigliSchema<any>, ValueSchema extends GigliSchema<any>> extends GigliSchema<
  Record<string, ValueSchema['_type']>
> {
  constructor(public keySchema: KeySchema, public valueSchema: ValueSchema) {
    super();
  }

  _parse(input: unknown, path: (string | number)[]) {
    if (input === null || typeof input !== 'object' || Array.isArray(input)) {
      return {
        issues: [
          {
            code: 'invalid_type',
            path,
            message: 'Expected record object, received ' + typeof input,
          },
        ],
      };
    }

    const inputObj = input as Record<string, any>;
    const output: Record<string, any> = {};
    const issues: GigliIssue[] = [];

    for (const key of Object.keys(inputObj)) {
      if (isDangerousKey(key)) continue;

      const keyRes = this.keySchema._parse(key, [...path, key]);
      const valRes = this.valueSchema._parse(inputObj[key], [...path, key]);

      if (keyRes instanceof Promise || valRes instanceof Promise) {
        throw new Error('Async record schema parsing not supported in sync parse');
      }

      if (keyRes.issues.length > 0) {
        issues.push(...keyRes.issues);
      }
      if (valRes.issues.length > 0) {
        issues.push(...valRes.issues);
      }

      if (keyRes.issues.length === 0 && valRes.issues.length === 0) {
        output[keyRes.value!] = valRes.value;
      }
    }

    if (issues.length > 0) return { issues };
    return { value: output as any, issues: [] };
  }
}

export class GigliUnion<T extends [GigliSchema<any>, ...GigliSchema<any>[]]> extends GigliSchema<
  T[number]['_type']
> {
  constructor(public options: T) {
    super();
  }

  _parse(input: unknown, path: (string | number)[]) {
    const allIssues: GigliIssue[] = [];

    for (const option of this.options) {
      const res = option._parse(input, path);
      if (res instanceof Promise) {
        throw new Error('Async union options not supported in sync parse');
      }
      if (res.issues.length === 0) {
        return { value: res.value, issues: [] };
      }
      allIssues.push(...res.issues);
    }

    return {
      issues: [
        {
          code: 'invalid_union',
          path,
          message: 'Input did not match any union option',
        },
      ],
    };
  }
}

export class GigliDiscriminatedUnion<
  Discriminator extends string,
  Options extends GigliObject<any>[]
> extends GigliSchema<Options[number]['_type']> {
  constructor(public discriminator: Discriminator, public options: Options) {
    super();
  }

  _parse(input: unknown, path: (string | number)[]) {
    if (input === null || typeof input !== 'object' || Array.isArray(input)) {
      return {
        issues: [
          {
            code: 'invalid_type',
            path,
            message: 'Expected object for discriminated union',
          },
        ],
      };
    }

    const discValue = (input as any)[this.discriminator];
    if (discValue === undefined) {
      return {
        issues: [
          {
            code: 'missing_discriminator',
            path: [...path, this.discriminator],
            message: `Missing discriminator key '${this.discriminator}'`,
          },
        ],
      };
    }

    const matchingOption = this.options.find((opt) => {
      const schemaField = opt.shape[this.discriminator];
      if (schemaField instanceof GigliLiteral) {
        return schemaField.value === discValue;
      }
      return false;
    });

    if (!matchingOption) {
      return {
        issues: [
          {
            code: 'invalid_discriminator',
            path: [...path, this.discriminator],
            message: `Invalid discriminator value '${discValue}'`,
          },
        ],
      };
    }

    return matchingOption._parse(input, path);
  }
}

export class GigliIntersection<A extends GigliSchema<any>, B extends GigliSchema<any>> extends GigliSchema<
  A['_type'] & B['_type']
> {
  constructor(public left: A, public right: B) {
    super();
  }

  _parse(input: unknown, path: (string | number)[]) {
    const resA = this.left._parse(input, path);
    const resB = this.right._parse(input, path);

    if (resA instanceof Promise || resB instanceof Promise) {
      throw new Error('Async intersection not supported in sync parse');
    }

    const issues: GigliIssue[] = [...resA.issues, ...resB.issues];
    if (issues.length > 0) {
      return { issues };
    }

    if (typeof resA.value === 'object' && typeof resB.value === 'object') {
      return { value: { ...resA.value, ...resB.value }, issues: [] };
    }

    return { value: resB.value, issues: [] };
  }
}

export class GigliLazy<T extends GigliSchema<any>> extends GigliSchema<T['_type']> {
  constructor(public getter: () => T) {
    super();
  }

  _parse(input: unknown, path: (string | number)[]) {
    return this.getter()._parse(input, path);
  }
}

export class GigliAny extends GigliSchema<any> {
  _parse(input: unknown) {
    return { value: input, issues: [] };
  }
}

export class GigliUnknown extends GigliSchema<unknown> {
  _parse(input: unknown) {
    return { value: input, issues: [] };
  }
}

export class GigliNever extends GigliSchema<never> {
  _parse(input: unknown, path: (string | number)[]) {
    return {
      issues: [
        {
          code: 'invalid_type',
          path,
          message: 'Expected never, received input',
        },
      ],
    };
  }
}

export class GigliNull extends GigliSchema<null> {
  _parse(input: unknown, path: (string | number)[]) {
    if (input !== null) {
      return {
        issues: [
          {
            code: 'invalid_type',
            path,
            message: 'Expected null, received ' + typeof input,
          },
        ],
      };
    }
    return { value: null, issues: [] };
  }
}

export class GigliUndefined extends GigliSchema<undefined> {
  _parse(input: unknown, path: (string | number)[]) {
    if (input !== undefined) {
      return {
        issues: [
          {
            code: 'invalid_type',
            path,
            message: 'Expected undefined, received ' + typeof input,
          },
        ],
      };
    }
    return { value: undefined, issues: [] };
  }
}
