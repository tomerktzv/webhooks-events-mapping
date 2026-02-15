import {
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { MerchantAuthService } from '../services/merchant-auth.service';

/**
 * Guard that validates the X-Merchant-Id header
 * Ensures the merchant ID exists and matches the authenticated merchant
 */
@Injectable()
export class MerchantIdGuard implements CanActivate {
  constructor(private readonly merchantAuthService: MerchantAuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const merchantIdFromHeader = request.headers['x-merchant-id'];

    if (!merchantIdFromHeader) {
      return false;
    }

    if (!this.merchantAuthService.validateMerchantId(merchantIdFromHeader)) {
      return false;
    }

    const authenticatedMerchantId = request.merchantId;
    if (authenticatedMerchantId && authenticatedMerchantId !== merchantIdFromHeader) {
      return false;
    }

    request.merchantId = merchantIdFromHeader;

    return true;
  }
}
