import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Vendor } from './Vendor';
import { Project } from './Project';

@Entity('vendor_ratings')
export class VendorRating {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'vendor_id', type: 'uuid' })
  vendorId!: string;

  @Column({ name: 'project_id', type: 'uuid', nullable: true })
  projectId!: string | null;

  @Column({ name: 'quality_score', type: 'int' })
  qualityScore!: number;

  @Column({ name: 'delivery_score', type: 'int' })
  deliveryScore!: number;

  @Column({ name: 'pricing_score', type: 'int' })
  pricingScore!: number;

  @Column({ name: 'overall_score', type: 'decimal', precision: 5, scale: 2 })
  overallScore!: string;

  @Column({ type: 'text', nullable: true })
  comments!: string | null;

  @Column({ name: 'rated_by', type: 'uuid', nullable: true })
  ratedBy!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => Vendor, (v) => v.ratings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendor_id' })
  vendor!: Vendor;

  @ManyToOne(() => Project, { nullable: true })
  @JoinColumn({ name: 'project_id' })
  project!: Project | null;
}
