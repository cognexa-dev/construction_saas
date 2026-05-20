import {
  IsString, IsEnum, IsOptional, IsArray, IsBoolean,
  IsDateString, IsUUID, IsInt, Min, Max, MaxLength, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IncidentType, IncidentSeverity, IncidentStatus } from '../entities/IncidentReport';
import { InsuranceType } from '../entities/WorkerInsurance';
import { ChecklistResponseStatus } from '../entities/DailyChecklistSubmission';

export class ChecklistItemDto {
  @IsString()
  question!: string;

  @IsInt()
  @Min(0)
  sortOrder!: number;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}

export class CreateChecklistDto {
  @IsString()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  items!: ChecklistItemDto[];
}

export class ChecklistResponseDto {
  @IsUUID()
  itemId!: string;

  @IsString()
  question!: string;

  @IsEnum(ChecklistResponseStatus)
  response!: ChecklistResponseStatus;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class SubmitChecklistDto {
  @IsUUID()
  checklistId!: string;

  @IsUUID()
  projectId!: string;

  @IsDateString()
  submissionDate!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistResponseDto)
  responses!: ChecklistResponseDto[];

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreateIncidentReportDto {
  @IsUUID()
  projectId!: string;

  @IsEnum(IncidentType)
  type!: IncidentType;

  @IsEnum(IncidentSeverity)
  severity!: IncidentSeverity;

  @IsDateString()
  incidentDate!: string;

  @IsOptional()
  @IsString()
  incidentTime?: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  locationDetail?: string;

  @IsOptional()
  @IsArray()
  injuredPersons?: Array<{ name: string; role: string; injury: string }>;

  @IsOptional()
  @IsArray()
  photoUrls?: string[];

  @IsOptional()
  @IsString()
  immediateAction?: string;
}

export class UpdateIncidentReportDto {
  @IsOptional()
  @IsEnum(IncidentStatus)
  status?: IncidentStatus;

  @IsOptional()
  @IsString()
  rootCause?: string;

  @IsOptional()
  @IsString()
  correctiveAction?: string;

  @IsOptional()
  @IsString()
  immediateAction?: string;
}

export class CreateWorkerInsuranceDto {
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsString()
  @MaxLength(255)
  workerName!: string;

  @IsOptional()
  @IsString()
  workerId?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsEnum(InsuranceType)
  insuranceType!: InsuranceType;

  @IsString()
  policyNumber!: string;

  @IsString()
  insurerName!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  expiryDate!: string;

  @IsOptional()
  coverageAmount?: string;
}
