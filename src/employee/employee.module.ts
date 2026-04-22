import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeService } from './employee.service';
import { EmployeesController } from './employee.controller';
import { EmployeeRepository } from './repositories/employee.repository';
import { CaslModule } from 'src/common/casl/casl.module';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { Employee } from './entities/employee.entity';
import { PositionHistory } from './entities/position-history.entity';

@Module({
  imports: [CaslModule, TypeOrmModule.forFeature([Employee, PositionHistory])],
  controllers: [EmployeesController],
  providers: [EmployeeService, EmployeeRepository, JwtAuthGuard],
})
export class EmployeeModule {}
