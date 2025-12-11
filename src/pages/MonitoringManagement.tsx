import React, { useState } from 'react';
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
  TimePicker,
  Tree,
  InputNumber,
  Switch
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  DeleteOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  BellOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import {
  BarChart3,
  Target,
  Activity,
  AlertTriangle as AlertIcon
} from 'lucide-react';
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
  alertCount: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface AlertRecord {
  id: string;
  taskId: string;
  taskName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: string;
  status: 'active' | 'acknowledged' | 'resolved';
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
  const [activeTab, setActiveTab] = useState('tasks');
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'preview'>('list');
  const [monitorConditions, setMonitorConditions] = useState<QueryCondition[]>([]);
  const [droppedItems, setDroppedItems] = useState<LayoutDroppedItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<ReportFieldItem | null>(null);
  const [form] = Form.useForm();
  const [expandedKeys, setExpandedKeys] = useState<string[]>(['dimension', 'metric', 'calculated', 'baseline']);
  const [activeInputField, setActiveInputField] = useState<'alertTitle' | 'alertContent' | 'noAlertTitle' | 'noAlertContent' | null>(null);

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

  // 测试发送通知（基于当前卡片选择的渠道）
  const handleTestNotification = (channel?: 'email' | 'dingtalk' | 'wecom') => {
    if (!channel) {
      message.warning('请选择渠道类型后再测试发送');
      return;
    }
    const channelNames = { email: '邮件', dingtalk: '钉钉', wecom: '企业微信' };
    message.success(`已发送${channelNames[channel]}测试消息（示例，实际需接入后端）`);
  };

  // 邮件批量粘贴处理（针对 Form.List 的每一项）
  const handleEmailPaste = (e: React.ClipboardEvent<HTMLInputElement>, fieldIndex: number) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const emails = pastedText.split(/[,;、\s]+/).filter(Boolean);
    const current: string[] = form.getFieldValue(['notificationChannels', fieldIndex, 'emails']) || [];
    form.setFieldValue(['notificationChannels', fieldIndex, 'emails'], [...current, ...emails]);
  };

  const monitorTasks: MonitorTask[] = [
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
      lastCheck: '10分钟前',
      alertCount: 3,
      severity: 'high'
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
      lastCheck: '2小时前',
      alertCount: 0,
      severity: 'medium'
    }
  ];

  const alertRecords: AlertRecord[] = [
    {
      id: '1',
      taskId: '1',
      taskName: 'CPU价格异常监控',
      severity: 'high',
      message: 'Intel i9-14900K 价格上涨 23%，超过阈值 15%',
      value: 23,
      threshold: 15,
      timestamp: '5分钟前',
      status: 'active'
    },
    {
      id: '2',
      taskId: '1',
      taskName: 'CPU价格异常监控',
      severity: 'medium',
      message: 'AMD Ryzen 7 价格上涨 12%',
      value: 12,
      threshold: 10,
      timestamp: '30分钟前',
      status: 'acknowledged'
    }
  ];

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
              <Col span={6}>
                <Form.Item
                  name="taskName"
                  label="任务名称"
                  rules={[{ required: true, message: '请填写任务名称' }]}
                >
                  <Input placeholder="如：供应价差监控" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name="schemeId"
                  label="比价方案"
                  rules={[{ required: true, message: '请选择比价方案' }]}
                >
                  <Select placeholder="选择比价方案" showSearch optionFilterProp="children">
                    {schemeOptions.map(option => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={6}>
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
              <Col span={6}>
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
          <Card title="监控视图" style={{ marginBottom: 16 }} bodyStyle={{ padding: 0 }}>
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

          {/* 3. 监控规则 */}
          <Card title="监控规则">
            <Row gutter={16} align="middle" style={{ marginBottom: 8 }}>
              <Col span={8}>
                <Form.Item
                  name={['rule', 'conditionLogic']}
                  label="触发条件"
                  initialValue="AND"
                  rules={[{ required: true, message: '请选择触发条件' }]}
                >
                  <Select>
                    <Option value="AND">满足所有条件时触发</Option>
                    <Option value="OR">满足任一条件时触发</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={16} style={{ textAlign: 'right' }}>
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={() => {
                    // 验证表单后跳转到预览页面
                    form.validateFields(['rule', 'monitoringFrequency']).then(() => {
                      setViewMode('preview');
                    }).catch(() => {
                      message.error('请先完成规则配置');
                    });
                  }}
                >
                  监控结果预览
                </Button>
              </Col>
            </Row>

            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
              添加需要监控的指标及其数值区间。根据上方触发条件（满足所有/任一）判断是否触发预警。
            </Text>

            <Form.List name={['rule', 'conditions']}>
              {(condFields, { add: addCond, remove: removeCond }) => (
                <>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-start', marginBottom: 12 }}>
                    {condFields.map(({ key: cKey, name: cName }) => (
                      <div
                        key={cKey}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 8px',
                          border: '1px solid #d9d9d9',
                          borderRadius: 4,
                          background: '#fafafa'
                        }}
                      >
                        <Form.Item
                          {...{ name: [cName, 'metricId'] }}
                          style={{ marginBottom: 0, minWidth: 120 }}
                          rules={[{ required: true, message: '请选择指标' }]}
                        >
                          <Select
                            placeholder="选择指标"
                            size="small"
                            style={{ width: 120 }}
                          >
                            {metricFields.map(m => (
                              <Option key={m.id} value={m.id}>
                                {m.name}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>

                        <span style={{ color: '#9ca3af', fontSize: 12 }}>:</span>

                        <Form.Item
                          {...{ name: [cName, 'min'] }}
                          style={{ marginBottom: 0, width: 60 }}
                        >
                          <InputNumber
                            placeholder="最小"
                            size="small"
                            style={{ width: 60 }}
                          />
                        </Form.Item>

                        <span style={{ color: '#9ca3af', fontSize: 12 }}>~</span>

                        <Form.Item
                          {...{ name: [cName, 'max'] }}
                          style={{ marginBottom: 0, width: 60 }}
                        >
                          <InputNumber
                            placeholder="最大"
                            size="small"
                            style={{ width: 60 }}
                          />
                        </Form.Item>

                        <Button
                          type="text"
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => removeCond(cName)}
                          style={{ padding: '0 4px' }}
                        />
                      </div>
                    ))}
                    <Button
                      type="primary"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => addCond()}
                    >
                      添加指标条件
                    </Button>
                  </div>
                </>
              )}
            </Form.List>

            <Row gutter={16} style={{ marginTop: 16, marginBottom: 16 }}>
              <Col span={8}>
                <Form.Item
                  name="monitoringFrequency"
                  label="执行频率"
                  initialValue="daily"
                  rules={[{ required: true, message: '请选择执行频率' }]}
                >
                  <Select placeholder="选择执行频率">
                    <Option value="hourly">每小时</Option>
                    <Option value="daily">每天</Option>
                    <Option value="weekly">每周</Option>
                    <Option value="monthly">每月</Option>
                    <Option value="yearly">每年</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  shouldUpdate={(prev, curr) => prev.monitoringFrequency !== curr.monitoringFrequency}
                  noStyle
                >
                  {({ getFieldValue }) => {
                    const frequency = getFieldValue('monitoringFrequency');
                    if (frequency === 'hourly') {
                      return (
                        <Form.Item
                          name="hourInterval"
                          label="间隔小时数"
                          rules={[{ required: true, message: '请输入间隔小时数' }]}
                        >
                          <InputNumber placeholder="例如：1" min={1} max={24} style={{ width: '100%' }} />
                        </Form.Item>
                      );
                    }
                    if (frequency === 'daily') {
                      return (
                        <Form.Item
                          name="executeTime"
                          label="执行时间"
                          rules={[{ required: true, message: '请选择执行时间' }]}
                        >
                          <TimePicker style={{ width: '100%' }} format="HH:mm" />
                        </Form.Item>
                      );
                    }
                    if (frequency === 'weekly') {
                      return (
                        <Form.Item
                          name="weekDays"
                          label="执行星期"
                          rules={[{ required: true, message: '请选择执行星期' }]}
                        >
                          <Select mode="multiple" placeholder="选择星期几" style={{ width: '100%' }}>
                            <Option value="monday">周一</Option>
                            <Option value="tuesday">周二</Option>
                            <Option value="wednesday">周三</Option>
                            <Option value="thursday">周四</Option>
                            <Option value="friday">周五</Option>
                            <Option value="saturday">周六</Option>
                            <Option value="sunday">周日</Option>
                          </Select>
                        </Form.Item>
                      );
                    }
                    if (frequency === 'monthly') {
                      return (
                        <Form.Item
                          name="monthDays"
                          label="执行日期"
                          rules={[{ required: true, message: '请选择执行日期' }]}
                        >
                          <Select mode="multiple" placeholder="选择几号" style={{ width: '100%' }}>
                            {Array.from({ length: 31 }, (_, i) => (
                              <Option key={i + 1} value={i + 1}>{i + 1}日</Option>
                            ))}
                          </Select>
                        </Form.Item>
                      );
                    }
                    if (frequency === 'yearly') {
                      return (
                        <Form.Item
                          name="yearDate"
                          label="执行日期"
                          rules={[{ required: true, message: '请选择执行日期' }]}
                        >
                          <Input placeholder="例如：01-15" style={{ width: '100%' }} />
                        </Form.Item>
                      );
                    }
                    return null;
                  }}
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  shouldUpdate={(prev, curr) => prev.monitoringFrequency !== curr.monitoringFrequency}
                  noStyle
                >
                  {({ getFieldValue }) => {
                    const frequency = getFieldValue('monitoringFrequency');
                    if (frequency === 'hourly') {
                      return (
                        <Form.Item
                          name="executeMinute"
                          label="执行分钟"
                          rules={[{ required: true, message: '请输入执行分钟' }]}
                        >
                          <InputNumber placeholder="0-59" min={0} max={59} style={{ width: '100%' }} />
                        </Form.Item>
                      );
                    }
                    if (frequency === 'weekly' || frequency === 'monthly' || frequency === 'yearly') {
                      return (
                        <Form.Item
                          name="executeTime"
                          label="执行时间"
                          rules={[{ required: true, message: '请选择执行时间' }]}
                        >
                          <TimePicker style={{ width: '100%' }} format="HH:mm" />
                        </Form.Item>
                      );
                    }
                    return null;
                  }}
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="notifyWhenNoAlert"
                  label="无异常是否通知"
                  initialValue="no"
                >
                  <Select>
                    <Option value="no">仅异常时通知</Option>
                    <Option value="yes">异常和无异常均通知</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

          </Card>

          {/* 4. 通知设置 */}
          <Card title="通知设置" style={{ marginBottom: 16 }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
              当监控规则被触发时，将按以下设置发送通知。未填写的渠道将不会发送。
            </Text>

            <Tabs
              defaultActiveKey="alert"
              style={{ marginBottom: 16 }}
              items={[
                {
                  key: 'alert',
                  label: '异常通知模板',
                  children: (
                    <>
                      <Row gutter={16} style={{ marginBottom: 8 }}>
                        <Col span={8}>
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
                        </Col>
                        <Col span={16}>
                          <Form.Item
                            name="alertNotificationDescription"
                            label="消息内容"
                            initialValue="任务【{taskName}】在{time}触发预警（等级：{severity}），命中记录数：{hitCount}。"
                          >
                            <TextArea
                              rows={3}
                              placeholder="点击下方变量标签插入"
                              onFocus={() => setActiveInputField('alertContent')}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <div style={{ marginBottom: 8 }}>
                        <Text type="secondary" style={{ fontSize: 12, marginRight: 8 }}>点击插入变量：</Text>
                        {templateVariables.map(v => (
                          <Tag
                            key={v.key}
                            color="blue"
                            style={{ cursor: 'pointer', marginBottom: 4 }}
                            onClick={() => insertVariable(v.key)}
                          >
                            {`{${v.key}}`} {v.label}
                          </Tag>
                        ))}
                      </div>
                    </>
                  )
                },
                {
                  key: 'noAlert',
                  label: '无异常通知模板',
                  children: (
                    <>
                      <Row gutter={16} style={{ marginBottom: 8 }}>
                        <Col span={8}>
                          <Form.Item
                            name="noAlertNotificationTitle"
                            label="消息标题"
                            initialValue="【监控结果】{taskName} 检测通过"
                            rules={[{ required: true, message: '请输入消息标题' }]}
                          >
                            <Input
                              placeholder="点击下方变量标签插入"
                              onFocus={() => setActiveInputField('noAlertTitle')}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={16}>
                          <Form.Item
                            name="noAlertNotificationDescription"
                            label="消息内容"
                            initialValue="任务【{taskName}】在{time}完成检测，未发现异常。"
                          >
                            <TextArea
                              rows={3}
                              placeholder="点击下方变量标签插入"
                              onFocus={() => setActiveInputField('noAlertContent')}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <div style={{ marginBottom: 8 }}>
                        <Text type="secondary" style={{ fontSize: 12, marginRight: 8 }}>点击插入变量：</Text>
                        {templateVariables.map(v => (
                          <Tag
                            key={v.key}
                            color="blue"
                            style={{ cursor: 'pointer', marginBottom: 4 }}
                            onClick={() => insertVariable(v.key)}
                          >
                            {`{${v.key}}`} {v.label}
                          </Tag>
                        ))}
                      </div>
                    </>
                  )
                }
              ]}
            />

            <Form.List name="notificationChannels">
              {(fields, { add, remove }) => (
                <Row gutter={[12, 12]}>
                  {fields.map((field) => {
                    const itemKey = (field.key ?? field.name) as React.Key;
                    return (
                      <Col span={8} key={itemKey}>
                        <Card
                          size="small"
                          title="通知渠道"
                          extra={
                            <Space size={8}>
                              <Button
                                size="small"
                                onClick={() =>
                                  handleTestNotification(
                                    form.getFieldValue(['notificationChannels', field.name, 'channelType'])
                                  )
                                }
                              >
                                测试发送
                              </Button>
                              <Button danger type="link" size="small" onClick={() => remove(field.name)}>
                                删除
                              </Button>
                            </Space>
                          }
                        >
                          <Form.Item
                            name={[field.name, 'channelType']}
                            label="渠道类型"
                            rules={[{ required: true, message: '请选择渠道类型' }]}
                          >
                            <Select placeholder="选择渠道">
                              <Option value="email">邮件</Option>
                              <Option value="dingtalk">钉钉机器人</Option>
                              <Option value="wecom">企业微信机器人</Option>
                            </Select>
                          </Form.Item>

                          <Form.Item noStyle shouldUpdate>
                            {({ getFieldValue }) => {
                              const channelType = getFieldValue(['notificationChannels', field.name, 'channelType']);
                              if (channelType === 'email') {
                                return (
                                  <div
                                    onPaste={(e: React.ClipboardEvent<HTMLInputElement>) =>
                                      handleEmailPaste(e, field.name)
                                    }
                                  >
                                    <Form.Item
                                      name={[field.name, 'emails']}
                                      label="收件人邮箱"
                                      rules={[{ required: true, message: '请输入收件人邮箱' }]}
                                    >
                                      <Select
                                        mode="tags"
                                        tokenSeparators={[',', ';', ' ', '、']}
                                        placeholder="输入邮箱后回车；支持粘贴批量拆分"
                                      />
                                    </Form.Item>
                                  </div>
                                );
                              }
                              return (
                                <Form.Item
                                  name={[field.name, 'webhook']}
                                  label="Webhook 地址"
                                  rules={[{ required: true, message: '请输入 Webhook 地址' }]}
                                >
                                  <Input placeholder={channelType === 'wecom' ? '企业微信机器人 Webhook' : '钉钉机器人 Webhook'} />
                                </Form.Item>
                              );
                            }}
                          </Form.Item>
                        </Card>
                      </Col>
                    );
                  })}

                  <Col span={8}>
                    <Button
                      type="dashed"
                      block
                      icon={<PlusOutlined />}
                      onClick={() => add({ channelType: 'email' })}
                    >
                      新增通知渠道
                    </Button>
                  </Col>
                </Row>
              )}
            </Form.List>
          </Card>
        </Form>
      </div>
    );
  };

  // 规则预览页面（AntV S2 报表 demo）
  const renderPreviewPage = () => {
    // 模拟数据
    const mockData = [
      { supplier: '供应商A', product: 'CPU-001', date: '2024-01-15', price: 1200, diff_rate: 15.2 },
      { supplier: '供应商B', product: 'CPU-002', date: '2024-01-15', price: 1350, diff_rate: 22.5 },
      { supplier: '供应商A', product: 'GPU-001', date: '2024-01-15', price: 3200, diff_rate: 8.3 },
      { supplier: '供应商C', product: 'CPU-003', date: '2024-01-15', price: 980, diff_rate: 35.1 },
      { supplier: '供应商B', product: 'GPU-002', date: '2024-01-15', price: 4500, diff_rate: 12.8 },
    ];

    const ruleConditions = form.getFieldValue(['rule', 'conditions']) || [];
    const conditionLogic = form.getFieldValue(['rule', 'conditionLogic']) || 'AND';

    return (
      <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              <Space>
                <BarChart3 className="h-5 w-5" />
                监控结果预览
              </Space>
            </Title>
            <Text type="secondary">
              预览当前规则配置下的匹配数据（示例数据，仅供效果参考）
            </Text>
          </div>
          <Button onClick={() => setViewMode('create')}>
            返回编辑
          </Button>
        </div>

        {/* 规则摘要 */}
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={24}>
            <Col span={8}>
              <Text type="secondary">任务名称：</Text>
              <Text strong>{form.getFieldValue('taskName') || '未命名任务'}</Text>
            </Col>
            <Col span={8}>
              <Text type="secondary">触发条件：</Text>
              <Text strong>{conditionLogic === 'AND' ? '满足所有条件' : '满足任一条件'}</Text>
            </Col>
            <Col span={8}>
              <Text type="secondary">指标条件数：</Text>
              <Text strong>{ruleConditions.length} 个</Text>
            </Col>
          </Row>
          {ruleConditions.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <Text type="secondary">已配置条件：</Text>
              <div style={{ marginTop: 4 }}>
                {ruleConditions.map((cond: any, idx: number) => {
                  const metric = metricFields.find(m => m.id === cond?.metricId);
                  let rangeText = '';
                  if (cond?.min !== undefined && cond?.max !== undefined) {
                    rangeText = `${cond.min} ~ ${cond.max}`;
                  } else if (cond?.min !== undefined) {
                    rangeText = `≥ ${cond.min}`;
                  } else if (cond?.max !== undefined) {
                    rangeText = `≤ ${cond.max}`;
                  }
                  return (
                    <Tag key={idx} color="blue" style={{ marginBottom: 4 }}>
                      {metric?.name || '未知指标'} {rangeText}
                    </Tag>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        {/* AntV S2 报表区域 - 这里用占位符，实际需要集成 @antv/s2 */}
        <Card title="数据透视表（AntV S2 Demo）" style={{ marginBottom: 16 }}>
          <div
            style={{
              height: 400,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}
          >
            <BarChart3 style={{ width: 64, height: 64, marginBottom: 16 }} />
            <Title level={4} style={{ color: '#fff', margin: 0 }}>AntV S2 透视表</Title>
            <Text style={{ color: 'rgba(255,255,255,0.8)', marginTop: 8 }}>
              此处将展示 @antv/s2 数据透视表
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', marginTop: 4, fontSize: 12 }}>
              需要安装 @antv/s2 和 @antv/s2-react 依赖
            </Text>
          </div>
        </Card>

        {/* 匹配数据明细 */}
        <Card title="匹配数据明细">
          <Table
            size="small"
            rowKey="product"
            dataSource={mockData}
            pagination={{ pageSize: 10 }}
            columns={[
              { title: '供应商', dataIndex: 'supplier', key: 'supplier' },
              { title: '物料编码', dataIndex: 'product', key: 'product' },
              { title: '日期', dataIndex: 'date', key: 'date' },
              { title: '含税价', dataIndex: 'price', key: 'price' },
              {
                title: '差异率(%)',
                dataIndex: 'diff_rate',
                key: 'diff_rate',
                render: (val: number) => (
                  <Text style={{ color: val > 20 ? '#f5222d' : val > 10 ? '#fa8c16' : '#52c41a' }}>
                    {val}%
                  </Text>
                )
              }
            ]}
          />
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
      title: '数据源',
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
      title: '预警数',
      dataIndex: 'alertCount',
      key: 'alertCount',
      render: (count: number) => (
        <Badge count={count} showZero color={count > 0 ? 'red' : 'gray'} />
      )
    },
    {
      title: '最后检查',
      dataIndex: 'lastCheck',
      key: 'lastCheck'
    },
    {
      title: '操作',
      key: 'actions',
      render: (record: MonitorTask) => (
        <Space>
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
      title: '预警信息',
      dataIndex: 'message',
      key: 'message'
    },
    {
      title: '数值/阈值',
      key: 'values',
      render: (record: AlertRecord) => (
        <Text>
          {record.value}% / {record.threshold}%
        </Text>
      )
    },
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = {
          active: { color: 'red', text: '活跃' },
          acknowledged: { color: 'orange', text: '已确认' },
          resolved: { color: 'green', text: '已解决' }
        };
        const { color, text } = config[status as keyof typeof config];
        return <Badge status={color as any} text={text} />;
      }
    }
  ];

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
              监控预警管理
            </Space>
          </Title>
          <Text type="secondary">配置业务监控规则，及时预警数据异常</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            form.resetFields();
            setMonitorConditions([]);
            setViewMode('create');
          }}
          size="large"
        >
          创建监控任务
        </Button>
      </div>

      {/* 统计概览 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="监控任务总数"
              value={monitorTasks.length}
              prefix={<Target className="h-4 w-4" />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="运行中任务"
              value={monitorTasks.filter(t => t.enabled).length}
              prefix={<PlayCircleOutlined className="h-4 w-4" />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日预警数"
              value={alertRecords.length}
              prefix={<WarningOutlined className="h-4 w-4" />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待处理预警"
              value={alertRecords.filter(a => a.status === 'active').length}
              prefix={<BellOutlined className="h-4 w-4" />}
              valueStyle={{ color: '#f5222d' }}
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
                监控任务
                <Badge count={monitorTasks.length} showZero />
              </Space>
            }
            key="tasks"
          >
            <Table
              columns={taskColumns}
              dataSource={monitorTasks}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Tabs.TabPane>

          <Tabs.TabPane
            tab={
              <Space>
                <AlertIcon className="h-4 w-4" />
                预警记录
                <Badge count={alertRecords.filter(a => a.status === 'active').length} showZero />
              </Space>
            }
            key="alerts"
          >
            <Table
              columns={alertColumns}
              dataSource={alertRecords}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Tabs.TabPane>

          <Tabs.TabPane
            tab={
              <Space>
                <BarChart3 className="h-4 w-4" />
                监控分析
              </Space>
            }
            key="analysis"
          >
            <div style={{ padding: 40, textAlign: 'center' }}>
              <AlertIcon className="h-16 w-16" style={{ color: '#d9d9d9', marginBottom: 16 }} />
              <Title level={4} type="secondary">监控分析</Title>
              <Text type="secondary">监控趋势分析、预警效果统计等功能开发中...</Text>
            </div>
          </Tabs.TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default MonitoringManagement;