import { Test, TestingModule } from '@nestjs/testing';
import { ArgumentsHost } from '@nestjs/common';
import { WebhookExceptionFilter } from '../../../src/webhook/filters/webhook-exception.filter';
import { MappingRegistryService } from '../../../src/webhook/services/mapping-registry.service';
import {
  ProviderNotFoundError,
  EventTypeNotFoundError,
  MappingExpressionNotFoundError,
  MappingExecutionError,
  PayloadValidationError,
} from '../../../src/webhook/errors/webhook.errors';
import { WebhookErrorType } from '../../../src/webhook/enums/webhook-error-type.enum';
import { PaymentProvider } from '../../../src/webhook/enums/payment-provider.enum';

describe('WebhookExceptionFilter', () => {
  let filter: WebhookExceptionFilter;
  let mappingRegistry: MappingRegistryService;
  let mockResponse: any;
  let mockArgumentsHost: ArgumentsHost;

  const mockMappingRegistry = {
    getRegisteredProviders: jest.fn().mockReturnValue([PaymentProvider.STRIPE]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookExceptionFilter,
        {
          provide: MappingRegistryService,
          useValue: mockMappingRegistry,
        },
      ],
    }).compile();

    filter = module.get<WebhookExceptionFilter>(WebhookExceptionFilter);
    mappingRegistry = module.get<MappingRegistryService>(MappingRegistryService);

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('catch', () => {
    it('should handle ProviderNotFoundError correctly', () => {
      const error = new ProviderNotFoundError('unknown');
      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: WebhookErrorType.PROVIDER_ERROR,
        message: error.message,
        details: [
          {
            issue: `Supported providers: ${PaymentProvider.STRIPE}`,
          },
        ],
      });
    });

    it('should handle EventTypeNotFoundError correctly', () => {
      const error = new EventTypeNotFoundError('unknown.event', PaymentProvider.STRIPE);
      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: WebhookErrorType.VALIDATION_ERROR,
        message: error.message,
      });
    });

    it('should handle MappingExpressionNotFoundError correctly', () => {
      const error = new MappingExpressionNotFoundError('event.type', PaymentProvider.STRIPE);
      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: WebhookErrorType.VALIDATION_ERROR,
        message: error.message,
      });
    });

    it('should handle PayloadValidationError correctly', () => {
      const error = new PayloadValidationError('Invalid payload');
      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: WebhookErrorType.VALIDATION_ERROR,
        message: error.message,
      });
    });

    it('should handle MappingExecutionError correctly', () => {
      const error = new MappingExecutionError('Mapping failed');
      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: WebhookErrorType.MAPPING_ERROR,
        message: error.message,
      });
    });

    it('should handle unknown errors with default response', () => {
      const error = {
        name: 'UnknownError',
        message: 'Unknown error occurred',
      } as any;

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: WebhookErrorType.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    });

    it('should handle errors without message', () => {
      const error = {
        name: 'UnknownError',
      } as any;

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: WebhookErrorType.INTERNAL_ERROR,
        message: 'An unexpected error occurred',
      });
    });
  });
});
