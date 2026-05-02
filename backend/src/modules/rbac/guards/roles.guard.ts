import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RbacService } from '../rbac.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) {
      return true;
    }

    const req = context.switchToHttp().getRequest<Request>();
    const userId = req.user?.id;
    if (!userId) {
      throw new ForbiddenException('Missing authenticated user');
    }

    const hasAny = await this.rbacService.userHasAnyRole(userId, required);
    if (!hasAny) {
      throw new ForbiddenException('Insufficient role');
    }
    return true;
  }
}
