import {
  IsString, IsEnum, IsOptional, IsEmail, IsInt,
  Min, Max, MaxLength, Matches,
} from 'class-validator';
import { VendorCategory, VendorStatus } from '../entities/Vendor';

export class CreateVendorDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsEnum(VendorCategory)
  category!: VendorCategory;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  contactPerson?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[6-9]\d{9}$/, { message: 'Invalid Indian phone number' })
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  gstNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  panNumber?: string;
}

export class UpdateVendorDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsEnum(VendorCategory)
  category?: VendorCategory;

  @IsOptional()
  @IsString()
  contactPerson?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  gstNumber?: string;

  @IsOptional()
  @IsString()
  panNumber?: string;

  @IsOptional()
  @IsEnum(VendorStatus)
  status?: VendorStatus;
}

export class CreateVendorRatingDto {
  @IsInt()
  @Min(1)
  @Max(5)
  qualityScore!: number;

  @IsInt()
  @Min(1)
  @Max(5)
  deliveryScore!: number;

  @IsInt()
  @Min(1)
  @Max(5)
  pricingScore!: number;

  @IsOptional()
  @IsString()
  comments?: string;

  @IsOptional()
  projectId?: string;
}
