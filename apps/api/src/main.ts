import 'reflect-metadata';
import { Logger, type INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { TypedConfigService } from './config/typed-config.service';

function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Patients Management System API')
    .setDescription(
      'Role-aware REST API for managing patient records. ' +
        'Authenticate via POST /auth/login (sets an httpOnly cookie); the cookie ' +
        'is sent automatically, or pass the returned token as a Bearer header.',
    )
    .setVersion('1.0.0')
    .addCookieAuth('access_token', { type: 'apiKey', in: 'cookie', name: 'access_token' })
    .addBearerAuth()
    .addTag('Auth', 'Login, logout, and current session')
    .addTag('Patients', 'CRUD for patient records (writes are admin-only)')
    .addTag('Health', 'Liveness and database connectivity')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
    customSiteTitle: 'PMS API Docs',
  });
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  const config = app.get(TypedConfigService);

  app.use(cookieParser());

  app.enableCors({
    origin: config.get('WEB_ORIGIN'),
    credentials: true,
  });

  setupSwagger(app);

  app.enableShutdownHooks();

  const port = config.get('PORT');
  await app.listen(port, '0.0.0.0');
  const logger = new Logger('Bootstrap');
  logger.log(`🚀 API listening on http://localhost:${port}`);
  logger.log(`📚 API docs (Swagger) at http://localhost:${port}/docs`);
}

void bootstrap();
