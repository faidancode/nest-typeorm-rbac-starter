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

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly caslFactory: CaslAbilityFactory,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: any) {
    return await this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('refreshToken') refreshToken: string) {
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
