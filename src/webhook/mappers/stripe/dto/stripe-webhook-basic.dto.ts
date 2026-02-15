import { IsString, IsNotEmpty, IsIn, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Nested DTO for data structure
 */
class StripeWebhookData {
  @IsObject({ message: "Missing 'data.object' field in Stripe webhook" })
  object: any;
}

/**
 * DTO for validating basic Stripe webhook structure
 */
export class StripeWebhookBasicDto {
  @IsString()
  @IsIn(['event'], { message: "Expected 'object' field to be 'event' for Stripe webhook" })
  object: string;

  @IsString({ message: "Missing 'type' field in Stripe webhook" })
  @IsNotEmpty()
  type: string;

  @ValidateNested()
  @Type(() => StripeWebhookData)
  @IsNotEmpty({ message: "Missing 'data' field in Stripe webhook" })
  data: StripeWebhookData;
}
