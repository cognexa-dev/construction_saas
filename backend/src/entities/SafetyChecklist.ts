import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToMany,
} from 'typeorm';
import { ChecklistItem } from './ChecklistItem';
import { DailyChecklistSubmission } from './DailyChecklistSubmission';

@Entity('safety_checklists')
export class SafetyChecklist {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => ChecklistItem, (i) => i.checklist, { cascade: true })
  items!: ChecklistItem[];

  @OneToMany(() => DailyChecklistSubmission, (s) => s.checklist)
  submissions!: DailyChecklistSubmission[];
}
