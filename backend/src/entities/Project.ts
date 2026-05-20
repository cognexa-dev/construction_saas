import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index,
} from 'typeorm';
import { User } from './User';
import { BudgetItem } from './BudgetItem';
import { StockTransaction } from './StockTransaction';
import { PurchaseRequisition } from './PurchaseRequisition';

export enum ProjectType {
  RESIDENTIAL = 'residential',
  COMMERCIAL = 'commercial',
  MIXED = 'mixed',
}

export enum ProjectStatus {
  PLANNING = 'planning',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 20, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location!: string | null;

  @Column({ type: 'enum', enum: ProjectType, default: ProjectType.RESIDENTIAL })
  type!: ProjectType;

  @Column({ type: 'enum', enum: ProjectStatus, default: ProjectStatus.PLANNING })
  status!: ProjectStatus;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate!: string | null;

  @Column({ name: 'expected_end_date', type: 'date', nullable: true })
  expectedEndDate!: string | null;

  @Column({ name: 'actual_end_date', type: 'date', nullable: true })
  actualEndDate!: string | null;

  @Column({ name: 'total_budget', type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalBudget!: string;

  @Column({ name: 'rera_number', type: 'varchar', length: 100, nullable: true })
  reraNumber!: string | null;

  @Column({ name: 'land_area', type: 'decimal', precision: 10, scale: 2, nullable: true })
  landArea!: string | null;

  @Column({ name: 'jantri_rate', type: 'decimal', precision: 10, scale: 2, nullable: true })
  jantriRate!: string | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator!: User | null;

  @OneToMany(() => BudgetItem, (b) => b.project, { cascade: true })
  budgetItems!: BudgetItem[];

  @OneToMany(() => StockTransaction, (s) => s.project)
  stockTransactions!: StockTransaction[];

  @OneToMany(() => PurchaseRequisition, (pr) => pr.project)
  purchaseRequisitions!: PurchaseRequisition[];

  get totalBudgetNumber(): number {
    return parseFloat(this.totalBudget) || 0;
  }
}
