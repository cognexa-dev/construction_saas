import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
} from 'typeorm';
import { SafetyChecklist } from './SafetyChecklist';

@Entity('checklist_items')
export class ChecklistItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'checklist_id', type: 'uuid' })
  checklistId!: string;

  @Column({ type: 'text' })
  question!: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @Column({ name: 'is_required', type: 'boolean', default: true })
  isRequired!: boolean;

  @ManyToOne(() => SafetyChecklist, (c) => c.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'checklist_id' })
  checklist!: SafetyChecklist;
}
