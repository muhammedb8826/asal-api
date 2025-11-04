import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  ResponseBuilder,
  SuccessResponse,
  PaginatedResponse,
  ErrorResponse,
} from './response.types';
import { parseListQuery } from './utils/list-query.util';

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, SuccessResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<SuccessResponse<T>> {
    const req = context.switchToHttp().getRequest<{ method?: string }>();
    const method = (req?.method || 'GET').toUpperCase();
    return next.handle().pipe(
      map((data: unknown): SuccessResponse<T> => {
        // If the response is already formatted, return it as is
        if (
          data &&
          typeof data === 'object' &&
          'success' in (data as Record<string, unknown>)
        ) {
          return data as SuccessResponse<T>;
        }

        // Transform the response to use our standard format
        if (method === 'POST') {
          return ResponseBuilder.created(data as T);
        }
        if (method === 'PUT' || method === 'PATCH') {
          return ResponseBuilder.updated(data as T);
        }
        // For DELETE, return success with empty object to satisfy generic T
        if (method === 'DELETE') {
          return ResponseBuilder.success(
            {} as unknown as T,
            'Resource deleted successfully',
          );
        }
        return ResponseBuilder.success(data as T);
      }),
    ) as unknown as Observable<SuccessResponse<T>>;
  }
}

type AlreadyFormattedResponse<T> =
  | SuccessResponse<T>
  | PaginatedResponse<T>
  | ErrorResponse;

type PaginatedResult<T> = { data: T[]; total: number };

type InterceptorOutput<T> = SuccessResponse<T> | PaginatedResponse<T>;

@Injectable()
export class PaginatedResponseInterceptor<T>
  implements
    NestInterceptor<T[], InterceptorOutput<T> | AlreadyFormattedResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<InterceptorOutput<T> | AlreadyFormattedResponse<T>> {
    const rawQuery = context.switchToHttp().getRequest<{
      query?: Record<string, unknown>;
    }>().query;
    const { page, limit, sortBy, search, filters } = parseListQuery(rawQuery);

    return next.handle().pipe(
      map((result: T[] | PaginatedResult<T> | AlreadyFormattedResponse<T>) => {
        // If the response is already formatted, return it as is
        if (
          result &&
          typeof result === 'object' &&
          'success' in (result as AlreadyFormattedResponse<T>)
        ) {
          return result as AlreadyFormattedResponse<T>;
        }

        // Handle different response formats
        if (Array.isArray(result)) {
          // If it's just an array, assume it's paginated data
          return ResponseBuilder.paginated(
            result,
            page,
            limit,
            result.length,
            'Items fetched successfully',
            {
              sortBy,
              filters,
              search,
            },
          );
        }

        if (
          result &&
          (result as PaginatedResult<T>).data &&
          Array.isArray((result as PaginatedResult<T>).data) &&
          (result as PaginatedResult<T>).total !== undefined
        ) {
          // If it's already a paginated result object
          return ResponseBuilder.paginated(
            (result as PaginatedResult<T>).data,
            page,
            limit,
            (result as PaginatedResult<T>).total,
            'Items fetched successfully',
            {
              sortBy,
              filters,
              search,
            },
          );
        }

        // Default case
        return ResponseBuilder.success(result as unknown as T);
      }),
    );
  }
}

// Decorator to apply the response interceptor to specific controllers or methods
export const UseResponseInterceptor = () => {
  return (
    target: any,
    propertyKey?: string,
    descriptor?: PropertyDescriptor,
  ) => {
    if (descriptor) {
      // Method decorator
      Reflect.defineMetadata(
        'response_interceptor',
        true,
        descriptor.value as object,
      );
    } else {
      // Class decorator
      Reflect.defineMetadata('response_interceptor', true, target as object);
    }
  };
};

// Decorator to apply the paginated response interceptor
export const UsePaginatedResponseInterceptor = () => {
  return (
    target: any,
    propertyKey?: string,
    descriptor?: PropertyDescriptor,
  ) => {
    if (descriptor) {
      // Method decorator
      Reflect.defineMetadata(
        'paginated_response_interceptor',
        true,
        descriptor.value as object,
      );
    } else {
      // Class decorator
      Reflect.defineMetadata(
        'paginated_response_interceptor',
        true,
        target as object,
      );
    }
  };
};
