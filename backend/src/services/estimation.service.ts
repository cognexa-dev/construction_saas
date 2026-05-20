import { AppDataSource } from '../config/database';
import { ProjectEstimation } from '../entities/ProjectEstimation';
import { EstimationItem, EstimationCategory } from '../entities/EstimationItem';
import { BoqItem } from '../entities/BoqItem';
import { Project } from '../entities/Project';

const estimationRepo = () => AppDataSource.getRepository(ProjectEstimation);
const itemRepo = () => AppDataSource.getRepository(EstimationItem);
const boqRepo = () => AppDataSource.getRepository(BoqItem);
const projectRepo = () => AppDataSource.getRepository(Project);

function calcSummary(estimation: ProjectEstimation, boqTotal: number) {
  const items = estimation.items ?? [];

  const byCategory: Record<string, number> = {};
  for (const cat of Object.values(EstimationCategory)) byCategory[cat] = 0;
  for (const item of items) {
    byCategory[item.category] = (byCategory[item.category] || 0) + parseFloat(item.amount);
  }

  // Construction category auto-includes BOQ total if no manual items exist
  const constructionManual = byCategory[EstimationCategory.CONSTRUCTION] || 0;
  const constructionEffective = constructionManual > 0 ? constructionManual : boqTotal;

  const itemsTotal = Object.values(byCategory).reduce((s, v) => s + v, 0);
  const subtotal = itemsTotal > 0
    ? itemsTotal
    : boqTotal; // fall back to BOQ if no items at all

  const contingencyPct = parseFloat(estimation.contingencyPct) || 0;
  const profitPct = parseFloat(estimation.profitPct) || 0;
  const gstPct = parseFloat(estimation.gstPct) || 0;

  const contingency = subtotal * (contingencyPct / 100);
  const totalBeforeProfit = subtotal + contingency;
  const profit = totalBeforeProfit * (profitPct / 100);
  const totalBeforeGst = totalBeforeProfit + profit;
  const gst = totalBeforeGst * (gstPct / 100);
  const grandTotal = totalBeforeGst + gst;

  return {
    byCategory,
    boqTotal,
    constructionEffective,
    subtotal,
    contingencyPct,
    contingency,
    profitPct,
    profit,
    gstPct,
    gst,
    totalBeforeProfit,
    totalBeforeGst,
    grandTotal,
  };
}

export const estimationService = {
  async getByProject(projectId: string) {
    const project = await projectRepo().findOne({ where: { id: projectId } });
    if (!project) throw Object.assign(new Error('Project not found'), { status: 404 });

    let estimation = await estimationRepo().findOne({
      where: { projectId },
      relations: ['items'],
    });

    // Auto-create empty estimation if none exists
    if (!estimation) {
      estimation = estimationRepo().create({
        projectId,
        contingencyPct: '5',
        profitPct: '20',
        gstPct: '12',
        items: [],
      });
      await estimationRepo().save(estimation);
    }

    // Sort items by category then sortOrder
    if (estimation.items) {
      estimation.items.sort((a, b) => {
        const catOrder = Object.values(EstimationCategory).indexOf(a.category) -
          Object.values(EstimationCategory).indexOf(b.category);
        return catOrder !== 0 ? catOrder : a.sortOrder - b.sortOrder;
      });
    }

    // Fetch BOQ total for this project
    const boqItems = await boqRepo().find({ where: { projectId } });
    const boqTotal = boqItems.reduce((sum, i) => {
      return sum + (parseFloat(i.estimatedQty) || 0) * (parseFloat(i.ratePerUnit) || 0);
    }, 0);

    const summary = calcSummary(estimation, boqTotal);

    return {
      estimation,
      summary,
      project: { id: project.id, name: project.name, code: project.code, totalBudget: project.totalBudget },
    };
  },

  async updateSettings(projectId: string, data: {
    contingencyPct?: number;
    profitPct?: number;
    gstPct?: number;
    notes?: string;
  }) {
    let estimation = await estimationRepo().findOne({ where: { projectId } });
    if (!estimation) {
      estimation = estimationRepo().create({ projectId, items: [] });
    }
    if (data.contingencyPct !== undefined) estimation.contingencyPct = String(data.contingencyPct);
    if (data.profitPct !== undefined) estimation.profitPct = String(data.profitPct);
    if (data.gstPct !== undefined) estimation.gstPct = String(data.gstPct);
    if (data.notes !== undefined) estimation.notes = data.notes;
    return estimationRepo().save(estimation);
  },

  async addItem(projectId: string, data: {
    category: EstimationCategory;
    description: string;
    amount: number;
    quantity?: number;
    unit?: string;
    ratePerUnit?: number;
    notes?: string;
    sortOrder?: number;
  }, userId: string) {
    let estimation = await estimationRepo().findOne({ where: { projectId } });
    if (!estimation) {
      estimation = estimationRepo().create({ projectId, createdBy: userId, items: [] });
      await estimationRepo().save(estimation);
    }

    const amount = data.quantity && data.ratePerUnit
      ? data.quantity * data.ratePerUnit
      : data.amount;

    const item = itemRepo().create({
      estimationId: estimation.id,
      category: data.category,
      description: data.description,
      amount: String(amount),
      quantity: data.quantity != null ? String(data.quantity) : null,
      unit: data.unit ?? null,
      ratePerUnit: data.ratePerUnit != null ? String(data.ratePerUnit) : null,
      notes: data.notes ?? null,
      sortOrder: data.sortOrder ?? 0,
    });
    return itemRepo().save(item);
  },

  async updateItem(id: string, data: {
    category?: EstimationCategory;
    description?: string;
    amount?: number;
    quantity?: number;
    unit?: string;
    ratePerUnit?: number;
    notes?: string;
  }) {
    const item = await itemRepo().findOne({ where: { id } });
    if (!item) throw Object.assign(new Error('Item not found'), { status: 404 });

    if (data.category !== undefined) item.category = data.category;
    if (data.description !== undefined) item.description = data.description;
    if (data.unit !== undefined) item.unit = data.unit;
    if (data.notes !== undefined) item.notes = data.notes;

    const qty = data.quantity != null ? data.quantity : (item.quantity ? parseFloat(item.quantity) : null);
    const rate = data.ratePerUnit != null ? data.ratePerUnit : (item.ratePerUnit ? parseFloat(item.ratePerUnit) : null);

    if (qty != null) item.quantity = String(qty);
    if (rate != null) item.ratePerUnit = String(rate);

    if (qty != null && rate != null) {
      item.amount = String(qty * rate);
    } else if (data.amount !== undefined) {
      item.amount = String(data.amount);
    }

    return itemRepo().save(item);
  },

  async deleteItem(id: string) {
    const item = await itemRepo().findOne({ where: { id } });
    if (!item) throw Object.assign(new Error('Item not found'), { status: 404 });
    await itemRepo().remove(item);
  },
};
