import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { Project } from './Project';
import { ComplianceMilestone } from './ComplianceMilestone';

export enum ReraRegistrationStatus {
  PENDING = 'pending',
  REGISTERED = 'registered',
  RENEWAL_DUE = 'renewal_due',
  EXPIRED = 'expired',
  EXEMPT = 'exempt',
}

@Entity('rera_compliance')
export class ReraCompliance {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'project_id', type: 'uuid', unique: true })
  projectId!: string;

  @Column({ name: 'rera_number', type: 'varchar', length: 100, nullable: true })
  reraNumber!: string | null;

  @Column({ type: 'enum', enum: ReraRegistrationStatus, default: ReraRegistrationStatus.PENDING })
  status!: ReraRegistrationStatus;

  @Column({ name: 'registration_date', type: 'date', nullable: true })
  registrationDate!: string | null;

  @Column({ name: 'expiry_date', type: 'date', nullable: true })
  expiryDate!: string | null;

  @Column({ name: 'promoter_name', type: 'varchar', length: 255, nullable: true })
  promoterName!: string | null;

  @Column({ name: 'carpet_area', type: 'decimal', precision: 10, scale: 2, nullable: true })
  carpetArea!: string | null;

  @Column({ name: 'total_units', type: 'int', nullable: true })
  totalUnits!: number | null;

  @Column({ name: 'sold_units', type: 'int', default: 0 })
  soldUnits!: number;

  @Column({ name: 'last_quarterly_report', type: 'date', nullable: true })
  lastQuarterlyReport!: string | null;

  @Column({ name: 'next_quarterly_report', type: 'date', nullable: true })
  nextQuarterlyReport!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  documents!: Array<{ name: string; url: string; uploadedAt: string }> | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project!: Project;

  @OneToMany(() => ComplianceMilestone, (m) => m.reraCompliance, { cascade: true })
  milestones!: ComplianceMilestone[];
}
