import { GigliError } from './errors';
import { GigliSchema } from './schema';
import { GigliBoolean, GigliDate, GigliNumber, GigliObject, GigliString } from './validators';

export interface ExpressMiddlewareOptions {
  body?: GigliSchema<any>;
  query?: GigliSchema<any>;
  params?: GigliSchema<any>;
}

/**
 * Isomorphic Express / Node.js Request Validation Middleware.
 * Validates req.body, req.query, and req.params cleanly with 400 Bad Request handling.
 */
export function middleware(options: ExpressMiddlewareOptions) {
  return async (req: any, res: any, next: any) => {
    try {
      if (options.body && req.body !== undefined) {
        req.body = await options.body.parseAsync(req.body);
      }
      if (options.query && req.query !== undefined) {
        req.query = await options.query.parseAsync(req.query);
      }
      if (options.params && req.params !== undefined) {
        req.params = await options.params.parseAsync(req.params);
      }
      return next();
    } catch (error) {
      if (error instanceof GigliError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request payload',
          errors: error.flatten(),
          issues: error.issues,
        });
      }
      return res.status(400).json({
        success: false,
        message: String(error),
      });
    }
  };
}

/**
 * Isomorphic Form Data Parser and Validator.
 * Safely parses FormData, URLSearchParams, or plain HTML form object inputs into schema-typed data.
 */
export function validateForm<S extends GigliSchema<any>>(
  schema: S,
  formData: any
): { success: true; data: S['_type'] } | { success: false; errors: ReturnType<GigliError['flatten']> } {
  let rawObj: Record<string, any> = {};

  if (typeof FormData !== 'undefined' && formData instanceof FormData) {
    formData.forEach((val, key) => {
      if (rawObj[key] !== undefined) {
        if (!Array.isArray(rawObj[key])) {
          rawObj[key] = [rawObj[key]];
        }
        rawObj[key].push(val);
      } else {
        rawObj[key] = val;
      }
    });
  } else if (typeof URLSearchParams !== 'undefined' && formData instanceof URLSearchParams) {
    formData.forEach((val, key) => {
      rawObj[key] = val;
    });
  } else if (formData && typeof formData === 'object') {
    rawObj = { ...formData };
  } else {
    rawObj = {};
  }

  // Pre-coerce numbers, booleans, and dates if schema is an object
  if (schema instanceof GigliObject) {
    for (const key of Object.keys(schema.shape)) {
      const fieldSchema = schema.shape[key];
      const rawVal = rawObj[key];
      if (typeof rawVal === 'string') {
        if (fieldSchema instanceof GigliNumber) {
          const num = Number(rawVal);
          if (!Number.isNaN(num) && rawVal.trim() !== '') {
            rawObj[key] = num;
          }
        } else if (fieldSchema instanceof GigliBoolean) {
          if (rawVal === 'true' || rawVal === 'on' || rawVal === '1') {
            rawObj[key] = true;
          } else if (rawVal === 'false' || rawVal === 'off' || rawVal === '0') {
            rawObj[key] = false;
          }
        } else if (fieldSchema instanceof GigliDate) {
          const d = new Date(rawVal);
          if (!Number.isNaN(d.getTime())) {
            rawObj[key] = d;
          }
        }
      }
    }
  }

  const result = schema.safeParse(rawObj);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten(),
    };
  }

  return {
    success: true,
    data: result.data,
  };
}
