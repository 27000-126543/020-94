import dayjs from 'dayjs';
import { Material, UsageRecord, ProcessRecord } from '@/types';
import { getStatusByExpiryDate, generateId } from '@/utils/status';

const today = dayjs();

function createMaterial(
  name: string,
  category: string,
  batchNo: string,
  specification: string,
  daysFromNow: number,
  location: string,
  quantity: number,
  unit: string,
  handler: string,
  remark?: string
): Material {
  const expiryDate = today.add(daysFromNow, 'day').format('YYYY-MM-DD');
  const inDate = today.subtract(Math.floor(Math.random() * 30) + 5, 'day').format('YYYY-MM-DD');
  const id = generateId();
  return {
    id,
    name,
    category: category as Material['category'],
    batchNo,
    specification,
    expiryDate,
    location,
    quantity,
    unit,
    inDate,
    status: getStatusByExpiryDate(expiryDate),
    handler,
    remark,
  };
}

export const mockMaterials: Material[] = [
  createMaterial('3M Z250 光固化树脂', 'resin', '20241205', 'A3 色 4g/支', 180, '冷藏柜 A-01', 25, '支', '张护士'),
  createMaterial('3M Z350XT 纳米树脂', 'resin', '20250108', 'A2 色 3g/支', 120, '冷藏柜 A-02', 18, '支', '张护士'),
  createMaterial('登士柏 TPH3 树脂', 'resin', '20250312', 'A3.5 色 4.5g', 85, '冷藏柜 A-03', 12, '支', '李管理员'),
  createMaterial('可乐丽菲露 树脂', 'resin', '20250420', 'A1 色 3.5g', 60, '冷藏柜 A-01', 8, '支', '张护士', '新到货'),

  createMaterial('3M Single Bond 粘接剂', 'adhesive', '20240918', '5ml/瓶', 45, '冷藏柜 B-01', 6, '瓶', '李管理员'),
  createMaterial('可乐丽 粘接剂', 'adhesive', '20241022', '6ml/瓶', 25, '冷藏柜 B-02', 10, '瓶', '张护士'),
  createMaterial('义获嘉 粘接剂', 'adhesive', '20241130', '4ml/瓶', 12, '冷藏柜 B-03', 5, '瓶', '李管理员'),

  createMaterial('碧蓝麻 复方阿替卡因', 'anesthetic', '20240615', '1.7ml/支', 5, '麻药柜 C-01', 50, '支', '王护士长'),
  createMaterial('斯康杜尼 甲哌卡因', 'anesthetic', '20240720', '1.8ml/支', 3, '麻药柜 C-02', 30, '支', '王护士长', '需尽快使用'),
  createMaterial('必兰 麻药', 'anesthetic', '20250210', '1.7ml/支', 200, '麻药柜 C-03', 100, '支', '张护士'),

  createMaterial('登士柏 AH Plus 根管糊剂', 'rootCanal', '20240805', '粉+液套装', 15, '材料柜 D-01', 3, '套', '李管理员'),
  createMaterial('义获嘉 根管封闭剂', 'rootCanal', '20240910', '4g/支', -5, '材料柜 D-02', 2, '支', '张护士', '已过期待处理'),
  createMaterial('碧兰 根管糊剂', 'rootCanal', '20250515', '3g/支', 150, '材料柜 D-03', 8, '支', '李管理员'),

  createMaterial('3M 加聚型硅橡胶', 'impression', '20241105', '基质+催化剂', 20, '材料柜 E-01', 4, '套', '张护士'),
  createMaterial('贺利氏 藻酸盐印模材', 'impression', '20241218', '500g/袋', 65, '材料柜 E-02', 12, '袋', '李管理员'),
  createMaterial('义获嘉 硅橡胶印模材', 'impression', '20250325', '轻体型 50ml', 95, '材料柜 E-03', 6, '支', '张护士'),
  createMaterial('DMG 硅橡胶印模材', 'impression', '20241008', '重体型 2x50ml', -12, '材料柜 E-01', 2, '套', '王护士长', '已报废待登记'),
];

export const mockUsageRecords: UsageRecord[] = [
  {
    id: generateId(),
    materialId: mockMaterials[0].id,
    date: today.subtract(2, 'day').format('YYYY-MM-DD'),
    quantity: 3,
    user: '刘医生',
    department: '综合科',
    remark: '补牙用',
  },
  {
    id: generateId(),
    materialId: mockMaterials[0].id,
    date: today.subtract(5, 'day').format('YYYY-MM-DD'),
    quantity: 2,
    user: '陈医生',
    department: '修复科',
  },
  {
    id: generateId(),
    materialId: mockMaterials[1].id,
    date: today.subtract(1, 'day').format('YYYY-MM-DD'),
    quantity: 1,
    user: '王医生',
    department: '美容牙科',
  },
  {
    id: generateId(),
    materialId: mockMaterials[4].id,
    date: today.subtract(3, 'day').format('YYYY-MM-DD'),
    quantity: 2,
    user: '李医生',
    department: '牙体牙髓科',
    remark: '粘接用',
  },
  {
    id: generateId(),
    materialId: mockMaterials[8].id,
    date: today.subtract(1, 'day').format('YYYY-MM-DD'),
    quantity: 8,
    user: '赵医生',
    department: '口腔外科',
  },
  {
    id: generateId(),
    materialId: mockMaterials[9].id,
    date: today.subtract(3, 'day').format('YYYY-MM-DD'),
    quantity: 5,
    user: '孙医生',
    department: '综合科',
    remark: '拔牙用',
  },
];

export const mockProcessRecords: ProcessRecord[] = [
  {
    id: generateId(),
    materialId: mockMaterials[8].id,
    type: 'priorityUse',
    date: today.subtract(1, 'day').format('YYYY-MM-DD'),
    handler: '王护士长',
    remark: '临期优先安排使用',
  },
  {
    id: generateId(),
    materialId: mockMaterials[7].id,
    type: 'priorityUse',
    date: today.subtract(2, 'day').format('YYYY-MM-DD'),
    handler: '李管理员',
    remark: '提醒各科室优先领用',
  },
  {
    id: generateId(),
    materialId: mockMaterials[15].id,
    type: 'scrap',
    date: today.format('YYYY-MM-DD'),
    handler: '王护士长',
    remark: '已过期，申请报废',
  },
];
