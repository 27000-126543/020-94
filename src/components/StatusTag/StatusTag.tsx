import { Tag } from 'antd';
import { MaterialStatus } from '@/types';
import { STATUS_MAP } from '@/utils/status';

interface StatusTagProps {
  status: MaterialStatus;
  showPulse?: boolean;
}

export default function StatusTag({ status, showPulse = false }: StatusTagProps) {
  const info = STATUS_MAP[status];

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
      className={showPulse && (status === 'warning7' || status === 'expired') ? 'animate-pulse' : ''}
    >
      {info.label}
    </Tag>
  );
}
