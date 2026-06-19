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
  StocktakeRecord,
  StocktakeStatus,
  FollowUpStatus,
  LowStockItem,
  StocktakeSummaryByLocation,
  StocktakeSummaryByCategory,
  UsageSummaryByDepartment,
  UsageSummaryByUser,
} from '@/types';
import {
  mockMaterials,
  mockUsageRecords,
  mockProcessRecords,
  mockBarcodeLibrary,
  mockStocktakeRecords,
} from '@/mock/data';
import { generateId, getStatusByExpiryDate, getCategoryLabel } from '@/utils/status';
import { getToday } from '@/utils/date';

interface ProcessFilter {
  month?: string;
  type?: ProcessType | 'all';
  handler?: string;
  followUpStatus?: FollowUpStatus | 'all';
}

interface StocktakeFilter {
  location?: string;
  month?: string;
  handler?: string;
}

interface MaterialState {
  materials: Material[];
  usageRecords: UsageRecord[];
  processRecords: ProcessRecord[];
  barcodeLibrary: BarcodeInfo[];
  stocktakeRecords: StocktakeRecord[];

  addMaterial: (material: Omit<Material, 'id' | 'status' | 'inDate'>) => string;
  updateMaterial: (id: string, updates: Partial<Material>) => void;
  deleteMaterial: (id: string) => void;

  addUsageRecord: (record: Omit<UsageRecord, 'id'>) => void;

  addProcessRecord: (record: Omit<ProcessRecord, 'id' | 'date'>) => void;
  updateProcessRecord: (id: string, updates: Partial<ProcessRecord>) => void;

  addBarcodeInfo: (info: BarcodeInfo) => void;
  updateBarcodeInfo: (barcode: string, updates: Partial<BarcodeInfo>) => void;
  getBarcodeInfo: (barcode: string) => BarcodeInfo | undefined;
  deleteBarcodeInfo: (barcode: string) => void;
  updateBarcodeLastInfo: (barcode: string, data: { batchNo: string; expiryDate: string; quantity: number }) => void;

  addStocktakeRecord: (record: Omit<StocktakeRecord, 'id'>) => void;
  updateStocktakeRecord: (id: string, updates: Partial<StocktakeRecord>) => void;
  getStocktakeRecords: (filters: StocktakeFilter) => StocktakeRecord[];
  generateStocktakeByLocation: (location: string) => Omit<StocktakeRecord, 'id' | 'actualQuantity' | 'difference' | 'handler' | 'date' | 'status'>[];

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

  getAllLocations: () => string[];
  getAllHandlers: () => string[];
  getAllDepartments: () => string[];
  getAllUsers: () => string[];

  setSafeStock: (materialId: string, safeStock: number) => void;
  getLowStockItems: () => LowStockItem[];

  getStocktakeSummaryByLocation: (month?: string) => StocktakeSummaryByLocation[];
  getStocktakeSummaryByCategory: (month?: string) => StocktakeSummaryByCategory[];
  getStocktakeRecordsByMonth: (month: string) => StocktakeRecord[];
  exportStocktakeRecords: (month: string) => string;

  getUsageSummaryByDepartment: (month: string, department?: string) => UsageSummaryByDepartment[];
  getUsageSummaryByUser: (month: string, user?: string) => UsageSummaryByUser[];
  getUsageRecordsByMonth: (month: string, department?: string) => UsageRecord[];

  refreshStatuses: () => void;
}

