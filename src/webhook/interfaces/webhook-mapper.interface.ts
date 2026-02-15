import { ForterChargeback } from '../schemas/forter-chargeback.schema';

/**
 * Interface for webhook mappers that transform provider-specific webhooks
 * into Forter's normalized chargeback format.
 * 
 * Each payment provider (Stripe, PayPal, etc.) should implement this interface
 * to handle provider-specific logic for event detection, validation, and mapping.
 */
export interface IWebhookMapper {
  /**
   * Returns the provider identifier
   */
  getProviderName(): string;

  /**
   * Extracts the event type from the raw webhook payload.
   * Provider-specific logic to locate the event type field.
   * 
   * @param payload - Raw webhook payload from the provider
   * @returns Event type string (e.g., "charge.dispute.created") or null if not found
   */
  extractEventType(payload: any): string | null;

  /**
   * Verifies if the provided event type is supported by this mapper.
   * 
   * @param eventType - The event type to check
   * @returns true if the event type is supported, false otherwise
   */
  verifyEventType(eventType: string): boolean;

  /**
   * Validates the structure and content of the raw webhook payload.
   * Provider-specific validation logic.
   * 
   * @param payload - Raw webhook payload to validate
   * @returns Validation result with error message if invalid
   */
  validatePayload(payload: any): { valid: boolean; error?: string };

  /**
   * Retrieves the JSONata mapping expression for a specific event type.
   * 
   * @param eventType - The event type to get mapping for
   * @returns JSONata expression string or null if not found
   */
  getMappingExpression(eventType: string): string | null;

  /**
   * Optional: Pre-processes the payload before mapping.
   * Useful for data transformation, normalization, or enrichment.
   * 
   * @param payload - Raw webhook payload
   * @returns Pre-processed payload
   */
  preProcessPayload?(payload: any): any;

  /**
   * Optional: Post-processes the mapped result after JSONata transformation.
   * Useful for final adjustments, default values, or provider-specific formatting.
   * 
   * @param result - Mapped result from JSONata
   * @returns Final Forter chargeback object
   */
  postProcessResult?(result: any): ForterChargeback;
}
