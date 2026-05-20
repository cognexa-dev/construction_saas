import { AppDataSource } from '../config/database';
import { BoqItem } from '../entities/BoqItem';
import { BoqItemMaterial } from '../entities/BoqItemMaterial';
import { InventoryItem } from '../entities/InventoryItem';
import { StockTransaction, TransactionType } from '../entities/StockTransaction';
import { AppError } from '../middleware/errorHandler';
import { CreateBoqItemDto, UpdateBoqItemDto } from '../dto/boq.dto';

const repo = () => AppDataSource.getRepository(BoqItem);
const matRepo = () => AppDataSource.getRepository(BoqItemMaterial);
const invRepo = () => AppDataSource.getRepository(InventoryItem);
const txRepo = () => AppDataSource.getRepository(StockTransaction);

function toMonthKey(dateVal: string | null): string | null {
  if (!dateVal) return null;
  return String(dateVal).slice(0, 7);
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

export const boqService = {
  async getByProject(projectId: string) {
    const items = await repo().find({
      where: { projectId },
      relations: ['materials', 'materials.inventoryItem'],
      order: { category: 'ASC', workItem: 'ASC' },
    });

    const enriched = items.map((item) => ({
      ...item,
      plannedMonth: item.plannedMonth ?? null,
      progressPct: item.progressPct,
      estimatedCost: item.estimatedCost,
      actualCost: item.actualCost,
    }));

    const totalEstimatedCost = enriched.reduce((s, i) => s + i.estimatedCost, 0);
    const totalActualCost = enriched.reduce((s, i) => s + i.actualCost, 0);
    const overallProgress = enriched.length > 0
      ? parseFloat((enriched.reduce((s, i) => s + i.progressPct, 0) / enriched.length).toFixed(1))
      : 0;

    // Monthly aggregation
    const monthlyMap: Record<string, { estimatedCost: number; actualCost: number }> = {};
    for (const item of enriched) {
      const key = toMonthKey(item.plannedMonth);
      if (!key) continue;
      if (!monthlyMap[key]) monthlyMap[key] = { estimatedCost: 0, actualCost: 0 };
      monthlyMap[key].estimatedCost += item.estimatedCost;
      monthlyMap[key].actualCost += item.actualCost;
    }

    const monthlyData = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, data]) => ({ month: monthLabel(key), monthKey: key, ...data }));

    return {
      items: enriched,
      monthlyData,
      summary: { totalEstimatedCost, totalActualCost, overallProgress, itemCount: items.length },
    };
  },

  async create(projectId: string, dto: CreateBoqItemDto, userId: string) {
    const plannedMonth = dto.plannedMonth ? `${dto.plannedMonth}-01` : null;
    const item = repo().create({
      projectId,
      workItem: dto.workItem,
      category: dto.category,
      unit: dto.unit,
      estimatedQty: String(dto.estimatedQty),
      executedQty: String(dto.executedQty ?? 0),
      ratePerUnit: String(dto.ratePerUnit ?? 0),
      plannedMonth,
      remarks: dto.remarks ?? null,
      createdBy: userId,
    });
    const saved = await repo().save(item);
    return { ...saved, progressPct: saved.progressPct, estimatedCost: saved.estimatedCost, actualCost: saved.actualCost };
  },

  async update(id: string, dto: UpdateBoqItemDto, userId?: string) {
    const item = await repo().findOne({
      where: { id },
      relations: ['materials', 'materials.inventoryItem'],
    });
    if (!item) throw new AppError('BOQ item not found', 404);

    const oldExecutedQty = parseFloat(item.executedQty);

    if (dto.workItem !== undefined) item.workItem = dto.workItem;
    if (dto.category !== undefined) item.category = dto.category;
    if (dto.unit !== undefined) item.unit = dto.unit;
    if (dto.estimatedQty !== undefined) item.estimatedQty = String(dto.estimatedQty);
    if (dto.executedQty !== undefined) item.executedQty = String(dto.executedQty);
    if (dto.ratePerUnit !== undefined) item.ratePerUnit = String(dto.ratePerUnit);
    if (dto.plannedMonth !== undefined) item.plannedMonth = dto.plannedMonth ? `${dto.plannedMonth}-01` : null;
    if (dto.remarks !== undefined) item.remarks = dto.remarks ?? null;

    const saved = await repo().save(item);

    // --- Auto-consume inventory when executedQty changes ---
    const warnings: string[] = [];
    const newExecutedQty = parseFloat(saved.executedQty);
    const delta = newExecutedQty - oldExecutedQty;

    if (delta !== 0 && item.materials?.length) {
      for (const mat of item.materials) {
        const consumed = delta * parseFloat(mat.consumptionRate);
        if (consumed === 0) continue;

        const invItem = await invRepo().findOne({ where: { id: mat.inventoryItemId } });
        if (!invItem) continue;

        const txType = consumed > 0 ? TransactionType.OUTWARD : TransactionType.RETURN;
        const qty = Math.abs(consumed);
        const currentStock = parseFloat(invItem.currentStock);

        if (txType === TransactionType.OUTWARD && currentStock < qty) {
          warnings.push(
            `Low stock: ${invItem.name} — need ${qty.toFixed(3)} ${invItem.unit}, only ${currentStock.toFixed(3)} available`,
          );
        }

        // Record the transaction (allow negative stock with warning)
        const tx = txRepo().create({
          inventoryItemId: mat.inventoryItemId,
          projectId: item.projectId,
          transactionType: txType,
          quantity: String(qty),
          unitPrice: invItem.unitPrice,
          totalValue: String(qty * parseFloat(invItem.unitPrice)),
          referenceNo: `BOQ-${id}`,
          notes: `Auto: ${item.workItem} execution Δ${delta > 0 ? '+' : ''}${delta.toFixed(3)} ${item.unit}`,
          createdBy: userId ?? null,
        });
        await txRepo().save(tx);

        const newStock = txType === TransactionType.OUTWARD
          ? currentStock - qty
          : currentStock + qty;
        invItem.currentStock = String(newStock);
        await invRepo().save(invItem);
      }
    }

    return {
      item: { ...saved, progressPct: saved.progressPct, estimatedCost: saved.estimatedCost, actualCost: saved.actualCost },
      warnings,
    };
  },

  async delete(id: string) {
    const item = await repo().findOne({ where: { id } });
    if (!item) throw new AppError('BOQ item not found', 404);
    await repo().remove(item);
  },

  // --- Material link management ---

  async getMaterials(boqItemId: string) {
    const item = await repo().findOne({
      where: { id: boqItemId },
      relations: ['materials', 'materials.inventoryItem'],
    });
    if (!item) throw new AppError('BOQ item not found', 404);

    return item.materials.map((mat) => {
      const est = parseFloat(item.estimatedQty);
      const exe = parseFloat(item.executedQty);
      const rate = parseFloat(mat.consumptionRate);
      return {
        id: mat.id,
        boqItemId: mat.boqItemId,
        inventoryItemId: mat.inventoryItemId,
        consumptionRate: mat.consumptionRate,
        inventoryItem: {
          id: mat.inventoryItem.id,
          name: mat.inventoryItem.name,
          sku: mat.inventoryItem.sku,
          unit: mat.inventoryItem.unit,
          unitPrice: mat.inventoryItem.unitPrice,
          currentStock: mat.inventoryItem.currentStock,
          isLowStock: mat.inventoryItem.isLowStock,
        },
        totalNeeded: est * rate,
        totalConsumed: exe * rate,
        remaining: (est - exe) * rate,
        estimatedMaterialCost: est * rate * parseFloat(mat.inventoryItem.unitPrice),
      };
    });
  },

  async addMaterial(boqItemId: string, inventoryItemId: string, consumptionRate: number) {
    const boqItem = await repo().findOne({ where: { id: boqItemId } });
    if (!boqItem) throw new AppError('BOQ item not found', 404);

    const invItem = await invRepo().findOne({ where: { id: inventoryItemId } });
    if (!invItem) throw new AppError('Inventory item not found', 404);

    // Upsert: update rate if link already exists
    const existing = await matRepo().findOne({ where: { boqItemId, inventoryItemId } });
    if (existing) {
      existing.consumptionRate = String(consumptionRate);
      return matRepo().save(existing);
    }

    const mat = matRepo().create({
      boqItemId,
      inventoryItemId,
      consumptionRate: String(consumptionRate),
    });
    return matRepo().save(mat);
  },

  async updateMaterial(linkId: string, consumptionRate: number) {
    const mat = await matRepo().findOne({ where: { id: linkId } });
    if (!mat) throw new AppError('Material link not found', 404);
    mat.consumptionRate = String(consumptionRate);
    return matRepo().save(mat);
  },

  async removeMaterial(linkId: string) {
    const mat = await matRepo().findOne({ where: { id: linkId } });
    if (!mat) throw new AppError('Material link not found', 404);
    await matRepo().remove(mat);
  },
};
