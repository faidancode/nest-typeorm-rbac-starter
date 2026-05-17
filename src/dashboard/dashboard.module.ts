import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Employee } from '../employee/entities/employee.entity';
import { Position } from '../position/entities/position.entity';
import { CaslModule } from 'src/common/casl/casl.module';

@Module({
  imports: [TypeOrmModule.forFeature([Employee, Position]), CaslModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
