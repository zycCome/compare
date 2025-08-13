import React, { useState } from 'react';
import { Card, Button, Input, Radio, Checkbox, Select, Tag, Divider, Form, Space, Typography, Alert, Row, Col, Steps, Modal, Table, Switch } from 'antd';
import { PlusOutlined, SaveOutlined, EyeOutlined, SendOutlined, LeftOutlined, CheckOutlined, EditOutlined, CopyOutlined, DeleteOutlined, RightOutlined, DatabaseOutlined, LinkOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface Dataset {
  id: string;
  alias: string;
  name: string;
}

interface JoinConfig {
  id: string;
  targetAlias: string;
  type: 'LEFT' | 'RIGHT' | 'INNER';
  on: string;
  uniqueCheck: boolean;
}

// 新的数据结构定义，基于优化文档


// 保留原有接口用于兼容
interface AttachedDatasetConfig {
  id: string;
  datasetId: string;
  datasetName: string;
  alias: string;
  joinType: 'INNER' | 'LEFT' | 'RIGHT';
  joinConditions: string[];
  joinPreview: string;
}

interface FieldMapping {
  field: string;
  semantic: string;
}

interface ConditionInheritance {
  from: string;
  to: string[];
}

interface AnalysisIndicator {
  libId: string;
  name: string;
  datasetAlias: string;
  unit: string;
  aggregation: string;
}

interface BaselineCandidate {
  libId: string;
  name: string;
  datasetAlias: string;
  unit: string;
  aggregation: string;
}

interface DisplayAttribute {
  id: string;
  name: string;
  datasetAlias: string;
  field: string;
  displayName: string;
  bindField: string;
  attachTo: string[];
  dedupe: {
    type: string;
    orderBy?: string;
  };
}

interface QueryCondition {
  id: string;
  fieldCode: string;
  fieldName: string;
  componentType: string;
}

interface BaselineQueryCondition {
  id: string;
  baselineIndicatorId: string; // 关联的基准指标ID
  fieldCode: string;
  fieldName: string;
  componentType: string;
}

interface CalculationIndicator {
  id: string;
  indicatorId: string;
  name: string;
  description: string;
  tags: string[];
  bindBaseline: 'all' | 'specific';
  specificBaselines?: string[];
  participantIndicator: string;
  baselineIndicator: string;
  formula: string;
  dataType: 'number' | 'string' | 'boolean';
  unit: string;
  decimalPlaces: number;
  formatType: 'percentage' | 'currency' | 'thousands' | 'none';
  nullHandling: 'null' | 'zero' | 'custom';
  customNullValue?: string;
  negativeClipping: 'none' | 'zero' | 'range';
  rangeMin?: number;
  rangeMax?: number;
  errorMarking: boolean;
  enabled: boolean;
  versionNote: string;
}

interface PriceModel2 {
  id?: string;
  modelName: string;
  modelCode: string;
  tags: string[];
  description: string;
  enabled: boolean;
  
  // 数据源绑定
  primaryDataset: Dataset;
  attachedDatasets: Dataset[];
  joins: JoinConfig[];
  fieldMapping: FieldMapping[];
  conditionInheritance: ConditionInheritance[];
  
  // 比价对象
  compareKey: string[];
  analysisTarget: string;
  analysisDimensions: string[];
  
  // 指标与基准
  analysisIndicators: AnalysisIndicator[];
  baselineCandidates: BaselineCandidate[];
  // 计算指标
  calculationIndicators: CalculationIndicator[];
  // 显示属性
  displayAttributes: DisplayAttribute[];
}

const PriceModel2Management: React.FC = () => {
  const [models, setModels] = useState<PriceModel2[]>([
    {
      id: '1',
      modelName: '供应商比价模型',
      modelCode: 'mdl_vendor_compare',
      tags: ['同品多商', '历史对比'],
      description: '基于协议价与历史采购价格的供应商比价分析模型',
      enabled: true,
      primaryDataset: { id: 'ds_agreement_price', alias: 'a', name: '协议价数据集' },
      attachedDatasets: [
        { id: 'ds_po_hist', alias: 'h', name: '历史采购数据集' },
        { id: 'ds_market', alias: 'm', name: '市场行情数据集' }
      ],
      joins: [],
      fieldMapping: [],
      conditionInheritance: [],
      compareKey: ['item_id', 'vendor_id'],
      analysisTarget: 'vendor',
      analysisDimensions: ['purchase_org', 'brand'],
      analysisIndicators: [],
      baselineCandidates: [],
      calculationIndicators: [],
      displayAttributes: []
    },
    {
      id: '2',
      modelName: '市场行情比价模型',
      modelCode: 'mdl_market_compare',
      tags: ['市场对比'],
      description: '基于市场行情数据的价格比较分析模型',
      enabled: false,
      primaryDataset: { id: 'ds_market', alias: 'm', name: '市场行情数据集' },
      attachedDatasets: [
        { id: 'ds_agreement_price', alias: 'a', name: '协议价数据集' }
      ],
      joins: [],
      fieldMapping: [],
      conditionInheritance: [],
      compareKey: ['item_id'],
      analysisTarget: 'market',
      analysisDimensions: ['brand', 'spec'],
      analysisIndicators: [],
      baselineCandidates: [],
      calculationIndicators: [],
      displayAttributes: []
    }
  ]);
  const [form] = Form.useForm();
  const [editingModel, setEditingModel] = useState<PriceModel2 | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // 数据源绑定相关状态
  const [attachedDatasets, setAttachedDatasets] = useState<AttachedDatasetConfig[]>([]);
  const [joins, setJoins] = useState<JoinConfig[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [conditionInheritances, setConditionInheritances] = useState<ConditionInheritance[]>([]);
  
  // 主数据集状态
  const [primaryDataset, setPrimaryDataset] = useState<{ datasetId: string; alias: string } | null>(null);
  
  // 指标与基准相关状态
  const [analysisIndicators, setAnalysisIndicators] = useState<AnalysisIndicator[]>([]);
  const [baselineCandidates, setBaselineCandidates] = useState<BaselineCandidate[]>([]);
  
  // 显示属性相关状态
  const [displayAttributes, setDisplayAttributes] = useState<DisplayAttribute[]>([]);
  
  // 计算指标相关状态
  const [calculationIndicators, setCalculationIndicators] = useState<CalculationIndicator[]>([]);
  
  // 比价维度相关状态
  const [analysisDimensions, setAnalysisDimensions] = useState<string[]>([]);
  
  // 弹窗状态
  const [datasetModalVisible, setDatasetModalVisible] = useState(false);
  const [conditionEditModalVisible, setConditionEditModalVisible] = useState(false);
  const [calculationIndicatorModalVisible, setCalculationIndicatorModalVisible] = useState(false);
  const [editingCalculationIndicator, setEditingCalculationIndicator] = useState<CalculationIndicator | null>(null);
  const [bindBaseline, setBindBaseline] = useState<'all' | 'specific'>('all');
  const [formulaExpression, setFormulaExpression] = useState<string>('( ${COMPARE} - ${BASELINE} ) / NULLIF(${BASELINE},0)');
  const [formulaMode, setFormulaMode] = useState<'visual' | 'advanced'>('visual');
  const [dimensionModalVisible, setDimensionModalVisible] = useState(false);

  const [datasetModalType, setDatasetModalType] = useState<'primary' | 'attached'>('primary');
  const [selectedDatasetInModal, setSelectedDatasetInModal] = useState<Dataset | null>(null);
  const [selectedDatasetsInModal, setSelectedDatasetsInModal] = useState<Dataset[]>([]);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [indicatorModalVisible, setIndicatorModalVisible] = useState(false);
  const [baselineModalVisible, setBaselineModalVisible] = useState(false);
  const [baselineIndicatorModalVisible, setBaselineIndicatorModalVisible] = useState(false);
  const [displayAttrModalVisible, setDisplayAttrModalVisible] = useState(false);
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([]);
  const [selectedBaselineIndicators, setSelectedBaselineIndicators] = useState<string[]>([]);
  const [selectedDisplayAttrs, setSelectedDisplayAttrs] = useState<string[]>([]);
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>([]);
  const [queryConditionModalVisible, setQueryConditionModalVisible] = useState(false);
  const [selectedQueryConditions, setSelectedQueryConditions] = useState<string[]>([]);
  const [queryConditions, setQueryConditions] = useState<QueryCondition[]>([]);

  // 基准查询条件配置相关状态
  const [baselineQueryConditionModalVisible, setBaselineQueryConditionModalVisible] = useState(false);
  const [selectedBaselineQueryConditions, setSelectedBaselineQueryConditions] = useState<string[]>([]);
  const [baselineQueryConditions, setBaselineQueryConditions] = useState<BaselineQueryCondition[]>([]);
  const [currentBaselineIndicatorId, setCurrentBaselineIndicatorId] = useState<string>(''); // 当前配置查询条件的基准指标ID

  // Mock data
  const mockDatasets = [
    { id: 'ds_agreement_price', alias: 'a', name: '协议价数据集' },
    { id: 'ds_po_hist', alias: 'h', name: '历史采购数据集' },
    { id: 'ds_market', alias: 'm', name: '市场行情数据集' },
    { id: 'ds_bid', alias: 'b', name: '招采中标数据集' }
  ];

  const mockFields = [
    { value: 'sku_code', label: '物料编码' },
    { value: 'supplier_code', label: '供应商编码' },
    { value: 'spec', label: '规格' },
    { value: 'brand_no', label: '品牌' },
    { value: 'purchase_org', label: '采购组织' },
    { value: 'trade_date', label: '交易日期' },
    { value: 'price', label: '含税单价' }
  ];

  const mockIndicators = [
    { libId: 'lib.agr_price', name: '协议价', datasetAlias: 'a', unit: 'CNY', aggregation: 'NONE' },
    { libId: 'lib.tax_incl_price', name: '含税价', datasetAlias: 'a', unit: 'CNY', aggregation: 'NONE' },
    { libId: 'lib.hist_min', name: '历史最低价', datasetAlias: 'h', unit: 'CNY', aggregation: 'MIN' },
    { libId: 'lib.market_ref', name: '市场参考价', datasetAlias: 'm', unit: 'CNY', aggregation: 'AVG' },
    { libId: 'lib.bid_min', name: '中标最低价', datasetAlias: 'b', unit: 'CNY', aggregation: 'MIN' }
  ];

  const mockDisplayAttributes = [
    {
      id: 'attr_1',
      fieldCode: 'sku_code',
      name: '物料编码',
      fieldType: 'VARCHAR',
      datasetAlias: 'a',
      field: 'sku_code',
      displayName: '物料编码',
      bindField: 'sku_code',
      attachTo: ['协议价'],
      dedupe: { type: '保留最新', orderBy: 'trade_date DESC' }
    },
    {
      id: 'attr_2',
      fieldCode: 'supplier_name',
      name: '供应商名称',
      fieldType: 'VARCHAR',
      datasetAlias: 'a',
      field: 'supplier_name',
      displayName: '供应商名称',
      bindField: 'supplier_name',
      attachTo: ['协议价', '含税价'],
      dedupe: { type: '保留最新' }
    },
    {
      id: 'attr_3',
      fieldCode: 'brand_no',
      name: '品牌',
      fieldType: 'VARCHAR',
      datasetAlias: 'a',
      field: 'brand_no',
      displayName: '品牌',
      bindField: 'brand_no',
      attachTo: ['协议价'],
      dedupe: { type: '保留最新' }
    },
    {
      id: 'attr_4',
      fieldCode: 'purchase_org',
      name: '采购组织',
      fieldType: 'VARCHAR',
      datasetAlias: 'a',
      field: 'purchase_org',
      displayName: '采购组织',
      bindField: 'purchase_org',
      attachTo: ['协议价', '含税价'],
      dedupe: { type: '保留最新' }
    },
    {
      id: 'attr_5',
      fieldCode: 'trade_date',
      name: '交易日期',
      fieldType: 'DATE',
      datasetAlias: 'h',
      field: 'trade_date',
      displayName: '交易日期',
      bindField: 'trade_date',
      attachTo: ['历史最低价'],
      dedupe: { type: '保留最新', orderBy: 'trade_date DESC' }
    }
  ];

  const mockQueryConditionFields = [
    {
      id: 'qc_1',
      fieldCode: 'sku_code',
      fieldName: '物料编码',
      componentType: '弹框多选'
    },
    {
      id: 'qc_2',
      fieldCode: 'supplier_code',
      fieldName: '供应商编码',
      componentType: '弹框单选'
    },
    {
      id: 'qc_3',
      fieldCode: 'purchase_org',
      fieldName: '采购组织',
      componentType: '下拉单选'
    },
    {
      id: 'qc_4',
      fieldCode: 'trade_date',
      fieldName: '交易日期',
      componentType: '日期'
    },
    {
      id: 'qc_5',
      fieldCode: 'create_time',
      fieldName: '创建时间',
      componentType: '时间'
    }
  ];

  const steps = [
    { title: '基本信息', description: '模型名称、编码等基础信息' },
    { title: '选择数据集', description: '选择主数据集、基准数据集' },
    { title: '设置比价对象', description: '比价对象、比价指标、比价维度、属性显示' },
    { title: '设置基准对象', description: '基准指标' },
    { title: '设置计算指标', description: '衍生指标库，配置计算指标' },
    { title: '预览与校验', description: 'SQL预览和配置校验' }
  ];

  const handleCreateNew = () => {
    setIsEditing(true);
    setEditingModel(null);
    setCurrentStep(0);
    form.resetFields();
    // 重置所有状态
    setAttachedDatasets([]);
    setJoins([]);
    setFieldMappings([]);
    setConditionInheritances([]);
    setAnalysisIndicators([]);
    setBaselineCandidates([]);
    setCalculationIndicators([]);
    setDisplayAttributes([]);
  };

  const handleEdit = (model: PriceModel2) => {
    setIsEditing(true);
    setEditingModel(model);
    setCurrentStep(0);
    form.setFieldsValue(model);
    // 设置相关状态 - 转换旧的Dataset格式到新的AttachedDatasetConfig格式
    const convertedAttachedDatasets = (model.attachedDatasets || []).map((dataset: Dataset) => ({
      id: Date.now().toString() + Math.random(),
      datasetId: dataset.id,
      datasetName: dataset.name,
      alias: dataset.alias,
      joinType: 'LEFT' as const,
      joinConditions: [],
      joinPreview: ''
    }));
    setAttachedDatasets(convertedAttachedDatasets);
    setJoins(model.joins || []);
    setFieldMappings(model.fieldMapping || []);
    setConditionInheritances(model.conditionInheritance || []);
    setAnalysisIndicators(model.analysisIndicators || []);
    setBaselineCandidates(model.baselineCandidates || []);
    setCalculationIndicators(model.calculationIndicators || []);
    setDisplayAttributes(model.displayAttributes || []);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const newModel: PriceModel2 = {
        ...values,
        id: editingModel?.id || Date.now().toString(),
        attachedDatasets,
        joins,
        fieldMapping: fieldMappings,
        conditionInheritance: conditionInheritances,
        analysisIndicators,
        baselineCandidates,
        calculationIndicators,
        displayAttributes
      };
      
      if (editingModel) {
        setModels(models.map(m => m.id === editingModel.id ? newModel : m));
      } else {
        setModels([...models, newModel]);
      }
      
      setIsEditing(false);
      setEditingModel(null);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

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
    setIsEditing(false);
    setEditingModel(null);
    setCurrentStep(0);
    form.resetFields();
  };

  // 选择数据集
  const selectDataset = (dataset?: Dataset) => {
    if (datasetModalType === 'primary') {
      if (dataset) {
        form.setFieldsValue({
          primaryDataset: {
            id: dataset.id,
            name: dataset.name,
            alias: dataset.alias
          }
        });
      }
    } else {
      // 处理多选基准数据集
      selectedDatasetsInModal.forEach(ds => {
        addAttachedDataset(ds);
      });
    }
    setDatasetModalVisible(false);
    setSelectedDatasetInModal(null);
    setSelectedDatasetsInModal([]);
  };

  // 添加基准数据集
  const addAttachedDataset = (dataset: Dataset) => {
    if (!attachedDatasets.find(d => d.datasetId === dataset.id)) {
      const newAttachedDataset: AttachedDatasetConfig = {
        id: Date.now().toString() + Math.random(),
        datasetId: dataset.id,
        datasetName: dataset.name,
        alias: dataset.alias,
        joinType: 'LEFT',
        joinConditions: [],
        joinPreview: ''
      };
      setAttachedDatasets([...attachedDatasets, newAttachedDataset]);
    }
    setDatasetModalVisible(false);
  };





  // 移除附加数据集
  const removeAttachedDataset = (id: string) => {
    const datasetToRemove = attachedDatasets.find(d => d.id === id);
    setAttachedDatasets(attachedDatasets.filter(d => d.id !== id));
    // 同时移除相关的JOIN配置
    if (datasetToRemove) {
      setJoins(joins.filter(j => j.targetAlias !== datasetToRemove.alias));
    }
  };

  // 添加JOIN配置
  const addJoinConfig = (joinConfig: Omit<JoinConfig, 'id'>) => {
    const newJoin: JoinConfig = {
      ...joinConfig,
      id: Date.now().toString()
    };
    setJoins([...joins, newJoin]);
    setJoinModalVisible(false);
  };

  // 添加显示属性
  const addDisplayAttribute = (attr: Omit<DisplayAttribute, 'id'>) => {
    const newAttr: DisplayAttribute = {
      ...attr,
      id: Date.now().toString()
    };
    setDisplayAttributes([...displayAttributes, newAttr]);
    setDisplayAttrModalVisible(false);
  };





  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // 基本信息
        return (
          <Card title="基本信息">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="模型名称"
                  name="modelName"
                  rules={[{ required: true, message: '请输入模型名称' }]}
                >
                  <Input placeholder="请输入模型名称" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="模型编码"
                  name="modelCode"
                  rules={[{ required: true, message: '请输入模型编码' }]}
                >
                  <Input placeholder="mdl_vendor_compare" />
                </Form.Item>
              </Col>
            </Row>
            
            <Form.Item label="标签" name="tags">
              <Select mode="tags" placeholder="添加标签">
                <Option value="同品多商">同品多商</Option>
                <Option value="历史对比">历史对比</Option>
              </Select>
            </Form.Item>

            <Form.Item label="描述" name="description">
              <TextArea rows={3} placeholder="请输入模型描述" />
            </Form.Item>

            <Form.Item label="启用" name="enabled" valuePropName="checked" initialValue={true}>
              <Switch />
            </Form.Item>
            
            <Alert
              message="提示：模型定义结构与标准，计算公式与基准选择将在比价方案里配置。"
              type="info"
              showIcon
              style={{ marginTop: 16 }}
            />
          </Card>
        );

      case 1: // 数据源绑定
        return (
          <Card title="选择数据集">
            {/* 主数据集区块 */}
            <Card 
              size="small" 
              title={<Text strong>比价数据集</Text>} 
              style={{ marginBottom: 16 }}
              bodyStyle={{ padding: '16px' }}
            >
              <Row gutter={16} align="middle">
                <Col span={3}>
                  <Text>选择比价数据集</Text>
                </Col>
                <Col span={9}>
                  <Form.Item
                    name={['primaryDataset', 'id']}
                    rules={[{ required: true, message: '请选择比价数据集' }]}
                    style={{ margin: 0 }}
                  >
                    <Button 
                      style={{ width: '100%', textAlign: 'left' }}
                      onClick={() => {
                        setDatasetModalVisible(true);
                        setDatasetModalType('primary');
                      }}
                    >
                      {form.getFieldValue(['primaryDataset', 'id']) ? 
                        mockDatasets.find(d => d.id === form.getFieldValue(['primaryDataset', 'id']))?.name
                        : '选择比价数据集'
                      }
                    </Button>
                  </Form.Item>
                </Col>
                <Col span={2}>
                  <Text>别名</Text>
                </Col>
                <Col span={10}>
                  <Form.Item 
                    name={['primaryDataset', 'alias']} 
                    rules={[
                      { required: true, message: '请输入别名' },
                      { pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/, message: '别名必须以字母开头，只能包含字母、数字和下划线' }
                    ]}
                    style={{ margin: 0 }}
                  >
                    <Input 
                      placeholder="输入别名" 
                      onChange={(e) => {
                        const alias = e.target.value;
                        const datasetId = form.getFieldValue(['primaryDataset', 'id']);
                        if (datasetId) {
                          setPrimaryDataset({ datasetId, alias });
                        }
                      }}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* 基准数据集区域 */}
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text strong>基准数据集</Text>
              <Button 
                type="dashed" 
                icon={<PlusOutlined />}
                onClick={() => {
                  setDatasetModalVisible(true);
                  setDatasetModalType('attached');
                }}
              >
                选择基准数据集
              </Button>
            </div>

            {/* 兼容原有基准数据集显示 */}
            {attachedDatasets.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Table
                  dataSource={attachedDatasets}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  style={{ marginTop: 8 }}
                  columns={[
                    {
                      title: '基准数据集名称',
                      dataIndex: 'datasetName',
                      key: 'datasetName',
                      width: 200,
                    },
                    {
                      title: '数据集别名',
                      key: 'alias',
                      width: 150,
                      render: (_, record: AttachedDatasetConfig) => (
                        <Input
                          value={record.alias}
                          placeholder="输入别名"
                          onChange={(e) => {
                            const newAttachedDatasets = attachedDatasets.map(item => 
                              item.id === record.id ? { ...item, alias: e.target.value } : item
                            );
                            setAttachedDatasets(newAttachedDatasets);
                          }}
                        />
                      ),
                    },
                    {
                      title: '连接类型',
                      key: 'joinType',
                      width: 120,
                      render: (_, record: AttachedDatasetConfig) => (
                        <Select
                          value={record.joinType}
                          style={{ width: '100%' }}
                          onChange={(value) => {
                            const newAttachedDatasets = attachedDatasets.map(item => 
                              item.id === record.id ? { ...item, joinType: value } : item
                            );
                            setAttachedDatasets(newAttachedDatasets);
                          }}
                        >
                          <Option value="INNER">INNER JOIN</Option>
                          <Option value="LEFT">LEFT JOIN</Option>
                          <Option value="RIGHT">RIGHT JOIN</Option>
                        </Select>
                      ),
                    },
                    {
                      title: '关联条件',
                      key: 'joinConditions',
                      width: 200,
                      render: (_, record: AttachedDatasetConfig) => (
                        <Select
                          mode="multiple"
                          value={record.joinConditions}
                          placeholder="选择关联字段"
                          style={{ width: '100%' }}
                          onChange={(value) => {
                            const preview = value.map(field => `a.${field} = ${record.alias}.${field}`).join(' AND ');
                            const newAttachedDatasets = attachedDatasets.map(item => 
                              item.id === record.id ? { ...item, joinConditions: value, joinPreview: preview } : item
                            );
                            setAttachedDatasets(newAttachedDatasets);
                          }}
                        >
                          {mockFields.map(field => (
                            <Option key={field.value} value={field.value}>
                              {field.label} ({field.value})
                            </Option>
                          ))}
                        </Select>
                      ),
                    },
                    {
                      title: '关联条件预览',
                      key: 'joinPreview',
                      width: 250,
                      render: (_, record: AttachedDatasetConfig) => (
                        <Text code style={{ fontSize: '12px' }}>
                          {record.joinPreview || '请选择关联条件'}
                        </Text>
                      ),
                    },
                    {
                      title: '操作',
                      key: 'action',
                      width: 120,
                      render: (_, record: AttachedDatasetConfig) => (
                        <Space size="small">
                          <Button type="link" size="small">
                            校验
                          </Button>
                          <Button 
                            type="link" 
                            size="small" 
                            danger
                            onClick={() => removeAttachedDataset(record.id)}
                          >
                            删除
                          </Button>
                        </Space>
                      ),
                    },
                  ]}
                />
              </div>
            )}
          </Card>
        );

      case 2: // 比价对象设置
        return (
          <Card title="比价对象设置">
            {/* 比价对象 */}
            <Form.Item
              label="请选择比价对象"
              name="compareKey"
              rules={[{ required: true, message: '请选择比价对象字段' }]}
              style={{ marginBottom: 24 }}
            >
              <Select mode="multiple" placeholder="选择比价对象字段（相同产品或者同类产品，比一个或者多个字段）">
                {mockFields.map(field => (
                  <Option key={field.value} value={field.value}>
                    {field.value} | {field.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Divider />

            {/* 比价指标 */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text strong>比价指标（来自指标库，数据范围为映射了主数据集的指标）</Text>
                <Button 
                  type="dashed" 
                  icon={<PlusOutlined />} 
                  onClick={() => setIndicatorModalVisible(true)}
                >
                  选择比价指标
                </Button>
              </div>
              
              {analysisIndicators.length > 0 && (
                <Table
                  size="small"
                  dataSource={analysisIndicators}
                  pagination={false}
                  rowKey="libId"
                  columns={[
                    {
                      title: '指标编码',
                      dataIndex: 'libId',
                      key: 'libId',
                      width: 150,
                    },
                    {
                      title: '指标名称',
                      dataIndex: 'name',
                      key: 'name',
                      width: 120,
                    },
                    {
                      title: '关联数据集',
                      dataIndex: 'datasetAlias',
                      key: 'datasetAlias',
                      width: 100,
                      render: (alias: string) => {
                        const dataset = mockDatasets.find(d => d.alias === alias);
                        return dataset ? `${dataset.name}(${alias})` : alias;
                      }
                    },
                    {
                      title: '关联字段',
                      key: 'field',
                      width: 100,
                      render: () => 'price' // 假设都是price字段，实际应该从数据中获取
                    },
                    {
                      title: '聚合类型',
                      dataIndex: 'aggregation',
                      key: 'aggregation',
                      width: 100,
                    },
                    {
                      title: '指标单位',
                      dataIndex: 'unit',
                      key: 'unit',
                      width: 80,
                    },
                    {
                      title: '操作',
                      key: 'action',
                      width: 80,
                      render: (_, record: AnalysisIndicator) => (
                        <Button
                          type="link"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => {
                            setAnalysisIndicators(prev => prev.filter(item => item.libId !== record.libId));
                          }}
                        >
                          删除
                        </Button>
                      ),
                    },
                  ]}
                />
              )}
            </div>

            <Divider />

            {/* 比价维度 */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text strong>比价维度（横向对比的主维度）</Text>
                <Button 
                  type="dashed" 
                  icon={<PlusOutlined />}
                  onClick={() => setDimensionModalVisible(true)}
                >
                  选择比价维度
                </Button>
              </div>
              
              {/* 显示选中的维度字段 */}
              {analysisDimensions.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  {analysisDimensions.map((dimension, index) => (
                    <Tag
                      key={index}
                      closable
                      onClose={() => {
                        setAnalysisDimensions(prev => prev.filter((_, i) => i !== index));
                      }}
                      style={{ marginBottom: 4, marginRight: 4 }}
                    >
                      {dimension}
                    </Tag>
                  ))}
                </div>
              )}
              
              {analysisDimensions.length === 0 && (
                <div style={{ color: '#999', fontSize: '12px', marginTop: 4 }}>
                  请选择比价维度字段
                </div>
              )}
            </div>

            <Divider />

            {/* 属性显示 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text strong>显示属性（用于报表展示的附加字段，不参与聚合）</Text>
                <Button 
                  type="dashed" 
                  icon={<PlusOutlined />} 
                  onClick={() => setDisplayAttrModalVisible(true)}
                >
                  新增显示属性
                </Button>
              </div>
              
              {displayAttributes.length > 0 && (
                <Table
                  dataSource={displayAttributes}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  style={{ marginBottom: 16 }}
                  columns={[
                    {
                      title: '字段编码',
                      dataIndex: 'field',
                      key: 'field',
                      width: 120,
                    },
                    {
                      title: '字段名称',
                      dataIndex: 'name',
                      key: 'name',
                      width: 150,
                    },
                    {
                      title: '显示名称',
                      dataIndex: 'displayName',
                      key: 'displayName',
                      width: 150,
                      render: (text: string, record: DisplayAttribute, index: number) => (
                        <Input
                          value={text}
                          onChange={(e) => {
                            const newDisplayAttributes = [...displayAttributes];
                            newDisplayAttributes[index].displayName = e.target.value;
                            setDisplayAttributes(newDisplayAttributes);
                          }}
                          size="small"
                        />
                      ),
                    },
                    {
                      title: '绑定字段',
                      dataIndex: 'bindField',
                      key: 'bindField',
                      width: 150,
                      render: (text: string, record: DisplayAttribute, index: number) => (
                        <Select
                          value={text}
                          onChange={(value) => {
                            const newDisplayAttributes = [...displayAttributes];
                            newDisplayAttributes[index].bindField = value;
                            setDisplayAttributes(newDisplayAttributes);
                          }}
                          size="small"
                          style={{ width: '100%' }}
                          placeholder="选择绑定字段"
                        >
                          {/* 这里应该是主数据集的字段选项 */}
                          <Option value="price">price</Option>
                          <Option value="name">name</Option>
                          <Option value="category">category</Option>
                          <Option value="brand">brand</Option>
                        </Select>
                      ),
                    },
                    {
                      title: '操作',
                      key: 'action',
                      width: 80,
                      render: (text: any, record: DisplayAttribute, index: number) => (
                        <Button
                          type="link"
                          danger
                          size="small"
                          onClick={() => {
                            const newDisplayAttributes = displayAttributes.filter((_, i) => i !== index);
                            setDisplayAttributes(newDisplayAttributes);
                          }}
                        >
                          删除
                        </Button>
                      ),
                    },
                  ]}
                />
              )}
              
              <Alert
                message="说明：属性显示只做附加列，不参与聚合与计算，不改变汇总粒度。"
                type="info"
                showIcon
                style={{ marginTop: 8 }}
              />
            </div>

            <Divider />

            {/* 查询条件配置 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text strong>查询条件配置</Text>
                <Button 
                  type="dashed" 
                  icon={<PlusOutlined />} 
                  onClick={() => setQueryConditionModalVisible(true)}
                >
                  添加查询条件
                </Button>
              </div>
              
              {queryConditions.length > 0 && (
                <Table
                  dataSource={queryConditions}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  style={{ marginBottom: 16 }}
                  columns={[
                    {
                      title: '字段编码',
                      dataIndex: 'fieldCode',
                      key: 'fieldCode',
                      width: 120,
                    },
                    {
                      title: '字段名称',
                      dataIndex: 'fieldName',
                      key: 'fieldName',
                      width: 150,
                    },
                    {
                      title: '组件类型',
                      dataIndex: 'componentType',
                      key: 'componentType',
                      width: 150,
                      render: (text: string, record: QueryCondition, index: number) => (
                        <Select
                          value={text}
                          onChange={(value) => {
                            const newQueryConditions = [...queryConditions];
                            newQueryConditions[index].componentType = value;
                            setQueryConditions(newQueryConditions);
                          }}
                          size="small"
                          style={{ width: '100%' }}
                        >
                          <Option value="弹框单选">弹框单选</Option>
                          <Option value="弹框多选">弹框多选</Option>
                          <Option value="下拉单选">下拉单选</Option>
                          <Option value="日期">日期</Option>
                          <Option value="时间">时间</Option>
                        </Select>
                      ),
                    },
                    {
                      title: '操作',
                      key: 'action',
                      width: 80,
                      render: (text: any, record: QueryCondition, index: number) => (
                        <Button
                          type="link"
                          danger
                          size="small"
                          onClick={() => {
                            const newQueryConditions = queryConditions.filter((_, i) => i !== index);
                            setQueryConditions(newQueryConditions);
                          }}
                        >
                          删除
                        </Button>
                      ),
                    },
                  ]}
                />
              )}
              
              <Alert
                message="说明：查询条件配置用于生成前端查询界面的筛选条件组件。"
                type="info"
                showIcon
                style={{ marginTop: 8 }}
              />
            </div>
          </Card>
        );

      case 3: // 选择基准对象
        return (
          <Card title="选择基准对象">
            {/* 基准指标选择 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text strong>基准指标（从关联基准数据集的指标库中选择）</Text>
                <Button 
                  type="dashed" 
                  icon={<PlusOutlined />} 
                  onClick={() => setBaselineIndicatorModalVisible(true)}
                >
                  选择基准指标
                </Button>
              </div>
              
              {baselineCandidates.length > 0 && (
                <Table
                  size="small"
                  dataSource={baselineCandidates}
                  pagination={false}
                  rowKey="libId"
                  columns={[
                    {
                      title: '指标编码',
                      dataIndex: 'libId',
                      key: 'libId',
                      width: 150,
                    },
                    {
                      title: '指标名称',
                      dataIndex: 'name',
                      key: 'name',
                      width: 120,
                    },
                    {
                      title: '关联数据集',
                      dataIndex: 'datasetAlias',
                      key: 'datasetAlias',
                      width: 100,
                      render: (alias: string) => {
                        const dataset = mockDatasets.find(d => d.alias === alias);
                        return dataset ? `${dataset.name}(${alias})` : alias;
                      }
                    },
                    {
                      title: '关联字段',
                      key: 'field',
                      width: 100,
                      render: () => 'price' // 假设都是price字段，实际应该从数据中获取
                    },
                    {
                      title: '聚合类型',
                      dataIndex: 'aggregation',
                      key: 'aggregation',
                      width: 100,
                    },
                    {
                      title: '指标单位',
                      dataIndex: 'unit',
                      key: 'unit',
                      width: 80,
                    },
                    {
                      title: '操作',
                      key: 'action',
                      width: 80,
                      render: (_, record: BaselineCandidate) => (
                        <Button
                          type="link"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => {
                            setBaselineCandidates(prev => prev.filter(item => item.libId !== record.libId));
                          }}
                        >
                          删除
                        </Button>
                      ),
                    },
                  ]}
                />
              )}
            </div>
            
            <Alert
               message="说明：基准候选支持多选和全选，指标来自指标库，数据范围为映射了辅助数据集的指标。"
               type="info"
               showIcon
               style={{ marginTop: 16 }}
             />

            <Divider />

            {/* 基准查询条件配置 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text strong>基准查询条件配置</Text>
              </div>
              
              {baselineCandidates.length === 0 ? (
                <Alert
                  message="请先选择基准指标，然后为每个基准指标配置查询条件"
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              ) : (
                <div>
                  {baselineCandidates.map((indicator, index) => {
                    const indicatorConditions = baselineQueryConditions.filter(c => c.baselineIndicatorId === indicator.libId);
                    return (
                      <Card 
                        key={indicator.libId} 
                        size="small" 
                        style={{ marginBottom: 16 }}
                        title={
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{indicator.name} ({indicator.libId})</span>
                            <Button 
                              type="dashed" 
                              size="small"
                              icon={<PlusOutlined />}
                              onClick={() => {
                                setCurrentBaselineIndicatorId(indicator.libId);
                                setBaselineQueryConditionModalVisible(true);
                              }}
                            >
                              添加查询条件
                            </Button>
                          </div>
                        }
                      >
                        {indicatorConditions.length > 0 ? (
                          <Table
                            dataSource={indicatorConditions}
                            rowKey="id"
                            pagination={false}
                            size="small"
                            columns={[
                              {
                                title: '字段编码',
                                dataIndex: 'fieldCode',
                                key: 'fieldCode',
                                width: 120,
                              },
                              {
                                title: '字段名称',
                                dataIndex: 'fieldName',
                                key: 'fieldName',
                                width: 150,
                              },
                              {
                                title: '组件类型',
                                dataIndex: 'componentType',
                                key: 'componentType',
                                width: 150,
                                render: (text: string, record: BaselineQueryCondition, conditionIndex: number) => {
                                  const globalIndex = baselineQueryConditions.findIndex(c => c.id === record.id);
                                  return (
                                    <Select
                                      value={text}
                                      onChange={(value) => {
                                        const newConditions = [...baselineQueryConditions];
                                        newConditions[globalIndex].componentType = value;
                                        setBaselineQueryConditions(newConditions);
                                      }}
                                      size="small"
                                      style={{ width: '100%' }}
                                    >
                                      <Option value="弹框单选">弹框单选</Option>
                                      <Option value="弹框多选">弹框多选</Option>
                                      <Option value="下拉单选">下拉单选</Option>
                                      <Option value="日期">日期</Option>
                                      <Option value="时间">时间</Option>
                                    </Select>
                                  );
                                },
                              },
                              {
                                title: '操作',
                                key: 'action',
                                width: 80,
                                render: (text: any, record: BaselineQueryCondition) => (
                                  <Button
                                    type="link"
                                    danger
                                    size="small"
                                    onClick={() => {
                                      const newConditions = baselineQueryConditions.filter(c => c.id !== record.id);
                                      setBaselineQueryConditions(newConditions);
                                    }}
                                  >
                                    删除
                                  </Button>
                                ),
                              },
                            ]}
                          />
                        ) : (
                          <div style={{ textAlign: 'center', color: '#999', padding: '20px 0' }}>
                            暂无查询条件，点击上方按钮添加
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
              
              <Alert
                message="说明：为每个基准指标配置查询条件，用于在查询时筛选对应的基准数据。"
                type="info"
                showIcon
                style={{ marginTop: 8 }}
              />
            </div>
          </Card>
        );

      case 4: // 设置计算指标
        return (
          <Card title="设置计算指标">
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text strong>计算指标列表（衍生指标库）</Text>
                <Space>
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    onClick={() => {
                      setEditingCalculationIndicator(null);
                      setCalculationIndicatorModalVisible(true);
                    }}
                  >
                    新增计算指标
                  </Button>
                  <Button icon={<CopyOutlined />}>复制</Button>
                  <Button>导入/导出</Button>
                </Space>
              </div>
              
              {calculationIndicators.length > 0 ? (
                <Table
                  dataSource={calculationIndicators}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  columns={[
                    {
                      title: '指标ID',
                      dataIndex: 'indicatorId',
                      key: 'indicatorId',
                      width: 120,
                    },
                    {
                      title: '名称',
                      dataIndex: 'name',
                      key: 'name',
                      width: 120,
                    },
                    {
                      title: '绑定基准',
                      dataIndex: 'bindBaseline',
                      key: 'bindBaseline',
                      width: 100,
                      render: (value: string, record: CalculationIndicator) => {
                        if (value === 'all') return '全部';
                        if (value === 'specific' && record.specificBaselines) {
                          return record.specificBaselines.join(', ');
                        }
                        return '-';
                      }
                    },
                    {
                      title: '数据类型',
                      dataIndex: 'dataType',
                      key: 'dataType',
                      width: 80,
                    },
                    {
                      title: '单位',
                      dataIndex: 'unit',
                      key: 'unit',
                      width: 60,
                    },
                    {
                      title: '小数位',
                      dataIndex: 'decimalPlaces',
                      key: 'decimalPlaces',
                      width: 60,
                    },
                    {
                      title: '启用',
                      dataIndex: 'enabled',
                      key: 'enabled',
                      width: 60,
                      render: (enabled: boolean, record: CalculationIndicator) => (
                        <Switch 
                          checked={enabled} 
                          size="small"
                          onChange={(checked) => {
                            const newIndicators = calculationIndicators.map(item => 
                              item.id === record.id ? { ...item, enabled: checked } : item
                            );
                            setCalculationIndicators(newIndicators);
                          }}
                        />
                      ),
                    },
                    {
                      title: '操作',
                      key: 'action',
                      width: 120,
                      render: (_, record: CalculationIndicator) => (
                        <Space size="small">
                          <Button
                            type="link"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => {
                              setEditingCalculationIndicator(record);
                              setCalculationIndicatorModalVisible(true);
                            }}
                          >
                            编辑
                          </Button>
                          <Button
                            type="link"
                            size="small"
                            icon={<CopyOutlined />}
                          >
                            复制
                          </Button>
                          <Button
                            type="link"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => {
                              const newIndicators = calculationIndicators.filter(item => item.id !== record.id);
                              setCalculationIndicators(newIndicators);
                            }}
                          >
                            删除
                          </Button>
                        </Space>
                      ),
                    },
                  ]}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                  暂无计算指标，点击上方"新增计算指标"按钮开始配置
                </div>
              )}
              
              <Alert
                message="说明：计算指标是基于参与侧指标和基准侧指标的衍生指标，支持自定义公式计算。配置后的指标将成为模型的标准字段。"
                type="info"
                showIcon
                style={{ marginTop: 16 }}
              />
            </div>
          </Card>
        );

      case 5: // 预览与校验
        return (
          <Card title="预览与校验">
            <div style={{ marginBottom: 24 }}>
              <Text strong>校验结果：</Text>
              <div style={{ marginTop: 8 }}>
                <div style={{ marginBottom: 8 }}>
                  <CheckOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                  <Text>分析指标均来自主数据集</Text>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <CheckOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                  <Text>基准候选均绑定基准数据集</Text>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <CheckOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                  <Text>比价对象键可解析</Text>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <CheckOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                  <Text>显示属性正确挂载到对象粒度</Text>
                </div>
              </div>
            </div>

            <div>
              <Text strong>SQL预览：</Text>
              <div style={{ marginTop: 8, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                <pre style={{ margin: 0, fontSize: 12 }}>
{`SELECT 
  a.item_id,
  a.spec,
  a.brand,
  a.vendor_id,
  a.price as agreement_price,
  h.min_price as hist_min_price,
  m.ref_price as market_ref_price
FROM ds_agreement_price a
LEFT JOIN ds_po_hist h ON a.item_id = h.item_id AND a.spec = h.spec AND a.brand = h.brand
LEFT JOIN ds_market m ON a.item_id = m.item_id AND a.brand = m.brand
WHERE a.trade_date >= '2024-01-01'
GROUP BY a.item_id, a.spec, a.brand, a.vendor_id`}
                </pre>
              </div>
            </div>
          </Card>
        );

      default:
        return null;
    }
  };

  if (isEditing) {
    return (
      <div style={{ padding: '24px' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Button icon={<LeftOutlined />} onClick={handleCancel}>
              返回
            </Button>
            <Title level={2} style={{ margin: 0 }}>
              比价模型2 · {editingModel ? '编辑' : '新建'}
            </Title>
            <Tag color="orange">草稿</Tag>
          </div>
          <Space>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
              保存
            </Button>
            <Button icon={<SendOutlined />}>
              发布
            </Button>
          </Space>
        </div>

        {/* Steps */}
        <Steps
          current={currentStep}
          items={steps}
          style={{ marginBottom: 24 }}
        />

        {/* Form */}
        <Form form={form} layout="vertical" style={{ maxWidth: '1200px' }}>
          {renderStepContent()}
          
          {/* Navigation */}
          <div style={{ textAlign: 'right', marginTop: 24 }}>
            <Space>
              {currentStep > 0 && (
                <Button icon={<LeftOutlined />} onClick={handlePrev}>
                  上一步
                </Button>
              )}
              {currentStep < steps.length - 1 && (
                <Button type="primary" icon={<RightOutlined />} onClick={handleNext}>
                  下一步
                </Button>
              )}
              {currentStep === steps.length - 1 && (
                <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
                  保存模型
                </Button>
              )}
            </Space>
          </div>
        </Form>

        {/* Modals */}
        <Modal
            title={datasetModalType === 'primary' ? '选择比价数据集' : '选择基准数据集'}
            open={datasetModalVisible}
            onCancel={() => {
              setDatasetModalVisible(false);
              setSelectedDatasetInModal(null);
              setSelectedDatasetsInModal([]);
            }}
          onOk={() => {
            if (datasetModalType === 'primary') {
              if (selectedDatasetInModal) {
                selectDataset(selectedDatasetInModal);
              }
            } else {
              if (selectedDatasetsInModal.length > 0) {
                selectDataset();
              }
            }
          }}
          okText="确认添加"
          cancelText="取消"
          width={800}
        >
          <div style={{ marginBottom: 16 }}>
            从数据模型中选择要添加的数据集（已选择 {datasetModalType === 'primary' ? (selectedDatasetInModal ? 1 : 0) : selectedDatasetsInModal.length} 个数据集）：
          </div>
          <Table
            dataSource={datasetModalType === 'primary' ? mockDatasets : mockDatasets.filter(d => 
              !attachedDatasets.find(ad => ad.datasetId === d.id)
            )}
            rowKey="id"
            pagination={false}
            size="small"
            rowSelection={{
              type: datasetModalType === 'primary' ? 'radio' : 'checkbox',
              selectedRowKeys: datasetModalType === 'primary' 
                ? (selectedDatasetInModal ? [selectedDatasetInModal.id] : [])
                : selectedDatasetsInModal.map(d => d.id),
              onSelect: (record: Dataset, selected: boolean) => {
                if (datasetModalType === 'primary') {
                  setSelectedDatasetInModal(selected ? record : null);
                } else {
                  if (selected) {
                    setSelectedDatasetsInModal(prev => [...prev, record]);
                  } else {
                    setSelectedDatasetsInModal(prev => prev.filter(d => d.id !== record.id));
                  }
                }
              },
              onSelectAll: datasetModalType === 'attached' ? (selected: boolean, selectedRows: Dataset[], changeRows: Dataset[]) => {
                if (selected) {
                  setSelectedDatasetsInModal(prev => {
                    const existingIds = prev.map(d => d.id);
                    const newDatasets = changeRows.filter(d => !existingIds.includes(d.id));
                    return [...prev, ...newDatasets];
                  });
                } else {
                  const changeIds = changeRows.map(d => d.id);
                  setSelectedDatasetsInModal(prev => prev.filter(d => !changeIds.includes(d.id)));
                }
              } : undefined,
            }}
            columns={[
              {
                title: '数据集名称',
                dataIndex: 'name',
                key: 'name',
                width: 200,
              },
              {
                title: '数据集编码',
                dataIndex: 'id',
                key: 'id',
                width: 150,
              },
              {
                title: '来源模型',
                key: 'sourceModel',
                width: 150,
                render: () => 'DWD层数据模型',
              },
              {
                title: '分析主题',
                key: 'analysis',
                width: 120,
                render: (_, record: Dataset) => {
                  const analysisMap: { [key: string]: string } = {
                    'ds_agreement_price': '采购比价分析',
                    'ds_po_hist': '供应商绩效分析',
                    'ds_market': '历史价格趋势分析',
                    'ds_bid': '历史价格趋势分析'
                  };
                  return (
                    <Tag color="green">{analysisMap[record.id] || '供应商价格分析'}</Tag>
                  );
                },
              },
            ]}
          />
        </Modal>

        {/* 新增对齐Modal */}
        <Modal
          title="新增对齐"
          open={joinModalVisible}
          onCancel={() => setJoinModalVisible(false)}
          onOk={() => {
            // 这里可以添加表单验证和提交逻辑
            const newJoin: JoinConfig = {
              id: Date.now().toString(),
              targetAlias: 'h', // 示例值
              type: 'LEFT',
              on: 'a.item_id = h.item_id',
              uniqueCheck: true
            };
            setJoins([...joins, newJoin]);
            setJoinModalVisible(false);
          }}
          width={600}
        >
          <Form layout="vertical">
            <Form.Item label="目标数据集" required>
              <Select placeholder="选择目标数据集">
                {attachedDatasets.map(dataset => (
                  <Option key={dataset.id} value={dataset.alias}>
                    {dataset.datasetName} ({dataset.alias})
                  </Option>
                ))}
              </Select>
            </Form.Item>
            
            <Form.Item label="连接类型" required>
              <Radio.Group defaultValue="LEFT">
                <Radio value="LEFT">LEFT JOIN</Radio>
                <Radio value="RIGHT">RIGHT JOIN</Radio>
                <Radio value="INNER">INNER JOIN</Radio>
              </Radio.Group>
            </Form.Item>
            
            <Form.Item label="ON条件" required>
              <Input.TextArea 
                placeholder="例如: a.item_id = h.item_id AND a.vendor_id = h.vendor_id"
                rows={3}
              />
            </Form.Item>
            
            <Form.Item>
              <Checkbox defaultChecked>
                校验唯一性
              </Checkbox>
            </Form.Item>
          </Form>
        </Modal>

        {/* 指标库选择Modal */}
        <Modal
          title="选择比价指标"
          open={indicatorModalVisible}
          onCancel={() => {
            setIndicatorModalVisible(false);
            setSelectedIndicators([]);
          }}
          onOk={() => {
            // 添加选中的指标到比价指标列表
            const newIndicators = mockIndicators
              .filter(indicator => selectedIndicators.includes(indicator.libId))
              .map(indicator => ({
                libId: indicator.libId,
                name: indicator.name,
                datasetAlias: indicator.datasetAlias,
                unit: indicator.unit,
                aggregation: indicator.aggregation
              }));
            setAnalysisIndicators([...analysisIndicators, ...newIndicators]);
            setIndicatorModalVisible(false);
            setSelectedIndicators([]);
          }}
          width={800}
        >
          <Table
            dataSource={mockIndicators}
            rowKey="libId"
            pagination={false}
            size="small"
            rowSelection={{
              type: 'checkbox',
              selectedRowKeys: selectedIndicators,
              onChange: (selectedRowKeys) => {
                setSelectedIndicators(selectedRowKeys as string[]);
              },
            }}
            columns={[
              {
                title: '指标名称',
                dataIndex: 'name',
                key: 'name',
                width: 200,
              },
              {
                title: '指标ID',
                dataIndex: 'libId',
                key: 'libId',
                width: 150,
              },
              {
                title: '数据集',
                dataIndex: 'datasetAlias',
                key: 'datasetAlias',
                width: 100,
              },
              {
                title: '单位',
                dataIndex: 'unit',
                key: 'unit',
                width: 80,
              },
              {
                title: '聚合方式',
                dataIndex: 'aggregation',
                key: 'aggregation',
                width: 100,
              },
            ]}
          />
        </Modal>

        {/* 基准指标选择Modal */}
        <Modal
          title="选择基准指标"
          open={baselineIndicatorModalVisible}
          onCancel={() => {
            setBaselineIndicatorModalVisible(false);
            setSelectedBaselineIndicators([]);
          }}
          onOk={() => {
            // 添加选中的指标到基准指标列表
            const newBaselineIndicators = mockIndicators
              .filter(indicator => selectedBaselineIndicators.includes(indicator.libId))
              .filter(indicator => attachedDatasets.some(ds => ds.alias === indicator.datasetAlias)) // 只显示关联基准数据集的指标
              .map(indicator => ({
                libId: indicator.libId,
                name: indicator.name,
                datasetAlias: indicator.datasetAlias,
                unit: indicator.unit,
                aggregation: indicator.aggregation
              }));
            setBaselineCandidates([...baselineCandidates, ...newBaselineIndicators]);
            setBaselineIndicatorModalVisible(false);
            setSelectedBaselineIndicators([]);
          }}
          width={800}
        >
          <Table
            dataSource={mockIndicators.filter(indicator => attachedDatasets.some(ds => ds.alias === indicator.datasetAlias))} // 只显示关联基准数据集的指标
            rowKey="libId"
            pagination={false}
            size="small"
            rowSelection={{
              type: 'checkbox',
              selectedRowKeys: selectedBaselineIndicators,
              onChange: (selectedRowKeys) => {
                setSelectedBaselineIndicators(selectedRowKeys as string[]);
              },
            }}
            columns={[
              {
                title: '指标名称',
                dataIndex: 'name',
                key: 'name',
                width: 200,
              },
              {
                title: '指标ID',
                dataIndex: 'libId',
                key: 'libId',
                width: 150,
              },
              {
                title: '数据集',
                dataIndex: 'datasetAlias',
                key: 'datasetAlias',
                width: 100,
              },
              {
                title: '单位',
                dataIndex: 'unit',
                key: 'unit',
                width: 80,
              },
              {
                title: '聚合方式',
                dataIndex: 'aggregation',
                key: 'aggregation',
                width: 100,
              },
            ]}
          />
        </Modal>

        {/* 新增属性Modal */}
        <Modal
          title="新增显示属性"
          open={displayAttrModalVisible}
          onCancel={() => {
            setDisplayAttrModalVisible(false);
            setSelectedDisplayAttrs([]);
          }}
          onOk={() => {
            // 添加选中的属性到显示属性列表
            const newAttrs = mockDisplayAttributes
              .filter(attr => selectedDisplayAttrs.includes(attr.id))
              .map(attr => ({
                id: attr.id,
                name: attr.name,
                datasetAlias: attr.datasetAlias,
                field: attr.field,
                displayName: attr.displayName,
                bindField: attr.bindField,
                attachTo: attr.attachTo,
                dedupe: attr.dedupe
              }));
            setDisplayAttributes([...displayAttributes, ...newAttrs]);
            setDisplayAttrModalVisible(false);
            setSelectedDisplayAttrs([]);
          }}
          width={800}
        >
          <Table
            dataSource={mockDisplayAttributes}
            rowKey="id"
            pagination={false}
            size="small"
            rowSelection={{
              type: 'checkbox',
              selectedRowKeys: selectedDisplayAttrs,
              onChange: (selectedRowKeys) => {
                setSelectedDisplayAttrs(selectedRowKeys as string[]);
              },
              onSelectAll: (selected, selectedRows, changeRows) => {
                if (selected) {
                  setSelectedDisplayAttrs(mockDisplayAttributes.map(item => item.id));
                } else {
                  setSelectedDisplayAttrs([]);
                }
              },
            }}
            columns={[
              {
                title: '字段编码',
                dataIndex: 'fieldCode',
                key: 'fieldCode',
                width: 150,
              },
              {
                title: '字段名称',
                dataIndex: 'name',
                key: 'name',
                width: 150,
              },
              {
                title: '字段类型',
                dataIndex: 'fieldType',
                key: 'fieldType',
                width: 120,
              },
            ]}
          />
        </Modal>

        {/* 查询条件配置Modal */}
        <Modal
          title="添加查询条件"
          open={queryConditionModalVisible}
          onCancel={() => {
            setQueryConditionModalVisible(false);
            setSelectedQueryConditions([]);
          }}
          onOk={() => {
            // 添加选中的查询条件到查询条件列表
            const newConditions = mockQueryConditionFields
              .filter(field => selectedQueryConditions.includes(field.id))
              .map(field => ({
                id: field.id,
                fieldCode: field.fieldCode,
                fieldName: field.fieldName,
                componentType: field.componentType
              }));
            setQueryConditions([...queryConditions, ...newConditions]);
            setQueryConditionModalVisible(false);
            setSelectedQueryConditions([]);
          }}
          width={800}
        >
          <Table
            dataSource={mockQueryConditionFields}
            rowKey="id"
            pagination={false}
            size="small"
            rowSelection={{
              type: 'checkbox',
              selectedRowKeys: selectedQueryConditions,
              onChange: (selectedRowKeys) => {
                setSelectedQueryConditions(selectedRowKeys as string[]);
              },
              onSelectAll: (selected, selectedRows, changeRows) => {
                if (selected) {
                  setSelectedQueryConditions(mockQueryConditionFields.map(item => item.id));
                } else {
                  setSelectedQueryConditions([]);
                }
              },
            }}
            columns={[
              {
                title: '字段编码',
                dataIndex: 'fieldCode',
                key: 'fieldCode',
                width: 150,
              },
              {
                title: '字段名称',
                dataIndex: 'fieldName',
                key: 'fieldName',
                width: 150,
              },
              {
                title: '组件类型',
                dataIndex: 'componentType',
                key: 'componentType',
                width: 120,
              },
            ]}
          />
        </Modal>

        {/* 基准查询条件配置弹框 */}
        <Modal
          title={`为基准指标配置查询条件 - ${baselineCandidates.find(b => b.libId === currentBaselineIndicatorId)?.name || ''}`}
          open={baselineQueryConditionModalVisible}
          onCancel={() => {
            setBaselineQueryConditionModalVisible(false);
            setSelectedBaselineQueryConditions([]);
          }}
          onOk={() => {
            // 添加选中的查询条件到基准查询条件列表
            const newConditions = mockQueryConditionFields
               .filter(field => selectedBaselineQueryConditions.includes(field.id))
               .map(field => ({
                 id: (Date.now() + Math.random()).toString(),
                 baselineIndicatorId: currentBaselineIndicatorId,
                 fieldCode: field.fieldCode,
                 fieldName: field.fieldName,
                 componentType: field.componentType
               }));
            setBaselineQueryConditions([...baselineQueryConditions, ...newConditions]);
            setBaselineQueryConditionModalVisible(false);
            setSelectedBaselineQueryConditions([]);
          }}
          width={800}
        >
          <Table
            dataSource={mockQueryConditionFields}
            rowKey="id"
            pagination={false}
            size="small"
            rowSelection={{
              type: 'checkbox',
              selectedRowKeys: selectedBaselineQueryConditions,
              onChange: (selectedRowKeys) => {
                setSelectedBaselineQueryConditions(selectedRowKeys as string[]);
              },
              onSelectAll: (selected, selectedRows, changeRows) => {
                if (selected) {
                  setSelectedBaselineQueryConditions(mockQueryConditionFields.map(item => item.id));
                } else {
                  setSelectedBaselineQueryConditions([]);
                }
              },
            }}
            columns={[
              {
                title: '字段编码',
                dataIndex: 'fieldCode',
                key: 'fieldCode',
                width: 150,
              },
              {
                title: '字段名称',
                dataIndex: 'fieldName',
                key: 'fieldName',
                width: 150,
              },
              {
                title: '组件类型',
                dataIndex: 'componentType',
                key: 'componentType',
                width: 120,
              },
            ]}
          />
        </Modal>

        {/* 比价维度选择弹框 */}
        <Modal
          title="选择比价维度"
          open={dimensionModalVisible}
          onOk={() => {
            // 将选中的维度添加到analysisDimensions中
            const newDimensions = selectedDimensions.filter(dim => !analysisDimensions.includes(dim));
            setAnalysisDimensions(prev => [...prev, ...newDimensions]);
            setDimensionModalVisible(false);
            setSelectedDimensions([]);
          }}
          onCancel={() => {
            setDimensionModalVisible(false);
            setSelectedDimensions([]);
          }}
          width={800}
        >
          <div style={{ marginBottom: 16 }}>
            <Checkbox
              indeterminate={selectedDimensions.length > 0 && selectedDimensions.length < mockFields.length}
              checked={selectedDimensions.length === mockFields.length}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedDimensions(mockFields.map(field => field.value));
                } else {
                  setSelectedDimensions([]);
                }
              }}
            >
              全选
            </Checkbox>
          </div>
          <Table
            dataSource={mockFields}
            rowKey="value"
            pagination={false}
            size="small"
            rowSelection={{
              type: 'checkbox',
              selectedRowKeys: selectedDimensions,
              onChange: (selectedRowKeys) => {
                setSelectedDimensions(selectedRowKeys as string[]);
              },
            }}
            columns={[
              {
                title: '字段名称',
                dataIndex: 'value',
                key: 'value',
                width: 150,
              },
              {
                title: '字段描述',
                dataIndex: 'label',
                key: 'label',
                width: 200,
              },
              {
                title: '数据类型',
                key: 'type',
                width: 100,
                render: () => 'VARCHAR' // 假设数据类型
              },
            ]}
          />
        </Modal>

        {/* 计算指标编辑Modal */}
        <Modal
          title={editingCalculationIndicator ? '编辑计算指标' : '新增计算指标'}
          open={calculationIndicatorModalVisible}
          onCancel={() => {
            setCalculationIndicatorModalVisible(false);
            setEditingCalculationIndicator(null);
            setBindBaseline('all');
            setFormulaExpression('( ${COMPARE} - ${BASELINE} ) / NULLIF(${BASELINE},0)');
            setFormulaMode('visual');
          }}
          onOk={() => {
            // 这里应该有表单验证和保存逻辑
            const newIndicator: CalculationIndicator = {
              id: editingCalculationIndicator?.id || Date.now().toString(),
              indicatorId: editingCalculationIndicator?.indicatorId || 'ind_diff_rate',
              name: editingCalculationIndicator?.name || '差异率',
              description: editingCalculationIndicator?.description || '协议价相对基准价的差异比例',
              tags: editingCalculationIndicator?.tags || ['价格对比'],
              bindBaseline: editingCalculationIndicator?.bindBaseline || 'all',
              specificBaselines: editingCalculationIndicator?.specificBaselines,
              participantIndicator: editingCalculationIndicator?.participantIndicator || 'ind_agreement_price',
              baselineIndicator: editingCalculationIndicator?.baselineIndicator || 'ind_hist_min',
              formula: editingCalculationIndicator?.formula || '( ${COMPARE} - ${BASELINE} ) / NULLIF(${BASELINE},0)',
              dataType: editingCalculationIndicator?.dataType || 'number',
              unit: editingCalculationIndicator?.unit || '%',
              decimalPlaces: editingCalculationIndicator?.decimalPlaces || 4,
              formatType: editingCalculationIndicator?.formatType || 'percentage',
              nullHandling: editingCalculationIndicator?.nullHandling || 'null',
              customNullValue: editingCalculationIndicator?.customNullValue,
              negativeClipping: editingCalculationIndicator?.negativeClipping || 'none',
              rangeMin: editingCalculationIndicator?.rangeMin,
              rangeMax: editingCalculationIndicator?.rangeMax,
              errorMarking: editingCalculationIndicator?.errorMarking || true,
              enabled: editingCalculationIndicator?.enabled !== undefined ? editingCalculationIndicator.enabled : true,
              versionNote: editingCalculationIndicator?.versionNote || '初始版本'
            };
            
            if (editingCalculationIndicator) {
              // 编辑模式
              const newIndicators = calculationIndicators.map(item => 
                item.id === editingCalculationIndicator.id ? newIndicator : item
              );
              setCalculationIndicators(newIndicators);
            } else {
              // 新增模式
              setCalculationIndicators(prev => [...prev, newIndicator]);
            }
            
            setCalculationIndicatorModalVisible(false);
            setEditingCalculationIndicator(null);
          }}
          okText="保存"
          cancelText="取消"
          width={1000}
          style={{ top: 20 }}
        >
          <div style={{ display: 'flex', gap: '24px', height: '600px' }}>
            {/* 左侧表单区域 */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '12px' }}>
              <Form layout="vertical">
                {/* 基本信息 */}
                <div style={{ marginBottom: '24px' }}>
                  <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>① 基本信息</Text>
                  <div style={{ marginTop: '12px' }}>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item label="指标ID" required>
                          <Input 
                            placeholder="ind_diff_rate" 
                            defaultValue={editingCalculationIndicator?.indicatorId || 'ind_diff_rate'}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="名称" required>
                          <Input 
                            placeholder="差异率" 
                            defaultValue={editingCalculationIndicator?.name || '差异率'}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    
                    <Form.Item label="描述">
                      <TextArea 
                        rows={2} 
                        placeholder="协议价相对基准价的差异比例" 
                        defaultValue={editingCalculationIndicator?.description || '协议价相对基准价的差异比例'}
                      />
                    </Form.Item>
                    
                    <Form.Item label="标签">
                      <Select
                        mode="tags"
                        placeholder="添加标签"
                        defaultValue={editingCalculationIndicator?.tags || ['价格对比']}
                        style={{ width: '100%' }}
                      >
                        <Option value="价格对比">价格对比</Option>
                        <Option value="监控">监控</Option>
                        <Option value="分析">分析</Option>
                      </Select>
                    </Form.Item>
                  </div>
                </div>

                {/* 绑定范围 */}
                 <div style={{ marginBottom: '24px' }}>
                   <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>② 绑定范围</Text>
                   <div style={{ marginTop: '12px' }}>
                     <Row gutter={16}>
                       <Col span={12}>
                         <Form.Item label="绑定基准" required>
                            <Radio.Group 
                              value={bindBaseline}
                              style={{ width: '100%' }}
                              onChange={(e) => {
                                setBindBaseline(e.target.value);
                              }}
                            >
                              <Radio value="all">全部基准</Radio>
                              <Radio value="specific">指定基准</Radio>
                            </Radio.Group>
                          </Form.Item>
                       </Col>
                       <Col span={12}>
                         <Form.Item label="数据类型" required>
                           <Select 
                             defaultValue={editingCalculationIndicator?.dataType || 'number'}
                           >
                             <Option value="number">数值</Option>
                             <Option value="string">文本</Option>
                             <Option value="boolean">布尔</Option>
                           </Select>
                         </Form.Item>
                       </Col>
                     </Row>
                     
                     {/* 当选择指定基准时显示基准选择器 */}
                      {bindBaseline === 'specific' && (
                        <Form.Item label="选择基准" required>
                          <Select
                            mode="multiple"
                            placeholder="请选择要绑定的基准"
                            defaultValue={editingCalculationIndicator?.specificBaselines || []}
                            style={{ width: '100%' }}
                          >
                            <Option value="baseline_hist_min">历史最低价</Option>
                            <Option value="baseline_market_ref">市场参考价</Option>
                            <Option value="baseline_bid_min">中标最低价</Option>
                            <Option value="baseline_avg_price">平均价格</Option>
                          </Select>
                        </Form.Item>
                      )}
                     
                     <Row gutter={16}>
                       <Col span={12}>
                         <Form.Item label="参与侧指标" required>
                           <Select 
                             placeholder="从主数据集原子指标选择"
                             defaultValue={editingCalculationIndicator?.participantIndicator || 'ind_agreement_price'}
                           >
                             <Option value="ind_agreement_price">协议价</Option>
                             <Option value="ind_tax_price">含税价</Option>
                             <Option value="ind_net_price">净价</Option>
                           </Select>
                         </Form.Item>
                       </Col>
                       {bindBaseline === 'specific' && (
                          <Col span={12}>
                            <Form.Item label="基准侧指标" required>
                              <Select 
                                placeholder="从基准候选选择"
                                defaultValue={editingCalculationIndicator?.baselineIndicator || 'ind_hist_min'}
                              >
                                <Option value="ind_hist_min">历史最低</Option>
                                <Option value="ind_market_ref">市场参考</Option>
                                <Option value="ind_bid_min">中标最低</Option>
                              </Select>
                            </Form.Item>
                          </Col>
                        )}
                     </Row>
                   </div>
                 </div>

                {/* 公式编辑 */}
                <div style={{ marginBottom: '24px' }}>
                  <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>③ 拼装公式（点击积木按钮插入）</Text>
                  <div style={{ marginTop: '12px' }}>
                    <Form.Item label="计算方式">
                       <Radio.Group 
                         value={formulaMode} 
                         onChange={(e) => setFormulaMode(e.target.value)}
                         style={{ marginBottom: '12px' }}
                       >
                         <Radio value="visual">可视化编辑</Radio>
                         <Radio value="advanced">高级表达式</Radio>
                       </Radio.Group>
                     </Form.Item>
                    
                    {/* 可视化公式构建器 - 仅在可视化模式显示 */}
                    {formulaMode === 'visual' && (
                      <>
                        <div style={{ 
                          border: '1px solid #d9d9d9', 
                          borderRadius: '6px', 
                          padding: '16px', 
                          backgroundColor: '#fafafa',
                          marginBottom: '12px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span>( </span>
                            <Button 
                              size="small" 
                              style={{ 
                                backgroundColor: '#e6f7ff', 
                                border: '1px solid #91d5ff',
                                color: '#1890ff',
                                borderRadius: '4px'
                              }}
                            >
                              协议价 ▼
                            </Button>
                            <Button 
                              size="small" 
                              style={{ 
                                backgroundColor: '#fff2e8', 
                                border: '1px solid #ffbb96',
                                color: '#fa8c16'
                              }}
                            >
                              -
                            </Button>
                            <Button 
                              size="small" 
                              style={{ 
                                backgroundColor: '#f6ffed', 
                                border: '1px solid #b7eb8f',
                                color: '#52c41a'
                              }}
                            >
                              基准价 ▼
                            </Button>
                            <span> ) ÷ </span>
                            <Button 
                              size="small" 
                              style={{ 
                                backgroundColor: '#f6ffed', 
                                border: '1px solid #b7eb8f',
                                color: '#52c41a'
                              }}
                            >
                              基准价 ▼
                            </Button>
                          </div>
                        </div>
                        
                        {/* 插入按钮组 */}
                        <div style={{ marginBottom: '12px' }}>
                          <Text strong style={{ display: 'block', marginBottom: '8px' }}>插入变量：</Text>
                          <Space wrap>
                            <Button 
                              size="small" 
                              icon={<PlusOutlined />}
                              style={{ backgroundColor: '#e6f7ff', border: '1px solid #91d5ff', color: '#1890ff' }}
                              onClick={() => {
                                setFormulaExpression(prev => prev + ' ${COMPARE}');
                              }}
                            >
                              参与侧指标
                            </Button>
                            <Button 
                              size="small" 
                              icon={<PlusOutlined />}
                              style={{ backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', color: '#52c41a' }}
                              onClick={() => {
                                setFormulaExpression(prev => prev + ' ${BASELINE}');
                              }}
                            >
                              基准侧指标
                            </Button>
                          </Space>
                        </div>
                        
                        <div style={{ marginBottom: '12px' }}>
                          <Text strong style={{ display: 'block', marginBottom: '8px' }}>插入函数：</Text>
                          <Space wrap>
                            <Button 
                              size="small" 
                              style={{ backgroundColor: '#fff1f0', border: '1px solid #ffa39e', color: '#f5222d' }}
                              onClick={() => {
                                setFormulaExpression(prev => prev + ' (${COMPARE} - ${BASELINE})');
                              }}
                            >
                              差异额
                            </Button>
                            <Button 
                              size="small" 
                              style={{ backgroundColor: '#fff1f0', border: '1px solid #ffa39e', color: '#f5222d' }}
                              onClick={() => {
                                setFormulaExpression(prev => prev + ' (${COMPARE} - ${BASELINE}) / NULLIF(${BASELINE}, 0)');
                              }}
                            >
                              差异率
                            </Button>
                            <Button 
                              size="small" 
                              style={{ backgroundColor: '#f9f0ff', border: '1px solid #d3adf7', color: '#722ed1' }}
                              onClick={() => {
                                setFormulaExpression(prev => prev + ' ((${COMPARE} - ${BASELINE}) / NULLIF(${BASELINE}, 0)) * 100');
                              }}
                            >
                              百分比变化
                            </Button>
                            <Button 
                              size="small" 
                              style={{ backgroundColor: '#f9f0ff', border: '1px solid #d3adf7', color: '#722ed1' }}
                              onClick={() => {
                                setFormulaExpression(prev => prev + ' ROUND(${COMPARE}, 2)');
                              }}
                            >
                              四舍五入
                            </Button>
                            <Button 
                              size="small" 
                              style={{ backgroundColor: '#fff7e6', border: '1px solid #ffd591', color: '#fa8c16' }}
                              onClick={() => {
                                setFormulaExpression(prev => prev + ' NULLIF(${BASELINE}, 0)');
                              }}
                            >
                              NULL处理
                            </Button>
                          </Space>
                        </div>
                      </>
                    )}
                    
                    {/* 高级表达式 - 仅在高级模式显示 */}
                    {formulaMode === 'advanced' && (
                      <Form.Item label="高级表达式">
                        <TextArea 
                          rows={4} 
                          placeholder="( ${COMPARE} - ${BASELINE} ) / NULLIF(${BASELINE},0)" 
                          value={formulaExpression}
                          onChange={(e) => setFormulaExpression(e.target.value)}
                          style={{ 
                            fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                            fontSize: '13px',
                            backgroundColor: '#1e1e1e',
                            color: '#d4d4d4',
                            border: '1px solid #3c3c3c'
                          }}
                        />
                      </Form.Item>
                    )}
                    
                    <Alert
                      message="可用变量说明"
                      description={
                        <div>
                          <div><code>${'{COMPARE}'}</code> 代表选择的参与侧指标</div>
                          <div><code>${'{BASELINE}'}</code> 代表选择的基准侧指标（按"绑定基准/别名"替换）</div>
                        </div>
                      }
                      type="info"
                      showIcon
                      style={{ fontSize: '12px' }}
                    />
                  </div>
                </div>

                {/* 格式与显示 */}
                <div style={{ marginBottom: '24px' }}>
                  <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>④ 格式与显示</Text>
                  <div style={{ marginTop: '12px' }}>
                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item label="单位">
                          <Select 
                            placeholder="%" 
                            defaultValue={editingCalculationIndicator?.unit || '%'}
                          >
                            <Option value="%">%</Option>
                            <Option value="CNY">CNY</Option>
                            <Option value="其他">其他</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item label="小数位">
                          <Select 
                            defaultValue={editingCalculationIndicator?.decimalPlaces || 4}
                            style={{ width: '100%' }}
                          >
                            <Option value={0}>0</Option>
                            <Option value={1}>1</Option>
                            <Option value={2}>2</Option>
                            <Option value={3}>3</Option>
                            <Option value={4}>4</Option>
                            <Option value={5}>5</Option>
                            <Option value={6}>6</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item label="格式类型">
                          <Select 
                            defaultValue={editingCalculationIndicator?.formatType || 'percentage'}
                          >
                            <Option value="percentage">百分比</Option>
                            <Option value="currency">货币</Option>
                            <Option value="thousands">千分位</Option>
                            <Option value="none">无格式</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                </div>

                <Form.Item>
                  <Checkbox 
                    defaultChecked={editingCalculationIndicator?.enabled !== false}
                  >
                    启用计算指标
                  </Checkbox>
                </Form.Item>
              </Form>
            </div>
            
            {/* 右侧预览区域 */}
            <div style={{ 
              width: '300px', 
              borderLeft: '1px solid #f0f0f0', 
              paddingLeft: '24px',
              backgroundColor: '#fafafa',
              borderRadius: '6px',
              padding: '16px'
            }}>
              <Text strong style={{ fontSize: '16px', color: '#1890ff', display: 'block', marginBottom: '16px' }}>⑤ 预览</Text>
              
              <div style={{ marginBottom: '16px' }}>
                <Text strong style={{ display: 'block', marginBottom: '8px' }}>公式（业务）：</Text>
                <div style={{ 
                  padding: '8px 12px', 
                  backgroundColor: '#fff', 
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontFamily: 'monospace'
                }}>
                  {formulaExpression.replace(/\$\{COMPARE\}/g, '比价指标').replace(/\$\{BASELINE\}/g, '基准指标')}
                </div>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <Text strong style={{ display: 'block', marginBottom: '8px' }}>公式（SQL）：</Text>
                <div style={{ 
                  padding: '8px 12px', 
                  backgroundColor: '#1e1e1e', 
                  color: '#d4d4d4',
                  border: '1px solid #3c3c3c',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontFamily: 'Monaco, Consolas, monospace'
                }}>
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {formulaExpression
                      .replace(/\$\{COMPARE\}/g, 'a.price')
                      .replace(/\$\{BASELINE\}/g, 'b.price')
                      .split(' ')
                      .map((token, index) => {
                        if (token.includes('NULLIF')) return <span key={index} style={{ color: '#dcdcaa' }}>{token} </span>;
                        if (token.includes('a.price') || token.includes('b.price')) {
                          const parts = token.split('.');
                          return <span key={index}><span style={{ color: '#569cd6' }}>{parts[0]}</span>.<span style={{ color: '#9cdcfe' }}>{parts[1]}</span> </span>;
                        }
                        if (/^\d+$/.test(token)) return <span key={index} style={{ color: '#b5cea8' }}>{token} </span>;
                        return <span key={index} style={{ color: '#d4d4d4' }}>{token} </span>;
                      })
                    }
                  </div>
                </div>
              </div>
              
              <div>
                <Text strong style={{ display: 'block', marginBottom: '8px' }}>样例预览：</Text>
                <Table
                  size="small"
                  pagination={false}
                  dataSource={[
                    { key: 1, product: '产品A', compare: 100, baseline: 90, result: '11.11%' },
                    { key: 2, product: '产品B', compare: 85, baseline: 90, result: '-5.56%' },
                    { key: 3, product: '产品C', compare: 95, baseline: 90, result: '5.56%' }
                  ]}
                  columns={[
                    { title: '产品', dataIndex: 'product', width: 60 },
                    { title: '协议价', dataIndex: 'compare', width: 60 },
                    { title: '基准价', dataIndex: 'baseline', width: 60 },
                    { title: '差异率', dataIndex: 'result', width: 60 }
                  ]}
                  style={{ fontSize: '12px' }}
                />
              </div>
            </div>
          </div>
        </Modal>

      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>比价模型2管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateNew}>
          新建模型
        </Button>
      </div>

      <Card title="模型列表">
        <Table
          dataSource={models}
          rowKey="id"
          pagination={false}
          scroll={{ x: 800 }}
          columns={[
            {
              title: '模型名称',
              dataIndex: 'modelName',
              key: 'modelName',
              width: 200,
              ellipsis: true,
              render: (text: string, record: PriceModel2) => (
                <Button 
                  type="link" 
                  style={{ padding: 0, height: 'auto', fontWeight: 500 }}
                  onClick={() => handleEdit(record)}
                >
                  {text}
                </Button>
              ),
            },
            {
              title: '模型编码',
              dataIndex: 'modelCode',
              key: 'modelCode',
              width: 180,
              ellipsis: true,
            },
            {
              title: '标签',
              dataIndex: 'tags',
              key: 'tags',
              width: 200,
              render: (tags: string[]) => (
                <>
                  {tags?.map(tag => (
                    <Tag key={tag} color="blue" style={{ marginBottom: 4 }}>
                      {tag}
                    </Tag>
                  ))}
                </>
              ),
            },
            {
              title: '启用状态',
              dataIndex: 'enabled',
              key: 'enabled',
              width: 100,
              render: (enabled: boolean) => (
                <Tag color={enabled ? 'green' : 'default'}>
                  {enabled ? '启用' : '停用'}
                </Tag>
              ),
            },
            {
              title: '操作',
              key: 'action',
              width: 150,
              render: (_, record: PriceModel2) => (
                <Space size="small">
                  <Button type="link" size="small" onClick={() => handleEdit(record)}>
                    编辑
                  </Button>
                  <Button type="link" size="small">
                    复制
                  </Button>
                  <Button type="link" size="small" danger>
                    删除
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default PriceModel2Management;