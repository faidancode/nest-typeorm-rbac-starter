import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { PositionService } from './position.service';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { PoliciesGuard } from 'src/common/casl/policies.guard';
import { CheckPolicies } from 'src/common/casl/check-policies.decorator';
import { Action } from 'src/common/casl/action.enum';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { UuidSchema } from 'src/common/schemas/common.schemas';
import {
  CreatePositionSchema,
  UpdatePositionSchema,
  type CreatePositionDto,
  type UpdatePositionDto,
} from './schemas/position.schemas';

@Controller('positions')
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class PositionController {
  constructor(private readonly positionService: PositionService) {}

  @Post()
  @CheckPolicies((ability) => ability.can(Action.Create, 'position'))
  create(@Body(new ZodValidationPipe(CreatePositionSchema)) data: CreatePositionDto) {
    return this.positionService.create(data);
  }

  @Get()
  @CheckPolicies((ability) => ability.can(Action.Read, 'position'))
  findAll() {
    return this.positionService.findAll();
  }

  @Get(':id')
  @CheckPolicies((ability) => ability.can(Action.Read, 'position'))
  findOne(@Param('id', new ZodValidationPipe(UuidSchema)) id: string) {
    return this.positionService.findOne(id);
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.can(Action.Update, 'position'))
  update(
    @Param('id', new ZodValidationPipe(UuidSchema)) id: string,
    @Body(new ZodValidationPipe(UpdatePositionSchema)) data: UpdatePositionDto,
  ) {
    return this.positionService.update(id, data);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Delete, 'position'))
  remove(@Param('id', new ZodValidationPipe(UuidSchema)) id: string) {
    return this.positionService.remove(id);
  }
}
