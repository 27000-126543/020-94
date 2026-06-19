import { MaterialStatus, StatusInfo, CategoryOption, FollowUpStatus } from '@/types';
import { getRemainingDays } from './date';

export function getStatusByDays(days: number): MaterialStatus {
  if (days <= 0) return 'expired';
  if (days <= 7) return 'warning7';
  if (days <= 30) return 'warning30';
  if (days <= 90) return 'warning90';
  return 'normal';
}

export function getStatusByExpiryDate(expiryDate: string): MaterialStatus {
  const days = getRemainingDays(expiryDate);
  return getStatusByDays(days);
}

export const STATUS_MAP: Record<MaterialStatus, StatusInfo> = {
  normal: {
    label: '正常',
    color: '#52c41a',
    bgColor: 'rgba(82, 196, 26, 0.1)',
  },
  warning90: {
    label: '90天预警',
    color: '#fadb14',
    bgColor: 'rgba(250, 219, 20, 0.15)',
  },
  warning30: {
    label: '30天临期',
    color: '#fa8c16',
    bgColor: 'rgba(250, 140, 22, 0.15)',
  },
  warning7: {
    label: '7天紧急',
    color: '#ff4d4f',
    bgColor: 'rgba(255, 77, 79, 0.15)',
  },
  expired: {
    label: '已过期',
    color: '#cf1322',
    bgColor: 'rgba(207, 19, 34, 0.15)',
  },
};

export const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: 'resin', label: '树脂', icon: 'Sparkles' },
  { value: 'adhesive', label: '粘接剂', icon: 'Link' },
  { value: 'anesthetic', label: '麻药', icon: 'Syringe' },
  { value: 'rootCanal', label: '根管糊剂', icon: 'Bone' },
  { value: 'impression', label: '印模材料', icon: 'Layers' },
  { value: 'other', label: '其他', icon: 'Package' },
];

export const PROCESS_TYPE_MAP: Record<string, { label: string; color: string }> = {
  priorityUse: { label: '优先使用', color: '#1677ff' },
  returnExchange: { label: '退换联系', color: '#fa8c16' },
  scrap: { label: '报废登记', color: '#ff4d4f' },
};

export const FOLLOWUP_STATUS_MAP: Record<FollowUpStatus, { label: string; color: string }> = {
  pending: { label: '待联系', color: '#fa8c16' },
  contacted: { label: '已联系供应商', color: '#1677ff' },
  exchanged: { label: '已换货', color: '#52c41a' },
  closed: { label: '已关闭', color: '#8c8c8c' },
};

export const FOLLOWUP_STATUS_OPTIONS = [
  { value: 'pending', label: '待联系' },
  { value: 'contacted', label: '已联系供应商' },
  { value: 'exchanged', label: '已换货' },
  { value: 'closed', label: '已关闭' },
];

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function getCategoryLabel(value: string): string {
  const option = CATEGORY_OPTIONS.find((opt) => opt.value === value);
  return option?.label || '其他';
}
