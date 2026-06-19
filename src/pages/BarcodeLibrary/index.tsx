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
  DatePicker,
  InputNumber,
  Divider,
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
  CalendarDays,
  PackagePlus,
} from 'lucide-react';
import { useMaterialStore } from '@/store/useMaterialStore';
import { BarcodeInfo, MaterialCategory } from '@/types';
import { CATEGORY_OPTIONS, getCategoryLabel } from '@/utils/status';
import dayjs from 'dayjs';

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
      form.setFieldsValue({
        ...info,
        lastExpiryDate: info.lastExpiryDate ? dayjs(info.lastExpiryDate) : undefined,
        lastInDate: info.lastInDate ? dayjs(info.lastInDate) : undefined,
      });
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
      const newBarcode = values.barcode;

      if (!newBarcode || !newBarcode.trim()) {
        message.warning('请输入有效的条码编号');
        return;
      }

      if (values.name && !values.name.trim()) {
        message.warning('材料名称不能只输入空格');
        return;
      }

      if (values.defaultLocation && !values.defaultLocation.trim()) {
        message.warning('默认存放位置不能只输入空格');
        return;
      }

      const info: BarcodeInfo = {
        barcode: newBarcode.trim(),
        name: values.name.trim(),
        category: values.category,
        specification: values.specification ? values.specification.trim() : values.specification,
        unit: values.unit,
        defaultLocation: values.defaultLocation.trim(),
        defaultBatchNo: values.defaultBatchNo && values.defaultBatchNo.trim() ? values.defaultBatchNo.trim() : undefined,
        defaultExpiryDate: values.defaultExpiryDate ? values.defaultExpiryDate.format('YYYY-MM-DD') : undefined,
        lastInDate: values.lastInDate ? values.lastInDate.format('YYYY-MM-DD') : undefined,
        lastExpiryDate: values.lastExpiryDate ? values.lastExpiryDate.format('YYYY-MM-DD') : undefined,
        lastQuantity: values.lastQuantity || undefined,
      };

      if (editingBarcode) {
        if (editingBarcode !== newBarcode.trim()) {
          const exists = getBarcodeInfo(newBarcode.trim());
          if (exists) {
            message.error('目标条码编号已存在，请使用其他编号');
            return;
          }
          const oldInfo = getBarcodeInfo(editingBarcode);
          if (oldInfo) {
            const mergedInfo: BarcodeInfo = {
              ...oldInfo,
              ...info,
            };
            addBarcodeInfo(mergedInfo);
            deleteBarcodeInfo(editingBarcode);
            message.success('条码编号已更新，资料未丢失');
          }
        } else {
          const oldInfo = getBarcodeInfo(editingBarcode);
          if (oldInfo) {
            const mergedInfo: BarcodeInfo = {
              ...oldInfo,
              ...info,
            };
            updateBarcodeInfo(editingBarcode, mergedInfo);
            message.success('条码资料已更新');
          }
        }
      } else {
        const exists = getBarcodeInfo(newBarcode.trim());
        if (exists) {
          Modal.confirm({
            title: '条码已存在',
            content: `条码 ${newBarcode.trim()} 已存在于资料库中，是否覆盖更新？`,
            okText: '覆盖更新',
            cancelText: '取消',
            onOk: () => {
              updateBarcodeInfo(newBarcode.trim(), info);
              message.success('条码资料已覆盖更新');
            },
          });
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
      title: '默认有效期',
      dataIndex: 'defaultExpiryDate',
      key: 'defaultExpiryDate',
      width: 120,
      render: (text?: string) => (
        text ? (
          <span className="flex items-center gap-1 text-sm">
            <CalendarDays size={12} className="text-green-500" />
            {text}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        )
      ),
    },
    {
      title: '最近入库',
      dataIndex: 'lastInDate',
      key: 'lastInDate',
      width: 210,
      render: (_: string, record: BarcodeInfo) => (
        <div className="space-y-1">
          {record.lastInDate && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Calendar size={12} className="text-gray-400" />
              {record.lastInDate}
            </div>
          )}
          {record.lastExpiryDate && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <CalendarDays size={12} className="text-gray-400" />
              效期至 {record.lastExpiryDate}
            </div>
          )}
          {record.lastQuantity !== undefined && record.lastQuantity !== null && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <PackagePlus size={12} className="text-gray-400" />
              {record.lastQuantity} 件
            </div>
          )}
          {!record.lastInDate && !record.lastExpiryDate && record.lastQuantity === undefined && (
            <span className="text-gray-400">-</span>
          )}
        </div>
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
          维护常用材料的条码信息，扫码入库时自动带出材料名称、规格、默认位置等信息，提高入库效率。维护的默认值会在扫码时优先带入。
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
          scroll={{ x: 1200 }}
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
        width={680}
        destroyOnClose
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Divider orientation="left" plain>
            <span className="flex items-center gap-1">
              <Barcode size={14} />
              基础信息
            </span>
          </Divider>
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
                  <Option value="个">个</Option>
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

          <Divider orientation="left" plain>
            <span className="flex items-center gap-1">
              <Hash size={14} />
              入库默认值（选填）
            </span>
          </Divider>
          <p className="text-xs text-gray-500 -mt-2 mb-4">
            扫码入库时会自动带出这些默认值，可根据实际情况修改。最近入库信息会在每次入库后自动更新。
          </p>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="defaultBatchNo" label="默认批号">
                <Input placeholder="每次入库常用的批号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="defaultExpiryDate" label="默认有效期">
                <DatePicker style={{ width: '100%' }} placeholder="选择默认有效期" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" plain className="mt-2">
            <span className="flex items-center gap-1">
              <CalendarDays size={14} />
              最近入库信息（选填，入库后自动更新）
            </span>
          </Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="lastInDate" label="最近入库日期">
                <DatePicker style={{ width: '100%' }} placeholder="选择日期" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="lastExpiryDate" label="最近有效期">
                <DatePicker style={{ width: '100%' }} placeholder="选择有效期" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="lastQuantity" label="最近入库数量">
                <InputNumber min={1} style={{ width: '100%' }} placeholder="输入数量" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
