import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { Appointment } from '@turnero/shared';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth-user.interface';
import { AppointmentsService } from './appointments.service';
import {
  UpdateAppointmentDto,
  UpsertAppointmentDto,
} from './dto/upsert-appointment.dto';

@Controller('admin/appointments')
@UseGuards(SupabaseAuthGuard)
export class AppointmentsController {
  constructor(private readonly appointments: AppointmentsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('barberId') barberId?: string,
  ): Promise<Appointment[]> {
    return this.appointments.list(user.tenantId, from, to, barberId);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpsertAppointmentDto,
  ): Promise<Appointment> {
    return this.appointments.create(user.tenantId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppointmentDto,
  ): Promise<Appointment> {
    return this.appointments.update(user.tenantId, id, dto);
  }

  @Delete(':id')
  cancel(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Appointment> {
    return this.appointments.cancel(user.tenantId, id);
  }
}
