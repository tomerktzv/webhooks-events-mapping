import { IsString, IsNotEmpty } from 'class-validator';

/**
 * DTO for validating Stripe dispute object fields
 */
export class StripeDisputeDto {
  @IsString({ message: "Missing 'charge' field in dispute object" })
  @IsNotEmpty()
  charge: string;

  @IsString({ message: "Missing 'reason' field in dispute object" })
  @IsNotEmpty()
  reason: string;

  @IsString({ message: "Missing 'currency' field in dispute object" })
  @IsNotEmpty()
  currency: string;

  @IsNotEmpty({ message: "Missing 'amount' field in dispute object" })
  amount: any; // Using 'any' since we only need to check existence, not type
}
