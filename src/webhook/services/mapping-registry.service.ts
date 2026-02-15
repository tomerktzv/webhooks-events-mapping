import { Injectable } from '@nestjs/common';
import { IWebhookMapper } from '../interfaces/webhook-mapper.interface';
import { PaymentProvider } from '../enums/payment-provider.enum';

/**
 * Registry that maps provider names to their respective mappers
 * Mappers are auto-registered via factory pattern in WebhookModule
 */
@Injectable()
export class MappingRegistryService {
  private readonly mappers: Map<string, IWebhookMapper> = new Map();

  constructor(mappers: IWebhookMapper[]) {
    // Register all mappers passed from factory
    mappers.forEach(mapper => this.registerMapper(mapper));
  }

  /**
   * Registers a mapper for a provider
   */
  private registerMapper(mapper: IWebhookMapper): void {
    this.mappers.set(mapper.getProviderName(), mapper);
  }

  /**
   * Retrieves a mapper for a given provider
   * 
   * @param provider - Provider name (e.g., "stripe")
   * @returns The mapper instance or null if not found
   */
  getMapper(provider: string): IWebhookMapper | null {
    return this.mappers.get(provider.toLowerCase()) || null;
  }

  /**
   * Gets all registered provider names
   */
  getRegisteredProviders(): string[] {
    return Array.from(this.mappers.keys());
  }
}
