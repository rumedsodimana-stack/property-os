
// ────────────────────────────────────────────────────────────
// Stores / Central Inventory Types - Hotel Singularity OS
// ────────────────────────────────────────────────────────────

export type StoreCategory = 'Food' | 'Beverage' | 'Housekeeping' | 'Engineering' | 'Guest Supplies' | 'Stationery' | 'Linen' | 'Chemical' | 'Other';
export type StorageCondition = 'Ambient' | 'Chilled' | 'Frozen' | 'Dry' | 'Hazardous';
export type RequisitionStatus = 'Draft' | 'Submitted' | 'Approved' | 'Partially Issued' | 'Issued' | 'Rejected' | 'Cancelled';
export type ReceivingStatus = 'Pending' | 'Inspected' | 'Accepted' | 'Rejected' | 'Partial Accept';
export type StockTakeStatus = 'Planned' | 'In Progress' | 'Completed' | 'Variance Review' | 'Approved';

export interface StoreItem {
  id: string;
  sku: string;
  name: string;
  category: StoreCategory;
  unit: string;
  storageCondition: StorageCondition;
  location: string; // Bin/shelf location
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  reorderPoint: number;
  costPerUnit: number;
  lastReceived?: number;
  lastIssued?: number;
  avgMonthlyUsage: number;
  supplierId?: string;
  supplierName?: string;
  expiryDate?: string;
  isPerishable: boolean;
  isHalal?: boolean;
  batchNumber?: string;
}

export interface ReceivingRecord {
  id: string;
  poNumber: string;
  supplierName: string;
  supplierId: string;
  receivedDate: number;
  receivedBy: string;
  status: ReceivingStatus;
  items: {
    itemId: string;
    itemName: string;
    orderedQty: number;
    receivedQty: number;
    acceptedQty: number;
    rejectedQty: number;
    rejectionReason?: string;
    batchNumber?: string;
    expiryDate?: string;
    temperature?: number; // For cold chain items
    unitCost: number;
  }[];
  invoiceNumber?: string;
  invoiceAmount?: number;
  notes?: string;
  qualityCheckPassed: boolean;
}

export interface Requisition {
  id: string;
  requestNumber: string;
  department: string;
  requestedBy: string;
  requestDate: number;
  requiredDate: number;
  status: RequisitionStatus;
  priority: 'Low' | 'Normal' | 'Urgent';
  items: {
    itemId: string;
    itemName: string;
    requestedQty: number;
    issuedQty?: number;
    unit: string;
    costPerUnit: number;
    notes?: string;
  }[];
  approvedBy?: string;
  approvedDate?: number;
  issuedBy?: string;
  issuedDate?: number;
  totalCost: number;
  notes?: string;
  costCenter?: string;
}

export interface IssueRecord {
  id: string;
  requisitionId: string;
  department: string;
  issuedTo: string;
  issuedBy: string;
  issueDate: number;
  items: {
    itemId: string;
    itemName: string;
    issuedQty: number;
    unit: string;
    costPerUnit: number;
    batchNumber?: string;
  }[];
  totalCost: number;
  returnItems?: {
    itemId: string;
    returnedQty: number;
    returnDate: number;
    reason: string;
  }[];
  signature?: string;
}

export interface StockTakeEntry {
  id: string;
  scheduledDate: string;
  conductedDate?: string;
  status: StockTakeStatus;
  category?: StoreCategory;
  location?: string;
  conductedBy: string[];
  approvedBy?: string;
  items: {
    itemId: string;
    itemName: string;
    systemQty: number;
    physicalQty: number;
    variance: number;
    varianceValue: number;
    varianceReason?: string;
    unit: string;
    costPerUnit: number;
  }[];
  totalVarianceValue: number;
  totalItems: number;
  accuracyPercentage: number;
  notes?: string;
}
