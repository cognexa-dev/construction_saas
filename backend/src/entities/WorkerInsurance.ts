import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Project } from './Project';

export enum InsuranceType {
  ESIC = 'esic',
  WORKMEN_COMPENSATION = 'workmen_compensation',
  GROUP_ACCIDENT = 'group_accident',
  OTHER = 'other',
}

export enum InsuranceStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  EXPIRING_SOON = 'expiring_soon',
}

@Entity('worker_insurances')
export class WorkerInsurance {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'project_id', type: 'uuid', nullable: true })
  projectId!: string | null;

  @Column({ name: 'worker_name', type: 'varchar', length: 255 })
  workerName!: string;

  @Column({ name: 'worker_id', type: 'varchar', length: 50, nullable: true })
  workerId!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  role!: string | null;

  @Column({ type: 'enum', enum: InsuranceType, default: InsuranceType.WORKMEN_COMPENSATION })
  insuranceType!: InsuranceType;

  @Column({ name: 'policy_number', type: 'varchar', length: 100 })
  policyNumber!: string;

  @Column({ name: 'insurer_name', type: 'varchar', length: 255 })
  insurerName!: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate!: string;

  @Column({ name: 'expiry_date', type: 'date' })
  expiryDate!: string;

  @Column({ name: 'coverage_amount', type: 'decimal', precision: 12, scale: 2, nullable: true })
  coverageAmount!: string | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Project, { nullable: true })
  @JoinColumn({ name: 'project_id' })
  project!: Project | null;

  get status(): InsuranceStatus {
    const expiry = new Date(this.expiryDate);
    const today = new Date();
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return InsuranceStatus.EXPIRED;
    if (diffDays <= 30) return InsuranceStatus.EXPIRING_SOON;
    return InsuranceStatus.ACTIVE;
  }
}
