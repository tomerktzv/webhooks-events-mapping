import { Injectable } from '@nestjs/common';
import { validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { IWebhookMapper } from '../../interfaces/webhook-mapper.interface';
import { ForterChargeback } from '../../schemas/forter-chargeback.schema';
import { PaymentProvider } from '../../enums/payment-provider.enum';
import { StripeEventType } from '../../enums/stripe-event-type.enum';
import { StripeObjectType } from '../../enums/stripe-object-type.enum';
import { MAPPING_EXPRESSIONS } from './constants/mapping-expressions.const';
import { OBJECT_DTO_MAP } from './constants/object-dto-map.const';
import { StripeWebhookBasicDto } from './dto/stripe-webhook-basic.dto';

/**
 * Stripe webhook mapper implementation
 * Maps Stripe chargeback/dispute webhooks to Forter's format
 */
@Injectable()
export class StripeWebhookMapper implements IWebhookMapper {
  private readonly providerName = PaymentProvider.STRIPE;

  getProviderName(): string {
    return this.providerName;
  }

  extractEventType(payload: any): string | null {
    const eventType = payload?.type;
    // Only return if it's a supported Stripe event type
    if (Object.values(StripeEventType).includes(eventType as StripeEventType)) {
      return eventType;
    }
    return null;
  }

  verifyEventType(eventType: string): boolean {
    // Check if we have a mapping for this event type
    return Object.values(StripeEventType).includes(eventType as StripeEventType) &&
      eventType in MAPPING_EXPRESSIONS;
  }

  validatePayload(payload: any): { valid: boolean; error?: string } {
    // Validate basic structure first
    const basicValidation = this.validateBasicStructure(payload);
    if (!basicValidation.valid) {
      return basicValidation;
    }

    // Validate object-specific fields if applicable
    const objectValidation = this.validateObjectFields(payload);
    if (!objectValidation.valid) {
      return objectValidation;
    }

    return { valid: true };
  }

  /**
   * Validates the basic Stripe webhook structure using class-validator
   */
  private validateBasicStructure(payload: any): { valid: boolean; error?: string } {
    if (!payload) {
      return { valid: false, error: 'Payload is empty or null' };
    }

    const dto = plainToInstance(StripeWebhookBasicDto, payload, {
      enableImplicitConversion: true,
      exposeDefaultValues: true,
    });
    const errors = validateSync(dto, {
      whitelist: false,
      forbidNonWhitelisted: false,
    });

    if (errors.length > 0) {
      // Get the first error, checking nested errors if needed
      let firstError = errors[0];
      
      // Check for nested errors (e.g., in data.object)
      while (firstError.children && firstError.children.length > 0) {
        firstError = firstError.children[0];
      }
      
      const errorMessage = firstError.constraints 
        ? Object.values(firstError.constraints)[0] 
        : firstError.property 
          ? `Validation failed for field: ${firstError.property}`
          : 'Validation failed';
      return { valid: false, error: errorMessage };
    }

    return { valid: true };
  }

  /**
   * Validates object-specific fields based on the object type using class-validator
   */
  private validateObjectFields(payload: any): { valid: boolean; error?: string } {
    const object = payload?.data?.object;
    
    if (!object?.object || !Object.values(StripeObjectType).includes(object.object as StripeObjectType)) {
      return { valid: true };
    }

    const objectType = object.object as StripeObjectType;
    const DtoClass = OBJECT_DTO_MAP[objectType];

    if (!DtoClass) {
      return { valid: true };
    }

    const dto = plainToInstance(DtoClass, object, {
      enableImplicitConversion: true,
      exposeDefaultValues: true,
    });
    const errors = validateSync(dto, {
      whitelist: false,
      forbidNonWhitelisted: false,
    });

    if (errors.length > 0) {
      const firstError = errors[0];
      const errorMessage = firstError.constraints 
        ? Object.values(firstError.constraints)[0] 
        : firstError.property 
          ? `Validation failed for field: ${firstError.property}`
          : 'Validation failed';
      return { valid: false, error: errorMessage };
    }

    return { valid: true };
  }

  getMappingExpression(eventType: string): string | null {
    return MAPPING_EXPRESSIONS[eventType] || null;
  }

  preProcessPayload(payload: any): any {
    // No preprocessing needed for Stripe, but could add:
    // - Data enrichment
    // - Field normalization
    // - Default value injection
    return payload;
  }

  postProcessResult(result: ForterChargeback): ForterChargeback {
    // Ensure currency is uppercase (JSONata should handle this, but double-check)
    if (result.currency) {
      result.currency = result.currency.toUpperCase();
    }

    // Ensure amount is a decimal number
    if (result.amount !== undefined && result.amount !== null) {
      // if (typeof result.amount === 'string') {
      //   result.amount = parseFloat(result.amount);
      // }
      // // Ensure it's a valid number (not NaN)
      // if (isNaN(result.amount)) {
      //   throw new Error('Invalid amount: cannot be converted to a number');
      // }
      // Ensure it's a number type
      result.amount = Number(result.amount);
    }

    return result as ForterChargeback;
  }
}
