import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponse, ResponseBuilder } from './response.types';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse: ErrorResponse;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Handle different types of HTTP exceptions
      switch (status) {
        case HttpStatus.BAD_REQUEST: {
          const errors = this.getValidationErrors(exceptionResponse);
          errorResponse = errors
            ? ResponseBuilder.validationError(errors)
            : ResponseBuilder.badRequest(
                this.getErrorMessage(exceptionResponse),
              );
          break;
        }

        case HttpStatus.UNAUTHORIZED:
          errorResponse = ResponseBuilder.unauthorized(
            this.getErrorMessage(exceptionResponse),
          );
          break;

        case HttpStatus.FORBIDDEN:
          errorResponse = ResponseBuilder.forbidden(
            this.getErrorMessage(exceptionResponse),
          );
          break;

        case HttpStatus.NOT_FOUND:
          errorResponse = ResponseBuilder.notFound(
            this.getErrorMessage(exceptionResponse),
          );
          break;

        case HttpStatus.CONFLICT:
          errorResponse = ResponseBuilder.conflict(
            this.getErrorMessage(exceptionResponse),
          );
          break;

        case HttpStatus.UNPROCESSABLE_ENTITY: {
          const errors = this.getValidationErrors(exceptionResponse);
          errorResponse = ResponseBuilder.validationError(
            errors ?? { general: this.getErrorMessage(exceptionResponse) },
          );
          break;
        }

        default:
          errorResponse = ResponseBuilder.error(
            this.getErrorMessage(exceptionResponse),
          );
      }
    } else {
      // Handle non-HTTP exceptions
      const error = exception as Error;
      this.logger.error(`Unhandled exception: ${error.message}`, error.stack);

      errorResponse = ResponseBuilder.internalError(
        process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : error.message,
      );
    }

    // Add path information to the error response
    // Attach path for debugging in a type-safe way
    errorResponse = { ...errorResponse, path: request.url } as ErrorResponse & {
      path: string;
    };

    // Log the error
    this.logger.error(`Exception occurred: ${errorResponse.message}`, {
      statusCode: status,
      path: request.url,
      method: request.method,
      error: errorResponse.errors,
    });

    response.status(status).json(errorResponse);
  }

  private getErrorMessage(exceptionResponse: unknown): string {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (exceptionResponse && typeof exceptionResponse === 'object') {
      return (
        (exceptionResponse as { message?: string; error?: string }).message ||
        (exceptionResponse as { message?: string; error?: string }).error ||
        'An error occurred'
      );
    }

    return 'An error occurred';
  }

  private getValidationErrors(
    exceptionResponse: unknown,
  ): Record<string, string> | null {
    if (!exceptionResponse || typeof exceptionResponse !== 'object')
      return null;
    // Nest validation pipe commonly returns { message: string | string[], error: string, statusCode: number }
    // or { message: ValidationError[], ... }
    const msg = (exceptionResponse as { message?: unknown }).message;
    if (Array.isArray(msg)) {
      // If formatted like ["field1 should not be empty", ...], attempt to map by first word as field
      const errors: Record<string, string> = {};
      for (const m of msg) {
        if (typeof m === 'string') {
          const [field] = m.split(' ');
          errors[field] = m;
        }
      }
      return Object.keys(errors).length ? errors : null;
    }
    const errorsObj = (exceptionResponse as { errors?: unknown }).errors;
    if (errorsObj && typeof errorsObj === 'object') {
      return errorsObj as Record<string, string>;
    }
    return null;
  }
}
