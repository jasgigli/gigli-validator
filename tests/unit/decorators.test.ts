import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { Refine, Rule, ValidatedModel, getClassAST } from '../../src/core/decorators/validatedModel';

describe('Unit Testing: Class Decorators (ValidatedModel, Rule, Refine)', () => {
  it('validates class models decorated with property Rule decorator', async () => {
    class User extends ValidatedModel {
      username!: string;
    }
    Rule({ toAST: () => ({ type: 'primitive', primitive: 'string', rules: [{ type: 'rule', name: 'string', params: { min: 3 } }] }) })(User.prototype, 'username');

    const valid = await User.fromAsync({ username: 'john_doe' });
    expect(valid.username).toBe('john_doe');

    await expect(User.fromAsync({ username: 'jo' })).rejects.toThrow();
  });

  it('validates class models decorated with class-level Refine decorator', async () => {
    class SignupModel extends ValidatedModel {
      password!: string;
      passwordConfirm!: string;
    }
    Rule({ toAST: () => ({ type: 'primitive', primitive: 'string', rules: [{ type: 'rule', name: 'string', params: { min: 8 } }] }) })(SignupModel.prototype, 'password');
    Rule({ toAST: () => ({ type: 'primitive', primitive: 'string', rules: [{ type: 'rule', name: 'string', params: { min: 8 } }] }) })(SignupModel.prototype, 'passwordConfirm');
    Refine((u: any) => u.password === u.passwordConfirm, { message: 'Passwords do not match' })(SignupModel);

    await expect(SignupModel.fromAsync({ password: 'password123', passwordConfirm: 'password123' })).resolves.not.toThrow();
    await expect(SignupModel.fromAsync({ password: 'password123', passwordConfirm: 'mismatch123' })).rejects.toThrow(/Passwords do not match/);
  });

  it('extracts class AST node using getClassAST helper', () => {
    class Item extends ValidatedModel {
      title!: string;
    }
    Rule({ toAST: () => ({ type: 'primitive', primitive: 'string', rules: [{ type: 'rule', name: 'string' }] }) })(Item.prototype, 'title');

    const ast = getClassAST(Item);
    expect(ast.type).toBe('class');
    expect((ast.fields.title as any).primitive).toBe('string');
  });
});
