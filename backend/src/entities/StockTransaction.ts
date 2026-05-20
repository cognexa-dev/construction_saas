import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { InventoryItem } from './InventoryItem';
import { Project } from './Project';

export enum TransactionType {
  INWARD = 'inward',
  OUTWARD = 'outward',
  ADJUSTMENT = 'adjustment',
  RETURN = 'return',
}

@Entity('stock_transactions')
export class StockTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'inventory_item_id', type: 'uuid' })
  inventoryItemId!: string;

  @Column({ name: 'project_id', type: 'uuid', nullable: true })
  projectId!: string | null;

  @Column({ type: 'enum', enum: TransactionType })
  transactionType!: TransactionType;

  @Column({ type: 'decimal', precision: 12, scale: 3 })
  quantity!: string;

  @Column({ name: 'unit_price', type: 'decimal', precision: 12, scale: 2, nullable: true })
  unitPrice!: string | null;

  @Column({ name: 'total_value', type: 'decimal', precision: 15, scale: 2, nullable: true })
  totalValue!: string | null;

  @Column({ name: 'reference_no', type: 'varchar', length: 100, nullable: true })
  referenceNo!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => InventoryItem, (i) => i.transactions)
  @JoinColumn({ name: 'inventory_item_id' })
  inventoryItem!: InventoryItem;

  @ManyToOne(() => Project, { nullable: true })
  @JoinColumn({ name: 'project_id' })
  project!: Project | null;
}
