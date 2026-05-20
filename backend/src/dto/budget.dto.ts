import {
  IsString, IsEnum, IsOptional, IsNumberString,
  MaxLength, IsDateString, IsUUID,
} from 'class-validator';
import { BudgetCategory } from '../entities/BudgetItem';

export class CreateBudgetItemDto {
  @IsUUID()
  projectId!: string;

  @IsEnum(BudgetCategory)
  category!: BudgetCategory;

  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumberString()
  budgetedAmount!: string;
}

export class UpdateBudgetItemDto {
  @IsOptional()
  @IsEnum(BudgetCategory)
  category?: BudgetCategory;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumberString()
  budgetedAmount?: string;
}

export class CreateCostEntryDto {
  @IsUUID()
  budgetItemId!: string;

  @IsUUID()
  projectId!: string;

  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @IsNumberString()
  amount!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  entryDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  invoiceNumber?: string;
}
