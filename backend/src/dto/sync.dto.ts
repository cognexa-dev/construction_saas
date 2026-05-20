import {
  IsString, IsEnum, IsArray, IsOptional, ValidateNested, IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SyncOperation } from '../entities/SyncQueue';

export class SyncOperationDto {
  @IsString()
  clientId!: string;

  @IsString()
  entityType!: string;

  @IsOptional()
  @IsString()
  entityId?: string;

  @IsEnum(SyncOperation)
  operation!: SyncOperation;

  @IsOptional()
  payload?: Record<string, unknown>;

  @IsDateString()
  clientTimestamp!: string;
}

export class SyncBatchDto {
  @IsString()
  deviceId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncOperationDto)
  operations!: SyncOperationDto[];
}
