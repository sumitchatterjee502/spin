import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SKIP_STANDARD_RESPONSE } from '../decorators/skip-standard-response.decorator';

export type StandardSuccessBody<T = unknown> = {
  error: false;
  message: string;
  statusCode: number;
  responseData: T;
};

@Injectable()
export class StandardResponseInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardSuccessBody> {
    const res = context.switchToHttp().getResponse<Response>();
    const skip = this.reflector.getAllAndOverride<boolean>(
      SKIP_STANDARD_RESPONSE,
      [context.getHandler(), context.getClass()],
    );
    if (skip) {
      return next.handle() as Observable<StandardSuccessBody>;
    }

    return next.handle().pipe(
      map((payload: unknown) => {
        if (this.isCompleteEnvelope(payload)) {
          return payload;
        }

        const statusCode = res.statusCode ?? 200;

        if (this.isLegacyDataMessage(payload)) {
          const { data, message } = payload as {
            data: unknown;
            message: string;
          };
          return {
            error: false,
            message,
            statusCode,
            responseData: data,
          };
        }

        if (this.isPartialEnvelope(payload)) {
          const p = payload as {
            message: string;
            responseData: unknown;
            statusCode?: number;
          };
          return {
            error: false,
            message: p.message,
            statusCode: p.statusCode ?? statusCode,
            responseData: p.responseData,
          };
        }

        return {
          error: false,
          message: 'Success',
          statusCode,
          responseData: payload ?? null,
        };
      }),
    );
  }

  private isCompleteEnvelope(payload: unknown): payload is StandardSuccessBody {
    if (payload === null || typeof payload !== 'object') {
      return false;
    }
    const o = payload as Record<string, unknown>;
    return (
      o.error === false &&
      typeof o.message === 'string' &&
      typeof o.statusCode === 'number' &&
      'responseData' in o
    );
  }

  private isPartialEnvelope(payload: unknown): boolean {
    if (payload === null || typeof payload !== 'object') {
      return false;
    }
    const o = payload as Record<string, unknown>;
    return (
      typeof o.message === 'string' &&
      'responseData' in o &&
      o.error === undefined
    );
  }

  private isLegacyDataMessage(payload: unknown): boolean {
    if (payload === null || typeof payload !== 'object') {
      return false;
    }
    const o = payload as Record<string, unknown>;
    return (
      typeof o.message === 'string' && 'data' in o && !('responseData' in o)
    );
  }
}
