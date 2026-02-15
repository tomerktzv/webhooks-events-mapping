import { PaymentProvider } from '../../../enums/payment-provider.enum';
import { StripeEventType } from '../../../enums/stripe-event-type.enum';

/**
 * Mapping expressions for different Stripe event types
 * JSONata expressions that transform Stripe webhook payloads to Forter's format
 */
export const MAPPING_EXPRESSIONS: Record<StripeEventType, string> = {
  [StripeEventType.CHARGE_DISPUTE_CREATED]: `
    {
      "transaction_id": data.object.charge,
      "reason": data.object.reason,
      "currency": $uppercase(data.object.currency),
      "amount": data.object.amount,
      "provider": "${PaymentProvider.STRIPE}"
    }
  `,
  // Can add more event types here:
  // [StripeEventType.CHARGE_DISPUTE_UPDATED]: '...',
  // [StripeEventType.CHARGE_DISPUTE_CLOSED]: '...',
};
