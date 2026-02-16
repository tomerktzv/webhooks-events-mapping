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

  it('/api/webhook (POST) - should successfully transform valid Stripe webhook', () => {
    return request(app.getHttpServer())
      .post('/api/webhook?provider=stripe')
      .set('Authorization', 'Bearer sk_test_merchant123_secret_key_abc')
      .set('X-Merchant-Id', 'merchant_123')
      .set('Content-Type', 'application/json')
      .send({
        payload: {
          id: 'evt_1OZF3t2eZvKYlo2CqD8kJZ7n',
          object: 'event',
          type: 'charge.dispute.created',
          data: {
            object: {
              object: 'dispute',
              charge: 'ch_3OZF3r2eZvKYlo2C1k5D6f7g',
              reason: 'fraudulent',
              currency: 'usd',
              amount: 5000,
            },
          },
        },
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('result');
        expect(res.body.result).toMatchObject({
          transaction_id: 'ch_3OZF3r2eZvKYlo2C1k5D6f7g',
          reason: 'fraudulent',
          currency: 'USD',
          amount: 5000,
          provider: 'stripe',
        });
      });
  });
});
