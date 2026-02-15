/**
 * Error class names enum
 */
export enum ErrorName {
  PROVIDER_NOT_FOUND = 'ProviderNotFoundError',
  EVENT_TYPE_NOT_FOUND = 'EventTypeNotFoundError',
  MAPPING_EXPRESSION_NOT_FOUND = 'MappingExpressionNotFoundError',
  MAPPING_EXECUTION = 'MappingExecutionError',
  SCHEMA_VALIDATION = 'SchemaValidationError',
  PAYLOAD_VALIDATION = 'PayloadValidationError',
}
