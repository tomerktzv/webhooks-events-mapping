import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { MerchantAuthGuard } from '../../../src/webhook/guards/merchant-auth.guard';
import { MerchantAuthService } from '../../../src/webhook/services/merchant-auth.service';

describe('MerchantAuthGuard', () => {
  let guard: MerchantAuthGuard;
  let merchantAuthService: MerchantAuthService;
  let mockExecutionContext: ExecutionContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MerchantAuthGuard, MerchantAuthService],
    }).compile();

    guard = module.get<MerchantAuthGuard>(MerchantAuthGuard);
    merchantAuthService = module.get<MerchantAuthService>(MerchantAuthService);
  });

  const createMockExecutionContext = (headers: Record<string, string>): ExecutionContext => {
    return {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          headers,
          merchantId: undefined,
        }),
      }),
    } as any;
  };

  describe('canActivate', () => {
    it('should return true for valid API key in X-Forter-API-Key header', () => {
      const headers = {
        'x-forter-api-key': 'sk_test_merchant123_secret_key_abc',
      };
      mockExecutionContext = createMockExecutionContext(headers);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockExecutionContext.switchToHttp().getRequest().merchantId).toBe('merchant_123');
    });

    it('should return true for valid API key with Bearer prefix in X-Forter-API-Key header', () => {
      const headers = {
        'x-forter-api-key': 'Bearer sk_test_merchant123_secret_key_abc',
      };
      mockExecutionContext = createMockExecutionContext(headers);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockExecutionContext.switchToHttp().getRequest().merchantId).toBe('merchant_123');
    });

    it('should return true for valid API key in Authorization header', () => {
      const headers = {
        authorization: 'Bearer sk_test_merchant123_secret_key_abc',
      };
      mockExecutionContext = createMockExecutionContext(headers);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockExecutionContext.switchToHttp().getRequest().merchantId).toBe('merchant_123');
    });

    it('should return false when API key is missing', () => {
      const headers = {};
      mockExecutionContext = createMockExecutionContext(headers);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });

    it('should return false when API key is invalid', () => {
      const headers = {
        'x-forter-api-key': 'invalid_api_key',
      };
      mockExecutionContext = createMockExecutionContext(headers);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });

    it('should return false when API key belongs to inactive merchant', () => {
      const headers = {
        'x-forter-api-key': 'sk_test_merchant789_secret_key_def',
      };
      mockExecutionContext = createMockExecutionContext(headers);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });

    it('should prioritize Authorization header over X-Forter-API-Key header', () => {
      const headers = {
        authorization: 'Bearer sk_test_merchant123_secret_key_abc',
        'x-forter-api-key': 'sk_test_merchant456_secret_key_xyz',
      };
      mockExecutionContext = createMockExecutionContext(headers);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockExecutionContext.switchToHttp().getRequest().merchantId).toBe('merchant_123');
    });

    it('should handle Bearer prefix case insensitively', () => {
      const headers = {
        'x-forter-api-key': 'bearer sk_test_merchant123_secret_key_abc',
      };
      mockExecutionContext = createMockExecutionContext(headers);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockExecutionContext.switchToHttp().getRequest().merchantId).toBe('merchant_123');
    });

    it('should trim whitespace from API key', () => {
      const headers = {
        'x-forter-api-key': '  sk_test_merchant123_secret_key_abc  ',
      };
      mockExecutionContext = createMockExecutionContext(headers);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockExecutionContext.switchToHttp().getRequest().merchantId).toBe('merchant_123');
    });
  });
});
