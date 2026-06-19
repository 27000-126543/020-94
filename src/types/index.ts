export type MaterialCategory = 'resin' | 'adhesive' | 'anesthetic' | 'rootCanal' | 'impression' | 'other';

export type MaterialStatus = 'normal' | 'warning90' | 'warning30' | 'warning7' | 'expired';

export type ProcessType = 'priorityUse' | 'returnExchange' | 'scrap';

export type FollowUpStatus = 'pending' | 'contacted' | 'exchanged' | 'closed';

export interface Material {
  id: string;
  name: string;
  category: MaterialCategory;
  batchNo: string;
  specification: string;
  expiryDate: string;
  location: string;
  quantity: number;
  unit: string;
  inDate: string;
  status: MaterialStatus;
  handler: string;
  remark?: string;
}

export interface UsageRecord {
  id: string;
  materialId: string;
  date: string;
  quantity: number;
  user: string;
  department: string;
  purpose?: string;
  remark?: string;
}

export interface ProcessRecord {
  id: string;
  materialId: string;
  type: ProcessType;
  date: string;
  handler: string;
  remark: string;
  followUpStatus?: FollowUpStatus;
}

export interface CategoryOption {
  value: MaterialCategory;
  label: string;
  icon: string;
}

export interface StatusInfo {
  label: string;
  color: string;
  bgColor: string;
}

export interface BarcodeInfo {
  barcode: string;
  name: string;
  category: MaterialCategory;
  specification: string;
  unit: string;
  defaultLocation: string;
  defaultBatchNo?: string;
  lastExpiryDate?: string;
  lastInDate?: string;
  lastQuantity?: number;
}

export interface BatchSummary {
  name: string;
  category: MaterialCategory;
  batchNo: string;
  specification: string;
  expiryDate: string;
  locations: { location: string; quantity: number; materialId: string }[];
  totalQuantity: number;
  unit: string;
  recentUsage: UsageRecord[];
}

export type StocktakeStatus = 'draft' | 'completed';

export interface StocktakeRecord {
  id: string;
  materialId: string;
  name: string;
  category: MaterialCategory;
  batchNo: string;
  specification: string;
  location: string;
  systemQuantity: number;
  actualQuantity: number;
  difference: number;
  unit: string;
  handler: string;
  date: string;
  reason?: string;
  status: StocktakeStatus;
}

export type StocktakeViewMode = 'byLocation' | 'byCategory';
