import {
  Controller,
  Get,
  Body,
  Post,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { PoliciesGuard } from 'src/common/casl/policies.guard';
import { CheckPolicies } from 'src/common/casl/check-policies.decorator';
import { Action } from 'src/common/casl/action.enum';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { UuidSchema } from 'src/common/schemas/common.schemas';
import { RateLimit } from 'src/common/rate-limit/rate-limit.decorator';
import {
  CreateUserSchema,
  UpdateUserSchema,
  type CreateUserDto,
  type UpdateUserDto,
} from './schemas/user.schemas';

@Controller('users')
@UseGuards(JwtAuthGuard, PoliciesGuard)
@RateLimit({ ttlMs: 60_000, limit: 30, scope: 'user' })
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @CheckPolicies((ability) => ability.can(Action.Create, 'user'))
  create(@Body(new ZodValidationPipe(CreateUserSchema)) data: CreateUserDto) {
    return this.userService.create(data);
  }

  @Get()
  @CheckPolicies((ability) => ability.can(Action.Read, 'user'))
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @CheckPolicies((ability) => ability.can(Action.Read, 'user'))
  findOne(@Param('id', new ZodValidationPipe(UuidSchema)) id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.can(Action.Update, 'user'))
  update(
    @Param('id', new ZodValidationPipe(UuidSchema)) id: string,
    @Body(new ZodValidationPipe(UpdateUserSchema)) data: UpdateUserDto,
  ) {
    return this.userService.update(id, data);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Delete, 'user'))
  remove(@Param('id', new ZodValidationPipe(UuidSchema)) id: string) {
    return this.userService.remove(id);
  }
}
