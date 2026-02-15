import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { MerchantAuthGuard } from '../../../src/webhook/guards/merchant-auth.guard';
import { MerchantIdGuard } from '../../../src/webhook/guards/merchant-id.guard';
import { MerchantAuthService } from '../../../src/webhook/services/merchant-auth.service';

describe('Guards Integration', () => {
  let authGuard: MerchantAuthGuard;
  let merchantIdGuard: MerchantIdGuard;
  let merchantAuthService: MerchantAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MerchantAuthGuard,
        MerchantIdGuard,
        MerchantAuthService,
      ],
    }).compile();

    authGuard = module.get<MerchantAuthGuard>(MerchantAuthGuard);
    merchantIdGuard = module.get<MerchantIdGuard>(MerchantIdGuard);
    merchantAuthService = module.get<MerchantAuthService>(MerchantAuthService);
  });

  const createMockExecutionContext = (headers: Record<string, string>): ExecutionContext => {
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

  describe('Guard Chain', () => {
    it('should pass when both guards succeed with matching merchant', () => {
      const headers = {
        'x-forter-api-key': 'sk_test_merchant123_secret_key_abc',
        'x-merchant-id': 'merchant_123',
      };
      const context = createMockExecutionContext(headers);

      const authResult = authGuard.canActivate(context);
      expect(authResult).toBe(true);

      const merchantIdResult = merchantIdGuard.canActivate(context);
      expect(merchantIdResult).toBe(true);
    });

    it('should fail when auth guard fails (invalid API key)', () => {
      const headers = {
        'x-forter-api-key': 'invalid_key',
        'x-merchant-id': 'merchant_123',
      };
      const context = createMockExecutionContext(headers);

      const authResult = authGuard.canActivate(context);
      expect(authResult).toBe(false);

      // Merchant ID guard can still pass independently (it doesn't know about auth failure)
      // But in real flow, if auth guard fails, the request would be rejected before merchant ID guard runs
      // However, merchant ID guard will fail if merchant ID doesn't match authenticated merchant
      // Since auth failed, there's no authenticated merchant, so merchant ID guard can pass
      const merchantIdResult = merchantIdGuard.canActivate(context);
      // Merchant ID guard validates the merchant exists and is active, which merchant_123 is
      expect(merchantIdResult).toBe(true);
    });

    it('should fail when merchant ID guard fails (mismatched merchant)', () => {
      const headers = {
        'x-forter-api-key': 'sk_test_merchant123_secret_key_abc',
        'x-merchant-id': 'merchant_456', // Different merchant
      };
      const context = createMockExecutionContext(headers);

      const authResult = authGuard.canActivate(context);
      expect(authResult).toBe(true); // Auth succeeds

      const merchantIdResult = merchantIdGuard.canActivate(context);
      expect(merchantIdResult).toBe(false); // Merchant ID mismatch fails
    });

    it('should fail when merchant ID is missing', () => {
      const headers = {
        'x-forter-api-key': 'sk_test_merchant123_secret_key_abc',
      };
      const context = createMockExecutionContext(headers);

      const authResult = authGuard.canActivate(context);
      expect(authResult).toBe(true);

      const merchantIdResult = merchantIdGuard.canActivate(context);
      expect(merchantIdResult).toBe(false);
    });

    it('should fail when API key is missing', () => {
      const headers = {
        'x-merchant-id': 'merchant_123',
      };
      const context = createMockExecutionContext(headers);

      const authResult = authGuard.canActivate(context);
      expect(authResult).toBe(false);
    });

    it('should handle inactive merchant correctly', () => {
      const headers = {
        'x-forter-api-key': 'sk_test_merchant789_secret_key_def',
        'x-merchant-id': 'merchant_789',
      };
      const context = createMockExecutionContext(headers);

      const authResult = authGuard.canActivate(context);
      expect(authResult).toBe(false); // Inactive merchant fails auth
    });
  });
});
