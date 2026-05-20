import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { Project } from './Project';
import { ApprovalRecord } from './ApprovalRecord';

@Entity('land_records')
export class LandRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'project_id', type: 'uuid', unique: true })
  projectId!: string;

  @Column({ name: 'survey_number', type: 'varchar', length: 100, nullable: true })
  surveyNumber!: string | null;

  @Column({ name: 'village', type: 'varchar', length: 100, nullable: true })
  village!: string | null;

  @Column({ name: 'taluka', type: 'varchar', length: 100, nullable: true })
  taluka!: string | null;

  @Column({ name: 'district', type: 'varchar', length: 100, nullable: true })
  district!: string | null;

  @Column({ name: 'total_area', type: 'decimal', precision: 12, scale: 3, nullable: true })
  totalArea!: string | null;

  @Column({ name: 'area_unit', type: 'varchar', length: 20, default: 'sqmt' })
  areaUnit!: string;

  @Column({ name: 'purchase_date', type: 'date', nullable: true })
  purchaseDate!: string | null;

  @Column({ name: 'purchase_price', type: 'decimal', precision: 15, scale: 2, nullable: true })
  purchasePrice!: string | null;

  @Column({ name: 'jantri_value', type: 'decimal', precision: 15, scale: 2, nullable: true })
  jantriValue!: string | null;

  @Column({ name: 'seller_name', type: 'varchar', length: 255, nullable: true })
  sellerName!: string | null;

  @Column({ name: 'na_order_number', type: 'varchar', length: 100, nullable: true })
  naOrderNumber!: string | null;

  @Column({ name: 'na_order_date', type: 'date', nullable: true })
  naOrderDate!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  documents!: Array<{ name: string; url: string; type: string }> | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project!: Project;

  @OneToMany(() => ApprovalRecord, (a) => a.landRecord, { cascade: true })
  approvals!: ApprovalRecord[];
}
