import { AppDataSource } from '../config/database';
import { SafetyChecklist } from '../entities/SafetyChecklist';
import { DailyChecklistSubmission } from '../entities/DailyChecklistSubmission';
import { IncidentReport, IncidentSeverity } from '../entities/IncidentReport';
import { WorkerInsurance, InsuranceStatus } from '../entities/WorkerInsurance';
import {
  CreateChecklistDto, SubmitChecklistDto,
  CreateIncidentReportDto, UpdateIncidentReportDto,
  CreateWorkerInsuranceDto,
} from '../dto/safety.dto';
import { AppError } from '../middleware/errorHandler';

const checklistRepo = AppDataSource.getRepository(SafetyChecklist);
const submissionRepo = AppDataSource.getRepository(DailyChecklistSubmission);
const incidentRepo = AppDataSource.getRepository(IncidentReport);
const insuranceRepo = AppDataSource.getRepository(WorkerInsurance);

function generateIncidentNumber(): string {
  return `INC-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;
}

export class SafetyService {
  async getAllChecklists() {
    return checklistRepo.find({ where: { isActive: true }, relations: ['items'], order: { createdAt: 'DESC' } });
  }

  async createChecklist(dto: CreateChecklistDto, createdBy: string) {
    const checklist = checklistRepo.create({
      title: dto.title,
      description: dto.description ?? null,
      createdBy,
      items: dto.items.map((i) => ({
        question: i.question,
        sortOrder: i.sortOrder,
        isRequired: i.isRequired ?? true,
      })),
    });
    return checklistRepo.save(checklist);
  }

  async submitDailyChecklist(dto: SubmitChecklistDto, submittedBy: string) {
    const existing = await submissionRepo.findOne({
      where: { checklistId: dto.checklistId, projectId: dto.projectId, submissionDate: dto.submissionDate },
    });
    if (existing) throw new AppError('Checklist already submitted for this date', 409);

    const noCount = dto.responses.filter((r) => r.response === 'no').length;
    const overallStatus = noCount === 0 ? 'compliant' : noCount <= 2 ? 'partial' : 'non_compliant';

    const submission = submissionRepo.create({
      ...dto,
      overallStatus,
      submittedBy,
    });
    return submissionRepo.save(submission);
  }

  async getSubmissions(projectId: string, from?: string, to?: string) {
    const query = submissionRepo.createQueryBuilder('s')
      .leftJoinAndSelect('s.checklist', 'c')
      .where('s.projectId = :projectId', { projectId });
    if (from) query.andWhere('s.submissionDate >= :from', { from });
    if (to) query.andWhere('s.submissionDate <= :to', { to });
    return query.orderBy('s.submissionDate', 'DESC').getMany();
  }

  async createIncident(dto: CreateIncidentReportDto, reportedBy: string) {
    const incident = incidentRepo.create({
      ...dto,
      reportNumber: generateIncidentNumber(),
      reportedBy,
      injuredPersons: dto.injuredPersons ?? null,
      photoUrls: dto.photoUrls ?? null,
    });
    return incidentRepo.save(incident);
  }

  async getIncidents(projectId?: string, severity?: IncidentSeverity) {
    const query = incidentRepo.createQueryBuilder('i');
    if (projectId) query.where('i.projectId = :projectId', { projectId });
    if (severity) query.andWhere('i.severity = :severity', { severity });
    return query.orderBy('i.incidentDate', 'DESC').getManyAndCount();
  }

  async updateIncident(id: string, dto: UpdateIncidentReportDto) {
    const incident = await incidentRepo.findOne({ where: { id } });
    if (!incident) throw new AppError('Incident not found', 404);
    Object.assign(incident, dto);
    return incidentRepo.save(incident);
  }

  async addWorkerInsurance(dto: CreateWorkerInsuranceDto, createdBy: string) {
    const insurance = insuranceRepo.create({ ...dto, createdBy });
    return insuranceRepo.save(insurance);
  }

  async getWorkerInsurances(projectId?: string) {
    const query = insuranceRepo.createQueryBuilder('wi');
    if (projectId) query.where('wi.projectId = :projectId', { projectId });
    const records = await query.orderBy('wi.expiryDate', 'ASC').getMany();
    return records.map((r) => ({ ...r, status: r.status }));
  }

  async getExpiringInsurances(days = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);
    return insuranceRepo
      .createQueryBuilder('wi')
      .where('wi.expiryDate <= :cutoff', { cutoff: cutoff.toISOString().split('T')[0] })
      .andWhere('wi.expiryDate >= CURRENT_DATE')
      .orderBy('wi.expiryDate', 'ASC')
      .getMany();
  }

  async getSafetyDashboard(projectId?: string) {
    const incidentQuery = incidentRepo.createQueryBuilder('i');
    if (projectId) incidentQuery.where('i.projectId = :projectId', { projectId });

    const [totalIncidents, openIncidents, criticalIncidents] = await Promise.all([
      incidentQuery.getCount(),
      incidentQuery.andWhere('i.status = :s', { s: 'open' }).getCount(),
      incidentRepo.count({ where: { ...(projectId && { projectId }), severity: IncidentSeverity.CRITICAL } }),
    ]);

    const expiring = await this.getExpiringInsurances(30);
    const expired = await insuranceRepo
      .createQueryBuilder('wi')
      .where('wi.expiryDate < CURRENT_DATE')
      .getCount();

    return { totalIncidents, openIncidents, criticalIncidents, expiringInsurances: expiring.length, expiredInsurances: expired };
  }
}

export const safetyService = new SafetyService();
