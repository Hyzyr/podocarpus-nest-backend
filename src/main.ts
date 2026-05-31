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
import { Readable } from 'stream';

const PORT = process.env.PORT || 3030;

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  // >>> file management
  await app.register(multipart, {
    limits: {
      fileSize: 6 * 1024 * 1024, // 6 MB per file
    },
  });
  await app.register(fastifyStatic, {
    root: join(process.cwd(), UPLOADS_URL.replaceAll('/', '')), // local uploads folder
    prefix: `${UPLOADS_URL}/`, // URL prefix
  });

  // >>> cookies & cors management
  await app.register<FastifyCookieOptions>(cookie, {
    secret: COOKIE_SECRET,
  });
  await app.register(helmet);
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

  const fastify = app.getHttpAdapter().getInstance();
  fastify.addHook('preParsing', async (request, _reply, payload) => {
    const requestPath = request.url.split('?')[0];
    if (
      request.method !== 'POST' ||
      requestPath !== '/api/billing/webhooks/stripe'
    ) {
      return payload;
    }

    const chunks: Buffer[] = [];
    for await (const chunk of payload as AsyncIterable<Buffer | string>) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }

    const rawBody = Buffer.concat(chunks);
    (request as typeof request & { rawBody?: Buffer }).rawBody = rawBody;

    const replayedPayload = Readable.from([rawBody]);
    (
      replayedPayload as typeof replayedPayload & {
        receivedEncodedLength?: number;
      }
    ).receivedEncodedLength = rawBody.length;

    return replayedPayload;
  });

  // Health check (outside /api prefix — accessible at GET /health)
  fastify.get('/health', () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));

  await app.listen(PORT, '0.0.0.0');
  console.log(`✅ Server listening on http://localhost:${PORT}`);
}

void bootstrap();
