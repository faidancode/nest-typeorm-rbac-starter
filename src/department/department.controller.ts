import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { DepartmentService } from './department.service';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { PoliciesGuard } from 'src/common/casl/policies.guard';
import { CheckPolicies } from 'src/common/casl/check-policies.decorator';
import { Action } from 'src/common/casl/action.enum';
import { subject } from 'src/common/casl/subject.helper';
import {
  CreateDepartmentSchema,
  UpdateDepartmentSchema,
  type CreateDepartmentDto,
  type UpdateDepartmentDto,
} from './schemas/department.schemas';
import type { RequestWithAbility } from 'src/common/casl/request-with-ability';

@Controller('departments')
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Post()
  @CheckPolicies((ability) => ability.can(Action.Create, 'department'))
  create(@Body() data: CreateDepartmentDto) {
    return this.departmentService.create(CreateDepartmentSchema.parse(data));
  }

  @Get()
  @CheckPolicies((ability) => ability.can(Action.Read, 'department'))
  findAll() {
    return this.departmentService.findAll();
  }

  @Get(':id')
  @CheckPolicies((ability) => ability.can(Action.Read, 'department'))
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithAbility,
  ) {
    const department = await this.departmentService.findOne(id);

    if (!req.ability?.can(Action.Read, subject('department', department))) {
      throw new ForbiddenException();
    }

    return department;
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.can(Action.Update, 'department'))
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdateDepartmentDto,
    @Req() req: RequestWithAbility,
  ) {
    const department = await this.departmentService.findOne(id);

    if (!req.ability?.can(Action.Update, subject('department', department))) {
      throw new ForbiddenException();
    }

    return this.departmentService.update(
      id,
      UpdateDepartmentSchema.parse(data),
    );
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Delete, 'department'))
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithAbility,
  ) {
    const department = await this.departmentService.findOne(id);

    if (!req.ability?.can(Action.Delete, subject('department', department))) {
      throw new ForbiddenException();
    }

    return this.departmentService.remove(id);
  }
}
