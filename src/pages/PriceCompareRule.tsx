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
  Tabs,
  Radio,
  InputNumber,
  Checkbox,
  TreeSelect,
  Slider,
  Steps,
  Progress,
  Collapse
} from 'antd';

import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Save,
  Eye,
  Settings,
  Target,
  Calculator,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Option } = Select;
const { Step } = Steps;
const { Panel } = Collapse;

// 比价规则接口
interface PriceRule {
  id: string;
  ruleId: string;
  name: string;
  description?: string;
  tags: string[];
  modelRef: string; // 引用的比价模型ID
  ruleType: 'control' | 'score';
  conditions: RuleCondition[];
  scoringFactors: ScoringFactor[];
  applyScope: {
    orgs: string[];
    datasetFilter?: {
      field: string;
      operator: string;
      value: any;
    };
  };
  enabled: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// 规则条件接口（控制型）
interface RuleCondition {
  id: string;
  indicatorId: string;
  operator: '>' | '<' | '=' | '!=' | 'BETWEEN' | 'IN';
  value: any;
  unit?: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
}

// 评分因子接口（评分型）
interface ScoringFactor {
  id: string;
  indicatorId: string;
  weight: number;
  scoreMode: 'range' | 'formula';
  rangeConfig?: {
    ranges: { min: number; max: number; score: number; minInclusive?: boolean; maxInclusive?: boolean }[];
    monotonic?: 'asc' | 'desc' | 'none';
  };
  formulaConfig?: {
    formula: string;
    params?: Record<string, number>;
  };
  onNull: 'skip' | 'zero' | 'custom';
  customNullScore?: number;
  fromLibrary?: string; // 来自因子库的ID
}

// 因子库接口
interface FactorLibraryItem {
  id: string;
  name: string;
  category: 'price' | 'history' | 'supply' | 'quality' | 'brand';
  unit: string;
  defaultWeight: number;
  defaultMode: 'range' | 'formula';
  defaultRanges?: { min: number; max: number; score: number; minInclusive?: boolean; maxInclusive?: boolean }[];
  defaultFormula?: string;
  description: string;
}

// 公式库接口
interface FormulaTemplate {
  id: string;
  name: string;
  formula: string;
  description: string;
  params?: string[];
  example: string;
}

// 可用指标接口
interface AvailableIndicator {
  id: string;
  name: string;
  type: 'atomic' | 'baseline' | 'calculation';
  dataType: 'number' | 'string' | 'boolean';
  unit?: string;
}

// 比价模型接口
interface PriceModel {
  id: string;
  name: string;
  indicators: AvailableIndicator[];
}

const PriceCompareRule: React.FC = () => {
  // 状态管理
  const [rules, setRules] = useState<PriceRule[]>([
    {
      id: '1',
      ruleId: 'rule_price_warning',
      name: '价格预警规则',
      description: '当差异率或差异额超过设定值时进行预警或打分',
      tags: ['预警', '评分'],
      modelRef: 'mdl_vendor_price_compare',
      ruleType: 'control',
      conditions: [
        {
          id: 'c1',
          indicatorId: 'ind_diff_rate',
          operator: '>',
          value: 0.1,
          unit: 'percent',
          message: '价格偏高',
          severity: 'high'
        }
      ],
      scoringFactors: [],
      applyScope: {
        orgs: ['org001', 'org002'],
        datasetFilter: {
          field: 'purchase_mode',
          operator: '=',
          value: '集中采购'
        }
      },
      enabled: true,
      createdBy: 'user001',
      createdAt: '2025-01-15 10:30:00',
      updatedAt: '2025-01-15 10:30:00'
    }
  ]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<PriceRule | null>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('basic');
  const [currentConditions, setCurrentConditions] = useState<RuleCondition[]>([]);
  const [currentScoringFactors, setCurrentScoringFactors] = useState<ScoringFactor[]>([]);
  const [conditionModalVisible, setConditionModalVisible] = useState(false);
  const [scoringModalVisible, setScoringModalVisible] = useState(false);
  const [editingCondition, setEditingCondition] = useState<RuleCondition | null>(null);
  const [editingScoringFactor, setEditingScoringFactor] = useState<ScoringFactor | null>(null);
  const [conditionForm] = Form.useForm();
  const [scoringForm] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [ruleType, setRuleType] = useState<'control' | 'score'>('control');
  const [autoNormalizeWeight, setAutoNormalizeWeight] = useState(true);
  const [selectedFactorLibrary, setSelectedFactorLibrary] = useState<string>('');

  // 步骤定义
  const steps = [
    { title: '基本信息', description: '规则名称、描述等基础信息' },
    { title: '模型引用', description: '选择关联的比价模型' },
    { title: '规则配置', description: '配置控制型或评分型规则' },
    { title: '应用范围', description: '设置规则应用范围' }
  ];

  // 步骤导航函数
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingRule(null);
    setCurrentStep(0);
    setRuleType('control');
    form.resetFields();
  };

  // 模拟数据：可用的比价模型
  const availableModels: PriceModel[] = [
    {
      id: 'mdl_vendor_price_compare',
      name: '供应商价格对比模型',
      indicators: [
        { id: 'ind_agreement_price', name: '协议价', type: 'atomic', dataType: 'number', unit: 'CNY' },
        { id: 'ind_hist_min', name: '历史最低价', type: 'baseline', dataType: 'number', unit: 'CNY' },
        { id: 'ind_diff_rate', name: '差异率', type: 'calculation', dataType: 'number', unit: '%' },
        { id: 'ind_diff_amount', name: '差异额', type: 'calculation', dataType: 'number', unit: 'CNY' }
      ]
    }
  ];

  // 因子库数据
  const factorLibrary: FactorLibraryItem[] = [
    {
      id: 'factor_price_diff_rate',
      name: '价格差异率',
      category: 'price',
      unit: '%',
      defaultWeight: 0.3,
      defaultMode: 'range',
      defaultRanges: [
        { min: 0, max: 0.05, score: 100, minInclusive: true, maxInclusive: false },
        { min: 0.05, max: 0.1, score: 80, minInclusive: true, maxInclusive: false },
        { min: 0.1, max: 0.2, score: 60, minInclusive: true, maxInclusive: false },
        { min: 0.2, max: 999, score: 0, minInclusive: true, maxInclusive: false }
      ],
      description: '当前价格与基准价格的差异率'
    },
    {
      id: 'factor_hist_stability',
      name: '历史价格稳定性',
      category: 'history',
      unit: '分',
      defaultWeight: 0.2,
      defaultMode: 'formula',
      defaultFormula: '100 - (价格波动率 * 100)',
      description: '基于历史价格波动计算的稳定性评分'
    },
    {
      id: 'factor_supply_reliability',
      name: '供应可靠性',
      category: 'supply',
      unit: '分',
      defaultWeight: 0.25,
      defaultMode: 'range',
      defaultRanges: [
        { min: 0.9, max: 1, score: 100, minInclusive: true, maxInclusive: true },
        { min: 0.8, max: 0.9, score: 80, minInclusive: true, maxInclusive: false },
        { min: 0.7, max: 0.8, score: 60, minInclusive: true, maxInclusive: false },
        { min: 0, max: 0.7, score: 40, minInclusive: true, maxInclusive: false }
      ],
      description: '供应商的交付可靠性评分'
    },
    {
      id: 'factor_quality_score',
      name: '质量评分',
      category: 'quality',
      unit: '分',
      defaultWeight: 0.15,
      defaultMode: 'range',
      defaultRanges: [
        { min: 90, max: 100, score: 100, minInclusive: true, maxInclusive: true },
        { min: 80, max: 90, score: 80, minInclusive: true, maxInclusive: false },
        { min: 70, max: 80, score: 60, minInclusive: true, maxInclusive: false },
        { min: 0, max: 70, score: 20, minInclusive: true, maxInclusive: false }
      ],
      description: '产品质量综合评分'
    },
    {
      id: 'factor_brand_premium',
      name: '品牌溢价',
      category: 'brand',
      unit: '%',
      defaultWeight: 0.1,
      defaultMode: 'formula',
      defaultFormula: 'MAX(0, 100 - (品牌溢价率 * 200))',
      description: '品牌溢价对评分的影响'
    }
  ];

  // 公式库数据
  const formulaTemplates: FormulaTemplate[] = [
    {
      id: 'formula_linear_decrease',
      name: '线性递减',
      formula: 'MAX(0, {maxScore} - ({value} - {minValue}) * {slope})',
      description: '随着数值增加，分数线性递减',
      params: ['maxScore', 'minValue', 'slope'],
      example: 'MAX(0, 100 - (差异率 - 0) * 500)'
    },
    {
      id: 'formula_exponential_decay',
      name: '指数衰减',
      formula: '{maxScore} * EXP(-{decayRate} * {value})',
      description: '随着数值增加，分数指数衰减',
      params: ['maxScore', 'decayRate'],
      example: '100 * EXP(-2 * 差异率)'
    },
    {
      id: 'formula_sigmoid',
      name: 'S型曲线',
      formula: '{maxScore} / (1 + EXP({steepness} * ({value} - {midpoint})))',
      description: 'S型曲线评分，适合有明确阈值的场景',
      params: ['maxScore', 'steepness', 'midpoint'],
      example: '100 / (1 + EXP(10 * (差异率 - 0.1)))'
    },
    {
      id: 'formula_threshold',
      name: '阈值函数',
      formula: 'IF({value} <= {threshold}, {highScore}, {lowScore})',
      description: '基于阈值的二元评分',
      params: ['threshold', 'highScore', 'lowScore'],
      example: 'IF(差异率 <= 0.05, 100, 50)'
    }
  ];

  // 组织树数据
  const orgTreeData = [
    {
      title: '总公司',
      value: 'org001',
      children: [
        { title: '采购部', value: 'org001_001' },
        { title: '财务部', value: 'org001_002' }
      ]
    },
    {
      title: '分公司A',
      value: 'org002',
      children: [
        { title: '采购部A', value: 'org002_001' }
      ]
    }
  ];

  // 获取当前选中模型的指标
  const getCurrentModelIndicators = (): AvailableIndicator[] => {
    const modelRef = form.getFieldValue('modelRef');
    const model = availableModels.find(m => m.id === modelRef);
    return model?.indicators || [];
  };

  // 新建规则
  const handleCreate = () => {
    setEditingRule(null);
    setCurrentConditions([]);
    setCurrentScoringFactors([]);
    setActiveTab('basic');
    form.resetFields();
    setIsModalVisible(true);
  };

  // 编辑规则
  const handleEdit = (rule: PriceRule) => {
    setEditingRule(rule);
    setCurrentConditions([...rule.conditions]);
    setCurrentScoringFactors([...rule.scoringFactors]);
    setActiveTab('basic');
    form.setFieldsValue({
      ruleId: rule.ruleId,
      name: rule.name,
      description: rule.description,
      tags: rule.tags,
      modelRef: rule.modelRef,
      ruleType: rule.ruleType,
      enabled: rule.enabled,
      applyScope: rule.applyScope
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
        ruleId: values.ruleId || `rule_${values.name.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`,
        name: values.name,
        description: values.description,
        tags: values.tags || [],
        modelRef: values.modelRef,
        ruleType: values.ruleType,
        conditions: currentConditions,
        scoringFactors: currentScoringFactors,
        applyScope: values.applyScope || { orgs: [] },
        enabled: values.enabled !== false,
        createdBy: 'current_user',
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

      handleCancel();
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  // 添加条件
  const handleAddCondition = () => {
    setEditingCondition(null);
    conditionForm.resetFields();
    setConditionModalVisible(true);
  };

  // 编辑条件
  const handleEditCondition = (condition: RuleCondition) => {
    setEditingCondition(condition);
    conditionForm.setFieldsValue(condition);
    setConditionModalVisible(true);
  };

  // 保存条件
  const handleSaveCondition = async () => {
    try {
      const values = await conditionForm.validateFields();
      const newCondition: RuleCondition = {
        id: editingCondition?.id || `condition_${Date.now()}`,
        ...values
      };

      if (editingCondition) {
        setCurrentConditions(prev => prev.map(c => c.id === editingCondition.id ? newCondition : c));
      } else {
        setCurrentConditions(prev => [...prev, newCondition]);
      }

      setConditionModalVisible(false);
      message.success('条件保存成功');
    } catch (error) {
      console.error('保存条件失败:', error);
    }
  };

  // 删除条件
  const handleDeleteCondition = (id: string) => {
    setCurrentConditions(prev => prev.filter(c => c.id !== id));
    message.success('删除成功');
  };

  // 权重归一化函数
  const normalizeWeights = (factors: ScoringFactor[]) => {
    const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
    if (totalWeight === 0) return factors;
    
    return factors.map(f => ({
      ...f,
      weight: f.weight / totalWeight
    }));
  };

  // 处理评分因子相关操作
  const handleAddScoringFactor = () => {
    setEditingScoringFactor(null);
    scoringForm.resetFields();
    setScoringModalVisible(true);
  };

  // 编辑评分因子
  const handleEditScoringFactor = (factor: ScoringFactor) => {
    setEditingScoringFactor(factor);
    scoringForm.setFieldsValue(factor);
    setScoringModalVisible(true);
  };

  // 保存评分因子
  const handleSaveScoringFactor = async () => {
    try {
      const values = await scoringForm.validateFields();
      const newFactor: ScoringFactor = {
        id: editingScoringFactor?.id || `factor_${Date.now()}`,
        ...values
      };

      let updatedFactors;
      if (editingScoringFactor) {
        updatedFactors = currentScoringFactors.map(f => f.id === editingScoringFactor.id ? newFactor : f);
      } else {
        updatedFactors = [...currentScoringFactors, newFactor];
      }
      
      // 如果启用了自动权重归一化
      if (autoNormalizeWeight) {
        updatedFactors = normalizeWeights(updatedFactors);
      }
      
      setCurrentScoringFactors(updatedFactors);
      setScoringModalVisible(false);
      message.success('评分因子保存成功');
    } catch (error) {
      console.error('保存评分因子失败:', error);
    }
  };

  // 删除评分因子
  const handleDeleteScoringFactor = (id: string) => {
    setCurrentScoringFactors(prev => prev.filter(f => f.id !== id));
    message.success('删除成功');
  };

  // 步骤内容渲染函数
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // 基本信息
        return (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="ruleId"
                  label="规则ID"
                  rules={[{ required: true, message: '请输入规则ID' }]}
                >
                  <Input placeholder="rule_price_warning" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="规则名称"
                  rules={[{ required: true, message: '请输入规则名称' }]}
                >
                  <Input placeholder="价格预警规则" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="description" label="规则描述">
              <TextArea rows={3} placeholder="当差异率或差异额超过设定值时进行预警或打分" />
            </Form.Item>
            <Form.Item name="tags" label="标签">
              <Select mode="tags" placeholder="添加标签">
                <Option value="预警">预警</Option>
                <Option value="评分">评分</Option>
                <Option value="过滤">过滤</Option>
              </Select>
            </Form.Item>
          </div>
        );

      case 1: // 模型引用
        return (
          <div>
            <Form.Item
              name="modelRef"
              label="选择比价模型"
              rules={[{ required: true, message: '请选择比价模型' }]}
            >
              <Select placeholder="请选择比价模型">
                {availableModels.map(model => (
                  <Option key={model.id} value={model.id}>
                    {model.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Alert
              message="模型绑定说明"
              description="绑定模型后，可获取模型的原子指标、基准指标、计算指标用于规则配置"
              type="info"
              showIcon
              style={{ marginTop: 16 }}
            />
          </div>
        );

      case 2: // 规则配置
        return (
          <div>
            <Form.Item
              name="ruleType"
              label="规则类型"
              rules={[{ required: true, message: '请选择规则类型' }]}
            >
              <Radio.Group
                value={ruleType}
                onChange={(e) => setRuleType(e.target.value)}
              >
                <Radio value="control">控制型（预警/过滤）</Radio>
                <Radio value="score">评分型（打分/加权）</Radio>
              </Radio.Group>
            </Form.Item>

            {ruleType === 'control' && (
              <div>
                <Divider>规则条件配置</Divider>
                <div style={{ marginBottom: 16 }}>
                  <Button
                    type="dashed"
                    icon={<Plus className="w-4 h-4" />}
                    onClick={handleAddCondition}
                  >
                    添加条件
                  </Button>
                </div>
                <Table
                  dataSource={currentConditions}
                  columns={conditionColumns}
                  rowKey="id"
                  size="small"
                  pagination={false}
                />
              </div>
            )}

            {ruleType === 'score' && (
              <div>
                <Divider>评分因子配置</Divider>
                 
                 {/* 因子库展示 */}
                 <Collapse style={{ marginBottom: 16 }}>
                   <Panel header="📚 因子库" key="factor-library">
                     <Row gutter={[16, 16]}>
                       {factorLibrary.map(factor => (
                         <Col span={8} key={factor.id}>
                           <Card 
                             size="small" 
                             title={factor.name}
                             extra={
                               <Button 
                                 type="link" 
                                 size="small"
                                 onClick={() => {
                                   const newScoringFactor: ScoringFactor = {
                                     id: `scoring_${Date.now()}`,
                                     indicatorId: factor.id,
                                     weight: factor.defaultWeight,
                                     scoreMode: factor.defaultMode,
                                     rangeConfig: factor.defaultRanges ? {
                                       ranges: factor.defaultRanges,
                                       monotonic: 'desc'
                                     } : undefined,
                                     formulaConfig: factor.defaultFormula ? {
                                       formula: factor.defaultFormula
                                     } : undefined,
                                     onNull: 'skip',
                                     fromLibrary: factor.id
                                   };
                                   setCurrentScoringFactors([...currentScoringFactors, newScoringFactor]);
                                   message.success(`已添加因子: ${factor.name}`);
                                 }}
                               >
                                 添加
                               </Button>
                             }
                           >
                             <div style={{ fontSize: '12px' }}>
                               <div><strong>类别:</strong> {factor.category}</div>
                               <div><strong>单位:</strong> {factor.unit}</div>
                               <div><strong>默认权重:</strong> {(factor.defaultWeight * 100).toFixed(1)}%</div>
                               <div><strong>评分方式:</strong> {factor.defaultMode === 'range' ? '区间评分' : '公式评分'}</div>
                               <div style={{ marginTop: 4, color: '#666' }}>{factor.description}</div>
                             </div>
                           </Card>
                         </Col>
                       ))}
                     </Row>
                   </Panel>
                 </Collapse>
                <div style={{ marginBottom: 16 }}>
                  <Space>
                    <Button
                      type="dashed"
                      icon={<Plus className="w-4 h-4" />}
                      onClick={handleAddScoringFactor}
                    >
                      添加评分因子
                    </Button>
                    <Select
                      placeholder="从因子库选择"
                      style={{ width: 200 }}
                      value={selectedFactorLibrary}
                      onChange={setSelectedFactorLibrary}
                      allowClear
                    >
                      {factorLibrary.map(factor => (
                        <Option key={factor.id} value={factor.id}>
                          {factor.name} ({factor.category})
                        </Option>
                      ))}
                    </Select>
                    {selectedFactorLibrary && (
                      <Button
                        type="primary"
                        size="small"
                        onClick={() => {
                           const factor = factorLibrary.find(f => f.id === selectedFactorLibrary);
                           if (factor) {
                             const newScoringFactor: ScoringFactor = {
                               id: `scoring_${Date.now()}`,
                               indicatorId: factor.id, // 这里应该映射到实际的指标ID
                               weight: factor.defaultWeight,
                               scoreMode: factor.defaultMode,
                               rangeConfig: factor.defaultRanges ? {
                                 ranges: factor.defaultRanges,
                                 monotonic: 'desc'
                               } : undefined,
                               formulaConfig: factor.defaultFormula ? {
                                 formula: factor.defaultFormula
                               } : undefined,
                               onNull: 'skip',
                               fromLibrary: factor.id
                             };
                             setCurrentScoringFactors([...currentScoringFactors, newScoringFactor]);
                             setSelectedFactorLibrary('');
                             message.success(`已添加因子: ${factor.name}`);
                           }
                         }}
                      >
                        添加到规则
                      </Button>
                    )}
                  </Space>
                </div>
                <div style={{ marginBottom: 16 }}>
                   <Space>
                     <Checkbox
                       checked={autoNormalizeWeight}
                       onChange={(e) => setAutoNormalizeWeight(e.target.checked)}
                     >
                       自动权重归一化
                     </Checkbox>
                     <Button
                       size="small"
                       onClick={() => {
                         const normalized = normalizeWeights(currentScoringFactors);
                         setCurrentScoringFactors(normalized);
                         message.success('权重已归一化');
                       }}
                       disabled={currentScoringFactors.length === 0}
                     >
                       手动归一化
                     </Button>
                   </Space>
                   <div style={{ marginTop: 8 }}>
                     <Text type="secondary">
                       当前权重总和: {(currentScoringFactors.reduce((sum, f) => sum + f.weight, 0) * 100).toFixed(1)}%
                     </Text>
                     {Math.abs(currentScoringFactors.reduce((sum, f) => sum + f.weight, 0) - 1) > 0.01 && (
                       <Text type="warning" style={{ marginLeft: 8 }}>
                         ⚠️ 权重总和不为100%
                       </Text>
                     )}
                   </div>
                 </div>
                <Table
                  dataSource={currentScoringFactors}
                  columns={scoringColumns}
                  rowKey="id"
                  size="small"
                  pagination={false}
                />
              </div>
            )}
          </div>
        );

      case 3: // 应用范围
        return (
          <div>
            <Form.Item name={['applyScope', 'orgs']} label="应用组织">
              <TreeSelect
                treeData={orgTreeData}
                placeholder="请选择应用组织"
                multiple
                treeCheckable
                showCheckedStrategy={TreeSelect.SHOW_PARENT}
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Divider>数据集过滤条件</Divider>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  label="字段"
                  name={['applyScope', 'datasetFilter', 'field']}
                >
                  <Input placeholder="purchase_mode" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="操作符"
                  name={['applyScope', 'datasetFilter', 'operator']}
                >
                  <Select placeholder="请选择操作符">
                    <Option value="=">=</Option>
                    <Option value="!=">!=</Option>
                    <Option value="IN">IN</Option>
                    <Option value="LIKE">LIKE</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="值"
                  name={['applyScope', 'datasetFilter', 'value']}
                >
                  <Input placeholder="集中采购" />
                </Form.Item>
              </Col>
            </Row>
          </div>
        );

      default:
        return null;
    }
  };

  // 过滤规则
  const filteredRules = rules.filter(rule => 
    rule.name.toLowerCase().includes(searchText.toLowerCase()) ||
    rule.ruleId.toLowerCase().includes(searchText.toLowerCase())
  );

  // 规则列表表格列定义
  const columns = [
    {
      title: '规则ID',
      dataIndex: 'ruleId',
      key: 'ruleId',
      width: 200,
    },
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
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
            <Tag key={tag} color={tag === '预警' ? 'red' : 'blue'}>
              {tag}
            </Tag>
          ))}
        </>
      ),
    },
    {
      title: '类型',
      dataIndex: 'ruleType',
      key: 'ruleType',
      width: 100,
      render: (type: string) => (
        <Tag color={type === 'control' ? 'orange' : 'green'}>
          {type === 'control' ? '控制型' : '评分型'}
        </Tag>
      ),
    },
    {
      title: '引用模型',
      dataIndex: 'modelRef',
      key: 'modelRef',
      width: 180,
      render: (modelRef: string) => {
        const model = availableModels.find(m => m.id === modelRef);
        return model?.name || modelRef;
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
            title="确定要删除这个规则吗？"
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

  // 条件表格列定义
  const conditionColumns = [
    {
      title: '指标',
      dataIndex: 'indicatorId',
      key: 'indicatorId',
      render: (indicatorId: string) => {
        const indicators = getCurrentModelIndicators();
        const indicator = indicators.find(i => i.id === indicatorId);
        return indicator?.name || indicatorId;
      },
    },
    {
      title: '条件',
      key: 'condition',
      render: (_: any, record: RuleCondition) => (
        <Text code>{`${record.operator} ${record.value}${record.unit ? ` ${record.unit}` : ''}`}</Text>
      ),
    },
    {
      title: '提示信息',
      dataIndex: 'message',
      key: 'message',
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: string) => {
        const colorMap = { high: 'red', medium: 'orange', low: 'blue' };
        const textMap = { high: '高', medium: '中', low: '低' };
        return <Tag color={colorMap[severity as keyof typeof colorMap]}>{textMap[severity as keyof typeof textMap]}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: RuleCondition) => (
        <Space size="small">
          <Button 
            type="link" 
            size="small"
            icon={<Edit className="w-3 h-3" />} 
            onClick={() => handleEditCondition(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个条件吗？"
            onConfirm={() => handleDeleteCondition(record.id)}
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

  // 评分因子表格列定义
  const scoringColumns = [
    {
      title: '指标',
      dataIndex: 'indicatorId',
      key: 'indicatorId',
      width: 150,
      render: (indicatorId: string, record: ScoringFactor) => {
        const indicators = getCurrentModelIndicators();
        const indicator = indicators.find(i => i.id === indicatorId);
        const factorItem = record.fromLibrary ? factorLibrary.find(f => f.id === record.fromLibrary) : null;
        return (
          <div>
            <div>{indicator?.name || indicatorId}</div>
            {factorItem && (
               <Tag color="blue">
                 来自因子库: {factorItem.name}
               </Tag>
             )}
          </div>
        );
      },
    },
    {
      title: '权重',
      dataIndex: 'weight',
      key: 'weight',
      width: 100,
      render: (weight: number) => (
        <div>
          <div style={{ marginBottom: 4 }}>{(weight * 100).toFixed(1)}%</div>
          <div style={{ 
            width: '100%', 
            height: 4, 
            backgroundColor: '#f0f0f0', 
            borderRadius: 2,
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${weight * 100}%`,
              height: '100%',
              backgroundColor: weight > 0.5 ? '#ff4d4f' : weight > 0.3 ? '#faad14' : '#52c41a',
              transition: 'width 0.3s'
            }} />
          </div>
        </div>
      ),
    },
    {
      title: '打分模式',
      dataIndex: 'scoreMode',
      key: 'scoreMode',
      width: 120,
      render: (mode: string, record: ScoringFactor) => (
        <div>
          <Tag color={mode === 'range' ? 'green' : 'blue'}>
            {mode === 'range' ? '区间打分' : '公式打分'}
          </Tag>
          {record.onNull && (
            <div style={{ fontSize: '11px', color: '#666', marginTop: 2 }}>
              空值处理: {record.onNull === 'skip' ? '跳过' : record.onNull === 'zero' ? '0分' : `${record.customNullScore}分`}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '配置',
      key: 'config',
      render: (_: any, record: ScoringFactor) => {
        if (record.scoreMode === 'range') {
          const rangeCount = record.rangeConfig?.ranges.length || 0;
          return (
            <div>
              <div style={{ marginBottom: 4 }}>
                <Text>{rangeCount} 个区间</Text>
                {record.rangeConfig?.monotonic && (
                   <Tag color="purple" style={{ marginLeft: 8 }}>
                     {record.rangeConfig.monotonic === 'asc' ? '单调递增' : record.rangeConfig.monotonic === 'desc' ? '单调递减' : '非单调'}
                   </Tag>
                 )}
              </div>
              {record.rangeConfig?.ranges.slice(0, 2).map((range, index) => (
                <div key={index} style={{ fontSize: '12px', marginBottom: 2 }}>
                  <span style={{ color: '#1890ff' }}>
                    {range.minInclusive ? '[' : '('}{range.min}, {range.max}{range.maxInclusive ? ']' : ')'}
                  </span>
                  <span style={{ marginLeft: 8, fontWeight: 'bold' }}>
                    → {range.score}分
                  </span>
                </div>
              ))}
              {rangeCount > 2 && (
                <div style={{ fontSize: '11px', color: '#666' }}>...还有{rangeCount - 2}个区间</div>
              )}
            </div>
          );
        } else {
          return (
            <div>
              <div style={{ fontSize: '12px', fontFamily: 'monospace', background: '#f5f5f5', padding: '4px 8px', borderRadius: 4 }}>
                {record.formulaConfig?.formula}
              </div>
              {record.formulaConfig?.params && Object.keys(record.formulaConfig.params).length > 0 && (
                <div style={{ fontSize: '11px', color: '#666', marginTop: 4 }}>
                  参数: {Object.entries(record.formulaConfig.params).map(([k, v]) => `${k}=${v}`).join(', ')}
                </div>
              )}
            </div>
          );
        }
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: ScoringFactor) => (
        <Space size="small">
          <Button 
            type="link" 
            size="small"
            icon={<Edit className="w-3 h-3" />} 
            onClick={() => handleEditScoringFactor(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个评分因子吗？"
            onConfirm={() => handleDeleteScoringFactor(record.id)}
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

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* 页面标题和操作栏 */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>比价规则管理</Title>
          <Space>
            <Input
              placeholder="搜索规则名称或ID"
              prefix={<Search className="w-4 h-4" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
            />
            <Button type="primary" icon={<Plus className="w-4 h-4" />} onClick={handleCreate}>
              新建规则
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

      {/* 新建/编辑规则弹窗 */}
      <Modal
        title={editingRule ? '编辑比价规则' : '新建比价规则'}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={1000}
        style={{ top: 20 }}
      >
        <div style={{ marginBottom: 24 }}>
          <Steps current={currentStep} size="small">
            {steps.map((step, index) => (
              <Step key={index} title={step.title} />
            ))}
          </Steps>
        </div>
        
        <Form form={form} layout="vertical">
          {renderStepContent()}
        </Form>
        
        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <Space>
            {currentStep > 0 && (
              <Button onClick={handlePrev} icon={<ArrowLeft className="w-4 h-4" />}>
                上一步
              </Button>
            )}
            {currentStep < steps.length - 1 ? (
              <Button type="primary" onClick={handleNext} icon={<ArrowRight className="w-4 h-4" />}>
                下一步
              </Button>
            ) : (
              <Button type="primary" onClick={handleSave}>
                {editingRule ? '更新规则' : '创建规则'}
              </Button>
            )}
            <Button onClick={handleCancel}>
              取消
            </Button>
          </Space>
        </div>
      </Modal>

      {/* 条件编辑弹窗 */}
      <Modal
        title={editingCondition ? '编辑规则条件' : '新增规则条件'}
        open={conditionModalVisible}
        onCancel={() => setConditionModalVisible(false)}
        onOk={handleSaveCondition}
        width={600}
      >
        <Form form={conditionForm} layout="vertical">
          <Form.Item
            label="指标选择"
            name="indicatorId"
            rules={[{ required: true, message: '请选择指标' }]}
          >
            <Select placeholder="请选择指标">
              {getCurrentModelIndicators().map(indicator => (
                <Option key={indicator.id} value={indicator.id}>
                  {indicator.name} ({indicator.id})
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="条件符号"
                name="operator"
                rules={[{ required: true, message: '请选择条件符号' }]}
              >
                <Select placeholder="请选择">
                   <Option value=">">&gt;</Option>
                   <Option value="<">&lt;</Option>
                   <Option value="=">=</Option>
                   <Option value="!=">!=</Option>
                   <Option value="BETWEEN">BETWEEN</Option>
                   <Option value="IN">IN</Option>
                 </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="阈值"
                name="value"
                rules={[{ required: true, message: '请输入阈值' }]}
              >
                <InputNumber style={{ width: '100%' }} placeholder="0.1" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="单位"
                name="unit"
              >
                <Input placeholder="%" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            label="提示信息"
            name="message"
            rules={[{ required: true, message: '请输入提示信息' }]}
          >
            <Input placeholder="价格偏高" />
          </Form.Item>
          
          <Form.Item
            label="严重程度"
            name="severity"
            rules={[{ required: true, message: '请选择严重程度' }]}
          >
            <Select placeholder="请选择严重程度">
              <Option value="high">高</Option>
              <Option value="medium">中</Option>
              <Option value="low">低</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 评分因子编辑弹窗 */}
      <Modal
        title={editingScoringFactor ? '编辑评分因子' : '新增评分因子'}
        open={scoringModalVisible}
        onCancel={() => setScoringModalVisible(false)}
        onOk={handleSaveScoringFactor}
        width={900}
      >
        <Form form={scoringForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="指标选择"
                name="indicatorId"
                rules={[{ required: true, message: '请选择指标' }]}
              >
                <Select placeholder="请选择指标">
                  {getCurrentModelIndicators().filter(i => i.dataType === 'number').map(indicator => (
                    <Option key={indicator.id} value={indicator.id}>
                      {indicator.name} ({indicator.id})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="权重"
                name="weight"
                rules={[{ required: true, message: '请设置权重' }]}
              >
                <Slider
                  min={0}
                  max={1}
                  step={0.05}
                  marks={{
                    0: '0%',
                    0.25: '25%',
                    0.5: '50%',
                    0.75: '75%',
                    1: '100%'
                  }}
                  tooltip={{
                    formatter: (value) => `${((value || 0) * 100).toFixed(1)}%`
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            label="打分模式"
            name="scoreMode"
            rules={[{ required: true, message: '请选择打分模式' }]}
          >
            <Radio.Group>
              <Radio value="range">区间打分</Radio>
              <Radio value="formula">公式打分</Radio>
            </Radio.Group>
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="空值处理"
                name="onNull"
                rules={[{ required: true, message: '请选择空值处理方式' }]}
              >
                <Select placeholder="请选择空值处理方式">
                  <Option value="skip">跳过（不参与计算）</Option>
                  <Option value="zero">按0分计算</Option>
                  <Option value="custom">自定义分值</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.onNull !== currentValues.onNull}>
                {({ getFieldValue }) => {
                  const onNull = getFieldValue('onNull');
                  if (onNull === 'custom') {
                    return (
                      <Form.Item
                        label="自定义空值分数"
                        name="customNullScore"
                        rules={[{ required: true, message: '请输入自定义分数' }]}
                      >
                        <InputNumber
                          min={0}
                          max={100}
                          placeholder="50"
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                    );
                  }
                  return null;
                }}
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.scoreMode !== currentValues.scoreMode}>
            {({ getFieldValue }) => {
              const scoreMode = getFieldValue('scoreMode');
              
              if (scoreMode === 'range') {
                return (
                  <div>
                    <Form.Item
                      label="单调性"
                      name={['rangeConfig', 'monotonic']}
                    >
                      <Radio.Group>
                        <Radio value="asc">单调递增</Radio>
                        <Radio value="desc">单调递减</Radio>
                        <Radio value="none">非单调</Radio>
                      </Radio.Group>
                    </Form.Item>
                    <Form.Item
                      label="区间配置"
                      name={['rangeConfig', 'ranges']}
                    >
                      <Alert
                        message="区间打分配置"
                        description="请配置不同区间对应的分值，支持开闭区间设置"
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                      />
                      <TextArea
                        rows={6}
                        placeholder={`示例配置（JSON格式）：\n[\n  {"min": 0, "max": 0.05, "score": 100, "minInclusive": true, "maxInclusive": false},\n  {"min": 0.05, "max": 0.1, "score": 80, "minInclusive": true, "maxInclusive": false},\n  {"min": 0.1, "max": 0.2, "score": 60, "minInclusive": true, "maxInclusive": false}\n]`}
                      />
                    </Form.Item>
                  </div>
                );
              } else if (scoreMode === 'formula') {
                return (
                  <div>
                    <Form.Item
                      label="公式模板"
                    >
                      <Select
                        placeholder="选择公式模板（可选）"
                        allowClear
                        onChange={(templateId) => {
                          if (templateId) {
                            const template = formulaTemplates.find(t => t.id === templateId);
                            if (template) {
                              scoringForm.setFieldsValue({
                                formulaConfig: {
                                  formula: template.formula
                                }
                              });
                            }
                          }
                        }}
                      >
                        {formulaTemplates.map(template => (
                          <Option key={template.id} value={template.id}>
                            {template.name} - {template.description}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item
                      label="计算公式"
                      name={['formulaConfig', 'formula']}
                      rules={[{ required: true, message: '请输入计算公式' }]}
                    >
                      <TextArea
                        rows={3}
                        placeholder="MAX(0, 100 - (差异率 * 500))"
                      />
                    </Form.Item>
                    <Form.Item
                      label="公式参数"
                      name={['formulaConfig', 'params']}
                    >
                      <TextArea
                        rows={2}
                        placeholder={`参数配置（JSON格式）：\n{"maxScore": 100, "threshold": 0.1}`}
                      />
                    </Form.Item>
                  </div>
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