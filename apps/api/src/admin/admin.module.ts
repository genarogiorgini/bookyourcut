import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { BarbersController } from './barbers.controller';
import { BarbersService } from './barbers.service';
import { RemindersController } from './reminders.controller';
import { RemindersService } from './reminders.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  controllers: [
    AppointmentsController,
    BarbersController,
    RemindersController,
    AnalyticsController,
  ],
  providers: [AppointmentsService, BarbersService, RemindersService, AnalyticsService],
})
export class AdminModule {}
