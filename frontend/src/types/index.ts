export enum UserRole {
  ADMIN = 'admin',
  OWNER = 'owner',
  SUPERVISOR = 'supervisor',
  CUSTOMER = 'customer',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUser extends User, AuthTokens {}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface CreateUserFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
}

export interface UpdateUserFormData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: UserRole;
  status?: UserStatus;
}

// ---- Projects ----
export enum ProjectType {
  RESIDENTIAL = 'residential',
  COMMERCIAL = 'commercial',
  MIXED = 'mixed',
}

export enum ProjectStatus {
  PLANNING = 'planning',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface Project {
  id: string;
  code: string;
  name: string;
  description: string | null;
  location: string | null;
  type: ProjectType;
  status: ProjectStatus;
  startDate: string | null;
  expectedEndDate: string | null;
  totalBudget: string;
  reraNumber: string | null;
  landArea: string | null;
  jantriRate: string | null;
  createdAt: string;
}

// ---- Budget ----
export enum BudgetCategory {
  RCC = 'rcc',
  PLUMBING = 'plumbing',
  ELECTRICAL = 'electrical',
  FINISHING = 'finishing',
  CIVIL = 'civil',
  PROCUREMENT = 'procurement',
  LABOR = 'labor',
  LAND = 'land',
  APPROVAL = 'approval',
  OTHER = 'other',
}

export enum BudgetStatus {
  GREEN = 'green',
  AMBER = 'amber',
  RED = 'red',
}

export interface BudgetItem {
  id: string;
  projectId: string;
  category: BudgetCategory;
  name: string;
  description: string | null;
  budgetedAmount: string;
  actualAmount: string;
  committedAmount: string;
  utilizationPercent: number;
  status: BudgetStatus;
  createdAt: string;
}

export interface CostEntry {
  id: string;
  budgetItemId: string;
  projectId: string;
  vendorId: string | null;
  amount: string;
  description: string | null;
  entryDate: string;
  invoiceNumber: string | null;
  vendor?: { id: string; name: string } | null;
  createdAt: string;
}

// ---- Inventory ----
export enum ItemUnit {
  KG = 'kg', TONS = 'tons', BAGS = 'bags', NOS = 'nos',
  SQFT = 'sqft', RFT = 'rft', LITERS = 'liters',
  CUBIC_METER = 'cubic_meter', METERS = 'meters',
}

export enum ItemCategory {
  CEMENT = 'cement', STEEL = 'steel', SAND = 'sand',
  AGGREGATE = 'aggregate', BRICKS = 'bricks', TILES = 'tiles',
  PLUMBING = 'plumbing', ELECTRICAL = 'electrical',
  FINISHING = 'finishing', PAINT = 'paint', WOOD = 'wood',
  GLASS = 'glass', OTHER = 'other',
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  unit: ItemUnit;
  category: ItemCategory;
  unitPrice: string;
  currentStock: string;
  minimumStock: string;
  qrCode: string | null;
  isActive: boolean;
  isLowStock: boolean;
  createdAt: string;
}

export enum TransactionType {
  INWARD = 'inward',
  OUTWARD = 'outward',
  ADJUSTMENT = 'adjustment',
  RETURN = 'return',
}

export interface StockTransaction {
  id: string;
  inventoryItemId: string;
  projectId: string | null;
  transactionType: TransactionType;
  quantity: string;
  unitPrice: string | null;
  totalValue: string | null;
  referenceNo: string | null;
  notes: string | null;
  createdAt: string;
}

export enum PRStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  ORDERED = 'ordered',
  RECEIVED = 'received',
  CANCELLED = 'cancelled',
}

export interface PRLineItem {
  id: string;
  inventoryItemId: string;
  quantity: string;
  unitPrice: string;
  totalPrice: string;
  receivedQuantity: string;
  remarks: string | null;
  inventoryItem?: InventoryItem;
}

export interface PurchaseRequisition {
  id: string;
  prNumber: string;
  projectId: string;
  vendorId: string | null;
  status: PRStatus;
  requiredBy: string | null;
  notes: string | null;
  totalAmount: string;
  approvedAt: string | null;
  lineItems?: PRLineItem[];
  vendor?: { id: string; name: string } | null;
  createdAt: string;
}

// ---- Vendors ----
export enum VendorCategory {
  MATERIAL = 'material',
  LABOR = 'labor',
  CONTRACTOR = 'contractor',
  CONSULTANT = 'consultant',
  OTHER = 'other',
}

export enum VendorStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLACKLISTED = 'blacklisted',
}

export interface Vendor {
  id: string;
  code: string;
  name: string;
  category: VendorCategory;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  gstNumber: string | null;
  panNumber: string | null;
  status: VendorStatus;
  performanceScore: string;
  createdAt: string;
}
