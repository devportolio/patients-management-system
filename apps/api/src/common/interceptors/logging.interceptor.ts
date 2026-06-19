import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { type Observable, tap } from 'rxjs';

/** Structured request/response logging with duration, for easy debugging. */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url } = request;
    const startedAt = process.hrtime.bigint();

    return next.handle().pipe(
      tap({
        next: () => this.log(method, url, startedAt),
        error: () => this.log(method, url, startedAt, true),
      }),
    );
  }

  private log(method: string, url: string, startedAt: bigint, errored = false): void {
    const ms = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const message = `${method} ${url} (${ms.toFixed(1)}ms)`;
    if (errored) {
      this.logger.warn(`✗ ${message}`);
    } else {
      this.logger.log(`✓ ${message}`);
    }
  }
}
