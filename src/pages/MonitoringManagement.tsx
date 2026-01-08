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
  Radio,
  Switch,
  Modal,
  Checkbox,
  Tabs
} from 'antd';
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  WarningOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  SendOutlined
} from '@ant-design/icons';
import {
  Target,
  Activity
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SheetComponent } from '@antv/s2-react';
import '@antv/s2-react/dist/s2-react.min.css';
import QueryConditionsPanel, { QueryCondition, FieldMetadata } from '../components/QueryConditionsPanel';
import CronExpressionEditor from '../components/CronExpressionEditor';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

interface MonitorTask {
  id: string;
  name: string;
  description: string;
  sourceReportId?: string;
  sourceReportName?: string;
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
  lastRunStatus?: 'success' | 'failed' | 'partial' | 'pending';
  lastRunError?: string;
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

type LayoutPosition = 'row' | 'column' | 'value';

interface LayoutDroppedItem {
  id: string;
  name: string;
  type: 'dimension' | 'metric' | 'calculated' | 'baseline';
  position: LayoutPosition;
}

type FieldArea = 'rows' | 'columns' | 'metrics';

interface ReportFieldSettingItem {
  key: string;
  label: string;
  group?: string;
  area: FieldArea;
  enabled: boolean;
}

const MonitoringManagement: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [listView, setListView] = useState<'tasks' | 'alerts'>('tasks');
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'preview'>('list');
  const [taskPageMode, setTaskPageMode] = useState<'create' | 'edit' | 'view'>('create');
  const [monitorConditions, setMonitorConditions] = useState<QueryCondition[]>([]);
  const [droppedItems, setDroppedItems] = useState<LayoutDroppedItem[]>([]);
  const [form] = Form.useForm();
  const [activeInputField, setActiveInputField] = useState<'alertTitle' | 'alertContent' | null>(null);
  const [notificationDetailRecord, setNotificationDetailRecord] = useState<AlertRecord | null>(null);
  const [notificationDetailVisible, setNotificationDetailVisible] = useState(false);
  const [cronValue, setCronValue] = useState('0 0 10 * * ? *');
  const [previewAlertRecord, setPreviewAlertRecord] = useState<AlertRecord | null>(null);
  const [executionLogVisible, setExecutionLogVisible] = useState(false);
  const [executionLogTaskId, setExecutionLogTaskId] = useState<string | null>(null);
  const [reportSettingsVisible, setReportSettingsVisible] = useState(false);
  const [reportSettingsTab, setReportSettingsTab] = useState<'fields' | 'totals'>('fields');
  const [fieldSettings, setFieldSettings] = useState<ReportFieldSettingItem[]>([]);
  const [testSendModalVisible, setTestSendModalVisible] = useState(false);
  const [testSendLoading, setTestSendLoading] = useState(false);
  const [testSendResults, setTestSendResults] = useState<AlertNotificationResult[] | null>(null);

  const rowTotalEnabled = true;
  const rowTotalPosition: 'top' | 'bottom' = 'bottom';
  const colTotalEnabled = false;
  const colTotalPosition: 'left' | 'right' = 'right';
  const totalMetricSettings: {
    key: string;
    label: string;
    enabled: boolean;
    agg: 'sum' | 'avg' | 'max' | 'min' | 'count';
  }[] = [
    { key: 'supplierPrice', label: '供应商价格', enabled: true, agg: 'avg' },
    { key: 'basePrice', label: '基准价格', enabled: true, agg: 'avg' },
    { key: 'groupPrice', label: '集团价格', enabled: true, agg: 'avg' },
    { key: 'diffRate', label: '差异率', enabled: true, agg: 'avg' }
  ];

  const executionLogColumns = [
    {
      title: '执行时间',
      dataIndex: 'time',
      key: 'time'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: ExecutionLogItem['status']) => {
        const config: Record<ExecutionLogItem['status'], { color: string; text: string }> = {
          success: { color: 'green', text: '成功' },
          failed: { color: 'red', text: '失败' },
          // "partial" 与 "skipped" 统一按失败展示，避免出现“部分成功/已跳过”等中间状态文案
          partial: { color: 'red', text: '失败' },
          skipped: { color: 'red', text: '失败' }
        };
        const { color, text } = config[status];
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: '命中记录数',
      dataIndex: 'hitCount',
      key: 'hitCount',
      render: (count: number) => <Text>{count}</Text>
    },
    {
      title: '说明',
      dataIndex: 'errorMessage',
      key: 'errorMessage',
      render: (text: string | undefined) =>
        text ? <Text type="danger">{text}</Text> : <Text type="secondary">-</Text>
    }
  ];

  const [filterTaskName, setFilterTaskName] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'enabled' | 'disabled' | undefined>(undefined);
  const [filterSourceReportId, setFilterSourceReportId] = useState<string | undefined>(undefined);
  const [filterSourceReportName, setFilterSourceReportName] = useState<string | undefined>(undefined);
  const [filterSchemeIds, setFilterSchemeIds] = useState<string[]>([]);
  const [filterSeverity, setFilterSeverity] = useState<MonitorTask['severity'] | undefined>(undefined);

