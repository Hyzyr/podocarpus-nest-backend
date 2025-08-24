import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import helmet from '@fastify/helmet';
import { ValidationPipe } from '@nestjs/common';
// import cors from '@fastify/cors';

const PORT = process.env.PORT || 3030;

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  await app.register(helmet);
  // await app.register(cors, { origin: true });
  
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  // Swagger Config
  const config = new DocumentBuilder()
    .setTitle('RealEstate API')
    .setDescription('API docs for client apps')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  await app.listen(PORT);
  console.log(`✅ Server listening on http://localhost:${PORT}`);
}
bootstrap();
