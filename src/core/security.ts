/**
 * Security and sanitization utilities for Gigli isomorphic engine.
 * Provides Anti-XSS, Prototype Pollution Guard, and NoSQL/SQL Injection Prevention.
 */

export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return input;
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
}

export function containsXss(input: string): boolean {
  if (typeof input !== 'string') return false;
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<embed/gi,
    /<object/gi,
  ];
  return dangerousPatterns.some((pattern) => pattern.test(input));
}

export function isDangerousKey(key: string): boolean {
  return key === '__proto__' || key === 'constructor' || key === 'prototype';
}

export function sanitizeObjectKeys(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObjectKeys);
  }
  const clean: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    if (isDangerousKey(key)) continue;
    clean[key] = sanitizeObjectKeys(obj[key]);
  }
  return clean;
}

export function isMongoInjectionPayload(input: unknown): boolean {
  if (input !== null && typeof input === 'object') {
    if (Array.isArray(input)) {
      return input.some(isMongoInjectionPayload);
    }
    const keys = Object.keys(input);
    if (keys.some((k) => k.startsWith('$'))) return true;
    for (const key of keys) {
      if (isMongoInjectionPayload((input as Record<string, any>)[key])) return true;
    }
  }
  return false;
}
