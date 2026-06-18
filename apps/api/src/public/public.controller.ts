import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import type {
  AvailabilityResponse,
  CreateBookingResponse,
  PublicShop,
} from '@turnero/shared';
import { PublicService } from './public.service';
import { CreateBookingDto } from './dto/create-booking.dto';

/** Unauthenticated endpoints used by the client booking flow. */
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('shops/:slug')
  getShop(@Param('slug') slug: string): Promise<PublicShop> {
    return this.publicService.getShop(slug);
  }

  @Get('barbers/:barberId/availability')
  getAvailability(
    @Param('barberId', ParseUUIDPipe) barberId: string,
    @Query('date') date: string,
  ): Promise<AvailabilityResponse> {
    return this.publicService.getAvailability(barberId, date);
  }

  @Post('bookings')
  createBooking(@Body() dto: CreateBookingDto): Promise<CreateBookingResponse> {
    return this.publicService.createBooking(dto);
  }
}
