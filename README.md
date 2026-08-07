# Gigli

> High-Performance Isomorphic Validation Engine for JavaScript & TypeScript (MERN Stack Ready)

---

## Overview

Gigli is an isomorphic schema validation engine built for modern JavaScript and TypeScript environments. Designed for full-stack applications (including MERN—MongoDB, Express, React, Node.js), Gigli provides a unified validation API that runs seamlessly across browsers, Node.js servers, edge workers, and client frameworks.

Gigli combines type safety, zero dependencies, anti-XSS security sanitization, prototype pollution protection, NoSQL injection defense, declarative string rules, and schema code generation (OpenAPI and JSON Schema).

---

## Architectural Comparison Matrix

| Feature | Gigli | Zod | Yup | Joi |
| :--- | :--- | :--- | :--- | :--- |
| **Isomorphic (Frontend + Backend)** | Full (MERN Ready) | Partial | Partial | Node.js Heavy |
| **TypeScript Type Inference** | Native (`Infer<T>`) | Native (`z.infer<T>`) | Partial (`yup.InferType`) | External types |
| **Form Data Coercion Helper** | Built-in (`v.validateForm`) | Manual transforms | Manual transforms | Manual |
| **Express Middleware Helper** | Built-in (`v.middleware`) | Community package | Community package | Third-party |
| **Security (Anti-XSS & NoSQL)** | Built-in (`.xss()`, `.noSqlGuard()`) | None | None | None |
| **Prototype Pollution Guard** | Automatic | Partial | None | None |
| **Declarative String Rules** | Supported (`v.from()`) | No | No | Limited |
| **OpenAPI / JSON Schema** | Built-in | Plugin required | Plugin required | Plugin required |

---

## Key Features

1. **Isomorphic Architecture**: Use identical schemas across React components, HTML forms, Express routes, and MongoDB operations.
2. **First-Class Security**: Protect applications against XSS attacks, Prototype Pollution, and NoSQL query injection payloads.
3. **Form Data Integration**: Automatically parse and coerce FormData strings into typed primitives (numbers, booleans, dates).
4. **Declarative String Rules**: Define validation logic using concise rule strings (`v.from("string|email|min:5")`).
5. **Class & Decorator Support**: Annotate TypeScript class models with `@ValidatedModel`, `@Rule`, and `@Refine`.
6. **Zero Dependencies**: Lightweight runtime footprint with zero third-party dependencies.

---

## Installation

```bash
npm install gigli
```

Or via alternative package managers:

```bash
yarn add gigli
pnpm add gigli
bun add gigli
```

---

## Quick Start

### Basic Schema Definition

```typescript
import { v, Infer } from 'gigli';

const UserSchema = v.object({
  username: v.string().min(3).max(20).alphanumeric(),
  email: v.string().email().toLowerCase().trim(),
  age: v.number().int().min(18),
  role: v.enum(['admin', 'user', 'guest']),
  active: v.boolean().default(true),
});

// TypeScript type inference
type User = Infer<typeof UserSchema>;

// Validation with safeParse
const result = UserSchema.safeParse({
  username: 'john_doe',
  email: '  JOHN@EXAMPLE.COM ',
  age: 25,
  role: 'admin',
});

if (result.success) {
  console.log(result.data.email); // "john@example.com"
} else {
  console.error(result.error.flatten());
}
```

---

## Isomorphic MERN Stack Integration Guide

### 1. Express / Node.js Backend Middleware

Gigli provides request validation middleware that validates `req.body`, `req.query`, and `req.params`, returning HTTP 400 Bad Request if validation fails.

```typescript
import express from 'express';
import { v } from 'gigli';

const app = express();
app.use(express.json());

const CreateUserSchema = v.object({
  username: v.string().min(3),
  email: v.string().email(),
  password: v.string().min(8),
});

app.post('/api/users', v.middleware({ body: CreateUserSchema }), (req, res) => {
  // req.body is fully validated and typed
  res.status(201).json({ message: 'User created successfully', user: req.body });
});
```

### 2. React / Frontend Form Validation

Use `v.validateForm` to validate HTML forms or React state payloads, automatically coercing string inputs to typed numbers, booleans, and dates.

