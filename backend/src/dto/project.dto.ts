import {
  IsString, IsEnum, IsOptional, IsNumberString,
  MinLength, MaxLength, IsDateString,
} from 'class-validator';
import { ProjectType, ProjectStatus } from '../entities/Project';

export class CreateProjectDto {
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @IsOptional()
  @IsEnum(ProjectType)
  type?: ProjectType;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  expectedEndDate?: string;

  @IsOptional()
  @IsNumberString()
  totalBudget?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  reraNumber?: string;

  @IsOptional()
  @IsNumberString()
  landArea?: string;

  @IsOptional()
  @IsNumberString()
  jantriRate?: string;
}

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(ProjectType)
  type?: ProjectType;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  expectedEndDate?: string;

  @IsOptional()
  @IsDateString()
  actualEndDate?: string;

  @IsOptional()
  @IsNumberString()
  totalBudget?: string;

  @IsOptional()
  @IsString()
  reraNumber?: string;

  @IsOptional()
  @IsNumberString()
  landArea?: string;

  @IsOptional()
  @IsNumberString()
  jantriRate?: string;
}
