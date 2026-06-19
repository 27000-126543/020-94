import { useState } from 'react';
import { Layout, Menu, theme } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AlertTriangle,
  PackagePlus,
  Settings,
  User,
  Bell,
  FileSpreadsheet,
} from 'lucide-react';

const { Header, Sider, Content } = Layout;

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const menuItems = [
    {
      key: '/',
      icon: <AlertTriangle size={18} />,
      label: '预警清单',
    },
    {
      key: '/inventory',
      icon: <PackagePlus size={18} />,
      label: '入库登记',
    },
    {
      key: '/ledger',
      icon: <FileSpreadsheet size={18} />,
      label: '处理台账',
    },
  ];

  const selectedKey =
    location.pathname === '/inventory'
      ? '/inventory'
      : location.pathname === '/ledger'
      ? '/ledger'
      : '/';

  return (
    <Layout className="min-h-screen">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="light"
        style={{
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.06)',
        }}
      >
        <div className="flex items-center justify-center h-16 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <AlertTriangle size={18} className="text-white" />
            </div>
            {!collapsed && (
              <span className="font-bold text-lg text-gray-800 whitespace-nowrap">
                效期预警台
              </span>
            )}
          </div>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0, paddingTop: 12 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: colorBgContainer,
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
          }}
          className="h-16"
        >
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-800 m-0">
              {selectedKey === '/'
                ? '预警清单'
                : selectedKey === '/inventory'
                ? '入库登记'
                : '处理台账'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Bell size={20} className="text-gray-500" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              <span className="text-sm text-gray-700">张管理员</span>
            </div>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
          className="overflow-auto"
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
