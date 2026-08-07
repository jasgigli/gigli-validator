import { GigliError, GigliIssue } from './errors';

export type SafeParseResult<T> =
  | { success: true; data: T; error?: undefined }
  | { success: false; error: GigliError; data?: undefined };

export abstract class GigliSchema<T = any> {
  readonly _type!: T;

  abstract _parse(
    input: unknown,
    path: (string | number)[]
  ): { value?: T; issues: GigliIssue[] } | Promise<{ value?: T; issues: GigliIssue[] }>;

  parse(input: unknown): T {
    const result = this._parseSyncInternal(input, []);
    if (result.issues.length > 0) {
      throw new GigliError(result.issues);
    }
    return result.value as T;
  }

  async parseAsync(input: unknown): Promise<T> {
    const result = await this._parseInternal(input, []);
    if (result.issues.length > 0) {
      throw new GigliError(result.issues);
    }
    return result.value as T;
  }

  safeParse(input: unknown): SafeParseResult<T> {
    try {
      const result = this._parseSyncInternal(input, []);
      if (result.issues.length > 0) {
        return { success: false, error: new GigliError(result.issues) };
      }
      return { success: true, data: result.value as T };
    } catch (err) {
      if (err instanceof GigliError) {
        return { success: false, error: err };
      }
      return {
        success: false,
        error: new GigliError([{ code: 'custom', path: [], message: String(err) }]),
      };
    }
  }

  async safeParseAsync(input: unknown): Promise<SafeParseResult<T>> {
    try {
      const result = await this._parseInternal(input, []);
      if (result.issues.length > 0) {
        return { success: false, error: new GigliError(result.issues) };
      }
      return { success: true, data: result.value as T };
    } catch (err) {
      if (err instanceof GigliError) {
        return { success: false, error: err };
      }
      return {
        success: false,
        error: new GigliError([{ code: 'custom', path: [], message: String(err) }]),
      };
    }
  }

  private _parseSyncInternal(
    input: unknown,
    path: (string | number)[]
  ): { value?: T; issues: GigliIssue[] } {
    const res = this._parse(input, path);
    if (res instanceof Promise) {
      throw new Error(
        'Async validation rule triggered in sync parse(). Use parseAsync() or safeParseAsync() instead.'
      );
    }
    return res;
  }

  private async _parseInternal(
    input: unknown,
    path: (string | number)[]
  ): Promise<{ value?: T; issues: GigliIssue[] }> {
    return Promise.resolve(this._parse(input, path));
  }

  optional(): GigliOptional<GigliSchema<T>> {
    return new GigliOptional(this as any);
  }

  nullable(): GigliNullable<GigliSchema<T>> {
    return new GigliNullable(this as any);
  }

  nullish(): GigliNullish<GigliSchema<T>> {
    return new GigliNullish(this as any);
  }

  default(defaultValue: T | (() => T)): GigliDefault<GigliSchema<T>> {
    return new GigliDefault(this as any, defaultValue);
  }

  catch(fallbackValue: T | ((error: GigliError) => T)): GigliCatch<GigliSchema<T>> {
    return new GigliCatch(this as any, fallbackValue);
  }

  refine(
    fn: (val: T) => boolean | Promise<boolean>,
    opts: string | { message: string; path?: (string | number)[] } = 'Invalid input'
  ): GigliRefined<GigliSchema<T>> {
    return new GigliRefined(this as any, fn, typeof opts === 'string' ? { message: opts } : opts);
  }

  transform<U>(fn: (val: T) => U | Promise<U>): GigliTransformed<GigliSchema<T>, U> {
    return new GigliTransformed(this as any, fn);
  }

  pipe<U extends GigliSchema<any>>(target: U): GigliPipe<GigliSchema<T>, U> {
    return new GigliPipe(this as any, target);
  }

  toAST(): any {
    return { type: 'schema', name: this.constructor.name };
  }
}

export class GigliOptional<S extends GigliSchema<any>> extends GigliSchema<
  S['_type'] | undefined
> {
  constructor(public innerSchema: S) {
    super();
  }

  _parse(input: unknown, path: (string | number)[]) {
    if (input === undefined) {
      return { value: undefined, issues: [] };
    }
    return this.innerSchema._parse(input, path);
  }
}

export class GigliNullable<S extends GigliSchema<any>> extends GigliSchema<
  S['_type'] | null
> {
  constructor(public innerSchema: S) {
    super();
  }

  _parse(input: unknown, path: (string | number)[]) {
    if (input === null) {
      return { value: null, issues: [] };
    }
    return this.innerSchema._parse(input, path);
  }
}

