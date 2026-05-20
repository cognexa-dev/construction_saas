import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { BoqItem } from './BoqItem';
import { InventoryItem } from './InventoryItem';

@Entity('boq_item_materials')
@Unique(['boqItemId', 'inventoryItemId'])
export class BoqItemMaterial {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'boq_item_id', type: 'uuid' })
  boqItemId!: string;

  @Column({ name: 'inventory_item_id', type: 'uuid' })
  inventoryItemId!: string;

  // How many inventory units are consumed per 1 BOQ unit executed
  // e.g. 6 bags of cement per 1 m³ of RCC
  @Column({ name: 'consumption_rate', type: 'decimal', precision: 14, scale: 4 })
  consumptionRate!: string;

  @ManyToOne(() => BoqItem, (b) => b.materials, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'boq_item_id' })
  boqItem!: BoqItem;

  @ManyToOne(() => InventoryItem, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inventory_item_id' })
  inventoryItem!: InventoryItem;
}
