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
import { join } from 'path';

const PORT = process.env.PORT || 3030;

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

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
    }),
  );

  // Swagger Config
  const config = new DocumentBuilder()
    .setTitle('RealEstate API')
    .setDescription('API docs for client apps')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Setup Swagger UI at /swagger
  SwaggerModule.setup('swagger', app, document);

  // NOTE: SwaggerModule.setup already exposes the OpenAPI JSON at /swagger-json for the
  // Fastify/Express adapter. Removing a manual registration to avoid duplicated routes.

  await app.listen(PORT, '0.0.0.0');
  console.log(`✅ Server listening on http://localhost:${PORT}`);
}

bootstrap();
