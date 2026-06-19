import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  ServiceUnavailableException,
  type NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { type Observable, delay, throwError } from 'rxjs';
import { TypedConfigService } from '../../config/typed-config.service';

/**
 * Resilience demo: when CHAOS_ENABLED is set, randomly injects latency and a
 * configurable rate of transient 503 failures so the frontend's loading,
 * error, retry and rollback paths can be exercised against a real backend.
 *
 * Never disrupts auth (login/logout/me) or health checks — only the data
 * endpoints, so you can always sign in and observe the chaos on the list/CRUD.
 */
@Injectable()
export class ChaosInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Chaos');
  private readonly enabled: boolean;
  private readonly failureRate: number;
  private readonly minLatency: number;
  private readonly maxLatency: number;

  constructor(config: TypedConfigService) {
    this.enabled = config.get('CHAOS_ENABLED');
    this.failureRate = config.get('CHAOS_FAILURE_RATE');
    this.minLatency = config.get('CHAOS_MIN_LATENCY_MS');
    this.maxLatency = config.get('CHAOS_MAX_LATENCY_MS');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (!this.enabled) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    if (this.isExempt(request.url)) {
      return next.handle();
    }

    if (Math.random() < this.failureRate) {
      this.logger.warn(`💥 Injected transient failure on ${request.method} ${request.url}`);
      return throwError(
        () => new ServiceUnavailableException('Simulated transient failure — please retry'),
      );
    }

    const latency = Math.round(
      this.minLatency + Math.random() * Math.max(0, this.maxLatency - this.minLatency),
    );
    return next.handle().pipe(delay(latency));
  }

  private isExempt(url: string): boolean {
    return url.startsWith('/health') || url.startsWith('/auth');
  }
}
