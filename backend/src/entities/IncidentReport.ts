import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Project } from './Project';

export enum IncidentSeverity {
  MINOR = 'minor',
  MODERATE = 'moderate',
  MAJOR = 'major',
  CRITICAL = 'critical',
  FATALITY = 'fatality',
}

export enum IncidentStatus {
  OPEN = 'open',
  UNDER_INVESTIGATION = 'under_investigation',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum IncidentType {
  FALL = 'fall',
  ELECTRICAL = 'electrical',
  FIRE = 'fire',
  EQUIPMENT = 'equipment',
  CHEMICAL = 'chemical',
  STRUCTURAL = 'structural',
  OTHER = 'other',
}

@Entity('incident_reports')
export class IncidentReport {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ name: 'report_number', type: 'varchar', length: 30, unique: true })
  reportNumber!: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId!: string;

  @Column({ type: 'enum', enum: IncidentType, default: IncidentType.OTHER })
  type!: IncidentType;

  @Column({ type: 'enum', enum: IncidentSeverity })
  severity!: IncidentSeverity;

  @Column({ type: 'enum', enum: IncidentStatus, default: IncidentStatus.OPEN })
  status!: IncidentStatus;

  @Column({ name: 'incident_date', type: 'date' })
  incidentDate!: string;

  @Column({ name: 'incident_time', type: 'time', nullable: true })
  incidentTime!: string | null;

  @Column({ type: 'text' })
  description!: string;

  @Column({ name: 'location_detail', type: 'varchar', length: 255, nullable: true })
  locationDetail!: string | null;

  @Column({ name: 'injured_persons', type: 'jsonb', nullable: true })
  injuredPersons!: Array<{ name: string; role: string; injury: string }> | null;

  @Column({ name: 'photo_urls', type: 'jsonb', nullable: true })
  photoUrls!: string[] | null;

  @Column({ name: 'immediate_action', type: 'text', nullable: true })
  immediateAction!: string | null;

  @Column({ name: 'root_cause', type: 'text', nullable: true })
  rootCause!: string | null;

  @Column({ name: 'corrective_action', type: 'text', nullable: true })
  correctiveAction!: string | null;

  @Column({ name: 'reported_by', type: 'uuid', nullable: true })
  reportedBy!: string | null;

  @Column({ name: 'investigated_by', type: 'uuid', nullable: true })
  investigatedBy!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project!: Project;
}
