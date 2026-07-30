import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';

import cookie, { FastifyCookieOptions } from '@fastify/cookie';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { ValidationPipe } from '@nestjs/common';
import { COOKIE_SECRET, UPLOADS_URL } from 'src/common/constants';
import { AllExceptionsFilter } from 'src/common/filters/all-exceptions.filter';
import { PrismaExceptionFilter } from 'src/common/filters/prisma-exception.filter';
import { validationExceptionFactory } from 'src/common/http/validation-exception.factory';
import {
  ActionResponseDto,
  ApiErrorDto,
  FieldErrorDto,
  PaginatedDto,
} from 'src/common/http/api-response.dto';
import { join } from 'path';
import { randomUUID } from 'crypto';

const PORT = process.env.PORT || 3030;

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      // Reuse an upstream request id when one is supplied (proxy, frontend,
      // another service) so a single id follows the request across hops;
      // otherwise mint one. It is echoed on responses and in error bodies.
      genReqId: (req) =>
        (req.headers['x-request-id'] as string) || randomUUID(),
    }),
  );

  // Echo the id back so the caller can quote it in a bug report.
  app.getHttpAdapter().getInstance().addHook('onSend', (req, reply, payload, done) => {
    reply.header('x-request-id', req.id);
    done(null, payload);
  });

  // Register plugins
  // >>> file management
  // @ts-ignore - Fastify v5 plugin type incompatibility with NestJS FastifyAdapter
  await app.register(multipart, {
    limits: {
      fileSize: 6 * 1024 * 1024, // 6 MB per file
    },
  });
  // @ts-ignore - Fastify v5 plugin type incompatibility with NestJS FastifyAdapter
  await app.register(fastifyStatic, {
    root: join(process.cwd(), UPLOADS_URL.replaceAll('/', '')), // local uploads folder
    prefix: `${UPLOADS_URL}/`, // URL prefix
  });

  // >>> cookies & cors management
  // @ts-ignore - Fastify v5 plugin type incompatibility with NestJS FastifyAdapter
  await app.register<FastifyCookieOptions>(cookie, {
    secret: COOKIE_SECRET,
  });
  // @ts-ignore - Fastify v5 plugin type incompatibility with NestJS FastifyAdapter
  await app.register(helmet);
  // @ts-ignore - Fastify v5 plugin type incompatibility with NestJS FastifyAdapter
  await app.register(cors, {
     origin: [
      'http://localhost:3000',
      'https://pdcps.co',
      'https://www.pdcps.co',
    ],
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidNonWhitelisted: false, // Allow extra properties to be stripped instead of throwing errors
      // Field-level errors, so a form can highlight the offending input
      // instead of receiving one flattened string.
      exceptionFactory: validationExceptionFactory,
    }),
  );

  // Global error handling. Order matters: Nest applies the LAST matching
  // filter, so the specific Prisma one is registered after the catch-all.
  app.useGlobalFilters(new AllExceptionsFilter(), new PrismaExceptionFilter());

  // Swagger Config
  const config = new DocumentBuilder()
    .setTitle('RealEstate API')
    .setDescription('API docs for client apps')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  // PaginatedDto is generic and ApiErrorDto is produced by a filter rather than
  // a handler, so neither is reachable by Swagger's type scanning — register
  // them explicitly or $ref lookups against them resolve to nothing.
  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [PaginatedDto, ApiErrorDto, ActionResponseDto, FieldErrorDto],
  });

  // Setup Swagger UI at /swagger
  SwaggerModule.setup('swagger', app, document);

  // NOTE: SwaggerModule.setup already exposes the OpenAPI JSON at /swagger-json for the
  // Fastify/Express adapter. Removing a manual registration to avoid duplicated routes.

  // Health check (outside /api prefix — accessible at GET /health)
  const fastify = app.getHttpAdapter().getInstance();
  fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  await app.listen(PORT, '0.0.0.0');
  console.log(`✅ Server listening on http://localhost:${PORT}`);
}

bootstrap();
