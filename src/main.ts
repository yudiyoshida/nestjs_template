import helmet from 'helmet';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { pipeOptions } from './infra/validators/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('[Project name] REST API')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config, { autoTagControllers: false });
  SwaggerModule.setup('swagger', app, document);

  app.useGlobalPipes(new ValidationPipe(pipeOptions));

  app.use(helmet());
  app.enableCors();

  await app.listen(process.env.PORT as string);
}
bootstrap();
