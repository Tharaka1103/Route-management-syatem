// Error handling utilities for the application

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error types
export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    if (field) {
      this.message = `${field}: ${message}`;
    }
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTH_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT_ERROR');
    this.name = 'ConflictError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed') {
    super(message, 500, 'DATABASE_ERROR');
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message?: string) {
    super(message || `${service} service unavailable`, 503, 'EXTERNAL_SERVICE_ERROR');
    this.name = 'ExternalServiceError';
  }
}

// Error handler middleware function
export function handleError(error: Error | AppError): {
  message: string;
  statusCode: number;
  code?: string;
  stack?: string;
} {
  console.error('Error occurred:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
  });

  // Handle known app errors
  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      code: error.code,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    };
  }

  // Handle Mongoose validation errors
  if (error.name === 'ValidationError') {
    return {
      message: 'Validation failed',
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    };
  }

  // Handle Mongoose cast errors
  if (error.name === 'CastError') {
    return {
      message: 'Invalid data format',
      statusCode: 400,
      code: 'INVALID_DATA',
    };
  }

  // Handle MongoDB duplicate key errors
  if (error.name === 'MongoError' && (error as any).code === 11000) {
    return {
      message: 'Duplicate entry found',
      statusCode: 409,
      code: 'DUPLICATE_ERROR',
    };
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return {
      message: 'Invalid token',
      statusCode: 401,
      code: 'INVALID_TOKEN',
    };
  }

  if (error.name === 'TokenExpiredError') {
    return {
      message: 'Token expired',
      statusCode: 401,
      code: 'TOKEN_EXPIRED',
    };
  }

  // Default error
  return {
    message: 'Internal server error',
    statusCode: 500,
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  };
}

// Async error wrapper for API routes
export function asyncHandler(fn: Function) {
  return async (req: any, res: any, next?: any) => {
    try {
      return await fn(req, res, next);
    } catch (error) {
      const errorResponse = handleError(error as Error);
      return Response.json(
        { success: false, error: errorResponse.message },
        { status: errorResponse.statusCode }
      );
    }
  };
}

// Validation helpers
export function validateRequired(value: any, fieldName: string): void {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError('is required', fieldName);
  }
}

export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format', 'email');
  }
}

export function validatePhone(phone: string): void {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  if (!phoneRegex.test(phone.replace(/\s+/g, ''))) {
    throw new ValidationError('Invalid phone number format', 'phone');
  }
}

export function validateCoordinates(lat: number, lng: number): void {
  if (isNaN(lat) || isNaN(lng)) {
    throw new ValidationError('Invalid coordinates format');
  }
  
  if (lat < -90 || lat > 90) {
    throw new ValidationError('Latitude must be between -90 and 90', 'latitude');
  }
  
  if (lng < -180 || lng > 180) {
    throw new ValidationError('Longitude must be between -180 and 180', 'longitude');
  }
}

export function validateObjectId(id: string, fieldName: string = 'ID'): void {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  if (!objectIdRegex.test(id)) {
    throw new ValidationError(`Invalid ${fieldName} format`);
  }
}

export function validateEnum(value: string, allowedValues: string[], fieldName: string): void {
  if (!allowedValues.includes(value)) {
    throw new ValidationError(
      `must be one of: ${allowedValues.join(', ')}`,
      fieldName
    );
  }
}

export function validateDateRange(startDate: Date, endDate: Date): void {
  if (startDate >= endDate) {
    throw new ValidationError('Start date must be before end date');
  }
}

export function validatePagination(page: number, limit: number): void {
  if (page < 1) {
    throw new ValidationError('Page number must be greater than 0', 'page');
  }
  
  if (limit < 1 || limit > 100) {
    throw new ValidationError('Limit must be between 1 and 100', 'limit');
  }
}

// Rate limiting helpers
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

export function createRateLimiter(windowMs: number, maxRequests: number) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (identifier: string) => {
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const resetTime = windowStart + windowMs;

    const record = requests.get(identifier);
    
    if (!record || record.resetTime <= now) {
      requests.set(identifier, { count: 1, resetTime });
      return;
    }

    if (record.count >= maxRequests) {
      throw new RateLimitError(`Rate limit exceeded. Try again after ${new Date(resetTime).toISOString()}`);
    }

    record.count++;
  };
}

// Retry mechanism
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        break;
      }

      // Don't retry on certain error types
      if (error instanceof AuthenticationError || 
          error instanceof AuthorizationError || 
          error instanceof ValidationError) {
        break;
      }

      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError!;
}

// Circuit breaker pattern
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime >= this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }
}
