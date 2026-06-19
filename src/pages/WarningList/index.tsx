import { useState, useMemo, useEffect } from 'react';
import {
  Row,
  Col,
  Input,
  Select,
  Table,
  Drawer,
  Button,
  Space,
  Tag,
  Divider,
  List,
  Form,
  Modal,
  message,
  Tabs,
  Empty,
  Segmented,
  Card,
  Descriptions,
  InputNumber,
  Alert,
} from 'antd';
import {
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  MapPin,
  Calendar,
  Package,
  User,
  FileText,
  ArrowRight,
  Trash2,
  RefreshCw,
  Send,
  TrendingDown,
  Layers,
  List as ListIcon,
  ShieldAlert,
  Settings,
} from 'lucide-react';
import StatCard from '@/components/StatCard/StatCard';
import StatusTag from '@/components/StatusTag/StatusTag';
import { useMaterialStore } from '@/store/useMaterialStore';
import { Material, MaterialStatus, ProcessType, MaterialCategory, BatchSummary, LowStockItem } from '@/types';
import { getRemainingDays, formatDate } from '@/utils/date';
import { CATEGORY_OPTIONS, STATUS_MAP, PROCESS_TYPE_MAP, FOLLOWUP_STATUS_OPTIONS, getCategoryLabel, getStatusByExpiryDate } from '@/utils/status';
import dayjs from 'dayjs';

const { Search: SearchInput } = Input;
const { Option } = Select;
const { TextArea } = Input;

interface FilterState {
  status: string;
  category: string;
  keyword: string;
}

type ViewMode = 'detail' | 'batch';

