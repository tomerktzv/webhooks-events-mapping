import { StripeObjectType } from '../../../enums/stripe-object-type.enum';
import { StripeDisputeDto } from '../dto/stripe-dispute.dto';

/**
 * Map of object types to their corresponding DTO classes for validation
 */
export const OBJECT_DTO_MAP: Record<StripeObjectType, any> = {
  [StripeObjectType.DISPUTE]: StripeDisputeDto,
  // Future object types can be added here:
  // [StripeObjectType.CHARGE]: StripeChargeDto,
};
