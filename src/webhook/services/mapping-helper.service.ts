import { Injectable } from '@nestjs/common';
import jsonata from 'jsonata';
import { MappingExecutionError } from '../errors/webhook.errors';

/**
 * Helper service for executing JSONata mapping expressions
 */
@Injectable()
export class MappingHelperService {
  /**
   * Executes a JSONata expression against a payload
   * 
   * @param expression - JSONata expression string
   * @param payload - Input data to transform
   * @returns Transformed result
   * @throws MappingExecutionError if execution fails
   */
  async executeMapping(expression: string, payload: any): Promise<any> {
      let compiledExpression;
      try {
        compiledExpression = jsonata(expression);
      } catch (error) {
        throw new MappingExecutionError(
          `Failed to compile JSONata expression: ${error.message}`,
        );
      }

      let result;
      try {
        result = await compiledExpression.evaluate(payload);
      } catch (error) {
        throw new MappingExecutionError(
          `Failed to evaluate JSONata expression: ${error.message}`,
        );
      }
      
      if (result === undefined || result === null) {
        throw new MappingExecutionError(
          'Mapping expression returned undefined or null. Check if the expression matches the payload structure.',
        );
      }

      return result;
  }
}
