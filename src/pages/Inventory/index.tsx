import { useState } from 'react';
import {
  Row,
  Col,
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Button,
  Space,
  List,
  Tag,
  Divider,
  message,
  Tabs,
  Empty,
  Popconfirm,
  Alert,
  Descriptions,
} from 'antd';
import {
  ScanLine,
  Plus,
  Package,
  User,
  MapPin,
  Calendar,
  FileText,
  Tag as TagIcon,
  Sparkles,
  Link,
  Syringe,
  Bone,
  Layers,
  Box,
  Clock,
  Trash2,
  CheckCircle,
  ArrowRight,
  Barcode,
  AlertCircle,
} from 'lucide-react';
import { useMaterialStore } from '@/store/useMaterialStore';
import { MaterialCategory, Material, BarcodeInfo } from '@/types';
import { CATEGORY_OPTIONS, getCategoryLabel, STATUS_MAP } from '@/utils/status';
import { getRemainingDays } from '@/utils/date';
import StatusTag from '@/components/StatusTag/StatusTag';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

interface QuickMaterial {
  name: string;
  category: MaterialCategory;
  specification: string;
  unit: string;
  location: string;
}

const quickMaterials: QuickMaterial[] = [
  { name: '3M Z250 光固化树脂', category: 'resin', specification: 'A3 色 4g/支', unit: '支', location: '冷藏柜 A-01' },
  { name: '3M Z350XT 纳米树脂', category: 'resin', specification: 'A2 色 3g/支', unit: '支', location: '冷藏柜 A-02' },
  { name: '可乐丽 粘接剂', category: 'adhesive', specification: '6ml/瓶', unit: '瓶', location: '冷藏柜 B-02' },
  { name: '碧蓝麻 复方阿替卡因', category: 'anesthetic', specification: '1.7ml/支', unit: '支', location: '麻药柜 C-01' },
  { name: '必兰 麻药', category: 'anesthetic', specification: '1.7ml/支', unit: '支', location: '麻药柜 C-03' },
  { name: '登士柏 AH Plus 根管糊剂', category: 'rootCanal', specification: '粉+液套装', unit: '套', location: '材料柜 D-01' },
  { name: '3M 加聚型硅橡胶', category: 'impression', specification: '基质+催化剂', unit: '套', location: '材料柜 E-01' },
  { name: '贺利氏 藻酸盐印模材', category: 'impression', specification: '500g/袋', unit: '袋', location: '材料柜 E-02' },
];

const categoryIconMap: Record<string, React.ReactNode> = {
  resin: <Sparkles size={18} />,
  adhesive: <Link size={18} />,
  anesthetic: <Syringe size={18} />,
  rootCanal: <Bone size={18} />,
  impression: <Layers size={18} />,
  other: <Box size={18} />,
};

type ScanState = 'idle' | 'found' | 'notfound';

