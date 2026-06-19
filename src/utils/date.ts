import dayjs from 'dayjs';

export function getRemainingDays(expiryDate: string): number {
  const today = dayjs().startOf('day');
  const expiry = dayjs(expiryDate).startOf('day');
  return expiry.diff(today, 'day');
}

export function formatDate(date: string): string {
  return dayjs(date).format('YYYY-MM-DD');
}

export function formatDateTime(date: string): string {
  return dayjs(date).format('YYYY-MM-DD HH:mm');
}

export function getToday(): string {
  return dayjs().format('YYYY-MM-DD');
}

export function isExpired(expiryDate: string): boolean {
  return getRemainingDays(expiryDate) <= 0;
}
