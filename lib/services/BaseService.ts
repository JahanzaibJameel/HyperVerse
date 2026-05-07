// Base service class for standardizing service layer patterns
export abstract class BaseService {
  protected abstract serviceName: string;

  // Common error handling
  protected handleError(error: unknown, context?: string): Error {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const contextMessage = context ? `${this.serviceName}: ${context} - ${errorMessage}` : `${this.serviceName}: ${errorMessage}`;
    return new Error(contextMessage);
  }

  // Common logging
  protected log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${this.serviceName}] [${level.toUpperCase()}] ${message}`;
    
    switch (level) {
      case 'info':
        console.log(logMessage);
        break;
      case 'warn':
        console.warn(logMessage);
        break;
      case 'error':
        console.error(logMessage);
        break;
    }
  }

  // Common async error wrapper
  protected async withErrorHandling<T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T> {
    try {
      this.log(`Starting operation: ${context || 'unnamed'}`, 'info');
      const result = await operation();
      this.log(`Successfully completed: ${context || 'unnamed'}`, 'info');
      return result;
    } catch (error) {
      this.log(`Error in ${context || 'unnamed'}: ${error}`, 'error');
      throw this.handleError(error, context);
    }
  }

  // Common validation
  protected validateRequired(value: unknown, fieldName: string): void {
    if (value === null || value === undefined) {
      throw new Error(`${fieldName} is required`);
    }
  }

  protected validateString(value: unknown, fieldName: string): asserts value is string {
    this.validateRequired(value, fieldName);
    if (typeof value !== 'string') {
      throw new Error(`${fieldName} must be a string`);
    }
  }

  protected validateNumber(value: unknown, fieldName: string): asserts value is number {
    this.validateRequired(value, fieldName);
    if (typeof value !== 'number') {
      throw new Error(`${fieldName} must be a number`);
    }
  }

  protected validateBoolean(value: unknown, fieldName: string): asserts value is boolean {
    this.validateRequired(value, fieldName);
    if (typeof value !== 'boolean') {
      throw new Error(`${fieldName} must be a boolean`);
    }
  }
}
