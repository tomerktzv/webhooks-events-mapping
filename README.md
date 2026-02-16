# Forter Webhook Mapping Service

A NestJS service that transforms payment provider webhooks (Stripe, PayPal, etc.) into Forter's normalized chargeback schema using JSONata mapping expressions.

## Features

- ✅ Declarative mapping using JSONata expressions
- ✅ JSON schema validation against Forter's chargeback format
- ✅ Extensible architecture for adding new payment providers
- ✅ Comprehensive error handling
- ✅ Type-safe implementation with TypeScript

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Docker and Docker Compose (optional, for containerized development)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Application

```bash
npm run start:dev
```

The server will start on `http://localhost:3000/api` (or the port configured in your environment via `PORT` environment variable).

### 3. Verify It's Running

- Check the console for: `🚀 Application is running on: http://localhost:3000/api`
- Visit Swagger documentation: `http://localhost:3000/api/docs`
- The API is ready to accept webhook requests

## Running the Application

### Local Development

```bash
npm run start:dev
```

The application will start with hot-reload enabled. Any changes to source files will automatically restart the server.

### Docker (Local Development)

```bash
# Start with hot reload
docker-compose up

# Stop
docker-compose down

# View logs
docker-compose logs -f
```

### Production

```bash
npm run build
npm run start:prod
```

## API Endpoint

### POST /webhook

Transforms a payment provider webhook into Forter's chargeback format.

**Query Parameters:**
- `provider` (required): The payment provider name (e.g., `stripe`, `paypal`)

**Required Headers:**
- `Authorization: Bearer <api-key>` OR `X-Forter-API-Key: <api-key>` - Merchant API key for authentication
- `X-Merchant-Id: <merchant-id>` - Merchant identifier
- `Content-Type: application/json` - Request content type

**Test Credentials:**
- API Key: `sk_test_merchant123_secret_key_abc`
- Merchant ID: `merchant_123`

**Request Body:**
```json
{
  "payload": {
    /* Raw webhook payload from payment provider */
  }
}
```

**Success Response (200):**
```json
{
  "result": {
    "transaction_id": "ch_3OZF3r2eZvKYlo2C1k5D6f7g",
    "reason": "fraudulent",
    "currency": "USD",
    "amount": 5000,
    "provider": "stripe"
  }
}
```

**Error Response (400/500):**
```json
{
  "error": "ValidationError",
  "message": "Error description",
  "details": [
    {
      "field": "transaction_id",
      "issue": "Missing required field"
    }
  ]
}
```

## E2E Testing

The E2E tests verify the complete webhook transformation flow including:
- Request validation (missing/invalid provider)
- Authentication and authorization
- Successful webhook transformation (valid request with proper authentication)
- Error handling

**Run E2E tests:**
```bash
npm run test:e2e
```

**Note:** The E2E tests use `supertest` and automatically start the application, so you don't need to run the server separately.

**Expected Output:**
```
PASS  tests/e2e/webhook.e2e-spec.ts
  WebhookController (e2e)
    ✓ /api/webhook (POST) - should return 403 for missing auth
    ✓ /api/webhook (POST) - should return 400 for missing provider
    ✓ /api/webhook (POST) - should return 400 for invalid provider
    ✓ /api/webhook (POST) - should successfully transform valid Stripe webhook

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
```

### Manual Testing with curl

You can also manually test the API with curl:

```bash
curl -X POST http://localhost:3000/api/webhook?provider=stripe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk_test_merchant123_secret_key_abc" \
  -H "X-Merchant-Id: merchant_123" \
  -d '{
    "payload": {
      "id": "evt_1OZF3t2eZvKYlo2CqD8kJZ7n",
      "object": "event",
      "type": "charge.dispute.created",
      "data": {
        "object": {
          "object": "dispute",
          "charge": "ch_3OZF3r2eZvKYlo2C1k5D6f7g",
          "reason": "fraudulent",
          "currency": "usd",
          "amount": 5000
        }
      }
    }
  }'
```

