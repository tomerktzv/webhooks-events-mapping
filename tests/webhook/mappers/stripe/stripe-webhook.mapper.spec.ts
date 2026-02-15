import { Test, TestingModule } from '@nestjs/testing';
import { StripeWebhookMapper } from '../../../../src/webhook/mappers/stripe/stripe-webhook.mapper';
import { PaymentProvider } from '../../../../src/webhook/enums/payment-provider.enum';
import { StripeEventType } from '../../../../src/webhook/enums/stripe-event-type.enum';
import { ForterChargeback } from '../../../../src/webhook/schemas/forter-chargeback.schema';

describe('StripeWebhookMapper', () => {
  let mapper: StripeWebhookMapper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StripeWebhookMapper],
    }).compile();

    mapper = module.get<StripeWebhookMapper>(StripeWebhookMapper);
  });

  describe('getProviderName', () => {
    it('should return stripe provider name', () => {
      expect(mapper.getProviderName()).toBe(PaymentProvider.STRIPE);
    });
  });

  describe('extractEventType', () => {
    it('should extract supported event type', () => {
      const payload = {
        type: StripeEventType.CHARGE_DISPUTE_CREATED,
      };

      const result = mapper.extractEventType(payload);
      expect(result).toBe(StripeEventType.CHARGE_DISPUTE_CREATED);
    });

    it('should return null for unsupported event type', () => {
      const payload = {
        type: 'unsupported.event.type',
      };

      const result = mapper.extractEventType(payload);
      expect(result).toBeNull();
    });

    it('should return null when type is missing', () => {
      const payload = {};

      const result = mapper.extractEventType(payload);
      expect(result).toBeNull();
    });

    it('should return null when payload is null', () => {
      const result = mapper.extractEventType(null);
      expect(result).toBeNull();
    });

    it('should return null when payload is undefined', () => {
      const result = mapper.extractEventType(undefined);
      expect(result).toBeNull();
    });
  });

  describe('verifyEventType', () => {
    it('should return true for supported event type with mapping', () => {
      const result = mapper.verifyEventType(StripeEventType.CHARGE_DISPUTE_CREATED);
      expect(result).toBe(true);
    });

    it('should return false for unsupported event type', () => {
      const result = mapper.verifyEventType('unsupported.event.type');
      expect(result).toBe(false);
    });
  });

  describe('validatePayload', () => {
    const validPayload = {
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
    };

    it('should validate a valid payload', () => {
      const result = mapper.validatePayload(validPayload);
      expect(result.valid).toBe(true);
    });

    it('should reject payload with null', () => {
      const result = mapper.validatePayload(null);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Payload is empty or null');
    });

    it('should reject payload with wrong object type', () => {
      const payload = {
        ...validPayload,
        object: 'charge',
      };

      const result = mapper.validatePayload(payload);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      // Error should mention event or object
      expect(result.error?.toLowerCase()).toMatch(/event|object/);
    });

    it('should reject payload missing type field', () => {
      const payload = {
        ...validPayload,
        type: undefined,
      };

      const result = mapper.validatePayload(payload);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      // Error should mention type
      expect(result.error?.toLowerCase()).toMatch(/type/);
    });

    it('should reject payload missing data field', () => {
      const payload = {
        ...validPayload,
        data: undefined,
      };

      const result = mapper.validatePayload(payload);
      expect(result.valid).toBe(false);
    });

    it('should reject payload missing data.object field', () => {
      const payload = {
        ...validPayload,
        data: {},
      };

      const result = mapper.validatePayload(payload);
      expect(result.valid).toBe(false);
    });

    it('should validate dispute object with all required fields', () => {
      const result = mapper.validatePayload(validPayload);
      expect(result.valid).toBe(true);
    });

    it('should reject dispute object missing charge field', () => {
      const payload = {
        ...validPayload,
        data: {
          object: {
            object: 'dispute',
            reason: 'fraudulent',
            currency: 'usd',
            amount: 5000,
          },
        },
      };

      const result = mapper.validatePayload(payload);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      // Error should mention charge field
      expect(result.error?.toLowerCase()).toMatch(/charge/);
    });

    it('should reject dispute object missing reason field', () => {
      const payload = {
        ...validPayload,
        data: {
          object: {
            object: 'dispute',
            charge: 'ch_123',
            currency: 'usd',
            amount: 5000,
          },
        },
      };

      const result = mapper.validatePayload(payload);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      // Error should mention reason field
      expect(result.error?.toLowerCase()).toMatch(/reason/);
    });

    it('should reject dispute object missing currency field', () => {
      const payload = {
        ...validPayload,
        data: {
          object: {
            object: 'dispute',
            charge: 'ch_123',
            reason: 'fraudulent',
            amount: 5000,
          },
        },
      };

      const result = mapper.validatePayload(payload);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      // Error should mention currency field
      expect(result.error?.toLowerCase()).toMatch(/currency/);
    });

    it('should reject dispute object missing amount field', () => {
      const payload = {
        ...validPayload,
        data: {
          object: {
            object: 'dispute',
            charge: 'ch_123',
            reason: 'fraudulent',
            currency: 'usd',
          },
        },
      };

      const result = mapper.validatePayload(payload);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      // Error should mention amount field
      expect(result.error?.toLowerCase()).toMatch(/amount/);
    });
  });

  describe('getMappingExpression', () => {
    it('should return mapping expression for supported event type', () => {
      const expression = mapper.getMappingExpression(StripeEventType.CHARGE_DISPUTE_CREATED);
      expect(expression).toBeDefined();
      expect(typeof expression).toBe('string');
    });

    it('should return null for unsupported event type', () => {
      const expression = mapper.getMappingExpression('unsupported.event.type');
      expect(expression).toBeNull();
    });
  });

  describe('preProcessPayload', () => {
    it('should return payload as-is', () => {
      const payload = { test: 'data' };
      const result = mapper.preProcessPayload(payload);
      expect(result).toBe(payload);
    });
  });

  describe('postProcessResult', () => {
    it('should uppercase currency', () => {
      const result: ForterChargeback = {
        transaction_id: 'ch_123',
        reason: 'fraudulent',
        currency: 'usd',
        amount: 5000,
      };

      const processed = mapper.postProcessResult(result);
      expect(processed.currency).toBe('USD');
      // Verify the original object was also mutated (same reference)
      expect(result.currency).toBe('USD');
    });

    it('should convert amount to number', () => {
      const result: any = {
        transaction_id: 'ch_123',
        reason: 'fraudulent',
        currency: 'USD',
        amount: '5000',
      };

      const processed = mapper.postProcessResult(result);
      expect(typeof processed.amount).toBe('number');
      expect(processed.amount).toBe(5000);
    });

    it('should handle amount that is already a number', () => {
      const result: ForterChargeback = {
        transaction_id: 'ch_123',
        reason: 'fraudulent',
        currency: 'USD',
        amount: 5000,
      };

      const processed = mapper.postProcessResult(result);
      expect(processed.amount).toBe(5000);
    });

    it('should handle result with undefined currency', () => {
      const result: any = {
        transaction_id: 'ch_123',
        reason: 'fraudulent',
        amount: 5000,
      };

      const processed = mapper.postProcessResult(result);
      expect(processed).toBeDefined();
    });
  });
});
