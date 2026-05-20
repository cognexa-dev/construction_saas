import { AppDataSource } from '../config/database';
import { RevenueEntry, RevenueCategory, RevenueStatus } from '../entities/RevenueEntry';
import { TallyExportLog, TallyExportType, TallyExportStatus } from '../entities/TallyExportLog';
import { CostEntry } from '../entities/CostEntry';
import { BudgetItem } from '../entities/BudgetItem';
import { Project } from '../entities/Project';
import { Vendor } from '../entities/Vendor';
import { AppError } from '../middleware/errorHandler';
import { CreateRevenueEntryDto, UpdateRevenueEntryDto, RevenueQueryDto, TallyExportDto } from '../dto/financials.dto';

const revenueRepo = () => AppDataSource.getRepository(RevenueEntry);
const exportLogRepo = () => AppDataSource.getRepository(TallyExportLog);
const costEntryRepo = () => AppDataSource.getRepository(CostEntry);
const budgetItemRepo = () => AppDataSource.getRepository(BudgetItem);
const projectRepo = () => AppDataSource.getRepository(Project);
const vendorRepo = () => AppDataSource.getRepository(Vendor);

function generateReceiptNumber(): string {
  const year = new Date().getFullYear();
  const seq = Date.now().toString().slice(-5);
  return `RCT-${year}-${seq}`;
}

