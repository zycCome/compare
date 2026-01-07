import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  Checkbox,
  Col,
  Form,
  Input,
  message,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography
} from 'antd';
import { SendOutlined } from '@ant-design/icons';
import QueryConditionsPanel, { FieldMetadata, QueryCondition } from '../components/QueryConditionsPanel';
import CronExpressionEditor from '../components/CronExpressionEditor';

const { Title, Text } = Typography;
const { TextArea } = Input;

type FieldArea = 'rows' | 'columns' | 'metrics';

interface ReportFieldSettingItem {
  key: string;
  label: string;
  group?: string;
  area: FieldArea;
  enabled: boolean;
}

interface ReportOption {
  id: string;
  name: string;
  schemeId: string;
}

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

const schemeOptions = [
  { value: 'scheme-001', label: 'Q3 CPU价格回顾' },
  { value: 'scheme-002', label: '华东区供应商协议价分析' },
  { value: 'scheme-003', label: '内存条价格趋势分析' }
];

const reportOptions: ReportOption[] = [
  { id: 'report_001', name: 'CPU价格趋势分析报表', schemeId: 'scheme-001' },
  { id: 'report_002', name: '供应商协议价对比报表', schemeId: 'scheme-002' },
  { id: 'report_003', name: '内存条价格波动报表', schemeId: 'scheme-003' }
];

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

