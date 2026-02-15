/**
 * Stripe event types supported by the mapper
 */
export enum StripeEventType {
  CHARGE_DISPUTE_CREATED = 'charge.dispute.created',
  // Future event types can be added here:
  // CHARGE_DISPUTE_UPDATED = 'charge.dispute.updated',
  // CHARGE_DISPUTE_CLOSED = 'charge.dispute.closed',
}
