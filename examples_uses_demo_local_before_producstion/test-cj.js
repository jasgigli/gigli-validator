const { v } = require('gigli.js');

const UserSchema = v.object({
  username: v.string().min(3),
  email: v.string().email(),
});

(async () => {
  const result = await UserSchema.safeParse({ username: 'bob', email: 'bob@email.com' });
  console.log('safeParse:', result); // { success: true, data: ..., error: null }
  try {
    const parsed = await UserSchema.parse({ username: 'bob', email: 'bob@email.com' });
    console.log('parse:', parsed); // { username: 'bob', email: 'bob@email.com' }
  } catch (err) {
    console.error('parse error:', err);
  }
})();
