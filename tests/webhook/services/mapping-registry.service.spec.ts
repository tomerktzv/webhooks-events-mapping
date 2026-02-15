import { Test, TestingModule } from '@nestjs/testing';
import { MappingRegistryService } from '../../../src/webhook/services/mapping-registry.service';
import { IWebhookMapper } from '../../../src/webhook/interfaces/webhook-mapper.interface';
import { PaymentProvider } from '../../../src/webhook/enums/payment-provider.enum';

describe('MappingRegistryService', () => {
  let service: MappingRegistryService;
  let mockMapper1: jest.Mocked<IWebhookMapper>;
  let mockMapper2: jest.Mocked<IWebhookMapper>;

  beforeEach(() => {
    mockMapper1 = {
      getProviderName: jest.fn().mockReturnValue(PaymentProvider.STRIPE),
    } as any;

    mockMapper2 = {
      getProviderName: jest.fn().mockReturnValue('paypal'),
    } as any;
  });

  describe('constructor', () => {
    it('should register all mappers passed to constructor', () => {
      service = new MappingRegistryService([mockMapper1, mockMapper2]);

      expect(service.getMapper(PaymentProvider.STRIPE)).toBe(mockMapper1);
      expect(service.getMapper('paypal')).toBe(mockMapper2);
    });

    it('should handle empty mapper array', () => {
      service = new MappingRegistryService([]);

      expect(service.getMapper(PaymentProvider.STRIPE)).toBeNull();
      expect(service.getRegisteredProviders()).toEqual([]);
    });
  });

  describe('getMapper', () => {
    beforeEach(() => {
      service = new MappingRegistryService([mockMapper1, mockMapper2]);
    });

    it('should return mapper for existing provider', () => {
      const mapper = service.getMapper(PaymentProvider.STRIPE);
      expect(mapper).toBe(mockMapper1);
    });

    it('should return mapper case-insensitively', () => {
      expect(service.getMapper('STRIPE')).toBe(mockMapper1);
      expect(service.getMapper('Stripe')).toBe(mockMapper1);
      expect(service.getMapper('stripe')).toBe(mockMapper1);
    });

    it('should return null for non-existent provider', () => {
      expect(service.getMapper('unknown')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(service.getMapper('')).toBeNull();
    });
  });

  describe('getRegisteredProviders', () => {
    it('should return all registered provider names', () => {
      service = new MappingRegistryService([mockMapper1, mockMapper2]);

      const providers = service.getRegisteredProviders();
      expect(providers).toContain(PaymentProvider.STRIPE);
      expect(providers).toContain('paypal');
      expect(providers.length).toBe(2);
    });

    it('should return empty array when no mappers registered', () => {
      service = new MappingRegistryService([]);

      expect(service.getRegisteredProviders()).toEqual([]);
    });
  });
});