export const useMaterialStore = create<MaterialState>()(
  persist(
    (set, get) => ({
      materials: mockMaterials,
      usageRecords: mockUsageRecords,
      processRecords: mockProcessRecords,
      barcodeLibrary: mockBarcodeLibrary,
      stocktakeRecords: mockStocktakeRecords,

      addMaterial: (material) => {
        let newId = '';
        set((state) => {
          const newMaterial: Material = {
            ...material,
            id: generateId(),
            status: getStatusByExpiryDate(material.expiryDate),
            inDate: getToday(),
          };
          newId = newMaterial.id;
          return { materials: [newMaterial, ...state.materials] };
        });
        return newId;
      },

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
          if (record.type === 'returnExchange' && !record.followUpStatus) {
            newRecord.followUpStatus = 'pending';
          }
          return {
            processRecords: [newRecord, ...state.processRecords],
          };
        }),

      updateProcessRecord: (id, updates) =>
        set((state) => ({
          processRecords: state.processRecords.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        })),

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

      updateBarcodeInfo: (barcode, updates) =>
        set((state) => ({
          barcodeLibrary: state.barcodeLibrary.map((b) =>
            b.barcode === barcode ? { ...b, ...updates } : b
          ),
        })),

      getBarcodeInfo: (barcode) => {
        return get().barcodeLibrary.find((b) => b.barcode === barcode);
      },

      deleteBarcodeInfo: (barcode) =>
        set((state) => ({
          barcodeLibrary: state.barcodeLibrary.filter((b) => b.barcode !== barcode),
        })),

      updateBarcodeLastInfo: (barcode, data) =>
        set((state) => ({
          barcodeLibrary: state.barcodeLibrary.map((b) =>
            b.barcode === barcode
              ? {
                  ...b,
                  defaultBatchNo: data.batchNo,
                  lastExpiryDate: data.expiryDate,
                  lastInDate: getToday(),
                  lastQuantity: data.quantity,
                }
              : b
          ),
        })),

      addStocktakeRecord: (record) =>
        set((state) => {
          const newRecord: StocktakeRecord = {
            ...record,
            id: generateId(),
          };
          return { stocktakeRecords: [newRecord, ...state.stocktakeRecords] };
        }),

      updateStocktakeRecord: (id, updates) =>
        set((state) => ({
          stocktakeRecords: state.stocktakeRecords.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        })),

      getStocktakeRecords: ({ location, month, handler }) => {
        let result = [...get().stocktakeRecords];
        if (location && location !== 'all') {
          result = result.filter((r) => r.location === location);
        }
        if (month) {
          result = result.filter((r) => r.date.startsWith(month));
        }
        if (handler && handler.trim()) {
          result = result.filter((r) =>
            r.handler.toLowerCase().includes(handler.toLowerCase())
          );
        }
        result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return result;
      },

      generateStocktakeByLocation: (location) => {
        const materials = get().materials.filter((m) => m.location === location);
        return materials.map((m) => ({
          materialId: m.id,
          name: m.name,
          category: m.category,
          batchNo: m.batchNo,
          specification: m.specification,
          location: m.location,
          systemQuantity: m.quantity,
          unit: m.unit,
        }));
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

      filterProcessRecords: ({ month, type, handler, followUpStatus }) => {
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

        if (followUpStatus && followUpStatus !== 'all') {
          result = result.filter((r) => r.followUpStatus === followUpStatus);
        }

        result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return result;
      },

      exportProcessRecords: ({ month, type, handler, followUpStatus }) => {
        const records = get().filterProcessRecords({ month, type, handler, followUpStatus });
        const typeMap: Record<string, string> = {
          priorityUse: '优先使用',
          returnExchange: '退换联系',
          scrap: '报废登记',
        };
        const statusMap: Record<string, string> = {
          pending: '待联系',
          contacted: '已联系供应商',
          exchanged: '已换货',
          closed: '已关闭',
        };

        let csv = '\uFEFF处理日期,处理方式,材料名称,批号,规格,经办人,备注,跟进状态\n';
        records.forEach((r) => {
          const material = get().getMaterialById(r.materialId);
          const statusLabel = r.type === 'returnExchange' ? (statusMap[r.followUpStatus || 'pending'] || '') : '';
          csv += `${r.date},${typeMap[r.type] || r.type},${
            material?.name || '已删除'
          },${material?.batchNo || ''},${material?.specification || ''},${r.handler},"${
            r.remark || ''
          }",${statusLabel}\n`;
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

      getAllLocations: () => {
        const locations = new Set<string>();
        get().materials.forEach((m) => locations.add(m.location));
        return Array.from(locations).sort();
      },

      getAllHandlers: () => {
        const handlers = new Set<string>();
        get().processRecords.forEach((r) => handlers.add(r.handler));
        get().materials.forEach((m) => handlers.add(m.handler));
        get().stocktakeRecords.forEach((r) => handlers.add(r.handler));
        return Array.from(handlers);
      },

      getAllDepartments: () => {
        const depts = new Set<string>();
        get().usageRecords.forEach((r) => {
          if (r.department) depts.add(r.department);
        });
        return Array.from(depts);
      },

      getAllUsers: () => {
        const users = new Set<string>();
        get().usageRecords.forEach((r) => {
          if (r.user) users.add(r.user);
        });
        return Array.from(users);
      },

      setSafeStock: (materialId, safeStock) =>
        set((state) => ({
          materials: state.materials.map((m) =>
            m.id === materialId ? { ...m, safeStock } : m
          ),
        })),

      getLowStockItems: () => {
        const result: LowStockItem[] = [];
        get().materials.forEach((m) => {
          if (m.safeStock !== undefined && m.quantity < m.safeStock) {
            result.push({
              id: m.id,
              name: m.name,
              category: m.category,
              batchNo: m.batchNo,
              location: m.location,
              quantity: m.quantity,
              unit: m.unit,
              safeStock: m.safeStock,
              shortfall: m.safeStock - m.quantity,
              status: m.status,
            });
          }
        });
        return result.sort((a, b) => a.shortfall - b.shortfall);
      },

      getStocktakeRecordsByMonth: (month) => {
        return get().stocktakeRecords.filter((r) => r.date.startsWith(month));
      },

      getStocktakeSummaryByLocation: (month) => {
        const records = month
          ? get().getStocktakeRecordsByMonth(month)
          : get().stocktakeRecords;
        const locationMap = new Map<string, StocktakeSummaryByLocation>();

        records.forEach((r) => {
          const existing = locationMap.get(r.location) || {
            location: r.location,
            totalItems: 0,
            surplusCount: 0,
            deficitCount: 0,
            matchedCount: 0,
            surplusQuantity: 0,
            deficitQuantity: 0,
          };
          existing.totalItems++;
          if (r.difference > 0) {
            existing.surplusCount++;
            existing.surplusQuantity += r.difference;
          } else if (r.difference < 0) {
            existing.deficitCount++;
            existing.deficitQuantity += Math.abs(r.difference);
          } else {
            existing.matchedCount++;
          }
          locationMap.set(r.location, existing);
        });

        return Array.from(locationMap.values());
      },

      getStocktakeSummaryByCategory: (month) => {
        const records = month
          ? get().getStocktakeRecordsByMonth(month)
          : get().stocktakeRecords;
        const categoryMap = new Map<string, StocktakeSummaryByCategory>();

        records.forEach((r) => {
          const existing = categoryMap.get(r.category) || {
            category: r.category,
            totalItems: 0,
            surplusCount: 0,
            deficitCount: 0,
            matchedCount: 0,
            surplusQuantity: 0,
            deficitQuantity: 0,
          };
          existing.totalItems++;
          if (r.difference > 0) {
            existing.surplusCount++;
            existing.surplusQuantity += r.difference;
          } else if (r.difference < 0) {
            existing.deficitCount++;
            existing.deficitQuantity += Math.abs(r.difference);
          } else {
            existing.matchedCount++;
          }
          categoryMap.set(r.category, existing);
        });

        return Array.from(categoryMap.values());
      },

      exportStocktakeRecords: (month) => {
        const records = get().getStocktakeRecordsByMonth(month);
        const headers = [
          '盘点日期',
          '材料名称',
          '分类',
          '批号',
          '规格',
          '存放位置',
          '账面数量',
          '实盘数量',
          '差异',
          '差异原因',
          '经办人',
        ];
        const rows = records.map((r) => [
          r.date,
          r.name,
          getCategoryLabel(r.category),
          r.batchNo,
          r.specification,
          r.location,
          `${r.systemQuantity} ${r.unit}`,
          `${r.actualQuantity} ${r.unit}`,
          r.difference > 0 ? `+${r.difference}` : String(r.difference),
          r.reason || '-',
          r.handler,
        ]);
        const csvContent = [
          headers.join(','),
          ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
        ].join('\n');
        return '\uFEFF' + csvContent;
      },

      getUsageRecordsByMonth: (month, department) => {
        let records = get().usageRecords.filter((r) => r.date.startsWith(month));
        if (department) {
          records = records.filter((r) => r.department === department);
        }
        return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      },

      getUsageSummaryByDepartment: (month, department) => {
        const records = get().getUsageRecordsByMonth(month, department);
        const deptMap = new Map<string, UsageSummaryByDepartment>();

        records.forEach((r) => {
          const material = get().materials.find((m) => m.id === r.materialId);
          const existing = deptMap.get(r.department) || {
            department: r.department,
            totalQuantity: 0,
            materials: [],
          };
          existing.totalQuantity += r.quantity;
          const matIdx = existing.materials.findIndex((m) => m.materialId === r.materialId);
          if (matIdx >= 0) {
            existing.materials[matIdx].quantity += r.quantity;
          } else if (material) {
            existing.materials.push({
              materialId: r.materialId,
              name: material.name,
              quantity: r.quantity,
              unit: material.unit,
            });
          }
          deptMap.set(r.department, existing);
        });

        return Array.from(deptMap.values()).sort(
          (a, b) => b.totalQuantity - a.totalQuantity
        );
      },

      getUsageSummaryByUser: (month, user) => {
        let records = get().usageRecords.filter((r) => r.date.startsWith(month));
        if (user) {
          records = records.filter((r) => r.user === user);
        }
        const userMap = new Map<string, UsageSummaryByUser>();

        records.forEach((r) => {
          const material = get().materials.find((m) => m.id === r.materialId);
          const key = `${r.user}__${r.department}`;
          const existing = userMap.get(key) || {
            user: r.user,
            department: r.department,
            totalQuantity: 0,
            materials: [],
          };
          existing.totalQuantity += r.quantity;
          const matIdx = existing.materials.findIndex((m) => m.materialId === r.materialId);
          if (matIdx >= 0) {
            existing.materials[matIdx].quantity += r.quantity;
          } else if (material) {
            existing.materials.push({
              materialId: r.materialId,
              name: material.name,
              quantity: r.quantity,
              unit: material.unit,
            });
          }
          userMap.set(key, existing);
        });

        return Array.from(userMap.values()).sort(
          (a, b) => b.totalQuantity - a.totalQuantity
        );
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
