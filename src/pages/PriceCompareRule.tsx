import React, { useState } from 'react';
import {
  Card, 
  Button, 
  Input, 
  Select, 
  Tag, 
  Modal, 
  Form, 
  Space, 
  Table, 
  Alert, 
  Typography, 
  message,
  Row,
  Col,
  Popconfirm,
  Switch,
  Divider,
  Empty,
  Steps,
  Radio,
  InputNumber,
  Tabs
} from 'antd';

import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Save,
  Eye,
  ArrowLeft
} from 'lucide-react';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Step } = Steps;
const { TabPane } = Tabs;

// 比价规则接口
interface PriceRule {
  id: string;
  ruleSetName: string;
  ruleSetCode: string;
  tags: string[];
  description?: string;
  enabled: boolean;
  rules: RuleDetail[];
  scoreAggregate?: string;
  status: 'DRAFT' | 'SAVED' | 'PUBLISHED';
  createdAt: string;
  updatedAt: string;
}

// 规则明细接口
interface RuleDetail {
  id: string;
  type: 'control' | 'score';
  name: string;
  // 控制型规则字段
  expr?: string;
  action?: 'warn' | 'error' | 'exclude' | 'mark';
  style?: { color?: string };
  notify?: { messageTemplateId?: string; flowId?: string };
  // 评分型规则字段
  factor?: string;
  weight?: number;
  scoreExpr?: string;
}

