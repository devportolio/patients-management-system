import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from './env.validation';

/**
 * Strongly-typed config accessor. Inject this instead of raw ConfigService so
 * reads are type-checked against the validated env schema.
 *
 * Kept in its own file (separate from the module) so importing it does not
 * eagerly trigger ConfigModule.forRoot / env validation.
 */
@Injectable()
export class TypedConfigService {
  constructor(private readonly config: ConfigService<Env, true>) {}

  get<K extends keyof Env>(key: K): Env[K] {
    return this.config.get(key, { infer: true });
  }
}
