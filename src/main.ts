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
import { COOKIE_SECRET, UPLOADS_URL } from './constants';
import { join } from 'path';

const PORT = process.env.PORT || 3030;

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  // Register plugins
  // >>> file management
  await app.register(multipart);
  await app.register(fastifyStatic, {
    root: join(__dirname, '..', 'uploads'), // local uploads folder
    prefix: `${UPLOADS_URL}/`, // URL prefix
  });

  // >>> cookies & cors management
  await app.register<FastifyCookieOptions>(cookie, {
    secret: COOKIE_SECRET,
  });
  await app.register(helmet);
  await app.register(cors, {
    origin: ['http://localhost:3000'],
    credentials: true,
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
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
  SwaggerModule.setup('swagger', app, document);

  await app.listen(PORT, '0.0.0.0');
  console.log(`✅ Server listening on http://localhost:${PORT}`);
}

bootstrap();
