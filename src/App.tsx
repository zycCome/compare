import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { navItems } from "./nav-items";
import Layout from "./components/Layout";

const queryClient = new QueryClient();

// 根据环境自动确定basename - 简化逻辑，默认根路径
const getBaseName = (): string => {
  const isProd = import.meta.env.PROD;
  const isVercel = import.meta.env.VITE_VERCEL === "true";
  const isDev = import.meta.env.DEV;

  // 调试信息 - 在所有环境下都输出
  console.log("🔍 环境检测:", { isProd, isVercel, isDev });

  // 简化判断逻辑：默认使用根路径
  return "/";
};

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <ConfigProvider locale={zhCN}>
      <BrowserRouter basename={getBaseName()}>
        <Layout>
          <Routes>
            {navItems.map(({ to, component: Component }) => (
              <Route key={to} path={to} element={<Component />} />
            ))}
          </Routes>
        </Layout>
      </BrowserRouter>
    </ConfigProvider>
  </QueryClientProvider>
);

export default App;
