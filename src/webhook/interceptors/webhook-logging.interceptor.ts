import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Interceptor to log webhook requests and responses
 * Logs request details, processing time, and response status
 */
@Injectable()
export class WebhookLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(WebhookLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, query, headers } = request;
    const provider = query?.provider || 'unknown';
    const startTime = Date.now();

    // Log incoming request
    this.logger.log(
      `Incoming webhook request: ${method} ${url} | Provider: ${provider} | Headers: ${JSON.stringify(
        this.sanitizeHeaders(headers),
      )}`,
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          this.logger.log(
            `Webhook processed successfully: Provider: ${provider} | Duration: ${duration}ms | Status: 200`,
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            `Webhook processing failed: Provider: ${provider} | Duration: ${duration}ms | Error: ${error.message}`,
            error.stack,
          );
        },
      }),
    );
  }

  /**
   * Sanitize headers to remove sensitive information
   * Only logs relevant webhook headers
   */
  private sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
    const sanitized: Record<string, string> = {};
    const relevantHeaders = [
      'stripe-signature',
      'x-paypal-transmission-id',
      'user-agent',
      'content-type',
      'x-webhook-id',
      'x-webhook-timestamp',
    ];

    for (const header of relevantHeaders) {
      const key = header.toLowerCase();
      if (headers[key]) {
        sanitized[header] = headers[key];
      }
    }

    return sanitized;
  }
}
