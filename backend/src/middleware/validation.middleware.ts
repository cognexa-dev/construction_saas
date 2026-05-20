import { Request, Response, NextFunction } from 'express';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { sendError } from '../utils/response';

type ClassConstructor<T> = new (...args: unknown[]) => T;

export function validateBody<T extends object>(cls: ClassConstructor<T>) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const instance = plainToInstance(cls, req.body);
    const errors: ValidationError[] = await validate(instance as object, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      const messages = errors.flatMap((e) =>
        Object.values(e.constraints || {})
      );
      sendError(res, 'Validation failed', 422, messages);
      return;
    }

    req.body = instance;
    next();
  };
}

export function validateQuery<T extends object>(cls: ClassConstructor<T>) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const instance = plainToInstance(cls, req.query);
    const errors: ValidationError[] = await validate(instance as object, {
      whitelist: true,
      skipMissingProperties: true,
    });

    if (errors.length > 0) {
      const messages = errors.flatMap((e) => Object.values(e.constraints || {}));
      sendError(res, 'Invalid query parameters', 422, messages);
      return;
    }

    req.query = instance as typeof req.query;
    next();
  };
}
