import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './services/webhook.service';
import { MappingRegistryService } from './services/mapping-registry.service';
import { MappingHelperService } from './services/mapping-helper.service';
import { MerchantAuthService } from './services/merchant-auth.service';
import { StripeWebhookMapper } from './mappers/stripe/stripe-webhook.mapper';
import { ProviderValidationPipe } from './pipes/provider-validation.pipe';
import { WebhookExceptionFilter } from './filters/webhook-exception.filter';
import { MerchantAuthGuard } from './guards/merchant-auth.guard';
import { MerchantIdGuard } from './guards/merchant-id.guard';
import { MerchantThrottlerGuard } from './guards/merchant-throttler.guard';
import { IWebhookMapper } from './interfaces/webhook-mapper.interface';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 1 minute in milliseconds
        limit: 100, // 100 requests per minute per merchant
      },
    ]),
  ],
  controllers: [WebhookController],
  providers: [
    WebhookService,
    MappingHelperService,
    MerchantAuthService,
    // Add all mappers here - they will be auto-registered
    StripeWebhookMapper,
    // Future mappers can be added here:
    // PaypalWebhookMapper,
    // AdyenWebhookMapper,
    {
      provide: MappingRegistryService,
      useFactory: (
        stripeMapper: StripeWebhookMapper,
        // Add new mappers here as parameters:
        // paypalMapper: PaypalWebhookMapper,
      ): MappingRegistryService => {
        const mappers: IWebhookMapper[] = [
          stripeMapper,
          // Add new mappers to this array:
          // paypalMapper,
        ];
        return new MappingRegistryService(mappers);
      },
      inject: [
        StripeWebhookMapper,
        // Add new mappers to inject array:
        // PaypalWebhookMapper,
      ],
    },
    ProviderValidationPipe,
    {
      provide: APP_FILTER,
      useClass: WebhookExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: MerchantThrottlerGuard,
    },
  ],
})
export class WebhookModule {}
