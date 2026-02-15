import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
} from '@nestjs/common';
import { Response } from 'express';
import { WebhookError } from '../errors/webhook.errors';
import { WebhookErrorType } from '../enums/webhook-error-type.enum';
import { ErrorName } from '../enums/error-name.enum';
import { MappingRegistryService } from '../services/mapping-registry.service';

type ErrorResponse = {
  status: number;
  errorResponse: {
    error: WebhookErrorType;
    message: string;
    details?: Array<{ field?: string; issue: string }>;
  };
};

/**
 * Exception filter that catches custom webhook errors and converts them to HTTP exceptions
 * This is the NestJS way to handle domain errors
 * Uses WebhookError base class to catch all webhook-related exceptions
 */
@Catch(WebhookError)
export class WebhookExceptionFilter implements ExceptionFilter {
  constructor(private readonly mappingRegistry: MappingRegistryService) {}

  catch(exception: WebhookError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const { status, errorResponse } = this.handleException(exception);
    response.status(status).json(errorResponse);
  }

  private handleException(exception: WebhookError): ErrorResponse {
    switch (exception.name) {
      case ErrorName.PROVIDER_NOT_FOUND:
        return this.createErrorResponse(
          400,
          WebhookErrorType.PROVIDER_ERROR,
          exception.message,
          [
            {
              issue: `Supported providers: ${this.mappingRegistry.getRegisteredProviders().join(', ')}`,
            },
          ],
        );

      case ErrorName.EVENT_TYPE_NOT_FOUND:
      case ErrorName.MAPPING_EXPRESSION_NOT_FOUND:
      case ErrorName.PAYLOAD_VALIDATION:
        return this.createErrorResponse(
          400,
          WebhookErrorType.VALIDATION_ERROR,
          exception.message,
        );

      case ErrorName.MAPPING_EXECUTION:
        return this.createErrorResponse(
          500,
          WebhookErrorType.MAPPING_ERROR,
          exception.message,
        );

      default:
        return this.createErrorResponse(
          500,
          WebhookErrorType.INTERNAL_ERROR,
          exception.message || 'An unexpected error occurred',
        );
    }
  }

  private createErrorResponse(
    status: number,
    errorType: WebhookErrorType,
    message: string,
    details?: Array<{ field?: string; issue: string }>,
  ): ErrorResponse {
    return {
      status,
      errorResponse: {
        error: errorType,
        message,
        ...(details && { details }),
      },
    };
  }
}
