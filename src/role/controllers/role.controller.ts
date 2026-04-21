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

@Controller('roles')
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class RoleController {
  constructor(private readonly service: RoleService) {}

  @Post()
  @CheckPolicies((ability) => ability.can(Action.Create, 'role'))
  create(@Body() body: CreateRoleDto) {
    const payload = CreateRoleSchema.parse(body);
    return this.service.create(payload);
  }

  @Get()
  @CheckPolicies((ability) => ability.can(Action.Read, 'role'))
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @CheckPolicies((ability) => ability.can(Action.Read, 'role'))
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.can(Action.Update, 'role'))
  update(@Param('id') id: string, @Body() body: UpdateRoleDto) {
    const payload = UpdateRoleSchema.parse(body);
    return this.service.update(id, payload);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Delete, 'role'))
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/permissions')
  @CheckPolicies((ability) => ability.can(Action.Update, 'role'))
  assignPermissions(@Param('id') id: string, @Body() body: AssignPermissionsDto) {
    const payload = AssignPermissionsSchema.parse(body);
    return this.service.assignPermissions(id, payload);
  }
}