const MonitoringTaskCreateV2: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const schemeId = Form.useWatch('schemeId', form);

  const [activeInputField, setActiveInputField] = useState<'alertTitle' | 'alertContent' | null>(null);

  const [queryConditions, setQueryConditions] = useState<QueryCondition[]>([]);
  const [fieldSettings, setFieldSettings] = useState<ReportFieldSettingItem[]>(defaultFieldSettings);

  const [cronValue, setCronValue] = useState('0 0 10 * * ? *');

  const templateVariables = [
    { key: 'taskName', label: '任务名称' },
    { key: 'alarmLevelName', label: '预警等级' },
    { key: 'hitCount', label: '命中记录数' },
    { key: 'time', label: '触发时间' },
    { key: 'downloadUrl', label: '下载地址' },
    // 去掉比价方案变量
  ];

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

  const handleTestNotification = async () => {
    try {
      const receivers = form.getFieldValue('notificationReceivers') || [];
      const receiverGroups = form.getFieldValue('notificationReceiverGroups') || [];
      const hasReceivers = (Array.isArray(receivers) && receivers.length > 0) || (Array.isArray(receiverGroups) && receiverGroups.length > 0);
      if (!hasReceivers) {
        message.info('请先选择接收用户/接收用户组后再测试发送');
        return;
      }

      await form.validateFields([
        'notificationReceivers',
        'notificationReceiverGroups',
        'notificationChannels',
        'alertNotificationTitle',
        'alertNotificationDescription'
      ]);
      message.success('测试通知已发送（示例，无实际推送）');
    } catch {
      message.error('请先完善通知设置');
    }
  };

  const urlContext = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const reportId = params.get('reportId') || '';
    const reportName = params.get('reportName') ? decodeURIComponent(params.get('reportName') as string) : '';
    const schemeId = params.get('schemeId') || '';
    const solutionId = params.get('solutionId') || '';
    return { reportId, reportName, schemeId, solutionId };
  }, [location.search]);

  const fixedSchemeId = urlContext.solutionId || '';
  const isSchemeLocked = !!fixedSchemeId || !!urlContext.reportId;

  const filteredReports = useMemo(() => {
    if (!schemeId) return reportOptions;
    return reportOptions.filter(r => r.schemeId === schemeId);
  }, [schemeId]);

  useEffect(() => {
    if (urlContext.reportId) {
      form.setFieldsValue({
        sourceReportId: urlContext.reportId,
        sourceReportName: urlContext.reportName || urlContext.reportId,
        schemeId: urlContext.schemeId || undefined,
        taskName: `【${urlContext.reportName || '报表'}】监控任务（新版）`,
        enabled: true,
        cronExpression: cronValue
      });
      return;
    }

    if (fixedSchemeId) {
      form.setFieldsValue({
        schemeId: fixedSchemeId,
        enabled: true,
        cronExpression: cronValue
      });
    } else {
      form.setFieldsValue({ enabled: true, cronExpression: cronValue });
    }
  }, [form, urlContext.reportId, urlContext.reportName, urlContext.schemeId, fixedSchemeId, cronValue]);

  const handleSchemeChange = () => {
    form.setFieldsValue({ sourceReportId: undefined, sourceReportName: undefined });
  };

  const handleReportChange = (reportId: string) => {
    const found = reportOptions.find(r => r.id === reportId);
    form.setFieldsValue({
      sourceReportId: reportId,
      sourceReportName: found?.name || reportId
    });
  };

  const enabledDimensions = useMemo(() => {
    return fieldSettings
      .filter(f => (f.area === 'rows' || f.area === 'columns') && f.enabled)
      .map(f => f.key);
  }, [fieldSettings]);

  const enabledMetrics = useMemo(() => {
    return fieldSettings
      .filter(f => f.area === 'metrics' && f.enabled)
      .map(f => f.key);
  }, [fieldSettings]);

  const saveTask = async () => {
    try {
      const values = await form.validateFields();
      if (!values.schemeId) {
        message.error('请选择比价方案');
        return;
      }
      if (!values.sourceReportId) {
        message.error('请选择报表');
        return;
      }
      if (enabledDimensions.length === 0) {
        message.error('请至少启用 1 个维度');
        return;
      }
      if (enabledMetrics.length === 0) {
        message.error('请至少启用 1 个指标');
        return;
      }

      const payload = {
        taskName: values.taskName,
        severity: values.severity,
        schemeId: values.schemeId,
        sourceReportId: values.sourceReportId,
        sourceReportName: values.sourceReportName,
        enabled: values.enabled,
        cronExpression: values.cronExpression,
        dimensions: enabledDimensions,
        metrics: enabledMetrics,
        queryConditions,
        notificationReceivers: values.notificationReceivers,
        notificationReceiverGroups: values.notificationReceiverGroups,
        notificationChannels: values.notificationChannels,
        alertNotificationTitle: values.alertNotificationTitle,
        alertNotificationDescription: values.alertNotificationDescription
      };

      console.log('MonitoringTaskCreateV2 payload:', payload);
      message.success('监控任务已保存（新版示例，无实际落库）');
      navigate('/monitoring-management');
    } catch {
      message.error('请完善必填项');
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>创建监控任务（新版）</Title>
          <Text type="secondary">选报表后，按“报表设置”方式启用维度/指标；查询条件仍支持配置</Text>
        </div>
        <Space>
          <Button onClick={() => navigate(-1)}>返回</Button>
          <Button type="primary" onClick={saveTask}>保存任务</Button>
        </Space>
      </div>

      <Form form={form} layout="vertical">
        <Card title="基本信息" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="taskName"
                label="任务名称"
                rules={[{ required: true, message: '请填写任务名称' }]}
              >
                <Input placeholder="如：供应价差监控（新版）" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="severity"
                label="预警等级"
                rules={[{ required: true, message: '请选择预警等级' }]}
                initialValue="medium"
              >
                <Select
                  placeholder="选择预警等级"
                  options={[
                    { value: 'low', label: '提示' },
                    { value: 'medium', label: '重要' },
                    { value: 'high', label: '严重' },
                    { value: 'critical', label: '紧急' }
                  ]}
                />
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
                  options={schemeOptions}
                  onChange={handleSchemeChange}
                  disabled={isSchemeLocked}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="sourceReportId"
                label="比价报表"
                rules={[{ required: true, message: '请选择比价报表' }]}
              >
                <Select
                  placeholder={schemeId ? '选择比价报表' : '请先选择比价方案'}
                  onChange={handleReportChange}
                  disabled={!!urlContext.reportId || !schemeId}
                  options={filteredReports.map(r => ({ value: r.id, label: r.name }))}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
              <Form.Item name="sourceReportName" hidden>
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="enabled" label="任务状态" valuePropName="checked" initialValue={true}>
                <Switch checkedChildren="启用" unCheckedChildren="停用" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card title="监控范围（查询条件）" style={{ marginBottom: 16 }}>
          <QueryConditionsPanel
            conditions={queryConditions}
            onConditionsChange={setQueryConditions}
            availableFields={availableFields}
            predefinedConditions={[]}
          />
        </Card>

        <Card
          title="维度/指标启用（类似报表设置）"
          style={{ marginBottom: 16 }}
          bodyStyle={{ padding: 12 }}
        >
          <div style={{ display: 'flex', gap: 16 }}>
            {([
              { title: '行维度', area: 'rows' as const },
              { title: '列维度', area: 'columns' as const },
              { title: '指标', area: 'metrics' as const }
            ] as const).map(block => {
              const data = fieldSettings.filter(f => f.area === block.area);
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
                  <div style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
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
                                setFieldSettings(prev =>
                                  prev.map(x => (x.key === record.key ? { ...x, enabled: checked } : x))
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

          <div style={{ marginTop: 12 }}>
            <Text type="secondary">
              已启用：维度 {enabledDimensions.length} 个；指标 {enabledMetrics.length} 个
            </Text>
          </div>
        </Card>

        <Card title="调度设置" style={{ marginBottom: 16 }}>
          <Form.Item
            name="cronExpression"
            label="定时规则"
            rules={[{ required: true, message: '请配置定时规则' }]}
          >
            <Input
              placeholder="Cron 表达式"
              value={cronValue}
              readOnly
              style={{ marginBottom: 16 }}
            />
          </Form.Item>
          <div style={{ border: '1px solid #d9d9d9', borderRadius: 4, padding: 16, background: '#fafafa' }}>
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

          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.notificationReceivers !== cur.notificationReceivers || prev.notificationReceiverGroups !== cur.notificationReceiverGroups}>
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
    </div>
  );
};

export default MonitoringTaskCreateV2;
