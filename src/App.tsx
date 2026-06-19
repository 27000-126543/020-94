import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import AppLayout from '@/components/Layout/AppLayout';
import WarningList from '@/pages/WarningList';
import Inventory from '@/pages/Inventory';
import ProcessLedger from '@/pages/ProcessLedger';

dayjs.locale('zh-cn');

export default function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 6,
          fontFamily: '"PingFang SC", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        },
      }}
    >
      <Router>
        <AppLayout>
          <Routes>
            <Route path="/" element={<WarningList />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/ledger" element={<ProcessLedger />} />
          </Routes>
        </AppLayout>
      </Router>
    </ConfigProvider>
  );
}
