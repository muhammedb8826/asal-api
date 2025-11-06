import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetCurrentUserId = createParamDecorator(
  (data: undefined, context: ExecutionContext): string | undefined => {
    const request = context.switchToHttp().getRequest<{
      user?: { sub?: string };
    }>();
    return request.user?.sub;
  },
);
