import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  AssignPermissionsSchema,
  CreateRoleSchema,
  UpdateRoleSchema,
} from '../schemas/role.schemas';
import type {
  AssignPermissionsDto,
  CreateRoleDto,
  UpdateRoleDto,
} from '../schemas/role.schemas';
import { RoleService } from '../services/role.service';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { PoliciesGuard } from '../../common/casl/policies.guard';
import { CheckPolicies } from '../../common/casl/check-policies.decorator';
import { Action } from '../../common/casl/action.enum';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { UuidSchema } from 'src/common/schemas/common.schemas';
import { RateLimit } from 'src/common/rate-limit/rate-limit.decorator';

@Controller('roles')
@UseGuards(JwtAuthGuard, PoliciesGuard)
@RateLimit({ ttlMs: 60_000, limit: 30, scope: 'user' })
export class RoleController {
  constructor(private readonly service: RoleService) {}

  @Post()
  @CheckPolicies((ability) => ability.can(Action.Create, 'role'))
  create(@Body(new ZodValidationPipe(CreateRoleSchema)) body: CreateRoleDto) {
    return this.service.create(body);
  }

  @Get()
  @CheckPolicies((ability) => ability.can(Action.Read, 'role'))
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @CheckPolicies((ability) => ability.can(Action.Read, 'role'))
  findOne(@Param('id', new ZodValidationPipe(UuidSchema)) id: string) {
    return this.service.findById(id);
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.can(Action.Update, 'role'))
  update(
    @Param('id', new ZodValidationPipe(UuidSchema)) id: string,
    @Body(new ZodValidationPipe(UpdateRoleSchema)) body: UpdateRoleDto,
  ) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Delete, 'role'))
  remove(@Param('id', new ZodValidationPipe(UuidSchema)) id: string) {
    return this.service.remove(id);
  }

  @Post(':id/permissions')
  @CheckPolicies((ability) => ability.can(Action.Update, 'role'))
  assignPermissions(
    @Param('id', new ZodValidationPipe(UuidSchema)) id: string,
    @Body(new ZodValidationPipe(AssignPermissionsSchema))
    body: AssignPermissionsDto,
  ) {
    return this.service.assignPermissions(id, body);
  }
}