export class GigliNullish<S extends GigliSchema<any>> extends GigliSchema<
  S['_type'] | null | undefined
> {
  constructor(public innerSchema: S) {
    super();
  }

  _parse(input: unknown, path: (string | number)[]) {
    if (input === undefined || input === null) {
      return { value: input, issues: [] };
    }
    return this.innerSchema._parse(input, path);
  }
}

export class GigliDefault<S extends GigliSchema<any>> extends GigliSchema<
  S['_type']
> {
  constructor(
    public innerSchema: S,
    public defaultValue: S['_type'] | (() => S['_type'])
  ) {
    super();
  }

  _parse(input: unknown, path: (string | number)[]) {
    if (input === undefined) {
      const val = typeof this.defaultValue === 'function' ? (this.defaultValue as any)() : this.defaultValue;
      return { value: val, issues: [] };
    }
    return this.innerSchema._parse(input, path);
  }
}

export class GigliCatch<S extends GigliSchema<any>> extends GigliSchema<
  S['_type']
> {
  constructor(
    public innerSchema: S,
    public fallbackValue: S['_type'] | ((err: GigliError) => S['_type'])
  ) {
    super();
  }

  _parse(input: unknown, path: (string | number)[]) {
    const res = this.innerSchema._parse(input, path);
    if (res instanceof Promise) {
      return res.then((r) => {
        if (r.issues.length > 0) {
          const err = new GigliError(r.issues);
          const val = typeof this.fallbackValue === 'function' ? (this.fallbackValue as any)(err) : this.fallbackValue;
          return { value: val, issues: [] };
        }
        return r;
      });
    }
    if (res.issues.length > 0) {
      const err = new GigliError(res.issues);
      const val = typeof this.fallbackValue === 'function' ? (this.fallbackValue as any)(err) : this.fallbackValue;
      return { value: val, issues: [] };
    }
    return res;
  }
}

export class GigliRefined<S extends GigliSchema<any>> extends GigliSchema<
  S['_type']
> {
  constructor(
    public innerSchema: S,
    public refinement: (val: S['_type']) => boolean | Promise<boolean>,
    public opts: { message: string; path?: (string | number)[] }
  ) {
    super();
  }

  _parse(input: unknown, path: (string | number)[]) {
    const res = this.innerSchema._parse(input, path);
    const processResult = (parsed: { value?: any; issues: GigliIssue[] }) => {
      if (parsed.issues.length > 0) return parsed;
      const refRes = this.refinement(parsed.value);
      if (refRes instanceof Promise) {
        return refRes.then((ok) => {
          if (!ok) {
            const errPath = this.opts.path ? [...path, ...this.opts.path] : path;
            return {
              value: parsed.value,
              issues: [
                ...parsed.issues,
                { code: 'custom', path: errPath, message: this.opts.message },
              ],
            };
          }
          return parsed;
        });
      }
      if (!refRes) {
        const errPath = this.opts.path ? [...path, ...this.opts.path] : path;
        return {
          value: parsed.value,
          issues: [
            ...parsed.issues,
            { code: 'custom', path: errPath, message: this.opts.message },
          ],
        };
      }
      return parsed;
    };

    if (res instanceof Promise) {
      return res.then(processResult);
    }
    return processResult(res);
  }
}

export class GigliTransformed<S extends GigliSchema<any>, U> extends GigliSchema<U> {
  constructor(
    public innerSchema: S,
    public transformFn: (val: S['_type']) => U | Promise<U>
  ) {
    super();
  }

  _parse(input: unknown, path: (string | number)[]) {
    const res = this.innerSchema._parse(input, path);
    const processResult = (parsed: { value?: any; issues: GigliIssue[] }) => {
      if (parsed.issues.length > 0) return parsed;
      const tfRes = this.transformFn(parsed.value);
      if (tfRes instanceof Promise) {
        return tfRes.then((out) => ({ value: out, issues: [] }));
      }
      return { value: tfRes, issues: [] };
    };

    if (res instanceof Promise) {
      return res.then(processResult);
    }
    return processResult(res);
  }
}

export class GigliPipe<S1 extends GigliSchema<any>, S2 extends GigliSchema<any>> extends GigliSchema<S2['_type']> {
  constructor(public schema1: S1, public schema2: S2) {
    super();
  }

  _parse(input: unknown, path: (string | number)[]) {
    const res1 = this.schema1._parse(input, path);
    const step2 = (parsed1: { value?: any; issues: GigliIssue[] }) => {
      if (parsed1.issues.length > 0) return parsed1;
      return this.schema2._parse(parsed1.value, path);
    };

    if (res1 instanceof Promise) {
      return res1.then(step2);
    }
    return step2(res1);
  }
}
