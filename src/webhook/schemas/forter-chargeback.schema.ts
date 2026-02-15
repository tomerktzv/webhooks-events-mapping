import { IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Forter's normalized chargeback schema
 */
export interface ForterChargeback {
  transaction_id: string;
  reason: string;
  currency: string;
  amount: number;
  provider?: string;
}

/**
 * DTO class for validating Forter chargeback using class-validator
 * Minimal validation: only type checks and required fields
 * Format validation is removed to allow forwarding provider data as-is
 */
export class ForterChargebackDto {
  @ApiProperty({
    description: 'Transaction ID from the payment provider',
    example: 'ch_3OZF3r2eZvKYlo2C1k5D6f7g',
  })
  @IsString()
  transaction_id: string;

  @ApiProperty({
    description: 'Reason for the chargeback',
    example: 'fraudulent',
  })
  @IsString()
  reason: string;

  @ApiProperty({
    description: 'Currency code',
    example: 'USD',
  })
  @IsString()
  currency: string;

  @ApiProperty({
    description: 'Amount',
    example: 5000,
  })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({
    description: 'Payment provider name',
    example: 'stripe',
  })
  @IsOptional()
  @IsString()
  provider?: string;
}
