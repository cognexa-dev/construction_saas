import {
  IsString, IsEnum, IsOptional, IsInt, IsDateString,
  IsUUID, MaxLength, Min, Max,
} from 'class-validator';
import { ReraRegistrationStatus } from '../entities/ReraCompliance';
import { MilestoneStatus } from '../entities/ComplianceMilestone';
import { ApprovalType, ApprovalStatus } from '../entities/ApprovalRecord';

export class UpsertReraDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reraNumber?: string;

  @IsOptional()
  @IsEnum(ReraRegistrationStatus)
  status?: ReraRegistrationStatus;

  @IsOptional()
  @IsDateString()
  registrationDate?: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsString()
  promoterName?: string;

  @IsOptional()
  carpetArea?: string;

  @IsOptional()
  @IsInt()
  totalUnits?: number;

  @IsOptional()
  @IsInt()
  soldUnits?: number;

  @IsOptional()
  @IsDateString()
  lastQuarterlyReport?: string;

  @IsOptional()
  @IsDateString()
  nextQuarterlyReport?: string;
}

export class CreateMilestoneDto {
  @IsString()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progress?: number;
}

export class UpdateMilestoneDto {
  @IsOptional()
  @IsEnum(MilestoneStatus)
  status?: MilestoneStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progress?: number;

  @IsOptional()
  @IsDateString()
  completedDate?: string;
}

export class UpsertLandRecordDto {
  @IsOptional()
  @IsString()
  surveyNumber?: string;

  @IsOptional()
  @IsString()
  village?: string;

  @IsOptional()
  @IsString()
  taluka?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  totalArea?: string;

  @IsOptional()
  @IsString()
  areaUnit?: string;

  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @IsOptional()
  purchasePrice?: string;

  @IsOptional()
  jantriValue?: string;

  @IsOptional()
  @IsString()
  sellerName?: string;

  @IsOptional()
  @IsString()
  naOrderNumber?: string;

  @IsOptional()
  @IsDateString()
  naOrderDate?: string;
}

export class UpsertApprovalDto {
  @IsEnum(ApprovalType)
  approvalType!: ApprovalType;

  @IsOptional()
  @IsEnum(ApprovalStatus)
  status?: ApprovalStatus;

  @IsOptional()
  @IsString()
  applicationNumber?: string;

  @IsOptional()
  @IsDateString()
  applicationDate?: string;

  @IsOptional()
  @IsDateString()
  approvalDate?: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsString()
  authorityName?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
