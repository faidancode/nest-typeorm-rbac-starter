import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { PoliciesGuard } from 'src/common/casl/policies.guard';
import { CaslAbilityFactory } from 'src/common/casl/casl-ability.factory';

describe('DashboardControllerTest', () => {
  let controller: DashboardController;
  let service: jest.Mocked<DashboardService>;

  beforeEach(async () => {
    const serviceMock: Partial<Record<keyof DashboardService, any>> = {
      summary: jest.fn(),
      positionsTotal: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: serviceMock,
        },
        {
          provide: JwtAuthGuard,
          useValue: { canActivate: () => true },
        },
        {
          provide: PoliciesGuard,
          useValue: { canActivate: () => true },
        },
        {
          provide: CaslAbilityFactory,
          useValue: {
            createForUser: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
    service = module.get(DashboardService) as jest.Mocked<DashboardService>;
  });

  describe('Initialization', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });
  });

  describe('DashboardController_Summary', () => {
    it('should return summary from service', async () => {
      const mockSummary = {
        totalActive: 10,
        totalMale: 4,
        totalFemale: 6,
        totalPermanent: 7,
        totalContract: 3,
      };
      service.summary.mockResolvedValue(mockSummary as any);

      const result = await controller.summary();

      expect(service.summary).toHaveBeenCalled();
      expect(result).toEqual(mockSummary);
    });
  });

  describe('DashboardController_PositionsTotal', () => {
    it('should return positions total from service', async () => {
      const mockPositionsTotal = { totalAvailablePositions: 12 };
      service.positionsTotal.mockResolvedValue(mockPositionsTotal as any);

      const result = await controller.positionsTotal();

      expect(service.positionsTotal).toHaveBeenCalled();
      expect(result).toEqual(mockPositionsTotal);
    });
  });
});
