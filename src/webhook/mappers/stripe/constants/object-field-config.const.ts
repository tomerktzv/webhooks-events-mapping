import { StripeObjectType } from '../../../enums/stripe-object-type.enum';
import { StripeDisputeField } from '../../../enums/stripe-dispute-field.enum';

/**
 * Configuration map for object type field validations
 * Defines required fields and their validation rules for each object type
 */
export const OBJECT_FIELD_CONFIG: Record<
  StripeObjectType,
  Array<{
    field: StripeDisputeField;
    error: string;
    validator?: (value: any) => boolean;
  }>
> = {
  [StripeObjectType.DISPUTE]: [
    {
      field: StripeDisputeField.CHARGE,
      error: "Missing 'charge' field in dispute object",
    },
    {
      field: StripeDisputeField.REASON,
      error: "Missing 'reason' field in dispute object",
    },
    {
      field: StripeDisputeField.CURRENCY,
      error: "Missing 'currency' field in dispute object",
    },
    {
      field: StripeDisputeField.AMOUNT,
      error: "Missing 'amount' field in dispute object",
    },
  ],
  // Future object types can be added here:
  // [StripeObjectType.CHARGE]: [...],
};
