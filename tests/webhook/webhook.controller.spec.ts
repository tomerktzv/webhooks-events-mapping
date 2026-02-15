import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ExecutionContext } from '@nestjs/common';
import { WebhookController } from '../../src/webhook/webhook.controller';
import { WebhookService } from '../../src/webhook/services/webhook.service';
import { MerchantAuthGuard } from '../../src/webhook/guards/merchant-auth.guard';
import { MerchantIdGuard } from '../../src/webhook/guards/merchant-id.guard';
import { MerchantAuthService } from '../../src/webhook/services/merchant-auth.service';
import { ForterChargeback } from '../../src/webhook/schemas/forter-chargeback.schema';
import { PaymentProvider } from '../../src/webhook/enums/payment-provider.enum';
import { ProviderValidationPipe } from '../../src/webhook/pipes/provider-validation.pipe';

describe('WebhookController', () => {
  let controller: WebhookController;
  let service: WebhookService;
  let authGuard: MerchantAuthGuard;
  let merchantIdGuard: MerchantIdGuard;

  const mockWebhookService = {
    processWebhook: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhookController],
      providers: [
        {
          provide: WebhookService,
          useValue: mockWebhookService,
        },
        MerchantAuthGuard,
        MerchantIdGuard,
        MerchantAuthService,
      ],
    }).compile();

    controller = module.get<WebhookController>(WebhookController);
    service = module.get<WebhookService>(WebhookService);
    authGuard = module.get<MerchantAuthGuard>(MerchantAuthGuard);
    merchantIdGuard = module.get<MerchantIdGuard>(MerchantIdGuard);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /webhook', () => {
    it('should process a Stripe chargeback webhook successfully', async () => {
      const stripeWebhookPayload = {
        id: 'evt_1OZF3t2eZvKYlo2CqD8kJZ7n',
        object: 'event',
        api_version: '2023-10-16',
        created: 1708012345,
        data: {
          object: {
            id: 'dp_1OZF3s2eZvKYlo2C8hG4Kz9m',
            object: 'dispute',
            amount: 5000,
            balance_transactions: [],
            charge: 'ch_3OZF3r2eZvKYlo2C1k5D6f7g',
            created: 1708012344,
            currency: 'usd',
            evidence: {},
            evidence_details: {
              due_by: 1709222400,
              has_evidence: false,
              past_due: false,
              submission_count: 0,
            },
            is_charge_refundable: true,
            livemode: false,
            metadata: {},
            network_reason_code: '83',
            payment_intent: 'pi_3OZF3r2eZvKYlo2C1a2B3c4d',
            payment_method_details: {
              card: {
                brand: 'visa',
                network_reason_code: '83',
              },
              type: 'card',
            },
            reason: 'fraudulent',
            status: 'needs_response',
          },
        },
        livemode: false,
        pending_webhooks: 1,
        request: {
          id: null,
          idempotency_key: null,
        },
        type: 'charge.dispute.created',
      };

      const expectedResult: ForterChargeback = {
        transaction_id: 'ch_3OZF3r2eZvKYlo2C1k5D6f7g',
        reason: 'fraudulent',
        currency: 'USD',
        amount: 5000,
        provider: PaymentProvider.STRIPE,
      };

      mockWebhookService.processWebhook.mockResolvedValue(expectedResult);

      const mockRequest = { merchantId: 'merchant_123' };
      const result = await controller.processWebhook(
        { payload: stripeWebhookPayload },
        PaymentProvider.STRIPE,
        mockRequest,
      );

      expect(result).toEqual({ result: expectedResult });
      expect(service.processWebhook).toHaveBeenCalledWith(stripeWebhookPayload, PaymentProvider.STRIPE);
    });

    it('should throw error when provider is missing', () => {
      // In unit tests, pipes don't run automatically, so we test the pipe directly
      // The pipe validation is tested separately in provider-validation.pipe.spec.ts
      const pipe = new ProviderValidationPipe();
      
      expect(() => {
        pipe.transform(undefined as any);
      }).toThrow(BadRequestException);
    });

    it('should throw error when service throws an error', async () => {
      const error = new Error('Service error');
      mockWebhookService.processWebhook.mockRejectedValue(error);

      const mockRequest = { merchantId: 'merchant_123' };
      await expect(
        controller.processWebhook({ payload: {} }, PaymentProvider.STRIPE, mockRequest),
      ).rejects.toThrow('Service error');
    });
  });

  describe('Authentication and Authorization', () => {
    const createMockContext = (headers: Record<string, string>): ExecutionContext => {
      const request = {
        headers,
        merchantId: undefined,
      };
      return {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(request),
        }),
      } as any;
    };

    it('should allow request with valid API key and merchant ID', () => {
      const context = createMockContext({
        'x-forter-api-key': 'sk_test_merchant123_secret_key_abc',
        'x-merchant-id': 'merchant_123',
      });

      const authResult = authGuard.canActivate(context);
      expect(authResult).toBe(true);

      const merchantIdResult = merchantIdGuard.canActivate(context);
      expect(merchantIdResult).toBe(true);
    });

    it('should reject request with missing API key', () => {
      const context = createMockContext({
        'x-merchant-id': 'merchant_123',
      });

      const result = authGuard.canActivate(context);
      expect(result).toBe(false);
    });

    it('should reject request with invalid API key', () => {
      const context = createMockContext({
        'x-forter-api-key': 'invalid_key',
        'x-merchant-id': 'merchant_123',
      });

      const result = authGuard.canActivate(context);
      expect(result).toBe(false);
    });

    it('should reject request with missing merchant ID', () => {
      const context = createMockContext({
        'x-forter-api-key': 'sk_test_merchant123_secret_key_abc',
      });

      const authResult = authGuard.canActivate(context);
      expect(authResult).toBe(true);

      const merchantIdResult = merchantIdGuard.canActivate(context);
      expect(merchantIdResult).toBe(false);
    });

    it('should reject request with invalid merchant ID', () => {
      const context = createMockContext({
        'x-forter-api-key': 'sk_test_merchant123_secret_key_abc',
        'x-merchant-id': 'merchant_nonexistent',
      });

      const authResult = authGuard.canActivate(context);
      expect(authResult).toBe(true);

      const merchantIdResult = merchantIdGuard.canActivate(context);
      expect(merchantIdResult).toBe(false);
    });

    it('should reject request when merchant ID does not match authenticated merchant', () => {
      const context = createMockContext({
        'x-forter-api-key': 'sk_test_merchant123_secret_key_abc',
        'x-merchant-id': 'merchant_456', // Different merchant
      });

      const authResult = authGuard.canActivate(context);
      expect(authResult).toBe(true);

      const merchantIdResult = merchantIdGuard.canActivate(context);
      expect(merchantIdResult).toBe(false);
    });

    it('should reject request with inactive merchant API key', () => {
      const context = createMockContext({
        'x-forter-api-key': 'sk_test_merchant789_secret_key_def',
        'x-merchant-id': 'merchant_789',
      });

      const result = authGuard.canActivate(context);
      expect(result).toBe(false);
    });

    it('should accept request with Authorization header instead of X-Forter-API-Key', () => {
      const context = createMockContext({
        authorization: 'Bearer sk_test_merchant123_secret_key_abc',
        'x-merchant-id': 'merchant_123',
      });

      const authResult = authGuard.canActivate(context);
      expect(authResult).toBe(true);

      const merchantIdResult = merchantIdGuard.canActivate(context);
      expect(merchantIdResult).toBe(true);
    });
  });
});
