import { Test, TestingModule } from '@nestjs/testing';
import { WebhookService } from '../../../src/webhook/services/webhook.service';
import { MappingRegistryService } from '../../../src/webhook/services/mapping-registry.service';
import { MappingHelperService } from '../../../src/webhook/services/mapping-helper.service';
import { IWebhookMapper } from '../../../src/webhook/interfaces/webhook-mapper.interface';
import {
  ProviderNotFoundError,
  EventTypeNotFoundError,
  MappingExpressionNotFoundError,
  MappingExecutionError,
  PayloadValidationError,
} from '../../../src/webhook/errors/webhook.errors';
import { ForterChargeback } from '../../../src/webhook/schemas/forter-chargeback.schema';
import { PaymentProvider } from '../../../src/webhook/enums/payment-provider.enum';

describe('WebhookService', () => {
  let service: WebhookService;
  let mappingRegistry: MappingRegistryService;
  let mappingHelper: MappingHelperService;
  let mockMapper: jest.Mocked<IWebhookMapper>;

  const mockMappingRegistry = {
    getMapper: jest.fn(),
  };

  const mockMappingHelper = {
    executeMapping: jest.fn(),
  };

  beforeEach(async () => {
    mockMapper = {
      getProviderName: jest.fn(),
      extractEventType: jest.fn(),
      verifyEventType: jest.fn(),
      validatePayload: jest.fn(),
      getMappingExpression: jest.fn(),
      preProcessPayload: jest.fn(),
      postProcessResult: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookService,
        {
          provide: MappingRegistryService,
          useValue: mockMappingRegistry,
        },
        {
          provide: MappingHelperService,
          useValue: mockMappingHelper,
        },
      ],
    }).compile();

    service = module.get<WebhookService>(WebhookService);
    mappingRegistry = module.get<MappingRegistryService>(MappingRegistryService);
    mappingHelper = module.get<MappingHelperService>(MappingHelperService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processWebhook', () => {
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

    const expectedResult: ForterChargeback = {
      transaction_id: 'ch_123',
      reason: 'fraudulent',
      currency: 'USD',
      amount: 5000,
      provider: PaymentProvider.STRIPE,
    };

    it('should successfully process a webhook', async () => {
      mockMappingRegistry.getMapper.mockReturnValue(mockMapper);
      mockMapper.validatePayload.mockReturnValue({ valid: true });
      mockMapper.extractEventType.mockReturnValue('charge.dispute.created');
      mockMapper.verifyEventType.mockReturnValue(true);
      mockMapper.getMappingExpression.mockReturnValue('{"transaction_id": data.object.charge}');
      mockMappingHelper.executeMapping.mockResolvedValue({
        transaction_id: 'ch_123',
        reason: 'fraudulent',
        currency: 'USD',
        amount: 5000,
      });
      mockMapper.postProcessResult.mockReturnValue(expectedResult);

      const result = await service.processWebhook(validPayload, PaymentProvider.STRIPE);

      expect(result).toEqual(expectedResult);
      expect(mockMappingRegistry.getMapper).toHaveBeenCalledWith(PaymentProvider.STRIPE);
      expect(mockMapper.validatePayload).toHaveBeenCalledWith(validPayload);
      expect(mockMapper.extractEventType).toHaveBeenCalled();
      expect(mockMapper.verifyEventType).toHaveBeenCalled();
      expect(mockMapper.getMappingExpression).toHaveBeenCalled();
      expect(mockMappingHelper.executeMapping).toHaveBeenCalled();
      expect(mockMapper.postProcessResult).toHaveBeenCalled();
    });

    it('should throw ProviderNotFoundError when provider is not found', async () => {
      mockMappingRegistry.getMapper.mockReturnValue(null);

      await expect(
        service.processWebhook(validPayload, 'unknown'),
      ).rejects.toThrow(ProviderNotFoundError);
    });

    it('should throw PayloadValidationError when payload is invalid', async () => {
      mockMappingRegistry.getMapper.mockReturnValue(mockMapper);
      mockMapper.validatePayload.mockReturnValue({
        valid: false,
        error: 'Invalid payload structure',
      });

      await expect(
        service.processWebhook(validPayload, PaymentProvider.STRIPE),
      ).rejects.toThrow(PayloadValidationError);
    });

    it('should throw EventTypeNotFoundError when event type cannot be extracted', async () => {
      mockMappingRegistry.getMapper.mockReturnValue(mockMapper);
      mockMapper.validatePayload.mockReturnValue({ valid: true });
      mockMapper.extractEventType.mockReturnValue(null);

      await expect(
        service.processWebhook(validPayload, PaymentProvider.STRIPE),
      ).rejects.toThrow(EventTypeNotFoundError);
    });

    it('should throw EventTypeNotFoundError when event type is not verified', async () => {
      mockMappingRegistry.getMapper.mockReturnValue(mockMapper);
      mockMapper.validatePayload.mockReturnValue({ valid: true });
      mockMapper.extractEventType.mockReturnValue('charge.dispute.created');
      mockMapper.verifyEventType.mockReturnValue(false);

      await expect(
        service.processWebhook(validPayload, PaymentProvider.STRIPE),
      ).rejects.toThrow(EventTypeNotFoundError);
    });

    it('should throw MappingExpressionNotFoundError when mapping expression is not found', async () => {
      mockMappingRegistry.getMapper.mockReturnValue(mockMapper);
      mockMapper.validatePayload.mockReturnValue({ valid: true });
      mockMapper.extractEventType.mockReturnValue('charge.dispute.created');
      mockMapper.verifyEventType.mockReturnValue(true);
      mockMapper.getMappingExpression.mockReturnValue(null);

      await expect(
        service.processWebhook(validPayload, PaymentProvider.STRIPE),
      ).rejects.toThrow(MappingExpressionNotFoundError);
    });

    it('should throw MappingExecutionError when mapping execution fails', async () => {
      mockMappingRegistry.getMapper.mockReturnValue(mockMapper);
      mockMapper.validatePayload.mockReturnValue({ valid: true });
      mockMapper.extractEventType.mockReturnValue('charge.dispute.created');
      mockMapper.verifyEventType.mockReturnValue(true);
      mockMapper.getMappingExpression.mockReturnValue('{"transaction_id": data.object.charge}');
      mockMappingHelper.executeMapping.mockRejectedValue(
        new MappingExecutionError('Mapping failed'),
      );

      await expect(
        service.processWebhook(validPayload, PaymentProvider.STRIPE),
      ).rejects.toThrow(MappingExecutionError);
    });

    it('should call preProcessPayload if mapper implements it', async () => {
      const preProcessedPayload = { ...validPayload, preprocessed: true };
      mockMappingRegistry.getMapper.mockReturnValue(mockMapper);
      mockMapper.validatePayload.mockReturnValue({ valid: true });
      mockMapper.preProcessPayload = jest.fn().mockReturnValue(preProcessedPayload);
      mockMapper.extractEventType.mockReturnValue('charge.dispute.created');
      mockMapper.verifyEventType.mockReturnValue(true);
      mockMapper.getMappingExpression.mockReturnValue('{"transaction_id": data.object.charge}');
      mockMappingHelper.executeMapping.mockResolvedValue({ transaction_id: 'ch_123' });
      mockMapper.postProcessResult.mockReturnValue(expectedResult);

      await service.processWebhook(validPayload, PaymentProvider.STRIPE);

      expect(mockMapper.preProcessPayload).toHaveBeenCalledWith(validPayload);
      expect(mockMapper.extractEventType).toHaveBeenCalledWith(preProcessedPayload);
    });

    it('should not call preProcessPayload if mapper does not implement it', async () => {
      // Create a fresh mapper without preProcessPayload
      const mapperWithoutPreProcess: IWebhookMapper = {
        getProviderName: jest.fn().mockReturnValue('stripe'),
        extractEventType: jest.fn().mockReturnValue('charge.dispute.created'),
        verifyEventType: jest.fn().mockReturnValue(true),
        validatePayload: jest.fn().mockReturnValue({ valid: true }),
        getMappingExpression: jest.fn().mockReturnValue('{"transaction_id": data.object.charge}'),
        postProcessResult: jest.fn().mockReturnValue(expectedResult),
        // preProcessPayload is intentionally omitted
      };
      mockMappingRegistry.getMapper.mockReturnValue(mapperWithoutPreProcess);
      mockMappingHelper.executeMapping.mockResolvedValue({ transaction_id: 'ch_123' });

      await service.processWebhook(validPayload, PaymentProvider.STRIPE);

      expect(mapperWithoutPreProcess.extractEventType).toHaveBeenCalledWith(validPayload);
      // Verify preProcessPayload property doesn't exist
      expect('preProcessPayload' in mapperWithoutPreProcess).toBe(false);
    });

    it('should not call postProcessResult if mapper does not implement it', async () => {
      const mappedResult = { transaction_id: 'ch_123', reason: 'fraudulent' };
      // Create a fresh mapper without postProcessResult
      const mapperWithoutPostProcess: IWebhookMapper = {
        getProviderName: jest.fn().mockReturnValue('stripe'),
        extractEventType: jest.fn().mockReturnValue('charge.dispute.created'),
        verifyEventType: jest.fn().mockReturnValue(true),
        validatePayload: jest.fn().mockReturnValue({ valid: true }),
        getMappingExpression: jest.fn().mockReturnValue('{"transaction_id": data.object.charge}'),
        // postProcessResult is intentionally omitted
      };
      mockMappingRegistry.getMapper.mockReturnValue(mapperWithoutPostProcess);
      mockMappingHelper.executeMapping.mockResolvedValue(mappedResult);

      const result = await service.processWebhook(validPayload, PaymentProvider.STRIPE);

      expect(result).toEqual(mappedResult);
      // Verify postProcessResult property doesn't exist
      expect('postProcessResult' in mapperWithoutPostProcess).toBe(false);
    });
  });
});
