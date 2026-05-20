import { AppDataSource } from '../config/database';
import { ReraCompliance, ReraRegistrationStatus } from '../entities/ReraCompliance';
import { ComplianceMilestone, MilestoneStatus } from '../entities/ComplianceMilestone';
import { LandRecord } from '../entities/LandRecord';
import { ApprovalRecord, ApprovalType } from '../entities/ApprovalRecord';
import {
  UpsertReraDto, CreateMilestoneDto, UpdateMilestoneDto,
  UpsertLandRecordDto, UpsertApprovalDto,
} from '../dto/compliance.dto';
import { AppError } from '../middleware/errorHandler';

const reraRepo = AppDataSource.getRepository(ReraCompliance);
const milestoneRepo = AppDataSource.getRepository(ComplianceMilestone);
const landRepo = AppDataSource.getRepository(LandRecord);
const approvalRepo = AppDataSource.getRepository(ApprovalRecord);

export class ComplianceService {
  async getReraByProject(projectId: string) {
    return reraRepo.findOne({ where: { projectId }, relations: ['milestones'] });
  }

  async upsertRera(projectId: string, dto: UpsertReraDto, userId: string) {
    let rera = await reraRepo.findOne({ where: { projectId } });
    if (rera) {
      Object.assign(rera, dto);
    } else {
      rera = reraRepo.create({ ...dto, projectId, createdBy: userId });
    }
    return reraRepo.save(rera);
  }

  async addMilestone(projectId: string, dto: CreateMilestoneDto, userId: string) {
    const rera = await reraRepo.findOne({ where: { projectId } });
    if (!rera) throw new AppError('RERA record not found for this project', 404);

    const milestone = milestoneRepo.create({ ...dto, reraId: rera.id, createdBy: userId });
    return milestoneRepo.save(milestone);
  }

  async updateMilestone(id: string, dto: UpdateMilestoneDto) {
    const milestone = await milestoneRepo.findOne({ where: { id } });
    if (!milestone) throw new AppError('Milestone not found', 404);

    if (dto.status === MilestoneStatus.COMPLETED && !dto.completedDate) {
      dto.completedDate = new Date().toISOString().split('T')[0];
      (dto as UpdateMilestoneDto & { progress: number }).progress = 100;
    }

    Object.assign(milestone, dto);
    return milestoneRepo.save(milestone);
  }

  async getLandRecord(projectId: string) {
    return landRepo.findOne({ where: { projectId }, relations: ['approvals'] });
  }

  async upsertLandRecord(projectId: string, dto: UpsertLandRecordDto, userId: string) {
    let land = await landRepo.findOne({ where: { projectId } });
    if (land) {
      Object.assign(land, dto);
    } else {
      land = landRepo.create({ ...dto, projectId, createdBy: userId });
    }
    return landRepo.save(land);
  }

  async upsertApproval(projectId: string, dto: UpsertApprovalDto, userId: string) {
    const land = await landRepo.findOne({ where: { projectId } });
    if (!land) throw new AppError('Land record not found', 404);

    let approval = await approvalRepo.findOne({
      where: { landRecordId: land.id, approvalType: dto.approvalType },
    });

    if (approval) {
      Object.assign(approval, dto);
    } else {
      approval = approvalRepo.create({ ...dto, landRecordId: land.id, createdBy: userId });
    }

    return approvalRepo.save(approval);
  }

  async getComplianceSummary() {
    const [reraRegistered, reraPending, overdueApprovals, pendingApprovals] = await Promise.all([
      reraRepo.count({ where: { status: ReraRegistrationStatus.REGISTERED } }),
      reraRepo.count({ where: { status: ReraRegistrationStatus.PENDING } }),
      milestoneRepo.count({ where: { status: MilestoneStatus.OVERDUE } }),
      milestoneRepo.count({ where: { status: MilestoneStatus.PENDING } }),
    ]);

    return { reraRegistered, reraPending, overdueApprovals, pendingApprovals };
  }
}

export const complianceService = new ComplianceService();
