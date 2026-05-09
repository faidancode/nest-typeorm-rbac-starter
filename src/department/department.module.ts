import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Department } from './entities/department.entity';
import { DepartmentService } from './department.service';
import { DepartmentRepository } from './repositories/department.repository';
import { DepartmentController } from './department.controller';
import { CaslModule } from 'src/common/casl/casl.module';

@Module({
  imports: [TypeOrmModule.forFeature([Department]), CaslModule],
  controllers: [DepartmentController],
  providers: [DepartmentService, DepartmentRepository],
  exports: [DepartmentService, DepartmentRepository],
})
export class DepartmentsModule {}
