import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetCurrentUserId = createParamDecorator(
  (data: undefined, context: ExecutionContext): string | undefined => {
    const request = context.switchToHttp().getRequest<{
      user?: { id?: string; sub?: string };
    }>();
    // AtStrategy returns User entity with 'id', but JWT payload has 'sub'
    // Check both for compatibility
    return request.user?.id ?? request.user?.sub;
  },
);
