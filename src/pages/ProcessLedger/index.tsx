import { useState, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Select,
  Input,
  DatePicker,
  Button,
  Table,
  Tag,
  Space,
  Statistic,
  List,
  Empty,
  message,
  Divider,
} from 'antd';
import {
  Download,
  FileText,
  RefreshCw,
  Send,
  Trash2,
  User,
  Calendar,
  Filter,
  Package,
  FileSpreadsheet,
} from 'lucide-react';
import { useMaterialStore } from '@/store/useMaterialStore';
import { ProcessRecord, ProcessType, FollowUpStatus } from '@/types';
import { PROCESS_TYPE_MAP, FOLLOWUP_STATUS_MAP, getCategoryLabel } from '@/utils/status';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

export default function ProcessLedger() {
  const {
    processRecords,
    filterProcessRecords,
    exportProcessRecords,
    getMaterialById,
    getAllHandlers,
  } = useMaterialStore();

  const [month, setMonth] = useState<string>(dayjs().format('YYYY-MM'));
  const [processType, setProcessType] = useState<ProcessType | 'all'>('all');
  const [handler, setHandler] = useState<string>('');
  const [followUpStatus, setFollowUpStatus] = useState<FollowUpStatus | 'all'>('all');

  const allHandlers = useMemo(() => getAllHandlers(), [processRecords]);

  const filteredRecords = useMemo(
    () =>
      filterProcessRecords({
        month,
        type: processType,
        handler,
        followUpStatus,
      }),
    [processRecords, month, processType, handler, followUpStatus]
  );

  const stats = useMemo(() => {
    const priorityUse = filteredRecords.filter((r) => r.type === 'priorityUse').length;
    const returnExchange = filteredRecords.filter((r) => r.type === 'returnExchange').length;
    const scrap = filteredRecords.filter((r) => r.type === 'scrap').length;
    return { total: filteredRecords.length, priorityUse, returnExchange, scrap };
  }, [filteredRecords]);

  const handleExport = () => {
    const csv = exportProcessRecords({ month, type: processType, handler, followUpStatus });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `处理台账_${month || '全部'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success('导出成功');
  };

  const handleReset = () => {
    setMonth(dayjs().format('YYYY-MM'));
    setProcessType('all');
    setHandler('');
    setFollowUpStatus('all');
  };

  const getMonthOptions = () => {
    const months = new Set<string>();
    processRecords.forEach((r) => {
      months.add(r.date.substring(0, 7));
    });
    months.add(dayjs().format('YYYY-MM'));
    return Array.from(months).sort().reverse();
  };

  const columns = [
    {
      title: '处理日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      sorter: (a: ProcessRecord, b: ProcessRecord) =>
        new Date(b.date).getTime() - new Date(a.date).getTime(),
      render: (text: string) => (
        <div className="flex items-center gap-1">
          <Calendar size={14} className="text-gray-400" />
          <span>{text}</span>
        </div>
      ),
    },
    {
      title: '处理方式',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      filters: [
        { text: '优先使用', value: 'priorityUse' },
        { text: '退换联系', value: 'returnExchange' },
        { text: '报废登记', value: 'scrap' },
      ],
      onFilter: (value: string, record: ProcessRecord) => record.type === value,
      render: (type: ProcessType) => {
        const info = PROCESS_TYPE_MAP[type];
        return (
          <Tag color={info.color} style={{ border: 'none', padding: '2px 10px' }}>
            <span className="flex items-center gap-1">
              {type === 'priorityUse' && <RefreshCw size={12} />}
              {type === 'returnExchange' && <Send size={12} />}
              {type === 'scrap' && <Trash2 size={12} />}
              {info.label}
            </span>
          </Tag>
        );
      },
    },
    {
      title: '材料信息',
      key: 'material',
      width: 280,
      render: (_: unknown, record: ProcessRecord) => {
        const material = getMaterialById(record.materialId);
        if (!material) {
          return (
            <div className="text-gray-400">
              <FileText size={14} className="inline mr-1" />
              材料已删除
            </div>
          );
        }
        return (
          <div>
            <div className="font-medium text-gray-800">{material.name}</div>
            <div className="text-xs text-gray-400">
              {getCategoryLabel(material.category)} · 批号 {material.batchNo}
            </div>
          </div>
        );
      },
    },
    {
      title: '规格',
      key: 'specification',
      width: 160,
      render: (_: unknown, record: ProcessRecord) => {
        const material = getMaterialById(record.materialId);
        return <span className="text-gray-600">{material?.specification || '-'}</span>;
      },
    },
    {
      title: '经办人',
      dataIndex: 'handler',
      key: 'handler',
      width: 120,
      render: (text: string) => (
        <div className="flex items-center gap-1">
          <User size={14} className="text-gray-400" />
          <span>{text}</span>
        </div>
      ),
    },
    {
      title: '跟进状态',
      dataIndex: 'followUpStatus',
      key: 'followUpStatus',
      width: 140,
      render: (status: FollowUpStatus | undefined, record: ProcessRecord) => {
        if (record.type !== 'returnExchange') {
          return <span className="text-gray-400">-</span>;
        }
        const info = FOLLOWUP_STATUS_MAP[status || 'pending'];
        return (
          <Tag color={info.color} style={{ border: 'none' }}>
            {info.label}
          </Tag>
        );
      },
    },
    {
      title: '备注说明',
      dataIndex: 'remark',
      key: 'remark',
      render: (text: string) => (
        <div className="text-gray-600 text-sm max-w-xs">
          {text || <span className="text-gray-400">-</span>}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={12} md={6} lg={6} xl={6}>
          <Card className="shadow-sm">
            <Statistic
              title={
                <span className="flex items-center gap-1 text-gray-500">
                  <FileText size={14} />
                  处理总数
                </span>
              }
              value={stats.total}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} lg={6} xl={6}>
          <Card className="shadow-sm">
            <Statistic
              title={
                <span className="flex items-center gap-1 text-gray-500">
                  <RefreshCw size={14} />
                  优先使用
                </span>
              }
              value={stats.priorityUse}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} lg={6} xl={6}>
          <Card className="shadow-sm">
            <Statistic
              title={
                <span className="flex items-center gap-1 text-gray-500">
                  <Send size={14} />
                  退换联系
                </span>
              }
              value={stats.returnExchange}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} lg={6} xl={6}>
          <Card className="shadow-sm">
            <Statistic
              title={
                <span className="flex items-center gap-1 text-gray-500">
                  <Trash2 size={14} />
                  报废登记
                </span>
              }
              value={stats.scrap}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 筛选栏 */}
      <Card
        className="shadow-sm"
        title={
          <span className="flex items-center gap-2">
            <Filter size={18} className="text-blue-500" />
            筛选条件
          </span>
        }
        extra={
          <Space>
            <Button onClick={handleReset} icon={<RefreshCw size={14} />}>
              重置
            </Button>
            <Button
              type="primary"
              icon={<Download size={14} />}
              onClick={handleExport}
              disabled={filteredRecords.length === 0}
            >
              导出 CSV
            </Button>
          </Space>
        }
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8} lg={6}>
            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-sm whitespace-nowrap">月份：</span>
              <Select
                value={month}
                onChange={setMonth}
                style={{ width: '100%' }}
                allowClear
                placeholder="全部月份"
              >
                {getMonthOptions().map((m) => (
                  <Option key={m} value={m}>
                    {m}
                  </Option>
                ))}
              </Select>
            </div>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-sm whitespace-nowrap">处理方式：</span>
              <Select
                value={processType}
                onChange={setProcessType}
                style={{ width: '100%' }}
              >
                <Option value="all">全部方式</Option>
                <Option value="priorityUse">优先使用</Option>
                <Option value="returnExchange">退换联系</Option>
                <Option value="scrap">报废登记</Option>
              </Select>
            </div>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-sm whitespace-nowrap">经办人：</span>
              <Select
                value={handler || undefined}
                onChange={(value) => setHandler(value || '')}
                style={{ width: '100%' }}
                allowClear
                showSearch
                placeholder="全部经办人"
                filterOption={(input, option) =>
                  (option?.label as string).toLowerCase().includes(input.toLowerCase())
                }
              >
                {allHandlers.map((h) => (
                  <Option key={h} value={h} label={h}>
                    {h}
                  </Option>
                ))}
              </Select>
            </div>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-sm whitespace-nowrap">跟进状态：</span>
              <Select
                value={followUpStatus}
                onChange={setFollowUpStatus}
                style={{ width: '100%' }}
                disabled={processType !== 'all' && processType !== 'returnExchange'}
              >
                <Option value="all">全部状态</Option>
                <Option value="pending">待联系</Option>
                <Option value="contacted">已联系供应商</Option>
                <Option value="exchanged">已换货</Option>
                <Option value="closed">已关闭</Option>
              </Select>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 台账列表 */}
      <Card
        className="shadow-sm"
        title={
          <span className="flex items-center gap-2">
            <FileSpreadsheet size={18} className="text-blue-500" />
            处理记录
            <Tag color="blue">{filteredRecords.length} 条</Tag>
          </span>
        }
      >
        {filteredRecords.length > 0 ? (
          <Table
            columns={columns}
            dataSource={filteredRecords}
            rowKey="id"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条记录`,
            }}
            scroll={{ x: 1000 }}
            expandable={{
              expandedRowRender: (record) => {
                const material = getMaterialById(record.materialId);
                if (!material) return <Empty description="材料信息不存在" />;
                return (
                  <div className="bg-gray-50 -mx-4 -my-2 p-4 rounded-lg">
                    <Row gutter={24}>
                      <Col span={8}>
                        <p className="text-sm text-gray-500 mb-1">材料名称</p>
                        <p className="font-medium text-gray-800 m-0">{material.name}</p>
                      </Col>
                      <Col span={8}>
                        <p className="text-sm text-gray-500 mb-1">生产批号</p>
                        <p className="font-mono text-gray-800 m-0">{material.batchNo}</p>
                      </Col>
                      <Col span={8}>
                        <p className="text-sm text-gray-500 mb-1">规格型号</p>
                        <p className="text-gray-800 m-0">{material.specification}</p>
                      </Col>
                    </Row>
                    <Divider style={{ margin: '12px 0' }} />
                    <Row gutter={24}>
                      <Col span={8}>
                        <p className="text-sm text-gray-500 mb-1">有效期至</p>
                        <p className="text-gray-800 m-0">{material.expiryDate}</p>
                      </Col>
                      <Col span={8}>
                        <p className="text-sm text-gray-500 mb-1">存放位置</p>
                        <p className="text-gray-800 m-0">{material.location}</p>
                      </Col>
                      <Col span={8}>
                        <p className="text-sm text-gray-500 mb-1">当前库存</p>
                        <p className="text-gray-800 m-0">
                          {material.quantity} {material.unit}
                        </p>
                      </Col>
                    </Row>
                  </div>
                );
              },
              rowExpandable: (record) => !!getMaterialById(record.materialId),
            }}
          />
        ) : (
          <Empty description="暂无处理记录，请调整筛选条件" />
        )}
      </Card>
    </div>
  );
}
