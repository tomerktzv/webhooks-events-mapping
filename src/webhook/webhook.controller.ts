import {
  Controller,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Headers,
  Header,
  UseInterceptors,
  UseGuards,
  Request,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiHeader,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { WebhookService } from './services/webhook.service';
import { WebhookRequestDto } from './dto/webhook-request.dto';
import { WebhookSuccessResponseDto, WebhookErrorResponseDto } from './dto/webhook-response.dto';
import { ProviderValidationPipe } from './pipes/provider-validation.pipe';
import { WebhookLoggingInterceptor } from './interceptors/webhook-logging.interceptor';
import { MerchantAuthGuard } from './guards/merchant-auth.guard';
import { MerchantIdGuard } from './guards/merchant-id.guard';
import { PaymentProvider } from './enums/payment-provider.enum';

@ApiTags('webhooks')
@Controller('webhook')
@UseGuards(MerchantAuthGuard, MerchantIdGuard)
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @Header('X-Webhook-Processed', 'true')
  @Throttle({ default: { limit: 100, ttl: 60000 } }) // 100 requests per minute per merchant
  @UseInterceptors(WebhookLoggingInterceptor)
  @ApiBearerAuth('X-Forter-API-Key')
  @ApiOperation({
    summary: 'Transform webhook payload',
    description: 'Transforms a payment provider webhook payload into Forter\'s normalized chargeback schema using JSONata mapping expressions. Requires merchant authentication.',
  })
  @ApiQuery({
    name: 'provider',
    description: 'Payment provider name (e.g., stripe, paypal)',
    enum: PaymentProvider,
    example: PaymentProvider.STRIPE,
    required: true,
  })
  @ApiHeader({
    name: 'X-Forter-API-Key',
    description: 'Bearer token for merchant authentication',
    required: true,
    example: 'Bearer sk_test_merchant123_secret_key_abc',
  })
  @ApiHeader({
    name: 'X-Merchant-Id',
    description: 'Merchant identifier',
    required: true,
    example: 'merchant_123',
  })
  @ApiBody({
    type: WebhookRequestDto,
    description: 'Raw webhook payload from payment provider',
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook successfully transformed',
    type: WebhookSuccessResponseDto,
    headers: {
      'X-Webhook-Processed': {
        description: 'Indicates the webhook was processed',
        schema: { type: 'string', example: 'true' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error (invalid provider, missing fields, schema validation failed)',
    type: WebhookErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication error (invalid or missing API key)',
    type: WebhookErrorResponseDto,
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests (rate limit exceeded)',
    type: WebhookErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error (mapping execution failed)',
    type: WebhookErrorResponseDto,
  })
  async processWebhook(
    @Body() request: WebhookRequestDto,
    @Query('provider', ProviderValidationPipe) provider: string,
    @Request() req: any,
  ): Promise<WebhookSuccessResponseDto> {
    try {
      const result = await this.webhookService.processWebhook(request.payload, provider);
  
      this.logger.debug({
        message: 'Webhook processed successfully',
        merchantId: req?.merchantId || 'unknown',
        provider,
      });
  
      return {
        result,
      };
    } catch (error) {
      this.logger.error({
        message: 'Error processing webhook',
        errorMessage: error.message,
        stack: error.stack,
        merchantId: req?.merchantId,
        provider,
        payload: JSON.stringify(request.payload),
      });
      
      throw error;
    }
  }
}
