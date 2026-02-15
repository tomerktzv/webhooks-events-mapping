import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Custom throttler guard that uses merchant ID as the rate limit key
 * This allows per-merchant rate limiting instead of per-IP
 */
@Injectable()
export class MerchantThrottlerGuard extends ThrottlerGuard {

  protected async getTracker(req: Record<string, any>): Promise<string> {
    const merchantId = req.merchantId;
    
    if (merchantId) {
      return `merchant:${merchantId}`;
    }

    return 'unknown';
  }
}
