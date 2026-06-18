import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import type { Barber, BarberSchedule, TimeOff } from '@turnero/shared';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth-user.interface';
import { BarbersService } from './barbers.service';
import {
  CreateTimeOffDto,
  ReplaceScheduleDto,
  UpsertBarberDto,
} from './dto/barber.dto';

@Controller('admin/barbers')
@UseGuards(SupabaseAuthGuard)
export class BarbersController {
  constructor(private readonly barbers: BarbersService) {}

  @Get()
  list(@CurrentUser() user: AuthUser): Promise<Barber[]> {
    return this.barbers.list(user.tenantId);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: UpsertBarberDto): Promise<Barber> {
    return this.barbers.create(user.tenantId, dto);
  }

  @Put(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertBarberDto,
  ): Promise<Barber> {
    return this.barbers.update(user.tenantId, id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ id: string }> {
    return this.barbers.remove(user.tenantId, id);
  }

  // --- schedules ------------------------------------------------------------

  @Get(':id/schedule')
  getSchedule(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BarberSchedule[]> {
    return this.barbers.getSchedule(user.tenantId, id);
  }

  @Put(':id/schedule')
  replaceSchedule(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReplaceScheduleDto,
  ): Promise<BarberSchedule[]> {
    return this.barbers.replaceSchedule(user.tenantId, id, dto);
  }

  // --- time off -------------------------------------------------------------

  @Get(':id/time-off')
  listTimeOff(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TimeOff[]> {
    return this.barbers.listTimeOff(user.tenantId, id);
  }

  @Post(':id/time-off')
  addTimeOff(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateTimeOffDto,
  ): Promise<TimeOff> {
    return this.barbers.addTimeOff(user.tenantId, id, dto);
  }

  @Delete(':id/time-off/:timeOffId')
  removeTimeOff(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('timeOffId', ParseUUIDPipe) timeOffId: string,
  ): Promise<{ id: string }> {
    return this.barbers.removeTimeOff(user.tenantId, id, timeOffId);
  }
}
