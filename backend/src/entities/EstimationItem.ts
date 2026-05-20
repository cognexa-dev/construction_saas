import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { ProjectEstimation } from './ProjectEstimation';

export enum EstimationCategory {
  LAND = 'land',
  CONSTRUCTION = 'construction',
  LABOUR = 'labour',
  PROFESSIONAL_FEES = 'professional_fees',
  APPROVALS = 'approvals',
  FINANCE = 'finance',
  MARKETING = 'marketing',
  OVERHEADS = 'overheads',
  OTHER = 'other',
}

@Entity('estimation_items')
export class EstimationItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'estimation_id', type: 'uuid' })
  estimationId!: string;

  @Column({ type: 'enum', enum: EstimationCategory, default: EstimationCategory.CONSTRUCTION })
  category!: EstimationCategory;

  @Column({ type: 'varchar', length: 255 })
  description!: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  amount!: string;

  @Column({ type: 'decimal', precision: 12, scale: 3, nullable: true })
  quantity!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  unit!: string | null;

  @Column({ name: 'rate_per_unit', type: 'decimal', precision: 12, scale: 2, nullable: true })
  ratePerUnit!: string | null;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => ProjectEstimation, (e) => e.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'estimation_id' })
  estimation!: ProjectEstimation;
}
