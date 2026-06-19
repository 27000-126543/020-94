import { Card } from 'antd';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  onClick?: () => void;
  active?: boolean;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
  onClick,
  active = false,
}: StatCardProps) {
  return (
    <Card
      onClick={onClick}
      className={`cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
        active ? 'ring-2 ring-offset-2' : ''
      }`}
      style={{
        borderColor: active ? color : undefined,
        boxShadow: active ? `0 4px 12px ${color}20` : undefined,
      }}
      styles={{ body: { padding: 20 } }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm mb-1">{title}</p>
          <p
            className="text-3xl font-bold m-0"
            style={{ color, fontVariantNumeric: 'tabular-nums' }}
          >
            {value}
          </p>
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: bgColor }}
        >
          <Icon size={24} style={{ color }} />
        </div>
      </div>
    </Card>
  );
}
