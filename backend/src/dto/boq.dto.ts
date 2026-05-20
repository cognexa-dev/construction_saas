import { IsString, IsEnum, IsNumber, IsOptional, Min, MaxLength } from 'class-validator';
import { BoqCategory, BoqUnit } from '../entities/BoqItem';

export class CreateBoqItemDto {
  @IsString()
  @MaxLength(255)
  workItem!: string;

  @IsEnum(BoqCategory)
  category!: BoqCategory;

  @IsEnum(BoqUnit)
  unit!: BoqUnit;

  @IsNumber()
  @Min(0)
  estimatedQty!: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  executedQty?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  ratePerUnit?: number;

  @IsString()
  @IsOptional()
  plannedMonth?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class UpdateBoqItemDto {
  @IsString()
  @MaxLength(255)
  @IsOptional()
  workItem?: string;

  @IsEnum(BoqCategory)
  @IsOptional()
  category?: BoqCategory;

  @IsEnum(BoqUnit)
  @IsOptional()
  unit?: BoqUnit;

  @IsNumber()
  @Min(0)
  @IsOptional()
  estimatedQty?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  executedQty?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  ratePerUnit?: number;

  @IsString()
  @IsOptional()
  plannedMonth?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}
