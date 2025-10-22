import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Menu, Button, Tooltip, Divider } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { navItems } from '../nav-items';

const { Sider, Content } = AntLayout;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // 按分组组织菜单项
  const groupedNavItems = navItems.reduce((acc, item) => {
    const group = item.group || '一期';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push({
      key: item.to,
      icon: item.icon,
      label: (
        <Link to={item.to} className="text-inherit">
          {item.title}
        </Link>
      ),
    });
    return acc;
  }, {} as Record<string, Array<any>>);

  // 生成分组的菜单项
  const menuItems = [];
  const groups = ['二期', '一期'];

  groups.forEach((group, index) => {
    if (groupedNavItems[group] && groupedNavItems[group].length > 0) {
      // 添加分组标题
      menuItems.push({
        key: `group-${group}`,
        label: collapsed ? (
          <Tooltip title={group} placement="right">
            <span className="font-semibold text-gray-600">{group.charAt(0)}</span>
          </Tooltip>
        ) : (
          <span className="font-semibold text-gray-600 text-sm">{group}</span>
        ),
        disabled: true,
        type: 'group' as const,
      });

      // 添加分组内的菜单项
      menuItems.push(...groupedNavItems[group]);

      // 如果不是最后一个分组，添加分隔符
      if (index < groups.length - 1 && !collapsed) {
        menuItems.push({
          key: `divider-${group}`,
          type: 'divider' as const,
        });
      }
    }
  });

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider 
        width={256} 
        collapsedWidth={80}
        collapsed={collapsed}
        theme="light" 
        className="shadow-lg"
        trigger={null}
      >
        <div className={`p-6 ${collapsed ? 'px-4' : ''}`}>
          {collapsed ? (
            <Tooltip title="智能比价分析平台" placement="right">
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-500 rounded text-white flex items-center justify-center text-sm font-bold">
                  智
                </div>
              </div>
            </Tooltip>
          ) : (
            <h1 className="text-xl font-bold text-gray-800 mb-8">
              智能比价分析平台
            </h1>
          )}
        </div>
        <div className={`px-4 mb-4 ${collapsed ? 'text-center' : ''}`}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="w-full"
          />
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          className="border-r-0"
          inlineCollapsed={collapsed}
        />
      </Sider>
      <Content className="bg-gray-50">
        <div className="p-6">
          {children}
        </div>
      </Content>
    </AntLayout>
  );
};

export default Layout;