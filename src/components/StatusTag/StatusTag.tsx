import { Tag } from 'antd';
import { MaterialStatus } from '@/types';
import { STATUS_MAP } from '@/utils/status';

interface StatusTagProps {
  status: MaterialStatus;
  showPulse?: boolean;
  className?: string;
}

export default function StatusTag({ status, showPulse = false, className }: StatusTagProps) {
  const info = STATUS_MAP[status];

  const tagClass = [
    showPulse && (status === 'warning7' || status === 'expired') ? 'animate-pulse' : '',
    className || '',
  ].filter(Boolean).join(' ');

  return (
    <Tag
      color={info.color}
      style={{
        backgroundColor: info.bgColor,
        border: 'none',
        borderRadius: 4,
        padding: '2px 10px',
        fontWeight: 500,
        position: 'relative',
      }}
      className={tagClass}
    >
      {info.label}
    </Tag>
  );
}
