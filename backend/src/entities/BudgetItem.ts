import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { Project } from './Project';
import { CostEntry } from './CostEntry';

export enum BudgetCategory {
  RCC = 'rcc',
  PLUMBING = 'plumbing',
  ELECTRICAL = 'electrical',
  FINISHING = 'finishing',
  CIVIL = 'civil',
  PROCUREMENT = 'procurement',
  LABOR = 'labor',
  LAND = 'land',
  APPROVAL = 'approval',
  OTHER = 'other',
}

export enum BudgetStatus {
  GREEN = 'green',
  AMBER = 'amber',
  RED = 'red',
}

@Entity('budget_items')
export class BudgetItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId!: string;

  @Column({ type: 'enum', enum: BudgetCategory, default: BudgetCategory.OTHER })
  category!: BudgetCategory;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'budgeted_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  budgetedAmount!: string;

  @Column({ name: 'committed_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  committedAmount!: string;

  @Column({ name: 'actual_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  actualAmount!: string;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Project, (p) => p.budgetItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project!: Project;

  @OneToMany(() => CostEntry, (c) => c.budgetItem)
  costEntries!: CostEntry[];

  get utilizationPercent(): number {
    const budgeted = parseFloat(this.budgetedAmount) || 0;
    if (budgeted === 0) return 0;
    return Math.round((parseFloat(this.actualAmount) / budgeted) * 100);
  }

  get status(): BudgetStatus {
    const pct = this.utilizationPercent;
    if (pct >= 90) return BudgetStatus.RED;
    if (pct >= 75) return BudgetStatus.AMBER;
    return BudgetStatus.GREEN;
  }
}
