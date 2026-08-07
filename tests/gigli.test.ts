import { GigliError, Infer, v } from '../src';

describe('Gigli Isomorphic Validation Engine (v3.0.0)', () => {
  describe('Primitives & Validators', () => {
    it('validates string with min, max, email, url, uuid, objectId', () => {
      const userSchema = v.object({
        username: v.string().min(3).max(20).alphanumeric(),
        email: v.string().email().toLowerCase().trim(),
        website: v.string().url().optional(),
        id: v.objectId(),
      });

      type User = Infer<typeof userSchema>;

      const validData = {
        username: 'john123',
        email: '  JOHN@EXAMPLE.COM  ',
        website: 'https://example.com',
        id: '507f1f77bcf86cd799439011',
      };

      const result = userSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('john@example.com');
      }

      const invalidData = {
        username: 'jo',
        email: 'invalid-email',
        id: 'bad-id',
      };
      const invalidResult = userSchema.safeParse(invalidData);
      expect(invalidResult.success).toBe(false);
      if (!invalidResult.success) {
        const flattened = invalidResult.error.flatten();
        expect(flattened.fieldErrors.username).toBeDefined();
        expect(flattened.fieldErrors.email).toBeDefined();
        expect(flattened.fieldErrors.id).toBeDefined();
      }
    });

    it('validates numbers with int, min, max, positive, multipleOf', () => {
      const numberSchema = v.number().int().min(10).max(100).multipleOf(5);
      expect(numberSchema.parse(25)).toBe(25);
      expect(() => numberSchema.parse(23)).toThrow(GigliError);
      expect(() => numberSchema.parse(5)).toThrow(GigliError);
      expect(() => numberSchema.parse(105)).toThrow(GigliError);
    });

    it('validates booleans and dates', () => {
      const schema = v.object({
        active: v.boolean(),
        createdAt: v.date(),
      });
      const d = new Date();
      const res = schema.parse({ active: true, createdAt: d.toISOString() });
      expect(res.active).toBe(true);
      expect(res.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('Complex Schemas & Combinators', () => {
    it('validates unions and discriminated unions', () => {
      const shapeA = v.object({ type: v.literal('circle'), radius: v.number().positive() });
      const shapeB = v.object({ type: v.literal('square'), side: v.number().positive() });
      const shapeUnion = v.discriminatedUnion('type', [shapeA, shapeB]);

      expect(shapeUnion.parse({ type: 'circle', radius: 5 })).toEqual({ type: 'circle', radius: 5 });
      expect(shapeUnion.parse({ type: 'square', side: 10 })).toEqual({ type: 'square', side: 10 });
      expect(() => shapeUnion.parse({ type: 'triangle', side: 5 })).toThrow();
    });

    it('supports arrays, tuples, records, and lazy recursion', () => {
      const arraySchema = v.array(v.string().min(2)).min(1).unique();
      expect(arraySchema.parse(['apple', 'banana'])).toEqual(['apple', 'banana']);
      expect(() => arraySchema.parse(['apple', 'apple'])).toThrow();

      const tupleSchema = v.tuple([v.string(), v.number()]);
      expect(tupleSchema.parse(['hello', 42])).toEqual(['hello', 42]);

      const recordSchema = v.record(v.number());
      expect(recordSchema.parse({ a: 1, b: 2 })).toEqual({ a: 1, b: 2 });
    });
  });

  describe('Security & Sanitization', () => {
    it('detects XSS attack vectors and sanitizes HTML', () => {
      const xssSchema = v.string().xss();
      expect(() => xssSchema.parse('<script>alert(1)</script>')).toThrow();

      const sanitizeSchema = v.string().sanitize();
      expect(sanitizeSchema.parse('<b>hello</b>')).toBe('&lt;b&gt;hello&lt;&#x2F;b&gt;');
    });

    it('prevents prototype pollution and NoSQL injection', () => {
      const objSchema = v.object({ name: v.string() }).noSqlGuard();
      const payload = JSON.parse('{"name": "test", "__proto__": {"admin": true}}');
      const res = objSchema.parse(payload);
      expect(res.name).toBe('test');
      expect((res as any).__proto__.admin).toBeUndefined();

      expect(() => objSchema.parse({ name: { $gt: '' } })).toThrow();
    });
  });

  describe('MERN Stack Integration & Isomorphic Form Helper', () => {
    it('parses form input strings to typed objects automatically', () => {
      const formSchema = v.object({
        name: v.string().min(2),
        age: v.number().min(18),
        agree: v.boolean(),
      });

      const rawForm = {
        name: 'Alice',
        age: '25',
        agree: 'on',
      };

      const result = v.validateForm(formSchema, rawForm);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Alice');
        expect(result.data.age).toBe(25);
        expect(result.data.agree).toBe(true);
      }
    });

    it('provides Express middleware helper', async () => {
      const bodySchema = v.object({ email: v.string().email() });
      const mw = v.middleware({ body: bodySchema });

      const req = { body: { email: 'test@example.com' } };
      let nextCalled = false;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await mw(req, res, () => {
        nextCalled = true;
      });

      expect(nextCalled).toBe(true);
    });
  });

  describe('String Rule Parser', () => {
    it('creates validators from string rule declarations', () => {
      const schema = v.from('string|email|min:5');
      expect(schema.parse('test@example.com')).toBe('test@example.com');
      expect(() => schema.parse('a@b')).toThrow();
    });
  });
});
