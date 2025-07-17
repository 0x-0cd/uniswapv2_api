import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3000;

  // Generate document page.
  const config = new DocumentBuilder()
    .setTitle('UniswapV2 API')
    .setDescription('A series of APIs to fetch information from UniswapV2')
    .setVersion('0.0.1')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  await app.listen(port);
  new Logger(AppModule.name).debug(`Server Listening on Port: ${port}`);
  new Logger(AppModule.name).debug(
    `Swagger API Doc @ http://localhost:${port}/docs`,
  );
}
bootstrap();
