import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { MerchantIdGuard } from '../../../src/webhook/guards/merchant-id.guard';
import { MerchantAuthService } from '../../../src/webhook/services/merchant-auth.service';

describe('MerchantIdGuard', () => {
  let guard: MerchantIdGuard;
  let merchantAuthService: MerchantAuthService;
  let mockExecutionContext: ExecutionContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MerchantIdGuard, MerchantAuthService],
    }).compile();

    guard = module.get<MerchantIdGuard>(MerchantIdGuard);
    merchantAuthService = module.get<MerchantAuthService>(MerchantAuthService);
  });

  const createMockExecutionContext = (
    headers: Record<string, string>,
    merchantId?: string,
  ): ExecutionContext => {
    return {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          headers,
          merchantId,
        }),
      }),
    } as any;
  };

  describe('canActivate', () => {
    it('should return true for valid merchant ID that matches authenticated merchant', () => {
      const headers = {
        'x-merchant-id': 'merchant_123',
      };
      mockExecutionContext = createMockExecutionContext(headers, 'merchant_123');

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockExecutionContext.switchToHttp().getRequest().merchantId).toBe('merchant_123');
    });

    it('should return true for valid merchant ID when no authenticated merchant (first guard)', () => {
      const headers = {
        'x-merchant-id': 'merchant_123',
      };
      mockExecutionContext = createMockExecutionContext(headers);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockExecutionContext.switchToHttp().getRequest().merchantId).toBe('merchant_123');
    });

    it('should return false when X-Merchant-Id header is missing', () => {
      const headers = {};
      mockExecutionContext = createMockExecutionContext(headers);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });

    it('should return false when merchant ID does not exist', () => {
      const headers = {
        'x-merchant-id': 'merchant_nonexistent',
      };
      mockExecutionContext = createMockExecutionContext(headers);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });

    it('should return false when merchant ID is inactive', () => {
      const headers = {
        'x-merchant-id': 'merchant_789',
      };
      mockExecutionContext = createMockExecutionContext(headers);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });

    it('should return false when merchant ID does not match authenticated merchant', () => {
      const headers = {
        'x-merchant-id': 'merchant_456',
      };
      mockExecutionContext = createMockExecutionContext(headers, 'merchant_123');

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });

    it('should return true when merchant ID matches authenticated merchant', () => {
      const headers = {
        'x-merchant-id': 'merchant_123',
      };
      mockExecutionContext = createMockExecutionContext(headers, 'merchant_123');

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should handle case sensitivity in merchant ID', () => {
      const headers = {
        'x-merchant-id': 'MERCHANT_123',
      };
      mockExecutionContext = createMockExecutionContext(headers, 'merchant_123');

      const result = guard.canActivate(mockExecutionContext);

      // Should return false because case doesn't match
      expect(result).toBe(false);
    });
  });
});
