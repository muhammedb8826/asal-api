export interface PaginatedMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
  sortBy?: string;
  filters?: Record<string, unknown>;
  search?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginatedMeta;
}

export interface SuccessResponse<T> extends ApiResponse<T> {
  success: true;
  data: T;
}

export interface ErrorResponse {
  success: false;
  message: string;
  errors: Record<string, string>;
}

export interface PaginatedResponse<T> extends SuccessResponse<T[]> {
  meta: PaginatedMeta;
}

// Helper functions to create standardized responses
export class ResponseBuilder {
  static success<T>(
    data: T,
    message: string = 'Items fetched successfully',
    meta?: PaginatedMeta,
  ): SuccessResponse<T> {
    return {
      success: true,
      message,
      data,
      ...(meta ? { meta } : {}),
    };
  }

  static error(
    message: string,
    errors?: Record<string, string>,
  ): ErrorResponse {
    return {
      success: false,
      message,
      errors: errors ?? { general: message },
    };
  }

  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    message: string = 'Items fetched successfully',
    extras?: {
      sortBy?: string;
      filters?: Record<string, unknown>;
      search?: string;
    },
  ): PaginatedResponse<T> {
    const totalPages = Math.ceil(total / Math.max(limit, 1));
    return {
      success: true,
      message,
      data,
      meta: {
        totalItems: total,
        itemCount: data.length,
        itemsPerPage: limit,
        totalPages,
        currentPage: page,
        ...(extras?.sortBy ? { sortBy: extras.sortBy } : {}),
        ...(extras?.filters ? { filters: extras.filters } : {}),
        ...(extras?.search ? { search: extras.search } : {}),
      },
    };
  }

  static created<T>(
    data: T,
    message: string = 'Resource created successfully',
  ): SuccessResponse<T> {
    return this.success(data, message);
  }

  static updated<T>(
    data: T,
    message: string = 'Resource updated successfully',
  ): SuccessResponse<T> {
    return this.success(data, message);
  }

  static deleted(
    message: string = 'Resource deleted successfully',
  ): SuccessResponse<null> {
    return this.success(null, message);
  }

  static notFound(resource: string = 'Resource'): ErrorResponse {
    return this.error(`${resource} not found`);
  }

  static validationError(errors: Record<string, string>): ErrorResponse {
    return this.error('Validation failed', errors);
  }

  static unauthorized(message: string = 'Unauthorized access'): ErrorResponse {
    return this.error(message);
  }

  static forbidden(message: string = 'Access forbidden'): ErrorResponse {
    return this.error(message);
  }

  static conflict(message: string): ErrorResponse {
    return this.error(message);
  }

  static badRequest(message: string): ErrorResponse {
    return this.error(message);
  }

  static internalError(
    message: string = 'Internal server error',
  ): ErrorResponse {
    return this.error(message);
  }
}

// Common error codes
// Kept for compatibility (no-op types)
export const ErrorCodes = {} as const;
export type ErrorCode = never;
