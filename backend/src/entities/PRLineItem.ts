import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
} from 'typeorm';
import { PurchaseRequisition } from './PurchaseRequisition';
import { InventoryItem } from './InventoryItem';

@Entity('pr_line_items')
export class PRLineItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'pr_id', type: 'uuid' })
  prId!: string;

  @Column({ name: 'inventory_item_id', type: 'uuid' })
  inventoryItemId!: string;

  @Column({ type: 'decimal', precision: 12, scale: 3 })
  quantity!: string;

  @Column({ name: 'unit_price', type: 'decimal', precision: 12, scale: 2 })
  unitPrice!: string;

  @Column({ name: 'total_price', type: 'decimal', precision: 15, scale: 2 })
  totalPrice!: string;

  @Column({ name: 'received_quantity', type: 'decimal', precision: 12, scale: 3, default: 0 })
  receivedQuantity!: string;

  @Column({ type: 'text', nullable: true })
  remarks!: string | null;

  @ManyToOne(() => PurchaseRequisition, (pr) => pr.lineItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pr_id' })
  purchaseRequisition!: PurchaseRequisition;

  @ManyToOne(() => InventoryItem, (i) => i.prLineItems)
  @JoinColumn({ name: 'inventory_item_id' })
  inventoryItem!: InventoryItem;
}
