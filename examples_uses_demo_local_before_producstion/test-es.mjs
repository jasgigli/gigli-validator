import { v } from 'gigli.js';

const UserSchema = v.object({
  username: v.string().min(3),
  email: v.string().email(),
});

const result = UserSchema.safeParse({ username: 'bob', email: 'bob@email.com' });
console.log(result.success);
