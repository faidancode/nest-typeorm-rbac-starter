import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';

import { CaslModule } from 'src/common/casl/casl.module';
import { AppConfig } from 'src/config/app.config';
import { UserModule } from 'src/user/user.module';
import { UserRepository } from '../user/repositories/user.repository';
import { JwtAuthGuard } from './jwt.guard';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    ConfigModule,

    // 🔐 Enable passport (JWT)
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // 🔐 JWT config (async biar pakai env)
    JwtModule.registerAsync({
      inject: [AppConfig],
      useFactory: (config: AppConfig) => ({
        secret: config.jwt.accessSecret,
        signOptions: {
          expiresIn: config.jwt.accessExpiresIn,
        },
      }),
    }),
    UserModule,
    CaslModule,
  ],

  controllers: [AuthController],

  providers: [
    AuthService,
    JwtStrategy, // 🔥 WAJIB
    JwtAuthGuard, // optional (kalau mau inject)
    UserRepository, // dipakai di strategy
  ],

  exports: [
    JwtAuthGuard, // biar bisa dipakai di module lain
    PassportModule,
  ],
})
export class AuthModule {}