const PriceCompareRule: React.FC = () => {
  // 状态管理
  const [rules, setRules] = useState<PriceRule[]>([
    {
      id: '1',
      ruleSetName: '默认供应商比价规则集',
      ruleSetCode: 'rule_vendor_compare_default',
      tags: ['控制型', '评分型'],
      description: '价格差异预警+多因子评分',
      enabled: true,
      rules: [
        {
          id: 'r1',
          type: 'control',
          name: '高于历史最低10%预警',
          expr: 'ind_diff_rate > 0.10',
          action: 'warn',
          style: { color: 'red' },
          notify: { messageTemplateId: 'msg_tpl_over_10' }
        },
        {
          id: 'r2',
          type: 'score',
          name: '价格因子得分',
          factor: 'ind_diff_rate',
          weight: 0.6,
          scoreExpr: 'MAX(0, 100 - ind_diff_rate * 100)'
        },
        {
          id: 'r3',
          type: 'score',
          name: '供应商评级因子',
          factor: 'vendor_score',
          weight: 0.4,
          scoreExpr: 'vendor_score'
        }
      ],
      scoreAggregate: 'SUM(weights * factorScores)',
      status: 'PUBLISHED',
      createdAt: '2024-01-15 10:30:00',
      updatedAt: '2024-01-15 10:30:00'
    }
  ]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<PriceRule | null>(null);
  const [searchText, setSearchText] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [ruleDetailForm] = Form.useForm();
  const [currentRules, setCurrentRules] = useState<RuleDetail[]>([]);
  const [editingRuleDetail, setEditingRuleDetail] = useState<RuleDetail | null>(null);
  const [ruleDetailModalVisible, setRuleDetailModalVisible] = useState(false);

  // 可用字段/指标（模拟数据）
  const availableFields = [
    { code: 'ind_diff_rate', name: '价格差异率', type: 'metric' },
    { code: 'vendor_id', name: '供应商ID', type: 'dimension' },
    { code: 'vendor_score', name: '供应商评分', type: 'metric' },
    { code: 'purchase_amount', name: '采购金额', type: 'metric' },
    { code: 'quality_score', name: '质量评分', type: 'metric' }
  ];

  // 新建规则
  const handleCreate = () => {
    setEditingRule(null);
    setCurrentRules([]);
    setCurrentStep(0);
    form.resetFields();
    setIsModalVisible(true);
  };

  // 编辑规则
  const handleEdit = (rule: PriceRule) => {
    setEditingRule(rule);
    setCurrentRules([...rule.rules]);
    setCurrentStep(0);
    form.setFieldsValue({
      ruleSetName: rule.ruleSetName,
      ruleSetCode: rule.ruleSetCode,
      tags: rule.tags,
      description: rule.description,
      enabled: rule.enabled,
      scoreAggregate: rule.scoreAggregate
    });
    setIsModalVisible(true);
  };

  // 删除规则
  const handleDelete = (id: string) => {
    setRules(prev => prev.filter(rule => rule.id !== id));
    message.success('删除成功');
  };

  // 保存规则
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      const newRule: PriceRule = {
        id: editingRule?.id || Date.now().toString(),
        ruleSetName: values.ruleSetName,
        ruleSetCode: values.ruleSetCode || `rule_${values.ruleSetName.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`,
        tags: values.tags || [],
        description: values.description,
        enabled: values.enabled !== false,
        rules: currentRules,
        scoreAggregate: values.scoreAggregate || 'SUM(weights * factorScores)',
        status: 'SAVED',
        createdAt: editingRule?.createdAt || new Date().toLocaleString(),
        updatedAt: new Date().toLocaleString()
      };

      if (editingRule) {
        setRules(prev => prev.map(rule => rule.id === editingRule.id ? newRule : rule));
        message.success('更新成功');
      } else {
        setRules(prev => [...prev, newRule]);
        message.success('创建成功');
      }

      setIsModalVisible(false);
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  // 添加规则明细
  const handleAddRuleDetail = () => {
    setEditingRuleDetail(null);
    ruleDetailForm.resetFields();
    setRuleDetailModalVisible(true);
  };

  // 编辑规则明细
  const handleEditRuleDetail = (ruleDetail: RuleDetail) => {
    setEditingRuleDetail(ruleDetail);
    ruleDetailForm.setFieldsValue(ruleDetail);
    setRuleDetailModalVisible(true);
  };

  // 保存规则明细
  const handleSaveRuleDetail = async () => {
    try {
      const values = await ruleDetailForm.validateFields();
      
      const newRuleDetail: RuleDetail = {
        id: editingRuleDetail?.id || `rule_${Date.now()}`,
        ...values
      };

      if (editingRuleDetail) {
        setCurrentRules(prev => prev.map(rule => rule.id === editingRuleDetail.id ? newRuleDetail : rule));
      } else {
        setCurrentRules(prev => [...prev, newRuleDetail]);
      }

      setRuleDetailModalVisible(false);
      message.success('规则明细保存成功');
    } catch (error) {
      console.error('保存规则明细失败:', error);
    }
  };

  // 删除规则明细
  const handleDeleteRuleDetail = (id: string) => {
    setCurrentRules(prev => prev.filter(rule => rule.id !== id));
    message.success('删除成功');
  };

  // 过滤规则
  const filteredRules = rules.filter(rule => 
    rule.ruleSetName.toLowerCase().includes(searchText.toLowerCase()) ||
    rule.ruleSetCode.toLowerCase().includes(searchText.toLowerCase())
  );

  // 规则列表表格列定义
  const columns = [
    {
      title: '规则集编码',
      dataIndex: 'ruleSetCode',
      key: 'ruleSetCode',
      width: 200,
    },
    {
      title: '规则集名称',
      dataIndex: 'ruleSetName',
      key: 'ruleSetName',
      width: 200,
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 150,
      render: (tags: string[]) => (
        <>
          {tags.map(tag => (
            <Tag key={tag} color={tag === '控制型' ? 'blue' : 'green'}>
              {tag}
            </Tag>
          ))}
        </>
      ),
    },
    {
      title: '规则数量',
      dataIndex: 'rules',
      key: 'rulesCount',
      width: 100,
      render: (rules: RuleDetail[]) => rules.length,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap = {
          'DRAFT': { color: 'default', text: '草稿' },
          'SAVED': { color: 'processing', text: '已保存' },
          'PUBLISHED': { color: 'success', text: '已发布' }
        };
        const config = statusMap[status as keyof typeof statusMap];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '启用状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 100,
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'green' : 'red'}>
          {enabled ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: PriceRule) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<Edit className="w-4 h-4" />} 
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个规则集吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              type="link" 
              danger 
              icon={<Trash2 className="w-4 h-4" />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 规则明细表格列定义
  const ruleDetailColumns = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => (
        <Tag color={type === 'control' ? 'blue' : 'green'}>
          {type === 'control' ? '控制型' : '评分型'}
        </Tag>
      ),
    },
    {
      title: '表达式/因子',
      key: 'expression',
      width: 200,
      render: (_: any, record: RuleDetail) => (
        <Text code>{record.type === 'control' ? record.expr : record.factor}</Text>
      ),
    },
    {
      title: '动作/权重',
      key: 'actionOrWeight',
      width: 120,
      render: (_: any, record: RuleDetail) => (
        record.type === 'control' ? 
          <Tag color="orange">{record.action}</Tag> : 
          <Text>{record.weight}</Text>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: RuleDetail) => (
        <Space size="small">
          <Button 
            type="link" 
            size="small"
            icon={<Edit className="w-3 h-3" />} 
            onClick={() => handleEditRuleDetail(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个规则吗？"
            onConfirm={() => handleDeleteRuleDetail(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              type="link" 
              size="small"
              danger 
              icon={<Trash2 className="w-3 h-3" />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 步骤内容渲染
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // 基本信息
        return (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="规则集名称"
                  name="ruleSetName"
                  rules={[{ required: true, message: '请输入规则集名称' }]}
                >
                  <Input placeholder="请输入规则集名称" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="规则集编码"
                  name="ruleSetCode"
                >
                  <Input placeholder="系统自动生成" disabled />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="标签"
                  name="tags"
                >
                  <Select
                    mode="tags"
                    placeholder="请选择或输入标签"
                    options={[
                      { value: '控制型', label: '控制型' },
                      { value: '评分型', label: '评分型' },
                      { value: '价格监控', label: '价格监控' },
                      { value: '供应商管理', label: '供应商管理' }
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="启用"
                  name="enabled"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              label="描述"
              name="description"
            >
              <TextArea rows={3} placeholder="请输入规则集描述" />
            </Form.Item>
          </div>
        );
      
      case 1: // 变量来源
        return (
          <div>
            <Alert
              message="变量来源说明"
              description="可用指标/字段来自方案执行时传入的数据列，如 ind_diff_rate、vendor_id 等"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Table
              columns={[
                { title: '字段编码', dataIndex: 'code', key: 'code' },
                { title: '字段名称', dataIndex: 'name', key: 'name' },
                { title: '类型', dataIndex: 'type', key: 'type', render: (type: string) => (
                  <Tag color={type === 'dimension' ? 'blue' : 'green'}>
                    {type === 'dimension' ? '维度' : '指标'}
                  </Tag>
                )}
              ]}
              dataSource={availableFields}
              rowKey="code"
              pagination={false}
              size="small"
            />
          </div>
        );
      
      case 2: // 规则明细
        return (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Button 
                type="primary" 
                icon={<Plus className="w-4 h-4" />} 
                onClick={handleAddRuleDetail}
              >
                新增规则
              </Button>
            </div>
            <Table
              columns={ruleDetailColumns}
              dataSource={currentRules}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </div>
        );
      
      case 3: // 评分聚合
        return (
          <div>
            <Alert
              message="评分聚合配置"
              description="配置多个评分型规则的聚合方式"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Form.Item
              label="总分计算公式"
              name="scoreAggregate"
              rules={[{ required: true, message: '请输入总分计算公式' }]}
            >
              <Select
                placeholder="请选择或输入总分计算公式"
                options={[
                  { value: 'SUM(weights * factorScores)', label: 'SUM(weights * factorScores) - 加权求和' },
                  { value: 'AVG(factorScores)', label: 'AVG(factorScores) - 平均值' },
                  { value: 'MAX(factorScores)', label: 'MAX(factorScores) - 最大值' },
                  { value: 'MIN(factorScores)', label: 'MIN(factorScores) - 最小值' }
                ]}
                showSearch
                allowClear
              />
            </Form.Item>
            
            {/* 显示当前评分型规则 */}
            {currentRules.filter(rule => rule.type === 'score').length > 0 && (
              <div>
                <Divider>当前评分型规则</Divider>
                <Table
                  columns={[
                    { title: '规则名称', dataIndex: 'name', key: 'name' },
                    { title: '因子', dataIndex: 'factor', key: 'factor' },
                    { title: '权重', dataIndex: 'weight', key: 'weight' },
                    { title: '得分表达式', dataIndex: 'scoreExpr', key: 'scoreExpr', render: (text: string) => <Text code>{text}</Text> }
                  ]}
                  dataSource={currentRules.filter(rule => rule.type === 'score')}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* 页面标题和操作栏 */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>比价规则管理</Title>
          <Space>
            <Input
              placeholder="搜索规则集名称或编码"
              prefix={<Search className="w-4 h-4" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
            />
            <Button type="primary" icon={<Plus className="w-4 h-4" />} onClick={handleCreate}>
              新建规则集
            </Button>
          </Space>
        </div>
      </Card>

      {/* 规则列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredRules}
          rowKey="id"
          pagination={{
            total: filteredRules.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      {/* 新建/编辑规则集弹窗 */}
      <Modal
        title={editingRule ? '编辑比价规则集' : '新建比价规则集'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        width={1000}
        footer={[
          <Button key="back" onClick={() => setIsModalVisible(false)}>
            取消
          </Button>,
          <Button key="prev" disabled={currentStep === 0} onClick={() => setCurrentStep(currentStep - 1)}>
            上一步
          </Button>,
          <Button key="next" disabled={currentStep === 3} type="primary" onClick={() => setCurrentStep(currentStep + 1)}>
            下一步
          </Button>,
          <Button key="save" type="primary" icon={<Save className="w-4 h-4" />} onClick={handleSave}>
            保存
          </Button>,
        ]}
      >
        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          <Step title="基本信息" />
          <Step title="变量来源" />
          <Step title="规则明细" />
          <Step title="评分聚合" />
        </Steps>
        
        <Form form={form} layout="vertical">
          {renderStepContent()}
        </Form>
      </Modal>

      {/* 规则明细编辑弹窗 */}
      <Modal
        title={editingRuleDetail ? '编辑规则明细' : '新增规则明细'}
        open={ruleDetailModalVisible}
        onCancel={() => setRuleDetailModalVisible(false)}
        onOk={handleSaveRuleDetail}
        width={600}
      >
        <Form form={ruleDetailForm} layout="vertical">
          <Form.Item
            label="规则名称"
            name="name"
            rules={[{ required: true, message: '请输入规则名称' }]}
          >
            <Input placeholder="请输入规则名称" />
          </Form.Item>
          
          <Form.Item
            label="规则类型"
            name="type"
            rules={[{ required: true, message: '请选择规则类型' }]}
          >
            <Radio.Group>
              <Radio value="control">控制型（阈值/布尔命中 → 触发动作）</Radio>
              <Radio value="score">评分型（多因子加权）</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}>
            {({ getFieldValue }) => {
              const ruleType = getFieldValue('type');
              
              if (ruleType === 'control') {
                return (
                  <>
                    <Form.Item
                      label="条件表达式"
                      name="expr"
                      rules={[{ required: true, message: '请输入条件表达式' }]}
                    >
                      <Input placeholder="如: ind_diff_rate > 0.10" />
                    </Form.Item>
                    
                    <Form.Item
                      label="动作"
                      name="action"
                      rules={[{ required: true, message: '请选择动作' }]}
                    >
                      <Select placeholder="请选择动作">
                        <Select.Option value="warn">warn - 警告</Select.Option>
                        <Select.Option value="error">error - 错误</Select.Option>
                        <Select.Option value="exclude">exclude - 排除</Select.Option>
                        <Select.Option value="mark">mark - 标记</Select.Option>
                      </Select>
                    </Form.Item>
                    
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item label="消息模板ID" name={['notify', 'messageTemplateId']}>
                          <Input placeholder="消息模板ID" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="审批流程ID" name={['notify', 'flowId']}>
                          <Input placeholder="审批流程ID" />
                        </Form.Item>
                      </Col>
                    </Row>
                    
                    <Form.Item label="颜色标记" name={['style', 'color']}>
                      <Select placeholder="请选择颜色">
                        <Select.Option value="red">红色</Select.Option>
                        <Select.Option value="orange">橙色</Select.Option>
                        <Select.Option value="yellow">黄色</Select.Option>
                        <Select.Option value="green">绿色</Select.Option>
                        <Select.Option value="blue">蓝色</Select.Option>
                      </Select>
                    </Form.Item>
                  </>
                );
              } else if (ruleType === 'score') {
                return (
                  <>
                    <Form.Item
                      label="因子"
                      name="factor"
                      rules={[{ required: true, message: '请选择因子' }]}
                    >
                      <Select placeholder="请选择因子">
                        {availableFields.filter(field => field.type === 'metric').map(field => (
                          <Select.Option key={field.code} value={field.code}>
                            {field.name} ({field.code})
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                    
                    <Form.Item
                      label="权重"
                      name="weight"
                      rules={[{ required: true, message: '请输入权重' }]}
                    >
                      <InputNumber
                        min={0}
                        max={1}
                        step={0.1}
                        placeholder="0.0 - 1.0"
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                    
                    <Form.Item
                      label="得分表达式"
                      name="scoreExpr"
                      rules={[{ required: true, message: '请输入得分表达式' }]}
                    >
                      <Input placeholder="如: MAX(0, 100 - ind_diff_rate*100)" />
                    </Form.Item>
                  </>
                );
              }
              
              return null;
            }}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PriceCompareRule;