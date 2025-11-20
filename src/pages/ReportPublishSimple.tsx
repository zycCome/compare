import React, { useState } from 'react';
import {
  Card,
  Button,
  Typography,
  Layout,
  Space,
  message,
  Form,
  Input,
  Select,
  Tree,
  Tag,
  Modal
} from 'antd';
import {
  SaveOutlined,
  EyeOutlined,
  SafetyOutlined,
  CaretRightOutlined,
  CaretDownOutlined,
  DatabaseOutlined,
  AimOutlined,
  CalculatorOutlined,
  FunctionOutlined,
  LineChartOutlined,
  DragOutlined,
  SettingOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import MetricConfigDialog from '../components/MetricConfigDialog';
import { EnhancedDroppedItem } from '../types/metric';

const { Title, Text } = Typography;
const { Content } = Layout;
const { TextArea } = Input;

interface ReportItem {
  id: string;
  name: string;
  type: 'dimension' | 'metric' | 'calculated' | 'baseline';
  description?: string;
}

type DroppedItem = EnhancedDroppedItem;

const ReportPublishSimple: React.FC = () => {
  const [form] = Form.useForm();
  const [droppedItems, setDroppedItems] = useState<DroppedItem[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<string[]>(['dimension', 'metric', 'calculated', 'baseline']);
  const [metricConfigDialogOpen, setMetricConfigDialogOpen] = useState(false);
  const [currentMetricItem, setCurrentMetricItem] = useState<DroppedItem | null>(null);

  // Mock数据
  const mockDimensions: ReportItem[] = [
    { id: 'dim1', name: '产品名称', type: 'dimension', description: '检测产品的具体名称' },
    { id: 'dim2', name: '规格型号', type: 'dimension', description: '产品的规格参数' },
    { id: 'dim3', name: '生产厂家', type: 'dimension', description: '产品生产厂商' }
  ];

  const mockMetrics: ReportItem[] = [
    { id: 'met1', name: '中标价格', type: 'metric', description: '产品中标价格' },
    { id: 'met2', name: '挂网价格', type: 'metric', description: '平台挂网价格' },
    { id: 'met3', name: '采购量', type: 'metric', description: '采购数量统计' }
  ];

  const mockCalculatedMetrics: ReportItem[] = [
    { id: 'calc1', name: '价差率', type: 'calculated', description: '(中标价格-挂网价格)/挂网价格' },
    { id: 'calc2', name: '市场份额', type: 'calculated', description: '企业采购量占比' }
  ];

  const mockBaselineMetrics: ReportItem[] = [
    { id: 'base1', name: '平均价格', type: 'baseline', description: '所有企业平均中标价格' },
    { id: 'base2', name: '最低价格', type: 'baseline', description: '所有企业最低中标价格' }
  ];

  const availableFields = [
    { id: 'dim1', name: '产品名称', type: 'dimension', componentType: 'input', description: '检测产品的具体名称' },
    { id: 'dim2', name: '规格型号', type: 'dimension', componentType: 'select', options: ['A型', 'B型', 'C型'], description: '产品的规格参数' },
    { id: 'dim3', name: '生产厂家', type: 'dimension', componentType: 'multiSelect', options: ['厂家A', '厂家B'], description: '产品生产厂商' }
  ];

  const treeData = [
    {
      key: 'dimension',
      title: '比对维度',
      children: mockDimensions.map(item => ({
        key: item.id,
        title: item.name,
        isLeaf: true,
        itemData: item
      }))
    },
    {
      key: 'metric',
      title: '比对指标',
      children: mockMetrics.map(item => ({
        key: item.id,
        title: item.name,
        isLeaf: true,
        itemData: item
      }))
    },
    {
      key: 'calculated',
      title: '计算指标',
      children: mockCalculatedMetrics.map(item => ({
        key: item.id,
        title: item.name,
        isLeaf: true,
        itemData: item
      }))
    },
    {
      key: 'baseline',
      title: '基准指标',
      children: mockBaselineMetrics.map(item => ({
        key: item.id,
        title: item.name,
        isLeaf: true,
        itemData: item
      }))
    }
  ];

  const handleSave = () => {
    message.success('报表保存成功！');
  };

  const handlePreview = () => {
    message.info('预览功能开发中...');
  };

  const handlePermission = () => {
    message.info('权限管理功能开发中...');
  };

  const handleDragStart = (e: React.DragEvent, item: ReportItem) => {
    setDroppedItems(prev => {
      const exists = prev.find(d => d.id === item.id);
      if (!exists) {
        return [...prev, { ...item, position: 'value' as any }];
      }
      return prev;
    });
  };

  const handleOpenMetricConfigDialog = (item: DroppedItem) => {
    console.log('🔍 DEBUG: 打开指标配置对话框', { itemName: item.name });
    setCurrentMetricItem(item);
    setMetricConfigDialogOpen(true);
  };

  const handleCloseMetricConfigDialog = () => {
    setMetricConfigDialogOpen(false);
    setCurrentMetricItem(null);
  };

  const handleSaveMetricConfig = (config: any) => {
    if (currentMetricItem) {
      setDroppedItems(prev =>
        prev.map(item =>
          item.id === currentMetricItem.id
            ? { ...item, metricConfig: config }
            : item
        )
      );
      message.success('指标配置已保存');
    }
  };

  const removeItem = (itemId: string) => {
    setDroppedItems(prev => prev.filter(item => item.id !== itemId));
  };

  const renderTreeNode = (nodeData: any) => {
    const isUsed = nodeData.itemData && droppedItems.some(d => d.id === nodeData.itemData.id);
    const isLeaf = nodeData.isLeaf;

    return (
      <div
        className={`flex items-center h-6 px-2 rounded cursor-pointer transition-all
          ${isUsed ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-50'}
        `}
        draggable={isLeaf && !isUsed}
        onDragStart={(e) => {
          if (isLeaf && nodeData.itemData) {
            handleDragStart(e, nodeData.itemData);
          }
        }}
      >
        <span className={`text-sm ${isUsed ? 'text-gray-400' : 'text-gray-700'}`}>
          {nodeData.title}
        </span>
        {isUsed && (
          <span className="ml-auto text-xs text-gray-400">已使用</span>
        )}
      </div>
    );
  };

  const renderDroppedItem = (item: DroppedItem) => {
    const getTypeIcon = (type: string) => {
      switch (type) {
        case 'dimension': return <AimOutlined className="text-cyan-600 text-xs" />;
        case 'metric': return <CalculatorOutlined className="text-indigo-600 text-xs" />;
        case 'calculated': return <FunctionOutlined className="text-violet-600 text-xs" />;
        case 'baseline': return <LineChartOutlined className="text-teal-600 text-xs" />;
        default: return null;
      }
    };

    return (
      <div
        key={item.id}
        className="group flex items-center px-3 py-2 bg-white border rounded cursor-move hover:shadow-md transition-all duration-200 border-gray-200"
      >
        <DragOutlined className="text-gray-400 mr-2 text-xs group-hover:text-blue-500" />
        {getTypeIcon(item.type)}

        {/* 指标名称区域 - 带悬浮效果和配置图标 */}
        <div
          className="ml-2 text-sm flex-1 flex items-center relative"
          style={{
            position: 'relative',
            padding: '2px',
            borderRadius: '4px',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            console.log('🔍 DEBUG: onMouseEnter 触发', {
              itemName: item.name,
              itemType: item.type,
              hasMetricConfig: !!item.metricConfig
            });
            e.currentTarget.style.backgroundColor = '#f0f9ff';
            const configIcon = e.currentTarget.querySelector('.config-icon');
            if (configIcon) {
              console.log('🔍 DEBUG: 找到配置图标，设置透明度');
              (configIcon as HTMLElement).style.opacity = '1';
            } else {
              console.log('🔍 DEBUG: 未找到配置图标');
            }
          }}
          onMouseLeave={(e) => {
            console.log('🔍 DEBUG: onMouseLeave 触发', { itemName: item.name });
            e.currentTarget.style.backgroundColor = 'transparent';
            const configIcon = e.currentTarget.querySelector('.config-icon');
            if (configIcon) {
              (configIcon as HTMLElement).style.opacity = '0';
            }
          }}
        >
          <span
            className="cursor-pointer"
            style={{
              transition: 'all 0.2s',
              display: 'inline-block'
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = '#2563eb';
              (e.currentTarget as HTMLElement).style.fontWeight = '600';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = '#1f2937';
              (e.currentTarget as HTMLElement).style.fontWeight = 'normal';
            }}
          >
            {item.name}
          </span>

          {/* 仅指标类型显示配置图标 */}
          {(item.type === 'metric' || item.type === 'calculated' || item.type === 'baseline') ? (
            <>
              {console.log('🔍 DEBUG: 渲染配置图标', { itemName: item.name })}
              <Button
                type="text"
                size="small"
                icon={<SettingOutlined />}
                className="config-icon ml-1"
                style={{
                  opacity: 0,
                  transition: 'all 0.2s',
                  color: item.metricConfig ? '#2563eb' : '#9ca3af',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
                onClick={(e) => {
                  console.log('🔍 DEBUG: 配置图标被点击', { itemName: item.name });
                  e.stopPropagation();
                  handleOpenMetricConfigDialog(item);
                }}
                onMouseEnter={(e) => {
                  console.log('🔍 DEBUG: 配置图标悬浮', { itemName: item.name });
                  const currentTarget = e.currentTarget as HTMLElement;
                  currentTarget.style.backgroundColor = item.metricConfig ? '#dbeafe' : '#f3f4f6';
                  currentTarget.style.color = '#2563eb';
                }}
                onMouseLeave={(e) => {
                  const currentTarget = e.currentTarget as HTMLElement;
                  currentTarget.style.backgroundColor = 'transparent';
                  currentTarget.style.color = item.metricConfig ? '#2563eb' : '#9ca3af';
                }}
              />
            </>
          ) : (
            <>{console.log('🔍 DEBUG: 不渲染配置图标', { itemName: item.name, itemType: item.type })}</>
          )}
        </div>

        <Tag size="small" color="blue" className="mr-2">
          值
        </Tag>
        <Button
          type="text"
          size="small"
          icon={<DeleteOutlined />}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50"
          onClick={() => removeItem(item.id)}
        />
      </div>
    );
  };

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Content className="p-0">
        {/* 顶部工具栏 */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Title level={3} className="mb-2">
                发布报表
              </Title>
              <Text type="secondary">
                从比价方案配置中拖拽字段来创建自定义报表布局
              </Text>
            </div>
            <Space>
              <Button icon={<SafetyOutlined />} onClick={handlePermission}>
                权限管理
              </Button>
              <Button icon={<EyeOutlined />} onClick={handlePreview}>
                预览报表
              </Button>
              <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
                保存报表
              </Button>
            </Space>
          </div>
        </div>

        <div className="flex">
          {/* 左侧面板 */}
          <div className="w-80 bg-white border-r h-screen overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* 报表基本信息卡片 */}
              <div className="border border-gray-200 rounded-lg">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                  <div className="flex items-center">
                    <DatabaseOutlined className="text-blue-600 mr-2" />
                    <span className="font-medium text-sm text-gray-700">报表基本信息</span>
                  </div>
                </div>
                <div className="p-3 space-y-3">
                  <Form form={form} layout="vertical">
                    {/* 报表名称 */}
                    <Form.Item
                      name="reportName"
                      rules={[{ required: true, message: '请输入报表名称' }]}
                      className="mb-3"
                    >
                      <Input
                        placeholder="请输入报表名称"
                        style={{ fontSize: '14px' }}
                      />
                    </Form.Item>

                    <Form.Item
                      name="description"
                      className="mb-0"
                    >
                      <TextArea
                        placeholder="请输入报表描述"
                        rows={3}
                        style={{ fontSize: '14px' }}
                      />
                    </Form.Item>
                  </Form>
                </div>
              </div>

              {/* 可用字段面板 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Title level={4} className="mb-0 text-sm">可用字段</Title>
                  <Text type="secondary" className="text-xs">
                    拖拽到右侧进行配置
                  </Text>
                </div>

                {/* 树型控件 */}
                <div className="border border-gray-200 rounded-lg">
                  <Tree
                    showLine={false}
                    showIcon={false}
                    defaultExpandAll={true}
                    expandedKeys={expandedKeys}
                    onExpand={(keys) => setExpandedKeys(keys as string[])}
                    treeData={treeData}
                    titleRender={renderTreeNode}
                    className="field-tree"
                    switcherIcon={({ expanded }) =>
                      expanded ? <CaretDownOutlined className="text-gray-500 text-xs" /> : <CaretRightOutlined className="text-gray-500 text-xs" />
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 右侧报表预览区域 */}
          <div className="bg-white rounded p-3 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Title level={4} className="mb-0 text-sm">已配置字段</Title>
              <Text type="secondary" className="text-xs">
                {droppedItems.length === 0
                  ? '请从左侧拖拽字段到这里'
                  : `已配置 ${droppedItems.length} 个字段`
                }
              </Text>
            </div>
            <div className="min-h-[200px] space-y-2">
              {droppedItems.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <DragOutlined className="text-4xl mb-2" />
                  <div>拖拽字段到这里</div>
                </div>
              ) : (
                droppedItems.map(renderDroppedItem)
              )}
            </div>
          </div>
          </div>
        </div>
      </Content>

        {/* 指标配置对话框 */}
        {currentMetricItem && (
          <MetricConfigDialog
            open={metricConfigDialogOpen}
            item={{
              id: currentMetricItem.id,
              name: currentMetricItem.name,
              type: currentMetricItem.type as 'metric' | 'calculated' | 'baseline',
              metricConfig: currentMetricItem.metricConfig
            }}
            availableFields={availableFields.filter(field => field.type === 'dimension')}
            onSave={handleSaveMetricConfig}
            onClose={handleCloseMetricConfigDialog}
          />
        )}
        </div>
      </Content>
    </Layout>
  );
};

export default ReportPublishSimple;