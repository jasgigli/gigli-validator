import { describe, expect, it } from 'vitest';
import { GigliError, v } from '../../src';

describe('Unit Testing: Schema Modifiers & Chaining', () => {
  it('supports .optional(), .nullable(), and .nullish()', () => {
    const optStr = v.string().optional();
    expect(optStr.parse(undefined)).toBeUndefined();
    expect(optStr.parse('valid')).toBe('valid');
    expect(() => optStr.parse(null)).toThrow(GigliError);

    const nullStr = v.string().nullable();
    expect(nullStr.parse(null)).toBeNull();
    expect(nullStr.parse('valid')).toBe('valid');
    expect(() => nullStr.parse(undefined)).toThrow(GigliError);

    const nullishStr = v.string().nullish();
    expect(nullishStr.parse(undefined)).toBeUndefined();
    expect(nullishStr.parse(null)).toBeNull();
    expect(nullishStr.parse('valid')).toBe('valid');
  });

  it('supports .default() with static values and factory functions', () => {
    const defaultStatic = v.string().default('Gigli');
    expect(defaultStatic.parse(undefined)).toBe('Gigli');
    expect(defaultStatic.parse('Custom')).toBe('Custom');

    let counter = 0;
    const defaultDynamic = v.number().default(() => ++counter);
    expect(defaultDynamic.parse(undefined)).toBe(1);
    expect(defaultDynamic.parse(undefined)).toBe(2);
    expect(defaultDynamic.parse(99)).toBe(99);
  });

  it('supports .catch() fallback values on error', () => {
    const catchSchema = v.number().catch(0);
    expect(catchSchema.parse(50)).toBe(50);
    expect(catchSchema.parse('not-a-number')).toBe(0);

    const catchFn = v.string().min(5).catch((err) => `fallback:${err.issues[0].code}`);
    expect(catchFn.parse('shrt')).toBe('fallback:min');
  });

  it('supports .refine() for custom assertions', () => {
    const isEven = v.number().refine((val) => val % 2 === 0, { message: 'Must be an even number' });
    expect(isEven.parse(4)).toBe(4);
    expect(() => isEven.parse(5)).toThrow(/Must be an even number/);
  });

  it('supports .transform() for data transformation', () => {
    const strToLen = v.string().transform((val) => val.length);
    expect(strToLen.parse('hello')).toBe(5);
  });

  it('supports .pipe() for chaining schema validations', () => {
    const stringToNumberPipe = v.string().transform((s) => Number(s)).pipe(v.number().min(100));
    expect(stringToNumberPipe.parse('150')).toBe(150);
    expect(() => stringToNumberPipe.parse('50')).toThrow(GigliError);
  });
});
