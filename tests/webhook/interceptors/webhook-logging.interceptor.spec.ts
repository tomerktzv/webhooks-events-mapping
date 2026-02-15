import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { WebhookLoggingInterceptor } from '../../../src/webhook/interceptors/webhook-logging.interceptor';

describe('WebhookLoggingInterceptor', () => {
  let interceptor: WebhookLoggingInterceptor;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let loggerSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WebhookLoggingInterceptor],
    }).compile();

    interceptor = module.get<WebhookLoggingInterceptor>(WebhookLoggingInterceptor);

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          method: 'POST',
          url: '/webhook',
          query: { provider: 'stripe' },
          headers: {
            'stripe-signature': 'test-signature',
            'content-type': 'application/json',
          },
        }),
      }),
    } as any;

    mockCallHandler = {
      handle: jest.fn(),
    } as any;

    // Access logger through the interceptor instance
    const logger = (interceptor as any).logger;
    loggerSpy = jest.spyOn(logger, 'log').mockImplementation();
    jest.spyOn(logger, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('intercept', () => {
    it('should log incoming request and successful response', (done) => {
      const responseData = { result: { transaction_id: 'ch_123' } };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(responseData));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (data) => {
          expect(data).toEqual(responseData);
          expect(loggerSpy).toHaveBeenCalled();
          expect(loggerSpy.mock.calls[0][0]).toContain('Incoming webhook request');
          expect(loggerSpy.mock.calls[1][0]).toContain('Webhook processed successfully');
          done();
        },
      });
    });

    it('should log error when request fails', (done) => {
      const error = new Error('Test error');
      mockCallHandler.handle = jest.fn().mockReturnValue(throwError(() => error));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          const logger = (interceptor as any).logger;
          expect(logger.error).toHaveBeenCalled();
          expect(logger.error).toHaveBeenCalledWith(
            expect.stringContaining('Webhook processing failed'),
            error.stack,
          );
          done();
        },
      });
    });

    it('should sanitize headers correctly', (done) => {
      const request = {
        method: 'POST',
        url: '/webhook',
        query: { provider: 'stripe' },
        headers: {
          'stripe-signature': 'test-signature',
          'content-type': 'application/json',
          'authorization': 'Bearer secret-token', // Should not be logged
          'x-custom-header': 'value', // Should not be logged
        },
      };

      mockExecutionContext.switchToHttp().getRequest = jest.fn().mockReturnValue(request);
      mockCallHandler.handle = jest.fn().mockReturnValue(of({}));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          const logCall = loggerSpy.mock.calls[0][0];
          expect(logCall).toContain('stripe-signature');
          expect(logCall).toContain('content-type');
          expect(logCall).not.toContain('authorization');
          expect(logCall).not.toContain('x-custom-header');
          done();
        },
      });
    });

    it('should handle request without provider in query', (done) => {
      const request = {
        method: 'POST',
        url: '/webhook',
        query: {},
        headers: {},
      };

      mockExecutionContext.switchToHttp().getRequest = jest.fn().mockReturnValue(request);
      mockCallHandler.handle = jest.fn().mockReturnValue(of({}));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          const logCall = loggerSpy.mock.calls[0][0];
          expect(logCall).toContain('unknown');
          done();
        },
      });
    });

    it('should log processing duration', (done) => {
      const startTime = Date.now();
      mockCallHandler.handle = jest.fn().mockReturnValue(of({}));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          const duration = Date.now() - startTime;
          const logCall = loggerSpy.mock.calls[1][0];
          expect(logCall).toContain('Duration:');
          expect(logCall).toContain('ms');
          done();
        },
      });
    });
  });
});
