import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { LandRecord } from './LandRecord';

export enum ApprovalType {
  NA_ORDER = 'na_order',
  NOC_FIRE = 'noc_fire',
  NOC_AIRPORT = 'noc_airport',
  NOC_ENVIRONMENT = 'noc_environment',
  BUILDING_PERMISSION = 'building_permission',
  COMMENCEMENT_CERTIFICATE = 'commencement_certificate',
  OCCUPANCY_CERTIFICATE = 'occupancy_certificate',
  COMPLETION_CERTIFICATE = 'completion_certificate',
  WATER_CONNECTION = 'water_connection',
  ELECTRICITY_CONNECTION = 'electricity_connection',
  OTHER = 'other',
}

export enum ApprovalStatus {
  NOT_APPLIED = 'not_applied',
  APPLIED = 'applied',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

@Entity('approval_records')
export class ApprovalRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'land_record_id', type: 'uuid' })
  landRecordId!: string;

  @Column({ type: 'enum', enum: ApprovalType })
  approvalType!: ApprovalType;

  @Column({ type: 'enum', enum: ApprovalStatus, default: ApprovalStatus.NOT_APPLIED })
  status!: ApprovalStatus;

  @Column({ name: 'application_number', type: 'varchar', length: 100, nullable: true })
  applicationNumber!: string | null;

  @Column({ name: 'application_date', type: 'date', nullable: true })
  applicationDate!: string | null;

  @Column({ name: 'approval_date', type: 'date', nullable: true })
  approvalDate!: string | null;

  @Column({ name: 'expiry_date', type: 'date', nullable: true })
  expiryDate!: string | null;

  @Column({ name: 'authority_name', type: 'varchar', length: 255, nullable: true })
  authorityName!: string | null;

  @Column({ type: 'text', nullable: true })
  remarks!: string | null;

  @Column({ name: 'document_url', type: 'varchar', length: 500, nullable: true })
  documentUrl!: string | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => LandRecord, (l) => l.approvals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'land_record_id' })
  landRecord!: LandRecord;
}