```typescript
import React, { useState } from 'react';
import { v } from 'gigli';

const SignupSchema = v.object({
  username: v.string().min(3, 'Username must be at least 3 characters'),
  email: v.string().email('Invalid email address'),
  age: v.number().min(18, 'Must be at least 18 years old'),
});

export function SignupForm() {
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const result = v.validateForm(SignupSchema, formData);

    if (!result.success) {
      setErrors(result.errors.fieldErrors);
    } else {
      setErrors({});
      console.log('Submitted Payload:', result.data);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="username" placeholder="Username" />
      {errors.username && <p>{errors.username.join(', ')}</p>}

      <input name="email" placeholder="Email" />
      {errors.email && <p>{errors.email.join(', ')}</p>}

      <input name="age" type="number" placeholder="Age" />
      {errors.age && <p>{errors.age.join(', ')}</p>}

      <button type="submit">Register</button>
    </form>
  );
}
```

---

## Security Features

### Anti-XSS Sanitization

```typescript
// Reject strings containing XSS script vectors
const CommentSchema = v.string().xss('Potential script injection detected');

// Or automatically sanitize HTML tags into safe entities
const SafeBodySchema = v.string().sanitize();
```

### Prototype Pollution & NoSQL Defense

```typescript
// Automatically strips __proto__, constructor, and prototype injections
const PayloadSchema = v.object({
  title: v.string(),
}).noSqlGuard(); // Blocks MongoDB operator objects (e.g. { $gt: "" })
```

---

## Declarative String Rule Engine

For dynamic or database-driven rules, Gigli supports string rule syntax:

```typescript
import { v } from 'gigli';

const emailRule = v.from('string|email|min:5');
const validated = emailRule.parse('user@domain.com');
```

---

## Class Decorators

```typescript
import { ValidatedModel, Rule, Refine } from 'gigli';

@ValidatedModel()
export class UserModel {
  @Rule('string|min:3')
  username!: string;

  @Rule('string|email')
  email!: string;

  @Refine((user: UserModel) => !user.username.includes('admin'), 'Admin username reserved')
  validateCustom() {}
}
```

---

## OpenAPI & JSON Schema Generation

```typescript
import { v, generateJsonSchema, generateOpenApiSchema } from 'gigli';

const ProductSchema = v.object({
  id: v.string().uuid(),
  name: v.string(),
  price: v.number().positive(),
});

const jsonSchema = generateJsonSchema(ProductSchema);
const openApiSchema = generateOpenApiSchema(ProductSchema);
```

---

## API Reference

### Primitives
- `v.string()`: String schema with `.min()`, `.max()`, `.length()`, `.email()`, `.url()`, `.uuid()`, `.objectId()`, `.alphanumeric()`, `.regex()`, `.xss()`, `.sanitize()`, `.trim()`, `.toLowerCase()`, `.toUpperCase()`.
- `v.number()`: Number schema with `.min()`, `.max()`, `.int()`, `.positive()`, `.negative()`, `.nonnegative()`, `.multipleOf()`, `.finite()`.
- `v.boolean()`: Boolean schema.
- `v.date()`: Date schema supporting Date instances or ISO strings.
- `v.bigint()`: BigInt schema.
- `v.literal(value)`: Exact literal value schema.
- `v.enum(values)`: Tuple of string enum values.
- `v.nativeEnum(enumObj)`: TypeScript enum schema.
- `v.objectId()`: MongoDB ObjectId validator.

### Data Structures & Combinators
- `v.object(shape)`: Object schema with `.strict()`, `.strip()`, `.passthrough()`, `.extend()`, `.merge()`, `.pick()`, `.omit()`, `.partial()`, `.noSqlGuard()`.
- `v.array(elementSchema)`: Array schema with `.min()`, `.max()`, `.length()`, `.nonempty()`, `.unique()`.
- `v.tuple(schemas)`: Fixed-length tuple schema.
- `v.record(keySchema, valueSchema)`: Record map schema.
- `v.union(schemas)`: Union schema.
- `v.discriminatedUnion(discriminator, options)`: Discriminated union schema.
- `v.intersection(schemaA, schemaB)`: Intersection schema.
- `v.lazy(getter)`: Lazy recursive schema.

---

## License

MIT License. Copyright (c) Junaid Ali Shah Gigli.
