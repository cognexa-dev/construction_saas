import {
  IsString, IsEnum, IsOptional, IsNumberString,
  MaxLength, IsUUID,
} from 'class-validator';
import { ItemUnit, ItemCategory } from '../entities/InventoryItem';
import { TransactionType } from '../entities/StockTransaction';
import { PRStatus } from '../entities/PurchaseRequisition';

export class CreateInventoryItemDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(ItemUnit)
  unit!: ItemUnit;

  @IsEnum(ItemCategory)
  category!: ItemCategory;

  @IsNumberString()
  unitPrice!: string;

  @IsOptional()
  @IsNumberString()
  minimumStock?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  qrCode?: string;
}

export class UpdateInventoryItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ItemUnit)
  unit?: ItemUnit;

  @IsOptional()
  @IsEnum(ItemCategory)
  category?: ItemCategory;

  @IsOptional()
  @IsNumberString()
  unitPrice?: string;

  @IsOptional()
  @IsNumberString()
  minimumStock?: string;

  @IsOptional()
  @IsString()
  qrCode?: string;
}

export class CreateStockTransactionDto {
  @IsUUID()
  inventoryItemId!: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsEnum(TransactionType)
  transactionType!: TransactionType;

  @IsNumberString()
  quantity!: string;

  @IsOptional()
  @IsNumberString()
  unitPrice?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  referenceNo?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreatePRLineItemDto {
  @IsUUID()
  inventoryItemId!: string;

  @IsNumberString()
  quantity!: string;

  @IsNumberString()
  unitPrice!: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreatePurchaseRequisitionDto {
  @IsUUID()
  projectId!: string;

  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @IsOptional()
  requiredBy?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  lineItems!: CreatePRLineItemDto[];
}

export class UpdatePRStatusDto {
  @IsEnum(PRStatus)
  status!: PRStatus;

  @IsOptional()
  @IsUUID()
  vendorId?: string;
}
