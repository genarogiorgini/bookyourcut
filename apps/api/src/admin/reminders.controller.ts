import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import type { ReminderDue } from '@turnero/shared';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth-user.interface';
import { RemindersService } from './reminders.service';

@Controller('admin/reminders')
@UseGuards(SupabaseAuthGuard)
export class RemindersController {
  constructor(private readonly reminders: RemindersService) {}

  @Get('due')
  due(
    @CurrentUser() user: AuthUser,
    @Query('hours') hours?: string,
  ): Promise<ReminderDue[]> {
    const parsed = hours ? parseInt(hours, 10) : 48;
    return this.reminders.due(user.tenantId, Number.isFinite(parsed) ? parsed : 48);
  }
}
