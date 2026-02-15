import { IsNotEmpty, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WebhookRequestDto {
  @ApiProperty({
    description: 'Raw webhook payload from payment provider (e.g., Stripe, PayPal, etc.)',
    example: {
      id: 'evt_1OZF3t2eZvKYlo2CqD8kJZ7n',
      object: 'event',
      type: 'charge.dispute.created',
      data: {
        object: {
          object: 'dispute',
          charge: 'ch_3OZF3r2eZvKYlo2C1k5D6f7g',
          reason: 'fraudulent',
          currency: 'usd',
          amount: 5000,
        },
      },
    },
  })
  @IsNotEmpty()
  @IsObject()
  payload: Record<string, any>;
}
