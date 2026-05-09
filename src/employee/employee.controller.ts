import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { PoliciesGuard } from 'src/common/casl/policies.guard';
import { CheckPolicies } from 'src/common/casl/check-policies.decorator';
import { Action } from 'src/common/casl/action.enum';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { UuidSchema } from 'src/common/schemas/common.schemas';
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
  create(
    @Body(new ZodValidationPipe(CreateEmployeeSchema)) data: CreateEmployeeDto,
  ) {
    return this.employeeService.create(data);
  }

  @Get()
  @CheckPolicies((ability) => ability.can(Action.Read, 'employee'))
  findAll(
    @Query(new ZodValidationPipe(ListEmployeeSchema))
    query: ListEmployeeDto,
  ) {
    return this.employeeService.findAll(query);
  }

  @Get(':id')
  @CheckPolicies((ability) => ability.can(Action.Read, 'employee'))
  findOne(@Param('id', new ZodValidationPipe(UuidSchema)) id: string) {
    return this.employeeService.findOne(id);
  }

  @Get(':id/position-histories')
  @CheckPolicies((ability) => ability.can(Action.Read, 'employee'))
  findHistories(@Param('id', new ZodValidationPipe(UuidSchema)) id: string) {
    return this.employeeService.findPositionHistories(id);
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.can(Action.Update, 'employee'))
  update(
    @Param('id', new ZodValidationPipe(UuidSchema)) id: string,
    @Body(new ZodValidationPipe(UpdateEmployeeSchema)) data: UpdateEmployeeDto,
  ) {
    return this.employeeService.update(id, data);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Delete, 'employee'))
  remove(@Param('id', new ZodValidationPipe(UuidSchema)) id: string) {
    return this.employeeService.remove(id);
  }
}
