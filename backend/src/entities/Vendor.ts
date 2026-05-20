import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToMany, Index,
} from 'typeorm';
import { VendorRating } from './VendorRating';
import { PurchaseRequisition } from './PurchaseRequisition';

export enum VendorCategory {
  MATERIAL = 'material',
  LABOR = 'labor',
  CONTRACTOR = 'contractor',
  CONSULTANT = 'consultant',
  OTHER = 'other',
}

export enum VendorStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLACKLISTED = 'blacklisted',
}

@Entity('vendors')
export class Vendor {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 20, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'enum', enum: VendorCategory, default: VendorCategory.MATERIAL })
  category!: VendorCategory;

  @Column({ name: 'contact_person', type: 'varchar', length: 100, nullable: true })
  contactPerson!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone!: string | null;

  @Column({ type: 'text', nullable: true })
  address!: string | null;

  @Column({ name: 'gst_number', type: 'varchar', length: 20, nullable: true })
  gstNumber!: string | null;

  @Column({ name: 'pan_number', type: 'varchar', length: 10, nullable: true })
  panNumber!: string | null;

  @Column({ type: 'enum', enum: VendorStatus, default: VendorStatus.ACTIVE })
  status!: VendorStatus;

  @Column({ name: 'performance_score', type: 'decimal', precision: 5, scale: 2, default: 0 })
  performanceScore!: string;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => VendorRating, (r) => r.vendor, { cascade: true })
  ratings!: VendorRating[];

  @OneToMany(() => PurchaseRequisition, (pr) => pr.vendor)
  purchaseRequisitions!: PurchaseRequisition[];
}
