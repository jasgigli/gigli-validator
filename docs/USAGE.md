# Gigli Usage Guide

## CLI Usage

Run the CLI using `npx`:

```bash
npx gigli codegen --schema ./path/to/schema.ts --target openapi
npx gigli codegen --schema ./path/to/schema.ts --target jsonschema
npx gigli analyze --schema ./path/to/schema.ts
```

Help flag:

```bash
npx gigli --help
```

## Basic Library Usage

Import standard validator primitives:

```typescript
import { v, Infer } from 'gigli';

const UserSchema = v.object({
  name: v.string().min(2),
  email: v.string().email(),
});

type User = Infer<typeof UserSchema>;

const result = UserSchema.safeParse({ name: 'Alice', email: 'alice@example.com' });
if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error.flatten());
}
```

### Declarative String Rule Validation

Define schemas dynamically from string rules:

```typescript
import { v } from 'gigli';

const emailRule = v.from('string|email|min:5');
const validated = emailRule.parse('user@domain.com');
```

### Custom Rule Registration

Extend validation rules globally using the definition registry:

```typescript
import { define, v } from 'gigli';

define('strongPassword', 'string|min:8|regex:[A-Z]|regex:[0-9]');
```

For comprehensive details, see [README.md](../README.md).
