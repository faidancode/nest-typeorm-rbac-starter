import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Get,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { JwtAuthGuard } from '../jwt.guard';
import { CaslAbilityFactory } from 'src/common/casl/casl-ability.factory';
import type { AppAbility } from 'src/common/casl/casl-ability.factory';

type PermissionScope = 'all' | 'department' | 'team' | 'own';

type MyPermissionItem = {
  action: string;
  scope: PermissionScope;
};

type MyPermissionGroup = {
  resource: string;
  permissions: MyPermissionItem[];
};

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly caslFactory: CaslAbilityFactory,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: any) {
    return await this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('refreshToken') refreshToken: string) {
    return await this.authService.refreshAccessToken(refreshToken);
  }

  /**
   * Endpoint opsional untuk mengecek data user yang sedang login
   * Berdasarkan hasil validate() di JwtStrategy
   */
  @Post('me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: any) {
    return req.user;
  }

  @Get('me/permissions')
  @UseGuards(JwtAuthGuard)
  async getMyPermissions(@Req() req: any) {
    const ability = await this.caslFactory.createForUser(req.user);

    return this.formatPermissions(ability);
  }

  private formatPermissions(ability: AppAbility): MyPermissionGroup[] {
    const groups = new Map<string, Map<string, MyPermissionItem>>();

    for (const rule of ability.rules as Array<{
      action?: string;
      subject?: string;
      inverted?: boolean;
      conditions?: Record<string, unknown>;
    }>) {
      if (
        rule.inverted ||
        typeof rule.action !== 'string' ||
        typeof rule.subject !== 'string'
      ) {
        continue;
      }

      const scope = this.resolveScope(rule.conditions);
      if (!scope) {
        continue;
      }

      if (!groups.has(rule.subject)) {
        groups.set(rule.subject, new Map());
      }

      const permissionKey = `${rule.action}:${scope}`;
      groups.get(rule.subject)?.set(permissionKey, {
        action: rule.action,
        scope,
      });
    }

    return [...groups.entries()]
      .map(([resource, permissions]) => ({
        resource,
        permissions: [...permissions.values()].sort((a, b) => {
          const scopeOrder: Record<PermissionScope, number> = {
            own: 1,
            team: 2,
            department: 3,
            all: 4,
          };

          const scopeDiff = scopeOrder[a.scope] - scopeOrder[b.scope];
          if (scopeDiff !== 0) {
            return scopeDiff;
          }

          return a.action.localeCompare(b.action);
        }),
      }))
      .sort((a, b) => a.resource.localeCompare(b.resource));
  }

  private resolveScope(
    conditions?: Record<string, unknown>,
  ): PermissionScope | null {
    if (!conditions || Object.keys(conditions).length === 0) {
      return 'all';
    }

    if (Object.keys(conditions).length !== 1) {
      return null;
    }

    if ('departmentId' in conditions) {
      return 'department';
    }

    if ('teamId' in conditions) {
      return 'team';
    }

    if ('id' in conditions) {
      return 'own';
    }

    return null;
  }
}
