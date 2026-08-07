import { v } from '../src';

describe('Builder API', () => {
  it('should build a string schema and validate', () => {
    const schema = v.string().min(3).max(10);
    expect(schema.parse('hello')).toBe('hello');
    expect(() => schema.parse('hi')).toThrow();
  });

  it('should build a number schema and validate', () => {
    const schema = v.number().min(5).max(10);
    expect(schema.parse(7)).toBe(7);
    expect(() => schema.parse(3)).toThrow();
  });

  it('should build an object schema and validate', () => {
    const schema = v.object({
      name: v.string().min(2),
      age: v.number().min(18),
    });
    expect(schema.parse({ name: 'Joe', age: 20 })).toEqual({ name: 'Joe', age: 20 });
    expect(() => schema.parse({ name: 'J', age: 20 })).toThrow();
  });

  it('should build an array schema and validate', () => {
    const schema = v.array(v.string().min(2));
    expect(schema.parse(['ab', 'cd'])).toEqual(['ab', 'cd']);
    expect(() => schema.parse(['a', 'cd'])).toThrow();
  });

  it('should build from rule string', () => {
    const schema = v.from('string|email|min:5');
    expect(schema.parse('user@domain.com')).toBe('user@domain.com');
    expect(() => schema.parse('a@b')).toThrow();
  });
});
