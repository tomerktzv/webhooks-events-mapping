import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { PaymentProvider } from '../enums/payment-provider.enum';
import { WebhookErrorType } from '../enums/webhook-error-type.enum';

/**
 * Pipe to validate provider query parameter
 * This is the NestJS way to validate input parameters
 */
@Injectable()
export class ProviderValidationPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!value) {
      throw new BadRequestException({
        error: WebhookErrorType.VALIDATION_ERROR,
        message: 'Missing required query parameter: provider',
        details: [
          {
            issue: `Please provide a provider query parameter, e.g., ?provider=${PaymentProvider.STRIPE}`,
          },
        ],
      });
    }

    const normalizedValue = value.toLowerCase();
    const validProviders = Object.values(PaymentProvider);

    if (!validProviders.includes(normalizedValue as PaymentProvider)) {
      throw new BadRequestException({
        error: WebhookErrorType.VALIDATION_ERROR,
        message: `Invalid provider: ${value}`,
        details: [
          {
            issue: `Supported providers: ${validProviders.join(', ')}`,
          },
        ],
      });
    }

    return normalizedValue;
  }
}
