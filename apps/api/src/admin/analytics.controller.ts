import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common';
import type { AnalyticsResponse } from '@turnero/shared';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth-user.interface';
import { AnalyticsService } from './analytics.service';

@Controller('admin/analytics')
@UseGuards(SupabaseAuthGuard)
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get()
  compute(
    @CurrentUser() user: AuthUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<AnalyticsResponse> {
    if (!from || !to) throw new BadRequestException('from and to are required (YYYY-MM-DD)');
    return this.analytics.compute(user.tenantId, from, to);
  }
}
