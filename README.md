# Gigli

High-performance, type-safe schema validation and data sanitization engine for TypeScript and JavaScript. Zero runtime dependencies.

---

## Table of Contents

- [Overview](#overview)
- [Why Gigli?](#why-gigli)
- [Feature Comparison](#feature-comparison)
- [Installation](#installation)
- [Quick Start for Beginners](#quick-start-for-beginners)
  - [1. Defining a Schema](#1-defining-a-schema)
  - [2. Inferring TypeScript Types](#2-inferring-typescript-types)
  - [3. Validating Input Data](#3-validating-input-data)
- [Core Features & Problem Solved](#core-features--problem-solved)
  - [Unified Frontend & Backend Validation](#unified-frontend--backend-validation)
  - [Built-In Security & Sanitization](#built-in-security--sanitization)
  - [Automatic Form Data Coercion](#automatic-form-data-coercion)
  - [Declarative String Rules](#declarative-string-rules)
  - [Class & Decorator Models](#class--decorator-models)
  - [OpenAPI & JSON Schema Generation](#openapi--json-schema-generation)
- [API Reference](#api-reference)
  - [Primitive Validators](#primitive-validators)
  - [Complex & Structural Validators](#complex--structural-validators)
  - [Security Methods](#security-methods)
  - [Express Integration](#express-integration)
  - [Form Validation](#form-validation)
  - [CLI Tooling](#cli-tooling)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [License](#license)

---

## Overview

Runtime data validation ensures that data entering an application matches expected formats and constraints before processing. Without strict validation, unvalidated payloads can lead to unhandled runtime exceptions, data corruption, database injection attacks, and cross-site scripting (XSS) vulnerabilities.

**Gigli** provides a unified runtime validation engine designed for TypeScript and JavaScript across browser, Node.js, and serverless edge environments. It combines static type inference, chained schema builders, string-based rule declarations, class decorators, and security guards into a single zero-dependency package.

---

## Why Gigli?

Existing schema validation solutions often focus on isolated concerns: type inference (Zod), form validation (Yup), or backend object enforcement (Joi). Developers frequently pull in multiple security middleware packages, custom regex sanitizers, or third-party plugins to handle basic production requirements.

Gigli addresses these core pain points:

1. **Eliminates Code Drift Across Applications**: Define schemas once and share them across client-side forms, API middleware, and database operations.
2. **Defensive Runtime Security Out-of-the-Box**: Includes built-in guards against Cross-Site Scripting (XSS), Prototype Pollution payloads (`__proto__`, `constructor`), and NoSQL query injection attacks (e.g. MongoDB `$gt` operators).
3. **Seamless Form Input Coercion**: HTML forms submit string values for every field. Gigli automatically parses and coerces input parameters into typed numbers, booleans, and dates without manual `Number()` or `Boolean()` transformations.
4. **Multiple Schema Paradigms**: Choose fluent chainable builders (`v.object()`), dynamic database-driven rule strings (`v.from()`), or class decorators (`@ValidatedModel()`) depending on your codebase architecture.
5. **Zero Runtime Dependencies**: Zero external dependencies ensures small bundle footprints, predictable security auditing, and fast instantiation times.

---

## Feature Comparison

| Feature | Gigli | Zod | Yup | Joi |
| :--- | :--- | :--- | :--- | :--- |
| **Zero Runtime Dependencies** | Yes | Yes | No | No |
| **Native Static Type Inference** | `Infer<T>` | `z.infer<T>` | `yup.InferType` | External types |
| **Built-in Anti-XSS Sanitization** | Native (`.xss()`, `.sanitize()`) | No | No | No |
| **Built-in Prototype Pollution Defense** | Automatic | Partial | No | No |
| **Built-in NoSQL Injection Guard** | Native (`.noSqlGuard()`) | No | No | No |
| **Native Form Data Coercion** | Built-in (`v.validateForm`) | Manual transforms | Manual transforms | Manual |
| **Express Middleware Integration** | Built-in (`v.middleware`) | Community package | Community package | Third-party |
| **Declarative String Syntax** | Native (`v.from()`) | No | No | Limited |
| **OpenAPI / JSON Schema Generator** | Built-in (`npx gigli`) | Plugin required | Plugin required | Plugin required |

---

## Installation

Install Gigli using your package manager:

```bash
npm install gigli.js
```

Or via Yarn, pnpm, or Bun:

```bash
yarn add gigli.js
pnpm add gigli.js
bun add gigli.js
```

---

## Quick Start for Beginners

### 1. Defining a Schema

Import the validator factory `v` to construct schema definitions:

```typescript
import { v } from 'gigli.js';

const UserSchema = v.object({
  username: v.string().min(3).max(20).alphanumeric(),
  email: v.string().email().toLowerCase().trim(),
  age: v.number().int().min(18),
  role: v.enum(['admin', 'user', 'guest']),
  active: v.boolean().default(true),
});
```

### 2. Inferring TypeScript Types

Extract compile-time TypeScript types directly from schemas without duplicating interface definitions:

```typescript
import { Infer } from 'gigli.js';

type User = Infer<typeof UserSchema>;

// Equivalent inferred type:
// type User = {
//   username: string;
//   email: string;
//   age: number;
//   role: 'admin' | 'user' | 'guest';
//   active: boolean;
// }
```

### 3. Validating Input Data

Use `safeParse()` to inspect validation results without throwing errors:

```typescript
const result = UserSchema.safeParse({
  username: 'john_doe',
  email: '  JOHN@EXAMPLE.COM ',
  age: 25,
  role: 'admin',
});

if (result.success) {
  // TypeScript guarantees result.data matches the User type
  console.log('Sanitized Email:', result.data.email); // "john@example.com"
} else {
  // Structured error formatted by field
  console.error(result.error.flatten());
}
```

If you prefer exceptions, use `parse()`:

```typescript
try {
  const validData = UserSchema.parse(rawInput);
} catch (error) {
  console.error('Validation failed:', error.message);
}
```

---

## Core Features & Problem Solved

### Unified Frontend & Backend Validation

Sharing schemas between server endpoints and client-side forms guarantees that data definitions remain consistent across application boundaries.

```typescript
// schemas/auth.ts (Shared schema module)
import { v } from 'gigli.js';

export const LoginSchema = v.object({
  email: v.string().email('Please enter a valid email address'),
  password: v.string().min(8, 'Password must be at least 8 characters'),
});
```

### Built-In Security & Sanitization

Input sanitization is essential when accepting user-generated content or querying databases. Gigli integrates security guards directly into string and object schema pipelines.

#### Anti-XSS Protection

```typescript
// Reject payloads containing script tags or event handlers
const StrictInput = v.string().xss();

// Automatically encode HTML characters into safe entities
const SafeComment = v.string().sanitize();
```

#### NoSQL Query Injection & Prototype Pollution Defense

NoSQL injection occurs when attackers send nested operator objects (such as `{ "$gt": "" }`) into query parameters. Prototype pollution occurs when attackers supply `__proto__` properties to pollute shared object prototypes.

```typescript
const UserQuerySchema = v.object({
  username: v.string(),
  status: v.string(),
}).noSqlGuard(); // Strips keys starting with '$' or containing '.' and blocks object prototype pollution
```

### Automatic Form Data Coercion

HTML form submits return string key-value pairs for all fields. `v.validateForm` parses `FormData` instances and converts fields into typed primitives.

```typescript
import { v } from 'gigli.js';

const RegistrationSchema = v.object({
  username: v.string().min(3),
  age: v.number().int().min(18),
  subscribeToNewsletter: v.boolean(),
});

function handleFormSubmit(formElement: HTMLFormElement) {
  const formData = new FormData(formElement);
  const result = v.validateForm(RegistrationSchema, formData);

  if (result.success) {
    console.log(result.data.age); // Parsed as a primitive number
  } else {
    console.log(result.errors.fieldErrors);
  }
}
```

### Declarative String Rules

For runtime schemas defined dynamically or retrieved from databases, Gigli provides a string rule evaluation syntax:

```typescript
import { v } from 'gigli.js';

// Dynamic schema parsed from rule strings
const emailRule = v.from('string|email|min:5');

const isValid = emailRule.safeParse('developer@example.com');
```

### Class & Decorator Models

Applications using class-oriented domain models can annotate properties with Gigli validation decorators:

```typescript
import { ValidatedModel, Rule, Refine } from 'gigli.js';

@ValidatedModel()
export class ProductModel extends ValidatedModel {
  @Rule('string|min:2')
  name!: string;

  @Rule('number|min:0')
  price!: number;

  @Refine((product: ProductModel) => product.price > 0, {
    message: 'Price must be greater than zero',
  })
  validateProduct() {}
}

// Instantiation with automatic validation
const product = ProductModel.from({ name: 'Keyboard', price: 49.99 });
```

### OpenAPI & JSON Schema Generation

Export standard OpenAPI 3.0 documentation and JSON Schemas directly from runtime definitions without maintaining separate YAML or JSON documents:

```typescript
import { v, generateOpenApiSchema, generateJsonSchema } from 'gigli.js';

const AccountSchema = v.object({
  id: v.string().uuid(),
  balance: v.number().nonnegative(),
});

const openApiSpec = generateOpenApiSchema(AccountSchema);
const jsonSchemaSpec = generateJsonSchema(AccountSchema);
```

---

## API Reference

### Primitive Validators

| Validator | Chainable Methods | Description |
| :--- | :--- | :--- |
| `v.string()` | `.min(len)`, `.max(len)`, `.length(len)`, `.email()`, `.url()`, `.uuid()`, `.objectId()`, `.alphanumeric()`, `.regex(pattern)`, `.xss()`, `.sanitize()`, `.trim()`, `.toLowerCase()`, `.toUpperCase()` | String schema validation and transformation. |
| `v.number()` | `.min(val)`, `.max(val)`, `.int()`, `.positive()`, `.negative()`, `.nonnegative()`, `.multipleOf(val)`, `.finite()` | Number validation and range constraints. |
| `v.boolean()` | — | Boolean primitive validation. |
| `v.date()` | — | Date instance or ISO date string validation. |
| `v.bigint()` | — | BigInt primitive validation. |
| `v.literal(val)` | — | Exact literal value match. |
| `v.enum(values)` | — | Array tuple string enum validator. |
| `v.nativeEnum(e)` | — | TypeScript `enum` object validator. |
| `v.any()` / `v.unknown()` | — | Pass-through validation schemas. |

### Complex & Structural Validators

- `v.object(shape)`: Object schema composition. Supports `.strict()`, `.passthrough()`, `.strip()`, `.extend()`, `.merge()`, `.pick()`, `.omit()`, `.partial()`, `.noSqlGuard()`.
- `v.array(elementSchema)`: Array validation with `.min()`, `.max()`, `.length()`, `.nonempty()`, `.unique()`.
- `v.tuple([schemaA, schemaB])`: Fixed-length multi-type array validation.
- `v.record(keySchema, valueSchema)`: Key-value map validation.
- `v.union([schemaA, schemaB])`: Multi-schema union validation.
- `v.discriminatedUnion(key, schemas)`: Optimized tagged union parsing.
- `v.intersection(schemaA, schemaB)`: Combined intersection schema validation.
- `v.lazy(() => schema)`: Recursive schema definitions.

### Security Methods

- `schema.xss(customMessage?)`: Rejects inputs containing malicious HTML script fragments.
- `schema.sanitize()`: Encodes HTML entities in string inputs.
- `schema.noSqlGuard()`: Blocks object keys containing MongoDB operators (`$`) or path selectors (`.`) and strips dangerous prototype keys.

### Express Integration

Validate incoming requests in Express routing layers:

```typescript
import express from 'express';
import { v } from 'gigli.js';

const app = express();
app.use(express.json());

const CreatePostSchema = v.object({
  title: v.string().min(5),
  content: v.string().min(10),
});

app.post('/posts', v.middleware({ body: CreatePostSchema }), (req, res) => {
  res.status(201).json({ success: true, post: req.body });
});
```

### Form Validation

Parse raw `FormData` in web applications:

```typescript
import { v } from 'gigli.js';

const result = v.validateForm(schema, formData);
// Returns { success: true, data: T } or { success: false, errors: { fieldErrors: Record<string, string[]> } }
```

### CLI Tooling

Gigli provides an optional command-line interface for analyzing schema integrity and generating OpenAPI / JSON Schema files.

```bash
# Analyze a schema file for potential issues
npx gigli analyze --schema ./src/schemas/user.ts

# Export OpenAPI 3.0 specification JSON
npx gigli codegen --schema ./src/schemas/user.ts --target openapi

# Export JSON Schema specification JSON
npx gigli codegen --schema ./src/schemas/user.ts --target jsonschema
```

---

## Testing & Quality Assurance

Gigli Validator is thoroughly tested using modern testing framework tools:

- **Unit Testing**: [Vitest](https://vitest.dev/)
- **Backend API Integration**: Vitest + [Supertest](https://github.com/ladjs/supertest)
- **Frontend React Integration**: Vitest + [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- **End-to-End Browser Testing**: [Playwright](https://playwright.dev/)

```bash
# Run Unit & Integration test suites
npm test

# Run Vitest in watch mode
npm run test:watch

# Generate test coverage report
npm run test:coverage

# Run Playwright E2E browser test
npm run test:e2e
```

---

## License

Distributed under the [MIT License](LICENSE). Copyright (c) 2024-2026 Junaid Ali Shah Gigli.
