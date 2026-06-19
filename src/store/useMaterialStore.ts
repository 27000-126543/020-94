import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Material,
  UsageRecord,
  ProcessRecord,
  ProcessType,
  MaterialCategory,
  BarcodeInfo,
  BatchSummary,
} from '@/types';
import {
  mockMaterials,
  mockUsageRecords,
  mockProcessRecords,
  mockBarcodeLibrary,
} from '@/mock/data';
import { generateId, getStatusByExpiryDate } from '@/utils/status';
import { getToday } from '@/utils/date';

interface ProcessFilter {
  month?: string;
  type?: ProcessType | 'all';
  handler?: string;
}

interface MaterialState {
  materials: Material[];
  usageRecords: UsageRecord[];
  processRecords: ProcessRecord[];
  barcodeLibrary: BarcodeInfo[];

  addMaterial: (material: Omit<Material, 'id' | 'status' | 'inDate'>) => void;
  updateMaterial: (id: string, updates: Partial<Material>) => void;
  deleteMaterial: (id: string) => void;

  addUsageRecord: (record: Omit<UsageRecord, 'id'>) => void;
  addProcessRecord: (record: Omit<ProcessRecord, 'id' | 'date'>) => void;

  addBarcodeInfo: (info: BarcodeInfo) => void;
  getBarcodeInfo: (barcode: string) => BarcodeInfo | undefined;

  getMaterialById: (id: string) => Material | undefined;
  getUsageRecordsByMaterialId: (materialId: string) => UsageRecord[];
  getProcessRecordsByMaterialId: (materialId: string) => ProcessRecord[];

  getStats: () => {
    total: number;
    normal: number;
    warning90: number;
    warning30: number;
    warning7: number;
    expired: number;
  };

  filterMaterials: (filters: {
    status?: string;
    category?: MaterialCategory;
    keyword?: string;
  }) => Material[];

  filterProcessRecords: (filters: ProcessFilter) => ProcessRecord[];
  exportProcessRecords: (filters: ProcessFilter) => string;

  getBatchSummaries: () => BatchSummary[];
  getBatchSummary: (name: string, batchNo: string) => BatchSummary | undefined;

  getAllHandlers: () => string[];

  refreshStatuses: () => void;
}

