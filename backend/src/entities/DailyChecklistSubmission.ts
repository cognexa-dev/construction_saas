import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { SafetyChecklist } from './SafetyChecklist';
import { Project } from './Project';

export enum ChecklistResponseStatus {
  YES = 'yes',
  NO = 'no',
  NA = 'na',
}

export interface ChecklistResponse {
  itemId: string;
  question: string;
  response: ChecklistResponseStatus;
  remarks?: string;
}

@Entity('daily_checklist_submissions')
export class DailyChecklistSubmission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'checklist_id', type: 'uuid' })
  checklistId!: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId!: string;

  @Column({ name: 'submission_date', type: 'date' })
  submissionDate!: string;

  @Column({ type: 'jsonb' })
  responses!: ChecklistResponse[];

  @Column({ name: 'overall_status', type: 'varchar', length: 20, default: 'compliant' })
  overallStatus!: string;

  @Column({ type: 'text', nullable: true })
  remarks!: string | null;

  @Column({ name: 'submitted_by', type: 'uuid', nullable: true })
  submittedBy!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => SafetyChecklist, (c) => c.submissions)
  @JoinColumn({ name: 'checklist_id' })
  checklist!: SafetyChecklist;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project!: Project;
}