export const financialsService = {
  async getRevenueSummary(projectId?: string) {
    const qb = revenueRepo().createQueryBuilder('r');
    if (projectId) qb.where('r.project_id = :projectId', { projectId });

    const entries = await qb.getMany();

    const totalExpected = entries.reduce((s, e) => s + parseFloat(e.amount), 0);
    const totalReceived = entries
      .filter((e) => e.status === RevenueStatus.RECEIVED)
      .reduce((s, e) => s + parseFloat(e.amount), 0);
    const totalOverdue = entries
      .filter((e) => e.status === RevenueStatus.OVERDUE)
      .reduce((s, e) => s + parseFloat(e.amount), 0);
    const totalGst = entries.reduce((s, e) => s + parseFloat(e.gstAmount), 0);
    const totalTds = entries.reduce((s, e) => s + parseFloat(e.tdsAmount), 0);

    const byCategory = Object.values(RevenueCategory).map((cat) => {
      const catEntries = entries.filter((e) => e.category === cat);
      return {
        category: cat,
        count: catEntries.length,
        amount: catEntries.reduce((s, e) => s + parseFloat(e.amount), 0),
      };
    }).filter((c) => c.count > 0);

    return { totalExpected, totalReceived, totalOverdue, totalGst, totalTds, byCategory };
  },

  async getRevenueEntries(query: RevenueQueryDto) {
    const qb = revenueRepo()
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.project', 'p')
      .orderBy('r.createdAt', 'DESC');

    if (query.projectId) qb.andWhere('r.project_id = :pid', { pid: query.projectId });
    if (query.category) qb.andWhere('r.category = :cat', { cat: query.category });
    if (query.status) qb.andWhere('r.status = :status', { status: query.status });
    if (query.dateFrom) qb.andWhere('r.expected_date >= :from', { from: query.dateFrom });
    if (query.dateTo) qb.andWhere('r.expected_date <= :to', { to: query.dateTo });

    return qb.getMany();
  },

  async createRevenueEntry(dto: CreateRevenueEntryDto, userId: string) {
    const entry = revenueRepo().create({
      ...dto,
      receiptNumber: generateReceiptNumber(),
      gstAmount: (dto.gstAmount ?? 0).toString(),
      tdsAmount: (dto.tdsAmount ?? 0).toString(),
      amount: dto.amount.toString(),
      createdBy: userId,
    });
    return revenueRepo().save(entry);
  },

  async updateRevenueEntry(id: string, dto: UpdateRevenueEntryDto) {
    const entry = await revenueRepo().findOne({ where: { id } });
    if (!entry) throw new AppError('Revenue entry not found', 404);

    if (dto.category !== undefined) entry.category = dto.category;
    if (dto.status !== undefined) entry.status = dto.status;
    if (dto.paymentMode !== undefined) entry.paymentMode = dto.paymentMode ?? null;
    if (dto.description !== undefined) entry.description = dto.description;
    if (dto.customerName !== undefined) entry.customerName = dto.customerName ?? null;
    if (dto.unitNumber !== undefined) entry.unitNumber = dto.unitNumber ?? null;
    if (dto.amount !== undefined) entry.amount = String(dto.amount);
    if (dto.gstAmount !== undefined) entry.gstAmount = String(dto.gstAmount);
    if (dto.tdsAmount !== undefined) entry.tdsAmount = String(dto.tdsAmount);
    if (dto.expectedDate !== undefined) entry.expectedDate = dto.expectedDate ?? null;
    if (dto.receivedDate !== undefined) entry.receivedDate = dto.receivedDate ?? null;
    if (dto.referenceNumber !== undefined) entry.referenceNumber = dto.referenceNumber ?? null;
    if (dto.notes !== undefined) entry.notes = dto.notes ?? null;

    return revenueRepo().save(entry);
  },

  async deleteRevenueEntry(id: string) {
    const entry = await revenueRepo().findOne({ where: { id } });
    if (!entry) throw new AppError('Revenue entry not found', 404);
    await revenueRepo().remove(entry);
  },

  async getMarginAnalysis(projectId?: string) {
    const projectQb = projectRepo().createQueryBuilder('p');
    if (projectId) projectQb.where('p.id = :projectId', { projectId });
    const projects = await projectQb.getMany();

    const results = await Promise.all(
      projects.map(async (project) => {
        const budgetItems = await budgetItemRepo().find({ where: { projectId: project.id } });
        const totalBudget = budgetItems.reduce((s, b) => s + parseFloat(b.budgetedAmount), 0);
        const totalCost = budgetItems.reduce((s, b) => s + parseFloat(b.actualAmount), 0);

        const revenueEntries = await revenueRepo().find({ where: { projectId: project.id } });
        const totalRevenue = revenueEntries
          .filter((r) => r.status === RevenueStatus.RECEIVED)
          .reduce((s, r) => s + parseFloat(r.amount), 0);
        const totalExpected = revenueEntries.reduce((s, r) => s + parseFloat(r.amount), 0);

        const grossMargin = totalRevenue - totalCost;
        const grossMarginPct = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0;
        const budgetVariance = totalBudget - totalCost;
        const roiPct = totalCost > 0 ? (grossMargin / totalCost) * 100 : 0;

        return {
          projectId: project.id,
          projectCode: project.code,
          projectName: project.name,
          status: project.status,
          totalBudget,
          totalCost,
          totalRevenue,
          totalExpected,
          grossMargin,
          grossMarginPct: parseFloat(grossMarginPct.toFixed(2)),
          budgetVariance,
          roiPct: parseFloat(roiPct.toFixed(2)),
          costUtilizationPct: totalBudget > 0 ? parseFloat(((totalCost / totalBudget) * 100).toFixed(2)) : 0,
        };
      })
    );

    const aggregate = {
      totalBudget: results.reduce((s, r) => s + r.totalBudget, 0),
      totalCost: results.reduce((s, r) => s + r.totalCost, 0),
      totalRevenue: results.reduce((s, r) => s + r.totalRevenue, 0),
      totalExpected: results.reduce((s, r) => s + r.totalExpected, 0),
      grossMargin: results.reduce((s, r) => s + r.grossMargin, 0),
    };

    return { projects: results, aggregate };
  },

  async exportTally(dto: TallyExportDto, userId: string): Promise<{ csv: string; fileName: string; rowCount: number }> {
    let csv = '';
    let rowCount = 0;
    const fileName = `tally_${dto.exportType}_${new Date().toISOString().slice(0, 10)}.csv`;

    try {
      if (dto.exportType === TallyExportType.REVENUE_ENTRIES) {
        const entries = await financialsService.getRevenueEntries({
          projectId: dto.projectId,
          dateFrom: dto.dateFrom,
          dateTo: dto.dateTo,
        });
        const headers = ['Receipt No', 'Date', 'Project', 'Category', 'Customer', 'Unit', 'Description', 'Amount', 'GST', 'TDS', 'Net Amount', 'Payment Mode', 'Status', 'Reference'];
        const rows = entries.map((e) => [
          e.receiptNumber,
          e.receivedDate || e.expectedDate || '',
          e.project?.name || '',
          e.category,
          e.customerName || '',
          e.unitNumber || '',
          `"${(e.description || '').replace(/"/g, '""')}"`,
          parseFloat(e.amount).toFixed(2),
          parseFloat(e.gstAmount).toFixed(2),
          parseFloat(e.tdsAmount).toFixed(2),
          e.netAmount.toFixed(2),
          e.paymentMode || '',
          e.status,
          e.referenceNumber || '',
        ]);
        csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        rowCount = entries.length;
      } else if (dto.exportType === TallyExportType.COST_ENTRIES) {
        const qb = costEntryRepo()
          .createQueryBuilder('c')
          .leftJoinAndSelect('c.budgetItem', 'b')
          .leftJoinAndSelect('c.project', 'p')
          .leftJoinAndSelect('c.vendor', 'v')
          .orderBy('c.entryDate', 'DESC');

        if (dto.projectId) qb.where('c.project_id = :pid', { pid: dto.projectId });
        if (dto.dateFrom) qb.andWhere('c.entry_date >= :from', { from: dto.dateFrom });
        if (dto.dateTo) qb.andWhere('c.entry_date <= :to', { to: dto.dateTo });

        const entries = await qb.getMany();
        const headers = ['Date', 'Project', 'Budget Category', 'Vendor', 'Description', 'Amount', 'Invoice No'];
        const rows = entries.map((e) => [
          e.entryDate,
          e.project?.name || '',
          e.budgetItem?.category || '',
          e.vendor?.name || '',
          `"${(e.description || '').replace(/"/g, '""')}"`,
          parseFloat(e.amount).toFixed(2),
          e.invoiceNumber || '',
        ]);
        csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        rowCount = entries.length;
      } else if (dto.exportType === TallyExportType.VENDORS) {
        const vendors = await vendorRepo().find({ order: { name: 'ASC' } });
        const headers = ['Code', 'Name', 'Category', 'Contact Person', 'Phone', 'Email', 'GST Number', 'PAN', 'Performance Score', 'Status'];
        const rows = vendors.map((v) => [
          v.code,
          `"${v.name.replace(/"/g, '""')}"`,
          v.category,
          v.contactPerson || '',
          v.phone || '',
          v.email || '',
          v.gstNumber || '',
          v.panNumber || '',
          v.performanceScore?.toString() || '',
          v.status,
        ]);
        csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        rowCount = vendors.length;
      } else {
        const revResult = await financialsService.exportTally({ ...dto, exportType: TallyExportType.REVENUE_ENTRIES }, userId);
        const costResult = await financialsService.exportTally({ ...dto, exportType: TallyExportType.COST_ENTRIES }, userId);
        csv = `=== REVENUE ENTRIES ===\n${revResult.csv}\n\n=== COST ENTRIES ===\n${costResult.csv}`;
        rowCount = revResult.rowCount + costResult.rowCount;
      }

      await exportLogRepo().save(exportLogRepo().create({
        exportType: dto.exportType,
        status: TallyExportStatus.SUCCESS,
        projectId: dto.projectId || null,
        dateFrom: dto.dateFrom || null,
        dateTo: dto.dateTo || null,
        rowCount,
        fileName,
        exportedBy: userId,
      }));

      return { csv, fileName, rowCount };
    } catch (err) {
      await exportLogRepo().save(exportLogRepo().create({
        exportType: dto.exportType,
        status: TallyExportStatus.FAILED,
        projectId: dto.projectId || null,
        dateFrom: dto.dateFrom || null,
        dateTo: dto.dateTo || null,
        rowCount: 0,
        errorMessage: (err as Error).message,
        exportedBy: userId,
      }));
      throw err;
    }
  },

  async getExportLogs() {
    return exportLogRepo().find({ order: { createdAt: 'DESC' }, take: 50 });
  },

  async getFinancialsDashboard(projectId?: string) {
    const [marginData, revSummary] = await Promise.all([
      financialsService.getMarginAnalysis(projectId),
      financialsService.getRevenueSummary(projectId),
    ]);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentRevenue = await revenueRepo()
      .createQueryBuilder('r')
      .select("TO_CHAR(r.received_date, 'YYYY-MM')", 'month')
      .addSelect('SUM(r.amount)', 'amount')
      .where('r.received_date >= :since', { since: sixMonthsAgo.toISOString().slice(0, 10) })
      .andWhere('r.status = :status', { status: RevenueStatus.RECEIVED })
      .groupBy("TO_CHAR(r.received_date, 'YYYY-MM')")
      .orderBy("TO_CHAR(r.received_date, 'YYYY-MM')", 'ASC')
      .getRawMany();

    return {
      summary: revSummary,
      margin: marginData.aggregate,
      projects: marginData.projects,
      monthlyRevenue: recentRevenue.map((r) => ({
        month: r.month,
        amount: parseFloat(r.amount) || 0,
      })),
    };
  },
};
