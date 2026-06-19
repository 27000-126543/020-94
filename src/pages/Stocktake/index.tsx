import { useState, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Select,
  Button,
  Table,
  Input,
  InputNumber,
  Form,
  Tag,
  Space,
  Statistic,
  Modal,
  message,
  Tabs,
  Empty,
} from 'antd';
import {
  ClipboardCheck,
  MapPin,
  Plus,
  Save,
  TrendingUp,
  TrendingDown,
  Minus,
  User,
  Calendar,
  Package,
  AlertTriangle,
  CheckCircle2,
  History,
  RefreshCw,
} from 'lucide-react';
import { useMaterialStore } from '@/store/useMaterialStore';
import { StocktakeRecord, StocktakeStatus } from '@/types';
import { getCategoryLabel } from '@/utils/status';
import dayjs from 'dayjs';

const { Option } = Select;

interface StocktakeItem {
  materialId: string;
  name: string;
  category: string;
  batchNo: string;
  specification: string;
  systemQuantity: number;
  actualQuantity: number | null;
  difference: number;
  unit: string;
  reason?: string;
}

export default function StocktakePage() {
  const {
    materials,
    getAllLocations,
    stocktakeRecords,
    addStocktakeRecord,
    generateStocktakeByLocation,
  } = useMaterialStore();

  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [stocktakeItems, setStocktakeItems] = useState<StocktakeItem[]>([]);
  const [handler, setHandler] = useState<string>('');
  const [isStarted, setIsStarted] = useState(false);
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('new');

  const locations = getAllLocations();

  const handleGenerate = () => {
    if (!selectedLocation) {
      message.warning('请先选择存放位置');
      return;
    }
    const items = generateStocktakeByLocation(selectedLocation);
    if (items.length === 0) {
      message.warning('该位置暂无材料，请选择其他位置');
      return;
    }
    const formatted: StocktakeItem[] = items.map((item) => ({
      ...item,
      actualQuantity: null,
      difference: 0,
    }));
    setStocktakeItems(formatted);
    setIsStarted(true);
    message.success(`已生成 ${formatted.length} 项材料的盘点清单`);
  };

  const handleQuantityChange = (materialId: string, value: number | null) => {
    setStocktakeItems((prev) =>
      prev.map((item) =>
        item.materialId === materialId
          ? {
              ...item,
              actualQuantity: value,
              difference: value !== null ? value - item.systemQuantity : 0,
            }
          : item
      )
    );
  };

  const handleReasonChange = (materialId: string, value: string) => {
    setStocktakeItems((prev) =>
      prev.map((item) =>
        item.materialId === materialId ? { ...item, reason: value } : item
      )
    );
  };

  const stats = useMemo(() => {
    const total = stocktakeItems.length;
    const completed = stocktakeItems.filter((i) => i.actualQuantity !== null).length;
    const surplus = stocktakeItems.filter((i) => i.difference > 0).length;
    const deficit = stocktakeItems.filter((i) => i.difference < 0).length;
    const matched = stocktakeItems.filter((i) => i.difference === 0 && i.actualQuantity !== null).length;
    return { total, completed, surplus, deficit, matched };
  }, [stocktakeItems]);

  const handleSubmit = () => {
    const allFilled = stocktakeItems.every((i) => i.actualQuantity !== null);
    if (!allFilled) {
      message.warning('请完成所有材料的实盘数量录入');
      return;
    }
    if (!handler || !handler.trim()) {
      message.warning('请输入经办人姓名，不能只输入空格');
      return;
    }
    const diffItems = stocktakeItems.filter((i) => i.difference !== 0);
    const noReasonItems = diffItems.filter((i) => !i.reason || !i.reason.trim());
    if (noReasonItems.length > 0) {
      message.warning(`有 ${noReasonItems.length} 项盘盈/盘亏未填写差异原因，请补齐后再保存`);
      return;
    }
    setSubmitModalVisible(true);
  };

  const handleConfirmSubmit = () => {
    const today = dayjs().format('YYYY-MM-DD');
    stocktakeItems.forEach((item) => {
      if (item.actualQuantity !== null) {
        addStocktakeRecord({
          materialId: item.materialId,
          name: item.name,
          category: item.category as any,
          batchNo: item.batchNo,
          specification: item.specification,
          location: selectedLocation,
          systemQuantity: item.systemQuantity,
          actualQuantity: item.actualQuantity,
          difference: item.difference,
          unit: item.unit,
          handler: handler.trim(),
          date: today,
          reason: item.reason,
          status: 'completed',
        });
      }
    });

    message.success(`盘点完成，共 ${stocktakeItems.length} 条记录已保存`);
    setSubmitModalVisible(false);
    setIsStarted(false);
    setStocktakeItems([]);
    setSelectedLocation('');
    setHandler('');
    setActiveTab('history');
  };

  const handleReset = () => {
    Modal.confirm({
      title: '确认重新开始？',
      content: '当前已录入的实盘数据将被清空',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        setIsStarted(false);
        setStocktakeItems([]);
        setHandler('');
      },
    });
  };

  const historyRecords = useMemo(() => {
    return [...stocktakeRecords]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [stocktakeRecords]);

  const differenceColumns = [
    {
      title: '盘点日期',
      dataIndex: 'date',
      key: 'date',
      width: 110,
      fixed: 'left' as const,
    },
    {
      title: '材料名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (text: string, record: StocktakeRecord) => (
        <div>
          <div className="font-medium text-gray-800">{text}</div>
          <Tag color="blue" className="mt-1">
            {getCategoryLabel(record.category)}
          </Tag>
        </div>
      ),
    },
    {
      title: '批号',
      dataIndex: 'batchNo',
      key: 'batchNo',
      width: 110,
      render: (text: string) => <span className="font-mono text-sm">{text}</span>,
    },
    {
      title: '规格',
      dataIndex: 'specification',
      key: 'specification',
      width: 140,
    },
    {
      title: '存放位置',
      dataIndex: 'location',
      key: 'location',
      width: 120,
    },
    {
      title: '账面数量',
      dataIndex: 'systemQuantity',
      key: 'systemQuantity',
      width: 90,
      render: (val: number, record: StocktakeRecord) => `${val} ${record.unit}`,
    },
    {
      title: '实盘数量',
      dataIndex: 'actualQuantity',
      key: 'actualQuantity',
      width: 90,
      render: (val: number, record: StocktakeRecord) => `${val} ${record.unit}`,
    },
    {
      title: '差异',
      dataIndex: 'difference',
      key: 'difference',
      width: 100,
      render: (val: number) => {
        if (val > 0) {
          return (
            <span className="text-green-600 font-medium flex items-center gap-1">
              <TrendingUp size={14} />
              +{val}
            </span>
          );
        } else if (val < 0) {
          return (
            <span className="text-red-600 font-medium flex items-center gap-1">
              <TrendingDown size={14} />
              {val}
            </span>
          );
        }
        return (
          <span className="text-gray-500 flex items-center gap-1">
            <Minus size={14} />
            0
          </span>
        );
      },
    },
    {
      title: '经办人',
      dataIndex: 'handler',
      key: 'handler',
      width: 90,
    },
    {
      title: '差异原因',
      dataIndex: 'reason',
      key: 'reason',
      render: (val?: string) => val || <span className="text-gray-400">-</span>,
    },
  ];

  const columns = [
    {
      title: '材料名称',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      render: (text: string, record: StocktakeItem) => (
        <div>
          <div className="font-medium text-gray-800">{text}</div>
          <div className="text-xs text-gray-400">
            {getCategoryLabel(record.category)} · {record.batchNo}
          </div>
        </div>
      ),
    },
    {
      title: '规格',
      dataIndex: 'specification',
      key: 'specification',
      width: 150,
    },
    {
      title: '账面数量',
      dataIndex: 'systemQuantity',
      key: 'systemQuantity',
      width: 100,
      render: (val: number, record: StocktakeItem) => (
        <span className="font-semibold text-blue-600">
          {val} {record.unit}
        </span>
      ),
    },
    {
      title: '实盘数量',
      dataIndex: 'actualQuantity',
      key: 'actualQuantity',
      width: 160,
      render: (_: any, record: StocktakeItem) => (
        <InputNumber
          min={0}
          value={record.actualQuantity as number}
          onChange={(val) => handleQuantityChange(record.materialId, val as number | null)}
          placeholder="请输入"
          style={{ width: 120 }}
          size="small"
        />
      ),
    },
    {
      title: '差异',
      dataIndex: 'difference',
      key: 'difference',
      width: 110,
      render: (val: number) => {
        if (val > 0) {
          return (
            <Tag color="green" icon={<TrendingUp size={12} />}>
              盘盈 +{val}
            </Tag>
          );
        } else if (val < 0) {
          return (
            <Tag color="red" icon={<TrendingDown size={12} />}>
              盘亏 {val}
            </Tag>
          );
        }
        return val === 0 && val !== null ? (
          <Tag color="default" icon={<CheckCircle2 size={12} />}>
            相符
          </Tag>
        ) : (
          <span className="text-gray-400">-</span>
        );
      },
    },
    {
      title: '差异原因',
      dataIndex: 'reason',
      key: 'reason',
      width: 220,
      render: (_: any, record: StocktakeItem) =>
        record.difference !== 0 ? (
          <Input
            placeholder={record.difference > 0 ? '请说明盘盈原因' : '请说明盘亏原因'}
            size="small"
            value={record.reason}
            onChange={(e) => handleReasonChange(record.materialId, e.target.value)}
            status={record.difference !== 0 && (!record.reason || !record.reason.trim()) ? 'error' : ''}
          />
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
  ];

  const newTabContent = !isStarted ? (
    <div className="text-center py-12">
      <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
        <ClipboardCheck size={36} className="text-blue-500" />
      </div>
      <h3 className="text-lg font-medium text-gray-800 mb-2">
        选择存放位置开始盘点
      </h3>
      <p className="text-gray-500 text-sm mb-6">
        系统会自动生成该位置所有材料的盘点清单，供逐一核对实盘数量
      </p>
      <div className="flex items-center justify-center gap-3 max-w-md mx-auto">
        <Select
          placeholder="请选择存放位置"
          style={{ flex: 1 }}
          size="large"
          value={selectedLocation || undefined}
          onChange={setSelectedLocation}
        >
          {locations.map((loc) => (
            <Option key={loc} value={loc}>
              {loc}
            </Option>
          ))}
        </Select>
        <Button
          type="primary"
          size="large"
          icon={<Plus size={18} />}
          onClick={handleGenerate}
          disabled={!selectedLocation}
        >
          生成盘点单
        </Button>
      </div>
      {locations.length === 0 && (
        <p className="text-orange-500 text-sm mt-4">
          暂无可用存放位置，请先在入库登记中添加材料
        </p>
      )}
    </div>
  ) : (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-blue-500" />
          <span className="font-medium text-lg text-gray-800">{selectedLocation}</span>
          <Tag color="blue">{stocktakeItems.length} 项材料</Tag>
        </div>
        <Space wrap>
          <Button icon={<RefreshCw size={14} />} onClick={handleReset}>
            重新开始
          </Button>
          <Input
            placeholder="请输入经办人姓名 *"
            prefix={<User size={14} className="text-gray-400" />}
            value={handler}
            onChange={(e) => setHandler(e.target.value)}
            style={{ width: 180 }}
            status={handler && !handler.trim() ? 'error' : ''}
          />
          <Button
            type="primary"
            icon={<Save size={16} />}
            onClick={handleSubmit}
            disabled={stats.completed === 0}
          >
            完成盘点
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} className="mb-4">
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="材料总数"
              value={stats.total}
              suffix="项"
              prefix={<Package size={16} className="text-gray-400" />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="已盘点"
              value={stats.completed}
              suffix="项"
              valueStyle={{ color: '#1677ff' }}
              prefix={<CheckCircle2 size={16} className="text-blue-500" />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="盘盈"
              value={stats.surplus}
              suffix="项"
              valueStyle={{ color: '#52c41a' }}
              prefix={<TrendingUp size={16} className="text-green-500" />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="盘亏"
              value={stats.deficit}
              suffix="项"
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<TrendingDown size={16} className="text-red-500" />}
            />
          </Card>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={stocktakeItems}
        rowKey="materialId"
        pagination={false}
        scroll={{ y: 500 }}
        size="small"
      />
    </div>
  );

  const historyTabContent = (
    <div className="mt-4">
      {historyRecords.length > 0 ? (
        <Table
          columns={differenceColumns}
          dataSource={historyRecords}
          rowKey="id"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 1100 }}
          size="small"
        />
      ) : (
        <Empty
          description={
            <div className="py-8">
              <p className="mb-2">暂无盘点记录</p>
              <Button type="link" onClick={() => setActiveTab('new')}>
                去新建盘点
              </Button>
            </div>
          }
        />
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <Card
        title={
          <div className="flex items-center gap-2">
            <ClipboardCheck size={20} className="text-blue-500" />
            <span>月底盘点</span>
          </div>
        }
        className="shadow-sm"
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'new',
              label: (
                <span className="flex items-center gap-1">
                  <ClipboardCheck size={16} />
                  新建盘点
                </span>
              ),
              children: newTabContent,
            },
            {
              key: 'history',
              label: (
                <span className="flex items-center gap-1">
                  <History size={16} />
                  历史记录
                  {stocktakeRecords.length > 0 && (
                    <Tag color="blue" style={{ marginLeft: 4 }}>
                      {stocktakeRecords.length}
                    </Tag>
                  )}
                </span>
              ),
              children: historyTabContent,
            },
          ]}
        />
      </Card>

      <Modal
        title="确认提交盘点结果"
        open={submitModalVisible}
        onOk={handleConfirmSubmit}
        onCancel={() => setSubmitModalVisible(false)}
        okText="确认提交"
        cancelText="取消"
        width={520}
      >
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={18} className="text-orange-500" />
              <span className="font-medium text-gray-800">盘点概览</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-sm">
                <span className="text-gray-500">存放位置：</span>
                <span className="text-gray-800">{selectedLocation}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">材料总数：</span>
                <span className="text-gray-800">{stats.total} 项</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">盘盈：</span>
                <span className="text-green-600 font-medium">{stats.surplus} 项</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">盘亏：</span>
                <span className="text-red-600 font-medium">{stats.deficit} 项</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">相符：</span>
                <span className="text-gray-800">{stats.matched} 项</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">经办人：</span>
                <span className="text-gray-800">{handler.trim()}</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            提交后盘点记录将保存到历史记录中，用于后续核对和审计。请确认所有数据无误后再提交。
          </p>
        </div>
      </Modal>
    </div>
  );
}
