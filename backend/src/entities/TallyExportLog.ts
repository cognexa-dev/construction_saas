import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from './User';

export enum TallyExportType {
  COST_ENTRIES = 'cost_entries',
  REVENUE_ENTRIES = 'revenue_entries',
  VENDORS = 'vendors',
  FULL = 'full',
}

export enum TallyExportStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
}

@Entity('tally_export_logs')
export class TallyExportLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'export_type', type: 'enum', enum: TallyExportType })
  exportType!: TallyExportType;

  @Column({ type: 'enum', enum: TallyExportStatus })
  status!: TallyExportStatus;

  @Column({ name: 'project_id', type: 'uuid', nullable: true })
  projectId!: string | null;

  @Column({ name: 'date_from', type: 'date', nullable: true })
  dateFrom!: string | null;

  @Column({ name: 'date_to', type: 'date', nullable: true })
  dateTo!: string | null;

  @Column({ name: 'row_count', type: 'int', default: 0 })
  rowCount!: number;

  @Column({ name: 'file_name', type: 'varchar', length: 255, nullable: true })
  fileName!: string | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @Column({ name: 'exported_by', type: 'uuid', nullable: true })
  exportedBy!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'exported_by' })
  exporter!: User | null;
}
