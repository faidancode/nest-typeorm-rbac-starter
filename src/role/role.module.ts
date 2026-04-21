import { Module } from '@nestjs/common';
import { RoleService } from './services/role.service';
import { RoleController } from './controllers/role.controller';
import { RoleRepository } from './repositories/role.repository';
import { PermissionRepository } from './repositories/permission.repository';
import { CaslAbilityFactory } from 'src/common/casl/casl-ability.factory';
import { PoliciesGuard } from 'src/common/casl/policies.guard';
import { JwtAuthGuard } from 'src/auth/jwt.guard';

@Module({
  controllers: [RoleController],
  providers: [
    RoleService,
    RoleRepository,
    PermissionRepository,
    CaslAbilityFactory,
    PoliciesGuard,
    JwtAuthGuard,
  ],
  exports: [PermissionRepository],
})
export class RoleModule {}
