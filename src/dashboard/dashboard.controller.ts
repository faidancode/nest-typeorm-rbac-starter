import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { PoliciesGuard } from 'src/common/casl/policies.guard';
import { CheckPolicies } from 'src/common/casl/check-policies.decorator';
import { Action } from 'src/common/casl/action.enum';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @CheckPolicies((ability) => ability.can(Action.Read, 'employee'))
  summary() {
    return this.dashboardService.summary();
  }

  @Get('positions-total')
  @CheckPolicies((ability) => ability.can(Action.Read, 'position'))
  positionsTotal() {
    return this.dashboardService.positionsTotal();
  }
}
