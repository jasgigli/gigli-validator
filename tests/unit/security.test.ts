import { describe, expect, it } from 'vitest';
import { GigliError, containsXss, isMongoInjectionPayload, sanitizeHtml, v } from '../../src';

describe('Unit Testing: Security & Sanitization Features', () => {
  describe('XSS Prevention', () => {
    it('detects dangerous XSS script vectors with containsXss helper and .xss()', () => {
      const scriptPayload = '<script>alert("hacked")</script>';
      const iframePayload = '<iframe src="javascript:alert(1)"></iframe>';
      const safePayload = '<b>Hello World</b>';

      expect(containsXss(scriptPayload)).toBe(true);
      expect(containsXss(iframePayload)).toBe(true);
      expect(containsXss(safePayload)).toBe(false);

      const xssSchema = v.string().xss();
      expect(xssSchema.parse(safePayload)).toBe(safePayload);
      expect(() => xssSchema.parse(scriptPayload)).toThrow(GigliError);
    });

    it('sanitizes HTML entities with sanitizeHtml and .sanitize()', () => {
      const input = '<script>alert("xss")</script>';
      const sanitized = sanitizeHtml(input);
      expect(sanitized).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');

      const schema = v.string().sanitize();
      expect(schema.parse('<div>test</div>')).toBe('&lt;div&gt;test&lt;&#x2F;div&gt;');
    });
  });

  describe('NoSQL Injection Prevention', () => {
    it('detects MongoDB injection operators ($gt, $ne, $where)', () => {
      expect(isMongoInjectionPayload({ $gt: '' })).toBe(true);
      expect(isMongoInjectionPayload({ user: { $ne: null } })).toBe(true);
      expect(isMongoInjectionPayload({ user: 'john' })).toBe(false);
    });

    it('enforces noSqlGuard() on object schemas', () => {
      const schema = v.object({ username: v.string() }).noSqlGuard();

      expect(schema.parse({ username: 'john_doe' })).toEqual({ username: 'john_doe' });
      expect(() => schema.parse({ username: { $gt: '' } })).toThrow(GigliError);
    });
  });

  describe('Prototype Pollution Prevention', () => {
    it('strips dangerous keys (__proto__, constructor, prototype) safely in strip mode', () => {
      const schema = v.object({ name: v.string() });
      const payload = JSON.parse('{"name": "test", "__proto__": {"admin": true}}');

      const result = schema.parse(payload);
      expect(result.name).toBe('test');
      expect((result as any).__proto__.admin).toBeUndefined();
    });

    it('rejects prototype pollution payload in strict mode', () => {
      const schema = v.object({ name: v.string() }).strict();
      const payload = JSON.parse('{"name": "test", "__proto__": {"admin": true}}');

      expect(() => schema.parse(payload)).toThrow(GigliError);
    });
  });
});
