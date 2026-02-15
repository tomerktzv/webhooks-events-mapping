import {
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { MerchantAuthService } from '../services/merchant-auth.service';

/**
 * Guard that validates Bearer token authentication using X-Forter-API-Key header
 * Extracts the API key from the Authorization header (Bearer token format)
 * or from X-Forter-API-Key header as fallback
 */
@Injectable()
export class MerchantAuthGuard implements CanActivate {
  constructor(private readonly merchantAuthService: MerchantAuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      return false;
    }

    // Remove 'Bearer ' prefix if present
    const cleanApiKey = apiKey.replace(/^Bearer\s+/i, '').trim();

    const merchantId = this.merchantAuthService.validateApiKey(cleanApiKey);

    if (!merchantId) {
      return false;
    }

    request.merchantId = merchantId;

    return true;
  }

  /**
   * Extracts API key from request headers
   * Checks Authorization header first, then X-Forter-API-Key header
   */
  private extractApiKey(request: any): string | null {
    const authHeader = request.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    const apiKeyHeader = request.headers['x-forter-api-key'];
    if (apiKeyHeader) {
      return apiKeyHeader;
    }

    return null;
  }
}
