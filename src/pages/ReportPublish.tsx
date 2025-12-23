import React, { useState } from 'react';
import {
  Button,
  Space,
  Typography,
  Tag,
  message,
  Empty,
  Layout,
  Tree,
  Select,
  Tabs,
  Table,
  Form,
  Input,
  Modal,
  Switch,
  Radio
} from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  SaveOutlined,
  EyeOutlined,
  DragOutlined,
  PlusOutlined,
  CaretRightOutlined,
  CaretDownOutlined,
  DatabaseOutlined,
  SafetyOutlined,
  SettingOutlined
} from '@ant-design/icons';
import PermissionManagementDialog from '../components/PermissionManagementDialog';
import MetricConfigDialog from '../components/MetricConfigDialog';
import MetricHoverConfig from '../components/MetricHoverConfig';
import { SheetComponent } from '@antv/s2-react';
import QueryConditionsPanel, { QueryCondition, FieldMetadata } from '../components/QueryConditionsPanel';
import { EnhancedDroppedItem } from '../types/metric';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Content } = Layout;
const { TextArea } = Input;

interface ReportItem {
  id: string;
  name: string;
  type: 'comparison' | 'dimension' | 'metric' | 'calculated' | 'baseline';
  category?: string;
  description?: string;
  metricConfig?: any;
}

type TotalRowPosition = 'top' | 'bottom';
type TotalColPosition = 'left' | 'right';
type TotalMetricAgg = 'sum' | 'avg' | 'max' | 'min' | 'count';

type FieldArea = 'rows' | 'columns' | 'metrics';

interface ReportFieldSettingItem {
  key: string;
  label: string;
  group?: string;
  area: FieldArea;
  enabled: boolean;
}

// 使用扩展的 DroppedItem 类型
type DroppedItem = EnhancedDroppedItem;

