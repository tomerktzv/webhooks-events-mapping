import { Test, TestingModule } from '@nestjs/testing';
import { MappingHelperService } from '../../../src/webhook/services/mapping-helper.service';
import { MappingExecutionError } from '../../../src/webhook/errors/webhook.errors';

describe('MappingHelperService', () => {
  let service: MappingHelperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MappingHelperService],
    }).compile();

    service = module.get<MappingHelperService>(MappingHelperService);
  });

  describe('executeMapping', () => {
    it('should successfully execute a valid JSONata expression', async () => {
      const expression = '{ "transaction_id": data.object.charge }';
      const payload = {
        data: {
          object: {
            charge: 'ch_123',
          },
        },
      };

      const result = await service.executeMapping(expression, payload);

      expect(result).toEqual({ transaction_id: 'ch_123' });
    });

    it('should handle complex JSONata expressions', async () => {
      const expression = `
        {
          "transaction_id": data.object.charge,
          "reason": data.object.reason,
          "currency": $uppercase(data.object.currency),
          "amount": data.object.amount
        }
      `;
      const payload = {
        data: {
          object: {
            charge: 'ch_123',
            reason: 'fraudulent',
            currency: 'usd',
            amount: 5000,
          },
        },
      };

      const result = await service.executeMapping(expression, payload);

      expect(result).toEqual({
        transaction_id: 'ch_123',
        reason: 'fraudulent',
        currency: 'USD',
        amount: 5000,
      });
    });

    it('should throw MappingExecutionError when result is undefined', async () => {
      const expression = 'nonexistent.field';
      const payload = { data: {} };

      await expect(service.executeMapping(expression, payload)).rejects.toThrow(
        MappingExecutionError,
      );
    });

    it('should throw MappingExecutionError when result is null', async () => {
      // Use an expression that evaluates to undefined (which will throw)
      const expression = 'data.nonexistent';
      const payload = { data: {} };

      await expect(service.executeMapping(expression, payload)).rejects.toThrow(
        MappingExecutionError,
      );
    });

    it('should handle invalid JSONata expression syntax', async () => {
      // Use a syntax that will cause JSONata to throw during compilation
      // Invalid operator or unclosed bracket will cause a compilation error
      const expression = '{ "key": data. }';
      const payload = { data: {} };

      await expect(service.executeMapping(expression, payload)).rejects.toThrow(
        MappingExecutionError,
      );
    });

    it('should handle empty payload', async () => {
      const expression = '{ "test": "value" }';
      const payload = {};

      const result = await service.executeMapping(expression, payload);
      expect(result).toEqual({ test: 'value' });
    });

    it('should handle nested object access', async () => {
      const expression = 'data.object.nested.deep.value';
      const payload = {
        data: {
          object: {
            nested: {
              deep: {
                value: 'found',
              },
            },
          },
        },
      };

      const result = await service.executeMapping(expression, payload);
      expect(result).toBe('found');
    });
  });
});
