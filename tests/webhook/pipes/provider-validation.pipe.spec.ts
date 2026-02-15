import { BadRequestException } from '@nestjs/common';
import { ProviderValidationPipe } from '../../../src/webhook/pipes/provider-validation.pipe';
import { PaymentProvider } from '../../../src/webhook/enums/payment-provider.enum';
import { WebhookErrorType } from '../../../src/webhook/enums/webhook-error-type.enum';

describe('ProviderValidationPipe', () => {
  let pipe: ProviderValidationPipe;

  beforeEach(() => {
    pipe = new ProviderValidationPipe();
  });

  describe('transform', () => {
    it('should return normalized provider name for valid provider', () => {
      const result = pipe.transform(PaymentProvider.STRIPE);
      expect(result).toBe(PaymentProvider.STRIPE);
    });

    it('should normalize provider name to lowercase', () => {
      const result = pipe.transform('STRIPE');
      expect(result).toBe(PaymentProvider.STRIPE);
    });

    it('should normalize provider name with mixed case', () => {
      const result = pipe.transform('Stripe');
      expect(result).toBe(PaymentProvider.STRIPE);
    });

    it('should throw BadRequestException when value is empty', () => {
      expect(() => pipe.transform('')).toThrow(BadRequestException);
    });

    it('should throw BadRequestException when value is null', () => {
      expect(() => pipe.transform(null as any)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException when value is undefined', () => {
      expect(() => pipe.transform(undefined as any)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException with correct error structure for empty value', () => {
      try {
        pipe.transform('');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.response).toMatchObject({
          error: WebhookErrorType.VALIDATION_ERROR,
          message: 'Missing required query parameter: provider',
        });
        expect(error.response.details).toBeDefined();
      }
    });

    it('should throw BadRequestException for invalid provider', () => {
      expect(() => pipe.transform('invalid-provider')).toThrow(BadRequestException);
    });

    it('should throw BadRequestException with correct error structure for invalid provider', () => {
      try {
        pipe.transform('invalid-provider');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.response).toMatchObject({
          error: WebhookErrorType.VALIDATION_ERROR,
          message: 'Invalid provider: invalid-provider',
        });
        expect(error.response.details).toBeDefined();
        expect(error.response.details[0].issue).toContain('Supported providers');
      }
    });
  });
});