  const reportContext = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const reportId = params.get('reportId') || '';
    const reportName = params.get('reportName') ? decodeURIComponent(params.get('reportName') as string) : '';
    const schemeId = params.get('schemeId') || '';
    const schemeName = params.get('schemeName') ? decodeURIComponent(params.get('schemeName') as string) : '';
    const entry = params.get('entry') || '';
    return { reportId, reportName, schemeId, schemeName, entry };
  }, [location.search]);

  const isSchemeLockedFromEntry = useMemo(() => {
    return reportContext.entry === 'create' && !!reportContext.schemeId;
  }, [reportContext.entry, reportContext.schemeId]);

  useEffect(() => {
    if (reportContext.reportId) {
      setViewMode('create');
      setTaskPageMode('create');
      form.setFieldsValue({
        taskName: `【${reportContext.reportName || '报表'}】监控任务`,
        sourceReportId: reportContext.reportId,
        sourceReportName: reportContext.reportName || reportContext.reportId,
        schemeId: reportContext.schemeId || undefined,
        deliveryType: 'report_template'
      });
      return;
    }

    const params = new URLSearchParams(location.search);
    const entry = params.get('entry') || '';
    const schemeId = params.get('schemeId') || '';
    if (entry === 'create') {
      setViewMode('create');
      setTaskPageMode('create');
      if (schemeId) {
        form.setFieldsValue({ schemeId, deliveryType: 'report_template' });
      } else {
        form.setFieldsValue({ deliveryType: 'report_template' });
      }
    }
  }, [form, location.search, reportContext.reportId, reportContext.reportName, reportContext.schemeId]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sourceReportId = params.get('sourceReportId') || '';
    const sourceReportName = params.get('sourceReportName') ? decodeURIComponent(params.get('sourceReportName') as string) : '';
    if (sourceReportId) {
      setViewMode('list');
      setListView('tasks');
      setFilterSourceReportId(sourceReportId);
      setFilterSourceReportName(sourceReportName || sourceReportId);
    }
  }, [location.search]);

  // 可用模板变量
  const templateVariables = [
    { key: 'taskName', label: '任务名称' },
    { key: 'alarmLevelName', label: '预警等级' },
    { key: 'hitCount', label: '命中记录数' },
    { key: 'time', label: '触发时间' },
    { key: 'downloadUrl', label: '下载地址' }
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
    setPreviewAlertRecord(null);
    setViewMode('preview');
  };

  const handlePreviewAlertRecord = (record: AlertRecord) => {
    // 从预警记录进入预览页，表示查看的是某次触发时刻的快照（示例）
    setPreviewAlertRecord(record);
    setViewMode('preview');
  };

  const handleViewNotificationDetail = (record: AlertRecord) => {
    setNotificationDetailRecord(record);
    setNotificationDetailVisible(true);
  };

  const handleViewExecutionLog = (task: MonitorTask) => {
    setExecutionLogTaskId(task.id);
    setExecutionLogVisible(true);
  };

  const handleTestNotification = async () => {
    try {
      // 2️⃣ 前置同步校验：接收人、通知方式、模板变量合法性
      const receivers = form.getFieldValue('notificationReceivers') || [];
      const receiverGroups = form.getFieldValue('notificationReceiverGroups') || [];
      const channels = form.getFieldValue('notificationChannels') || [];
      const title: string = form.getFieldValue('alertNotificationTitle') || '';
      const description: string = form.getFieldValue('alertNotificationDescription') || '';

      const hasReceivers =
        (Array.isArray(receivers) && receivers.length > 0) ||
        (Array.isArray(receiverGroups) && receiverGroups.length > 0);
      const hasChannels = Array.isArray(channels) && channels.length > 0;

      if (!hasReceivers || !hasChannels) {
        message.info('请先选择接收用户/接收用户组，并至少配置一种通知方式');
        return;
      }

      // 模板变量合法性校验：只允许使用已定义的变量 key
      const allowedKeys = ['taskName', 'alarmLevelName', 'hitCount', 'time', 'downloadUrl'];
      const variablePattern = /\{([\w]+)\}/g;
      const invalidKeys = new Set<string>();

      [title, description].forEach(text => {
        // 重置 lastIndex，确保每个文本都从头开始匹配
        variablePattern.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = variablePattern.exec(text)) !== null) {
          const key = match[1];
          if (!allowedKeys.includes(key)) {
            invalidKeys.add(key);
          }
        }
      });

      if (invalidKeys.size > 0) {
        message.error(`存在无法识别的模板变量：${Array.from(invalidKeys).join('、')}`);
        return;
      }

      // 使用表单校验，确保相关字段已填写
      await form.validateFields([
        'notificationReceivers',
        'notificationReceiverGroups',
        'notificationChannels',
        'alertNotificationTitle',
        'alertNotificationDescription'
      ]);

      // 通过前置校验后，弹出测试发送确认弹窗
      setTestSendResults(null);
      setTestSendModalVisible(true);
    } catch (e) {
      // 任意异常统一给出提示，避免用户感觉“没有反应”
      message.error('测试发送时发生异常，请稍后重试');
      // 控制台输出便于排查
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };

  const handleConfirmTestSend = async () => {
    setTestSendLoading(true);
    try {
      // 这里模拟一次测试发送结果；实际接入时可替换为后端 API 调用
      const receivers = form.getFieldValue('notificationReceivers') || [];
      const receiverGroups = form.getFieldValue('notificationReceiverGroups') || [];
      const channels: AlertNotificationResult['channel'][] = form.getFieldValue('notificationChannels') || [];

      const targets: string[] = [];
      if (Array.isArray(receivers)) {
        targets.push(...receivers);
      }
      if (Array.isArray(receiverGroups)) {
        targets.push(...receiverGroups);
      }

      const results: AlertNotificationResult[] = [];
      channels.forEach((channel) => {
        targets.forEach((target, idx) => {
          results.push({
            id: `${channel}-${target}-${idx}`,
            channel,
            target,
            status: 'success',
            detail: '测试发送成功（示例数据，未实际推送）'
          });
        });
      });

      setTestSendResults(results);
    } finally {
      setTestSendLoading(false);
    }
  };

  const allMonitorTasks: MonitorTask[] = [
    {
      id: '1',
      name: 'CPU价格异常监控',
      description: '监控CPU产品价格波动，超过15%上涨时预警',
      sourceReportId: 'report_001',
      sourceReportName: 'CPU价格趋势分析报表',
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
      creator: '张三',
      lastRunStatus: 'success'
    },
    {
      id: '2',
      name: '供应商协议价监控',
      description: '监控主要供应商协议价变化',
      sourceReportId: 'report_002',
      sourceReportName: '供应商协议价对比报表',
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
      creator: '张三',
      lastRunStatus: 'failed',
      lastRunError: '上次执行失败：SQL 执行超时（示例）'
    },
    {
      id: '3',
      name: '内存条价格波动监控',
      description: '监控内存条价格波动，超过8%上涨时预警',
      sourceReportId: 'report_001',
      sourceReportName: 'CPU价格趋势分析报表',
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
      creator: '李四',
      lastRunStatus: 'partial',
      lastRunError: '部分数据源连接失败，已对可用数据执行（示例）'
    }
  ];

  interface ExecutionLogItem {
    id: string;
    taskId: string;
    time: string;
    status: 'success' | 'failed' | 'partial' | 'skipped';
    hitCount: number;
    durationMs: number;
    triggerType: 'schedule' | 'manual';
    errorMessage?: string;
  }

  const executionLogsByTaskId: Record<string, ExecutionLogItem[]> = {
    '1': [
      {
        id: '1-1',
        taskId: '1',
        time: '2025-12-12 08:50:00',
        status: 'success',
        hitCount: 12,
        durationMs: 8200,
        triggerType: 'schedule'
      },
      {
        id: '1-2',
        taskId: '1',
        time: '2025-12-11 08:50:02',
        status: 'success',
        hitCount: 5,
        durationMs: 9100,
        triggerType: 'schedule'
      },
      {
        id: '1-3',
        taskId: '1',
        time: '2025-12-10 15:20:30',
        status: 'skipped',
        hitCount: 0,
        durationMs: 500,
        triggerType: 'manual',
        errorMessage: '任务被人工取消（示例）'
      }
    ],
    '2': [
      {
        id: '2-1',
        taskId: '2',
        time: '2025-12-12 07:05:00',
        status: 'failed',
        hitCount: 0,
        durationMs: 15000,
        triggerType: 'schedule',
        errorMessage: 'SQL 执行超时，连接数据库 30 秒未响应（示例）'
      },
      {
        id: '2-2',
        taskId: '2',
        time: '2025-12-11 07:05:10',
        status: 'failed',
        hitCount: 0,
        durationMs: 3000,
        triggerType: 'manual',
        errorMessage: '配置信息不完整：缺少报表模板 ID（示例）'
      }
    ],
    '3': [
      {
        id: '3-1',
        taskId: '3',
        time: '2025-12-12 09:10:00',
        status: 'partial',
        hitCount: 6,
        durationMs: 10500,
        triggerType: 'schedule',
        errorMessage: '部分数据源连接失败，已对可用数据执行（示例）'
      },
      {
        id: '3-2',
        taskId: '3',
        time: '2025-12-11 09:10:05',
        status: 'success',
        hitCount: 3,
        durationMs: 8800,
        triggerType: 'schedule'
      }
    ]
  };

  const sourceReportOptions = useMemo(() => {
    const map = new Map<string, string>();
    allMonitorTasks.forEach(t => {
      if (t.sourceReportId) {
        map.set(t.sourceReportId, t.sourceReportName || t.sourceReportId);
      }
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [allMonitorTasks]);

  const currentExecutionLogs = useMemo(() => {
    if (!executionLogTaskId) return [];
    return executionLogsByTaskId[executionLogTaskId] || [];
  }, [executionLogTaskId]);

  const applyTaskFilters = (tasks: MonitorTask[]) => {
    const keyword = filterTaskName.trim().toLowerCase();
    return tasks.filter(t => {
      const matchName = keyword ? (t.name || '').toLowerCase().includes(keyword) : true;
      const matchStatus =
        filterStatus === 'enabled' ? t.enabled :
        filterStatus === 'disabled' ? !t.enabled :
        true;
      const matchSeverity = filterSeverity ? t.severity === filterSeverity : true;
      const matchSourceReport = filterSourceReportId ? t.sourceReportId === filterSourceReportId : true;
      const matchScheme = filterSchemeIds.length > 0 ? filterSchemeIds.includes(t.schemeId) : true;
      return matchName && matchStatus && matchSeverity && matchSourceReport && matchScheme;
    });
  };

  const filteredAllMonitorTasks = useMemo(
    () => applyTaskFilters(allMonitorTasks),
    [allMonitorTasks, filterTaskName, filterStatus, filterSeverity, filterSourceReportId, filterSchemeIds]
  );

  const handleClearFilters = () => {
    setFilterTaskName('');
    setFilterStatus(undefined);
    setFilterSeverity(undefined);
    setFilterSourceReportId(undefined);
    setFilterSourceReportName(undefined);
    setFilterSchemeIds([]);
    const params = new URLSearchParams(location.search);
    params.delete('sourceReportId');
    params.delete('sourceReportName');
    navigate({ pathname: location.pathname, search: params.toString() ? `?${params.toString()}` : '' }, { replace: true });
  };

  const handleViewTaskDetail = (task: MonitorTask) => {
    setViewMode('create');
    setTaskPageMode('view');
    form.setFieldsValue({
      taskName: task.name,
      schemeId: task.schemeId,
      severity: task.severity,
      enabled: task.enabled,
      sourceReportId: task.sourceReportId,
      sourceReportName: task.sourceReportName
    });
  };

  const handleEditTask = (task: MonitorTask) => {
    setViewMode('create');
    setTaskPageMode('edit');
    form.setFieldsValue({
      taskName: task.name,
      schemeId: task.schemeId,
      severity: task.severity,
      enabled: task.enabled,
      sourceReportId: task.sourceReportId,
      sourceReportName: task.sourceReportName
    });
  };

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

  // 比价方案选项
  const schemeOptions = [
    { value: 'scheme-001', label: 'Q3 CPU价格回顾' },
    { value: 'scheme-002', label: '华东区供应商协议价分析' },
    { value: 'scheme-003', label: '内存条价格趋势分析' }
  ];

  const schemeFilterSummary = useMemo(() => {
    if (filterSchemeIds.length === 0) return '';
    const idSet = new Set(filterSchemeIds);
    const names = schemeOptions.filter(s => idSet.has(s.value)).map(s => s.label);
    return names.join('、');
  }, [filterSchemeIds]);

  const reportOptionsByScheme: Record<string, Array<{ value: string; label: string }>> = {
    // 用于创建页下拉选择的方案编码
    'scheme-001': [
      { value: 'report_001', label: 'CPU价格趋势分析报表' },
      { value: 'report_003', label: 'CPU供应商价差分析报表' }
    ],
    'scheme-002': [
      { value: 'report_002', label: '供应商协议价对比监控报表' },
      { value: 'report_004', label: '协议价波动预警报表' }
    ],
    'scheme-003': [
      { value: 'report_005', label: '内存条价格趋势监控报表' }
    ],
    // 对应比价方案列表页的 id（1/2/3），方便从“比价方案列表-创建监控任务”跳转后也能看到下拉数据
    '1': [
      { value: 'report_101', label: '华东耗材专题监控报表-价格视图' },
      { value: 'report_102', label: '华东耗材专题监控报表-供应商视图' }
    ],
    '2': [
      { value: 'report_201', label: '降价专项监控报表-价格对比' },
      { value: 'report_202', label: '降价专项监控报表-执行进度' }
    ],
    '3': [
      { value: 'report_301', label: '招采对标复盘监控报表' }
    ]
  };

  const currentSchemeId = Form.useWatch('schemeId', form);
  const currentDeliveryType = Form.useWatch('deliveryType', form);
  const currentSourceReportId = Form.useWatch('sourceReportId', form);
  const currentSourceReportName = Form.useWatch('sourceReportName', form);
  const currentReportOptions = useMemo(() => {
    if (!currentSchemeId) return [];
    return reportOptionsByScheme[currentSchemeId] || [];
  }, [currentSchemeId]);

  const isSchemeLocked = taskPageMode === 'edit' || taskPageMode === 'view' || !!reportContext.reportId || isSchemeLockedFromEntry;
  const isReportLocked = taskPageMode === 'edit' || taskPageMode === 'view' || !!reportContext.reportId;

  const schemeDisplayName = useMemo(() => {
    if (reportContext.schemeName) return reportContext.schemeName;
    if (!currentSchemeId) return '';
    return schemeOptions.find(s => s.value === currentSchemeId)?.label || currentSchemeId;
  }, [reportContext.schemeName, currentSchemeId]);

  const handleSchemeChangeForCreate = (schemeId: string) => {
    form.setFieldValue('schemeId', schemeId);
    form.setFieldValue('sourceReportId', undefined);
    form.setFieldValue('sourceReportName', undefined);
  };

  const reportTemplateLayoutByReportId: Record<string, LayoutDroppedItem[]> = {
    report_001: [
      { id: 'supplier', name: '供应商', type: 'dimension', position: 'row' },
      { id: 'product', name: '物料编码', type: 'dimension', position: 'row' },
      { id: 'date', name: '采购日期', type: 'dimension', position: 'column' },
      { id: 'price', name: '含税价', type: 'metric', position: 'value' },
      { id: 'diff_rate', name: '差异率', type: 'metric', position: 'value' }
    ],
    report_002: [
      { id: 'supplier', name: '供应商', type: 'dimension', position: 'row' },
      { id: 'category', name: '产品类别', type: 'dimension', position: 'row' },
      { id: 'organization', name: '采购组织', type: 'dimension', position: 'column' },
      { id: 'price', name: '含税价', type: 'metric', position: 'value' },
      { id: 'diff_amount', name: '差异额', type: 'metric', position: 'value' }
    ],
    report_003: [
      { id: 'supplier', name: '供应商', type: 'dimension', position: 'row' },
      { id: 'product', name: '物料编码', type: 'dimension', position: 'row' },
      { id: 'organization', name: '采购组织', type: 'dimension', position: 'column' },
      { id: 'diff_rate', name: '差异率', type: 'metric', position: 'value' }
    ],
    report_004: [
      { id: 'supplier', name: '供应商', type: 'dimension', position: 'row' },
      { id: 'date', name: '采购日期', type: 'dimension', position: 'column' },
      { id: 'price', name: '含税价', type: 'metric', position: 'value' }
    ],
    report_005: [
      { id: 'product', name: '物料编码', type: 'dimension', position: 'row' },
      { id: 'date', name: '采购日期', type: 'dimension', position: 'column' },
      { id: 'price', name: '含税价', type: 'metric', position: 'value' }
    ],
    // 新增的示例报表模板（对应方案列表 id 1/2/3）
    report_101: [
      { id: 'org', name: '管理组织', type: 'dimension', position: 'row' },
      { id: 'category', name: '耗材大类', type: 'dimension', position: 'row' },
      { id: 'supplier', name: '供应商', type: 'dimension', position: 'column' },
      { id: 'current_price', name: '当前价格', type: 'metric', position: 'value' },
      { id: 'baseline_price', name: '基准价格', type: 'metric', position: 'value' },
      { id: 'price_diff_rate', name: '价格差异率', type: 'metric', position: 'value' }
    ],
    report_102: [
      { id: 'supplier', name: '供应商', type: 'dimension', position: 'row' },
      { id: 'product', name: '物料编码', type: 'dimension', position: 'row' },
      { id: 'org', name: '采购组织', type: 'dimension', position: 'column' },
      { id: 'current_price', name: '当前价格', type: 'metric', position: 'value' },
      { id: 'group_price', name: '集团价格', type: 'metric', position: 'value' }
    ],
    report_201: [
      { id: 'product', name: '物料编码', type: 'dimension', position: 'row' },
      { id: 'supplier', name: '供应商', type: 'dimension', position: 'row' },
      { id: 'month', name: '月份', type: 'dimension', position: 'column' },
      { id: 'current_price', name: '当前价格', type: 'metric', position: 'value' },
      { id: 'baseline_price', name: '基准价格', type: 'metric', position: 'value' },
      { id: 'price_diff_rate', name: '价格差异率', type: 'metric', position: 'value' }
    ],
    report_202: [
      { id: 'org', name: '管理组织', type: 'dimension', position: 'row' },
      { id: 'project', name: '专项名称', type: 'dimension', position: 'row' },
      { id: 'phase', name: '阶段', type: 'dimension', position: 'column' },
      { id: 'finished_rate', name: '执行完成率', type: 'metric', position: 'value' }
    ],
    report_301: [
      { id: 'project', name: '项目名称', type: 'dimension', position: 'row' },
      { id: 'org', name: '招采组织', type: 'dimension', position: 'row' },
      { id: 'bid_round', name: '轮次', type: 'dimension', position: 'column' },
      { id: 'bid_price', name: '中标价', type: 'metric', position: 'value' },
      { id: 'baseline_price', name: '基准价', type: 'metric', position: 'value' },
      { id: 'price_diff_rate', name: '价格差异率', type: 'metric', position: 'value' }
    ]
  };

  useEffect(() => {
    if (taskPageMode !== 'create') return;
    if (currentDeliveryType !== 'report_template') return;
    if (!currentSourceReportId) {
      setDroppedItems([]);
      return;
    }

    const nextLayout = reportTemplateLayoutByReportId[currentSourceReportId] || [];
    setDroppedItems(nextLayout);
  }, [taskPageMode, currentDeliveryType, currentSourceReportId]);

  // 基于当前报表模板的布局，生成只读字段设置数据，用于“报表设置”弹窗
  useEffect(() => {
    if (!currentSourceReportId) {
      setFieldSettings([]);
      return;
    }
    const layout = reportTemplateLayoutByReportId[currentSourceReportId] || [];
    const next: ReportFieldSettingItem[] = layout.map((item, index) => ({
      key: `${item.position}_${item.id}_${index}`,
      label: item.name,
      group: item.type === 'dimension' ? '维度' : '指标',
      area:
        item.position === 'row'
          ? 'rows'
          : item.position === 'column'
            ? 'columns'
            : 'metrics',
      enabled: true
    }));
    setFieldSettings(next);
  }, [currentSourceReportId]);

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

  const renderConfigRow = (
    label: string,
    position: LayoutPosition,
    color: 'blue' | 'green' | 'orange'
  ) => {
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
            <Text type="secondary">暂无布局配置</Text>
          ) : (
            items.map(item => (
              <Tag
                key={`${position}-${item.id}`}
                color={color}
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
            {taskPageMode === 'view' && (
              <Button
                type="primary"
                onClick={() => {
                  setTaskPageMode('edit');
                }}
              >
                编辑
              </Button>
            )}
            <Button
              type="primary"
              onClick={() => {
                if (taskPageMode === 'view') {
                  message.info('当前为只读查看模式');
                  return;
                }
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

        <Form form={form} layout="vertical" disabled={taskPageMode === 'view'}>
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
                {isSchemeLockedFromEntry ? (
                  <>
                    <Form.Item
                      name="schemeId"
                      rules={[{ required: true, message: '请选择比价方案' }]}
                      hidden
                    >
                      <Input />
                    </Form.Item>
                    <Form.Item label="比价方案" required>
                      <Input value={schemeDisplayName} disabled />
                    </Form.Item>
                  </>
                ) : (
                  <Form.Item
                    name="schemeId"
                    label="比价方案"
                    rules={[{ required: true, message: '请选择比价方案' }]}
                  >
                    <Select
                      placeholder="选择比价方案"
                      showSearch
                      optionFilterProp="children"
                      disabled={isSchemeLocked}
                      onChange={(val: string) => {
                        if (isSchemeLocked) return;
                        handleSchemeChangeForCreate(val);
                      }}
                    >
                      {schemeOptions.map(option => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                )}
              </Col>

              <Col span={8}>
                <Form.Item
                  name="deliveryType"
                  label="交付类型"
                  rules={[{ required: true, message: '请选择交付类型' }]}
                  initialValue="report_template"
                >
                  <Select
                    placeholder="选择交付类型"
                    options={[{ value: 'report_template', label: '报表模板' }]}
                    onChange={() => {
                      form.setFieldValue('sourceReportId', undefined);
                      form.setFieldValue('sourceReportName', undefined);
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                {currentDeliveryType === 'report_template' ? (
                  <>
                    <Form.Item
                      name="sourceReportId"
                      label="报表模板"
                      rules={[{ required: true, message: '请选择报表模板' }]}
                    >
                      <Select
                        placeholder={currentSchemeId ? '选择报表模板' : '请先选择比价方案'}
                        disabled={isReportLocked || !currentSchemeId}
                        options={currentReportOptions}
                        onChange={(_val: string, option) => {
                          const name = (option as any)?.label;
                          form.setFieldValue('sourceReportName', typeof name === 'string' ? name : undefined);
                        }}
                      />
                    </Form.Item>
                    <Form.Item name="sourceReportName" hidden>
                      <Input />
                    </Form.Item>
                  </>
                ) : (
                  <div />
                )}
              </Col>
              <Col span={8}>
                <Form.Item
                  name="severity"
                  label="预警等级"
                  rules={[{ required: true, message: '请选择预警等级' }]}
                >
                  <Select placeholder="选择预警等级">
                    <Option value="low">提示</Option>
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
                监控结果预览
              </Button>
            }
          >
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: 8,
                    gap: 12
                  }}
                >
                  <Tooltip
                    title={
                      currentSourceReportId
                        ? '查看报表模板的字段与布局配置（只读）'
                        : '请先选择报表模板'
                    }
                  >
                    <Button
                      size="small"
                      onClick={() => {
                        if (!currentSourceReportId) {
                          message.warning('请先选择报表模板');
                          return;
                        }
                        setReportSettingsTab('fields');
                        setReportSettingsVisible(true);
                      }}
                    >
                      报表设置
                    </Button>
                  </Tooltip>
                  <Text strong>报表布局配置</Text>
                </div>
                {renderConfigRow('行维度', 'row', 'blue')}
                {renderConfigRow('列维度', 'column', 'green')}
                {renderConfigRow('指标', 'value', 'orange')}
              </div>
            </div>
          </Card>

          <Modal
            title="报表设置"
            open={reportSettingsVisible}
            onCancel={() => setReportSettingsVisible(false)}
            footer={[
              <Button key="close" type="primary" onClick={() => setReportSettingsVisible(false)}>
                关闭
              </Button>
            ]}
            width={980}
          >
            <div style={{ marginBottom: 12 }}>
              <Text type="secondary">报表模板：</Text>
              <Text strong style={{ marginLeft: 4 }}>
                {currentSourceReportName || currentSourceReportId || '未选择'}
              </Text>
            </div>
            <Tabs
              activeKey={reportSettingsTab}
              onChange={(k) => setReportSettingsTab(k as 'fields' | 'totals')}
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
                      ]).map((block) => {
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
                                rowKey={(r: ReportFieldSettingItem) => r.key}
                                dataSource={data}
                                pagination={false}
                                scroll={{ y: 260 }}
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
                                      <Switch size="small" checked={record.enabled} disabled />
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
                          <Text strong style={{ fontSize: 14 }}>
                            总计行列配置
                          </Text>
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
                            <Radio.Group value={rowTotalPosition} disabled>
                              <Radio.Button value="top">顶部</Radio.Button>
                              <Radio.Button value="bottom">底部</Radio.Button>
                            </Radio.Group>
                          </div>
                          <Switch checked={rowTotalEnabled} disabled />
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 0',
                            borderTop: '1px solid #f5f5f5'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <Text style={{ width: 72 }}>列总计</Text>
                            <Radio.Group value={colTotalPosition} disabled>
                              <Radio.Button value="left">左侧</Radio.Button>
                              <Radio.Button value="right">右侧</Radio.Button>
                            </Radio.Group>
                          </div>
                          <Switch checked={colTotalEnabled} disabled />
                        </div>

                        <div style={{ marginTop: 16 }}>
                          <Text strong style={{ fontSize: 14 }}>
                            汇总指标
                          </Text>
                          <div style={{ marginTop: 12 }}>
                            {totalMetricSettings.map((metric) => (
                              <div
                                key={metric.key}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '8px 0',
                                  borderTop: '1px solid #f5f5f5'
                                }}
                              >
                                <div>
                                  <Text>{metric.label}</Text>
                                  <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                                    {metric.agg === 'avg' ? '平均值' : metric.agg}
                                  </Text>
                                </div>
                                <Switch checked={metric.enabled} disabled />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                }
              ]}
            />
          </Modal>

          {/* 3. 调度设置 */}
          <Card title="调度设置" style={{ marginBottom: 16 }}>
            <Form.Item
              name="cronExpression"
              label="定时规则"
              initialValue="0 0 10 * * ? *"
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
              <CronExpressionEditor
                value={cronValue}
                onChange={(newValue) => {
                  setCronValue(newValue);
                  form.setFieldValue('cronExpression', newValue);
                }}
                defaultTab="day"
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
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="notificationReceivers" label="接收用户" style={{ marginBottom: 12 }}>
                  <Select
                    mode="multiple"
                    placeholder="选择用户"
                    style={{ width: '100%' }}
                    options={[
                      { label: '张三', value: 'user_zhangsan' },
                      { label: '李四', value: 'user_lisi' },
                      { label: '王五', value: 'user_wangwu' },
                      { label: '赵六', value: 'user_zhaoliu' }
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="notificationReceiverGroups" label="接收用户组" style={{ marginBottom: 12 }}>
                  <Select
                    mode="multiple"
                    placeholder="选择用户组"
                    style={{ width: '100%' }}
                    options={[
                      { label: '采购组', value: 'group_purchase' },
                      { label: '风控组', value: 'group_risk' },
                      { label: '价格分析组', value: 'group_price' }
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              noStyle
              shouldUpdate={(prev, cur) =>
                prev.notificationReceivers !== cur.notificationReceivers ||
                prev.notificationReceiverGroups !== cur.notificationReceiverGroups
              }
            >
              {({ getFieldValue }) => {
                const receivers = getFieldValue('notificationReceivers') || [];
                const receiverGroups = getFieldValue('notificationReceiverGroups') || [];
                const hasReceivers =
                  (Array.isArray(receivers) && receivers.length > 0) ||
                  (Array.isArray(receiverGroups) && receiverGroups.length > 0);

                return (
                  <>
                    <Form.Item
                      name="notificationChannels"
                      label="通知方式"
                      required={hasReceivers}
                      rules={hasReceivers ? [{ required: true, message: '请选择至少一种通知方式' }] : []}
                    >
                      <Checkbox.Group
                        options={[
                          { label: '邮件', value: 'email' },
                          { label: '短信', value: 'sms', disabled: true },
                          { label: '钉钉', value: 'dingtalk' },
                          { label: '企业微信', value: 'wechat', disabled: true }
                        ]}
                      />
                    </Form.Item>
                    <Form.Item
                      name="alertNotificationTitle"
                      label="预警消息标题"
                      initialValue="【监控预警】{taskName} 触发预警"
                      required={hasReceivers}
                      rules={hasReceivers ? [{ required: true, message: '请填写预警消息标题' }] : []}
                    >
                      <Input
                        placeholder="如：{taskName} 于 {time} 触发{severity}预警"
                        onFocus={() => setActiveInputField('alertTitle')}
                      />
                    </Form.Item>
                    <Form.Item
                      name="alertNotificationDescription"
                      label="预警消息内容"
                      initialValue="任务 {taskName} 于 {time} 触发预警，本次命中 {hitCount} 条记录。可通过 {downloadUrl} 下载相关数据。"
                      required={hasReceivers}
                      rules={hasReceivers ? [{ required: true, message: '请输入消息内容' }] : []}
                    >
                      <TextArea
                        rows={4}
                        placeholder="点击下方变量标签插入"
                        onFocus={() => setActiveInputField('alertContent')}
                      />
                    </Form.Item>
                  </>
                );
              }}
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
          </Card>
        </Form>

        {/* 测试发送确认弹窗（创建任务页使用） */}
        <Modal
          open={testSendModalVisible}
          title={testSendResults ? '测试发送结果' : '测试发送确认'}
          onCancel={() => {
            if (testSendLoading) return;
            setTestSendModalVisible(false);
            setTestSendResults(null);
          }}
          footer={
            testSendResults
              ? [
                  <Button
                    key="close"
                    type="primary"
                    onClick={() => {
                      setTestSendModalVisible(false);
                      setTestSendResults(null);
                    }}
                  >
                    关闭
                  </Button>
                ]
              : [
                  <Button
                    key="cancel"
                    onClick={() => {
                      if (testSendLoading) return;
                      setTestSendModalVisible(false);
                    }}
                    disabled={testSendLoading}
                  >
                    取消
                  </Button>,
                  <Button
                    key="ok"
                    type="primary"
                    loading={testSendLoading}
                    onClick={handleConfirmTestSend}
                  >
                    确认发送
                  </Button>
                ]
          }
          width={720}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            {!testSendResults && (
              <Text>
                将按当前通知配置向所选接收人发送一条测试消息，是否确认？
              </Text>
            )}
            {testSendLoading && (
              <Text type="secondary">正在发送测试通知，请稍候…</Text>
            )}
            {testSendResults && (
              <>
                <Text strong style={{ marginTop: 8 }}>发送结果</Text>
                <Table
                  columns={notificationColumns}
                  dataSource={testSendResults}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              </>
            )}
          </Space>
        </Modal>
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

    const headerText = previewAlertRecord
      ? '监控结果预览 - 预警快照（示例数据，非最新）'
      : '监控结果预览 - 基于当前配置的示例数据';

    return (
      <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
        {/* 顶部标题栏 */}
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Text type="secondary">{headerText}</Text>
            {previewAlertRecord && (
              <Text type="secondary" style={{ marginTop: 4 }}>
                预警任务：{previewAlertRecord.taskName}，预警时间：{previewAlertRecord.timestamp}，命中记录数：{previewAlertRecord.hitCount}
              </Text>
            )}
          </div>
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
      render: (text: string) => (
        <Text strong>{text}</Text>
      )
    },
    {
      title: '状态',
      key: 'enabled',
      render: (record: MonitorTask) => (
        <Tag color={record.enabled ? 'green' : 'red'}>
          {record.enabled ? '启用' : '停用'}
        </Tag>
      )
    },
    {
      title: '比价方案',
      dataIndex: 'schemeName',
      key: 'schemeName'
    },
    {
      title: '交付类型',
      key: 'deliveryType',
      render: () => <Text>报表模板</Text>
    },
    {
      title: '报表模板',
      dataIndex: 'sourceReportName',
      key: 'sourceReportName',
      render: (text: string, record: MonitorTask) => <Text>{text || record.sourceReportId || '-'} </Text>
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
      title: '最近执行时间',
      dataIndex: 'lastCheck',
      key: 'lastCheck'
    },
    {
      title: '最近执行结果',
      dataIndex: 'lastRunStatus',
      key: 'lastRunStatus',
      render: (_: any, record: MonitorTask) => {
        const isSuccess = record.lastRunStatus === 'success';
        const tag = <Tag color={isSuccess ? 'green' : 'red'}>{isSuccess ? '成功' : '失败'}</Tag>;
        return record.lastRunError ? (
          <Tooltip title={record.lastRunError}>{tag}</Tooltip>
        ) : (
          tag
        );
      }
    },
    {
      title: '操作',
      key: 'actions',
      render: (record: MonitorTask) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleViewResult(record)}>
            监控结果预览
          </Button>
          <Tooltip title="查看详情">
            <Button type="text" icon={<EyeOutlined />} onClick={() => handleViewTaskDetail(record)} />
          </Tooltip>
          <Tooltip title="执行日志">
            <Button type="text" icon={<Activity className="h-4 w-4" />} onClick={() => handleViewExecutionLog(record)} />
          </Tooltip>
          <Tooltip title="编辑">
            <Button type="text" icon={<EditOutlined />} onClick={() => handleEditTask(record)} />
          </Tooltip>
          <Tooltip title={record.enabled ? '暂停' : '启动'}>
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
      title: '监控任务',
      dataIndex: 'taskName',
      key: 'taskName'
    },
    {
      title: '预警等级',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: string) => {
        const config: Record<MonitorTask['severity'], { color: string; text: string }> = {
          low: { color: 'default', text: '提示' },
          medium: { color: 'orange', text: '重要' },
          high: { color: 'red', text: '严重' },
          critical: { color: 'magenta', text: '紧急' }
        };
        const { color, text } = config[severity as MonitorTask['severity']] || config.low;
        return <Tag color={color}>{text}</Tag>;
      }
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
          <Button type="link" size="small" onClick={() => handlePreviewAlertRecord(record)}>
            查看预警记录
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
      title: '员工',
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
      {false && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Card>
              <Statistic
                title="监控任务总数"
                value={allMonitorTasks.length}
                prefix={<Target className="h-4 w-4" />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="运行中任务"
                value={allMonitorTasks.filter(t => t.enabled).length}
                prefix={<PlayCircleOutlined className="h-4 w-4" />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="近一月预警数"
                value={allMonthlyAlertCount}
                prefix={<WarningOutlined className="h-4 w-4" />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 主要内容区域 */}
      <Card>
        <Card size="small" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <Space wrap>
              <Input
                placeholder="任务名称"
                allowClear
                style={{ width: 220 }}
                value={filterTaskName}
                onChange={(e) => setFilterTaskName(e.target.value)}
              />
              <Select
                placeholder="预警等级"
                allowClear
                style={{ width: 160 }}
                value={filterSeverity}
                onChange={(v) => setFilterSeverity(v as MonitorTask['severity'] | undefined)}
                options={[
                  { label: '提示', value: 'low' },
                  { label: '重要', value: 'medium' },
                  { label: '严重', value: 'high' },
                  { label: '紧急', value: 'critical' }
                ]}
              />
              <Select
                placeholder="比价方案"
                allowClear
                showSearch
                optionFilterProp="label"
                filterOption={(input, option) =>
                  (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                }
                style={{ width: 200 }}
                value={filterSchemeIds[0]}
                onChange={(v) => {
                  // 简化为单选：内部仍然用 filterSchemeIds 参与过滤
                  setFilterSchemeIds(v ? [v as string] : []);
                }}
                options={schemeOptions}
              />
              <Select
                placeholder="报表模板"
                allowClear
                showSearch
                optionFilterProp="label"
                filterOption={(input, option) =>
                  (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                }
                style={{ width: 240 }}
                value={filterSourceReportId}
                onChange={(v, option) => {
                  setFilterSourceReportId(v);
                  const name = (option as any)?.label;
                  setFilterSourceReportName(typeof name === 'string' ? name : undefined);
                }}
                options={sourceReportOptions}
              />
            </Space>
            <Space>
              {filterSourceReportId && (
                <Text type="secondary">已按报表模板筛选：{filterSourceReportName || filterSourceReportId}</Text>
              )}
              {filterSchemeIds.length > 0 && (
                <Tooltip title={schemeFilterSummary}>
                  <Text type="secondary">已筛选方案：{schemeFilterSummary}</Text>
                </Tooltip>
              )}
              <Button onClick={handleClearFilters}>清空筛选</Button>
            </Space>
          </div>
        </Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Tooltip title="所有任务为原型演示：当前展示全部监控任务及其产生的预警记录（后续会接入权限控制）">
            <Text type="secondary">范围：全部</Text>
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
            dataSource={filteredAllMonitorTasks}
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
      </Card>

      <Modal
        open={executionLogVisible}
        title="执行日志"
        footer={null}
        onCancel={() => setExecutionLogVisible(false)}
        width={860}
      >
        {executionLogTaskId ? (
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text type="secondary">监控任务：</Text>
              <Text strong>
                {allMonitorTasks.find(t => t.id === executionLogTaskId)?.name || executionLogTaskId}
              </Text>
            </div>
            <Table
              columns={executionLogColumns}
              dataSource={currentExecutionLogs}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              size="small"
            />
          </Space>
        ) : (
          <Text type="secondary">暂无执行记录</Text>
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
          <Table
            columns={notificationColumns}
            dataSource={notificationDetailRecord.notifications}
            rowKey="id"
            pagination={false}
            size="small"
          />
        )}
      </Modal>

      {/* 测试发送确认弹窗（列表视图使用） */}
      <Modal
        open={testSendModalVisible}
        title={testSendResults ? '测试发送结果' : '测试发送确认'}
        onCancel={() => {
          if (testSendLoading) return;
          setTestSendModalVisible(false);
          setTestSendResults(null);
        }}
        footer={
          testSendResults
            ? [
                <Button
                  key="close"
                  type="primary"
                  onClick={() => {
                    setTestSendModalVisible(false);
                    setTestSendResults(null);
                  }}
                >
                  关闭
                </Button>
              ]
            : [
                <Button
                  key="cancel"
                  onClick={() => {
                    if (testSendLoading) return;
                    setTestSendModalVisible(false);
                  }}
                  disabled={testSendLoading}
                >
                  取消
                </Button>,
                <Button
                  key="ok"
                  type="primary"
                  loading={testSendLoading}
                  onClick={handleConfirmTestSend}
                >
                  确认发送
                </Button>
              ]
        }
        width={720}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          {!testSendResults && (
            <Text>
              将按当前通知配置向所选接收人发送一条测试消息（会发送给真实接收人），是否确认？
            </Text>
          )}
          {testSendLoading && (
            <Text type="secondary">正在发送测试通知，请稍候…</Text>
          )}
          {testSendResults && (
            <>
              <Text strong style={{ marginTop: 8 }}>发送结果</Text>
              <Table
                columns={notificationColumns}
                dataSource={testSendResults}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </>
          )}
        </Space>
      </Modal>
    </div>
  );
};

export default MonitoringManagement;