export const useMaterialStore = create<MaterialState>()(
  persist(
    (set, get) => ({
      materials: mockMaterials,
      usageRecords: mockUsageRecords,
      processRecords: mockProcessRecords,
      barcodeLibrary: mockBarcodeLibrary,

      addMaterial: (material) =>
        set((state) => {
          const newMaterial: Material = {
            ...material,
            id: generateId(),
            status: getStatusByExpiryDate(material.expiryDate),
            inDate: getToday(),
          };
          return { materials: [newMaterial, ...state.materials] };
        }),

      updateMaterial: (id, updates) =>
        set((state) => ({
          materials: state.materials.map((m) =>
            m.id === id
              ? {
                  ...m,
                  ...updates,
                  status: updates.expiryDate
                    ? getStatusByExpiryDate(updates.expiryDate)
                    : m.status,
                }
              : m
          ),
        })),

      deleteMaterial: (id) =>
        set((state) => ({
          materials: state.materials.filter((m) => m.id !== id),
        })),

      addUsageRecord: (record) =>
        set((state) => {
          const newRecord: UsageRecord = {
            ...record,
            id: generateId(),
          };
          const updatedMaterials = state.materials.map((m) =>
            m.id === record.materialId
              ? { ...m, quantity: Math.max(0, m.quantity - record.quantity) }
              : m
          );
          return {
            usageRecords: [newRecord, ...state.usageRecords],
            materials: updatedMaterials,
          };
        }),

      addProcessRecord: (record) =>
        set((state) => {
          const newRecord: ProcessRecord = {
            ...record,
            id: generateId(),
            date: getToday(),
          };
          return {
            processRecords: [newRecord, ...state.processRecords],
          };
        }),

      addBarcodeInfo: (info) =>
        set((state) => {
          const exists = state.barcodeLibrary.find((b) => b.barcode === info.barcode);
          if (exists) {
            return {
              barcodeLibrary: state.barcodeLibrary.map((b) =>
                b.barcode === info.barcode ? info : b
              ),
            };
          }
          return { barcodeLibrary: [...state.barcodeLibrary, info] };
        }),

      getBarcodeInfo: (barcode) => {
        return get().barcodeLibrary.find((b) => b.barcode === barcode);
      },

      getMaterialById: (id) => {
        return get().materials.find((m) => m.id === id);
      },

      getUsageRecordsByMaterialId: (materialId) => {
        return get()
          .usageRecords.filter((r) => r.materialId === materialId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      },

      getProcessRecordsByMaterialId: (materialId) => {
        return get()
          .processRecords.filter((r) => r.materialId === materialId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      },

      getStats: () => {
        const materials = get().materials;
        const stats = {
          total: materials.length,
          normal: 0,
          warning90: 0,
          warning30: 0,
          warning7: 0,
          expired: 0,
        };
        materials.forEach((m) => {
          stats[m.status]++;
        });
        return stats;
      },

      filterMaterials: ({ status, category, keyword }) => {
        let result = [...get().materials];

        if (status && status !== 'all') {
          result = result.filter((m) => m.status === status);
        }

        if (category) {
          result = result.filter((m) => m.category === category);
        }

        if (keyword) {
          const kw = keyword.toLowerCase();
          result = result.filter(
            (m) =>
              m.name.toLowerCase().includes(kw) ||
              m.batchNo.toLowerCase().includes(kw) ||
              m.specification.toLowerCase().includes(kw)
          );
        }

        result.sort((a, b) => {
          const daysA = new Date(a.expiryDate).getTime() - new Date().getTime();
          const daysB = new Date(b.expiryDate).getTime() - new Date().getTime();
          return daysA - daysB;
        });

        return result;
      },

      filterProcessRecords: ({ month, type, handler }) => {
        let result = [...get().processRecords];

        if (month) {
          result = result.filter((r) => r.date.startsWith(month));
        }

        if (type && type !== 'all') {
          result = result.filter((r) => r.type === type);
        }

        if (handler && handler.trim()) {
          result = result.filter((r) =>
            r.handler.toLowerCase().includes(handler.toLowerCase())
          );
        }

        result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return result;
      },

      exportProcessRecords: ({ month, type, handler }) => {
        const records = get().filterProcessRecords({ month, type, handler });
        const typeMap: Record<string, string> = {
          priorityUse: '优先使用',
          returnExchange: '退换联系',
          scrap: '报废登记',
        };

        let csv = '\uFEFF处理日期,处理方式,材料名称,批号,规格,经办人,备注\n';
        records.forEach((r) => {
          const material = get().getMaterialById(r.materialId);
          csv += `${r.date},${typeMap[r.type] || r.type},${
            material?.name || '已删除'
          },${material?.batchNo || ''},${material?.specification || ''},${r.handler},"${
            r.remark || ''
          }"\n`;
        });
        return csv;
      },

      getBatchSummaries: () => {
        const materials = get().materials;
        const batchMap = new Map<string, BatchSummary>();

        materials.forEach((m) => {
          const key = `${m.name}__${m.batchNo}`;
          if (!batchMap.has(key)) {
            batchMap.set(key, {
              name: m.name,
              category: m.category,
              batchNo: m.batchNo,
              specification: m.specification,
              expiryDate: m.expiryDate,
              locations: [],
              totalQuantity: 0,
              unit: m.unit,
              recentUsage: [],
            });
          }
          const batch = batchMap.get(key)!;
          batch.locations.push({
            location: m.location,
            quantity: m.quantity,
            materialId: m.id,
          });
          batch.totalQuantity += m.quantity;
          if (new Date(m.expiryDate) < new Date(batch.expiryDate)) {
            batch.expiryDate = m.expiryDate;
          }
        });

        const result = Array.from(batchMap.values());
        result.forEach((batch) => {
          const allMaterialIds = batch.locations.map((l) => l.materialId);
          const allUsages: UsageRecord[] = [];
          allMaterialIds.forEach((mid) => {
            allUsages.push(...get().getUsageRecordsByMaterialId(mid));
          });
          allUsages.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          batch.recentUsage = allUsages.slice(0, 5);
        });

        result.sort((a, b) => {
          const daysA =
            new Date(a.expiryDate).getTime() - new Date().getTime();
          const daysB =
            new Date(b.expiryDate).getTime() - new Date().getTime();
          return daysA - daysB;
        });

        return result;
      },

      getBatchSummary: (name, batchNo) => {
        return get()
          .getBatchSummaries()
          .find((b) => b.name === name && b.batchNo === batchNo);
      },

      getAllHandlers: () => {
        const handlers = new Set<string>();
        get().processRecords.forEach((r) => handlers.add(r.handler));
        get().materials.forEach((m) => handlers.add(m.handler));
        return Array.from(handlers);
      },

      refreshStatuses: () =>
        set((state) => ({
          materials: state.materials.map((m) => ({
            ...m,
            status: getStatusByExpiryDate(m.expiryDate),
          })),
        })),
    }),
    {
      name: 'dental-material-storage',
    }
  )
);
