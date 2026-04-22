import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from './entities/employee.entity';
import { EmployeeService } from './employee.service';
import { EmployeesController } from './employee.controller';
import { EmployeeRepository } from './repositories/employee.repository';
import { PositionHistory } from './entities/position-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Employee, PositionHistory])],
  controllers: [EmployeesController],
  providers: [EmployeeService, EmployeeRepository],
  exports: [EmployeeService, EmployeeRepository],
})
export class EmployeesModule {}
