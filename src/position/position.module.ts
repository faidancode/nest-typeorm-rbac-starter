import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Position } from './entities/position.entity';
import { PositionService } from './position.service';
import { PositionController } from './position.controller';
import { PositionRepository } from './repositories/position.repository';
import { CaslModule } from 'src/common/casl/casl.module';
import { JwtAuthGuard } from 'src/auth/jwt.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Position]), CaslModule],
  controllers: [PositionController],
  providers: [PositionService, PositionRepository, JwtAuthGuard],
  exports: [PositionService, PositionRepository],
})
export class PositionModule {}
