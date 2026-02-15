/**
 * Error types returned in webhook error responses
 */
export enum WebhookErrorType {
  PROVIDER_ERROR = 'ProviderError',
  VALIDATION_ERROR = 'ValidationError',
  MAPPING_ERROR = 'MappingError',
  INTERNAL_ERROR = 'InternalError',
}
