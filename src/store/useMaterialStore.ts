import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Material, UsageRecord, ProcessRecord, ProcessType, MaterialCategory } from '@/types';
import { mockMaterials, mockUsageRecords, mockProcessRecords } from '@/mock/data';
import { generateId, getStatusByExpiryDate } from '@/utils/status';
import { getToday } from '@/utils/date';

interface MaterialState {
  materials: Material[];
  usageRecords: UsageRecord[];
  processRecords: ProcessRecord[];

  addMaterial: (material: Omit<Material, 'id' | 'status' | 'inDate'>) => void;
  updateMaterial: (id: string, updates: Partial<Material>) => void;
  deleteMaterial: (id: string) => void;

  addUsageRecord: (record: Omit<UsageRecord, 'id'>) => void;

  addProcessRecord: (record: Omit<ProcessRecord, 'id' | 'date'>) => void;

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

  refreshStatuses: () => void;
}

export const useMaterialStore = create<MaterialState>()(
  persist(
    (set, get) => ({
      materials: mockMaterials,
      usageRecords: mockUsageRecords,
      processRecords: mockProcessRecords,

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