**Alternative using X-Forter-API-Key header:**
```bash
curl -X POST http://localhost:3000/api/webhook?provider=stripe \
  -H "Content-Type: application/json" \
  -H "X-Forter-API-Key: sk_test_merchant123_secret_key_abc" \
  -H "X-Merchant-Id: merchant_123" \
  -d '{
    "payload": {
      "id": "evt_1OZF3t2eZvKYlo2CqD8kJZ7n",
      "object": "event",
      "type": "charge.dispute.created",
      "data": {
        "object": {
          "object": "dispute",
          "charge": "ch_3OZF3r2eZvKYlo2C1k5D6f7g",
          "reason": "fraudulent",
          "currency": "usd",
          "amount": 5000
        }
      }
    }
  }'
```

## High-Level Design (HLD)

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Payment Provider (Stripe)                     │
│                    sends raw webhook JSON                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ POST /webhook?provider=stripe
                             │ { "payload": {...} }
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                    NestJS Webhook API                             │
│                                                                   │
│  ┌──────────────────────┐                                        │
│  │ WebhookController     │                                        │
│  │ - Validates provider  │                                        │
│  │   query parameter     │                                        │
│  │ - Parses request body │                                        │
│  └───────────┬──────────┘                                        │
│              │                                                    │
│              │ calls                                              │
│              ▼                                                    │
│  ┌──────────────────────┐      ┌──────────────────────────────┐ │
│  │ WebhookService        │      │ ProviderValidationPipe       │ │
│  │ (orchestrator)        │◄─────│ - Validates provider enum    │ │
│  │                       │      │ - Normalizes provider name  │ │
│  │ 1. Get mapper         │      └──────────────────────────────┘ │
│  │ 2. Validate payload   │                                        │
│  │ 3. Extract event type │      ┌──────────────────────────────┐ │
│  │ 4. Get mapping expr   │      │ MappingRegistryService       │ │
│  │ 5. Execute mapping    │◄─────│ - Maps provider → mapper     │ │
│  │ 6. Validate result    │      │ - Auto-registered via factory│ │
│  └───────────┬──────────┘      └──────────────────────────────┘ │
│              │                  └───────────┬──────────────────┘ │
│              │                              │                    │
│              │                              │ getMapper()        │
│              │                              ▼                    │
│              │                  ┌──────────────────────────────┐ │
│              │                  │ IWebhookMapper               │ │
│              │                  │ (Interface)                  │ │
│              │                  └───────────┬──────────────────┘ │
│              │                              │                    │
│              │                              │ implementations    │
│              │                  ┌───────────┴──────────┐        │
│              │                  │                      │        │
│              │                  ▼                      ▼        │
│              │      ┌──────────────────┐  ┌──────────────────┐ │
│              │      │StripeWebhookMapper│  │PaypalWebhookMapper│ │
│              │      │- extractEventType │  │(future)           │ │
│              │      │- validatePayload  │  └──────────────────┘ │
│              │      │- getMappingExpr   │                        │
│              │      └───────────┬───────┘                        │
│              │                  │                                │
│              │                  │ JSONata expression             │
│              │                  ▼                                │
│              │      ┌──────────────────────────────┐             │
│              │      │ MappingHelperService         │             │
│              │      │ - Executes JSONata           │             │
│              │      │ - Transforms payload         │             │
│              │      └───────────┬──────────────────┘             │
│              │                  │                                │
│              │                  │ transformed result             │
│              │                  │ (validated via DTOs)           │
│              │                  │                                │
│              │                  │ (returns to WebhookService)   │
│              │                  │                                │
│              │◄─────────────────┘                                │
│              │                                                    │
│     ┌────────┴────────┐                                         │
│     │                 │                                         │
│     ▼                 │                                         │
│  200 OK               │                                         │
│  { result }           │                                         │
│                       │                                         │
│                       │ (if error occurs anywhere above)        │
│                       │                                         │
│                       ▼                                         │
│      ┌──────────────────────────────────────────┐              │
│      │ WebhookExceptionFilter                   │              │
│      │ (Global APP_FILTER - intercepts all)     │              │
│      │ - Catches domain errors from any step    │              │
│      │ - Converts to HTTP responses             │              │
│      └───────────┬──────────────────────────────┘              │
│                  │                                              │
│                  ▼                                              │
│           400/500 Error Response                                │
│           { error, message, details[] }                         │
└──────────────────────────────────────────────────────────────────┘
```

### Request Flow

```
1. Client Request
   POST /webhook?provider=stripe
   { "payload": { /* Stripe webhook */ } }
   │
   ▼
