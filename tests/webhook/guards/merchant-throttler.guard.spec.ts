import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import { MerchantThrottlerGuard } from '../../../src/webhook/guards/merchant-throttler.guard';

describe('MerchantThrottlerGuard', () => {
  let guard: MerchantThrottlerGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            name: 'default',
            ttl: 60000,
            limit: 100,
          },
        ]),
      ],
      providers: [MerchantThrottlerGuard],
    }).compile();

    guard = module.get<MerchantThrottlerGuard>(MerchantThrottlerGuard);
  });

  describe('getTracker', () => {
    it('should return merchant ID as tracker when merchant ID is present', async () => {
      const req = {
        merchantId: 'merchant_123',
        ip: '192.168.1.1',
      };

      const tracker = await guard['getTracker'](req);

      expect(tracker).toBe('merchant:merchant_123');
    });

    it('should return different tracker for different merchants', async () => {
      const req1 = { merchantId: 'merchant_123' };
      const req2 = { merchantId: 'merchant_456' };

      const tracker1 = await guard['getTracker'](req1);
      const tracker2 = await guard['getTracker'](req2);

      expect(tracker1).toBe('merchant:merchant_123');
      expect(tracker2).toBe('merchant:merchant_456');
      expect(tracker1).not.toBe(tracker2);
    });

    it('should return "unknown" when merchant ID is not present', async () => {
      const req = {
        ip: '192.168.1.1',
      };

      const tracker = await guard['getTracker'](req);

      expect(tracker).toBe('unknown');
    });

    it('should return "unknown" when request has no merchant ID or IP', async () => {
      const req = {};

      const tracker = await guard['getTracker'](req);

      expect(tracker).toBe('unknown');
    });

    it('should prioritize merchant ID over IP address', async () => {
      const req = {
        merchantId: 'merchant_123',
        ip: '192.168.1.1',
        connection: { remoteAddress: '10.0.0.1' },
      };

      const tracker = await guard['getTracker'](req);

      expect(tracker).toBe('merchant:merchant_123');
    });
  });
});
