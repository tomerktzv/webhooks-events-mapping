import { Injectable } from '@nestjs/common';
import { MappingRegistryService } from './mapping-registry.service';
import { MappingHelperService } from './mapping-helper.service';
import { ForterChargeback } from '../schemas/forter-chargeback.schema';
import {
  ProviderNotFoundError,
  EventTypeNotFoundError,
  MappingExpressionNotFoundError,
  MappingExecutionError,
  PayloadValidationError,
} from '../errors/webhook.errors';

/**
 * Main orchestrator service that coordinates the webhook transformation process
 */
@Injectable()
export class WebhookService {
  constructor(
    private readonly mappingRegistry: MappingRegistryService,
    private readonly mappingHelper: MappingHelperService,
  ) {}

  /**
   * Processes a webhook payload and transforms it to Forter's format
   * 
   * @param payload - Raw webhook payload from payment provider
   * @param provider - Provider name (e.g., "stripe")
   * @returns Transformed Forter chargeback object
   * @throws Custom domain errors that will be caught by WebhookExceptionFilter
   */
  async processWebhook(payload: any, provider: string): Promise<ForterChargeback> {
    // Step 1: Get the mapper for the provider
    const mapper = this.mappingRegistry.getMapper(provider);
    if (!mapper) {
      throw new ProviderNotFoundError(provider);
    }

    // Step 2: Validate the payload structure
    const validationResult = mapper.validatePayload(payload);
    if (!validationResult.valid) {
      throw new PayloadValidationError(validationResult.error || 'Invalid payload structure');
    }

    // Step 3: Pre-process payload (if mapper implements it)
    const preProcessedPayload = mapper.preProcessPayload
      ? mapper.preProcessPayload(payload)
      : payload;

    // Step 4: Extract and verify event type
    const rawEventType = mapper.extractEventType(preProcessedPayload);
    if (!rawEventType) {
      throw new EventTypeNotFoundError('unknown', provider);
    }

    if (!mapper.verifyEventType(rawEventType)) {
      throw new EventTypeNotFoundError(rawEventType, provider);
    }

    // Step 5: Get mapping expression
    const mappingExpression = mapper.getMappingExpression(rawEventType);
    if (!mappingExpression) {
      throw new MappingExpressionNotFoundError(rawEventType, provider);
    }

    // Step 6: Execute mapping
    const mappedResult = await this.mappingHelper.executeMapping(
        mappingExpression,
        preProcessedPayload,
      );

    // Step 7: Post-process result (if mapper implements it)
    const postProcessedResult = mapper.postProcessResult
      ? mapper.postProcessResult(mappedResult)
      : mappedResult;

    return postProcessedResult as ForterChargeback;
  }
}
