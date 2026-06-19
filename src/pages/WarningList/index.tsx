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
} from 'lucide-react';
import StatCard from '@/components/StatCard/StatCard';
import StatusTag from '@/components/StatusTag/StatusTag';
import { useMaterialStore } from '@/store/useMaterialStore';
import { Material, MaterialStatus, ProcessType, MaterialCategory } from '@/types';
import { getRemainingDays, formatDate, formatDateTime } from '@/utils/date';
import { CATEGORY_OPTIONS, STATUS_MAP, PROCESS_TYPE_MAP, getCategoryLabel } from '@/utils/status';

const { Search: SearchInput } = Input;
const { Option } = Select;
const { TextArea } = Input;

interface FilterState {
  status: string;
  category: string;
  keyword: string;
}

export default function WarningList() {
  const {
    materials,
    getStats,
    filterMaterials,
    getUsageRecordsByMaterialId,
    getProcessRecordsByMaterialId,
    addProcessRecord,
    refreshStatuses,
  } = useMaterialStore();

  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    category: '',
    keyword: '',
  });
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [processModalVisible, setProcessModalVisible] = useState(false);
  const [processType, setProcessType] = useState<ProcessType | null>(null);
  const [form] = Form.useForm();

  const stats = getStats();
  const filteredMaterials = useMemo(
    () =>
      filterMaterials({
        status: filters.status,
        category: filters.category as MaterialCategory | undefined,
        keyword: filters.keyword,
      }),
    [materials, filters]
  );

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
      if (selectedMaterial && processType) {
        addProcessRecord({
          materialId: selectedMaterial.id,
          type: processType,
          handler: values.handler,
          remark: values.remark,
        });
        message.success('处理记录已保存');
        setProcessModalVisible(false);
        setProcessType(null);
      }
    } catch {
      // validation failed
    }
  };

  const columns = [
    {
      title: '材料名称',
      dataIndex: 'name',
      key: 'name',
      width: 240,
      render: (text: string, record: Material) => (
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-medium"
            style={{ backgroundColor: STATUS_MAP[record.status].color }}
          >
            {text.charAt(0)}
          </div>
          <div>
            <div className="font-medium text-gray-800">{text}</div>
            <div className="text-xs text-gray-400">{getCategoryLabel(record.category)}</div>
          </div>
        </div>
      ),
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
      width: 120,
      render: (qty: number, record: Material) => (
        <span className="text-gray-700">
          <span className="font-semibold">{qty}</span> {record.unit}
        </span>
      ),
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

  const renderDetailContent = () => {
    if (!selectedMaterial) return null;

    const usageRecords = getUsageRecordsByMaterialId(selectedMaterial.id);
    const processRecords = getProcessRecordsByMaterialId(selectedMaterial.id);
    const remainingDays = getRemainingDays(selectedMaterial.expiryDate);

    const tabItems = [
      {
        key: 'basic',
        label: '基本信息',
        children: (
          <div className="space-y-6">
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
                <StatusTag status={selectedMaterial.status} showPulse />
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
              <div className="p-3 rounded-lg bg-green-50">
                <p className="text-xs text-green-500 mb-1">库存数量</p>
                <p className="text-2xl font-bold text-green-600 m-0">
                  {selectedMaterial.quantity}
                  <span className="text-sm font-normal ml-1">{selectedMaterial.unit}</span>
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <FileText size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">批号</p>
                  <p className="text-gray-700 font-mono m-0">{selectedMaterial.batchNo}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Package size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">规格</p>
                  <p className="text-gray-700 m-0">{selectedMaterial.specification}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">有效期至</p>
                  <p className="text-gray-700 m-0">{selectedMaterial.expiryDate}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">存放位置</p>
                  <p className="text-gray-700 m-0">{selectedMaterial.location}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">入库经办人</p>
                  <p className="text-gray-700 m-0">{selectedMaterial.handler}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">入库日期</p>
                  <p className="text-gray-700 m-0">{selectedMaterial.inDate}</p>
                </div>
              </div>
              {selectedMaterial.remark && (
                <div className="flex items-start gap-3">
                  <FileText size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">备注</p>
                    <p className="text-gray-700 m-0">{selectedMaterial.remark}</p>
                  </div>
                </div>
              )}
            </div>
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

  return (
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
            placeholder="搜索材料名称、批号、规格"
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
        <Table
          columns={columns}
          dataSource={filteredMaterials}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 1200 }}
          onRow={(record) => ({
            onClick: () => handleViewDetail(record),
            style: { cursor: 'pointer' },
          })}
        />
      </div>

      {/* 详情抽屉 */}
      <Drawer
        title="材料详情"
        placement="right"
        width={480}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        extra={
          <Space>
            <Button onClick={() => setDrawerVisible(false)}>关闭</Button>
          </Space>
        }
      >
        {selectedMaterial && (
          <>
            {renderDetailContent()}
            <Divider />
            <div className="space-y-3">
              <h4 className="text-gray-700 font-medium mb-3">快速处理</h4>
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
          <Form.Item name="remark" label="备注">
            <TextArea rows={4} placeholder="请输入备注信息（选填）" maxLength={200} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
