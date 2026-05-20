import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { BudgetItem } from './BudgetItem';
import { Project } from './Project';
import { Vendor } from './Vendor';

@Entity('cost_entries')
export class CostEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'budget_item_id', type: 'uuid' })
  budgetItemId!: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId!: string;

  @Column({ name: 'vendor_id', type: 'uuid', nullable: true })
  vendorId!: string | null;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'entry_date', type: 'date' })
  entryDate!: string;

  @Column({ name: 'invoice_number', type: 'varchar', length: 100, nullable: true })
  invoiceNumber!: string | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => BudgetItem, (b) => b.costEntries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'budget_item_id' })
  budgetItem!: BudgetItem;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project!: Project;

  @ManyToOne(() => Vendor, { nullable: true })
  @JoinColumn({ name: 'vendor_id' })
  vendor!: Vendor | null;
}
