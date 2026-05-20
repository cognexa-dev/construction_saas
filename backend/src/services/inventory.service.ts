import { AppDataSource } from '../config/database';
import { InventoryItem } from '../entities/InventoryItem';
import { StockTransaction, TransactionType } from '../entities/StockTransaction';
import { PurchaseRequisition, PRStatus } from '../entities/PurchaseRequisition';
import { PRLineItem } from '../entities/PRLineItem';
import {
  CreateInventoryItemDto, UpdateInventoryItemDto,
  CreateStockTransactionDto, CreatePurchaseRequisitionDto, UpdatePRStatusDto,
} from '../dto/inventory.dto';
import { AppError } from '../middleware/errorHandler';
import { ItemCategory } from '../entities/InventoryItem';

const itemRepo = AppDataSource.getRepository(InventoryItem);
const txRepo = AppDataSource.getRepository(StockTransaction);
const prRepo = AppDataSource.getRepository(PurchaseRequisition);

function generateSku(category: ItemCategory, name: string): string {
  const prefix = category.slice(0, 3).toUpperCase();
  const suffix = name.slice(0, 4).toUpperCase().replace(/\s/g, '');
  return `${prefix}-${suffix}-${Date.now().toString().slice(-4)}`;
}

function generatePRNumber(): string {
  return `PR-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;
}

export class InventoryService {
  async getAllItems(page = 1, limit = 50, search?: string, category?: string, lowStock?: boolean) {
    const query = itemRepo.createQueryBuilder('i').where('i.isActive = true');
    if (search) {
      query.andWhere('(LOWER(i.name) LIKE :s OR LOWER(i.sku) LIKE :s)', {
        s: `%${search.toLowerCase()}%`,
      });
    }
    if (category) query.andWhere('i.category = :category', { category });
    if (lowStock) query.andWhere('CAST(i.currentStock AS DECIMAL) <= CAST(i.minimumStock AS DECIMAL)');

    return query
      .orderBy('i.category', 'ASC')
      .addOrderBy('i.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
  }

  async getItemById(id: string) {
    const item = await itemRepo.findOne({ where: { id } });
    if (!item) throw new AppError('Inventory item not found', 404);
    return item;
  }

  async createItem(dto: CreateInventoryItemDto, createdBy: string) {
    const sku = generateSku(dto.category, dto.name);
    const item = itemRepo.create({ ...dto, sku, createdBy });
    return itemRepo.save(item);
  }

  async updateItem(id: string, dto: UpdateInventoryItemDto) {
    const item = await itemRepo.findOne({ where: { id } });
    if (!item) throw new AppError('Item not found', 404);
    Object.assign(item, dto);
    return itemRepo.save(item);
  }

  async recordTransaction(dto: CreateStockTransactionDto, createdBy: string) {
    const item = await itemRepo.findOne({ where: { id: dto.inventoryItemId } });
    if (!item) throw new AppError('Inventory item not found', 404);

    const qty = parseFloat(dto.quantity);
    const unitPrice = dto.unitPrice ? parseFloat(dto.unitPrice) : parseFloat(item.unitPrice);
    const totalValue = qty * unitPrice;

    const tx = txRepo.create({
      ...dto,
      unitPrice: String(unitPrice),
      totalValue: String(totalValue),
      createdBy,
    });
    await txRepo.save(tx);

    if (dto.transactionType === TransactionType.INWARD || dto.transactionType === TransactionType.RETURN) {
      item.currentStock = String(parseFloat(item.currentStock) + qty);
    } else if (dto.transactionType === TransactionType.OUTWARD) {
      if (parseFloat(item.currentStock) < qty) {
        throw new AppError(`Insufficient stock. Available: ${item.currentStock} ${item.unit}`, 400);
      }
      item.currentStock = String(parseFloat(item.currentStock) - qty);
    } else {
      item.currentStock = String(qty);
    }

    await itemRepo.save(item);
    return tx;
  }

  async getTransactionHistory(itemId: string) {
    return txRepo.find({
      where: { inventoryItemId: itemId },
      relations: ['project'],
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async createPR(dto: CreatePurchaseRequisitionDto, createdBy: string) {
    const prNumber = generatePRNumber();

    let totalAmount = 0;
    const lineItems = dto.lineItems.map((li) => {
      const total = parseFloat(li.quantity) * parseFloat(li.unitPrice);
      totalAmount += total;
      return {
        inventoryItemId: li.inventoryItemId,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        totalPrice: String(total),
        remarks: li.remarks ?? null,
      };
    });

    const pr = prRepo.create({
      prNumber,
      projectId: dto.projectId,
      vendorId: dto.vendorId ?? null,
      requiredBy: dto.requiredBy ?? null,
      notes: dto.notes ?? null,
      totalAmount: String(totalAmount),
      createdBy,
      lineItems: lineItems as PRLineItem[],
    });

    return prRepo.save(pr);
  }

  async getPRsByProject(projectId: string) {
    return prRepo.find({
      where: { projectId },
      relations: ['vendor', 'lineItems', 'lineItems.inventoryItem'],
      order: { createdAt: 'DESC' },
    });
  }

  async getPRById(id: string) {
    const pr = await prRepo.findOne({
      where: { id },
      relations: ['vendor', 'lineItems', 'lineItems.inventoryItem', 'project'],
    });
    if (!pr) throw new AppError('Purchase requisition not found', 404);
    return pr;
  }

  async updatePRStatus(id: string, dto: UpdatePRStatusDto, userId: string) {
    const pr = await prRepo.findOne({ where: { id } });
    if (!pr) throw new AppError('PR not found', 404);

    if (dto.vendorId) pr.vendorId = dto.vendorId;
    pr.status = dto.status;
    if (dto.status === PRStatus.APPROVED) {
      pr.approvedBy = userId;
      pr.approvedAt = new Date();
    }

    return prRepo.save(pr);
  }

  async getLowStockAlerts() {
    return itemRepo
      .createQueryBuilder('i')
      .where('i.isActive = true')
      .andWhere('CAST(i.currentStock AS DECIMAL) <= CAST(i.minimumStock AS DECIMAL)')
      .getMany();
  }
}

export const inventoryService = new InventoryService();
