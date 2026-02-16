import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { AppConfigService } from '../../src/config/app-config.service';

describe('WebhookController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    const appConfig = app.get(AppConfigService);
    
    app.setGlobalPrefix(appConfig.apiPrefix);
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/webhook (POST) - should return 403 for missing auth', () => {
    return request(app.getHttpServer())
      .post('/api/webhook?provider=stripe')
      .send({
        payload: {
          id: 'evt_123',
          object: 'event',
          type: 'charge.dispute.created',
          data: {
            object: {
              object: 'dispute',
              charge: 'ch_123',
              reason: 'fraudulent',
              currency: 'usd',
              amount: 5000,
            },
          },
        },
      })
      .expect(403);
  });

  it('/api/webhook (POST) - should return 400 for missing provider', () => {
    return request(app.getHttpServer())
      .post('/api/webhook')
      .set('Authorization', 'Bearer sk_test_merchant123_secret_key_abc')
      .set('X-Merchant-Id', 'merchant_123')
      .send({ payload: {} })
      .expect(400);
  });

  it('/api/webhook (POST) - should return 400 for invalid provider', () => {
    return request(app.getHttpServer())
      .post('/api/webhook?provider=invalid')
      .set('Authorization', 'Bearer sk_test_merchant123_secret_key_abc')
      .set('X-Merchant-Id', 'merchant_123')
      .send({
        payload: {
          id: 'evt_123',
          object: 'event',
          type: 'charge.dispute.created',
        },
      })
      .expect(400);
  });
});
