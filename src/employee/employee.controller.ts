import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { PoliciesGuard } from 'src/common/casl/policies.guard';
import { CheckPolicies } from 'src/common/casl/check-policies.decorator';
import { Action } from 'src/common/casl/action.enum';
import {
  CreateEmployeeSchema,
  ListEmployeeSchema,
  UpdateEmployeeSchema,
  type CreateEmployeeDto,
  type ListEmployeeDto,
  type UpdateEmployeeDto,
} from './schemas/employee.schemas';

@Controller('employees')
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class EmployeesController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Post()
  @CheckPolicies((ability) => ability.can(Action.Create, 'employee'))
  create(@Body() data: CreateEmployeeDto) {
    return this.employeeService.create(CreateEmployeeSchema.parse(data));
  }

  @Get()
  @CheckPolicies((ability) => ability.can(Action.Read, 'employee'))
  findAll(@Query() query?: ListEmployeeDto) {
    return this.employeeService.findAll(ListEmployeeSchema.parse(query ?? {}));
  }

  @Get(':id')
  @CheckPolicies((ability) => ability.can(Action.Read, 'employee'))
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.employeeService.findOne(id);
  }

  @Get(':id/position-histories')
  @CheckPolicies((ability) => ability.can(Action.Read, 'employee'))
  findHistories(@Param('id', ParseUUIDPipe) id: string) {
    return this.employeeService.findPositionHistories(id);
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.can(Action.Update, 'employee'))
  update(@Param('id', ParseUUIDPipe) id: string, @Body() data: UpdateEmployeeDto) {
    return this.employeeService.update(id, UpdateEmployeeSchema.parse(data));
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Delete, 'employee'))
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.employeeService.remove(id);
  }
}
