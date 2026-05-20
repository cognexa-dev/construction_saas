import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { ReraCompliance } from './ReraCompliance';

export enum MilestoneStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
}

@Entity('compliance_milestones')
export class ComplianceMilestone {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'rera_id', type: 'uuid' })
  reraId!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate!: string | null;

  @Column({ name: 'completed_date', type: 'date', nullable: true })
  completedDate!: string | null;

  @Column({ type: 'enum', enum: MilestoneStatus, default: MilestoneStatus.PENDING })
  status!: MilestoneStatus;

  @Column({ type: 'int', default: 0 })
  progress!: number;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => ReraCompliance, (r) => r.milestones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rera_id' })
  reraCompliance!: ReraCompliance;
}
