import { IsString, IsEnum, IsOptional, IsNumber, IsDateString, IsUUID, Min } from 'class-validator';
import { RevenueCategory, PaymentMode, RevenueStatus } from '../entities/RevenueEntry';
import { TallyExportType } from '../entities/TallyExportLog';

export class CreateRevenueEntryDto {
  @IsUUID()
  projectId!: string;

  @IsEnum(RevenueCategory)
  category!: RevenueCategory;

  @IsEnum(RevenueStatus)
  @IsOptional()
  status?: RevenueStatus;

  @IsEnum(PaymentMode)
  @IsOptional()
  paymentMode?: PaymentMode;

  @IsString()
  description!: string;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  unitNumber?: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  gstAmount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  tdsAmount?: number;

  @IsDateString()
  @IsOptional()
  expectedDate?: string;

  @IsDateString()
  @IsOptional()
  receivedDate?: string;

  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateRevenueEntryDto {
  @IsEnum(RevenueCategory)
  @IsOptional()
  category?: RevenueCategory;

  @IsEnum(RevenueStatus)
  @IsOptional()
  status?: RevenueStatus;

  @IsEnum(PaymentMode)
  @IsOptional()
  paymentMode?: PaymentMode;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  unitNumber?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  gstAmount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  tdsAmount?: number;

  @IsDateString()
  @IsOptional()
  expectedDate?: string;

  @IsDateString()
  @IsOptional()
  receivedDate?: string;

  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class RevenueQueryDto {
  @IsUUID()
  @IsOptional()
  projectId?: string;

  @IsEnum(RevenueCategory)
  @IsOptional()
  category?: RevenueCategory;

  @IsEnum(RevenueStatus)
  @IsOptional()
  status?: RevenueStatus;

  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @IsDateString()
  @IsOptional()
  dateTo?: string;
}

export class TallyExportDto {
  @IsEnum(TallyExportType)
  exportType!: TallyExportType;

  @IsUUID()
  @IsOptional()
  projectId?: string;

  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @IsDateString()
  @IsOptional()
  dateTo?: string;
}
