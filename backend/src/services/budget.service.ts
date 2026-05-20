import { AppDataSource } from '../config/database';
import { BudgetItem, BudgetStatus } from '../entities/BudgetItem';
import { CostEntry } from '../entities/CostEntry';
import { Project } from '../entities/Project';
import { CreateBudgetItemDto, UpdateBudgetItemDto, CreateCostEntryDto } from '../dto/budget.dto';
import { AppError } from '../middleware/errorHandler';

const budgetRepo = AppDataSource.getRepository(BudgetItem);
const costRepo = AppDataSource.getRepository(CostEntry);
const projectRepo = AppDataSource.getRepository(Project);

export class BudgetService {
  async getItemsByProject(projectId: string) {
    const project = await projectRepo.findOne({ where: { id: projectId } });
    if (!project) throw new AppError('Project not found', 404);

    const items = await budgetRepo.find({
      where: { projectId },
      order: { category: 'ASC', name: 'ASC' },
    });

    const summary = {
      totalBudgeted: 0,
      totalActual: 0,
      greenCount: 0,
      amberCount: 0,
      redCount: 0,
    };

    const enriched = items.map((item) => {
      const pct = item.utilizationPercent;
      const status = item.status;
      summary.totalBudgeted += parseFloat(item.budgetedAmount);
      summary.totalActual += parseFloat(item.actualAmount);
      if (status === BudgetStatus.GREEN) summary.greenCount++;
      else if (status === BudgetStatus.AMBER) summary.amberCount++;
      else summary.redCount++;
      return { ...item, utilizationPercent: pct, status };
    });

    return { items: enriched, summary };
  }

  async createItem(dto: CreateBudgetItemDto, createdBy: string) {
    const project = await projectRepo.findOne({ where: { id: dto.projectId } });
    if (!project) throw new AppError('Project not found', 404);

    const item = budgetRepo.create({ ...dto, createdBy });
    return budgetRepo.save(item);
  }

  async updateItem(id: string, dto: UpdateBudgetItemDto) {
    const item = await budgetRepo.findOne({ where: { id } });
    if (!item) throw new AppError('Budget item not found', 404);
    Object.assign(item, dto);
    return budgetRepo.save(item);
  }

  async deleteItem(id: string) {
    const item = await budgetRepo.findOne({ where: { id } });
    if (!item) throw new AppError('Budget item not found', 404);
    await budgetRepo.remove(item);
  }

  async getCostEntries(budgetItemId: string) {
    return costRepo.find({
      where: { budgetItemId },
      relations: ['vendor'],
      order: { entryDate: 'DESC' },
    });
  }

  async addCostEntry(dto: CreateCostEntryDto, createdBy: string) {
    const item = await budgetRepo.findOne({ where: { id: dto.budgetItemId } });
    if (!item) throw new AppError('Budget item not found', 404);

    const entry = costRepo.create({ ...dto, createdBy });
    const saved = await costRepo.save(entry);

    item.actualAmount = String(
      parseFloat(item.actualAmount) + parseFloat(dto.amount)
    );
    await budgetRepo.save(item);

    return saved;
  }

  async deleteCostEntry(id: string) {
    const entry = await costRepo.findOne({ where: { id }, relations: ['budgetItem'] });
    if (!entry) throw new AppError('Cost entry not found', 404);

    const item = entry.budgetItem;
    item.actualAmount = String(
      Math.max(0, parseFloat(item.actualAmount) - parseFloat(entry.amount))
    );
    await budgetRepo.save(item);
    await costRepo.remove(entry);
  }

  async getVarianceReport(projectId: string) {
    const items = await budgetRepo.find({ where: { projectId } });
    return items.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      budgetedAmount: parseFloat(item.budgetedAmount),
      actualAmount: parseFloat(item.actualAmount),
      variance: parseFloat(item.budgetedAmount) - parseFloat(item.actualAmount),
      utilizationPercent: item.utilizationPercent,
      status: item.status,
    }));
  }
}

export const budgetService = new BudgetService();
