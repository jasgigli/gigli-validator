import { describe, expect, it } from 'vitest';
import { GigliError, v } from '../../src';

describe('Unit Testing: Core Primitive Validators', () => {
  describe('GigliString', () => {
    it('validates string type', () => {
      const schema = v.string();
      expect(schema.parse('hello')).toBe('hello');
      expect(() => schema.parse(123)).toThrow(GigliError);
    });

    it('validates min and max length', () => {
      const schema = v.string().min(3).max(5);
      expect(schema.parse('abc')).toBe('abc');
      expect(schema.parse('abcde')).toBe('abcde');
      expect(() => schema.parse('ab')).toThrow(GigliError);
      expect(() => schema.parse('abcdef')).toThrow(GigliError);
    });

    it('validates exact length', () => {
      const schema = v.string().length(4);
      expect(schema.parse('code')).toBe('code');
      expect(() => schema.parse('cod')).toThrow(GigliError);
    });

    it('validates email format', () => {
      const schema = v.string().email();
      expect(schema.parse('user@example.com')).toBe('user@example.com');
      expect(() => schema.parse('invalid-email')).toThrow(GigliError);
    });

    it('validates URL format', () => {
      const schema = v.string().url();
      expect(schema.parse('https://example.com')).toBe('https://example.com');
      expect(() => schema.parse('not-a-url')).toThrow(GigliError);
    });

    it('validates UUID and MongoDB ObjectId format', () => {
      const uuidSchema = v.string().uuid();
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      expect(uuidSchema.parse(validUuid)).toBe(validUuid);
      expect(() => uuidSchema.parse('invalid-uuid')).toThrow(GigliError);

      const objectIdSchema = v.objectId();
      const validObjectId = '507f1f77bcf86cd799439011';
      expect(objectIdSchema.parse(validObjectId)).toBe(validObjectId);
      expect(() => objectIdSchema.parse('invalid-id')).toThrow(GigliError);
    });

    it('applies string transformations: trim, toLowerCase, toUpperCase', () => {
      const schema = v.string().trim().toLowerCase();
      expect(schema.parse('  HELLO WORLD  ')).toBe('hello world');

      const upperSchema = v.string().trim().toUpperCase();
      expect(upperSchema.parse('  hello  ')).toBe('HELLO');
    });
  });

  describe('GigliNumber', () => {
    it('validates number type and min/max boundaries', () => {
      const schema = v.number().min(10).max(100);
      expect(schema.parse(50)).toBe(50);
      expect(() => schema.parse(9)).toThrow(GigliError);
      expect(() => schema.parse(101)).toThrow(GigliError);
      expect(() => schema.parse('50')).toThrow(GigliError);
    });

    it('validates integers, positive, negative, and multipleOf', () => {
      const intSchema = v.number().int().positive().multipleOf(5);
      expect(intSchema.parse(15)).toBe(15);
      expect(() => intSchema.parse(15.5)).toThrow(GigliError);
      expect(() => intSchema.parse(-10)).toThrow(GigliError);
      expect(() => intSchema.parse(13)).toThrow(GigliError);
    });
  });

  describe('GigliBoolean & GigliDate & GigliBigInt', () => {
    it('validates boolean type', () => {
      const schema = v.boolean();
      expect(schema.parse(true)).toBe(true);
      expect(schema.parse(false)).toBe(false);
      expect(() => schema.parse('true')).toThrow(GigliError);
    });

    it('validates Date instances and date string parsing', () => {
      const schema = v.date();
      const now = new Date();
      expect(schema.parse(now)).toEqual(now);
      expect(schema.parse(now.toISOString())).toBeInstanceOf(Date);
      expect(() => schema.parse('invalid-date')).toThrow(GigliError);
    });

    it('validates BigInt type', () => {
      const schema = v.bigint();
      expect(schema.parse(BigInt(100))).toBe(BigInt(100));
      expect(() => schema.parse(100)).toThrow(GigliError);
    });
  });

  describe('GigliLiteral & GigliEnum', () => {
    it('validates literal values', () => {
      const schema = v.literal('ADMIN');
      expect(schema.parse('ADMIN')).toBe('ADMIN');
      expect(() => schema.parse('USER')).toThrow(GigliError);
    });

    it('validates tuple enum values', () => {
      const schema = v.enum(['RED', 'GREEN', 'BLUE']);
      expect(schema.parse('GREEN')).toBe('GREEN');
      expect(() => schema.parse('YELLOW')).toThrow(GigliError);
    });

    it('validates TypeScript native enums', () => {
      enum Role {
        Admin = 'ADMIN',
        User = 'USER',
      }
      const schema = v.nativeEnum(Role);
      expect(schema.parse(Role.Admin)).toBe('ADMIN');
      expect(() => schema.parse('GUEST')).toThrow(GigliError);
    });
  });

  describe('Special Primitives: null, undefined, any, unknown, never', () => {
    it('validates null and undefined schemas', () => {
      expect(v.null().parse(null)).toBe(null);
      expect(() => v.null().parse(undefined)).toThrow(GigliError);

      expect(v.undefined().parse(undefined)).toBe(undefined);
      expect(() => v.undefined().parse(null)).toThrow(GigliError);
    });

    it('validates any, unknown, and never', () => {
      expect(v.any().parse({ a: 1 })).toEqual({ a: 1 });
      expect(v.unknown().parse('anything')).toBe('anything');
      expect(() => v.never().parse('something')).toThrow(GigliError);
    });
  });
});
