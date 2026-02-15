// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app-config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const appConfig = app.get(AppConfigService);
  const logger = new Logger('Bootstrap');
  
  app.setGlobalPrefix(appConfig.apiPrefix);
  
  const config = new DocumentBuilder()
    .setTitle('Forter Webhook Mapping API')
    .setDescription('API for transforming payment provider webhooks into Forter\'s normalized chargeback schema')
    .setVersion('1.0')
    .addTag('webhooks', 'Webhook transformation endpoints')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${appConfig.apiPrefix}/docs`, app, document);
  
  // Enable CORS
  // app.enableCors({
  //   origin: appConfig.corsOrigin,
  //   credentials: true,
  // });
  
  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  
  await app.listen(appConfig.port, () => {
    logger.log(`🚀 Application is running on: http://localhost:${appConfig.port}/${appConfig.apiPrefix}`);
    logger.log(`📚 Swagger documentation available at: http://localhost:${appConfig.port}/${appConfig.apiPrefix}/docs`);
  });
}

bootstrap();