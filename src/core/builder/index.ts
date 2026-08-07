import { middleware, validateForm } from '../mern';
import { GigliSchema } from '../schema';
import {
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
  ObjectShape,
} from '../validators';

export type Infer<T extends GigliSchema<any>> = T['_type'];
export type infer<T extends GigliSchema<any>> = Infer<T>;

export class VFactory {
  // Infer helper
  public infer = undefined as any;

  string(): GigliString {
    return new GigliString();
  }

  number(): GigliNumber {
    return new GigliNumber();
  }

  boolean(): GigliBoolean {
    return new GigliBoolean();
  }

  date(): GigliDate {
    return new GigliDate();
  }

  bigint(): GigliBigInt {
    return new GigliBigInt();
  }

  null(): GigliNull {
    return new GigliNull();
  }

  undefined(): GigliUndefined {
    return new GigliUndefined();
  }

  any(): GigliAny {
    return new GigliAny();
  }

  unknown(): GigliUnknown {
    return new GigliUnknown();
  }

  never(): GigliNever {
    return new GigliNever();
  }

  literal<T extends string | number | boolean | null | undefined>(value: T): GigliLiteral<T> {
    return new GigliLiteral(value);
  }

  enum<T extends readonly [string, ...string[]]>(values: T): GigliEnum<T> {
    return new GigliEnum(values);
  }

  nativeEnum<T extends Record<string, string | number>>(enumObj: T): GigliNativeEnum<T> {
    return new GigliNativeEnum(enumObj);
  }

  objectId(): GigliString {
    return new GigliString().objectId();
  }

  object<Shape extends ObjectShape>(shape: Shape): GigliObject<Shape> {
    return new GigliObject(shape);
  }

  array<ElementSchema extends GigliSchema<any>>(elementSchema: ElementSchema): GigliArray<ElementSchema> {
    return new GigliArray(elementSchema);
  }

  tuple<T extends [GigliSchema<any>, ...GigliSchema<any>[]]>(schemas: T): GigliTuple<T> {
    return new GigliTuple(schemas);
  }

  record<ValSchema extends GigliSchema<any>>(
    valueSchema: ValSchema
  ): GigliRecord<GigliSchema<any>, ValSchema>;
  record<KeySchema extends GigliSchema<any>, ValSchema extends GigliSchema<any>>(
    keySchema: KeySchema,
    valueSchema: ValSchema
  ): GigliRecord<KeySchema, ValSchema>;
  record(
    keyOrValSchema: GigliSchema<any>,
    valSchema?: GigliSchema<any>
  ): GigliRecord<any, any> {
    if (valSchema) {
      return new GigliRecord(keyOrValSchema as any, valSchema);
    }
    return new GigliRecord(new GigliString(), keyOrValSchema);
  }

  union<T extends [GigliSchema<any>, ...GigliSchema<any>[]]>(options: T): GigliUnion<T> {
    return new GigliUnion(options);
  }

  discriminatedUnion<Discriminator extends string, Options extends GigliObject<any>[]>(
    discriminator: Discriminator,
    options: Options
  ): GigliDiscriminatedUnion<Discriminator, Options> {
    return new GigliDiscriminatedUnion(discriminator, options);
  }

  intersection<A extends GigliSchema<any>, B extends GigliSchema<any>>(
    left: A,
    right: B
  ): GigliIntersection<A, B> {
    return new GigliIntersection(left, right);
  }

  lazy<T extends GigliSchema<any>>(getter: () => T): GigliLazy<T> {
    return new GigliLazy(getter);
  }

  /**
   * String rule parser for declarative validation strings.
   * Example: v.from("string|email|min:5")
   */
  from(ruleString: string): GigliSchema<any> {
    const parts = ruleString.split('|').map((s) => s.trim());
    let schema: any;

    const first = parts[0];
    if (first === 'number') {
      schema = new GigliNumber();
    } else if (first === 'boolean') {
      schema = new GigliBoolean();
    } else if (first === 'date') {
      schema = new GigliDate();
    } else {
      schema = new GigliString();
      if (first === 'email') schema.email();
    }

    const startIndex = (first === 'string' || first === 'number' || first === 'boolean' || first === 'date') ? 1 : 0;

    for (let i = startIndex; i < parts.length; i++) {
      const part = parts[i];
      const [ruleName, paramVal] = part.split(':').map((s) => s.trim());

      if (schema instanceof GigliString) {
        if (ruleName === 'email') schema.email();
        else if (ruleName === 'min' && paramVal) schema.min(Number(paramVal));
        else if (ruleName === 'max' && paramVal) schema.max(Number(paramVal));
        else if (ruleName === 'trim') schema.trim();
        else if (ruleName === 'lowercase') schema.toLowerCase();
        else if (ruleName === 'uppercase') schema.toUpperCase();
        else if (ruleName === 'xss') schema.xss();
        else if (ruleName === 'sanitize') schema.sanitize();
        else if (ruleName === 'objectId') schema.objectId();
      } else if (schema instanceof GigliNumber) {
        if (ruleName === 'min' && paramVal) schema.min(Number(paramVal));
        else if (ruleName === 'max' && paramVal) schema.max(Number(paramVal));
        else if (ruleName === 'int') schema.int();
        else if (ruleName === 'positive') schema.positive();
      }
    }

    return schema;
  }

  // Isomorphic MERN stack helpers
  middleware = middleware;
  validateForm = validateForm;
}

export const v = new VFactory();

// Backward compatibility builder aliases
export { GigliArray as ArrayBuilder, GigliObject as ObjectBuilder, GigliString as PrimitiveBuilder };
