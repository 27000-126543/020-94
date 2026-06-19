export type MaterialCategory = 'resin' | 'adhesive' | 'anesthetic' | 'rootCanal' | 'impression' | 'other';

export type MaterialStatus = 'normal' | 'warning90' | 'warning30' | 'warning7' | 'expired';

export type ProcessType = 'priorityUse' | 'returnExchange' | 'scrap';

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
  remark?: string;
}

export interface ProcessRecord {
  id: string;
  materialId: string;
  type: ProcessType;
  date: string;
  handler: string;
  remark?: string;
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
