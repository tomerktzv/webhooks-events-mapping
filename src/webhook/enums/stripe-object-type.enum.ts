/**
 * Stripe object types that can appear in webhook payloads
 */
export enum StripeObjectType {
  DISPUTE = 'dispute',
  // Future object types can be added here:
  // CHARGE = 'charge',
  // PAYMENT_INTENT = 'payment_intent',
  // REFUND = 'refund',
}
