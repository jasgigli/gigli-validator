import { describe, expect, it } from 'vitest';
import { GigliError, v } from '../../src';

describe('Unit Testing: Complex Structural Validators', () => {
  describe('GigliObject', () => {
    it('validates nested object schemas', () => {
      const userSchema = v.object({
        name: v.string().min(2),
        age: v.number().min(18),
        address: v.object({
          city: v.string(),
          zip: v.string().length(5),
        }),
      });

      const validUser = {
        name: 'Alice',
        age: 30,
        address: { city: 'New York', zip: '10001' },
      };

      expect(userSchema.parse(validUser)).toEqual(validUser);
    });

    it('supports strip, strict, and passthrough modes', () => {
      const schema = v.object({ a: v.string() });

      // Default strip mode
      expect(schema.parse({ a: 'hello', extra: 'ignored' })).toEqual({ a: 'hello' });

      // Strict mode
      const strictSchema = v.object({ a: v.string() }).strict();
      expect(() => strictSchema.parse({ a: 'hello', extra: 'error' })).toThrow(GigliError);

      // Passthrough mode
      const passSchema = v.object({ a: v.string() }).passthrough();
      expect(passSchema.parse({ a: 'hello', extra: 'kept' })).toEqual({ a: 'hello', extra: 'kept' });
    });

    it('supports pick, omit, extend, merge, and partial', () => {
      const base = v.object({ a: v.string(), b: v.number(), c: v.boolean() });

      // Pick
      const picked = base.pick('a', 'b');
      expect(picked.parse({ a: 'x', b: 10 })).toEqual({ a: 'x', b: 10 });

      // Omit
      const omitted = base.omit('c');
      expect(omitted.parse({ a: 'y', b: 20 })).toEqual({ a: 'y', b: 20 });

      // Extend & Merge
      const extended = base.extend({ d: v.string() });
      expect(extended.parse({ a: 'z', b: 30, c: true, d: 'new' })).toEqual({ a: 'z', b: 30, c: true, d: 'new' });

      // Partial
      const partialObj = base.partial();
      expect(partialObj.parse({ a: 'only_a' })).toEqual({ a: 'only_a' });
    });
  });

  describe('GigliArray & GigliTuple & GigliRecord', () => {
    it('validates element types, min/max length, and uniqueness of arrays', () => {
      const arraySchema = v.array(v.string().min(2)).min(1).max(3).unique();
      expect(arraySchema.parse(['apple', 'banana'])).toEqual(['apple', 'banana']);

      // Duplicate elements
      expect(() => arraySchema.parse(['apple', 'apple'])).toThrow(GigliError);
      // Under min length
      expect(() => arraySchema.parse([])).toThrow(GigliError);
    });

    it('validates positional element types in tuple', () => {
      const tupleSchema = v.tuple([v.string(), v.number(), v.boolean()]);
      expect(tupleSchema.parse(['ID-1', 42, true])).toEqual(['ID-1', 42, true]);
      expect(() => tupleSchema.parse(['ID-1', 'not-a-number', true])).toThrow(GigliError);
    });

    it('validates dynamic key-value records', () => {
      const recordSchema = v.record(v.number());
      expect(recordSchema.parse({ item1: 100, item2: 250 })).toEqual({ item1: 100, item2: 250 });
      expect(() => recordSchema.parse({ item1: 'invalid' })).toThrow(GigliError);
    });
  });

  describe('Unions, Discriminated Unions, and Intersections', () => {
    it('validates standard union options', () => {
      const unionSchema = v.union([v.string(), v.number()]);
      expect(unionSchema.parse('text')).toBe('text');
      expect(unionSchema.parse(100)).toBe(100);
      expect(() => unionSchema.parse(true)).toThrow(GigliError);
    });

    it('validates discriminated union options efficiently', () => {
      const circle = v.object({ kind: v.literal('circle'), radius: v.number() });
      const square = v.object({ kind: v.literal('square'), size: v.number() });
      const shapeSchema = v.discriminatedUnion('kind', [circle, square]);

      expect(shapeSchema.parse({ kind: 'circle', radius: 10 })).toEqual({ kind: 'circle', radius: 10 });
      expect(shapeSchema.parse({ kind: 'square', size: 4 })).toEqual({ kind: 'square', size: 4 });
      expect(() => shapeSchema.parse({ kind: 'triangle', side: 3 })).toThrow(GigliError);
    });

    it('validates intersection of schemas', () => {
      const person = v.object({ name: v.string() });
      const worker = v.object({ role: v.string() });
      const employee = v.intersection(person, worker);

      expect(employee.parse({ name: 'Bob', role: 'Engineer' })).toEqual({ name: 'Bob', role: 'Engineer' });
      expect(() => employee.parse({ name: 'Bob' })).toThrow(GigliError);
    });
  });
});
