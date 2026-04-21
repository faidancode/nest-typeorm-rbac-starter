import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PolicyHandler } from './policies.interface';
import { CHECK_POLICIES_KEY } from './check-policies.decorator';
import { CaslAbilityFactory } from './casl-ability.factory';
import { RequestWithAbility } from './request-with-ability';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private abilityFactory: CaslAbilityFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Ambil policy dari Method dan Class (digabungkan)
    const handlers =
      this.reflector.getAllAndMerge<PolicyHandler[]>(CHECK_POLICIES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || [];

    if (handlers.length === 0) return true;

    const request = context.switchToHttp().getRequest<RequestWithAbility>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User session not found');
    }

    // 2. Buat ability dan simpan di request untuk reuse di controller
    const ability = await this.abilityFactory.createForUser(user);
    request.ability = ability;

    // 3. Eksekusi semua handler (pastikan semua mengembalikan true)
    const isAllowed = handlers.every((handler) =>
      this.execHandler(handler, ability),
    );

    if (!isAllowed) {
      throw new ForbiddenException(
        'You do not have permission to perform this action',
      );
    }

    return true;
  }

  private execHandler(handler: PolicyHandler, ability: any) {
    if (typeof handler === 'function') {
      return handler(ability);
    }
    return handler.handle(ability);
  }
}
