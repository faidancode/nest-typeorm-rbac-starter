import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Employee } from '../employee/entities/employee.entity';
import { Position } from '../position/entities/position.entity';

describe('DashboardServiceTest', () => {
  let service: DashboardService;

  const employeeQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
  };

  const employeeRepo = {
    createQueryBuilder: jest.fn(() => employeeQueryBuilder),
  };

  const positionRepo = {
    count: jest.fn(),
  };

  beforeEach(async () => {
    employeeQueryBuilder.select.mockClear();
    employeeQueryBuilder.getRawOne.mockReset();
    employeeRepo.createQueryBuilder.mockClear();
    positionRepo.count.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: getRepositoryToken(Employee),
          useValue: employeeRepo,
        },
        {
          provide: getRepositoryToken(Position),
          useValue: positionRepo,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  describe('Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('DashboardService_Summary', () => {
    it('should return dashboard summary counts', async () => {
      employeeQueryBuilder.getRawOne.mockResolvedValue({
        totalActive: '10',
        totalMale: '4',
        totalFemale: '6',
        totalPermanent: '7',
        totalContract: '3',
      });

      const result = await service.summary();

      expect(employeeRepo.createQueryBuilder).toHaveBeenCalledWith('employee');
      expect(result).toEqual({
        totalActive: 10,
        totalMale: 4,
        totalFemale: 6,
        totalPermanent: 7,
        totalContract: 3,
      });
    });

    it('should fallback to zero when raw data is empty', async () => {
      employeeQueryBuilder.getRawOne.mockResolvedValue(null);

      const result = await service.summary();

      expect(result).toEqual({
        totalActive: 0,
        totalMale: 0,
        totalFemale: 0,
        totalPermanent: 0,
        totalContract: 0,
      });
    });
  });

  describe('DashboardService_PositionsTotal', () => {
    it('should return total available positions', async () => {
      positionRepo.count.mockResolvedValue(12);

      const result = await service.positionsTotal();

      expect(positionRepo.count).toHaveBeenCalled();
      expect(result).toEqual({ totalAvailablePositions: 12 });
    });
  });
});
