import {
  IsEnum,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import type { AppointmentStatus, UpsertAppointmentRequest } from '@turnero/shared';

const STATUSES: AppointmentStatus[] = [
  'pending',
  'confirmed',
  'cancelled',
  'completed',
  'no_show',
];

export class UpsertAppointmentDto implements UpsertAppointmentRequest {
  @IsUUID()
  barberId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  clientName!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(30)
  clientPhone!: string;

  @IsISO8601()
  startsAt!: string;

  @IsOptional()
  @IsISO8601()
  endsAt?: string;

  @IsOptional()
  @IsEnum(STATUSES)
  status?: AppointmentStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;
}

export class UpdateAppointmentDto {
  @IsOptional()
  @IsUUID()
  barberId?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  clientName?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(30)
  clientPhone?: string;

  @IsOptional()
  @IsISO8601()
  startsAt?: string;

  @IsOptional()
  @IsISO8601()
  endsAt?: string;

  @IsOptional()
  @IsEnum(STATUSES)
  status?: AppointmentStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;
}
