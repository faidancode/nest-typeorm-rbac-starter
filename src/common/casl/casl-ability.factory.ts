import { Injectable } from '@nestjs/common';
import {
  AbilityBuilder,
  createMongoAbility,
  MongoAbility,
} from '@casl/ability';
import { Action } from './action.enum';
import { Subjects } from './subjects';
import { PermissionRepository } from '../../role/repositories/permission.repository';

export type AppAbility = MongoAbility<[Action, Subjects]>;

@Injectable()
export class CaslAbilityFactory {
  constructor(private readonly permissionRepo: PermissionRepository) {}

  async createForUser(user: any): Promise<AppAbility> {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(
      createMongoAbility,
    );

    const permissions = await this.permissionRepo.getUserPermissions(user.id);

    for (const perm of permissions) {
      const [resource, action] = perm.action.split('.');

      const conditions = this.buildConditions(perm.scope, user);
      if (conditions === null) {
        continue;
      }

      // All scope means the permission is unconditional.
      if (conditions === undefined) {
        can(action as Action, resource as any);
        continue;
      }

      // Dynamic condition-based rule for scoped permissions.
      can(action as Action, resource as any, conditions);
    }

    return build({
      detectSubjectType: (item: any) => item?.__type || item?.constructor?.name,
    });
  }

  private buildConditions(
    scope: string,
    user: any,
  ): Record<string, unknown> | undefined | null {
    switch (scope) {
      case 'all':
        return undefined;

      case 'department':
        return { departmentId: user.departmentId };

      case 'team':
        return { teamId: user.teamId };

      case 'own':
        return { id: user.id };

      default:
        return null;
    }
  }
}
