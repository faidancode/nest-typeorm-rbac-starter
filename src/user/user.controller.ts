import {
  Controller,
  Get,
  Body,
  Post,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { PoliciesGuard } from 'src/common/casl/policies.guard';
import { CheckPolicies } from 'src/common/casl/check-policies.decorator';
import { Action } from 'src/common/casl/action.enum';
import { RoleService } from 'src/role/services/role.service';
import {
  CreateUserSchema,
  AssignUserRoleSchema,
  ListUserSchema,
  UpdateUserSchema,
  type AssignUserRoleDto,
  type CreateUserDto,
  type ListUserDto,
  type UpdateUserDto,
} from './schemas/user.schemas';

@Controller('users')
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly roleService: RoleService,
  ) {}

  @Get('roles')
  @CheckPolicies((ability) => ability.can(Action.Read, 'role'))
  findRoles() {
    return this.roleService.findAllForSelect();
  }

  @Post()
  @CheckPolicies((ability) => ability.can(Action.Create, 'user'))
  create(@Body() data: CreateUserDto) {
    return this.userService.create(CreateUserSchema.parse(data));
  }

  @Get()
  @CheckPolicies((ability) => ability.can(Action.Read, 'user'))
  findAll(@Query() query?: ListUserDto) {
    return this.userService.findAll(ListUserSchema.parse(query ?? {}));
  }

  @Get(':id')
  @CheckPolicies((ability) => ability.can(Action.Read, 'user'))
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id/roles')
  @CheckPolicies((ability) => ability.can(Action.Update, 'user'))
  assignRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: AssignUserRoleDto,
  ) {
    return this.userService.assignRole(id, AssignUserRoleSchema.parse(data));
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.can(Action.Update, 'user'))
  update(@Param('id', ParseUUIDPipe) id: string, @Body() data: UpdateUserDto) {
    return this.userService.update(id, UpdateUserSchema.parse(data));
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Delete, 'user'))
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.remove(id);
  }
}
