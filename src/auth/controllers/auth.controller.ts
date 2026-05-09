import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Get,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { JwtAuthGuard } from '../jwt.guard';
import { CaslAbilityFactory } from 'src/common/casl/casl-ability.factory';
import {
  LoginSchema,
  RefreshTokenSchema,
  type LoginDto,
  type RefreshTokenDto,
} from '../schemas/auth.schemas';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { RateLimit } from 'src/common/rate-limit/rate-limit.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly caslFactory: CaslAbilityFactory,
  ) {}

  @Post('login')
  @RateLimit({ ttlMs: 60_000, limit: 5, scope: 'ip' })
  @HttpCode(HttpStatus.OK)
  async login(@Body(new ZodValidationPipe(LoginSchema)) dto: LoginDto) {
    return await this.authService.login(dto);
  }

  @Post('refresh')
  @RateLimit({ ttlMs: 60_000, limit: 10, scope: 'ip' })
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body(new ZodValidationPipe(RefreshTokenSchema))
    body: RefreshTokenDto,
  ) {
    const { refreshToken } = body;
    return await this.authService.refreshAccessToken(refreshToken);
  }

  /**
   * Endpoint opsional untuk mengecek data user yang sedang login
   * Berdasarkan hasil validate() di JwtStrategy
   */
  @Post('me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: any) {
    return req.user;
  }

  @Get('me/permissions')
  @UseGuards(JwtAuthGuard)
  async getMyPermissions(@Req() req: any) {
    const ability = await this.caslFactory.createForUser(req.user);

    return ability.rules;
  }
}
