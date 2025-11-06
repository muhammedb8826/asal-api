import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { Role } from '../enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    const request = context.switchToHttp().getRequest<{
      user?: { role?: Role; roles?: Role };
    }>();
    const userRole: Role | undefined =
      request.user?.roles ?? request.user?.role;
    if (!userRole) {
      throw new ForbiddenException('Missing role');
    }
    const allowed = requiredRoles.includes(userRole);
    if (!allowed) {
      throw new ForbiddenException('Insufficient role');
    }
    return true;
  }
}
