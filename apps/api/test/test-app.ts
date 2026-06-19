import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';

export const TEST_PASSWORD = 'Password123!';

/**
 * Boots a Nest application configured like production (cookie-parser, etc.)
 * for end-to-end tests. Disables chaos so assertions are deterministic.
 */
export async function createTestApp(): Promise<INestApplication> {
  process.env.CHAOS_ENABLED = 'false';
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret-test-secret-test-secret';
  process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '15m';

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  app.use(cookieParser());
  await app.init();
  return app;
}

/** Ensures the two demo accounts exist with a known password, and clears patients. */
export async function resetDatabase(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
    await prisma.patient.deleteMany();
    await prisma.user.upsert({
      where: { email: 'admin@demo.com' },
      update: { passwordHash, role: Role.admin },
      create: { email: 'admin@demo.com', passwordHash, role: Role.admin },
    });
    await prisma.user.upsert({
      where: { email: 'user@demo.com' },
      update: { passwordHash, role: Role.user },
      create: { email: 'user@demo.com', passwordHash, role: Role.user },
    });
  } finally {
    await prisma.$disconnect();
  }
}
