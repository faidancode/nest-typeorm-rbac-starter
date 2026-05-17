import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '../employee/entities/employee.entity';
import { Position } from '../position/entities/position.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    @InjectRepository(Position)
    private readonly positionRepo: Repository<Position>,
  ) {}

  async summary() {
    const rawData = await this.employeeRepo
      .createQueryBuilder('employee')
      .select([
        'SUM(CASE WHEN employee.is_active = 1 THEN 1 ELSE 0 END) AS totalActive',
        "SUM(CASE WHEN employee.gender = 'Male' THEN 1 ELSE 0 END) AS totalMale",
        "SUM(CASE WHEN employee.gender = 'Female' THEN 1 ELSE 0 END) AS totalFemale",
        "SUM(CASE WHEN employee.employee_status = 'Permanent' THEN 1 ELSE 0 END) AS totalPermanent",
        "SUM(CASE WHEN employee.employee_status = 'Contract' THEN 1 ELSE 0 END) AS totalContract",
      ])
      .getRawOne();

    return {
      totalActive: Number(rawData?.totalActive ?? 0),
      totalMale: Number(rawData?.totalMale ?? 0),
      totalFemale: Number(rawData?.totalFemale ?? 0),
      totalPermanent: Number(rawData?.totalPermanent ?? 0),
      totalContract: Number(rawData?.totalContract ?? 0),
    };
  }

  async positionsTotal() {
    const total = await this.positionRepo.count();

    return {
      totalAvailablePositions: total,
    };
  }
}
