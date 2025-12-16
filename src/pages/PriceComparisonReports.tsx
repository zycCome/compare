import React, { useState, useCallback } from 'react';
import {
  Card,
  Button,
  Drawer,
  Divider,
  Switch,
  Radio,
  Select,
  Table,
  Tree,
  Input,
  Modal,
  Form,
  message,
  Dropdown,
  Space,
  Typography,
  Empty,
  Spin,
  Badge,
  List,
  Tag
} from 'antd';
import {
  PlusOutlined,
  FolderOutlined,
  FileTextOutlined,
  EditOutlined,
  ShareAltOutlined,
  MoreOutlined,
  SearchOutlined,
  DeleteOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import type { DataNode, EventDataNode } from 'antd/es/tree';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { SheetComponent } from '@antv/s2-react';
import '@antv/s2-react/dist/s2-react.min.css';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

// 报表分组接口
interface ReportGroup {
  id: string;
  name: string;
  description?: string;
  createTime: string;
  children?: ReportGroup[];
}

// 报表数据接口
interface ReportItem {
  id: string;
  name: string;
  groupId: string;
  schemeId: string;
  schemeName: string;
  organization: string;
  createTime: string;
  updateTime: string;
  status: 'PUBLISHED' | 'DRAFT';
  creator: string;
  description?: string;
  content?: string; // 报表内容
}

interface MonitorTaskItem {
  id: string;
  name: string;
  reportId: string;
  enabled: boolean;
  scheduleSummary: string;
  lastCheck: string;
}

type TotalScope = 'all_filtered' | 'current_page' | 'selected';
type AggType = 'sum' | 'avg' | 'count';

type TotalMetricKey = 'unitPrice' | 'basePrice' | 'groupPrice' | 'diffRate';

interface TotalMetricSetting {
  key: TotalMetricKey;
  label: string;
  enabled: boolean;
  agg: AggType;
}

const ReportCenter: React.FC = () => {
  const navigate = useNavigate();
  // 模拟分组数据
  const [groups, setGroups] = useState<ReportGroup[]>([
    {
      id: 'group_001',
      name: '体外诊断试剂报表',
      description: '体外诊断试剂相关比价报表',
      createTime: '2024-01-01 10:00:00'
    },
    {
      id: 'group_002',
      name: '医疗设备报表',
      description: '医疗设备采购比价报表',
      createTime: '2024-01-02 10:00:00'
    },
    {
      id: 'group_003',
      name: '药品报表',
      description: '药品价格对比报表',
      createTime: '2024-01-03 10:00:00'
    }
  ]);

  const [monitorTasks] = useState<MonitorTaskItem[]>([
    {
      id: 'mt_001',
      name: '差异率异常监控',
      reportId: 'report_001',
      enabled: true,
      scheduleSummary: '每天 08:00',
      lastCheck: '2025-12-15 08:00:00'
    },
    {
      id: 'mt_002',
      name: '供应商高价预警',
      reportId: 'report_001',
      enabled: false,
      scheduleSummary: '每周一 10:00',
      lastCheck: '2025-12-14 10:00:00'
    },
    {
      id: 'mt_003',
      name: '集团基准价偏离监控',
      reportId: 'report_005',
      enabled: true,
      scheduleSummary: '每小时',
      lastCheck: '2025-12-15 09:00:00'
    }
  ]);

  // 模拟报表数据
  const [reports] = useState<ReportItem[]>([
    // 体外诊断试剂分组 - 4个报表
    {
      id: 'report_001',
      name: '2024年Q1体外诊断试剂比价报表',
      groupId: 'group_001',
      schemeId: 'scheme_001',
      schemeName: '体外诊断试剂比价方案',
      organization: '上海总部',
      createTime: '2024-01-15 10:30:00',
      updateTime: '2024-01-15 14:20:00',
      status: 'PUBLISHED',
      creator: '张三',
      description: '第一季度体外诊断试剂价格对比分析',
      content: '这里是体外诊断试剂报表的具体内容，包含图表、数据表格等...'
    },
    {
      id: 'report_002',
      name: '2023年生化试剂采购分析报告',
      groupId: 'group_001',
      schemeId: 'scheme_001',
      schemeName: '体外诊断试剂比价方案',
      organization: '上海总部',
      createTime: '2023-12-10 14:20:00',
      updateTime: '2023-12-12 16:30:00',
      status: 'PUBLISHED',
      creator: '李四',
      description: '生化试剂年度采购价格分析与趋势预测',
      content: '这里是生化试剂比价报表的具体内容...'
    },
    {
      id: 'report_003',
      name: '免疫试剂供应商比价分析',
      groupId: 'group_001',
      schemeId: 'scheme_001',
      schemeName: '体外诊断试剂比价方案',
      organization: '上海总部',
      createTime: '2023-11-05 09:15:00',
      updateTime: '2023-11-06 11:45:00',
      status: 'DRAFT',
      creator: '王五',
      description: '免疫试剂类产品供应商价格对比分析',
      content: '这里是免疫试剂比价报表的具体内容...'
    },
    {
      id: 'report_004',
      name: '分子诊断试剂成本分析',
      groupId: 'group_001',
      schemeId: 'scheme_001',
      schemeName: '体外诊断试剂比价方案',
      organization: '上海总部',
      createTime: '2023-10-18 16:00:00',
      updateTime: '2023-10-20 10:30:00',
      status: 'PUBLISHED',
      creator: '赵六',
      description: '分子诊断试剂产品线成本结构分析',
      content: '这里是分子诊断试剂报表的具体内容...'
    },

    // 医疗设备分组 - 3个报表
    {
      id: 'report_005',
      name: '2023年医疗设备采购比价分析',
      groupId: 'group_002',
      schemeId: 'scheme_002',
      schemeName: '医疗设备比价方案',
      organization: '北京分公司',
      createTime: '2023-12-20 09:15:00',
      updateTime: '2023-12-22 16:45:00',
      status: 'PUBLISHED',
      creator: '李四',
      description: '2023年度医疗设备采购价格对比分析报告',
      content: '这里是医疗设备比价报表的具体内容...'
    },
    {
      id: 'report_006',
      name: '影像设备维护成本分析',
      groupId: 'group_002',
      schemeId: 'scheme_002',
      schemeName: '医疗设备比价方案',
      organization: '北京分公司',
      createTime: '2023-11-15 13:30:00',
      updateTime: '2023-11-16 15:20:00',
      status: 'PUBLISHED',
      creator: '张三',
      description: '大型影像设备全生命周期成本分析',
      content: '这里是影像设备成本分析报表的具体内容...'
    },
    {
      id: 'report_007',
      name: '手术器械供应商评估',
      groupId: 'group_002',
      schemeId: 'scheme_002',
      schemeName: '医疗设备比价方案',
      organization: '北京分公司',
      createTime: '2023-09-28 10:45:00',
      updateTime: '2023-09-29 14:15:00',
      status: 'DRAFT',
      creator: '王五',
      description: '手术器械类供应商综合评估报告',
      content: '这里是手术器械评估报表的具体内容...'
    },

    // 药品分组 - 2个报表
    {
      id: 'report_008',
      name: '华南区药品比价报表',
      groupId: 'group_003',
      schemeId: 'scheme_003',
      schemeName: '药品比价方案',
      organization: '广州分公司',
      createTime: '2023-11-08 11:20:00',
      updateTime: '2023-11-08 11:20:00',
      status: 'DRAFT',
      creator: '王五',
      description: '华南地区药品价格对比分析',
      content: '这里是药品比价报表的具体内容...'
    },
    {
      id: 'report_009',
      name: '抗生素类药物价格趋势分析',
      groupId: 'group_003',
      schemeId: 'scheme_003',
      schemeName: '药品比价方案',
      organization: '广州分公司',
      createTime: '2023-10-12 16:30:00',
      updateTime: '2023-10-13 09:45:00',
      status: 'PUBLISHED',
      creator: '赵六',
      description: '抗生素类药品市场价格走势与预测分析',
      content: '这里是抗生素价格分析报表的具体内容...'
    }
  ]);

  // 状态管理
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [groupModalVisible, setGroupModalVisible] = useState(false);
  const [editingReport, setEditingReport] = useState<ReportItem | null>(null);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [loading] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ReportGroup | null>(null);
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [currentLogReport, setCurrentLogReport] = useState<ReportItem | null>(null);
  const [monitorTaskModalVisible, setMonitorTaskModalVisible] = useState(false);

  const [groupForm] = Form.useForm();

  // 操作日志接口
  interface OperationLog {
    id: string;
    reportId: string;
    operation: 'CREATE' | 'UPDATE' | 'DELETE' | 'SHARE' | 'VIEW';
    operator: string;
    operationTime: string;
    description: string;
    details?: string;
  }

  // 模拟操作日志数据
  const getOperationLogs = (reportId: string): OperationLog[] => {
    const baseLogs: OperationLog[] = [
      {
        id: 'log_001',
        reportId: reportId,
        operation: 'CREATE',
        operator: '张三',
        operationTime: '2024-01-15 10:30:00',
        description: '创建了报表',
        details: '使用"体外诊断试剂比价方案"创建了新报表'
      },
      {
        id: 'log_002',
        reportId: reportId,
        operation: 'UPDATE',
        operator: '张三',
        operationTime: '2024-01-15 14:20:00',
        description: '更新了报表内容',
        details: '修改了报表标题和描述信息'
      },
      {
        id: 'log_003',
        reportId: reportId,
        operation: 'VIEW',
        operator: '李四',
        operationTime: '2024-01-16 09:15:00',
        description: '查看了报表',
        details: '查看了报表详情页面'
      },
      {
        id: 'log_004',
        reportId: reportId,
        operation: 'SHARE',
        operator: '张三',
        operationTime: '2024-01-16 11:30:00',
        description: '分享了报表',
        details: '生成了分享链接，发送给了相关人员'
      },
      {
        id: 'log_005',
        reportId: reportId,
        operation: 'UPDATE',
        operator: '王五',
        operationTime: '2024-01-17 16:45:00',
        description: '编辑了报表',
        details: '更新了报表的数据源配置'
      }
    ];

    // 为不同报表生成一些随机变化的时间
    return baseLogs.map((log, index) => ({
      ...log,
      operationTime: dayjs(log.operationTime)
        .subtract(Math.floor(Math.random() * 30), 'day')
        .format('YYYY-MM-DD HH:mm:ss')
    }));
  };

  // 监控结果预览配置（供右侧内容复用）
  const monitoringPreviewData = [
    { skuCode: 'SKU001', productName: '迪安诊断技术集团股份有限公司', brand: '罗氏/Roche', supplierName: '杭州迪安医学检验中心有限公司', productCode: 'SKU01', productSpec: '数码打印机/数码复印机', unitPrice: 1800, supplierCode: '罗氏诊断', supplierType: '电子设备', baseSupplier: '罗氏诊断', basePrice: 190, baseProductCode: '罗氏诊断', baseSpec: '专用耗材', diffRate: 5.26, groupSupplier: '迪安诊断技术集团', groupPrice: 1800, groupProductCode: '产品编码', groupSpec: '集团采购' },
    { skuCode: 'SKU001', productName: '迪安诊断技术集团股份有限公司', brand: '罗氏/Roche', supplierName: '杭州迪安医学检验中心有限公司', productCode: 'SKU02', productSpec: '数码打印机/复印机 12%', unitPrice: 1500, supplierCode: '罗氏诊断', supplierType: '电子设备', baseSupplier: '罗氏诊断', basePrice: 190, baseProductCode: '罗氏诊断', baseSpec: '专用耗材', diffRate: 3.26, groupSupplier: '迪安诊断技术集团', groupPrice: 1628, groupProductCode: '产品编码', groupSpec: '集团采购' },
    { skuCode: 'SKU001', productName: '杭州凯莱谱精准医疗检测技术有限公司', brand: '罗氏/Roche', supplierName: '杭州凯莱谱精准医疗检测技术有限公司', productCode: 'SKU01', productSpec: '数码打印机/数码复印机', unitPrice: 1800, supplierCode: '罗氏诊断', supplierType: '电子设备', baseSupplier: '罗氏诊断', basePrice: 180, baseProductCode: '罗氏诊断', baseSpec: '专用耗材', diffRate: 0, groupSupplier: '迪安诊断技术集团', groupPrice: 1800, groupProductCode: '产品编码', groupSpec: '集团采购' },
    { skuCode: 'SKU002', productName: '迪安诊断技术集团股份有限公司', brand: '罗氏/Roche', supplierName: '杭州迪安医学检验中心有限公司', productCode: 'SKU01', productSpec: '全自动生化分析仪耗材(100…)', unitPrice: 175000, supplierCode: '罗氏诊断', supplierType: '分析仪器', baseSupplier: '罗氏诊断', basePrice: 17100, baseProductCode: '罗氏诊断', baseSpec: '专用耗材', diffRate: 2.34, groupSupplier: '迪安诊断技术集团', groupPrice: 165200, groupProductCode: '产品编码', groupSpec: '集团采购' },
    { skuCode: 'SKU002', productName: '迪安诊断技术集团股份有限公司', brand: '罗氏/Roche', supplierName: '杭州迪安医学检验中心有限公司', productCode: 'SKU02', productSpec: '全自动生化分析仪耗材(100…)', unitPrice: 175000, supplierCode: '罗氏诊断', supplierType: '分析仪器', baseSupplier: '罗氏诊断', basePrice: 17100, baseProductCode: '罗氏诊断', baseSpec: '专用耗材', diffRate: 4.12, groupSupplier: '迪安诊断技术集团', groupPrice: 176200, groupProductCode: '产品编码', groupSpec: '集团采购' }
  ];

  const monitoringS2DataConfig = {
    fields: {
      rows: ['skuCode', 'productName', 'brand', 'supplierName'],
      columns: [],
      values: ['productCode', 'productSpec', 'unitPrice', 'supplierCode', 'supplierType', 'baseSupplier', 'basePrice', 'baseProductCode', 'baseSpec', 'diffRate', 'groupSupplier', 'groupPrice', 'groupProductCode', 'groupSpec'],
      valueInCols: true
    },
    meta: [
      { field: 'skuCode', name: '产品编码' },
      { field: 'productName', name: '产品名称' },
      { field: 'brand', name: '品牌' },
      { field: 'supplierName', name: '供应商名称' },
      { field: 'productCode', name: '供应商SKU' },
      { field: 'productSpec', name: '供应商分类' },
      { field: 'unitPrice', name: '供应商价格', formatter: (v: any) => (v ? `¥${Number(v).toLocaleString()}` : '-') },
      { field: 'supplierCode', name: '供应商编码' },
      { field: 'supplierType', name: '供应商类型' },
      { field: 'baseSupplier', name: '基准供应商' },
      { field: 'basePrice', name: '基准价格', formatter: (v: any) => (v ? `¥${Number(v).toLocaleString()}` : '-') },
      { field: 'baseProductCode', name: '基准SKU' },
      { field: 'baseSpec', name: '基准分类' },
      { field: 'diffRate', name: '差异率', formatter: (v: any) => (v !== undefined ? `${Number(v).toFixed(2)}%` : '-') },
      { field: 'groupSupplier', name: '集团供应商' },
      { field: 'groupPrice', name: '集团价格', formatter: (v: any) => (v ? `¥${Number(v).toLocaleString()}` : '-') },
      { field: 'groupProductCode', name: '集团SKU' },
      { field: 'groupSpec', name: '集团分类' }
    ],
    data: monitoringPreviewData
  };

  const monitoringS2Options = {
    width: 1400,
    height: 500,
    interaction: {
      selectedCellsSpotlight: true,
      hoverHighlight: true
    },
    style: {
      layoutWidthType: 'adaptive' as const,
      cellCfg: {
        height: 36
      }
    },
    conditions: {
      text: [
        {
          field: 'diffRate',
          mapping: (value: string | number) => {
            const numVal = Number(value);
            if (numVal > 10) return { fill: '#ff4d4f' };
            if (numVal > 5) return { fill: '#faad14' };
            return { fill: '#52c41a' };
          }
        }
      ]
    }
  };

  // 查看报表日志
  const handleViewReportLog = (report: ReportItem) => {
    setCurrentLogReport(report);
    setLogModalVisible(true);
  };

  // 获取操作类型的中文名称和颜色
  const getOperationInfo = (operation: string) => {
    const operationMap: Record<string, { name: string; color: string }> = {
      CREATE: { name: '创建', color: 'green' },
      UPDATE: { name: '更新', color: 'blue' },
      DELETE: { name: '删除', color: 'red' },
      SHARE: { name: '分享', color: 'orange' },
      VIEW: { name: '查看', color: 'gray' }
    };
    return operationMap[operation] || { name: operation, color: 'default' };
  };

  // 构建树形数据
  const buildTreeData = (): DataNode[] => {
    return groups.map(group => ({
      title: group.name,
      key: group.id,
      icon: <FolderOutlined />,
      children: reports
        .filter(report => report.groupId === group.id)
        .map(report => ({
          title: report.name,
          key: report.id,
          icon: <FileTextOutlined />,
          isLeaf: true,
          reportData: report
        }))
    }));
  };

  // 处理树节点选择
  const handleSelect = useCallback(
    (selectedKeys: React.Key[], info: { selected: boolean; node: EventDataNode<DataNode> }) => {
      const { node } = info;

      if (node.isLeaf) {
        // 选择报表
        const report = reports.find(r => r.id === node.key);
        if (report) {
          setSelectedReport(report);
          setSelectedGroup(null);
        }
      } else {
        // 选择分组
        setSelectedGroup(node.key as string);
        setSelectedReport(null);
        // 展开该分组
        setExpandedKeys(prev => [...prev.filter(k => k !== node.key), node.key]);
      }
    },
    [reports]
  );

  // 新增分组
  const handleAddGroup = () => {
    groupForm.resetFields();
    setEditingGroup(null);
    setGroupModalVisible(true);
  };

  // 编辑分组
  const handleEditGroup = (group: ReportGroup) => {
    setEditingGroup(group);
    groupForm.setFieldsValue({
      name: group.name,
      description: group.description
    });
    setGroupModalVisible(true);
  };

  // 删除分组
  const handleDeleteGroup = (groupId: string) => {
    Modal.confirm({
      title: '确认删除分组',
      content: '删除分组后，该分组下的所有报表也将被删除，此操作不可恢复。',
      okText: '确定删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        const groupReports = reports.filter(report => report.groupId === groupId);
        if (groupReports.length > 0) {
          message.warning('该分组下还有报表，请先移动或删除报表');
          return;
        }

        setGroups(groups.filter(g => g.id !== groupId));
        if (selectedGroup === groupId) {
          setSelectedGroup(null);
        }
        message.success('分组删除成功');
      }
    });
  };

  const handleGroupSubmit = async (values: any) => {
    try {
      if (editingGroup) {
        // 编辑现有分组
        setGroups(groups.map(group =>
          group.id === editingGroup.id
            ? { ...group, name: values.name, description: values.description }
            : group
        ));
        message.success('分组更新成功');
      } else {
        // 创建新分组
        const newGroup: ReportGroup = {
          id: `group_${Date.now()}`,
          name: values.name,
          description: values.description,
          createTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
        };

        setGroups([...groups, newGroup]);
        message.success('分组创建成功');
      }

      setGroupModalVisible(false);
      setEditingGroup(null);
    } catch (error) {
      message.error('操作失败');
    }
  };

  // 构建带操作菜单的树形数据
  const buildTreeDataWithMenu = (): DataNode[] => {
    return groups.map(group => {
      const groupReports = reports.filter(report => report.groupId === group.id);
      const isSelected = selectedGroup === group.id;

      return {
        title: (
          <div className={`flex justify-between items-center pr-2 group rounded px-2 py-1 ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
            <span className="flex-1 truncate">{group.name}</span>
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'edit',
                    label: '编辑分组',
                    icon: <EditOutlined />,
                    onClick: () => handleEditGroup(group)
                  },
                  {
                    key: 'delete',
                    label: '删除分组',
                    icon: <DeleteOutlined />,
                    danger: true,
                    onClick: () => handleDeleteGroup(group.id)
                  }
                ]
              }}
              trigger={['click']}
              placement="bottomRight"
            >
              <Button
                type="text"
                size="small"
                icon={<MoreOutlined />}
                className={`opacity-60 group-hover:opacity-100 ml-2 transition-opacity ${isSelected ? 'text-blue-600' : ''}`}
                onClick={(e) => e.stopPropagation()}
              />
            </Dropdown>
          </div>
        ),
        key: group.id,
        icon: <FolderOutlined className={isSelected ? 'text-blue-600' : ''} />,
        children: groupReports.map(report => ({
          title: report.name,
          key: report.id,
          icon: <FileTextOutlined />,
          isLeaf: true,
          reportData: report
        }))
      };
    });
  };

  // 获取分组下的报表
  const getGroupReports = (groupId: string) => {
    return reports.filter(report => report.groupId === groupId);
  };

  
  // 编辑报表
  const handleEditReport = (report: ReportItem) => {
    setEditingReport(report);
    Modal.info({
      title: '编辑报表',
      content: (
        <div>
          <p>报表名称：{report.name}</p>
          <p>创建时间：{report.createTime}</p>
          <p>状态：{report.status === 'PUBLISHED' ? '已发布' : '草稿'}</p>
          <p>这里可以添加编辑表单...</p>
        </div>
      ),
      width: 600,
      onOk: () => {
        setEditingReport(null);
        message.info('编辑功能待实现');
      }
    });
  };

  // 分享报表
  const handleShareReport = (report: ReportItem) => {
    const link = `${window.location.origin}/share/report/${report.id}`;
    setShareLink(link);
    setShareModalVisible(true);
  };

  const handleCreateMonitorTask = (report: ReportItem) => {
    const reportName = encodeURIComponent(report.name);
    navigate(`/monitoring-management?reportId=${report.id}&reportName=${reportName}&schemeId=${report.schemeId}`);
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    message.success('分享链接已复制到剪贴板');
  };

  const [totalDrawerOpen, setTotalDrawerOpen] = useState(false);
  const [showGrandTotal, setShowGrandTotal] = useState(true);
  const [showSubTotal, setShowSubTotal] = useState(false);
  const [totalScope, setTotalScope] = useState<TotalScope>('all_filtered');
  const [subTotalGroupBy, setSubTotalGroupBy] = useState<'skuCode' | 'supplierName'>('supplierName');
  const [totalMetricSettings, setTotalMetricSettings] = useState<TotalMetricSetting[]>([
    { key: 'unitPrice', label: '供应商价格', enabled: true, agg: 'sum' },
    { key: 'basePrice', label: '基准价格', enabled: true, agg: 'sum' },
    { key: 'groupPrice', label: '集团价格', enabled: true, agg: 'sum' },
    { key: 'diffRate', label: '差异率', enabled: false, agg: 'avg' }
  ]);

  const [selectedPreviewRowKeys, setSelectedPreviewRowKeys] = useState<React.Key[]>([]);
  const [previewPage, setPreviewPage] = useState(1);
  const [previewPageSize, setPreviewPageSize] = useState(5);

  const previewBaseRows = monitoringPreviewData;

  const computeAggValue = (rows: typeof previewBaseRows, field: TotalMetricKey, agg: AggType) => {
    if (agg === 'count') return rows.length;
    const nums = rows
      .map((r: any) => Number(r[field]))
      .filter((v) => Number.isFinite(v));

    if (nums.length === 0) return 0;
    if (agg === 'sum') return nums.reduce((a, b) => a + b, 0);
    return nums.reduce((a, b) => a + b, 0) / nums.length;
  };

  const getScopeRows = () => {
    if (totalScope === 'selected') {
      const keySet = new Set(selectedPreviewRowKeys);
      return previewBaseRows.filter((r: any) => keySet.has(r.productCode));
    }
    if (totalScope === 'current_page') {
      const start = (previewPage - 1) * previewPageSize;
      return previewBaseRows.slice(start, start + previewPageSize);
    }
    return previewBaseRows;
  };

  const renderMetricValue = (field: TotalMetricKey, value: number, agg: AggType) => {
    if (agg === 'count') return value;
    if (field === 'diffRate') return `${Number(value).toFixed(2)}%`;
    return `¥${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  };

  const buildSubtotalRows = () => {
    if (!showSubTotal) return previewBaseRows;

    const grouped = new Map<string, typeof previewBaseRows>();
    for (const row of previewBaseRows as any[]) {
      const k = String(row[subTotalGroupBy] ?? '-');
      const prev = grouped.get(k) ?? [];
      prev.push(row);
      grouped.set(k, prev);
    }

    const merged: any[] = [];
    for (const [k, rows] of grouped.entries()) {
      merged.push(...rows);

      const subtotalRow: any = {
        __rowType: 'subtotal',
        productCode: `__subtotal__${subTotalGroupBy}__${k}`,
        skuCode: '',
        supplierName: '',
        productName: '',
        brand: '',
        productSpec: '',
        supplierCode: '',
        supplierType: '',
        baseSupplier: '',
        baseProductCode: '',
        baseSpec: '',
        groupSupplier: '',
        groupProductCode: '',
        groupSpec: ''
      };

      subtotalRow[subTotalGroupBy] = `小计（${k}）`;

      for (const m of totalMetricSettings) {
        if (!m.enabled) continue;
        subtotalRow[m.key] = computeAggValue(rows, m.key, m.agg);
      }

      merged.push(subtotalRow);
    }
    return merged;
  };

  // 渲染右侧内容
  const renderRightContent = () => {
    if (selectedReport) {
      const relatedMonitorTasks = monitorTasks.filter(t => t.reportId === selectedReport.id);
      const previewRowsWithSubTotal = buildSubtotalRows();
      const scopeRows = getScopeRows();
      const enabledMetrics = totalMetricSettings.filter(m => m.enabled);

      return (
        <div className="h-full flex flex-col">
          <div className="flex justify-between items-center mb-4 pb-4 border-b">
            <div>
              <Title level={4} className="mb-2">{selectedReport.name}</Title>
              <Space>
                <Text type="secondary">创建者：{selectedReport.creator}</Text>
                <Text type="secondary">创建时间：{selectedReport.createTime}</Text>
                <Text type="secondary">状态：{selectedReport.status === 'PUBLISHED' ? '已发布' : '草稿'}</Text>
              </Space>
            </div>
            <Space>
              <Button
                icon={<EditOutlined />}
                onClick={() => handleEditReport(selectedReport)}
              >
                编辑
              </Button>
              <Button
                icon={<ShareAltOutlined />}
                onClick={() => handleShareReport(selectedReport)}
              >
                分享
              </Button>
            </Space>
          </div>

          <div className="flex-1 bg-gray-50 rounded-lg overflow-auto">
            <Card size="small" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <Button size="small">筛选设置</Button>
                  <Button size="small">导出</Button>
                  <Button size="small" onClick={() => setTotalDrawerOpen(true)}>汇总设置</Button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Button
                    size="small"
                    onClick={() => setMonitorTaskModalVisible(true)}
                    disabled={relatedMonitorTasks.length === 0}
                  >
                    查看监控任务
                  </Button>
                  <Button
                    size="small"
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => handleCreateMonitorTask(selectedReport)}
                  >
                    创建监控任务
                  </Button>
                </div>
              </div>
            </Card>
            <Card bodyStyle={{ padding: 0 }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 24 }}>
                  <div>
                    <Text type="secondary">组织名称</Text>
                    <div style={{ borderBottom: '2px solid #1890ff', paddingBottom: 4 }}>
                      <Text strong>集团总部</Text>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ width: '100%', overflowX: 'auto' }}>
                <SheetComponent
                  dataCfg={monitoringS2DataConfig}
                  options={monitoringS2Options}
                  sheetType="pivot"
                />
              </div>
            </Card>

            <Card title="汇总预览（原型）" style={{ marginTop: 16 }}>
              <Table
                size="small"
                rowKey={(r: any) => r.productCode}
                dataSource={previewRowsWithSubTotal as any[]}
                pagination={{
                  current: previewPage,
                  pageSize: previewPageSize,
                  total: previewBaseRows.length,
                  showSizeChanger: true
                }}
                onChange={(pagination) => {
                  setPreviewPage(pagination.current || 1);
                  setPreviewPageSize(pagination.pageSize || 5);
                }}
                rowSelection={{
                  selectedRowKeys: selectedPreviewRowKeys,
                  onChange: (keys) => setSelectedPreviewRowKeys(keys),
                  getCheckboxProps: (record: any) => ({
                    disabled: record.__rowType === 'subtotal'
                  })
                }}
                rowClassName={(record: any) => (record.__rowType === 'subtotal' ? 'bg-gray-50 font-medium' : '')}
                columns={[
                  {
                    title: 'SKU',
                    dataIndex: 'skuCode',
                    width: 90,
                    render: (v: any, record: any) => (record.__rowType === 'subtotal' ? '' : v)
                  },
                  {
                    title: '供应商',
                    dataIndex: 'supplierName',
                    width: 220,
                    render: (v: any) => v
                  },
                  {
                    title: '供应商SKU',
                    dataIndex: 'productCode',
                    width: 110,
                    render: (v: any, record: any) => (record.__rowType === 'subtotal' ? '' : v)
                  },
                  {
                    title: '供应商价格',
                    dataIndex: 'unitPrice',
                    align: 'right' as const,
                    width: 120,
                    render: (v: any, record: any) => {
                      const n = Number(v);
                      if (!Number.isFinite(n)) return '-';
                      return record.__rowType === 'subtotal'
                        ? renderMetricValue('unitPrice', n, totalMetricSettings.find(m => m.key === 'unitPrice')?.agg || 'sum')
                        : `¥${n.toLocaleString()}`;
                    }
                  },
                  {
                    title: '基准价格',
                    dataIndex: 'basePrice',
                    align: 'right' as const,
                    width: 120,
                    render: (v: any, record: any) => {
                      const n = Number(v);
                      if (!Number.isFinite(n)) return '-';
                      return record.__rowType === 'subtotal'
                        ? renderMetricValue('basePrice', n, totalMetricSettings.find(m => m.key === 'basePrice')?.agg || 'sum')
                        : `¥${n.toLocaleString()}`;
                    }
                  },
                  {
                    title: '集团价格',
                    dataIndex: 'groupPrice',
                    align: 'right' as const,
                    width: 120,
                    render: (v: any, record: any) => {
                      const n = Number(v);
                      if (!Number.isFinite(n)) return '-';
                      return record.__rowType === 'subtotal'
                        ? renderMetricValue('groupPrice', n, totalMetricSettings.find(m => m.key === 'groupPrice')?.agg || 'sum')
                        : `¥${n.toLocaleString()}`;
                    }
                  },
                  {
                    title: '差异率',
                    dataIndex: 'diffRate',
                    align: 'right' as const,
                    width: 100,
                    render: (v: any, record: any) => {
                      const n = Number(v);
                      if (!Number.isFinite(n) || n === 0) return record.__rowType === 'subtotal' ? '0.00%' : '-';
                      return record.__rowType === 'subtotal' ? `${n.toFixed(2)}%` : `${n.toFixed(2)}%`;
                    }
                  }
                ]}
                summary={() => {
                  if (!showGrandTotal || enabledMetrics.length === 0) return null;

                  const metricToValue = new Map<TotalMetricKey, { value: number; agg: AggType }>();
                  for (const m of enabledMetrics) {
                    metricToValue.set(m.key, { value: computeAggValue(scopeRows as any, m.key, m.agg), agg: m.agg });
                  }

                  return (
                    <Table.Summary fixed>
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={3}>
                          <span style={{ fontWeight: 600 }}>总计</span>
                          <span style={{ color: '#8c8c8c', marginLeft: 8 }}>
                            {totalScope === 'all_filtered' && '（按当前筛选全量）'}
                            {totalScope === 'current_page' && '（仅当前页）'}
                            {totalScope === 'selected' && `（勾选 ${selectedPreviewRowKeys.length} 行）`}
                          </span>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={3} align="right">
                          {metricToValue.has('unitPrice')
                            ? renderMetricValue('unitPrice', metricToValue.get('unitPrice')!.value, metricToValue.get('unitPrice')!.agg)
                            : '-'}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={4} align="right">
                          {metricToValue.has('basePrice')
                            ? renderMetricValue('basePrice', metricToValue.get('basePrice')!.value, metricToValue.get('basePrice')!.agg)
                            : '-'}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={5} align="right">
                          {metricToValue.has('groupPrice')
                            ? renderMetricValue('groupPrice', metricToValue.get('groupPrice')!.value, metricToValue.get('groupPrice')!.agg)
                            : '-'}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={6} align="right">
                          {metricToValue.has('diffRate')
                            ? renderMetricValue('diffRate', metricToValue.get('diffRate')!.value, metricToValue.get('diffRate')!.agg)
                            : '-'}
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    </Table.Summary>
                  );
                }}
              />
            </Card>

            <Modal
              title="关联监控任务"
              open={monitorTaskModalVisible}
              onCancel={() => setMonitorTaskModalVisible(false)}
              footer={null}
              width={720}
            >
              {relatedMonitorTasks.length > 0 ? (
                <Table
                  size="small"
                  rowKey={(r: any) => r.id}
                  dataSource={relatedMonitorTasks as any[]}
                  pagination={false}
                  columns={[
                    {
                      title: '任务名称',
                      dataIndex: 'name',
                      key: 'name',
                      render: (text: string, record: any) => (
                        <Space>
                          <Text strong>{text}</Text>
                          {record.enabled ? (
                            <Badge status="success" text="运行中" />
                          ) : (
                            <Badge status="default" text="已停用" />
                          )}
                        </Space>
                      )
                    },
                    {
                      title: '执行频率',
                      dataIndex: 'scheduleSummary',
                      key: 'scheduleSummary',
                      width: 160,
                      render: (v: string) => <Text>{v}</Text>
                    },
                    {
                      title: '最近执行',
                      dataIndex: 'lastCheck',
                      key: 'lastCheck',
                      width: 160,
                      render: (v: string) => <Text type="secondary">{v}</Text>
                    },
                    {
                      title: '操作',
                      key: 'actions',
                      width: 160,
                      render: () => (
                        <Space>
                          <Button size="small" onClick={() => message.info('查看任务详情：待接入')}>
                            查看
                          </Button>
                        </Space>
                      )
                    }
                  ]}
                />
              ) : (
                <Empty description="暂无关联监控任务" />
              )}
            </Modal>
          </div>

          <Drawer
            title="汇总设置（原型）"
            open={totalDrawerOpen}
            onClose={() => setTotalDrawerOpen(false)}
            width={520}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>显示总计行</Text>
                <Switch checked={showGrandTotal} onChange={setShowGrandTotal} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>显示小计行</Text>
                <Switch checked={showSubTotal} onChange={setShowSubTotal} />
              </div>

              <div>
                <Text>汇总范围</Text>
                <div style={{ marginTop: 8 }}>
                  <Radio.Group
                    value={totalScope}
                    onChange={(e) => setTotalScope(e.target.value)}
                    optionType="button"
                    buttonStyle="solid"
                  >
                    <Radio.Button value="all_filtered">全量（按筛选）</Radio.Button>
                    <Radio.Button value="current_page">当前页</Radio.Button>
                    <Radio.Button value="selected">勾选行</Radio.Button>
                  </Radio.Group>
                </div>
              </div>

              <div>
                <Text>小计分组维度</Text>
                <div style={{ marginTop: 8 }}>
                  <Select
                    value={subTotalGroupBy}
                    onChange={setSubTotalGroupBy}
                    disabled={!showSubTotal}
                    style={{ width: '100%' }}
                  >
                    <Option value="supplierName">供应商</Option>
                    <Option value="skuCode">SKU</Option>
                  </Select>
                </div>
              </div>

              <Divider style={{ margin: '8px 0' }} />

              <div>
                <Text>汇总指标</Text>
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {totalMetricSettings.map((m) => (
                    <div
                      key={m.key}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 160px',
                        gap: 12,
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <span>{m.label}</span>
                        <Switch
                          checked={m.enabled}
                          onChange={(checked) => {
                            setTotalMetricSettings((prev) =>
                              prev.map((x) => (x.key === m.key ? { ...x, enabled: checked } : x))
                            );
                          }}
                        />
                      </div>

                      <Select
                        value={m.agg}
                        disabled={!m.enabled}
                        onChange={(agg) => {
                          setTotalMetricSettings((prev) =>
                            prev.map((x) => (x.key === m.key ? { ...x, agg } : x))
                          );
                        }}
                      >
                        <Option value="sum">合计</Option>
                        <Option value="avg">平均</Option>
                        <Option value="count">计数</Option>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Drawer>
        </div>
      );
    }

    if (selectedGroup) {
      const groupReports = getGroupReports(selectedGroup);
      const group = groups.find(g => g.id === selectedGroup);

      return (
        <div className="h-full">
          <div className="mb-6">
            <Title level={4}>{group?.name}</Title>
            <Text type="secondary">{group?.description}</Text>
          </div>

          {groupReports.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {groupReports.map(report => (
                <Card
                  key={report.id}
                  hoverable
                  className="cursor-pointer transition-all hover:shadow-lg hover:border-blue-200 border-2"
                  onClick={() => setSelectedReport(report)}
                  bodyStyle={{ padding: '20px' }}
                >
                  <div className="flex flex-col h-full">
                    {/* 图标和标题 */}
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
                        <FileTextOutlined className="text-blue-500 text-lg" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm truncate">
                          {report.name}
                        </div>
                      </div>
                    </div>

                    {/* 描述 */}
                    <div className="flex-1 mb-4">
                      <Text type="secondary" className="text-xs leading-relaxed line-clamp-3">
                        {report.description}
                      </Text>
                    </div>

                    {/* 底部信息 */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center text-xs text-gray-500">
                        <span>{report.creator}</span>
                        <span className="mx-2">·</span>
                        <span>{dayjs(report.createTime).format('YYYY-MM-DD')}</span>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex space-x-1">
                        <Button
                          type="text"
                          size="small"
                          icon={<EditOutlined />}
                          className="text-gray-400 hover:text-blue-500 p-1"
                          onClick={(e) => { e.stopPropagation(); handleEditReport(report); }}
                        />
                        <Button
                          type="text"
                          size="small"
                          icon={<HistoryOutlined />}
                          className="text-gray-400 hover:text-blue-500 p-1"
                          onClick={(e) => { e.stopPropagation(); handleViewReportLog(report); }}
                        />
                        <Button
                          type="text"
                          size="small"
                          icon={<ShareAltOutlined />}
                          className="text-gray-400 hover:text-blue-500 p-1"
                          onClick={(e) => { e.stopPropagation(); handleShareReport(report); }}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Empty
              description="该分组下暂无报表"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </div>
      );
    }

    return (
      <div className="h-full flex items-center justify-center">
        <Empty
          description="请选择左侧分组或报表查看内容"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <div className="bg-white shadow-sm p-4 border-b">
        <div>
          <Title level={3} className="mb-0">报表中心</Title>
          <Text type="secondary">管理和查看各类比价分析报表</Text>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧树形目录 */}
        <div className="w-80 bg-white border-r overflow-hidden flex flex-col">
          {/* 搜索区域 */}
          <div className="p-4 border-b">
            <Search
              placeholder="搜索报表..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              prefix={<SearchOutlined />}
              allowClear
            />
          </div>

          {/* 分组管理区域 */}
          <div className="border-b">
            <div className="px-4 py-3 flex justify-between items-center">
              <span className="font-medium text-gray-700">报表分组</span>
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                onClick={handleAddGroup}
              >
                新建分组
              </Button>
            </div>
          </div>

          {/* 树形结构区域 */}
          <div className="flex-1 overflow-auto p-4">
            <style>{`
              .custom-tree .ant-tree-node-content-wrapper {
                display: flex;
                align-items: center;
                min-height: 32px;
              }
              .custom-tree .ant-tree-title {
                flex: 1;
                display: flex;
                align-items: center;
              }
              .custom-tree .ant-tree-switcher {
                display: flex;
                align-items: center;
              }
              .custom-tree .ant-tree-node-content-wrapper:hover {
                background-color: transparent;
              }
              .custom-tree .ant-tree-node-content-wrapper.ant-tree-node-selected {
                background-color: transparent;
              }
            `}</style>
            <Tree
              showIcon
              treeData={buildTreeDataWithMenu()}
              onSelect={handleSelect}
              expandedKeys={expandedKeys}
              onExpand={setExpandedKeys}
              blockNode
              className="custom-tree"
            />
          </div>
        </div>

        {/* 右侧内容区域 */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 h-full">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <Spin size="large" />
              </div>
            ) : (
              renderRightContent()
            )}
          </div>
        </div>
      </div>

      {/* 新增/编辑分组弹窗 */}
      <Modal
        title={editingGroup ? "编辑分组" : "新增分组"}
        open={groupModalVisible}
        onCancel={() => {
          setGroupModalVisible(false);
          setEditingGroup(null);
        }}
        onOk={() => groupForm.submit()}
        destroyOnClose
      >
        <Form
          form={groupForm}
          layout="vertical"
          onFinish={handleGroupSubmit}
        >
          <Form.Item
            name="name"
            label="分组名称"
            rules={[{ required: true, message: '请输入分组名称' }]}
          >
            <Input placeholder="请输入分组名称" />
          </Form.Item>

          <Form.Item
            name="description"
            label="分组描述"
          >
            <Input.TextArea placeholder="请输入分组描述" rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 分享链接弹窗 */}
      <Modal
        title="分享报表"
        open={shareModalVisible}
        onCancel={() => setShareModalVisible(false)}
        footer={[
          <Button key="copy" type="primary" onClick={handleCopyShareLink}>
            复制链接
          </Button>,
          <Button key="close" onClick={() => setShareModalVisible(false)}>
            关闭
          </Button>
        ]}
      >
        <div className="p-4 bg-gray-50 rounded">
          <Text code className="break-all">{shareLink}</Text>
        </div>
        <Text type="secondary" className="text-sm mt-2 block">
          通过此链接，其他人可以查看此报表内容
        </Text>
      </Modal>

      {/* 操作日志弹窗 */}
      <Modal
        title={`操作日志 - ${currentLogReport?.name}`}
        open={logModalVisible}
        onCancel={() => {
          setLogModalVisible(false);
          setCurrentLogReport(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setLogModalVisible(false);
            setCurrentLogReport(null);
          }}>
            关闭
          </Button>
        ]}
        width={700}
      >
        {currentLogReport && (
          <div className="max-h-96 overflow-auto">
            <List
              dataSource={getOperationLogs(currentLogReport.id)}
              renderItem={(log) => {
                const operationInfo = getOperationInfo(log.operation);
                return (
                  <List.Item className="border-b border-gray-100">
                    <div className="w-full">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          <Tag color={operationInfo.color}>
                            {operationInfo.name}
                          </Tag>
                          <span className="font-medium">{log.operator}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {dayjs(log.operationTime).format('YYYY-MM-DD HH:mm:ss')}
                        </span>
                      </div>
                      <div className="text-sm text-gray-700 mb-1">
                        {log.description}
                      </div>
                      {log.details && (
                        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                          {log.details}
                        </div>
                      )}
                    </div>
                  </List.Item>
                );
              }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReportCenter;