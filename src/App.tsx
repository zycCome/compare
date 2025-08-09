import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { navItems } from "./nav-items";
import Layout from "./components/Layout";

const queryClient = new QueryClient();

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
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
