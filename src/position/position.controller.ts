import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { PositionService } from './position.service';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { PoliciesGuard } from 'src/common/casl/policies.guard';
import { CheckPolicies } from 'src/common/casl/check-policies.decorator';
import { Action } from 'src/common/casl/action.enum';
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
  create(@Body() data: CreatePositionDto) {
    return this.positionService.create(CreatePositionSchema.parse(data));
  }

  @Get()
  @CheckPolicies((ability) => ability.can(Action.Read, 'position'))
  findAll() {
    return this.positionService.findAll();
  }

  @Get(':id')
  @CheckPolicies((ability) => ability.can(Action.Read, 'position'))
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.positionService.findOne(id);
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.can(Action.Update, 'position'))
  update(@Param('id', ParseUUIDPipe) id: string, @Body() data: UpdatePositionDto) {
    return this.positionService.update(id, UpdatePositionSchema.parse(data));
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Delete, 'position'))
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.positionService.remove(id);
  }
}
