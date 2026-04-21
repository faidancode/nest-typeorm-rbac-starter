import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserRepository } from './repositories/user.repository';
import { CaslModule } from 'src/common/casl/casl.module';
import { JwtAuthGuard } from 'src/auth/jwt.guard';

@Module({
  imports: [TypeOrmModule.forFeature([User]), CaslModule],
  controllers: [UserController],
  providers: [UserService, UserRepository, JwtAuthGuard],
  exports: [UserService, UserRepository], // Export agar bisa dipakai di AuthModule
})
export class UserModule {}