2. ProviderValidationPipe
   - Validates provider query param
   - Checks against PaymentProvider enum
   │
   ▼
3. WebhookController
   - Receives validated request
   - Delegates to WebhookService
   │
   ▼
4. WebhookService (Orchestration)
   │
   ├─► 4.1 MappingRegistryService
   │      - Retrieves StripeWebhookMapper
   │
   ├─► 4.2 StripeWebhookMapper.validatePayload()
   │      - Validates Stripe webhook structure
   │
   ├─► 4.3 StripeWebhookMapper.extractEventType()
   │      - Extracts "charge.dispute.created"
   │
   ├─► 4.4 StripeWebhookMapper.getMappingExpression()
   │      - Returns JSONata expression
   │
   ├─► 4.5 MappingHelperService.executeMapping()
   │      - Executes JSONata transformation
   │      - Returns: { transaction_id, reason, currency, amount, provider }
   │
   └─► 4.6 Result validation (via DTOs)
        - Validates against ForterChargebackDto
        - Ensures required fields present
        - Validates types and formats using class-validator
   │
   ▼
5. Response
   { "result": { /* Forter chargeback object */ } }
```

### Error Handling Flow

```
Domain Error (e.g., ProviderNotFoundError)
   │
   ▼
WebhookExceptionFilter (Global)
   │
   ├─► ProviderNotFoundError → 400 BadRequest
   │      { error: "ProviderError", message: "...", details: [...] }
   │
   ├─► ValidationError → 400 BadRequest
   │      { error: "ValidationError", message: "...", details: [...] }
   │
   └─► MappingExecutionError → 500 InternalServerError
         { error: "MappingError", message: "..." }
```

## Architecture

### Components

1. **WebhookController**: Handles HTTP requests and validates query parameters
2. **WebhookService**: Orchestrates the transformation process
3. **MappingRegistryService**: Manages provider-to-mapper mappings (auto-registered via factory)
4. **MappingHelperService**: Executes JSONata expressions
5. **IWebhookMapper Interface**: Contract for provider-specific mappers
6. **StripeWebhookMapper**: Stripe-specific implementation
7. **ProviderValidationPipe**: Validates and normalizes provider query parameter
8. **WebhookExceptionFilter**: Global exception filter for domain error handling
9. **ForterChargebackDto**: DTO with class-validator decorators for schema validation
10. **MerchantAuthService**: Handles merchant authentication

### Design Decisions

#### Extensibility
- **Interface-based design**: New providers implement `IWebhookMapper`
- **Registry pattern**: Easy to register new mappers without modifying core logic
- **JSONata expressions**: Stored per provider/event type, easy to modify

To add a new provider:
1. Create a new mapper class implementing `IWebhookMapper`
2. Register it in `MappingRegistryService`
3. Add mapping expressions for supported event types

#### Developer Experience
- **Clear error messages**: Detailed validation errors with field-level issues
- **Type safety**: Full TypeScript support with interfaces and DTOs
- **Testable**: Each component can be tested in isolation

#### Safety and Maintainability
- **Schema validation**: Ensures output matches Forter's format
- **Error handling**: Comprehensive error types with proper HTTP status codes
- **Payload validation**: Provider-specific validation before processing
- **Separation of concerns**: Each component has a single responsibility

#### Future Enhancements
- **Mapping versioning**: Support multiple versions of mappings per provider
- **Mapping testing UI**: Web interface for merchants to test mappings
- **Mapping analytics**: Track mapping success/failure rates
- **Dynamic mapping storage**: Move from in-memory to database/API
- **Webhook signature verification**: Validate webhook authenticity
- **Rate limiting**: Protect against abuse
- **Audit logging**: Track all transformations for compliance

## Adding a New Payment Provider

The architecture is designed for easy extensibility. Adding a new provider (e.g., Square, Braintree) requires minimal changes to core services.

### Step-by-Step Guide

#### Step 1: Add Provider to Enum

Add the new provider to the `PaymentProvider` enum:

```typescript
// src/webhook/enums/payment-provider.enum.ts
export enum PaymentProvider {
  STRIPE = 'stripe',
  SQUARE = 'square',  // ← Add new provider here
  BRAINTREE = 'braintree',
}
```

#### Step 2: Create Provider Directory Structure

Create a new directory for your provider under `src/webhook/mappers/`:

```
src/webhook/mappers/square/
  ├── constants/
  │   └── mapping-expressions.const.ts
  ├── dto/
  │   └── square-webhook-basic.dto.ts  (if needed)
  └── square-webhook.mapper.ts
