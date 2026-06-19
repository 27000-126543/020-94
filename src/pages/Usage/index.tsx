import { useState, useMemo, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Space,
  Row,
  Col,
  List,
  Tag,
  message,
  Tabs,
  Empty,
  Divider,
  Descriptions,
  Table,
  Alert,
  Statistic,
} from 'antd';
import {
  ArrowRightLeft,
  User,
  Package,
  MapPin,
  Calendar,
  ClipboardList,
  Stethoscope,
  Building2,
  FileText,
  Clock,
  BarChart3,
  Filter,
} from 'lucide-react';
import { useMaterialStore } from '@/store/useMaterialStore';
import { Material } from '@/types';
import { STATUS_MAP, getCategoryLabel } from '@/utils/status';
import { getRemainingDays } from '@/utils/date';
import StatusTag from '@/components/StatusTag/StatusTag';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

interface MaterialOption {
  value: string;
  label: string;
}

export default function UsagePage() {
  const {
    materials,
    usageRecords,
    addUsageRecord,
    getAllLocations,
    getAllDepartments,
    getAllUsers,
    getUsageRecordsByMaterialId,
    getUsageSummaryByDepartment,
    getUsageSummaryByUser,
    getUsageRecordsByMonth,
  } = useMaterialStore();

  const [form] = Form.useForm();
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [recentUsages, setRecentUsages] = useState<typeof usageRecords>([]);
  const [activeTab, setActiveTab] = useState<string>('register');
  const [selectedMonth, setSelectedMonth] = useState<string>(dayjs().format('YYYY-MM'));
  const [filterDepartment, setFilterDepartment] = useState<string | undefined>(undefined);
  const [filterUser, setFilterUser] = useState<string | undefined>(undefined);

  const locations = getAllLocations();

  const materialOptions = useMemo(() => {
    const options: MaterialOption[] = [];
    const seen = new Set<string>();
    materials.forEach((m) => {
      if (!selectedLocation || m.location === selectedLocation) {
        const key = `${m.name}__${m.batchNo}__${m.location}`;
        if (!seen.has(key)) {
          seen.add(key);
          options.push({
            value: m.id,
            label: `${m.name} - ${m.batchNo} (${m.location})`,
          });
        }
      }
    });
    return options;
  }, [materials, selectedLocation]);

  const selectedMaterial = materials.find((m) => m.id === selectedMaterialId);

  useEffect(() => {
    if (selectedMaterialId) {
      const usages = getUsageRecordsByMaterialId(selectedMaterialId).slice(0, 5);
      setRecentUsages(usages);
    } else {
      setRecentUsages([]);
    }
  }, [selectedMaterialId, usageRecords, getUsageRecordsByMaterialId]);

  const handleLocationChange = (value: string) => {
    setSelectedLocation(value);
    setSelectedMaterialId('');
    form.setFieldsValue({ materialId: '', quantity: undefined });
  };

  const handleMaterialChange = (value: string) => {
    setSelectedMaterialId(value);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (!selectedMaterial) {
        message.warning('请选择材料');
        return;
      }

      if (values.quantity > selectedMaterial.quantity) {
        message.error(`库存不足，当前库存仅 ${selectedMaterial.quantity} ${selectedMaterial.unit}`);
        return;
      }

      if (values.remark && !values.remark.trim()) {
        message.warning('请填写真实的备注，不能只输入空格');
        return;
      }

      const departmentVal = Array.isArray(values.department) ? values.department[0] : values.department;
      const userVal = Array.isArray(values.user) ? values.user[0] : values.user;

      if (!departmentVal || !departmentVal.trim()) {
        message.warning('请填写真实的领用科室');
        return;
      }

      if (!userVal || !userVal.trim()) {
        message.warning('请填写真实的领用人姓名');
        return;
      }

      addUsageRecord({
        materialId: selectedMaterial.id,
        date: dayjs().format('YYYY-MM-DD'),
        quantity: values.quantity,
        user: userVal.trim(),
        department: departmentVal.trim(),
        purpose: values.purpose,
        remark: values.remark?.trim() || undefined,
      });

      message.success('领用登记成功');

      form.setFieldsValue({
        quantity: undefined,
        user: undefined,
        department: undefined,
        purpose: '',
        remark: '',
      });
    } catch {
      // validation failed
    }
  };

  const allUsages = useMemo(() => {
    return [...usageRecords]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20);
  }, [usageRecords]);

  const monthOptions = useMemo(() => {
    const months = new Set<string>();
    months.add(dayjs().format('YYYY-MM'));
    usageRecords.forEach((r) => {
      const m = r.date.substring(0, 7);
      months.add(m);
    });
    return [...months].sort().reverse();
  }, [usageRecords]);

  const departments = getAllDepartments();
  const users = getAllUsers();

  const departmentSummary = useMemo(() => {
    return getUsageSummaryByDepartment(selectedMonth, filterDepartment);
  }, [selectedMonth, filterDepartment, getUsageSummaryByDepartment]);

  const userSummary = useMemo(() => {
    return getUsageSummaryByUser(selectedMonth, filterUser);
  }, [selectedMonth, filterUser, getUsageSummaryByUser]);

  const monthUsageRecords = useMemo(() => {
    return getUsageRecordsByMonth(selectedMonth, filterDepartment);
  }, [selectedMonth, filterDepartment, getUsageRecordsByMonth]);

  const totalUsageQty = useMemo(() => {
    return monthUsageRecords.reduce((sum, r) => sum + r.quantity, 0);
  }, [monthUsageRecords]);

  return (
    <div className="space-y-6">
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <div className="flex items-center gap-2">
                <ArrowRightLeft size={20} className="text-blue-500" />
                <span>材料领用登记</span>
              </div>
            }
            className="shadow-sm"
          >
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              className="mb-4"
              items={[
                {
                  key: 'register',
                  label: (
                    <span className="flex items-center gap-1">
                      <ArrowRightLeft size={16} />
                      领用登记
                    </span>
                  ),
                  children: (
                    <Form form={form} layout="vertical" className="mt-4">
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item label="存放位置">
                            <Select
                              placeholder="请选择存放位置"
                              allowClear
                              value={selectedLocation || undefined}
                              onChange={handleLocationChange}
                              size="large"
                            >
                              {locations.map((loc) => (
                                <Option key={loc} value={loc}>
                                  {loc}
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="materialId"
                            label="材料（含批号、位置）"
                            rules={[{ required: true, message: '请选择材料' }]}
                          >
                            <Select
                              placeholder="请先选择位置后选择材料"
                              showSearch
                              optionFilterProp="label"
                              size="large"
                              value={selectedMaterialId || undefined}
                              onChange={handleMaterialChange}
                              filterOption={(input, option) =>
                                String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                              }
                              disabled={!selectedLocation}
                            >
                              {materialOptions.map((opt) => (
                                <Option key={opt.value} value={opt.value} label={opt.label}>
                                  {opt.label}
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>

                      {selectedMaterial && (
                        <>
                          <Divider />
                          <div className="bg-blue-50 rounded-lg p-4 mb-4">
                            <Descriptions column={2} size="small">
                              <Descriptions.Item label="材料名称" span={2}>
                                <span className="font-medium">{selectedMaterial.name}</span>
                                <Tag color="blue" className="ml-2">
                                  {getCategoryLabel(selectedMaterial.category)}
                                </Tag>
                              </Descriptions.Item>
                              <Descriptions.Item label="批号">
                                <span className="font-mono">{selectedMaterial.batchNo}</span>
                              </Descriptions.Item>
                              <Descriptions.Item label="规格">
                                {selectedMaterial.specification}
                              </Descriptions.Item>
                              <Descriptions.Item label="当前库存">
                                <span className="text-lg font-semibold text-blue-600">
                                  {selectedMaterial.quantity}
                                </span>
                                <span className="text-gray-500 ml-1">{selectedMaterial.unit}</span>
                              </Descriptions.Item>
                              <Descriptions.Item label="有效期">
                                {selectedMaterial.expiryDate}
                                <StatusTag status={selectedMaterial.status} className="ml-2" />
                              </Descriptions.Item>
                              <Descriptions.Item label="存放位置">
                                <span className="flex items-center gap-1">
                                  <MapPin size={12} className="text-gray-400" />
                                  {selectedMaterial.location}
                                </span>
                              </Descriptions.Item>
                            </Descriptions>
                          </div>
                        </>
                      )}

                      <Row gutter={16}>
                        <Col span={8}>
                          <Form.Item
                            name="quantity"
                            label="领用数量"
                            rules={[{ required: true, message: '请输入领用数量' }]}
                          >
                            <InputNumber
                              min={1}
                              max={selectedMaterial?.quantity || 999}
                              style={{ width: '100%' }}
                              placeholder="请输入数量"
                              size="large"
                              disabled={!selectedMaterial}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item
                            name="department"
                            label="领用科室"
                            rules={[{ required: true, message: '请输入领用科室' }]}
                          >
                            <Select
                              placeholder="请选择或输入科室"
                              mode="tags"
                              size="large"
                              maxTagCount={1}
                            >
                              {getAllDepartments().map((dept) => (
                                <Option key={dept} value={dept}>
                                  {dept}
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item
                            name="user"
                            label="领用人"
                            rules={[{ required: true, message: '请输入领用人姓名' }]}
                          >
                            <Select
                              placeholder="请选择或输入医生"
                              mode="tags"
                              size="large"
                              maxTagCount={1}
                              prefix={<Stethoscope size={14} className="text-gray-400" />}
                            >
                              {getAllUsers().map((user) => (
                                <Option key={user} value={user}>
                                  {user}
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item name="purpose" label="用途">
                        <Input
                          placeholder="如：补牙、拔牙、贴面修复等"
                          prefix={<ClipboardList size={16} className="text-gray-400" />}
                        />
                      </Form.Item>

                      <Form.Item name="remark" label="备注">
                        <TextArea rows={2} placeholder="请输入备注信息（选填）" maxLength={200} showCount />
                      </Form.Item>

                      <Divider />

                      <Form.Item className="mb-0">
                        <Button
                          type="primary"
                          size="large"
                          icon={<ArrowRightLeft size={18} />}
                          onClick={handleSubmit}
                          disabled={!selectedMaterial}
                        >
                          确认领用
                        </Button>
                      </Form.Item>
                    </Form>
                  ),
                },
                {
                  key: 'records',
                  label: (
                    <span className="flex items-center gap-1">
                      <Clock size={16} />
                      领用记录
                    </span>
                  ),
                  children: (
                    <div className="mt-4">
                      {allUsages.length > 0 ? (
                        <List
                          dataSource={allUsages}
                          renderItem={(item) => {
                            const material = materials.find((m) => m.id === item.materialId);
                            return (
                              <List.Item
                                className="px-0"
                                actions={[
                                  <Tag color="blue" key="qty">
                                    -{item.quantity} {material?.unit || '支'}
                                  </Tag>,
                                ]}
                              >
                                <List.Item.Meta
                                  avatar={
                                    <div
                                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                                      style={{ backgroundColor: '#1677ff' }}
                                    >
                                      <User size={18} />
                                    </div>
                                  }
                                  title={
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium text-gray-800">
                                        {material?.name || '未知材料'}
                                      </span>
                                    </div>
                                  }
                                  description={
                                    <div className="text-sm text-gray-500 space-y-1">
                                      <div className="flex items-center justify-between">
                                        <span className="font-mono text-xs">
                                          {material?.batchNo || ''}
                                        </span>
                                        <span className="text-xs">
                                          <Calendar size={12} className="text-gray-400 mr-1" />
                                          {item.date}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-3 text-xs">
                                        <span className="flex items-center gap-1">
                                          <Building2 size={12} className="text-gray-400" />
                                          {item.department}
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <Stethoscope size={12} className="text-gray-400" />
                                          {item.user}
                                        </span>
                                      </div>
                                      {item.purpose && (
                                        <div className="text-xs text-gray-500">
                                          用途：{item.purpose}
                                        </div>
                                      )}
                                      {item.remark && (
                                        <div className="text-xs text-gray-400">
                                          <FileText size={12} className="text-gray-400 mr-1" />
                                          {item.remark}
                                        </div>
                                      )}
                                    </div>
                                  }
                                />
                              </List.Item>
                            );
                          }}
                        />
                      ) : (
                        <Empty description="暂无领用记录" />
                      )}
                    </div>
                  ),
                },
                {
                  key: 'statistics',
                  label: (
                    <span className="flex items-center gap-1">
                      <BarChart3 size={16} />
                      月度统计
                    </span>
                  ),
                  children: (
                    <div className="mt-4 space-y-6">
                      <Card size="small" className="shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                          <Filter size={16} className="text-gray-500" />
                          <span className="font-medium text-gray-700">筛选条件</span>
                        </div>
                        <Row gutter={[16, 16]}>
                          <Col xs={24} sm={8}>
                            <div className="text-sm text-gray-500 mb-1">月份</div>
                            <Select
                              style={{ width: '100%' }}
                              value={selectedMonth}
                              onChange={setSelectedMonth}
                              options={monthOptions.map((m) => ({ value: m, label: m }))}
                            />
                          </Col>
                          <Col xs={24} sm={8}>
                            <div className="text-sm text-gray-500 mb-1">科室</div>
                            <Select
                              style={{ width: '100%' }}
                              placeholder="全部科室"
                              allowClear
                              value={filterDepartment}
                              onChange={(val) => {
                                setFilterDepartment(val);
                                setFilterUser(undefined);
                              }}
                              options={departments.map((d) => ({ value: d, label: d }))}
                            />
                          </Col>
                          <Col xs={24} sm={8}>
                            <div className="text-sm text-gray-500 mb-1">领用人</div>
                            <Select
                              style={{ width: '100%' }}
                              placeholder="全部医生"
                              allowClear
                              value={filterUser}
                              onChange={setFilterUser}
                              options={users.map((u) => ({ value: u, label: u }))}
                            />
                          </Col>
                        </Row>
                      </Card>

                      <Alert
                        type="info"
                        showIcon
                        message={
                          <div className="flex items-center gap-6">
                            <Statistic title="领用记录数" value={monthUsageRecords.length} valueStyle={{ fontSize: 18 }} />
                            <Statistic title="领用总数量" value={totalUsageQty} valueStyle={{ fontSize: 18 }} suffix="件" />
                            <Statistic title="涉及科室" value={departmentSummary.length} valueStyle={{ fontSize: 18 }} suffix="个" />
                            <Statistic title="领用人数" value={userSummary.length} valueStyle={{ fontSize: 18 }} suffix="人" />
                          </div>
                        }
                      />

                      <Card
                        size="small"
                        title={
                          <div className="flex items-center gap-2">
                            <Building2 size={16} className="text-blue-500" />
                            <span>按科室统计</span>
                          </div>
                        }
                        className="shadow-sm"
                      >
                        {departmentSummary.length > 0 ? (
                          <Table
                            size="small"
                            dataSource={departmentSummary}
                            rowKey="department"
                            pagination={{ pageSize: 5 }}
                            columns={[
                              { title: '科室', dataIndex: 'department', key: 'department', width: 140 },
                              { title: '领用记录数', dataIndex: 'recordCount', key: 'recordCount', width: 100, align: 'center' },
                              { title: '领用人数', dataIndex: 'userCount', key: 'userCount', width: 100, align: 'center' },
                              { title: '领用总数量', dataIndex: 'totalQuantity', key: 'totalQuantity', width: 120, align: 'right',
                                render: (val: number) => <span className="font-semibold text-blue-600">{val}</span>
                              },
                              { title: '领用材料种类', dataIndex: 'materialCount', key: 'materialCount', width: 120, align: 'center' },
                            ]}
                          />
                        ) : (
                          <Empty description="该月无领用记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                        )}
                      </Card>

                      <Card
                        size="small"
                        title={
                          <div className="flex items-center gap-2">
                            <Stethoscope size={16} className="text-blue-500" />
                            <span>按医生统计</span>
                          </div>
                        }
                        className="shadow-sm"
                      >
                        {userSummary.length > 0 ? (
                          <Table
                            size="small"
                            dataSource={userSummary}
                            rowKey="user"
                            pagination={{ pageSize: 5 }}
                            columns={[
                              { title: '医生', dataIndex: 'user', key: 'user', width: 120 },
                              { title: '所属科室', dataIndex: 'department', key: 'department', width: 140 },
                              { title: '领用记录数', dataIndex: 'recordCount', key: 'recordCount', width: 100, align: 'center' },
                              { title: '领用总数量', dataIndex: 'totalQuantity', key: 'totalQuantity', width: 120, align: 'right',
                                render: (val: number) => <span className="font-semibold text-blue-600">{val}</span>
                              },
                              { title: '领用材料种类', dataIndex: 'materialCount', key: 'materialCount', width: 120, align: 'center' },
                            ]}
                          />
                        ) : (
                          <Empty description="该月无领用记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                        )}
                      </Card>

                      <Card
                        size="small"
                        title={
                          <div className="flex items-center gap-2">
                            <ClipboardList size={16} className="text-blue-500" />
                            <span>领用明细</span>
                            <Tag color="blue" className="ml-2">{monthUsageRecords.length} 条</Tag>
                          </div>
                        }
                        className="shadow-sm"
                      >
                        {monthUsageRecords.length > 0 ? (
                          <Table
                            size="small"
                            dataSource={monthUsageRecords}
                            rowKey="id"
                            pagination={{ pageSize: 10 }}
                            columns={[
                              { title: '日期', dataIndex: 'date', key: 'date', width: 110 },
                              { title: '材料名称', dataIndex: 'materialName', key: 'materialName', width: 200 },
                              { title: '批号', dataIndex: 'batchNo', key: 'batchNo', width: 120 },
                              { title: '规格', dataIndex: 'specification', key: 'specification', width: 140 },
                              { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 80, align: 'right',
                                render: (val: number) => <span className="font-semibold text-orange-600">-{val}</span>
                              },
                              { title: '单位', dataIndex: 'unit', key: 'unit', width: 60, align: 'center' },
                              { title: '科室', dataIndex: 'department', key: 'department', width: 120 },
                              { title: '领用人', dataIndex: 'user', key: 'user', width: 100 },
                              { title: '用途', dataIndex: 'purpose', key: 'purpose', width: 140,
                                render: (val: string) => val || <span className="text-gray-400">-</span>
                              },
                            ]}
                          />
                        ) : (
                          <Empty description="该月无领用记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                        )}
                      </Card>
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          {selectedMaterial && (
            <Card
              title={
                <div className="flex items-center gap-2">
                  <Clock size={20} className="text-blue-500" />
                  <span>该材料最近领用</span>
                </div>
              }
              className="shadow-sm"
              extra={<span className="text-sm text-gray-400">最近5条</span>}
            >
              {recentUsages.length > 0 ? (
                <List
                  size="small"
                  dataSource={recentUsages}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        title={
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">{item.user}</span>
                            <Tag color="orange" className="m-0">
                              -{item.quantity}
                            </Tag>
                          </div>
                        }
                        description={
                          <div className="text-xs text-gray-500">
                            <div>{item.date} · {item.department}</div>
                            {item.purpose && <div className="mt-1">用途：{item.purpose}</div>}
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无领用记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>
          )}

          <Card
            title={
              <div className="flex items-center gap-2 mt-6">
                <Package size={20} className="text-blue-500" />
                <span>库存概览</span>
              </div>
            }
            className="shadow-sm"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">材料种类</span>
                <span className="text-lg font-semibold text-gray-800">{materials.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">存放位置</span>
                <span className="text-lg font-semibold text-gray-800">{locations.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">本月领用记录</span>
                <span className="text-lg font-semibold text-blue-600">
                  {usageRecords.filter((r) =>
                    r.date.startsWith(dayjs().format('YYYY-MM'))
                  ).length}
                </span>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
