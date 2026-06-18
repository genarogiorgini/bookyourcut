import { IsISO8601, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import type { CreateBookingRequest } from '@turnero/shared';

export class CreateBookingDto implements CreateBookingRequest {
  @IsUUID()
  barberId!: string;

  @IsISO8601()
  startsAt!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  clientName!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(30)
  clientPhone!: string;
}
