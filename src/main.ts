import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

async function bootstrap() {
  const corsOptions: CorsOptions = {
    origin: ['http://localhost:3000', 'https://allwebtool.com','https://*.allwebtool.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, 
  };

  const app = await NestFactory.create(AppModule);
  app.enableCors(corsOptions);
  app.use(cookieParser())
  app.useGlobalPipes(new ValidationPipe())
  app.setGlobalPrefix("api")
  await app.listen(8080);
}
bootstrap();