export default function Inventory() {
  const { materials, addMaterial, deleteMaterial, getBarcodeInfo, addBarcodeInfo, updateBarcodeLastInfo } = useMaterialStore();
  const [form] = Form.useForm();
  const [scanForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('form');
  const [scanInput, setScanInput] = useState('');
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [scannedBarcode, setScannedBarcode] = useState<string>('');
  const [foundBarcodeInfo, setFoundBarcodeInfo] = useState<BarcodeInfo | null>(null);

  const recentMaterials = [...materials].sort(
    (a, b) => new Date(b.inDate).getTime() - new Date(a.inDate).getTime()
  ).slice(0, 10);

  const handleQuickSelect = (material: QuickMaterial) => {
    form.setFieldsValue({
      name: material.name,
      category: material.category,
      specification: material.specification,
      unit: material.unit,
      location: material.location,
    });
    setActiveTab('form');
    message.info(`已选择：${material.name}`);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      addMaterial({
        name: values.name,
        category: values.category,
        batchNo: values.batchNo,
        specification: values.specification,
        expiryDate: values.expiryDate.format('YYYY-MM-DD'),
        location: values.location,
        quantity: values.quantity,
        unit: values.unit || '支',
        handler: values.handler,
        remark: values.remark,
      });
      message.success('入库登记成功');
      form.resetFields();
    } catch {
      // validation failed
    }
  };

  const handleScanQuery = () => {
    const barcode = scanInput.trim();
    if (!barcode) {
      message.warning('请输入或扫描条码');
      return;
    }
    setScannedBarcode(barcode);
    const info = getBarcodeInfo(barcode);
    if (info) {
      setFoundBarcodeInfo(info);
      setScanState('found');
      const formValues: Record<string, any> = {
        name: info.name,
        category: info.category,
        specification: info.specification,
        unit: info.unit,
        location: info.defaultLocation,
      };
      if (info.defaultBatchNo) {
        formValues.batchNo = info.defaultBatchNo;
      }
      if (info.lastExpiryDate) {
        formValues.expiryDate = dayjs(info.lastExpiryDate);
      }
      if (info.lastQuantity) {
        formValues.quantity = info.lastQuantity;
      }
      scanForm.setFieldsValue(formValues);
    } else {
      setFoundBarcodeInfo(null);
      setScanState('notfound');
      scanForm.resetFields();
    }
  };

  const handleScanSubmit = async () => {
    try {
      const values = await scanForm.validateFields();
      const expiryDateStr = values.expiryDate.format('YYYY-MM-DD');

      addMaterial({
        name: values.name,
        category: values.category,
        batchNo: values.batchNo,
        specification: values.specification,
        expiryDate: expiryDateStr,
        location: values.location,
        quantity: values.quantity,
        unit: values.unit || '支',
        handler: values.handler,
        remark: values.remark,
      });

      if (scannedBarcode) {
        if (scanState === 'notfound') {
          addBarcodeInfo({
            barcode: scannedBarcode,
            name: values.name,
            category: values.category,
            specification: values.specification,
            unit: values.unit || '支',
            defaultLocation: values.location,
            defaultBatchNo: values.batchNo,
            lastExpiryDate: expiryDateStr,
            lastInDate: dayjs().format('YYYY-MM-DD'),
            lastQuantity: values.quantity,
          });
          message.success('入库成功，条码信息已保存');
        } else {
          updateBarcodeLastInfo(scannedBarcode, {
            batchNo: values.batchNo,
            expiryDate: expiryDateStr,
            quantity: values.quantity,
          });
          message.success('入库登记成功，条码信息已更新');
        }
      } else {
        message.success('入库登记成功');
      }

      scanForm.resetFields();
      setScanState('idle');
      setScannedBarcode('');
      setScanInput('');
      setFoundBarcodeInfo(null);
    } catch {
      // validation failed
    }
  };

  const handleResetScan = () => {
    scanForm.resetFields();
    setScanState('idle');
    setScannedBarcode('');
    setScanInput('');
    setFoundBarcodeInfo(null);
  };

  const handleDelete = (id: string) => {
    deleteMaterial(id);
    message.success('已删除入库记录');
  };

  const tabItems = [
    {
      key: 'form',
      label: (
        <span className="flex items-center gap-1">
          <Plus size={16} />
          手动录入
        </span>
      ),
    },
    {
      key: 'scan',
      label: (
        <span className="flex items-center gap-1">
          <ScanLine size={16} />
          扫码录入
        </span>
      ),
    },
    {
      key: 'quick',
      label: (
        <span className="flex items-center gap-1">
          <Package size={16} />
          常用材料
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Row gutter={[24, 24]}>
        {/* 左侧 - 入库表单 */}
        <Col xs={24} lg={16}>
          <Card
            title={
              <div className="flex items-center gap-2">
                <Package size={20} className="text-blue-500" />
                <span>材料入库登记</span>
              </div>
            }
            className="shadow-sm"
          >
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={tabItems}
              className="mb-4"
            />

            {activeTab === 'form' && (
              <Form form={form} layout="vertical" className="mt-4">
                <Row gutter={16}>
                  <Col span={16}>
                    <Form.Item
                      name="name"
                      label="材料名称"
                      rules={[{ required: true, message: '请输入材料名称' }]}
                    >
                      <Input placeholder="请输入材料名称" size="large" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="category"
                      label="材料分类"
                      rules={[{ required: true, message: '请选择材料分类' }]}
                    >
                      <Select placeholder="请选择分类" size="large">
                        {CATEGORY_OPTIONS.map((opt) => (
                          <Option key={opt.value} value={opt.value}>
                            <span className="flex items-center gap-2">
                              {categoryIconMap[opt.value]}
                              {opt.label}
                            </span>
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="batchNo"
                      label="生产批号"
                      rules={[{ required: true, message: '请输入生产批号' }]}
                    >
                      <Input placeholder="请输入生产批号" prefix={<TagIcon size={16} className="text-gray-400" />} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="specification"
                      label="规格型号"
                      rules={[{ required: true, message: '请输入规格型号' }]}
                    >
                      <Input placeholder="如：A3 色 4g/支" prefix={<FileText size={16} className="text-gray-400" />} />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="expiryDate"
                      label="有效期至"
                      rules={[{ required: true, message: '请选择有效期' }]}
                    >
                      <DatePicker
                        style={{ width: '100%' }}
                        placeholder="请选择有效期"
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="location"
                      label="存放位置"
                      rules={[{ required: true, message: '请输入存放位置' }]}
                    >
                      <Input placeholder="如：冷藏柜 A-01" prefix={<MapPin size={16} className="text-gray-400" />} />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="quantity"
                      label="入库数量"
                      rules={[{ required: true, message: '请输入入库数量' }]}
                    >
                      <InputNumber
                        min={1}
                        style={{ width: '100%' }}
                        placeholder="请输入数量"
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="unit" label="计量单位" initialValue="支">
                      <Select size="large">
                        <Option value="支">支</Option>
                        <Option value="瓶">瓶</Option>
                        <Option value="袋">袋</Option>
                        <Option value="套">套</Option>
                        <Option value="盒">盒</Option>
                        <Option value="包">包</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="handler"
                  label="经办人"
                  rules={[{ required: true, message: '请输入经办人姓名' }]}
                >
                  <Input placeholder="请输入经办人姓名" prefix={<User size={16} className="text-gray-400" />} />
                </Form.Item>

                <Form.Item name="remark" label="备注">
                  <TextArea rows={3} placeholder="请输入备注信息（选填）" maxLength={200} showCount />
                </Form.Item>

                <Divider />

                <Form.Item className="mb-0">
                  <Space>
                    <Button
                      type="primary"
                      size="large"
                      icon={<Plus size={18} />}
                      onClick={handleSubmit}
                    >
                      确认入库
                    </Button>
                    <Button size="large" onClick={() => form.resetFields()}>
                      重置
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            )}

            {activeTab === 'scan' && (
              <div className="mt-4">
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                      <Barcode size={28} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-800 m-0">扫码快速入库</h3>
                      <p className="text-sm text-gray-500 m-0">使用条码枪扫描或手动输入包装条码</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Input.Search
                      size="large"
                      placeholder="请扫描或输入13位条码，例如：6901234567890"
                      value={scanInput}
                      onChange={(e) => setScanInput(e.target.value)}
                      onSearch={handleScanQuery}
                      enterButton="查询"
                      allowClear
                      style={{ flex: 1 }}
                      prefix={<ScanLine size={18} className="text-gray-400" />}
                    />
                    {scanState !== 'idle' && (
                      <Button size="large" onClick={handleResetScan}>
                        重新扫码
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    提示：首次扫码新材料需补全信息，之后再次扫码会自动带出
                  </p>
                </div>

                {scanState === 'found' && foundBarcodeInfo && (
                  <>
                    <Alert
                      type="success"
                      showIcon
                      icon={<CheckCircle size={18} />}
                      message="条码已识别"
                      description={
                        <div>
                          已从条码库自动带出材料信息及最近入库记录，请核对或修改后确认入库
                        </div>
                      }
                      className="mb-4"
                    />
                    <Descriptions
                      column={2}
                      size="small"
                      className="mb-4"
                      bordered
                    >
                      <Descriptions.Item label="材料名称" span={2}>{foundBarcodeInfo.name}</Descriptions.Item>
                      <Descriptions.Item label="分类">{getCategoryLabel(foundBarcodeInfo.category)}</Descriptions.Item>
                      <Descriptions.Item label="规格">{foundBarcodeInfo.specification}</Descriptions.Item>
                      <Descriptions.Item label="单位">{foundBarcodeInfo.unit}</Descriptions.Item>
                      <Descriptions.Item label="存放位置">{foundBarcodeInfo.defaultLocation}</Descriptions.Item>
                      {foundBarcodeInfo.defaultBatchNo && (
                        <Descriptions.Item label="默认批号" span={2}>
                          <Tag color="blue">{foundBarcodeInfo.defaultBatchNo}</Tag>
                        </Descriptions.Item>
                      )}
                      {foundBarcodeInfo.lastExpiryDate && (
                        <Descriptions.Item label="最近有效期">{foundBarcodeInfo.lastExpiryDate}</Descriptions.Item>
                      )}
                      {foundBarcodeInfo.lastQuantity && (
                        <Descriptions.Item label="最近入库量">{foundBarcodeInfo.lastQuantity} {foundBarcodeInfo.unit}</Descriptions.Item>
                      )}
                    </Descriptions>
                  </>
                )}

                {scanState === 'notfound' && (
                  <Alert
                    type="warning"
                    showIcon
                    icon={<AlertCircle size={18} />}
                    message="新条码未登记"
                    description="该条码尚未在系统中登记，请完整填写以下信息，入库成功后将自动保存条码信息"
                    className="mb-4"
                  />
                )}

                {scanState !== 'idle' && (
                  <Form form={scanForm} layout="vertical">
                    {scanState === 'notfound' && (
                      <Row gutter={16}>
                        <Col span={16}>
                          <Form.Item
                            name="name"
                            label="材料名称"
                            rules={[{ required: true, message: '请输入材料名称' }]}
                          >
                            <Input placeholder="请输入材料名称" size="large" />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item
                            name="category"
                            label="材料分类"
                            rules={[{ required: true, message: '请选择材料分类' }]}
                          >
                            <Select placeholder="请选择分类" size="large">
                              {CATEGORY_OPTIONS.map((opt) => (
                                <Option key={opt.value} value={opt.value}>
                                  <span className="flex items-center gap-2">
                                    {categoryIconMap[opt.value]}
                                    {opt.label}
                                  </span>
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>
                    )}

                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="batchNo"
                          label="生产批号"
                          rules={[{ required: true, message: '请输入生产批号' }]}
                        >
                          <Input placeholder="请输入生产批号" prefix={<TagIcon size={16} className="text-gray-400" />} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="specification"
                          label="规格型号"
                          rules={[{ required: true, message: '请输入规格型号' }]}
                        >
                          <Input placeholder="如：A3 色 4g/支" prefix={<FileText size={16} className="text-gray-400" />} />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="expiryDate"
                          label="有效期至"
                          rules={[{ required: true, message: '请选择有效期' }]}
                        >
                          <DatePicker
                            style={{ width: '100%' }}
                            placeholder="请选择有效期"
                            size="large"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="location"
                          label="存放位置"
                          rules={[{ required: true, message: '请输入存放位置' }]}
                        >
                          <Input placeholder="如：冷藏柜 A-01" prefix={<MapPin size={16} className="text-gray-400" />} />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="quantity"
                          label="入库数量"
                          rules={[{ required: true, message: '请输入入库数量' }]}
                        >
                          <InputNumber
                            min={1}
                            style={{ width: '100%' }}
                            placeholder="请输入数量"
                            size="large"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="unit" label="计量单位" initialValue="支">
                          <Select size="large">
                            <Option value="支">支</Option>
                            <Option value="瓶">瓶</Option>
                            <Option value="袋">袋</Option>
                            <Option value="套">套</Option>
                            <Option value="盒">盒</Option>
                            <Option value="包">包</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item
                      name="handler"
                      label="经办人"
                      rules={[{ required: true, message: '请输入经办人姓名' }]}
                    >
                      <Input placeholder="请输入经办人姓名" prefix={<User size={16} className="text-gray-400" />} />
                    </Form.Item>

                    <Form.Item name="remark" label="备注">
                      <TextArea rows={2} placeholder="请输入备注信息（选填）" maxLength={200} showCount />
                    </Form.Item>

                    <Divider />

                    <Form.Item className="mb-0">
                      <Space>
                        <Button
                          type="primary"
                          size="large"
                          icon={<Plus size={18} />}
                          onClick={handleScanSubmit}
                        >
                          确认入库
                          {scanState === 'notfound' && '并保存条码'}
                        </Button>
                      </Space>
                    </Form.Item>
                  </Form>
                )}
              </div>
            )}

            {activeTab === 'quick' && (
              <div className="mt-4">
                <p className="text-gray-500 text-sm mb-4">点击常用材料快速填充信息</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {quickMaterials.map((material, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer transition-all group"
                      onClick={() => handleQuickSelect(material)}
                    >
                      <div
                        className="w-10 h-10 rounded-lg mb-3 flex items-center justify-center text-white"
                        style={{ backgroundColor: `hsl(${index * 45}, 70%, 55%)` }}
                      >
                        {categoryIconMap[material.category]}
                      </div>
                      <h4 className="text-sm font-medium text-gray-800 mb-1 line-clamp-2 group-hover:text-blue-600">
                        {material.name}
                      </h4>
                      <p className="text-xs text-gray-400">{material.specification}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </Col>

        {/* 右侧 - 最近入库记录 */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <div className="flex items-center gap-2">
                <Clock size={20} className="text-blue-500" />
                <span>最近入库</span>
              </div>
            }
            className="shadow-sm"
            extra={<span className="text-sm text-gray-400">最近10条</span>}
          >
            {recentMaterials.length > 0 ? (
              <List
                dataSource={recentMaterials}
                renderItem={(item: Material) => {
                  const remainingDays = getRemainingDays(item.expiryDate);
                  return (
                    <List.Item
                      className="px-0"
                      actions={[
                        <Popconfirm
                          key="delete"
                          title="确定删除此入库记录？"
                          onConfirm={() => handleDelete(item.id)}
                          okText="确定"
                          cancelText="取消"
                        >
                          <Button
                            type="text"
                            size="small"
                            danger
                            icon={<Trash2 size={14} />}
                          >
                            删除
                          </Button>
                        </Popconfirm>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                            style={{ backgroundColor: STATUS_MAP[item.status].color }}
                          >
                            {item.name.charAt(0)}
                          </div>
                        }
                        title={
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-800">{item.name}</span>
                            <StatusTag status={item.status} />
                          </div>
                        }
                        description={
                          <div className="text-sm text-gray-500 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs">{item.batchNo}</span>
                              <Tag color="blue">{item.quantity} {item.unit}</Tag>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <MapPin size={12} className="text-gray-400" />
                              <span>{item.location}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <Calendar size={12} className="text-gray-400" />
                              <span>{item.inDate} 入库</span>
                            </div>
                            {remainingDays > 0 && remainingDays <= 90 && (
                              <div className="text-xs text-orange-500">
                                剩余 {remainingDays} 天到期
                              </div>
                            )}
                            {remainingDays <= 0 && (
                              <div className="text-xs text-red-500">
                                已过期 {Math.abs(remainingDays)} 天
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
              <Empty description="暂无入库记录" />
            )}
          </Card>

          {/* 分类统计 */}
          <Card
            title={
              <div className="flex items-center gap-2 mt-6">
                <TagIcon size={20} className="text-blue-500" />
                <span>分类库存</span>
              </div>
            }
            className="shadow-sm"
          >
            <div className="space-y-3">
              {CATEGORY_OPTIONS.map((cat, idx) => {
                const count = materials.filter((m) => m.category === cat.value).length;
                const totalQty = materials
                  .filter((m) => m.category === cat.value)
                  .reduce((sum, m) => sum + m.quantity, 0);
                return (
                  <div key={cat.value} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-md flex items-center justify-center text-white"
                        style={{ backgroundColor: `hsl(${idx * 45}, 70%, 55%)` }}
                      >
                        {categoryIconMap[cat.value]}
                      </div>
                      <span className="text-gray-700">{cat.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-gray-800">{count}</span>
                      <span className="text-gray-400 text-sm ml-1">种 / {totalQty}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
