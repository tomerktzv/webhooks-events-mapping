import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ForterChargeback, ForterChargebackDto } from '../schemas/forter-chargeback.schema';
import { WebhookErrorType } from '../enums/webhook-error-type.enum';

export class WebhookSuccessResponseDto {
  @ApiProperty({
    type: ForterChargebackDto,
    description: 'Transformed webhook payload in Forter chargeback format',
    example: {
      transaction_id: 'ch_3OZF3r2eZvKYlo2C1k5D6f7g',
      reason: 'fraudulent',
      currency: 'USD',
      amount: 5000,
      provider: 'stripe',
    },
  })
  result: ForterChargeback;
}

export class WebhookErrorDetailDto {
  @ApiPropertyOptional({
    description: 'Field name that caused the validation error',
    example: 'transaction_id',
  })
  field?: string;

  @ApiProperty({
    description: 'Description of the validation issue',
    example: 'Missing required field',
  })
  issue: string;
}

export class WebhookErrorResponseDto {
  @ApiProperty({
    description: 'Error type category',
    enum: WebhookErrorType,
    example: WebhookErrorType.VALIDATION_ERROR,
  })
  error: WebhookErrorType;

  @ApiProperty({
    description: 'Human-readable error message',
    example: 'Schema validation failed',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'Detailed validation errors',
    type: [WebhookErrorDetailDto],
    example: [
      {
        field: 'transaction_id',
        issue: 'Missing required field',
      },
    ],
  })
  details?: Array<{ field?: string; issue: string }>;
}
