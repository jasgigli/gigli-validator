import { describe, expect, it } from 'vitest';
import { GigliError, v } from '../../src';

describe('Unit Testing: String Rule Parser (v.from)', () => {
  it('parses declarative string rule strings into executable schemas', () => {
    const emailSchema = v.from('string|email|min:5');
    expect(emailSchema.parse('user@domain.com')).toBe('user@domain.com');
    expect(() => emailSchema.parse('a@b')).toThrow(GigliError);
  });

  it('parses numeric rules (number|min:10|max:50|int)', () => {
    const numSchema = v.from('number|min:10|max:50|int');
    expect(numSchema.parse(25)).toBe(25);
    expect(() => numSchema.parse(5)).toThrow(GigliError);
    expect(() => numSchema.parse(60)).toThrow(GigliError);
    expect(() => numSchema.parse(25.5)).toThrow(GigliError);
  });

  it('parses string transformers (string|trim|lowercase|email)', () => {
    const schema = v.from('string|trim|lowercase|email');
    expect(schema.parse('  ADMIN@GIGLI.DEV  ')).toBe('admin@gigli.dev');
  });

  it('parses security rules (string|xss|sanitize)', () => {
    const sanitizeSchema = v.from('string|sanitize');
    expect(sanitizeSchema.parse('<h1>Gigli</h1>')).toBe('&lt;h1&gt;Gigli&lt;&#x2F;h1&gt;');
  });
});
