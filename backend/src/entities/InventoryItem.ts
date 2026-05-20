import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToMany, Index,
} from 'typeorm';
import { StockTransaction } from './StockTransaction';
import { PRLineItem } from './PRLineItem';

export enum ItemUnit {
  KG = 'kg',
  TONS = 'tons',
  BAGS = 'bags',
  NOS = 'nos',
  SQFT = 'sqft',
  RFT = 'rft',
  LITERS = 'liters',
  CUBIC_METER = 'cubic_meter',
  METERS = 'meters',
}

export enum ItemCategory {
  CEMENT = 'cement',
  STEEL = 'steel',
  SAND = 'sand',
  AGGREGATE = 'aggregate',
  BRICKS = 'bricks',
  TILES = 'tiles',
  PLUMBING = 'plumbing',
  ELECTRICAL = 'electrical',
  FINISHING = 'finishing',
  PAINT = 'paint',
  WOOD = 'wood',
  GLASS = 'glass',
  OTHER = 'other',
}

@Entity('inventory_items')
export class InventoryItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50, unique: true })
  sku!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'enum', enum: ItemUnit, default: ItemUnit.NOS })
  unit!: ItemUnit;

  @Column({ type: 'enum', enum: ItemCategory, default: ItemCategory.OTHER })
  category!: ItemCategory;

  @Column({ name: 'unit_price', type: 'decimal', precision: 12, scale: 2, default: 0 })
  unitPrice!: string;

  @Column({ name: 'current_stock', type: 'decimal', precision: 12, scale: 3, default: 0 })
  currentStock!: string;

  @Column({ name: 'minimum_stock', type: 'decimal', precision: 12, scale: 3, default: 0 })
  minimumStock!: string;

  @Column({ name: 'qr_code', type: 'varchar', length: 255, nullable: true })
  qrCode!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => StockTransaction, (t) => t.inventoryItem)
  transactions!: StockTransaction[];

  @OneToMany(() => PRLineItem, (p) => p.inventoryItem)
  prLineItems!: PRLineItem[];

  get isLowStock(): boolean {
    return parseFloat(this.currentStock) <= parseFloat(this.minimumStock);
  }
}
