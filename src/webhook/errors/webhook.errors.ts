import { ErrorName } from '../enums/error-name.enum';

/**
 * Base class for all webhook-related errors
 */
export abstract class WebhookError extends Error {
  abstract readonly name: ErrorName;
}

/**
 * Custom error classes for webhook processing
 */
export class ProviderNotFoundError extends WebhookError {
  readonly name = ErrorName.PROVIDER_NOT_FOUND;

  constructor(provider: string) {
    super(`Provider '${provider}' is not supported`);
  }
}

export class EventTypeNotFoundError extends WebhookError {
  readonly name = ErrorName.EVENT_TYPE_NOT_FOUND;

  constructor(eventType: string, provider: string) {
    super(`Event type '${eventType}' not found in payload or not supported for provider '${provider}'`);
  }
}

export class MappingExpressionNotFoundError extends WebhookError {
  readonly name = ErrorName.MAPPING_EXPRESSION_NOT_FOUND;

  constructor(eventType: string, provider: string) {
    super(`No mapping expression found for event type '${eventType}' in provider '${provider}'`);
  }
}

export class MappingExecutionError extends WebhookError {
  readonly name = ErrorName.MAPPING_EXECUTION;

  constructor(message: string, public readonly originalError?: Error) {
    super(`Mapping execution failed: ${message}`);
  }
}

export class SchemaValidationError extends WebhookError {
  readonly name = ErrorName.SCHEMA_VALIDATION;

  constructor(
    message: string,
    public readonly validationErrors: Array<{ field?: string; issue: string }>,
  ) {
    super(message);
  }
}

export class PayloadValidationError extends WebhookError {
  readonly name = ErrorName.PAYLOAD_VALIDATION;

  constructor(message: string) {
    super(message);
  }
}
