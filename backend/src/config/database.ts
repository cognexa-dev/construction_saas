import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from './env';
import { User } from '../entities/User';
import { RefreshToken } from '../entities/RefreshToken';
import { AuditLog } from '../entities/AuditLog';
import { Project } from '../entities/Project';
import { BudgetItem } from '../entities/BudgetItem';
import { CostEntry } from '../entities/CostEntry';
import { Vendor } from '../entities/Vendor';
import { VendorRating } from '../entities/VendorRating';
import { InventoryItem } from '../entities/InventoryItem';
import { StockTransaction } from '../entities/StockTransaction';
import { PurchaseRequisition } from '../entities/PurchaseRequisition';
import { PRLineItem } from '../entities/PRLineItem';
import { SafetyChecklist } from '../entities/SafetyChecklist';
import { ChecklistItem } from '../entities/ChecklistItem';
import { DailyChecklistSubmission } from '../entities/DailyChecklistSubmission';
import { IncidentReport } from '../entities/IncidentReport';
import { WorkerInsurance } from '../entities/WorkerInsurance';
import { ReraCompliance } from '../entities/ReraCompliance';
import { ComplianceMilestone } from '../entities/ComplianceMilestone';
import { LandRecord } from '../entities/LandRecord';
import { ApprovalRecord } from '../entities/ApprovalRecord';
import { SyncQueue } from '../entities/SyncQueue';
import { RevenueEntry } from '../entities/RevenueEntry';
import { TallyExportLog } from '../entities/TallyExportLog';
import { BoqItem } from '../entities/BoqItem';
import { BoqItemMaterial } from '../entities/BoqItemMaterial';
import { ProjectEstimation } from '../entities/ProjectEstimation';
import { EstimationItem } from '../entities/EstimationItem';

const dbUrl = process.env.DATABASE_URL;

export const AppDataSource = new DataSource({
  type: 'postgres',
  ...(dbUrl
    ? { url: dbUrl }
    : { host: env.db.host, port: env.db.port, database: env.db.name, username: env.db.user, password: env.db.password }),
  ssl: (dbUrl || env.db.ssl) ? { rejectUnauthorized: false } : false,
  synchronize: env.nodeEnv === 'development',
  logging: env.nodeEnv === 'development',
  entities: [
    User, RefreshToken, AuditLog,
    Project, BudgetItem, CostEntry,
    Vendor, VendorRating,
    InventoryItem, StockTransaction,
    PurchaseRequisition, PRLineItem,
    SafetyChecklist, ChecklistItem, DailyChecklistSubmission,
    IncidentReport, WorkerInsurance,
    ReraCompliance, ComplianceMilestone,
    LandRecord, ApprovalRecord,
    SyncQueue,
    RevenueEntry, TallyExportLog,
    BoqItem, BoqItemMaterial,
    ProjectEstimation, EstimationItem,
  ],
  migrations: ['src/migrations/**/*.ts'],
  subscribers: [],
});