const ReportPublish: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [selectedScheme, setSelectedScheme] = useState<string>('');
  const [selectedReportGroup, setSelectedReportGroup] = useState<string>('');
  const [droppedItems, setDroppedItems] = useState<DroppedItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<ReportItem | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<string[]>(['dimension', 'metric', 'calculated', 'baseline']);
  const [loading, setLoading] = useState(false);

  // 报表分组相关状态
  const [reportGroups, setReportGroups] = useState<string[]>([
    '财务分析报表',
    '采购比价报表',
    '库存分析报表',
    '销售业绩报表'
  ]);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  // 默认分组名称状态
  const [defaultGroupName, setDefaultGroupName] = useState<string>('');

  // 权限管理对话框状态
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);

  // 指标配置对话框状态
  const [metricConfigDialogOpen, setMetricConfigDialogOpen] = useState(false);
  const [currentMetricItem, setCurrentMetricItem] = useState<DroppedItem | null>(null);

  const [reportSettingsOpen, setReportSettingsOpen] = useState(false);
  const [reportSettingsTab, setReportSettingsTab] = useState<'fields' | 'totals'>('fields');

  const [rowTotalEnabled, setRowTotalEnabled] = useState(true);
  const [rowTotalPosition, setRowTotalPosition] = useState<TotalRowPosition>('bottom');
  const [colTotalEnabled, setColTotalEnabled] = useState(false);
  const [colTotalPosition, setColTotalPosition] = useState<TotalColPosition>('right');

  const [totalMetricSettings, setTotalMetricSettings] = useState<
    { key: string; label: string; enabled: boolean; agg: TotalMetricAgg }[]
  >([
    { key: 'supplierPrice', label: '供应商价格', enabled: true, agg: 'avg' },
    { key: 'basePrice', label: '基准价格', enabled: true, agg: 'avg' },
    { key: 'groupPrice', label: '集团价格', enabled: true, agg: 'avg' },
    { key: 'diffRate', label: '差异率', enabled: true, agg: 'avg' }
  ]);

  const defaultFieldSettings: ReportFieldSettingItem[] = [
    { key: 'row_productName', label: '产品名称', group: '产品信息', area: 'rows', enabled: true },
    { key: 'row_brand', label: '品牌', group: '产品信息', area: 'rows', enabled: true },
    { key: 'row_skuCode', label: 'SKU', group: '产品信息', area: 'rows', enabled: true },
    { key: 'row_supplierName', label: '供应商', group: '供应商信息', area: 'rows', enabled: true },
    { key: 'col_org', label: '组织名称', group: '组织', area: 'columns', enabled: true },
    { key: 'col_time', label: '采购日期', group: '时间', area: 'columns', enabled: true },
    { key: 'metric_unitPrice', label: '供应商价格', group: '价格', area: 'metrics', enabled: true },
    { key: 'metric_basePrice', label: '基准价格', group: '价格', area: 'metrics', enabled: true },
    { key: 'metric_groupPrice', label: '集团价格', group: '价格', area: 'metrics', enabled: true },
    { key: 'metric_diffRate', label: '差异率', group: '差异', area: 'metrics', enabled: true }
  ];

  const [fieldSettings, setFieldSettings] = useState<ReportFieldSettingItem[]>(defaultFieldSettings);

  // 比价方案数据
  const [schemes] = useState([
    { id: 'scheme_001', name: '体外诊断试剂比价方案', description: '针对体外诊断试剂的专业比价方案' },
    { id: 'scheme_002', name: '医疗设备比价方案', description: '大型医疗设备采购比价分析方案' },
    { id: 'scheme_003', name: '药品比价方案', description: '各类药品价格对比分析方案' },
    { id: 'scheme_004', name: '耗材比价方案', description: '医用耗材价格对比方案' }
  ]);

  // 查询条件状态
  const [queryConditions, setQueryConditions] = useState<QueryCondition[]>([]);

  // 方案选择变化处理
  const handleSchemeChange = (schemeId: string) => {
    setSelectedScheme(schemeId);
    const selectedSchemeData = schemes.find(scheme => scheme.id === schemeId);
    if (selectedSchemeData) {
      // 自动生成报表名称
      const currentDate = dayjs().format('YYYY年MM月DD日');
      const generatedName = `${currentDate}${selectedSchemeData.name}`;
      form.setFieldsValue({ reportName: generatedName });
    }
  };

  // 报表分组选择变化处理
  const handleReportGroupChange = (value: string) => {
    if (value === 'add_new') {
      setIsAddingGroup(true);
      setSelectedReportGroup('');
    } else {
      setSelectedReportGroup(value);
      setIsAddingGroup(false);
    }
  };

  // 添加新报表分组
  const handleAddNewGroup = () => {
    if (!newGroupName.trim()) {
      message.warning('请输入分组名称');
      return;
    }

    if (reportGroups.includes(newGroupName.trim())) {
      message.warning('该分组已存在');
      return;
    }

    const updatedGroups = [...reportGroups, newGroupName.trim()];
    setReportGroups(updatedGroups);
    setSelectedReportGroup(newGroupName.trim());
    setNewGroupName('');
    setIsAddingGroup(false);
    message.success('添加分组成功');
  };

  // 取消添加分组
  const handleCancelAddGroup = () => {
    setNewGroupName('');
    setIsAddingGroup(false);
    setSelectedReportGroup('');
  };

  // 权限管理相关函数
  const handleOpenPermissionDialog = () => {
    setPermissionDialogOpen(true);
  };

  const handleClosePermissionDialog = () => {
    setPermissionDialogOpen(false);
  };

  // 指标配置相关函数
  const handleOpenMetricConfigDialog = (item: DroppedItem) => {
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

  const handleSavePermissions = (permissions: any[]) => {
    console.log('保存权限配置:', permissions);
    // 这里可以添加实际的保存逻辑
  };

  // 固定维度 - 比对对象相关维度
  const fixedComparisonDimensions: ReportItem[] = [
    { id: 'comp-sku', name: 'SKU编码', type: 'dimension', description: '产品SKU编码' },
    { id: 'comp-name', name: '产品名称', type: 'dimension', description: '产品具体名称' },
    { id: 'comp-category', name: '产品类别', type: 'dimension', description: '产品分类' }
  ];

  // Mock数据 - 比对维度
  const mockDimensions: ReportItem[] = [
    { id: 'dim1', name: '产品名称', type: 'dimension', description: '检测产品的具体名称' },
    { id: 'dim2', name: '规格型号', type: 'dimension', description: '产品的规格参数' },
    { id: 'dim3', name: '生产厂家', type: 'dimension', description: '产品生产厂商' },
    { id: 'dim4', name: '省份', type: 'dimension', description: '销售区域省份' },
    { id: 'dim5', name: '医院等级', type: 'dimension', description: '医疗机构等级分类' }
  ];

  // Mock数据 - 比对指标
  const mockMetrics: ReportItem[] = [
    { id: 'met1', name: '中标价格', type: 'metric', description: '产品中标价格' },
    { id: 'met2', name: '挂网价格', type: 'metric', description: '平台挂网价格' },
    { id: 'met3', name: '采购量', type: 'metric', description: '采购数量统计' },
    { id: 'met4', name: '采购金额', type: 'metric', description: '采购总金额' }
  ];

  // Mock数据 - 计算指标
  const mockCalculatedMetrics: ReportItem[] = [
    { id: 'calc1', name: '价差率', type: 'calculated', description: '(中标价格-挂网价格)/挂网价格' },
    { id: 'calc2', name: '市场份额', type: 'calculated', description: '企业采购量占比' },
    { id: 'calc3', name: '价格排名', type: 'calculated', description: '按价格从低到高排名' }
  ];

  // Mock数据 - 基准指标
  const mockBaselineMetrics: ReportItem[] = [
    { id: 'base1', name: '平均价格', type: 'baseline', description: '所有企业平均中标价格' },
    { id: 'base2', name: '最低价格', type: 'baseline', description: '所有企业最低中标价格' },
    { id: 'base3', name: '市场基准价', type: 'baseline', description: '行业市场基准价格' },
    { id: 'base4', name: '历史均价', type: 'baseline', description: '历史采购平均价格' }
  ];

  // 可用字段元数据（用于查询条件）
  const availableFields: FieldMetadata[] = [
    // 维度字段
    { id: 'dim1', name: '产品名称', type: 'dimension', componentType: 'input', description: '检测产品的具体名称' },
    { id: 'dim2', name: '规格型号', type: 'dimension', componentType: 'select', options: ['A型', 'B型', 'C型'], description: '产品的规格参数' },
    { id: 'dim3', name: '生产厂家', type: 'dimension', componentType: 'multiSelect', options: ['厂家A', '厂家B', '厂家C'], description: '产品生产厂商' },
    { id: 'dim4', name: '省份', type: 'dimension', componentType: 'select', options: ['北京', '上海', '广东', '江苏'], description: '销售区域省份' },
    { id: 'dim5', name: '医院等级', type: 'dimension', componentType: 'select', options: ['三甲', '三乙', '二甲'], description: '医疗机构等级分类' },
    { id: 'dim6', name: '采购日期', type: 'dimension', componentType: 'dateRange', description: '采购日期范围' },
    { id: 'dim7', name: '组织机构', type: 'dimension', componentType: 'modalSelector', description: '选择组织机构' },

    // 指标字段
    { id: 'met1', name: '中标价格', type: 'metric', componentType: 'numberRange', description: '产品中标价格' },
    { id: 'met2', name: '挂网价格', type: 'metric', componentType: 'numberRange', description: '平台挂网价格' },
    { id: 'met3', name: '采购量', type: 'metric', componentType: 'numberRange', description: '采购数量统计' },
    { id: 'met4', name: '采购金额', type: 'metric', componentType: 'numberRange', description: '采购总金额' },
    // 指标对比（虚拟字段，用于添加“指标 vs 指标”条件）
    { id: 'metric_compare', name: '指标对比', type: 'metric', componentType: 'metricCompare', description: '以两个指标之间的关系进行筛选' },
    // 基准指标
    { id: 'base1', name: '平均价格', type: 'baseline', componentType: 'numberRange', description: '所有企业平均中标价格' },
    { id: 'base2', name: '最低价格', type: 'baseline', componentType: 'numberRange', description: '所有企业最低中标价格' },
    { id: 'base3', name: '市场基准价', type: 'baseline', componentType: 'numberRange', description: '行业市场基准价格' },
    { id: 'base4', name: '历史均价', type: 'baseline', componentType: 'numberRange', description: '历史采购平均价格' },
    // 计算指标
    { id: 'calc1', name: '价差率', type: 'calculated', componentType: 'numberRange', description: '与基准价格的差异比率' },
    { id: 'calc2', name: '价格指数', type: 'calculated', componentType: 'numberRange', description: '相对于基期的价格指数' },
    { id: 'calc3', name: '节约金额', type: 'calculated', componentType: 'numberRange', description: '相比基准价格的节约金额' }
  ];

  // 预置查询条件（从比价方案配置中获取）
  const predefinedConditions: QueryCondition[] = [
    {
      id: 'predefined-1',
      fieldId: 'dim5',
      fieldName: '医院等级',
      fieldType: 'dimension',
      groupType: 'comparison',
      value: ['三甲'],
      isPredefined: true,
      componentType: 'multiSelect'
    },
    {
      id: 'predefined-2',
      fieldId: 'met1',
      fieldName: '中标价格',
      fieldType: 'metric',
      groupType: 'metric',
      value: { min: 100, max: 10000 },
      isPredefined: true,
      componentType: 'numberRange'
    },
    {
      id: 'predefined-3',
      fieldId: 'dim2',
      fieldName: '规格型号',
      fieldType: 'dimension',
      groupType: 'groupPrice',
      value: 'A型',
      isPredefined: true,
      componentType: 'select'
    },
    {
      id: 'predefined-4',
      fieldId: 'dim3',
      fieldName: '生产厂家',
      fieldType: 'dimension',
      groupType: 'groupPrice',
      value: ['厂家A', '厂家B'],
      isPredefined: true,
      componentType: 'multiSelect'
    },
    {
      id: 'predefined-5',
      fieldId: 'dim6',
      fieldName: '采购日期',
      fieldType: 'dimension',
      groupType: 'historyPrice',
      value: null,
      isPredefined: true,
      componentType: 'dateRange'
    },
    {
      id: 'predefined-6',
      fieldId: 'dim4',
      fieldName: '省份',
      fieldType: 'dimension',
      groupType: 'historyPrice',
      value: ['北京', '上海'],
      isPredefined: true,
      componentType: 'multiSelect'
    }
  ];

  const metricAvailableFields = availableFields.map((f) => ({
    id: f.id,
    name: f.name,
    type: f.type,
    description: f.description ?? ''
  }));

  // 基准对象固定分组配置
  const baselineGroupConfig = [
    {
      key: 'groupPrice',
      name: '集团价',
      description: '集团采购价格基准条件'
    },
    {
      key: 'historyPrice',
      name: '历史价',
      description: '历史采购价格基准条件'
    }
  ];

  // 树型数据结构
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

  // 获取可拖拽项列表
  const getAvailableItems = (): ReportItem[] => {
    return [
      ...mockDimensions,
      ...mockMetrics,
      ...mockCalculatedMetrics,
      ...mockBaselineMetrics
    ];
  };

  // 获取已使用的项
  const getUsedItemIds = (): string[] => {
    return droppedItems.map(item => item.id);
  };

  // 处理拖拽开始
  const handleDragStart = (e: React.DragEvent, item: ReportItem) => {
    if (getUsedItemIds().includes(item.id)) {
      e.preventDefault();
      return;
    }
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'copy';
  };

  // 自定义树节点渲染
  const renderTreeNode = (nodeData: any) => {
    const usedItemIds = getUsedItemIds();
    const isUsed = nodeData.itemData && usedItemIds.includes(nodeData.itemData.id);
    const isLeaf = nodeData.isLeaf;

    // 获取已使用的指标配置
    const getMetricConfig = (itemId: string) => {
      const usedItem = droppedItems.find(item => item.id === itemId);
      return usedItem?.metricConfig;
    };

    const nodeItem = nodeData.itemData;
    const isMetric = nodeItem && ['metric', 'calculated', 'baseline'].includes(nodeItem.type);
    const metricConfig = isMetric ? getMetricConfig(nodeItem.id) : null;

    return (
      <div
        className={`flex items-center h-6 px-2 rounded cursor-pointer transition-all
          ${isUsed ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-50'}
        `}
        draggable={isLeaf && !isUsed}
        onDragStart={(e) => {
          if (isLeaf && nodeData.itemData) {
            handleDragStart(e, nodeData.itemData);
          } else {
            e.preventDefault();
          }
        }}
        onDragEnd={handleDragEnd}
      >
        <span className={`text-sm ${isUsed ? 'text-gray-400' : 'text-gray-700'}`}>
          {nodeData.title}
        </span>

        {/* 左侧面板的指标悬浮配置 */}
        {isMetric && !isUsed && (
          <MetricHoverConfig
            item={{
              id: nodeItem.id,
              name: nodeItem.name,
              type: nodeItem.type as 'metric' | 'calculated' | 'baseline',
              metricConfig: (metricConfig as any) ?? undefined
            }}
            availableFields={metricAvailableFields}
            defaultGroupName={defaultGroupName}
            onDefaultGroupNameChange={setDefaultGroupName}
            onSave={(config) => {
              // 为左侧面板的指标保存预设配置，当拖拽时自动应用
              console.log('预设指标配置:', nodeItem.name, config);
              message.success(`已预设 ${nodeItem.name} 的配置`);
            }}
          >
            <div
              className="ml-auto mr-1 flex items-center justify-center w-4 h-4 rounded hover:bg-gray-200 transition-colors duration-200 cursor-help opacity-60 hover:opacity-100"
              style={{
                color: metricConfig ? '#2563eb' : '#9ca3af'
              }}
              title="预设指标配置"
            >
              <SettingOutlined
                style={{
                  fontSize: '10px'
                }}
              />
            </div>
          </MetricHoverConfig>
        )}

        {isUsed && (
          <span className="ml-auto text-xs text-gray-400">已使用</span>
        )}
      </div>
    );
  };

  // 处理拖拽结束
  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  // 处理拖拽悬停
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  // 处理放置
  const handleDrop = (e: React.DragEvent, position: 'row' | 'column' | 'value') => {
    e.preventDefault();
    if (!draggedItem) return;

    const droppedItem: DroppedItem = {
      ...draggedItem,
      position
    };

    setDroppedItems(prev => {
      // 移除已存在的项
      const filtered = prev.filter(item => item.id !== draggedItem.id);
      // 添加新项
      return [...filtered, droppedItem];
    });

    setDraggedItem(null);
  };

  // 移除配置项
  const removeItem = (itemId: string) => {
    setDroppedItems(prev => prev.filter(item => item.id !== itemId));
  };

  // 清空配置
  const clearConfig = () => {
    setDroppedItems([]);
  };

  // 预览报表
  const previewReport = () => {
    if (droppedItems.length === 0) {
      message.warning('请先配置报表内容');
      return;
    }
    message.success('报表预览功能开发中...');
  };

  // 保存配置
  const saveConfig = async () => {
    try {
      // 验证表单
      const values = await form.validateFields();

      if (droppedItems.length === 0) {
        message.warning('请先配置报表内容');
        return;
      }

      if (!selectedScheme) {
        message.warning('请选择比价方案');
        return;
      }

      setLoading(true);

      // 模拟保存逻辑
      setTimeout(() => {
        const reportData = {
          id: `report_${Date.now()}`,
          reportName: values.reportName,
          schemeId: selectedScheme,
          schemeName: schemes.find(s => s.id === selectedScheme)?.name,
          description: values.description,
          config: {
            droppedItems,
            queryConditions,
            reportSettings: {
              fields: fieldSettings,
              totals: {
                rowTotalEnabled,
                rowTotalPosition,
                colTotalEnabled,
                colTotalPosition,
                totalMetrics: totalMetricSettings
              }
            }
          },
          createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          creator: '当前用户'
        };

        console.log('保存报表数据:', reportData);
        message.success('报表发布成功！');

        // 跳转到比价报表页面
        setTimeout(() => {
          navigate('/price-comparison-reports');
        }, 1500);

        setLoading(false);
      }, 1500);
    } catch (error) {
      console.error('保存失败:', error);
      setLoading(false);
    }
  };

  // 生成S2配置数据
  const generateS2Data = () => {
    const rowItems = droppedItems.filter(item => item.position === 'row');
    const columnItems = droppedItems.filter(item => item.position === 'column');
    const valueItems = droppedItems.filter(item => item.position === 'value');

    // 检查是否有指标启用了分组展示
    const hasGroupedMetrics = valueItems.some(item =>
      item.metricConfig?.groupEnabled
    );

    // 行维度始终包含固定的维度字段
    const allRowItems = [...fixedComparisonDimensions, ...rowItems];

    if (columnItems.length === 0 && valueItems.length === 0) {
      return { data: [], fields: {} };
    }

    // Mock数据生成 - 模拟一些SKU数据
    const mockData: any[] = [];
    const mockSKUs = [
      { 'SKU编码': 'SKU001', '产品名称': '生化分析仪A1', '产品类别': '生化试剂' },
      { 'SKU编码': 'SKU002', '产品名称': '化学发光仪B2', '产品类别': '免疫试剂' },
      { 'SKU编码': 'SKU003', '产品名称': '基因测序仪C3', '产品类别': '分子诊断' },
      { 'SKU编码': 'SKU004', '产品名称': '细菌鉴定仪D4', '产品类别': '微生物检测' }
    ];

    // 获取分组名称的辅助函数
    const getGroupName = (item: any) => {
      if (item.metricConfig?.groupEnabled && item.metricConfig?.groupName) {
        return item.metricConfig.groupName;
      }
      return defaultGroupName || '默认分组';
    };

    // 展示属性名称映射（id -> name）
    const attrNameById = new Map(availableFields.filter(f => f.type === 'dimension').map(f => [f.id, f.name]));

    mockSKUs.forEach(sku => {
      for (let i = 0; i < 2; i++) {
        const row: any = {
          'SKU编码': sku['SKU编码'],
          '产品名称': sku['产品名称'],
          '产品类别': sku['产品类别']
        };

        // 如果有指标启用了分组，添加指标分组列
        if (hasGroupedMetrics) {
          // 为每个指标生成对应的数据行
          valueItems.forEach((item, index) => {
            const metricRow = { ...row };

            rowItems.forEach(rowItem => {
              metricRow[rowItem.name] = `${rowItem.name}_${i + 1}_${index}`;
            });

            columnItems.forEach(columnItem => {
              metricRow[columnItem.name] = `${columnItem.name}_类别${(i % 3) + 1}`;
            });

            // 指标分组列
            metricRow['指标分组'] = getGroupName(item);

            // 指标值
            if (item.type === 'metric') {
              metricRow[item.name] = Math.floor(Math.random() * 10000) / 100;
            } else if (item.type === 'calculated') {
              metricRow[item.name] = Math.floor(Math.random() * 100);
            } else {
              metricRow[item.name] = `值${i + 1}_${index}`;
            }

            const attrIds = item.metricConfig?.attributes || [];
            if (attrIds.length > 0) {
              attrIds.forEach((id, idx) => {
                const attrName = attrNameById.get(id);
                if (!attrName) return;
                const suppliers = ['供应商A', '供应商B', '供应商C'];
                const modes = ['集中采购', '自行采购', '委托采购'];
                const values = idx % 2 === 0 ? suppliers : modes;
                metricRow[attrName] = values[(i + index) % values.length];
              });
            }

            mockData.push(metricRow);
          });
        } else {
          // 传统数据生成逻辑（无分组）
          rowItems.forEach(item => {
            row[item.name] = `${item.name}_${i + 1}`;
          });

          columnItems.forEach(item => {
            row[item.name] = `${item.name}_类别${(i % 3) + 1}`;
          });

          valueItems.forEach(item => {
            if (item.type === 'metric') {
              row[item.name] = Math.floor(Math.random() * 10000) / 100;
            } else if (item.type === 'calculated') {
              row[item.name] = Math.floor(Math.random() * 100);
            } else {
              row[item.name] = `值${i + 1}`;
            }
          });

          mockData.push(row);
        }
      }
    });

    // 对启用“汇总展示”的指标进行聚合：相同指标值的多行合并，并将属性列用逗号拼接
    if (hasGroupedMetrics) {
      const aggregateItems = valueItems.filter(
        (vi) => vi.metricConfig?.groupEnabled && vi.metricConfig?.displayMode === 'aggregate'
      );

      aggregateItems.forEach((aggItem) => {
        const attrIds = aggItem.metricConfig?.attributes || [];
        const attrNames = attrIds.map((id) => attrNameById.get(id)).filter(Boolean) as string[];
        if (attrNames.length === 0) return;

        const dataForItem = mockData.filter((r) => r['指标分组'] === getGroupName(aggItem) && r[aggItem.name] !== undefined);
        const others = mockData.filter((r) => !(r['指标分组'] === getGroupName(aggItem) && r[aggItem.name] !== undefined));

        const map = new Map<string, any>();
        const keyFields = new Set<string>();
        if (dataForItem.length > 0) {
          Object.keys(dataForItem[0]).forEach((k) => {
            if (!attrNames.includes(k)) keyFields.add(k);
          });
        }

        dataForItem.forEach((row) => {
          const key = Array.from(keyFields).map((k) => String(row[k])).join('|');
          const existed = map.get(key);
          if (!existed) {
            const init: any = { ...row };
            attrNames.forEach((n) => {
              init[n] = row[n] ? String(row[n]) : '';
            });
            map.set(key, init);
          } else {
            attrNames.forEach((n) => {
              const names = [existed[n], row[n]].filter(Boolean).join(',');
              const unique = Array.from(new Set(names.split(',').filter(Boolean))).join(',');
              existed[n] = unique;
            });
          }
        });

        const aggregatedRows = Array.from(map.values());
        mockData.splice(0, mockData.length, ...others, ...aggregatedRows);
      });
    }

    // 构建字段配置
    const rows = ['SKU编码', '产品名称', '产品类别', ...rowItems.map(item => item.name)];
    // 指标属性列纳入列维度，便于展示“供应商属性那列”
    const groupedAttrNames = hasGroupedMetrics
      ? Array.from(new Set(
          valueItems
            .filter((vi) => vi.metricConfig?.groupEnabled)
            .flatMap((vi) => (vi.metricConfig?.attributes || []).map((id) => attrNameById.get(id)))
            .filter(Boolean) as string[]
        ))
      : [];

    const columns = hasGroupedMetrics
      ? ['指标分组', ...columnItems.map(item => item.name), ...groupedAttrNames]
      : columnItems.map(item => item.name);
    const values = valueItems.map(item => item.name);

    const fields = {
      rows,
      columns,
      values
    };

    return { data: mockData, fields };
  };

  const { data: s2Data, fields: s2Fields } = generateS2Data();

  const s2Options: any = {
    width: 800,
    height: 400,
    showSeriesNumber: true,
    interaction: {
      enableCopy: true,
      autoResetSheetStyle: false,
    },
    tooltip: {
      showTooltip: true,
      operation: {
        hiddenColumns: true,
      },
    },
    style: {
      layoutContentType: 'table',
      cellCfg: {
        width: 120,
        height: 32,
      },
      rowCfg: {
        width: 120,
      },
      colCfg: {
        width: 120,
        height: 32,
      },
    },
  };

  const renderConfigRow = (label: string, position: 'row' | 'column' | 'value', color: string) => {
    const positionItems = droppedItems.filter(item => item.position === position);

    const displayItems: Array<{ id: string; name: string; fixed?: boolean }> =
      position === 'row'
        ? [
            ...fixedComparisonDimensions.map(d => ({ id: d.id, name: d.name, fixed: true })),
            ...positionItems.map(d => ({ id: d.id, name: d.name }))
          ]
        : positionItems.map(d => ({ id: d.id, name: d.name }));

    const tagColor = color === 'blue' ? 'blue' : color === 'green' ? 'green' : 'purple';

    return (
      <div
        className="flex items-start px-3 py-2 border-b border-gray-200 hover:bg-gray-50 transition-colors"
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, position)}
      >
        <div className="w-1/5 flex items-center" style={{ paddingRight: '4px' }}>
          <Text className="text-sm text-gray-700">{label}</Text>
        </div>

        <div className="w-4/5">
          {displayItems.length === 0 ? (
            <div className="h-8 flex items-center text-xs text-gray-400">拖拽字段到此处</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {displayItems.map((it) => (
                <Tag
                  key={it.id}
                  color={tagColor}
                  closable={!it.fixed}
                  onClose={(e) => {
                    e.preventDefault();
                    if (!it.fixed) removeItem(it.id);
                  }}
                >
                  {it.name}
                </Tag>
              ))}
            </div>
          )}
        </div>
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
              <Button icon={<SafetyOutlined />} onClick={handleOpenPermissionDialog}>
                权限管理
              </Button>
              <Button icon={<EyeOutlined />} onClick={previewReport}>
                预览报表
              </Button>
              <Button type="primary" icon={<SaveOutlined />} onClick={saveConfig} loading={loading}>
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

                {/* 比价方案 */}
                <div className="px-3 pb-3">
                  <div className="text-xs text-gray-600 mb-1">比价方案</div>
                  <Form.Item
                    name="schemeId"
                    rules={[{ required: true, message: '请选择方案' }]}
                    className="mb-0"
                  >
                    <Select
                      onChange={handleSchemeChange}
                      value={selectedScheme}
                      placeholder="请选择比价方案"
                      style={{ fontSize: '14px' }}
                    >
                      {schemes.map(scheme => (
                        <Select.Option key={scheme.id} value={scheme.id}>
                          {scheme.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </div>

                {/* 报表分组 */}
                <div className="px-3 pb-3">
                  <div className="text-xs text-gray-600 mb-1">报表分组</div>
                  {!isAddingGroup ? (
                    <Select
                      value={selectedReportGroup}
                      onChange={handleReportGroupChange}
                      placeholder="选择分组"
                      allowClear
                      style={{ fontSize: '14px' }}
                    >
                      {reportGroups.map(group => (
                        <Select.Option key={group} value={group}>
                          {group}
                        </Select.Option>
                      ))}
                      <Select.Option value="add_new" className="text-blue-600">
                        <PlusOutlined className="mr-1" />
                        添加新分组
                      </Select.Option>
                    </Select>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <Input
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        placeholder="输入新分组名称"
                        style={{ fontSize: '14px' }}
                        onPressEnter={handleAddNewGroup}
                      />
                      <Button size="small" type="primary" onClick={handleAddNewGroup}>
                        确定
                      </Button>
                      <Button size="small" onClick={handleCancelAddGroup}>
                        取消
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* 可用字段面板 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Title level={4} className="mb-0 text-sm">可用字段2</Title>
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
                    titleRender={(nodeData: any) => renderTreeNode(nodeData)}
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
          <div className="flex-1 bg-gray-50">
            {/* 查询条件区域 */}
            <div className="bg-white">
              <QueryConditionsPanel
                conditions={queryConditions}
                onConditionsChange={setQueryConditions}
                availableFields={availableFields}
                predefinedConditions={predefinedConditions}
              />
            </div>

            {/* 报表布局配置区域 */}
            <div className="bg-white border-b">
              <div className="px-3 py-2 border-b border-gray-100">
                <Title level={4} className="mb-0 text-sm">报表布局配置</Title>
              </div>

              <div className="bg-gray-50 px-3 py-2 border-b border-gray-100">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Button
                    size="small"
                    onClick={() => {
                      setReportSettingsTab('fields');
                      setReportSettingsOpen(true);
                    }}
                  >
                    报表设置
                  </Button>
                </div>
              </div>

              {/* 垂直配置行 */}
              <div className="bg-gray-50">
                {renderConfigRow('行维度', 'row', 'blue')}
                {renderConfigRow('列维度', 'column', 'green')}
                {renderConfigRow('指标', 'value', 'orange')}
              </div>
            </div>

            {/* 报表预览区域 */}
            <div className="px-3 py-2">
              <div className="flex items-center justify-between mb-2">
                <Title level={4} className="mb-0 text-sm">报表预览</Title>
                <Text type="secondary" className="text-xs">
                  {droppedItems.length > 0
                    ? `已配置 ${droppedItems.length} 个字段`
                    : '请先配置报表布局'
                  }
                </Text>
              </div>
              <div className="bg-white rounded p-3 shadow-sm">
                {s2Data.length > 0 ? (
                  <div className="overflow-auto">
                    <SheetComponent
                      dataCfg={{
                        data: s2Data,
                        fields: s2Fields,
                        meta: [
                          {
                            field: '*',
                            formatter: (value: any) => {
                              if (typeof value === 'number') {
                                return value.toLocaleString();
                              }
                              return value;
                            },
                          },
                        ],
                      }}
                      options={s2Options}
                    />
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="mb-3">
                      <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
                        <DragOutlined className="text-xl text-gray-400" />
                      </div>
                    </div>
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="请拖拽字段到上方配置区域以生成报表预览"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <Modal
          title="报表设置"
          open={reportSettingsOpen}
          width={980}
          onCancel={() => setReportSettingsOpen(false)}
          onOk={() => setReportSettingsOpen(false)}
          okText="保存"
          cancelText="关闭"
          destroyOnClose
        >
          <Tabs
            activeKey={reportSettingsTab}
            onChange={(k) => setReportSettingsTab(k as any)}
            items={[
              {
                key: 'fields',
                label: '字段',
                children: (
                  <div style={{ display: 'flex', gap: 16 }}>
                    {([
                      { title: '行字段显示设置', area: 'rows' as const },
                      { title: '列字段显示设置', area: 'columns' as const },
                      { title: '指标字段显示设置', area: 'metrics' as const }
                    ] as const).map((block) => {
                      const data = fieldSettings.filter((f) => f.area === block.area);
                      return (
                        <div
                          key={block.area}
                          style={{
                            flex: 1,
                            minWidth: 0,
                            border: '1px solid #f0f0f0',
                            borderRadius: 8,
                            background: '#fff',
                            overflow: 'hidden'
                          }}
                        >
                          <div
                            style={{
                              padding: '10px 12px',
                              borderBottom: '1px solid #f0f0f0',
                              background: '#fafafa'
                            }}
                          >
                            <Text strong>{block.title}</Text>
                          </div>
                          <div style={{ padding: 12 }}>
                            <Table
                              size="small"
                              rowKey={(r) => r.key}
                              dataSource={data}
                              pagination={false}
                              scroll={{ y: 360 }}
                              columns={[
                                {
                                  title: '字段分组',
                                  dataIndex: 'group',
                                  key: 'group',
                                  width: 120,
                                  render: (v: string) => <Text type="secondary">{v || '-'}</Text>
                                },
                                {
                                  title: '字段',
                                  dataIndex: 'label',
                                  key: 'label',
                                  render: (v: string) => <Text>{v}</Text>
                                },
                                {
                                  title: '显示',
                                  dataIndex: 'enabled',
                                  key: 'enabled',
                                  width: 80,
                                  align: 'right' as const,
                                  render: (_: any, record: ReportFieldSettingItem) => (
                                    <Switch
                                      size="small"
                                      checked={record.enabled}
                                      onChange={(checked) => {
                                        setFieldSettings((prev) =>
                                          prev.map((x) => (x.key === record.key ? { ...x, enabled: checked } : x))
                                        );
                                      }}
                                    />
                                  )
                                }
                              ]}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              },
              {
                key: 'totals',
                label: '汇总',
                children: (
                  <div style={{ paddingTop: 8 }}>
                    <div
                      style={{
                        border: '1px solid #f0f0f0',
                        borderRadius: 8,
                        padding: '16px',
                        background: '#fafafa'
                      }}
                    >
                      <div style={{ marginBottom: 16 }}>
                        <Text strong style={{ fontSize: 14 }}>总计行列配置</Text>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 0'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                          <Text style={{ width: 72 }}>行总计</Text>
                          <Radio.Group
                            value={rowTotalPosition}
                            onChange={(e) => setRowTotalPosition(e.target.value)}
                            disabled={!rowTotalEnabled}
                          >
                            <Radio value="top">上</Radio>
                            <Radio value="bottom">下</Radio>
                          </Radio.Group>
                        </div>
                        <Switch checked={rowTotalEnabled} onChange={setRowTotalEnabled} />
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 0'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                          <Text style={{ width: 72 }}>列总计</Text>
                          <Radio.Group
                            value={colTotalPosition}
                            onChange={(e) => setColTotalPosition(e.target.value)}
                            disabled={!colTotalEnabled}
                          >
                            <Radio value="left">左</Radio>
                            <Radio value="right">右</Radio>
                          </Radio.Group>
                        </div>
                        <Switch checked={colTotalEnabled} onChange={setColTotalEnabled} />
                      </div>
                    </div>

                    <div style={{ marginTop: 16 }}>
                      <div
                        style={{
                          border: '1px solid #f0f0f0',
                          borderRadius: 8,
                          padding: '16px',
                          background: '#fafafa'
                        }}
                      >
                        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'baseline', gap: 8 }}>
                          <Text strong style={{ fontSize: 14 }}>总计指标配置</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>配置每个指标的总计计算方式</Text>
                        </div>

                        <Table
                          size="small"
                          bordered
                          rowKey={(r) => r.key}
                          pagination={false}
                          dataSource={totalMetricSettings}
                          columns={[
                            {
                              title: '指标',
                              dataIndex: 'label',
                              key: 'label'
                            },
                            {
                              title: '启用',
                              dataIndex: 'enabled',
                              key: 'enabled',
                              width: 110,
                              align: 'center' as const,
                              render: (_: any, record: any) => (
                                <Switch
                                  size="small"
                                  checked={record.enabled}
                                  onChange={(checked) => {
                                    setTotalMetricSettings((prev) =>
                                      prev.map((x) => (x.key === record.key ? { ...x, enabled: checked } : x))
                                    );
                                  }}
                                />
                              )
                            },
                            {
                              title: '计算方式',
                              dataIndex: 'agg',
                              key: 'agg',
                              width: 200,
                              render: (_: any, record: any) => (
                                <Select
                                  size="small"
                                  value={record.agg}
                                  style={{ width: 160 }}
                                  disabled={!record.enabled}
                                  options={[
                                    { label: '求和', value: 'sum' },
                                    { label: '平均', value: 'avg' },
                                    { label: '最大', value: 'max' },
                                    { label: '最小', value: 'min' },
                                    { label: '计数', value: 'count' }
                                  ]}
                                  onChange={(agg) => {
                                    setTotalMetricSettings((prev) =>
                                      prev.map((x) => (x.key === record.key ? { ...x, agg } : x))
                                    );
                                  }}
                                />
                              )
                            }
                          ]}
                        />
                      </div>
                    </div>
                  </div>
                )
              }
            ]}
          />
        </Modal>

        {/* 权限管理对话框 */}
        <PermissionManagementDialog
          open={permissionDialogOpen}
          reportId="report_temp_id"
          reportName={form.getFieldValue('reportName') || '新报表'}
          onClose={handleClosePermissionDialog}
          onSave={handleSavePermissions}
        />

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
            availableFields={metricAvailableFields}
            onSave={handleSaveMetricConfig}
            onClose={handleCloseMetricConfigDialog}
          />
        )}
      </Content>
    </Layout>
  );
};

export default ReportPublish;
