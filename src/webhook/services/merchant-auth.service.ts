import { Injectable } from '@nestjs/common';

/**
 * Merchant API key configuration
 * In production, this would be stored in a database
 */
interface MerchantConfig {
  merchantId: string;
  apiKey: string;
  isActive: boolean;
}

/**
 * Service for managing merchant authentication
 * Uses in-memory storage for simplicity (replace with database in production)
 */
@Injectable()
export class MerchantAuthService {
  /**
   * Hardcoded merchant configurations
   * In production, this would be fetched from a database
   */
  private readonly merchants: Map<string, MerchantConfig> = new Map([
    [
      'merchant_123',
      {
        merchantId: 'merchant_123',
        apiKey: 'sk_test_merchant123_secret_key_abc',
        isActive: true,
      },
    ],
    [
      'merchant_456',
      {
        merchantId: 'merchant_456',
        apiKey: 'sk_test_merchant456_secret_key_xyz',
        isActive: true,
      },
    ],
    [
      'merchant_789',
      {
        merchantId: 'merchant_789',
        apiKey: 'sk_test_merchant789_secret_key_def',
        isActive: false, // Inactive merchant example
      },
    ],
  ]);

  /**
   * Validates an API key and returns the associated merchant ID
   * @param apiKey - The API key to validate
   * @returns Merchant ID if valid, null otherwise
   */
  validateApiKey(apiKey: string): string | null {
    if (!apiKey) {
      return null;
    }

    for (const [merchantId, config] of this.merchants.entries()) {
      if (config.apiKey === apiKey && config.isActive) {
        return merchantId;
      }
    }

    return null;
  }

  /**
   * Validates that a merchant ID exists and is active
   * @param merchantId - The merchant ID to validate
   * @returns true if merchant exists and is active, false otherwise
   */
  validateMerchantId(merchantId: string): boolean {
    if (!merchantId) {
      return false;
    }

    const merchant = this.merchants.get(merchantId);
    return merchant !== undefined && merchant.isActive;
  }

  /**
   * Gets merchant configuration
   * @param merchantId - The merchant ID
   * @returns Merchant config or null if not found
   */
  getMerchantConfig(merchantId: string): MerchantConfig | null {
    return this.merchants.get(merchantId) || null;
  }

  /**
   * Gets all active merchant IDs (useful for testing/debugging)
   * @returns Array of active merchant IDs
   */
  getActiveMerchantIds(): string[] {
    return Array.from(this.merchants.values())
      .filter((m) => m.isActive)
      .map((m) => m.merchantId);
  }
}
