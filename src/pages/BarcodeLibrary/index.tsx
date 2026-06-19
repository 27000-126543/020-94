import { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Modal,
  Form,
  Select,
  message,
  Popconfirm,
  Tag,
  Row,
  Col,
} from 'antd';
import {
  Barcode,
  Plus,
  Search,
  Edit2,
  Trash2,
  Tag as TagIcon,
  MapPin,
  Package,
  Calendar,
  Hash,
} from 'lucide-react';
import { useMaterialStore } from '@/store/useMaterialStore';
import { BarcodeInfo, MaterialCategory } from '@/types';
import { CATEGORY_OPTIONS, getCategoryLabel } from '@/utils/status';

const { Option } = Select;
const { Search: SearchInput } = Input;

export default function BarcodeLibraryPage() {
  const {
    barcodeLibrary,
    addBarcodeInfo,
    updateBarcodeInfo,
    deleteBarcodeInfo,
    getBarcodeInfo,
  } = useMaterialStore();

  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBarcode, setEditingBarcode] = useState<string | null>(null);
  const [form] = Form.useForm();

  const filteredBarcodes = barcodeLibrary.filter(
    (b) =>
      b.barcode.toLowerCase().includes(searchText.toLowerCase()) ||
      b.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleAdd = () => {
    setEditingBarcode(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (barcode: string) => {
    const info = getBarcodeInfo(barcode);
    if (info) {
      setEditingBarcode(barcode);
      form.setFieldsValue(info);
      setModalVisible(true);
    }
  };

  const handleDelete = (barcode: string) => {
    deleteBarcodeInfo(barcode);
    message.success('已删除条码资料');
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const info: BarcodeInfo = {
        barcode: values.barcode,
        name: values.name,
        category: values.category,
        specification: values.specification,
        unit: values.unit,
        defaultLocation: values.defaultLocation,
        defaultBatchNo: values.defaultBatchNo || undefined,
        lastExpiryDate: values.lastExpiryDate || undefined,
        lastQuantity: values.lastQuantity || undefined,
      };

      if (editingBarcode) {
        if (editingBarcode !== values.barcode) {
          deleteBarcodeInfo(editingBarcode);
        }
        updateBarcodeInfo(values.barcode, info);
        message.success('条码资料已更新');
      } else {
        const exists = getBarcodeInfo(values.barcode);
        if (exists) {
          message.error('该条码已存在');
          return;
        }
        addBarcodeInfo(info);
        message.success('条码资料已添加');
      }

      setModalVisible(false);
      form.resetFields();
    } catch {
      // validation failed
    }
  };

  const columns = [
    {
      title: '条码',
      dataIndex: 'barcode',
      key: 'barcode',
      width: 180,
      render: (text: string) => (
        <span className="font-mono text-sm">{text}</span>
      ),
    },
    {
      title: '材料名称',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      render: (text: string, record: BarcodeInfo) => (
        <div>
          <div className="font-medium text-gray-800">{text}</div>
          <Tag color="blue" className="mt-1">
            {getCategoryLabel(record.category)}
          </Tag>
        </div>
      ),
    },
    {
      title: '规格型号',
      dataIndex: 'specification',
      key: 'specification',
      width: 160,
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
    },
    {
      title: '默认位置',
      dataIndex: 'defaultLocation',
      key: 'defaultLocation',
      width: 140,
      render: (text: string) => (
        <span className="flex items-center gap-1">
          <MapPin size={12} className="text-gray-400" />
          {text}
        </span>
      ),
    },
    {
      title: '默认批号',
      dataIndex: 'defaultBatchNo',
      key: 'defaultBatchNo',
      width: 120,
      render: (text?: string) => (
        text ? <span className="font-mono text-xs text-gray-600">{text}</span> : <span className="text-gray-400">-</span>
      ),
    },
    {
      title: '最近有效期',
      dataIndex: 'lastExpiryDate',
      key: 'lastExpiryDate',
      width: 120,
      render: (text?: string) => (
        text ? (
          <span className="flex items-center gap-1 text-sm">
            <Calendar size={12} className="text-gray-400" />
            {text}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        )
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: BarcodeInfo) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<Edit2 size={14} />}
            onClick={() => handleEdit(record.barcode)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此条码资料？"
            onConfirm={() => handleDelete(record.barcode)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="text" size="small" danger icon={<Trash2 size={14} />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card
        title={
          <div className="flex items-center gap-2">
            <Barcode size={20} className="text-blue-500" />
            <span>条码资料维护</span>
          </div>
        }
        className="shadow-sm"
        extra={
          <Space>
            <SearchInput
              placeholder="搜索条码或材料名称"
              prefix={<Search size={16} />}
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 280 }}
            />
            <Button type="primary" icon={<Plus size={16} />} onClick={handleAdd}>
              新增条码
            </Button>
          </Space>
        }
      >
        <p className="text-gray-500 text-sm mb-4">
          维护常用材料的条码信息，扫码入库时自动带出材料名称、规格、默认位置等信息，提高入库效率
        </p>
        <Table
          columns={columns}
          dataSource={filteredBarcodes}
          rowKey="barcode"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条条码`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title={editingBarcode ? '编辑条码资料' : '新增条码资料'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        okText="保存"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="barcode"
                label="条码编号"
                rules={[{ required: true, message: '请输入条码编号' }]}
              >
                <Input placeholder="请输入条码编号" prefix={<Barcode size={16} className="text-gray-400" />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label="材料分类"
                rules={[{ required: true, message: '请选择分类' }]}
              >
                <Select placeholder="请选择分类">
                  {CATEGORY_OPTIONS.map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="name"
            label="材料名称"
            rules={[{ required: true, message: '请输入材料名称' }]}
          >
            <Input placeholder="请输入材料名称" prefix={<Package size={16} className="text-gray-400" />} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="specification"
                label="规格型号"
                rules={[{ required: true, message: '请输入规格型号' }]}
              >
                <Input placeholder="如：A3 色 4g/支" prefix={<TagIcon size={16} className="text-gray-400" />} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="unit"
                label="计量单位"
                rules={[{ required: true, message: '请输入单位' }]}
                initialValue="支"
              >
                <Select placeholder="请选择">
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
            name="defaultLocation"
            label="默认存放位置"
            rules={[{ required: true, message: '请输入默认存放位置' }]}
          >
            <Input placeholder="如：冷藏柜 A-01" prefix={<MapPin size={16} className="text-gray-400" />} />
          </Form.Item>

          <div className="bg-gray-50 rounded-lg p-4 mb-2">
            <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Hash size={14} />
              入库默认值（选填）
            </p>
            <p className="text-xs text-gray-500 mb-3">
              扫码入库时会自动带出这些默认值，可根据实际情况修改
            </p>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="defaultBatchNo" label="默认批号">
                  <Input placeholder="请输入默认批号" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="lastQuantity" label="默认入库数量">
                  <Input type="number" min={1} placeholder="请输入数量" />
                </Form.Item>
              </Col>
            </Row>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
