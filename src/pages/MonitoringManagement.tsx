import React, { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Button,
  Form,
  Input,
  Select,
  Space,
  message,
  Row,
  Col,
  Typography,
  Tag,
  Tooltip,
  Table,
  Statistic,
  Badge,
  Tabs,
  Radio,
  Tree,
  Switch,
  Modal,
  Checkbox
} from 'antd';
import {
  EyeOutlined,
  DeleteOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ExclamationCircleOutlined,
  SendOutlined
} from '@ant-design/icons';
import {
  Target,
  Activity
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { SheetComponent } from '@antv/s2-react';
import '@antv/s2-react/dist/s2-react.min.css';
import { Cron } from 'react-js-cron';
import 'react-js-cron/dist/styles.css';
import QueryConditionsPanel, { QueryCondition, FieldMetadata } from '../components/QueryConditionsPanel';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

interface MonitorTask {
  id: string;
  name: string;
  description: string;
  schemeId: string;
  schemeName: string;
  dimensions: string[];
  metrics: string[];
  rules: any[];
  enabled: boolean;
  lastCheck: string;
  monthlyAlertCount: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ruleSummary: string;
  scheduleSummary: string;
  creator: string;
}

interface AlertNotificationResult {
  id: string;
  channel: 'email' | 'dingtalk' | 'wechat';
  target: string;
  status: 'success' | 'failed' | 'pending';
  detail?: string;
}

interface AlertRecord {
  id: string;
  taskId: string;
  taskName: string;
  taskCreator: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ruleSummary: string;
  hitCount: number;
  dimensionValues: string[];
  timestamp: string;
  status: 'active' | 'acknowledged' | 'resolved';
  notifications: AlertNotificationResult[];
}

interface ReportFieldItem {
  id: string;
  name: string;
  type: 'dimension' | 'metric' | 'calculated' | 'baseline';
  description?: string;
}

type LayoutPosition = 'row' | 'column' | 'value';

interface LayoutDroppedItem {
  id: string;
  name: string;
  type: 'dimension' | 'metric' | 'calculated' | 'baseline';
  position: LayoutPosition;
}

const MonitoringManagement: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('tasks');
  const [listView, setListView] = useState<'tasks' | 'alerts'>('tasks');
  const [adminListView, setAdminListView] = useState<'tasks' | 'alerts'>('tasks');
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'preview'>('list');
  const [monitorConditions, setMonitorConditions] = useState<QueryCondition[]>([]);
  const [droppedItems, setDroppedItems] = useState<LayoutDroppedItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<ReportFieldItem | null>(null);
  const [form] = Form.useForm();
  const [expandedKeys, setExpandedKeys] = useState<string[]>(['dimension', 'metric', 'calculated', 'baseline']);
  const [activeInputField, setActiveInputField] = useState<'alertTitle' | 'alertContent' | 'noAlertTitle' | 'noAlertContent' | null>(null);
  const [alertDetail, setAlertDetail] = useState<AlertRecord | null>(null);
  const [alertDetailVisible, setAlertDetailVisible] = useState(false);
  const [notificationDetailRecord, setNotificationDetailRecord] = useState<AlertRecord | null>(null);
  const [notificationDetailVisible, setNotificationDetailVisible] = useState(false);
  const [cronValue, setCronValue] = useState('0 10 * * *');

  const reportContext = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const reportId = params.get('reportId') || '';
    const reportName = params.get('reportName') ? decodeURIComponent(params.get('reportName') as string) : '';
    const schemeId = params.get('schemeId') || '';
    return { reportId, reportName, schemeId };
  }, [location.search]);

  const currentUser = '张三';

  useEffect(() => {
    if (reportContext.reportId) {
      setViewMode('create');
      form.setFieldsValue({
        taskName: `【${reportContext.reportName || '报表'}】监控任务`,
        sourceReportId: reportContext.reportId,
        sourceReportName: reportContext.reportName || reportContext.reportId,
        schemeId: reportContext.schemeId || undefined
      });
    }
  }, [form, reportContext.reportId, reportContext.reportName, reportContext.schemeId]);

  // 可用模板变量
  const templateVariables = [
    { key: 'taskName', label: '任务名称' },
    { key: 'severity', label: '预警等级' },
    { key: 'hitCount', label: '命中记录数' },
    { key: 'time', label: '触发时间' },
    { key: 'schemeName', label: '比价方案' }
  ];

  // 插入变量到输入框
  const insertVariable = (varKey: string) => {
    const varText = `{${varKey}}`;
    if (activeInputField === 'alertTitle') {
      const current = form.getFieldValue('alertNotificationTitle') || '';
      form.setFieldValue('alertNotificationTitle', current + varText);
    } else if (activeInputField === 'alertContent') {
      const current = form.getFieldValue('alertNotificationDescription') || '';
      form.setFieldValue('alertNotificationDescription', current + varText);
    } else if (activeInputField === 'noAlertTitle') {
      const current = form.getFieldValue('noAlertNotificationTitle') || '';
      form.setFieldValue('noAlertNotificationTitle', current + varText);
    } else if (activeInputField === 'noAlertContent') {
      const current = form.getFieldValue('noAlertNotificationDescription') || '';
      form.setFieldValue('noAlertNotificationDescription', current + varText);
    } else {
      message.info('请先点击消息标题或消息内容输入框');
    }
  };

  const handleViewResult = (task: MonitorTask) => {
    // 将任务的关键信息写入表单，用于预览页展示
    form.setFieldsValue({
      taskName: task.name,
      schemeId: task.schemeId,
      severity: task.severity
    });
    setViewMode('preview');
  };

  const handleViewAlertDetail = (record: AlertRecord) => {
    setAlertDetail(record);
    setAlertDetailVisible(true);
  };

  const handleViewNotificationDetail = (record: AlertRecord) => {
    setNotificationDetailRecord(record);
    setNotificationDetailVisible(true);
  };

  const handleTestNotification = async () => {
    try {
      await form.validateFields([
        'notificationReceivers',
        'notificationChannels',
        'alertNotificationTitle',
        'alertNotificationDescription'
      ]);
      message.success('测试通知已发送（示例，无实际推送）');
    } catch {
      message.error('请先完善通知设置');
    }
  };

  const allMonitorTasks: MonitorTask[] = [
    {
      id: '1',
      name: 'CPU价格异常监控',
      description: '监控CPU产品价格波动，超过15%上涨时预警',
      schemeId: 'scheme-001',
      schemeName: 'Q3 CPU价格回顾',
      dimensions: ['供应商', '物料编码', '采购日期'],
      metrics: ['含税价', '差异率'],
      rules: [],
      enabled: true,
      lastCheck: '2025-12-12 08:50:00',
      monthlyAlertCount: 12,
      severity: 'high',
      ruleSummary: '2 个指标条件',
      scheduleSummary: '每天 10:00 执行',
      creator: '张三'
    },
    {
      id: '2',
      name: '供应商协议价监控',
      description: '监控主要供应商协议价变化',
      schemeId: 'scheme-002',
      schemeName: '华东区供应商协议价分析',
      dimensions: ['供应商', '产品类别'],
      metrics: ['协议价', '市场价', '差异额'],
      rules: [],
      enabled: false,
      lastCheck: '2025-12-12 07:05:00',
      monthlyAlertCount: 4,
      severity: 'medium',
      ruleSummary: '1 个指标条件',
      scheduleSummary: '每周一/三 09:30 执行',
      creator: '张三'
    },
    {
      id: '3',
      name: '内存条价格波动监控',
      description: '监控内存条价格波动，超过8%上涨时预警',
      schemeId: 'scheme-003',
      schemeName: '内存条价格趋势分析',
      dimensions: ['供应商', '物料编码'],
      metrics: ['含税价', '差异率'],
      rules: [],
      enabled: true,
      lastCheck: '2025-12-12 09:10:00',
      monthlyAlertCount: 6,
      severity: 'medium',
      ruleSummary: '1 个指标条件',
      scheduleSummary: '每天 09:00 执行',
      creator: '李四'
    }
  ];

  const myMonitorTasks = allMonitorTasks.filter(t => t.creator === currentUser);

  const allAlertRecords: AlertRecord[] = [
    {
      id: '1',
      taskId: '1',
      taskName: 'CPU价格异常监控',
      taskCreator: '张三',
      severity: 'high',
      ruleSummary: '差异率 > 15%',
      hitCount: 32,
      dimensionValues: ['供应商: Intel', '物料编码: i9-14900K'],
      timestamp: '2025-12-12 08:55:00',
      status: 'active',
      notifications: [
        { id: 'n1', channel: 'email', target: 'buyer1@example.com', status: 'success' },
        { id: 'n2', channel: 'email', target: 'buyer2@example.com', status: 'success' },
        { id: 'n3', channel: 'dingtalk', target: '钉钉机器人A', status: 'success' }
      ]
    },
    {
      id: '2',
      taskId: '1',
      taskName: 'CPU价格异常监控',
      taskCreator: '张三',
      severity: 'medium',
      ruleSummary: '差异率 > 10%',
      hitCount: 18,
      dimensionValues: ['供应商: AMD', '物料编码: Ryzen 7'],
      timestamp: '2025-12-12 08:30:00',
      status: 'active',
      notifications: [
        { id: 'n4', channel: 'email', target: 'buyer1@example.com', status: 'failed', detail: 'SMTP 连接超时' },
        { id: 'n5', channel: 'wechat', target: '企微机器人A', status: 'pending' }
      ]
    },
    {
      id: '3',
      taskId: '2',
      taskName: '供应商协议价监控',
      taskCreator: '张三',
      severity: 'medium',
      ruleSummary: '协议价需人工确认',
      hitCount: 5,
      dimensionValues: ['供应商: A集团'],
      timestamp: '2025-12-12 07:00:00',
      status: 'active',
      notifications: [
        { id: 'n6', channel: 'email', target: 'supply_mgr@example.com', status: 'pending' },
        { id: 'n7', channel: 'dingtalk', target: '钉钉机器人B', status: 'pending' }
      ]
    },
    {
      id: '4',
      taskId: '2',
      taskName: '供应商协议价监控',
      taskCreator: '张三',
      severity: 'high',
      ruleSummary: '协议价跌幅 < -20%',
      hitCount: 9,
      dimensionValues: ['供应商: B集团'],
      timestamp: '2025-12-12 06:00:00',
      status: 'active',
      notifications: [
        { id: 'n8', channel: 'email', target: 'supply_mgr@example.com', status: 'failed', detail: '收件人地址不存在' },
        { id: 'n9', channel: 'email', target: 'data_ops@example.com', status: 'failed', detail: 'SMTP 鉴权失败' }
      ]
    },
    {
      id: '5',
      taskId: '2',
      taskName: '供应商协议价监控',
      taskCreator: '张三',
      severity: 'low',
      ruleSummary: '监控初始化',
      hitCount: 0,
      dimensionValues: ['供应商: C集团'],
      timestamp: '2025-12-11 10:00:00',
      status: 'active',
      notifications: []
    },
    {
      id: '6',
      taskId: '3',
      taskName: '内存条价格波动监控',
      taskCreator: '李四',
      severity: 'medium',
      ruleSummary: '差异率 > 8%',
      hitCount: 11,
      dimensionValues: ['供应商: Kingston', '物料编码: DDR5-6000'],
      timestamp: '2025-12-12 09:05:00',
      status: 'active',
      notifications: [
        { id: 'n10', channel: 'email', target: 'data_ops@example.com', status: 'success' }
      ]
    }
  ];

  const myAlertRecords = allAlertRecords.filter(a => a.taskCreator === currentUser);

  // 比价方案选项
  const schemeOptions = [
    { value: 'scheme-001', label: 'Q3 CPU价格回顾' },
    { value: 'scheme-002', label: '华东区供应商协议价分析' },
    { value: 'scheme-003', label: '内存条价格趋势分析' }
  ];

  const dimensionFields: ReportFieldItem[] = [
    { id: 'supplier', name: '供应商', type: 'dimension', description: '采购供应商主体/集团' },
    { id: 'product', name: '物料编码', type: 'dimension', description: '监控对象的标准物料编码' },
    { id: 'category', name: '产品类别', type: 'dimension', description: '如芯片、存储、整机等分类' },
    { id: 'date', name: '采购日期', type: 'dimension', description: '按时间粒度拆分监控' },
    { id: 'organization', name: '采购组织', type: 'dimension', description: '企业/子公司的采购主体' },
    { id: 'brand', name: '品牌', type: 'dimension', description: '聚焦重点品牌或系列' }
  ];

  const metricFields: ReportFieldItem[] = [
    { id: 'price', name: '含税价', type: 'metric', description: '含税采购价格' },
    { id: 'taxfree_price', name: '不含税价', type: 'metric', description: '去税后采购价格' },
    { id: 'diff_rate', name: '差异率', type: 'metric', description: '与基准价的差异百分比' },
    { id: 'diff_amount', name: '差异额', type: 'metric', description: '与基准价的金额差' },
    { id: 'quantity', name: '采购数量', type: 'metric', description: '采购数量/规模' }
  ];

  const calculatedFields: ReportFieldItem[] = [
    { id: 'calc_compare_gap', name: '价差率', type: 'calculated', description: '(含税价-市场价)/市场价' },
    { id: 'calc_std_dev', name: '价格波动指数', type: 'calculated', description: '以历史价格衡量波动' },
    { id: 'calc_rank', name: '价格排名', type: 'calculated', description: '同类产品中的价格排名' }
  ];

  const baselineFields: ReportFieldItem[] = [
    { id: 'baseline_group', name: '集团基准价', type: 'baseline', description: '集团协议/框架价' },
    { id: 'baseline_history', name: '历史均价', type: 'baseline', description: '历史采购平均价格' },
    { id: 'baseline_market', name: '市场监测价', type: 'baseline', description: '市场/行业公开价格' }
  ];

  const treeData = [
    {
      key: 'dimension',
      title: '比对维度',
      children: dimensionFields.map(item => ({
        key: item.id,
        title: item.name,
        isLeaf: true,
        itemData: item
      }))
    },
    {
      key: 'metric',
      title: '业务指标',
      children: metricFields.map(item => ({
        key: item.id,
        title: item.name,
        isLeaf: true,
        itemData: item
      }))
    },
    {
      key: 'calculated',
      title: '计算指标',
      children: calculatedFields.map(item => ({
        key: item.id,
        title: item.name,
        isLeaf: true,
        itemData: item
      }))
    },
    {
      key: 'baseline',
      title: '基准指标',
      children: baselineFields.map(item => ({
        key: item.id,
        title: item.name,
        isLeaf: true,
        itemData: item
      }))
    }
  ];

  const getUsedFieldIds = () => droppedItems.map(item => item.id);

  const handleFieldDragStart = (item: ReportFieldItem) => (e: React.DragEvent<HTMLDivElement>) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleFieldDragEnd = () => {
    setDraggedItem(null);
  };

  const renderTreeNode = (nodeData: any) => {
    const usedIds = getUsedFieldIds();
    const isLeaf = nodeData.isLeaf;
    const item: ReportFieldItem | undefined = nodeData.itemData;
    const isUsed = item && usedIds.includes(item.id);

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          height: 24,
          padding: '0 8px',
          borderRadius: 4,
          cursor: isLeaf && !isUsed ? 'grab' : 'default',
          opacity: isUsed ? 0.5 : 1
        }}
        draggable={isLeaf && !isUsed}
        onDragStart={item ? handleFieldDragStart(item) : undefined}
        onDragEnd={handleFieldDragEnd}
      >
        <span style={{ fontSize: 12, color: isUsed ? '#999' : '#555' }}>{nodeData.title}</span>
      </div>
    );
  };

  // 监控可用字段（模拟数据，供后续扩展为查询条件等）
  const availableFields: FieldMetadata[] = [
    { id: 'supplier', name: '供应商', type: 'dimension', componentType: 'multiSelect', placeholder: '选择供应商' },
    { id: 'product', name: '产品', type: 'dimension', componentType: 'multiSelect', placeholder: '选择产品' },
    { id: 'category', name: '产品类别', type: 'dimension', componentType: 'multiSelect', placeholder: '选择产品类别' },
    { id: 'organization', name: '采购组织', type: 'dimension', componentType: 'multiSelect', placeholder: '选择采购组织' },
    { id: 'brand', name: '品牌', type: 'dimension', componentType: 'multiSelect', placeholder: '选择品牌' },
    { id: 'current_price', name: '当前价格', type: 'metric', componentType: 'numberRange', placeholder: '设置价格区间' },
    { id: 'baseline_price', name: '基准价格', type: 'metric', componentType: 'numberRange', placeholder: '设置基准价格区间' },
    { id: 'price_diff_rate', name: '价格差异率', type: 'metric', componentType: 'numberRange', placeholder: '设置差异率区间(%)' },
    { id: 'price_diff_amount', name: '价格变化额', type: 'metric', componentType: 'numberRange', placeholder: '设置变化额区间' },
    { id: 'purchase_quantity', name: '采购数量', type: 'metric', componentType: 'numberRange', placeholder: '设置数量区间' }
  ];

  const handleConfigDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDropToPosition = (position: LayoutPosition) => (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!draggedItem) return;
    setDroppedItems(prev => {
      if (prev.some(item => item.id === draggedItem.id && item.position === position)) {
        return prev;
      }
      return [
        ...prev,
        {
          id: draggedItem.id,
          name: draggedItem.name,
          type: draggedItem.type,
          position
        }
      ];
    });
  };

  const removeLayoutItem = (id: string, position: LayoutPosition) => {
    setDroppedItems(prev => prev.filter(item => !(item.id === id && item.position === position)));
  };

  const renderConfigRow = (label: string, position: LayoutPosition, color: 'blue' | 'green' | 'orange') => {
    const items = droppedItems.filter(item => item.position === position);
    const colorStyle = {
      blue: { border: '#91caff', label: '#1677ff' },
      green: { border: '#95de64', label: '#52c41a' },
      orange: { border: '#ffbb96', label: '#fa8c16' }
    }[color];

    return (
      <div
        key={position}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          padding: '8px 12px',
          borderBottom: '1px solid #f0f0f0',
          gap: 12
        }}
        onDragOver={handleConfigDragOver}
        onDrop={handleDropToPosition(position)}
      >
        <div style={{ width: 80, color: colorStyle.label, fontWeight: 500 }}>{label}</div>
        <div
          style={{
            flex: 1,
            minHeight: 40,
            border: `1px dashed ${items.length ? colorStyle.border : '#d9d9d9'}`,
            borderRadius: 4,
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8
          }}
        >
          {items.length === 0 ? (
            <Text type="secondary">将字段拖拽到此处</Text>
          ) : (
            items.map(item => (
              <Tag
                key={`${position}-${item.id}`}
                color={color}
                closable
                onClose={e => {
                  e.preventDefault();
                  removeLayoutItem(item.id, position);
                }}
              >
                {item.name}
              </Tag>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderCreatePage = () => {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              <Space>
                <Activity className="h-6 w-6" />
                创建监控任务
              </Space>
            </Title>
            <Text type="secondary">基于比价方案，配置监控视图与预警条件</Text>
          </div>
          <Space>
            <Button onClick={() => setViewMode('list')}>
              返回列表
            </Button>
            <Button
              type="primary"
              onClick={() => {
                const values = form.getFieldsValue();
                if (!values.taskName) {
                  message.error('请填写任务名称');
                  return;
                }
                if (!values.schemeId) {
                  message.error('请选择比价方案');
                  return;
                }
                message.success('监控任务配置已保存（示例，无实际落库）');
                setViewMode('list');
              }}
            >
              保存任务
            </Button>
          </Space>
        </div>

        <Form form={form} layout="vertical">
          {/* 1. 基本信息 */}
          <Card title="基本信息" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="taskName"
                  label="任务名称"
                  rules={[{ required: true, message: '请填写任务名称' }]}
                >
                  <Input placeholder="如：供应价差监控" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="sourceReportName"
                  label="来源报表"
                >
                  <Input placeholder="请选择来源报表" disabled={!!reportContext.reportId} />
                </Form.Item>
                <Form.Item name="sourceReportId" hidden>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="schemeId"
                  label="比价方案"
                  rules={[{ required: true, message: '请选择比价方案' }]}
                >
                  <Select
                    placeholder="选择比价方案"
                    showSearch
                    optionFilterProp="children"
                    disabled={!!reportContext.reportId}
                  >
                    {schemeOptions.map(option => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="severity"
                  label="预警等级"
                  rules={[{ required: true, message: '请选择预警等级' }]}
                >
                  <Select placeholder="选择预警等级">
                    <Option value="low">提示</Option>
                    <Option value="medium">重要</Option>
                    <Option value="high">严重</Option>
                    <Option value="critical">紧急</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="enabled"
                  label="任务状态"
                  valuePropName="checked"
                  initialValue={true}
                >
                  <Switch checkedChildren="启用" unCheckedChildren="停用" />
                </Form.Item>
              </Col>
              <Col span={8} />
            </Row>
          </Card>

          {/* 2. 监控视图 */}
          <Card
            title="监控视图"
            style={{ marginBottom: 16 }}
            bodyStyle={{ padding: 0 }}
            extra={
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={() => {
                  form.validateFields(['monitoringFrequency']).then(() => {
                    setViewMode('preview');
                  }).catch(() => {
                    message.error('请先完成执行设置');
                  });
                }}
              >
                结果预览
              </Button>
            }
          >
            <Row gutter={0} style={{ minHeight: 400 }}>
              {/* 左侧：可用字段 */}
              <Col span={8} style={{ borderRight: '1px solid #f0f0f0', padding: 16 }}>
                <Text strong style={{ marginBottom: 8, display: 'block' }}>可用字段</Text>
                <Tree
                  showLine={false}
                  showIcon={false}
                  defaultExpandAll
                  expandedKeys={expandedKeys}
                  onExpand={keys => setExpandedKeys(keys as string[])}
                  treeData={treeData}
                  titleRender={renderTreeNode}
                />
              </Col>

              {/* 右侧：查询条件 + 布局配置 */}
              <Col span={16} style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <Text strong style={{ marginBottom: 8, display: 'block' }}>监控范围</Text>
                  <QueryConditionsPanel
                    conditions={monitorConditions}
                    onConditionsChange={setMonitorConditions}
                    availableFields={availableFields}
                    predefinedConditions={[]}
                  />
                </div>

                <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
                  <Text strong style={{ marginBottom: 8, display: 'block' }}>布局配置</Text>
                  {renderConfigRow('行维度', 'row', 'blue')}
                  {renderConfigRow('列维度', 'column', 'green')}
                  {renderConfigRow('监控指标', 'value', 'orange')}
                </div>

              </Col>
            </Row>
          </Card>

          {/* 3. 调度设置 */}
          <Card title="调度设置" style={{ marginBottom: 16 }}>
            <Form.Item
              name="cronExpression"
              label="定时规则"
              initialValue="0 10 * * *"
              rules={[{ required: true, message: '请配置定时规则' }]}
            >
              <Input
                placeholder="Cron 表达式"
                value={cronValue}
                readOnly
                style={{ marginBottom: 16 }}
              />
            </Form.Item>
            <div style={{
              border: '1px solid #d9d9d9',
              borderRadius: 4,
              padding: 16,
              background: '#fafafa'
            }}>
              <Cron
                value={cronValue}
                setValue={(newValue: string) => {
                  setCronValue(newValue);
                  form.setFieldValue('cronExpression', newValue);
                }}
                locale={{
                  everyText: '每',
                  emptyMonths: '每月',
                  emptyMonthDays: '每天',
                  emptyMonthDaysShort: '日',
                  emptyWeekDays: '每周',
                  emptyWeekDaysShort: '周',
                  emptyHours: '每小时',
                  emptyMinutes: '每分钟',
                  emptyMinutesForHourPeriod: '每',
                  yearOption: '年',
                  monthOption: '月',
                  weekOption: '周',
                  dayOption: '日',
                  hourOption: '时',
                  minuteOption: '分',
                  rebootOption: '重启时',
                  prefixPeriod: '每',
                  prefixMonths: '在',
                  prefixMonthDays: '在',
                  prefixWeekDays: '在',
                  prefixWeekDaysForMonthAndYearPeriod: '并且',
                  prefixHours: '在',
                  prefixMinutes: '在',
                  prefixMinutesForHourPeriod: '在',
                  suffixMinutesForHourPeriod: '分',
                  errorInvalidCron: 'Cron 表达式无效',
                  clearButtonText: '清空',
                  weekDays: [
                    '周日',
                    '周一',
                    '周二',
                    '周三',
                    '周四',
                    '周五',
                    '周六'
                  ],
                  months: [
                    '一月',
                    '二月',
                    '三月',
                    '四月',
                    '五月',
                    '六月',
                    '七月',
                    '八月',
                    '九月',
                    '十月',
                    '十一月',
                    '十二月'
                  ],
                  altWeekDays: [
                    '周日',
                    '周一',
                    '周二',
                    '周三',
                    '周四',
                    '周五',
                    '周六'
                  ],
                  altMonths: [
                    '一月',
                    '二月',
                    '三月',
                    '四月',
                    '五月',
                    '六月',
                    '七月',
                    '八月',
                    '九月',
                    '十月',
                    '十一月',
                    '十二月'
                  ]
                }}
                allowedDropdowns={['period', 'months', 'month-days', 'week-days', 'hours', 'minutes']}
                allowedPeriods={['year', 'month', 'week', 'day', 'hour', 'minute']}
              />
            </div>
          </Card>

          {/* 通知设置 */}
          <Card
            title="通知设置"
            style={{ marginBottom: 16 }}
            extra={
              <Button type="default" icon={<SendOutlined />} onClick={handleTestNotification}>
                测试发送
              </Button>
            }
          >
            <Form.Item
              name="notificationReceivers"
              label="接收人"
              rules={[{ required: true, message: '请选择至少一个接收人' }]}
            >
              <Select
                mode="multiple"
                placeholder="请选择接收人"
                style={{ width: '100%' }}
                options={[
                  { label: '张三 (zhangsan@example.com)', value: 'user_zhangsan' },
                  { label: '李四 (lisi@example.com)', value: 'user_lisi' },
                  { label: '王五 (wangwu@example.com)', value: 'user_wangwu' },
                  { label: '赵六 (zhaoliu@example.com)', value: 'user_zhaoliu' },
                  { label: '采购组', value: 'group_purchase' },
                  { label: '风控组', value: 'group_risk' }
                ]}
              />
            </Form.Item>
            <Form.Item
              name="notificationChannels"
              label="通知方式"
              rules={[{ required: true, message: '请选择至少一种通知方式' }]}
            >
              <Checkbox.Group
                options={[
                  { label: '邮件', value: 'email' },
                  { label: '短信', value: 'sms' },
                  { label: '钉钉', value: 'dingtalk' },
                  { label: '企业微信', value: 'wechat' }
                ]}
              />
            </Form.Item>
            <Form.Item
              name="alertNotificationTitle"
              label="消息标题"
              initialValue="【监控预警】{taskName} 发现异常"
              rules={[{ required: true, message: '请输入消息标题' }]}
            >
              <Input
                placeholder="点击下方变量标签插入"
                onFocus={() => setActiveInputField('alertTitle')}
              />
            </Form.Item>
            <Form.Item
              name="alertNotificationDescription"
              label="消息内容"
              initialValue="任务 {taskName} 触发 {severity} 预警，命中 {hitCount} 条记录。"
              rules={[{ required: true, message: '请输入消息内容' }]}
            >
              <TextArea
                rows={4}
                placeholder="点击下方变量标签插入"
                onFocus={() => setActiveInputField('alertContent')}
              />
            </Form.Item>
            <div style={{ marginBottom: 16 }}>
              <Space wrap>
                {templateVariables.map(variable => (
                  <Tag
                    key={variable.key}
                    color="blue"
                    style={{ cursor: 'pointer' }}
                    onClick={() => insertVariable(variable.key)}
                  >
                    {variable.label}
                  </Tag>
                ))}
              </Space>
              <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>点击标签可插入模板变量</Text>
            </div>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="noAlertNotificationTitle"
                  label="无预警消息标题"
                  initialValue="【监控预警】{taskName} 未发现异常"
                  rules={[{ required: true, message: '请输入消息标题' }]}
                >
                  <Input
                    placeholder="点击下方变量标签插入"
                    onFocus={() => setActiveInputField('noAlertTitle')}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="noAlertNotificationDescription"
                  label="无预警消息内容"
                  initialValue="任务 {taskName} 在 {time} 时段未发现异常。"
                  rules={[{ required: true, message: '请输入消息内容' }]}
                >
                  <Input
                    placeholder="点击下方变量标签插入"
                    onFocus={() => setActiveInputField('noAlertContent')}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </Form>
      </div>
    );
  };

  // 规则预览页面（AntV S2 报表 demo）
  const renderPreviewPage = () => {
    // 模拟数据 - 参照截图结构
    const s2MockData = [
      // SKU001 - 迪安诊断技术集团股份有限公司
      { skuCode: 'SKU001', productName: '迪安诊断技术集团股份有限公司', brand: '罗氏/Roche', supplierName: '杭州迪安医学检验中心有限公司', productCode: 'SKU01', productSpec: '数码打印机/数码复印机', unitPrice: 1800, supplierCode: '罗氏诊断', supplierType: '电子设备/电子设备', baseSupplier: '罗氏诊断', basePrice: 190, baseProductCode: '罗氏诊断', baseSpec: '专用耗材/设备', diffRate: 5.26, groupSupplier: '迪安诊断技术集团', groupPrice: 1800, groupProductCode: '产品编码', groupSpec: '集团采购' },
      { skuCode: 'SKU001', productName: '迪安诊断技术集团股份有限公司', brand: '罗氏/Roche', supplierName: '杭州迪安医学检验中心有限公司', productCode: 'SKU02', productSpec: '数码打印机/数码复印机 12%', unitPrice: 1800, supplierCode: '罗氏诊断', supplierType: '电子设备/电子设备', baseSupplier: '罗氏诊断', basePrice: 190, baseProductCode: '罗氏诊断', baseSpec: '专用耗材/设备', diffRate: 5.26, groupSupplier: '迪安诊断技术集团', groupPrice: 1800, groupProductCode: '产品编码', groupSpec: '集团采购' },
      { skuCode: 'SKU001', productName: '迪安诊断技术集团股份有限公司', brand: '罗氏/Roche', supplierName: '杭州迪安医学检验中心有限公司', productCode: 'SKU03', productSpec: '数码打印机/数码复印机 12%', unitPrice: 1800, supplierCode: '罗氏诊断', supplierType: '电子设备/电子设备', baseSupplier: '罗氏诊断', basePrice: 190, baseProductCode: '罗氏诊断', baseSpec: '专用耗材/设备', diffRate: 5.26, groupSupplier: '迪安诊断技术集团', groupPrice: 1800, groupProductCode: '产品编码', groupSpec: '集团采购' },
      { skuCode: 'SKU001', productName: '迪安诊断技术集团股份有限公司', brand: '罗氏/Roche', supplierName: '杭州迪安医学检验中心有限公司', productCode: 'SKU04', productSpec: '数码打印机/数码复印机 12%', unitPrice: 1500, supplierCode: '罗氏诊断', supplierType: '电子设备/电子设备', baseSupplier: '罗氏诊断', basePrice: 190, baseProductCode: '罗氏诊断', baseSpec: '专用耗材/设备', diffRate: 5.26, groupSupplier: '迪安诊断技术集团', groupPrice: 1628, groupProductCode: '产品编码', groupSpec: '集团采购' },
      // SKU001 - 杭州凯莱谱精准医疗检测技术有限公司
      { skuCode: 'SKU001', productName: '杭州凯莱谱精准医疗检测技术有限公司', brand: '罗氏/Roche', supplierName: '杭州凯莱谱精准医疗检测技术有限公司', productCode: 'SKU01', productSpec: '数码打印机/数码复印机', unitPrice: 1800, supplierCode: '罗氏诊断', supplierType: '电子设备/电子设备', baseSupplier: '罗氏诊断', basePrice: 180, baseProductCode: '罗氏诊断', baseSpec: '专用耗材/设备', diffRate: 0, groupSupplier: '迪安诊断技术集团', groupPrice: 1800, groupProductCode: '产品编码', groupSpec: '集团采购' },
      { skuCode: 'SKU001', productName: '杭州凯莱谱精准医疗检测技术有限公司', brand: '罗氏/Roche', supplierName: '杭州凯莱谱精准医疗检测技术有限公司', productCode: 'SKU02', productSpec: '数码打印机/数码复印机 12%', unitPrice: 1800, supplierCode: '罗氏诊断', supplierType: '电子设备/电子设备', baseSupplier: '罗氏诊断', basePrice: 180, baseProductCode: '罗氏诊断', baseSpec: '专用耗材/设备', diffRate: 0, groupSupplier: '迪安诊断技术集团', groupPrice: 1800, groupProductCode: '产品编码', groupSpec: '集团采购' },
      // SKU002
      { skuCode: 'SKU002', productName: '迪安诊断技术集团股份有限公司', brand: '罗氏/Roche', supplierName: '杭州迪安医学检验中心有限公司', productCode: 'SKU01', productSpec: '全自动生化分析仪 耗材（100...', unitPrice: 175000, supplierCode: '罗氏诊断', supplierType: '分析仪器/分析仪器', baseSupplier: '罗氏诊断', basePrice: 17100, baseProductCode: '罗氏诊断', baseSpec: '专用耗材/设备', diffRate: 2.34, groupSupplier: '迪安诊断技术集团', groupPrice: 165200, groupProductCode: '产品编码', groupSpec: '集团采购' },
      { skuCode: 'SKU002', productName: '迪安诊断技术集团股份有限公司', brand: '罗氏/Roche', supplierName: '杭州迪安医学检验中心有限公司', productCode: 'SKU02', productSpec: '全自动生化分析仪 耗材（100...', unitPrice: 175000, supplierCode: '罗氏诊断', supplierType: '分析仪器/分析仪器', baseSupplier: '罗氏诊断', basePrice: 17100, baseProductCode: '罗氏诊断', baseSpec: '专用耗材/设备', diffRate: 2.34, groupSupplier: '迪安诊断技术集团', groupPrice: 165200, groupProductCode: '产品编码', groupSpec: '集团采购' },
      { skuCode: 'SKU002', productName: '迪安诊断技术集团股份有限公司', brand: '罗氏/Roche', supplierName: '杭州迪安医学检验中心有限公司', productCode: 'SKU03', productSpec: '全自动生化分析仪 耗材（100...', unitPrice: 175000, supplierCode: '罗氏诊断', supplierType: '分析仪器/分析仪器', baseSupplier: '罗氏诊断', basePrice: 17100, baseProductCode: '罗氏诊断', baseSpec: '专用耗材/设备', diffRate: 2.34, groupSupplier: '迪安诊断技术集团', groupPrice: 176200, groupProductCode: '产品编码', groupSpec: '集团采购' },
    ];

    // S2 配置
    const s2DataConfig = {
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
        { field: 'productCode', name: '产品编码' },
        { field: 'productSpec', name: '产品规格/分类' },
        { field: 'unitPrice', name: '供应商价格', formatter: (v: any) => v ? `¥${Number(v).toLocaleString()}` : '-' },
        { field: 'supplierCode', name: '供应商编码' },
        { field: 'supplierType', name: '供应商类型' },
        { field: 'baseSupplier', name: '基准供应商' },
        { field: 'basePrice', name: '基准价格', formatter: (v: any) => v ? `¥${Number(v).toLocaleString()}` : '-' },
        { field: 'baseProductCode', name: '基准产品编码' },
        { field: 'baseSpec', name: '基准规格' },
        { field: 'diffRate', name: '差异率', formatter: (v: any) => v !== undefined ? `${Number(v).toFixed(2)}%` : '-' },
        { field: 'groupSupplier', name: '集团供应商' },
        { field: 'groupPrice', name: '集团价格', formatter: (v: any) => v ? `¥${Number(v).toLocaleString()}` : '-' },
        { field: 'groupProductCode', name: '集团产品编码' },
        { field: 'groupSpec', name: '集团采购' }
      ],
      data: s2MockData
    };

    const s2Options = {
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

    return (
      <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
        {/* 顶部标题栏 */}
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text type="secondary">监控结果预览 - 基于当前配置的示例数据</Text>
          <Space>
            <Button onClick={() => setViewMode('create')}>返回编辑</Button>
            <Button type="primary">导出</Button>
          </Space>
        </div>

        {/* 查询条件区 */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button size="small">筛选设置</Button>
            <Button size="small">+ 导出</Button>
          </div>
        </Card>

        {/* S2 透视表 */}
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
              dataCfg={s2DataConfig}
              options={s2Options}
              sheetType="pivot"
            />
          </div>
        </Card>
      </div>
    );
  };

  // 任务列表表格列定义
  const taskColumns = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: MonitorTask) => (
        <Space>
          <Text strong>{text}</Text>
          {record.enabled ? (
            <Badge status="success" text="运行中" />
          ) : (
            <Badge status="default" text="已暂停" />
          )}
        </Space>
      )
    },
    {
      title: '预警等级',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: MonitorTask['severity']) => {
        const config: Record<MonitorTask['severity'], { color: string; text: string }> = {
          low: { color: 'default', text: '提示' },
          medium: { color: 'orange', text: '重要' },
          high: { color: 'red', text: '严重' },
          critical: { color: 'magenta', text: '紧急' }
        };
        const { color, text } = config[severity] || config.low;
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: '比价方案',
      dataIndex: 'schemeName',
      key: 'schemeName'
    },
    {
      title: '监控范围',
      key: 'scope',
      render: (record: MonitorTask) => (
        <Space wrap>
          {record.dimensions.map(dim => (
            <Tag key={dim} color="blue">{dim}</Tag>
          ))}
          {record.metrics.map(metric => (
            <Tag key={metric} color="green">{metric}</Tag>
          ))}
        </Space>
      )
    },
    {
      title: '规则概要',
      dataIndex: 'ruleSummary',
      key: 'ruleSummary',
      render: (text: string) => <Text type="secondary">{text}</Text>
    },
    {
      title: '执行频率',
      dataIndex: 'scheduleSummary',
      key: 'scheduleSummary',
      render: (text: string) => <Text>{text}</Text>
    },
    {
      title: '近一月预警数',
      dataIndex: 'monthlyAlertCount',
      key: 'monthlyAlertCount',
      render: (count: number) => (
        <Badge count={count} showZero color={count > 0 ? 'red' : 'gray'} />
      )
    },
    {
      title: '最近执行时间',
      dataIndex: 'lastCheck',
      key: 'lastCheck'
    },
    {
      title: '操作',
      key: 'actions',
      render: (record: MonitorTask) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleViewResult(record)}>
            结果预览
          </Button>
          <Tooltip title="查看详情">
            <Button type="text" icon={<EyeOutlined />} />
          </Tooltip>
          <Tooltip title={record.enabled ? "暂停" : "启动"}>
            <Button
              type="text"
              icon={record.enabled ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button type="text" icon={<DeleteOutlined />} danger />
          </Tooltip>
        </Space>
      )
    }
  ];

  // 预警记录表格列定义
  const alertColumns = [
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: string) => {
        const config = {
          low: { color: 'green', text: '低', icon: <CheckCircleOutlined /> },
          medium: { color: 'orange', text: '中', icon: <ExclamationCircleOutlined /> },
          high: { color: 'red', text: '高', icon: <WarningOutlined /> },
          critical: { color: 'red', text: '紧急', icon: <WarningOutlined /> }
        };
        const { color, text, icon } = config[severity as keyof typeof config];
        return (
          <Tag color={color} icon={icon}>{text}</Tag>
        );
      }
    },
    {
      title: '监控任务',
      dataIndex: 'taskName',
      key: 'taskName'
    },
    {
      title: '规则概要',
      dataIndex: 'ruleSummary',
      key: 'ruleSummary',
      render: (text: string) => <Text type="secondary">{text}</Text>
    },
    {
      title: '命中记录数',
      dataIndex: 'hitCount',
      key: 'hitCount',
      render: (count: number) => <Text>{count}</Text>
    },
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp'
    },
    {
      title: '通知结果',
      key: 'notifications',
      render: (record: AlertRecord) => {
        if (!record.notifications || record.notifications.length === 0) {
          return <Text type="secondary">未配置通知</Text>;
        }
        const hasFailed = record.notifications.some(n => n.status === 'failed');
        const hasPending = record.notifications.some(n => n.status === 'pending');
        const allSuccess = record.notifications.every(n => n.status === 'success');

        let color: string = 'default';
        let text: string = '未知';

        if (hasFailed) {
          const allFailed = record.notifications.every(n => n.status === 'failed');
          color = 'red';
          text = allFailed ? '全部失败' : '部分失败';
        } else if (hasPending) {
          color = 'orange';
          text = '待发送';
        } else if (allSuccess) {
          color = 'green';
          text = '全部成功';
        }

        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: '操作',
      key: 'actions',
      render: (record: AlertRecord) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleViewAlertDetail(record)}>
            查看详情
          </Button>
          <Button type="link" size="small" onClick={() => handleViewNotificationDetail(record)}>
            查看推送结果
          </Button>
        </Space>
      )
    }
  ];

  const notificationColumns = [
    {
      title: '渠道',
      dataIndex: 'channel',
      key: 'channel',
      render: (channel: AlertNotificationResult['channel']) => {
        const channelLabels: Record<AlertNotificationResult['channel'], string> = {
          email: '邮件',
          dingtalk: '钉钉',
          wechat: '企业微信'
        };
        return channelLabels[channel];
      }
    },
    {
      title: '目标',
      dataIndex: 'target',
      key: 'target'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: AlertNotificationResult['status']) => {
        const statusConfig: Record<AlertNotificationResult['status'], { color: string; text: string }> = {
          success: { color: 'green', text: '成功' },
          failed: { color: 'red', text: '失败' },
          pending: { color: 'orange', text: '待发送' }
        };
        const { color, text } = statusConfig[status];
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: '说明',
      dataIndex: 'detail',
      key: 'detail',
      render: (detail?: string) => (detail ? <Text type="secondary">{detail}</Text> : <Text type="secondary">-</Text>)
    }
  ];

  const myMonthlyAlertCount = myAlertRecords.length;
  const allMonthlyAlertCount = allAlertRecords.length;

  if (viewMode === 'create') {
    return renderCreatePage();
  }

  if (viewMode === 'preview') {
    return renderPreviewPage();
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            <Space>
              <Activity className="h-6 w-6" />
              比价监控
            </Space>
          </Title>
          <Text type="secondary">配置业务监控规则，及时预警数据异常</Text>
          <div style={{ marginTop: 6 }}>
            <Text type="secondary">说明：所有任务为原型演示，后续会接入权限控制。</Text>
          </div>
        </div>
      </div>

      {/* 统计概览 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="监控任务总数"
              value={activeTab === 'admin' ? allMonitorTasks.length : myMonitorTasks.length}
              prefix={<Target className="h-4 w-4" />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="运行中任务"
              value={(activeTab === 'admin' ? allMonitorTasks : myMonitorTasks).filter(t => t.enabled).length}
              prefix={<PlayCircleOutlined className="h-4 w-4" />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="近一月预警数"
              value={activeTab === 'admin' ? allMonthlyAlertCount : myMonthlyAlertCount}
              prefix={<WarningOutlined className="h-4 w-4" />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 主要内容区域 */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <Tabs.TabPane
            tab={
              <Space>
                <Target className="h-4 w-4" />
                我的任务
              </Space>
            }
            key="tasks"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Tooltip title="当前仅展示你创建的监控任务及其产生的预警记录">
                <Text type="secondary">范围：我创建的</Text>
              </Tooltip>

              <Radio.Group
                value={listView}
                onChange={(e) => setListView(e.target.value)}
              >
                <Radio value="tasks">任务</Radio>
                <Radio value="alerts">预警记录</Radio>
              </Radio.Group>
            </div>

            {listView === 'tasks' ? (
              <Table
                columns={taskColumns}
                dataSource={myMonitorTasks}
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
            ) : (
              <Table
                columns={alertColumns}
                dataSource={myAlertRecords.filter(a => a.status === 'active')}
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
            )}
          </Tabs.TabPane>

          <Tabs.TabPane
            tab={
              <Space>
                <Target className="h-4 w-4" />
                所有任务
              </Space>
            }
            key="admin"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Tooltip title="所有任务为原型演示：当前展示全部监控任务及其产生的预警记录（后续会接入权限控制）">
                <Text type="secondary">范围：全部</Text>
              </Tooltip>

              <Radio.Group
                value={adminListView}
                onChange={(e) => setAdminListView(e.target.value)}
              >
                <Radio value="tasks">任务</Radio>
                <Radio value="alerts">预警记录</Radio>
              </Radio.Group>
            </div>

            {adminListView === 'tasks' ? (
              <Table
                columns={taskColumns}
                dataSource={allMonitorTasks}
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
            ) : (
              <Table
                columns={alertColumns}
                dataSource={allAlertRecords.filter(a => a.status === 'active')}
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
            )}
          </Tabs.TabPane>
        </Tabs>
      </Card>

      <Modal
        open={alertDetailVisible}
        title="预警详情"
        footer={null}
        onCancel={() => setAlertDetailVisible(false)}
      >
        {alertDetail && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text type="secondary">监控任务：</Text>
              <Text strong>{alertDetail.taskName}</Text>
            </div>
            <div>
              <Text type="secondary">规则概要：</Text>
              <Text>{alertDetail.ruleSummary}</Text>
            </div>
            <div>
              <Text type="secondary">命中信息：</Text>
            </div>
            <Space wrap>
              {alertDetail.dimensionValues.map(value => (
                <Tag key={`${alertDetail.id}-detail-${value}`} color="blue">
                  {value}
                </Tag>
              ))}
              {alertDetail.dimensionValues.length === 0 && <Text type="secondary">-</Text>}
            </Space>
            <div>
              <Text type="secondary">命中记录数：</Text>
              <Text>{alertDetail.hitCount}</Text>
            </div>
            <div>
              <Text type="secondary">严重程度：</Text>
              <Text>{alertDetail.severity}</Text>
            </div>
            <div>
              <Text type="secondary">时间：</Text>
              <Text>{alertDetail.timestamp}</Text>
            </div>
            <div style={{ marginTop: 8 }}>
              <Button
                type="primary"
                block
                onClick={() => {
                  message.info('异常数据报表快照功能即将上线，当前为占位入口');
                }}
              >
                查看异常数据报表快照
              </Button>
            </div>
          </Space>
        )}
      </Modal>

      <Modal
        open={notificationDetailVisible}
        title="通知推送结果"
        footer={null}
        onCancel={() => setNotificationDetailVisible(false)}
        width={640}
      >
        {notificationDetailRecord && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text type="secondary">监控任务：</Text>
              <Text strong>{notificationDetailRecord.taskName}</Text>
            </div>
            <div>
              <Text type="secondary">规则概要：</Text>
              <Text>{notificationDetailRecord.ruleSummary}</Text>
            </div>
            <Table
              columns={notificationColumns}
              dataSource={notificationDetailRecord.notifications}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default MonitoringManagement;