```

#### Step 3: Implement the Mapper

Create a mapper class implementing `IWebhookMapper`:

```typescript
// src/webhook/mappers/square/square-webhook.mapper.ts
import { Injectable } from '@nestjs/common';
import { IWebhookMapper } from '../../interfaces/webhook-mapper.interface';
import { ForterChargeback } from '../../schemas/forter-chargeback.schema';
import { PaymentProvider } from '../../enums/payment-provider.enum';
import { MAPPING_EXPRESSIONS } from './constants/mapping-expressions.const';

@Injectable()
export class SquareWebhookMapper implements IWebhookMapper {
  getProviderName(): string {
    return PaymentProvider.SQUARE;
  }

  extractEventType(payload: any): string | null {
    // Square-specific logic to extract event type
    return payload?.type || null;
  }

  verifyEventType(eventType: string): boolean {
    return eventType in MAPPING_EXPRESSIONS;
  }

  validatePayload(payload: any): { valid: boolean; error?: string } {
    // Square-specific validation logic
    // Use class-validator DTOs if needed (see Stripe example)
    return { valid: true };
  }

  getMappingExpression(eventType: string): string | null {
    return MAPPING_EXPRESSIONS[eventType] || null;
  }

  // Optional: Provider-specific preprocessing
  preProcessPayload?(payload: any): any {
    return payload;
  }

  // Optional: Provider-specific postprocessing
  postProcessResult?(result: any): ForterChargeback {
    return result;
  }
}
```

#### Step 4: Define Mapping Expressions

Create JSONata mapping expressions for each supported event type:

```typescript
// src/webhook/mappers/square/constants/mapping-expressions.const.ts
import { PaymentProvider } from '../../../enums/payment-provider.enum';

export const MAPPING_EXPRESSIONS: Record<string, string> = {
  'dispute.created': `
    {
      "transaction_id": data.object.dispute_id,
      "reason": data.object.reason,
      "currency": $uppercase(data.object.amount_money.currency),
      "amount": data.object.amount_money.amount,
      "provider": "${PaymentProvider.SQUARE}"
    }
  `,
  // Add more event types as needed
};
```

#### Step 5: Register in WebhookModule

Add the mapper to `WebhookModule`:

```typescript
// src/webhook/webhook.module.ts
import { SquareWebhookMapper } from './mappers/square/square-webhook.mapper';

@Module({
  // ...
  providers: [
    // ... existing providers
    SquareWebhookMapper,  // ← Add here
    
    {
      provide: MappingRegistryService,
      useFactory: (
        stripeMapper: StripeWebhookMapper,
        squareMapper: SquareWebhookMapper,  // ← Add parameter
      ): MappingRegistryService => {
        const mappers: IWebhookMapper[] = [
          stripeMapper,
          squareMapper,  // ← Add to array
        ];
        return new MappingRegistryService(mappers);
      },
      inject: [
        StripeWebhookMapper,
        SquareWebhookMapper,  // ← Add to inject array
      ],
    },
  ],
})
```

#### Step 6: Write Tests

Create unit tests for your mapper:

```typescript
// tests/webhook/mappers/square/square-webhook.mapper.spec.ts
describe('SquareWebhookMapper', () => {
  // Test all methods: extractEventType, validatePayload, etc.
});
```

### What You DON'T Need to Change

- ✅ `WebhookService` - Works with any mapper via interface
- ✅ `WebhookController` - No changes needed
- ✅ `MappingRegistryService` - Auto-registers new mappers
- ✅ Core validation/error handling - Already generic

### Example: Adding Square

1. Add `SQUARE = 'square'` to `PaymentProvider` enum
2. Copy `StripeWebhookMapper` as template
3. Adapt `extractEventType()` for Square's payload structure
4. Create Square-specific mapping expressions
5. Register in module
6. Write tests

### Best Practices

- **Follow existing patterns**: Use Stripe mapper as a reference
- **Isolate provider code**: Keep provider-specific logic in its own directory
- **Use JSONata**: Declarative mappings are easier to maintain than code
- **Validate early**: Use DTOs with class-validator for payload validation
- **Test thoroughly**: Write unit tests for all mapper methods
- **Document event types**: Add comments explaining provider-specific fields

## Project Structure

```
src/
├── webhook/
│   ├── interfaces/
│   │   └── webhook-mapper.interface.ts
│   ├── schemas/
│   │   └── forter-chargeback.schema.ts
│   ├── dto/
│   │   ├── webhook-request.dto.ts
│   │   └── webhook-response.dto.ts
│   ├── errors/
│   │   └── webhook.errors.ts
│   ├── services/
│   │   ├── webhook.service.ts
│   │   ├── mapping-registry.service.ts
│   │   ├── mapping-helper.service.ts
│   │   └── merchant-auth.service.ts
│   ├── mappers/
│   │   └── stripe/
│   │       ├── constants/
│   │       ├── dto/
│   │       └── stripe-webhook.mapper.ts
│   ├── guards/
│   ├── filters/
│   ├── pipes/
│   ├── interceptors/
│   ├── enums/
│   ├── constants/
│   ├── helpers/
│   ├── webhook.controller.ts
│   └── webhook.module.ts
└── app.module.ts
```

## Testing

### Unit Tests

Run all unit tests:
```bash
npm run test
```

Run tests in watch mode (automatically re-runs on file changes):
```bash
npm run test:watch
```

Generate coverage report:
```bash
npm run test:cov
```

### E2E Tests

For E2E testing, see the [E2E Testing](#e2e-testing) section above.

## Design Questions & Answers

### 1. Extensibility: How would you design this so we can onboard new providers (Square, Braintree, etc.) with minimal engineering effort?

The architecture is designed for easy extensibility through an **interface-based design** and **registry pattern**. Adding a new provider requires minimal changes to core services.

#### Design Principles

**Interface-Based Architecture:**
- All providers implement the `IWebhookMapper` interface
- Core services (`WebhookService`, `MappingRegistryService`) depend on the interface, not implementations
- New providers are plug-and-play without modifying existing code

**Registry Pattern:**
- `MappingRegistryService` automatically registers all mappers via factory pattern
- Provider lookup is O(1) using a Map data structure
- No changes needed to core services when adding providers

**Isolated Provider Code:**
- Each provider has its own directory with provider-specific logic
- Mapping expressions, validation DTOs, and business logic are self-contained
- Changes to one provider don't affect others

For detailed step-by-step instructions on adding a new provider, see the [Adding a New Payment Provider](#adding-a-new-payment-provider) section above.

#### Why This Design Works

1. **Zero Core Changes**: Adding a provider doesn't require modifying any core services
2. **Type Safety**: TypeScript ensures all mappers implement the interface correctly
3. **Testability**: Each mapper can be tested in isolation
4. **Maintainability**: Provider-specific code is isolated and easy to find
5. **Scalability**: Can add unlimited providers without architectural changes

The interface-based design and registry pattern ensure that onboarding new providers is a straightforward, low-risk process that doesn't impact existing functionality.

### 2. Developer Experience: If a merchant needed to test their mapping before going live, what tooling would you expose?

The production endpoint already provides detailed error messages that are sufficient for testing. However, to improve developer experience, I'd recommend a **multi-layered approach** with tooling that scales from simple to sophisticated based on merchant needs.

#### Current State

The production `/webhook` endpoint already provides excellent feedback for testing:

- **Structured Error Responses**: Clear error types (`ValidationError`, `ProviderError`, `MappingError`)
- **Detailed Messages**: Specific field-level errors (e.g., "Missing 'charge' field in dispute object")
- **Helpful Context**: Error messages include what was expected and what was missing

Merchants can use the production endpoint with test payloads and get immediate, actionable feedback on validation failures.

#### Recommended Tooling (Priority Order)

##### 1. Enhanced Swagger/OpenAPI Documentation

**What**: Improve the existing Swagger UI with:
- Pre-filled example payloads for each provider/event type
- "Try it out" functionality with sample data
- Response examples for both success and error cases
- Schema validation hints

**Why**: 
- Zero additional code (just documentation)
- Immediate value for non-technical users
- Works with existing endpoint

**Implementation**:
```typescript
@ApiBody({
  type: WebhookRequestDto,
  description: 'Raw webhook payload from payment provider',
  examples: {
    stripeDispute: {
      value: {
        payload: {
          id: 'evt_123',
          object: 'event',
          type: 'charge.dispute.created',
          data: { object: { ... } }
        }
      }
    }
  }
})
```

##### 2. Postman/Insomnia Collection

**What**: Pre-configured API collection with:
- Environment variables for API keys and merchant IDs
- Pre-request scripts to generate test payloads
- Test scripts with assertions
- Example requests for each provider/event type

**Why**:
- Industry standard tooling
- Easy to share with merchants
- Supports automated testing
- No code changes needed

**Deliverable**: Export a Postman collection JSON file

##### 3. Web UI Testing Dashboard

**What**: Simple web interface with:
- JSON payload editor with syntax highlighting
- Provider selector dropdown
- "Test" button to execute transformation
- Results panel showing:
  - Input payload (formatted)
  - Output result (formatted)
  - Validation errors (if any)
- Sample payload library per provider
- Test history (save/reload test cases)

**Why**:
- Best developer experience
- Accessible to non-technical users
- Visual feedback
- Can be embedded in merchant portal

**Tech Stack**: React/Vue frontend calling the existing `/webhook` endpoint

##### 4. CLI Tool (Optional)

**What**: Command-line tool for technical merchants:
```bash
forter-test --provider stripe --file webhook.json
forter-test --provider stripe --payload '{"type": "..."}'
```

**Why**:
- Useful for CI/CD integration
- Preferred by some developers
- Can be integrated into automated testing

**When to Build**: Only if merchants request it

#### Recommended Approach

**Phase 1 (Immediate)**:
1. Enhance Swagger with example payloads
2. Create Postman collection

**Phase 2 (If Needed)**:
3. Build Web UI Dashboard (if merchants request it)

**Phase 3 (Optional)**:
4. CLI tool (only if there's demand)

#### Summary

The production endpoint already provides excellent error messages, so merchants can test directly. The Swagger improvements and Postman collection provide immediate value with minimal effort. The Web UI dashboard is a nice-to-have for better UX, but not essential given the quality of existing error responses.

**Priority**: Start with Swagger + Postman (quick wins), then evaluate if merchants need the Web UI based on feedback.

### 3. Safety and Maintainability: How would you sandbox mapping logic, manage versions, or detect breaking changes?

#### 1. Sandboxing Mapping Logic

**Timeout Protection**: Add timeout (e.g., 5 seconds) using `Promise.race()` to prevent hanging requests.

**Resource Limits**: Validate expression complexity (nesting depth, length) before execution.

#### 2. Managing Versions

**Versioned Mappings**: Support multiple versions (v1, v2) in code. Store as `Record<version, Record<eventType, expression>>`.

**Database-Backed Versions**: Store mappings in database for dynamic updates and gradual rollout.

#### 3. Detecting Breaking Changes

**Automated Comparison Tool**: Compare old vs new mapping outputs on sample payloads. Detect missing fields, type changes. Integrate into CI/CD.

**Compatibility Test Suite**: Automated tests ensuring backward compatibility (required fields, type matching).

**Monitoring & Alerts**: Track metrics per version (success rate, execution time, field completeness). Alert on anomalies.

#### Implementation Priority

**Phase 1 (Essential)**: Timeout protection, basic versioning, breaking change detection tool.

**Phase 2 (Production)**: Resource limits, compatibility test suite.

**Phase 3 (Advanced)**: Database-backed versions, gradual rollout, monitoring & alerts.

#### Summary

Start with timeout protection and basic versioning. Add automated breaking change detection. Move to database-backed versions for production flexibility.

### 4. GTM Integration: How could this system help shorten merchant onboarding time? What key metrics would you track?

#### How This System Shortens Merchant Onboarding

**Self-Service Testing**: Merchants can test webhooks immediately using the production endpoint with clear error messages, reducing support dependency.

**Standardized Interface**: Single API endpoint for all providers with consistent error format. Merchants familiar with one provider can easily add others.

**Extensible Architecture**: New providers can be added quickly without requiring merchant-side changes. Merchants can onboard even before their provider is fully supported.

**Clear Documentation**: Swagger UI with examples and Postman collection enable quick testing without engineering support.

#### Key Metrics to Track

**Onboarding Metrics**:
- Time to First Successful Webhook: From merchant signup to first successful transformation
- Onboarding Completion Rate: % of merchants who complete onboarding
- Support Tickets per Merchant: Number of support requests during onboarding

**Technical Metrics**:
- Mapping Success Rate: % of webhooks successfully transformed
- Error Rate by Type: Breakdown of validation errors, mapping errors, etc.
- Provider Adoption: Which providers are most popular

**Business Metrics**:
- Merchant Activation Rate: % of signed merchants who send webhooks
- Time Saved vs Manual Integration: Comparison to previous onboarding process

#### Summary

The system shortens onboarding through self-service testing, standardized interfaces, and clear error messages. Track "Time to First Successful Webhook", "Onboarding Completion Rate", "Mapping Success Rate", and "Support Tickets per Merchant" to measure effectiveness and identify improvement areas.

### 5. Future Enhancements: What will be the next milestones of this project? How will you decide what would be the next steps after the initial version?

#### Next Milestones

**Phase 1: Production Hardening**
- Timeout protection for mapping execution
- Basic versioning (v1/v2) for mappings
- Enhanced monitoring and logging
- Health check endpoints

**Phase 2: Additional Providers**
- Onboard 2-3 major providers (Square, Braintree, PayPal)
- Validate extensibility with real-world providers
- Build provider-specific test suites

**Phase 3: Operational Excellence**
- Database-backed mapping versions for dynamic updates
- Breaking change detection tool
- Gradual rollout capabilities
- Enhanced error tracking and alerting

**Phase 4: Developer Experience**
- Enhanced Swagger documentation with examples
- Postman collection for merchants
- Web UI dashboard (if merchant demand exists)

**Phase 5: Advanced Features**
- Webhook signature verification
- Rate limiting per merchant tier
- Mapping analytics and insights
- Audit logging for compliance

#### Decision Framework

**Data-Driven Decisions**: Track key metrics (onboarding time, success rate, support tickets) to identify bottlenecks and pain points. Prioritize based on merchant feedback and usage patterns.

**Merchant Feedback**: Regular surveys, support ticket analysis, and feature requests to understand real needs.

**Business Priorities**: Consider revenue impact (faster onboarding = more merchants), competitive differentiation, and technical debt reduction.

**Technical Considerations**: Balance maintainability, scalability, risk vs. reward, and team capacity.

#### Summary

Next milestones focus on production hardening, additional providers, and operational excellence. Decisions are driven by metrics, merchant feedback, business priorities, and technical considerations. Prioritize based on impact and feasibility, starting with safety and reliability before advanced features.

## License

UNLICENSED
