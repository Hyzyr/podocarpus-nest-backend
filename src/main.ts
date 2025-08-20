import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

    await app.register(helmet);
    // await app.register(cors, { origin: true });

  await app.listen(3000);
  console.log('✅ Server listening on http://localhost:3000');
}
bootstrap();
