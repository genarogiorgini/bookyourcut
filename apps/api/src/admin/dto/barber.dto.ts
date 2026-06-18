import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export class UpsertBarberDto {
  @IsString()
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsString()
  photoUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  instagram?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  bio?: string | null;

  @IsNumber()
  @Min(0)
  pricePerCut!: number;

  @IsInt()
  @Min(5)
  @Max(240)
  defaultDurationMin!: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class ScheduleWindowDto {
  @IsInt()
  @Min(0)
  @Max(6)
  weekday!: number;

  @Matches(TIME_RE, { message: 'startTime must be HH:mm' })
  startTime!: string;

  @Matches(TIME_RE, { message: 'endTime must be HH:mm' })
  endTime!: string;
}

/** Full replacement of a barber's weekly schedule. */
export class ReplaceScheduleDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleWindowDto)
  windows!: ScheduleWindowDto[];
}

export class CreateTimeOffDto {
  @IsISO8601()
  startsAt!: string;

  @IsISO8601()
  endsAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string | null;
}
