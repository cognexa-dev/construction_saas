import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { Project } from './Project';
import { EstimationItem } from './EstimationItem';

@Entity('project_estimations')
export class ProjectEstimation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'project_id', type: 'uuid', unique: true })
  projectId!: string;

  @Column({ name: 'contingency_pct', type: 'decimal', precision: 5, scale: 2, default: 5 })
  contingencyPct!: string;

  @Column({ name: 'profit_pct', type: 'decimal', precision: 5, scale: 2, default: 20 })
  profitPct!: string;

  @Column({ name: 'gst_pct', type: 'decimal', precision: 5, scale: 2, default: 12 })
  gstPct!: string;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project!: Project;

  @OneToMany(() => EstimationItem, (item) => item.estimation, { cascade: true, eager: true })
  items!: EstimationItem[];
}
