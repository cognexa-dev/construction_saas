import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Project } from './Project';
import { User } from './User';

export enum RevenueCategory {
  UNIT_SALE = 'unit_sale',
  ADVANCE = 'advance',
  INSTALLMENT = 'installment',
  FINAL_PAYMENT = 'final_payment',
  RENTAL = 'rental',
  OTHER = 'other',
}

export enum PaymentMode {
  CASH = 'cash',
  CHEQUE = 'cheque',
  NEFT = 'neft',
  RTGS = 'rtgs',
  UPI = 'upi',
  OTHER = 'other',
}

export enum RevenueStatus {
  EXPECTED = 'expected',
  RECEIVED = 'received',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

@Entity('revenue_entries')
export class RevenueEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId!: string;

  @Column({ name: 'receipt_number', type: 'varchar', length: 50, unique: true })
  receiptNumber!: string;

  @Column({ type: 'enum', enum: RevenueCategory })
  category!: RevenueCategory;

  @Column({ type: 'enum', enum: RevenueStatus, default: RevenueStatus.EXPECTED })
  status!: RevenueStatus;

  @Column({ type: 'enum', enum: PaymentMode, nullable: true })
  paymentMode!: PaymentMode | null;

  @Column({ type: 'varchar', length: 255 })
  description!: string;

  @Column({ name: 'customer_name', type: 'varchar', length: 255, nullable: true })
  customerName!: string | null;

  @Column({ name: 'unit_number', type: 'varchar', length: 50, nullable: true })
  unitNumber!: string | null;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount!: string;

  @Column({ name: 'gst_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  gstAmount!: string;

  @Column({ name: 'tds_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  tdsAmount!: string;

  @Column({ name: 'expected_date', type: 'date', nullable: true })
  expectedDate!: string | null;

  @Column({ name: 'received_date', type: 'date', nullable: true })
  receivedDate!: string | null;

  @Column({ name: 'reference_number', type: 'varchar', length: 100, nullable: true })
  referenceNumber!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project!: Project;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator!: User | null;

  get netAmount(): number {
    return (parseFloat(this.amount) || 0) + (parseFloat(this.gstAmount) || 0) - (parseFloat(this.tdsAmount) || 0);
  }
}
