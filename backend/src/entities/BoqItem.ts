import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { Project } from './Project';
import { BoqItemMaterial } from './BoqItemMaterial';

export enum BoqCategory {
  EARTHWORK = 'earthwork',
  CONCRETE = 'concrete',
  STEEL = 'steel',
  MASONRY = 'masonry',
  PLASTERING = 'plastering',
  FLOORING = 'flooring',
  WATERPROOFING = 'waterproofing',
  FORMWORK = 'formwork',
  PAINTING = 'painting',
  DOORS_WINDOWS = 'doors_windows',
  PLUMBING = 'plumbing',
  ELECTRICAL = 'electrical',
  OTHER = 'other',
}

export enum BoqUnit {
  M3 = 'm3',
  M2 = 'm2',
  MT = 'mt',
  KG = 'kg',
  NOS = 'nos',
  RMT = 'rmt',
  BAGS = 'bags',
  SQFT = 'sqft',
  LS = 'ls',
}

@Entity('boq_items')
export class BoqItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId!: string;

  @Column({ name: 'work_item', type: 'varchar', length: 255 })
  workItem!: string;

  @Column({ type: 'enum', enum: BoqCategory, default: BoqCategory.OTHER })
  category!: BoqCategory;

  @Column({ type: 'enum', enum: BoqUnit, default: BoqUnit.M3 })
  unit!: BoqUnit;

  @Column({ name: 'estimated_qty', type: 'decimal', precision: 12, scale: 3 })
  estimatedQty!: string;

  @Column({ name: 'executed_qty', type: 'decimal', precision: 12, scale: 3, default: 0 })
  executedQty!: string;

  @Column({ name: 'rate_per_unit', type: 'decimal', precision: 12, scale: 2, default: 0 })
  ratePerUnit!: string;

  @Column({ name: 'planned_month', type: 'date', nullable: true })
  plannedMonth!: string | null;

  @Column({ type: 'text', nullable: true })
  remarks!: string | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project!: Project;

  @OneToMany(() => BoqItemMaterial, (m) => m.boqItem, { eager: true, cascade: true })
  materials!: BoqItemMaterial[];

  get progressPct(): number {
    const est = parseFloat(this.estimatedQty) || 0;
    const exe = parseFloat(this.executedQty) || 0;
    if (est === 0) return 0;
    return parseFloat(Math.min((exe / est) * 100, 100).toFixed(1));
  }

  get estimatedCost(): number {
    return (parseFloat(this.estimatedQty) || 0) * (parseFloat(this.ratePerUnit) || 0);
  }

  get actualCost(): number {
    return (parseFloat(this.executedQty) || 0) * (parseFloat(this.ratePerUnit) || 0);
  }
}