export default function WarningList() {
  const {
    materials,
    getStats,
    filterMaterials,
    getUsageRecordsByMaterialId,
    getProcessRecordsByMaterialId,
    addProcessRecord,
    refreshStatuses,
    getBatchSummaries,
    setSafeStock,
    getLowStockItems,
  } = useMaterialStore();

  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    category: '',
    keyword: '',
  });
  const [viewMode, setViewMode] = useState<ViewMode>('detail');
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<BatchSummary | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [processModalVisible, setProcessModalVisible] = useState(false);
  const [processType, setProcessType] = useState<ProcessType | null>(null);
  const [safeStockModalVisible, setSafeStockModalVisible] = useState(false);
  const [safeStockForm] = Form.useForm();
  const [form] = Form.useForm();

  const stats = getStats();
  const lowStockItems = getLowStockItems();

  const filteredMaterials = useMemo(
    () =>
      filterMaterials({
        status: filters.status,
        category: filters.category as MaterialCategory | undefined,
        keyword: filters.keyword,
      }),
    [materials, filters]
  );

  const batchSummaries = useMemo(() => {
    let result = getBatchSummaries();
    if (filters.status && filters.status !== 'all') {
      result = result.filter((b) => {
        const status = getStatusByExpiryDate(b.expiryDate);
        return status === filters.status;
      });
    }
    if (filters.category) {
      result = result.filter((b) => b.category === filters.category);
    }
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase();
      result = result.filter(
        (b) =>
          b.name.toLowerCase().includes(kw) ||
          b.batchNo.toLowerCase().includes(kw) ||
          b.specification.toLowerCase().includes(kw)
      );
    }
    return result;
  }, [materials, filters]);

  useEffect(() => {
    refreshStatuses();
  }, [refreshStatuses]);

  const statCards = [
    {
      key: 'all',
      title: '全部材料',
      value: stats.total,
      icon: Package,
      color: '#1677ff',
      bgColor: 'rgba(22, 119, 255, 0.1)',
    },
    {
      key: 'normal',
      title: '正常',
      value: stats.normal,
      icon: CheckCircle,
      color: '#52c41a',
      bgColor: 'rgba(82, 196, 26, 0.1)',
    },
    {
      key: 'warning90',
      title: '90天预警',
      value: stats.warning90,
      icon: Clock,
      color: '#fadb14',
      bgColor: 'rgba(250, 219, 20, 0.15)',
    },
    {
      key: 'warning30',
      title: '30天临期',
      value: stats.warning30,
      icon: AlertTriangle,
      color: '#fa8c16',
      bgColor: 'rgba(250, 140, 22, 0.15)',
    },
    {
      key: 'warning7',
      title: '7天紧急',
      value: stats.warning7,
      icon: AlertTriangle,
      color: '#ff4d4f',
      bgColor: 'rgba(255, 77, 79, 0.15)',
    },
    {
      key: 'expired',
      title: '已过期',
      value: stats.expired,
      icon: XCircle,
      color: '#cf1322',
      bgColor: 'rgba(207, 19, 34, 0.15)',
    },
  ];

  const handleStatClick = (key: string) => {
    setFilters((prev) => ({ ...prev, status: key }));
  };

  const handleViewDetail = (material: Material) => {
    setSelectedMaterial(material);
    setSelectedBatch(null);
    setDrawerVisible(true);
  };

  const handleViewBatch = (batch: BatchSummary) => {
    setSelectedBatch(batch);
    setSelectedMaterial(null);
    setDrawerVisible(true);
  };

  const handleProcess = (type: ProcessType) => {
    setProcessType(type);
    setProcessModalVisible(true);
    form.resetFields();
  };

  const handleProcessSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!values.remark || !values.remark.trim()) {
        message.warning('请填写真实的处理备注，不能只输入空格');
        return;
      }
      if (selectedMaterial && processType) {
        const recordData: Parameters<typeof addProcessRecord>[0] = {
          materialId: selectedMaterial.id,
          type: processType,
          handler: values.handler,
          remark: values.remark.trim(),
        };
        if (processType === 'returnExchange' && values.followUpStatus) {
          recordData.followUpStatus = values.followUpStatus;
        }
        addProcessRecord(recordData);
        message.success('处理记录已保存');
        setProcessModalVisible(false);
        setProcessType(null);
      } else if (selectedBatch && processType) {
        selectedBatch.locations.forEach((loc) => {
          const recordData: Parameters<typeof addProcessRecord>[0] = {
            materialId: loc.materialId,
            type: processType,
            handler: values.handler,
            remark: values.remark.trim(),
          };
          if (processType === 'returnExchange' && values.followUpStatus) {
            recordData.followUpStatus = values.followUpStatus;
          }
          addProcessRecord(recordData);
        });
        message.success(`处理记录已保存（共 ${selectedBatch.locations.length} 条）`);
        setProcessModalVisible(false);
        setProcessType(null);
      }
    } catch {
      // validation failed
    }
  };

  const handleOpenSafeStock = () => {
    if (selectedMaterial) {
      safeStockForm.setFieldsValue({
        safeStock: selectedMaterial.safeStock,
      });
    }
    setSafeStockModalVisible(true);
  };

  const handleSafeStockSubmit = async () => {
    try {
      const values = await safeStockForm.validateFields();
      if (selectedMaterial) {
        setSafeStock(selectedMaterial.id, values.safeStock || 0);
        message.success('安全库存已设置');
        setSafeStockModalVisible(false);
        setSelectedMaterial((prev) =>
          prev ? { ...prev, safeStock: values.safeStock || 0 } : null
        );
      }
    } catch {
      // validation failed
    }
  };

  const renderLowStockAlert = () => {
    if (lowStockItems.length === 0) return null;
    return (
      <Alert
        message={
          <div className="flex items-center gap-2">
            <ShieldAlert size={18} className="text-orange-500" />
            <span className="font-medium">
              低库存提醒：共 {lowStockItems.length} 项材料库存低于安全库存
            </span>
          </div>
        }
        description={
          <div className="mt-2">
            {lowStockItems.slice(0, 3).map((item) => (
              <div key={item.id} className="text-sm flex items-center gap-2">
                <span className="font-medium">{item.name}</span>
                <span className="text-gray-500">
                  ({item.location} / 批号{item.batchNo})
                </span>
                <Tag color="red">
                  缺 {item.shortfall} {item.unit}
                </Tag>
              </div>
            ))}
            {lowStockItems.length > 3 && (
              <div className="text-sm text-orange-600 mt-1">
                ...还有 {lowStockItems.length - 3} 项，请在下方「低库存列表」中查看
              </div>
            )}
          </div>
        }
        type="warning"
        showIcon={false}
        closable
      />
    );
  };

  const detailColumns = [
    {
      title: '材料名称',
      dataIndex: 'name',
      key: 'name',
      width: 240,
      render: (text: string, record: Material) => {
        const isLow = record.safeStock !== undefined && record.quantity < record.safeStock;
        return (
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-medium"
              style={{ backgroundColor: STATUS_MAP[record.status].color }}
            >
              {text.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-800">{text}</span>
                {isLow && (
                  <Tag color="red" icon={<ShieldAlert size={12} />}>
                    低库存
                  </Tag>
                )}
              </div>
              <div className="text-xs text-gray-400">{getCategoryLabel(record.category)}</div>
            </div>
          </div>
        );
      },
    },
    {
      title: '批号',
      dataIndex: 'batchNo',
      key: 'batchNo',
      width: 130,
      render: (text: string) => <span className="font-mono text-gray-600 text-sm">{text}</span>,
    },
    {
      title: '规格',
      dataIndex: 'specification',
      key: 'specification',
      width: 180,
      render: (text: string) => <span className="text-gray-600">{text}</span>,
    },
    {
      title: '有效期',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      width: 130,
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-gray-400" />
          <span className="text-gray-600">{text}</span>
        </div>
      ),
    },
    {
      title: '剩余天数',
      dataIndex: 'expiryDate',
      key: 'remainingDays',
      width: 120,
      sorter: (a: Material, b: Material) =>
        getRemainingDays(a.expiryDate) - getRemainingDays(b.expiryDate),
      render: (text: string, record: Material) => {
        const days = getRemainingDays(text);
        const isExpired = days <= 0;
        return (
          <div className="flex items-center gap-2">
            <span
              className="text-lg font-bold"
              style={{ color: STATUS_MAP[record.status].color }}
            >
              {isExpired ? `过期${Math.abs(days)}` : days}
            </span>
            <span className="text-gray-400 text-sm">天</span>
          </div>
        );
      },
    },
    {
      title: '库存数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 140,
      render: (qty: number, record: Material) => {
        const isLow = record.safeStock !== undefined && record.quantity < record.safeStock;
        return (
          <div>
            <span className="text-gray-700">
              <span className="font-semibold">{qty}</span> {record.unit}
            </span>
            {record.safeStock !== undefined && (
              <div className={`text-xs mt-1 ${isLow ? 'text-red-500' : 'text-gray-400'}`}>
                安全库存: {record.safeStock} {record.unit}
                {isLow && ` (缺 ${record.safeStock - qty})`}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: '存放位置',
      dataIndex: 'location',
      key: 'location',
      width: 140,
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-gray-400" />
          <span className="text-gray-600 text-sm">{text}</span>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: MaterialStatus) => <StatusTag status={status} showPulse />,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (_: unknown, record: Material) => (
        <Button
          type="link"
          size="small"
          icon={<ArrowRight size={14} />}
          onClick={() => handleViewDetail(record)}
        >
          查看详情
        </Button>
      ),
    },
  ];

  const batchColumns = [
    {
      title: '材料名称',
      dataIndex: 'name',
      key: 'name',
      width: 240,
      render: (text: string, record: BatchSummary) => {
        const status = getStatusByExpiryDate(record.expiryDate);
        const hasLowStock = record.locations.some((loc) => {
          const mat = materials.find((m) => m.id === loc.materialId);
          return mat && mat.safeStock !== undefined && mat.quantity < mat.safeStock;
        });
        return (
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-medium"
              style={{ backgroundColor: STATUS_MAP[status].color }}
            >
              {text.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-800">{text}</span>
                {hasLowStock && (
                  <Tag color="red" icon={<ShieldAlert size={12} />}>
                    有低库存
                  </Tag>
                )}
              </div>
              <div className="text-xs text-gray-400">{getCategoryLabel(record.category)}</div>
            </div>
          </div>
        );
      },
    },
    {
      title: '批号',
      dataIndex: 'batchNo',
      key: 'batchNo',
      width: 130,
      render: (text: string) => <span className="font-mono text-gray-600 text-sm">{text}</span>,
    },
    {
      title: '规格',
      dataIndex: 'specification',
      key: 'specification',
      width: 180,
      render: (text: string) => <span className="text-gray-600">{text}</span>,
    },
    {
      title: '最早到期',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      width: 130,
      render: (text: string, record: BatchSummary) => {
        const status = getStatusByExpiryDate(record.expiryDate);
        return (
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-gray-400" />
            <span style={{ color: STATUS_MAP[status].color, fontWeight: 500 }}>{text}</span>
          </div>
        );
      },
    },
    {
      title: '剩余天数',
      dataIndex: 'expiryDate',
      key: 'remainingDays',
      width: 120,
      sorter: (a: BatchSummary, b: BatchSummary) =>
        getRemainingDays(a.expiryDate) - getRemainingDays(b.expiryDate),
      render: (text: string, record: BatchSummary) => {
        const days = getRemainingDays(text);
        const status = getStatusByExpiryDate(record.expiryDate);
        const isExpired = days <= 0;
        return (
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold" style={{ color: STATUS_MAP[status].color }}>
              {isExpired ? `过期${Math.abs(days)}` : days}
            </span>
            <span className="text-gray-400 text-sm">天</span>
          </div>
        );
      },
    },
    {
      title: '总库存',
      dataIndex: 'totalQuantity',
      key: 'totalQuantity',
      width: 140,
      render: (qty: number, record: BatchSummary) => {
        const lowItems = record.locations.filter((loc) => {
          const mat = materials.find((m) => m.id === loc.materialId);
          return mat && mat.safeStock !== undefined && mat.quantity < mat.safeStock;
        });
        return (
          <div>
            <span className="text-gray-700">
              <span className="font-semibold text-lg">{qty}</span> {record.unit}
            </span>
            {lowItems.length > 0 && (
              <div className="text-xs text-red-500 mt-1">
                {lowItems.length} 个位置库存不足
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: '存放位置',
      dataIndex: 'locations',
      key: 'locations',
      width: 180,
      render: (locations: BatchSummary['locations']) => (
        <div>
          <Tag color="blue">{locations.length} 个位置</Tag>
          <div className="text-xs text-gray-400 mt-1">
            {locations.slice(0, 2).map((l) => l.location).join('、')}
            {locations.length > 2 && ' 等'}
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'expiryDate',
      key: 'status',
      width: 110,
      render: (text: string, record: BatchSummary) => {
        const status = getStatusByExpiryDate(record.expiryDate);
        return <StatusTag status={status} showPulse />;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (_: unknown, record: BatchSummary) => (
        <Button
          type="link"
          size="small"
          icon={<ArrowRight size={14} />}
          onClick={() => handleViewBatch(record)}
        >
          查看批次
        </Button>
      ),
    },
  ];

  const lowStockColumns = [
    {
      title: '材料名称',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      render: (text: string, record: LowStockItem) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-800">{text}</span>
          <Tag color="blue">{getCategoryLabel(record.category)}</Tag>
        </div>
      ),
    },
    {
      title: '批号',
      dataIndex: 'batchNo',
      key: 'batchNo',
      width: 120,
      render: (text: string) => <span className="font-mono text-sm">{text}</span>,
    },
    {
      title: '存放位置',
      dataIndex: 'location',
      key: 'location',
      width: 140,
      render: (text: string) => (
        <span className="flex items-center gap-1">
          <MapPin size={12} className="text-gray-400" />
          {text}
        </span>
      ),
    },
    {
      title: '当前库存',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      render: (qty: number, record: LowStockItem) => (
        <span className="text-red-600 font-semibold">
          {qty} {record.unit}
        </span>
      ),
    },
    {
      title: '安全库存',
      dataIndex: 'safeStock',
      key: 'safeStock',
      width: 100,
      render: (qty: number, record: LowStockItem) => (
        <span className="text-gray-600">{qty} {record.unit}</span>
      ),
    },
    {
      title: '缺多少',
      dataIndex: 'shortfall',
      key: 'shortfall',
      width: 100,
      render: (qty: number, record: LowStockItem) => (
        <span className="text-red-600 font-semibold">
          -{qty} {record.unit}
        </span>
      ),
    },
    {
      title: '效期状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: MaterialStatus) => <StatusTag status={status} />,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: LowStockItem) => {
        const mat = materials.find((m) => m.id === record.id);
        return (
          <Button
            type="link"
            size="small"
            onClick={() => mat && handleViewDetail(mat)}
          >
            查看
          </Button>
        );
      },
    },
  ];

  const renderMaterialDetail = () => {
    if (!selectedMaterial) return null;

    const usageRecords = getUsageRecordsByMaterialId(selectedMaterial.id);
    const processRecords = getProcessRecordsByMaterialId(selectedMaterial.id);
    const remainingDays = getRemainingDays(selectedMaterial.expiryDate);
    const isLow = selectedMaterial.safeStock !== undefined && selectedMaterial.quantity < selectedMaterial.safeStock;

    const tabItems = [
      {
        key: 'basic',
        label: '基本信息',
        children: (
          <div className="space-y-6">
            {isLow && (
              <Alert
                message="库存低于安全库存"
                description={`当前库存 ${selectedMaterial.quantity} ${selectedMaterial.unit}，安全库存 ${selectedMaterial.safeStock} ${selectedMaterial.unit}，缺口 ${(selectedMaterial.safeStock! - selectedMaterial.quantity)} ${selectedMaterial.unit}`}
                type="warning"
                showIcon
              />
            )}
            <div className="p-4 rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold"
                    style={{ backgroundColor: STATUS_MAP[selectedMaterial.status].color }}
                  >
                    {selectedMaterial.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 m-0">
                      {selectedMaterial.name}
                    </h3>
                    <p className="text-sm text-gray-500 m-0">
                      {getCategoryLabel(selectedMaterial.category)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusTag status={selectedMaterial.status} showPulse />
                  <Button
                    type="text"
                    size="small"
                    icon={<Settings size={14} />}
                    onClick={handleOpenSafeStock}
                  >
                    设置安全库存
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-blue-50">
                <p className="text-xs text-blue-500 mb-1">剩余天数</p>
                <p className="text-2xl font-bold text-blue-600 m-0">
                  {remainingDays > 0 ? remainingDays : `过期${Math.abs(remainingDays)}`}
                  <span className="text-sm font-normal ml-1">天</span>
                </p>
              </div>
              <div className={`p-3 rounded-lg ${isLow ? 'bg-red-50' : 'bg-green-50'}`}>
                <p className={`text-xs ${isLow ? 'text-red-500' : 'text-green-500'} mb-1`}>
                  库存数量
                  {selectedMaterial.safeStock !== undefined && ` / 安全库存`}
                </p>
                <p className={`text-2xl font-bold ${isLow ? 'text-red-600' : 'text-green-600'} m-0`}>
                  {selectedMaterial.quantity}
                  <span className="text-sm font-normal ml-1">{selectedMaterial.unit}</span>
                  {selectedMaterial.safeStock !== undefined && (
                    <span className="text-sm font-normal ml-2 text-gray-500">
                      / {selectedMaterial.safeStock}
                    </span>
                  )}
                </p>
                {isLow && (
                  <p className="text-xs text-red-500 mt-1">
                    缺 {selectedMaterial.safeStock! - selectedMaterial.quantity} {selectedMaterial.unit}
                  </p>
                )}
              </div>
            </div>

            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="批号">
                <span className="font-mono">{selectedMaterial.batchNo}</span>
              </Descriptions.Item>
              <Descriptions.Item label="规格">{selectedMaterial.specification}</Descriptions.Item>
              <Descriptions.Item label="有效期至">{selectedMaterial.expiryDate}</Descriptions.Item>
              <Descriptions.Item label="存放位置">{selectedMaterial.location}</Descriptions.Item>
              <Descriptions.Item label="入库经办人">{selectedMaterial.handler}</Descriptions.Item>
              <Descriptions.Item label="入库日期">{selectedMaterial.inDate}</Descriptions.Item>
              {selectedMaterial.remark && (
                <Descriptions.Item label="备注">{selectedMaterial.remark}</Descriptions.Item>
              )}
            </Descriptions>
          </div>
        ),
      },
      {
        key: 'usage',
        label: `领用记录 (${usageRecords.length})`,
        children:
          usageRecords.length > 0 ? (
            <List
              dataSource={usageRecords}
              renderItem={(item) => (
                <List.Item className="px-0">
                  <List.Item.Meta
                    avatar={
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <TrendingDown size={18} className="text-blue-500" />
                      </div>
                    }
                    title={
                      <div className="flex items-center justify-between">
                        <span className="text-gray-800 font-medium">{item.user}</span>
                        <Tag color="red">- {item.quantity} {selectedMaterial.unit}</Tag>
                      </div>
                    }
                    description={
                      <div className="text-sm text-gray-500">
                        <p>{item.department} · {formatDate(item.date)}</p>
                        {item.purpose && <p className="mt-1">用途：{item.purpose}</p>}
                        {item.remark && <p className="mt-1">{item.remark}</p>}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="暂无领用记录" />
          ),
      },
      {
        key: 'process',
        label: `处理记录 (${processRecords.length})`,
        children:
          processRecords.length > 0 ? (
            <List
              dataSource={processRecords}
              renderItem={(item) => (
                <List.Item className="px-0">
                  <List.Item.Meta
                    avatar={
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: `${PROCESS_TYPE_MAP[item.type].color}15`,
                        }}
                      >
                        {item.type === 'priorityUse' && (
                          <RefreshCw size={18} style={{ color: PROCESS_TYPE_MAP[item.type].color }} />
                        )}
                        {item.type === 'returnExchange' && (
                          <Send size={18} style={{ color: PROCESS_TYPE_MAP[item.type].color }} />
                        )}
                        {item.type === 'scrap' && (
                          <Trash2 size={18} style={{ color: PROCESS_TYPE_MAP[item.type].color }} />
                        )}
                      </div>
                    }
                    title={
                      <div className="flex items-center justify-between">
                        <span
                          className="font-medium"
                          style={{ color: PROCESS_TYPE_MAP[item.type].color }}
                        >
                          {PROCESS_TYPE_MAP[item.type].label}
                        </span>
                        <span className="text-xs text-gray-400">{formatDate(item.date)}</span>
                      </div>
                    }
                    description={
                      <div className="text-sm text-gray-500">
                        <p>经办人：{item.handler}</p>
                        {item.remark && <p className="mt-1">{item.remark}</p>}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="暂无处理记录" />
          ),
      },
    ];

    return <Tabs items={tabItems} />;
  };

  const renderBatchDetail = () => {
    if (!selectedBatch) return null;

    const status = getStatusByExpiryDate(selectedBatch.expiryDate);
    const remainingDays = getRemainingDays(selectedBatch.expiryDate);
    const allProcessRecords = selectedBatch.locations.flatMap((loc) =>
      getProcessRecordsByMaterialId(loc.materialId)
    );

    const tabItems = [
      {
        key: 'overview',
        label: '批次总览',
        children: (
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold"
                    style={{ backgroundColor: STATUS_MAP[status].color }}
                  >
                    {selectedBatch.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 m-0">
                      {selectedBatch.name}
                    </h3>
                    <p className="text-sm text-gray-500 m-0">
                      批号：<span className="font-mono">{selectedBatch.batchNo}</span>
                    </p>
                  </div>
                </div>
                <StatusTag status={status} showPulse />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-blue-50 text-center">
                <p className="text-xs text-blue-500 mb-1">剩余天数</p>
                <p className="text-xl font-bold text-blue-600 m-0">
                  {remainingDays > 0 ? remainingDays : `过期${Math.abs(remainingDays)}`}
                  <span className="text-xs font-normal ml-1">天</span>
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-50 text-center">
                <p className="text-xs text-green-500 mb-1">总库存</p>
                <p className="text-xl font-bold text-green-600 m-0">
                  {selectedBatch.totalQuantity}
                  <span className="text-xs font-normal ml-1">{selectedBatch.unit}</span>
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50 text-center">
                <p className="text-xs text-purple-500 mb-1">存放位置</p>
                <p className="text-xl font-bold text-purple-600 m-0">
                  {selectedBatch.locations.length}
                  <span className="text-xs font-normal ml-1">个</span>
                </p>
              </div>
            </div>

            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="规格">{selectedBatch.specification}</Descriptions.Item>
              <Descriptions.Item label="分类">{getCategoryLabel(selectedBatch.category)}</Descriptions.Item>
              <Descriptions.Item label="最早到期日">{selectedBatch.expiryDate}</Descriptions.Item>
            </Descriptions>
          </div>
        ),
      },
      {
        key: 'locations',
        label: `库存分布 (${selectedBatch.locations.length})`,
        children: (
          <div className="space-y-3">
            {selectedBatch.locations.map((loc, idx) => {
              const mat = materials.find((m) => m.id === loc.materialId);
              const matStatus = mat ? STATUS_MAP[mat.status] : STATUS_MAP.normal;
              const isLow = mat && mat.safeStock !== undefined && mat.quantity < mat.safeStock;
              return (
                <Card key={idx} size="small" className="shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: matStatus.bgColor }}
                      >
                        <MapPin size={18} style={{ color: matStatus.color }} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 m-0">
                          {loc.location}
                          {isLow && (
                            <Tag color="red" className="ml-2">
                              低库存
                            </Tag>
                          )}
                        </p>
                        <p className="text-sm text-gray-500 m-0">
                          批号：<span className="font-mono text-xs">{selectedBatch.batchNo}</span>
                        </p>
                        {isLow && mat && (
                          <p className="text-xs text-red-500 mt-1">
                            当前 {mat.quantity} / 安全 {mat.safeStock}，缺 {mat.safeStock! - mat.quantity} {mat.unit}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold m-0" style={{ color: isLow ? '#ff4d4f' : matStatus.color }}>
                        {loc.quantity} <span className="text-sm font-normal text-gray-500">{selectedBatch.unit}</span>
                      </p>
                      {mat && <StatusTag status={mat.status} />}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ),
      },
      {
        key: 'usage',
        label: `最近领用 (${selectedBatch.recentUsage.length})`,
        children:
          selectedBatch.recentUsage.length > 0 ? (
            <List
              dataSource={selectedBatch.recentUsage}
              renderItem={(item) => (
                <List.Item className="px-0">
                  <List.Item.Meta
                    avatar={
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <TrendingDown size={18} className="text-blue-500" />
                      </div>
                    }
                    title={
                      <div className="flex items-center justify-between">
                        <span className="text-gray-800 font-medium">{item.user}</span>
                        <Tag color="red">- {item.quantity} {selectedBatch.unit}</Tag>
                      </div>
                    }
                    description={
                      <div className="text-sm text-gray-500">
                        <p>{item.department} · {formatDate(item.date)}</p>
                        {item.purpose && <p className="mt-1">用途：{item.purpose}</p>}
                        {item.remark && <p className="mt-1">{item.remark}</p>}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="暂无领用记录" />
          ),
      },
      {
        key: 'process',
        label: `处理记录 (${allProcessRecords.length})`,
        children:
          allProcessRecords.length > 0 ? (
            <List
              dataSource={allProcessRecords.sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
              )}
              renderItem={(item) => (
                <List.Item className="px-0">
                  <List.Item.Meta
                    avatar={
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: `${PROCESS_TYPE_MAP[item.type].color}15`,
                        }}
                      >
                        {item.type === 'priorityUse' && (
                          <RefreshCw size={18} style={{ color: PROCESS_TYPE_MAP[item.type].color }} />
                        )}
                        {item.type === 'returnExchange' && (
                          <Send size={18} style={{ color: PROCESS_TYPE_MAP[item.type].color }} />
                        )}
                        {item.type === 'scrap' && (
                          <Trash2 size={18} style={{ color: PROCESS_TYPE_MAP[item.type].color }} />
                        )}
                      </div>
                    }
                    title={
                      <div className="flex items-center justify-between">
                        <span
                          className="font-medium"
                          style={{ color: PROCESS_TYPE_MAP[item.type].color }}
                        >
                          {PROCESS_TYPE_MAP[item.type].label}
                        </span>
                        <span className="text-xs text-gray-400">{formatDate(item.date)}</span>
                      </div>
                    }
                    description={
                      <div className="text-sm text-gray-500">
                        <p>经办人：{item.handler}</p>
                        {item.remark && <p className="mt-1">{item.remark}</p>}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="暂无处理记录" />
          ),
      },
    ];

    return <Tabs items={tabItems} />;
  };

  const mainTabItems = [
    {
      key: 'warning',
      label: (
        <span className="flex items-center gap-1">
          <AlertTriangle size={16} />
          效期预警
        </span>
      ),
      children: (
        <div className="space-y-6">
          {/* 统计卡片 */}
          <Row gutter={[16, 16]}>
            {statCards.map((card) => (
              <Col xs={12} sm={12} md={8} lg={8} xl={4} key={card.key}>
                <StatCard
                  title={card.title}
                  value={card.value}
                  icon={card.icon}
                  color={card.color}
                  bgColor={card.bgColor}
                  active={filters.status === card.key}
                  onClick={() => handleStatClick(card.key)}
                />
              </Col>
            ))}
          </Row>

          {/* 筛选栏 */}
          <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-sm">视图：</span>
              <Segmented
                value={viewMode}
                onChange={(value) => setViewMode(value as ViewMode)}
                options={[
                  { label: <span className="flex items-center gap-1"><ListIcon size={14} />明细视图</span>, value: 'detail' },
                  { label: <span className="flex items-center gap-1"><Layers size={14} />批次视图</span>, value: 'batch' },
                ]}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-sm">状态筛选：</span>
              <Select
                value={filters.status}
                onChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
                style={{ width: 140 }}
                size="middle"
              >
                <Option value="all">全部状态</Option>
                <Option value="normal">正常</Option>
                <Option value="warning90">90天预警</Option>
                <Option value="warning30">30天临期</Option>
                <Option value="warning7">7天紧急</Option>
                <Option value="expired">已过期</Option>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-sm">材料分类：</span>
              <Select
                value={filters.category || undefined}
                onChange={(value) => setFilters((prev) => ({ ...prev, category: value || '' }))}
                style={{ width: 140 }}
                size="middle"
                allowClear
                placeholder="全部分类"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Option>
                ))}
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <SearchInput
                placeholder={viewMode === 'batch' ? '搜索材料名称、批号' : '搜索材料名称、批号、规格'}
                allowClear
                size="middle"
                value={filters.keyword}
                onChange={(e) => setFilters((prev) => ({ ...prev, keyword: e.target.value }))}
                style={{ maxWidth: 360 }}
                prefix={<Search size={16} className="text-gray-400" />}
              />
            </div>
          </div>

          {/* 材料列表 */}
          <div className="bg-white rounded-lg">
            {viewMode === 'detail' ? (
              <Table
                columns={detailColumns}
                dataSource={filteredMaterials}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `共 ${total} 条记录`,
                }}
                scroll={{ x: 1400 }}
                onRow={(record) => ({
                  onClick: () => handleViewDetail(record),
                  style: { cursor: 'pointer' },
                })}
              />
            ) : (
              <Table
                columns={batchColumns}
                dataSource={batchSummaries}
                rowKey={(record) => `${record.name}__${record.batchNo}`}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `共 ${total} 个批次`,
                }}
                scroll={{ x: 1400 }}
                onRow={(record) => ({
                  onClick: () => handleViewBatch(record),
                  style: { cursor: 'pointer' },
                })}
              />
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'lowStock',
      label: (
        <span className="flex items-center gap-1">
          <ShieldAlert size={16} className="text-orange-500" />
          低库存列表
          {lowStockItems.length > 0 && (
            <Tag color="red" style={{ marginLeft: 4 }}>
              {lowStockItems.length}
            </Tag>
          )}
        </span>
      ),
      children: (
        <div className="mt-4">
          {lowStockItems.length > 0 ? (
            <Table
              columns={lowStockColumns}
              dataSource={lowStockItems}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 项低库存材料`,
              }}
              scroll={{ x: 1100 }}
            />
          ) : (
            <Empty
              description={
                <div className="py-8">
                  <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">当前所有材料库存均充足</p>
                  <p className="text-gray-400 text-sm mt-1">可在材料详情中设置安全库存启用低库存提醒</p>
                </div>
              }
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {renderLowStockAlert()}

      <Card
        title={
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} className="text-blue-500" />
            <span>效期预警 & 库存提醒</span>
          </div>
        }
        className="shadow-sm"
        extra={
          <Button
            icon={<RefreshCw size={14} />}
            onClick={() => {
              refreshStatuses();
              message.success('状态已刷新');
            }}
          >
            刷新状态
          </Button>
        }
      >
        <Tabs items={mainTabItems} defaultActiveKey="warning" />
      </Card>

      {/* 详情抽屉 */}
      <Drawer
        title={
          selectedBatch
            ? `批次详情 - ${selectedBatch.name}`
            : selectedMaterial
            ? `材料详情 - ${selectedMaterial.name}`
            : '详情'
        }
        placement="right"
        width={560}
        open={drawerVisible}
        onClose={() => {
          setDrawerVisible(false);
          setSelectedMaterial(null);
          setSelectedBatch(null);
        }}
        extra={
          <Space>
            <Button
              onClick={() => {
                setDrawerVisible(false);
                setSelectedMaterial(null);
                setSelectedBatch(null);
              }}
            >
              关闭
            </Button>
          </Space>
        }
      >
        {(selectedMaterial || selectedBatch) && (
          <>
            {selectedMaterial ? renderMaterialDetail() : renderBatchDetail()}
            <Divider />
            <div className="space-y-3">
              <h4 className="text-gray-700 font-medium mb-3">
                快速处理{selectedBatch && '（批量处理该批次所有位置）'}
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  type="primary"
                  icon={<RefreshCw size={16} />}
                  onClick={() => handleProcess('priorityUse')}
                  style={{ backgroundColor: '#1677ff' }}
                >
                  优先使用
                </Button>
                <Button
                  icon={<Send size={16} />}
                  onClick={() => handleProcess('returnExchange')}
                  style={{ borderColor: '#fa8c16', color: '#fa8c16' }}
                >
                  退换联系
                </Button>
                <Button
                  danger
                  icon={<Trash2 size={16} />}
                  onClick={() => handleProcess('scrap')}
                >
                  报废登记
                </Button>
              </div>
            </div>
          </>
        )}
      </Drawer>

      {/* 处理弹窗 */}
      <Modal
        title={processType ? PROCESS_TYPE_MAP[processType].label : ''}
        open={processModalVisible}
        onOk={handleProcessSubmit}
        onCancel={() => {
          setProcessModalVisible(false);
          setProcessType(null);
        }}
        okText="确认提交"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="handler"
            label="经办人"
            rules={[{ required: true, message: '请输入经办人姓名' }]}
          >
            <Input placeholder="请输入经办人姓名" prefix={<User size={16} />} />
          </Form.Item>
          {processType === 'returnExchange' && (
            <Form.Item
              name="followUpStatus"
              label="跟进状态"
              initialValue="pending"
            >
              <Select placeholder="请选择跟进状态">
                {FOLLOWUP_STATUS_OPTIONS.map((opt) => (
                  <Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}
          <Form.Item
            name="remark"
            label="备注"
            rules={[
              { required: true, message: '请输入处理备注，方便月底核对' },
              {
                validator: (_, value) => {
                  if (value && value.trim() === '') {
                    return Promise.reject('请填写真实的处理说明，不能只输入空格');
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <TextArea rows={4} placeholder="请详细说明处理情况（必填）" maxLength={200} showCount />
          </Form.Item>
        </Form>
      </Modal>

      {/* 安全库存设置弹窗 */}
      <Modal
        title="设置安全库存"
        open={safeStockModalVisible}
        onOk={handleSafeStockSubmit}
        onCancel={() => setSafeStockModalVisible(false)}
        okText="保存"
        cancelText="取消"
        width={400}
      >
        <Form form={safeStockForm} layout="vertical" className="mt-4">
          <Form.Item
            name="safeStock"
            label="安全库存数量"
            rules={[{ required: true, message: '请输入安全库存数量' }]}
            extra={`当前库存：${selectedMaterial?.quantity} ${selectedMaterial?.unit}，设置低于此值时将触发低库存提醒`}
          >
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              placeholder={`请输入安全库存数量（单位：${selectedMaterial?.unit}）`}
              size="large"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
