import React, { useState } from 'react';
import { Button, Input, Select, Table, Card, Modal, Badge, Tag, Typography, Form, Space, Steps } from 'antd';
import { Plus, Edit, Trash2, Eye, Copy } from 'lucide-react';

const { TextArea } = Input;
const { Option } = Select;
const { Text, Title } = Typography;
const { Step } = Steps;

interface PriceScheme {
  id: string;
  planCode: string;
  planName: string;
  description: string;
  modelId: string;
  modelName: string;
  status: 'active' | 'inactive' | 'draft';
  createTime: string;
  createUser: string;
  ownerId: string;
  isTemplate: boolean;
}

interface PriceModel {
  id: string;
  code: string;
  name: string;
  description: string;
}

const PriceSchemeManagement: React.FC = () => {
  const [schemes, setSchemes] = useState<PriceScheme[]>([
    {
      id: '1',
      planCode: 'PLAN_20250806_MED001',
      planName: '同产品供应商采购价分析模型',
      description: '对公司主要采购的医疗耗材，与历史、协议、阳光价进行比对分析',
      modelId: 'model_med_001',
      modelName: '同产品供应商采购价分析模型',
      status: 'active',
      createTime: '2024-01-15 10:30:00',
      createUser: '个人',
      ownerId: 'user_101',
      isTemplate: false
    },
    {
      id: '2',
      planCode: 'PLAN_20250805_IT001',
      planName: '同类产品供应商采购价分析模型',
      description: '同类产品供应商采购价分析模型',
      modelId: 'model_it_001',
      modelName: '同类产品供应商采购价分析模型',
      status: 'draft',
      createTime: '2024-01-14 09:15:00',
      createUser: '草稿',
      ownerId: 'user_102',
      isTemplate: true
    }
  ]);

  const [priceModels] = useState<PriceModel[]>([
    { id: 'model_med_001', code: 'MED_MODEL_001', name: '同产品供应商采购价分析模型', description: '同类产品供应商采购价分析数据集' },
    { id: 'model_it_001', code: 'IT_MODEL_001', name: '同类产品供应商采购价分析模型', description: '同类产品供应商采购价分析数据集' }
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [editingScheme, setEditingScheme] = useState<PriceScheme | null>(null);

  // 步骤一：基本信息
  const [basicInfo, setBasicInfo] = useState({
    planName: '',
    planCode: '',
    description: ''
  });

  // 步骤二：选择比价对象
  const [comparisonObjects, setComparisonObjects] = useState({
    modelId: '',
    selectedComparisonObjects: [] as string[],
    selectedAnalysisIndicators: [] as string[],
    selectedAnalysisObjects: [] as string[],
    selectedAnalysisDimensions: [] as string[],
    selectedQueryConditions: [] as string[]
  });

  // 步骤三：配置基准对象
  const [baselineConfig, setBaselineConfig] = useState({
    selectedBaselineIndicators: [] as string[],
    selectedBaselineDimensions: [] as string[],
    selectedBaselineQueryConditions: [] as string[]
  });

  // 获取基准配置选项（模拟从比价模型中获取）
  const getBaselineOptions = (modelId: string) => {
    if (!modelId) return { 
      baselineIndicators: [],
      baselineDimensions: [],
      baselineQueryConditions: []
    };
    
    // 模拟根据模型ID返回基准配置选项
    return {
      baselineIndicators: [
        { id: 'baseline1', name: '基准指标:集团最高价' },
        { id: 'baseline2', name: '基准指标:集团最低价' },
        { id: 'baseline3', name: '基准指标:集团平均价' },
        { id: 'baseline4', name: '基准指标:供应商报价' }
      ],
      baselineDimensions: [
        { id: 'bdim1', name: '管理组织' },
        { id: 'bdim2', name: '供应商' },
        { id: 'bdim3', name: '采购组织' },
        { id: 'bdim4', name: '采购模式' }
      ],
      baselineQueryConditions: [
        { id: 'bcond1', name: '协议编号' },
        { id: 'bcond2', name: '管理组织' },
        { id: 'bcond3', name: '采购组织' },
        { id: 'bcond4', name: '采购模式' },
        { id: 'bcond5', name: '供应商' },
        { id: 'bcond6', name: '产品' },
        { id: 'bcond7', name: '签约日期' },
        { id: 'bcond8', name: '生效日期' }
      ]
    };
  };





  // 模型配置的各种选项（模拟从选中的比价模型中获取）
  const getModelOptions = (modelId: string) => {
    if (!modelId) return {
      comparisonObjects: [],
      analysisIndicators: [],
      analysisObjects: [],
      analysisDimensions: [],
      queryConditions: []
    };
    
    // 模拟根据模型ID返回不同的配置选项
    return {
      comparisonObjects: [
        { id: 'obj1', name: '产品' },
        { id: 'obj2', name: '供应商' }
      ],
      analysisIndicators: [
        { id: 'ind1', name: '协议价(含税)' },
        { id: 'ind2', name: '协议价(不含税)' },
        { id: 'ind3', name: '税率' }
      ],
      analysisObjects: [
        { id: 'aobj1', name: '供应商' },
        { id: 'aobj2', name: '采购组织' },
        { id: 'aobj3', name: '采购模式' }
      ],
      analysisDimensions: [
        { id: 'dim1', name: '管理组织' },
        { id: 'dim2', name: '供应商' },
        { id: 'dim3', name: '采购组织' },
        { id: 'dim4', name: '采购模式' }
      ],
      queryConditions: [
        { id: 'cond1', name: '协议编号' },
        { id: 'cond2', name: '管理组织' },
        { id: 'cond2', name: '采购组织' },
        { id: 'cond3', name: '采购模式' },
        { id: 'cond4', name: '供应商' },
        { id: 'cond5', name: '产品' },
        { id: 'cond6', name: '签约日期' },
        { id: 'cond7', name: '生效日期' }
      ]
    };
  };



  const handleCreate = () => {
    setEditingScheme(null);
    setCurrentStep(0);
    setBasicInfo({ planName: '', planCode: '', description: '' });
    setComparisonObjects({ 
      modelId: '', 
      selectedComparisonObjects: [],
      selectedAnalysisIndicators: [],
      selectedAnalysisObjects: [],
      selectedAnalysisDimensions: [],
      selectedQueryConditions: []
    });
    setBaselineConfig({ 
      selectedBaselineIndicators: [],
      selectedBaselineDimensions: [],
      selectedBaselineQueryConditions: []
    });
    form.resetFields();
    setShowCreateModal(true);
  };

  const handleEdit = (scheme: PriceScheme) => {
    setEditingScheme(scheme);
    setCurrentStep(0);
    setBasicInfo({
      planName: scheme.planName,
      planCode: scheme.planCode,
      description: scheme.description
    });
    form.setFieldsValue({
      planName: scheme.planName,
      planCode: scheme.planCode,
      description: scheme.description
    });
    setShowCreateModal(true);
  };

  const handleNextStep = () => {
    if (currentStep === 0) {
      form.validateFields().then(values => {
        setBasicInfo(values);
        setCurrentStep(1);
      });
    } else if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    const newScheme: PriceScheme = {
      id: editingScheme?.id || Date.now().toString(),
      planCode: basicInfo.planCode,
      planName: basicInfo.planName,
      description: basicInfo.description,
      modelId: comparisonObjects.modelId,
      modelName: priceModels.find(m => m.id === comparisonObjects.modelId)?.name || '',
      status: 'active',
      createTime: editingScheme?.createTime || new Date().toLocaleString(),
      createUser: editingScheme?.createUser || '个人',
      ownerId: 'user_101',
      isTemplate: false
    };

    if (editingScheme) {
      setSchemes(prev => prev.map(s => s.id === editingScheme.id ? newScheme : s));
    } else {
      setSchemes(prev => [...prev, newScheme]);
    }

    setShowCreateModal(false);
    setCurrentStep(0);
  };

  const handleDelete = (id: string) => {
    setSchemes(prev => prev.filter(s => s.id !== id));
  };

  const handleView = (scheme: PriceScheme) => {
    // 查看详情逻辑
    console.log('查看方案详情:', scheme);
  };

  const handleDisable = (scheme: PriceScheme) => {
    const newStatus = scheme.status === 'active' ? 'inactive' : 'active';
    setSchemes(prev => prev.map(s => 
      s.id === scheme.id ? { ...s, status: newStatus } : s
    ));
  };

  const handleCopy = (scheme: PriceScheme) => {
    const newScheme: PriceScheme = {
      ...scheme,
      id: Date.now().toString(),
      planCode: scheme.planCode + '_COPY',
      planName: scheme.planName + '_副本',
      createTime: new Date().toLocaleString(),
      createUser: '个人',
      status: 'draft'
    };
    setSchemes(prev => [...prev, newScheme]);
  };

  const columns = [
    {
      title: '方案编码',
      dataIndex: 'planCode',
      key: 'planCode',
      ellipsis: true,
    },
    {
      title: '方案名称',
      dataIndex: 'planName',
      key: 'planName',
      ellipsis: true,
      render: (text: string, record: PriceScheme) => (
        <Button 
          type="link" 
          style={{ padding: 0, height: 'auto', textAlign: 'left', whiteSpace: 'normal', wordBreak: 'break-word' }}
          onClick={() => handleView(record)}
        >
          {text}
        </Button>
      ),
    },
    {
      title: '关联模型',
      dataIndex: 'modelName',
      key: 'modelName',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => {
        const statusConfig = {
          active: { color: 'green', text: '启用' },
          inactive: { color: 'red', text: '停用' },
          draft: { color: 'orange', text: '草稿' }
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return <Badge color={config.color} text={config.text} />;
      },
    },
    {
      title: '是否模板',
      dataIndex: 'isTemplate',
      key: 'isTemplate',
      width: 90,
      render: (isTemplate: boolean) => (
        <Tag color={isTemplate ? 'blue' : 'default'}>
          {isTemplate ? '模板' : '个人'}
        </Tag>
      ),
    },
    {
      title: '创建人',
      dataIndex: 'createUser',
      key: 'createUser',
      width: 80,
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 140,
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: PriceScheme) => (
        <Space size="small">
          <Button 
            type="link" 
            size="small" 
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button 
            type="link" 
            size="small" 
            onClick={() => handleDisable(record)}
          >
            {record.status === 'active' ? '停用' : '启用'}
          </Button>
          <Button 
            type="link" 
            size="small" 
            onClick={() => handleCopy(record)}
          >
            复制
          </Button>
          <Button 
            type="link" 
            size="small" 
            danger 
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div style={{ padding: '24px' }}>
            <Form form={form} layout="vertical">
              <Form.Item
                name="planName"
                label={<span><span style={{ color: 'red' }}>*</span> 方案名称:</span>}
                rules={[{ required: true, message: '请输入方案名称' }]}
              >
                <Input 
                  placeholder="医疗器械-核心耗材采购价分析..." 
                  value={basicInfo.planName}
                  onChange={(e) => setBasicInfo(prev => ({ ...prev, planName: e.target.value }))}
                />
              </Form.Item>
              
              <Form.Item
                name="planCode"
                label={<span><span style={{ color: 'red' }}>*</span> 方案编码:</span>}
                rules={[{ required: true, message: '请输入方案编码' }]}
              >
                <Input 
                  placeholder="PLAN_20250806_MED001" 
                  value={basicInfo.planCode}
                  onChange={(e) => setBasicInfo(prev => ({ ...prev, planCode: e.target.value }))}
                />
              </Form.Item>
              
              <Form.Item
                name="description"
                label="方案描述:"
              >
                <TextArea 
                  rows={4} 
                  placeholder="多行文本框，对公司主要采购的医疗耗材进行综合对标分析..." 
                  value={basicInfo.description}
                  onChange={(e) => setBasicInfo(prev => ({ ...prev, description: e.target.value }))}
                />
              </Form.Item>
            </Form>
          </div>
        );
      
      case 1:
        const modelOptions = getModelOptions(comparisonObjects.modelId);
        
        return (
          <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: 24 }}>
              {/* 选择比价模型 */}
              <div style={{ marginBottom: 24 }}>
                <Text strong><span style={{ color: 'red' }}>*</span> 选择比价模型:</Text>
                <Select
                  style={{ width: '100%', marginTop: 8 }}
                  placeholder="医疗器械核心耗材比价模型"
                  value={comparisonObjects.modelId}
                  onChange={(value) => {
                    setComparisonObjects({
                      modelId: value,
                      selectedComparisonObjects: [],
                      selectedAnalysisIndicators: [],
                      selectedAnalysisObjects: [],
                      selectedAnalysisDimensions: [],
                      selectedQueryConditions: []
                    });
                  }}
                >
                  {priceModels.map(model => (
                    <Option key={model.id} value={model.id}>
                      {model.name}
                    </Option>
                  ))}
                </Select>
                <div style={{ color: '#666', fontSize: '12px', marginTop: 4 }}>
                  (说明：选择后，下方所有可选的指标和维度都将由此模型决定)
                </div>
              </div>

              {/* 当选择了比价模型后，显示其他选项 */}
              {comparisonObjects.modelId && (
                <>
                  {/* 比价对象 */}
                  <div style={{ marginBottom: 16 }}>
                    <Text strong><span style={{ color: 'red' }}>*</span> 比价对象:</Text>
                    <div style={{ marginTop: 8, border: '1px solid #d9d9d9', borderRadius: 6, padding: 12, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px 10px' }}>
                      {modelOptions.comparisonObjects.map(obj => (
                        <div key={obj.id} style={{ display: 'flex', alignItems: 'center' }}>
                          <input
                            type="checkbox"
                            id={`comp-obj-${obj.id}`}
                            checked={comparisonObjects.selectedComparisonObjects.includes(obj.id)}
                            onChange={(e) => {
                              const newSelected = e.target.checked
                                ? [...comparisonObjects.selectedComparisonObjects, obj.id]
                                : comparisonObjects.selectedComparisonObjects.filter(id => id !== obj.id);
                              setComparisonObjects(prev => ({ ...prev, selectedComparisonObjects: newSelected }));
                            }}
                            style={{ marginRight: 8 }}
                          />
                          <label htmlFor={`comp-obj-${obj.id}`}>{obj.name}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 分析指标 */}
                  <div style={{ marginBottom: 16 }}>
                    <Text strong><span style={{ color: 'red' }}>*</span> 分析指标:</Text>
                    <div style={{ marginTop: 8, border: '1px solid #d9d9d9', borderRadius: 6, padding: 12, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px 10px' }}>
                      {modelOptions.analysisIndicators.map(indicator => (
                        <div key={indicator.id} style={{ display: 'flex', alignItems: 'center' }}>
                          <input
                            type="checkbox"
                            id={`analysis-ind-${indicator.id}`}
                            checked={comparisonObjects.selectedAnalysisIndicators.includes(indicator.id)}
                            onChange={(e) => {
                              const newSelected = e.target.checked
                                ? [...comparisonObjects.selectedAnalysisIndicators, indicator.id]
                                : comparisonObjects.selectedAnalysisIndicators.filter(id => id !== indicator.id);
                              setComparisonObjects(prev => ({ ...prev, selectedAnalysisIndicators: newSelected }));
                            }}
                            style={{ marginRight: 8 }}
                          />
                          <label htmlFor={`analysis-ind-${indicator.id}`}>{indicator.name}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 分析对象 */}
                  <div style={{ marginBottom: 16 }}>
                    <Text strong><span style={{ color: 'red' }}>*</span> 分析对象:</Text>
                    <div style={{ marginTop: 8, border: '1px solid #d9d9d9', borderRadius: 6, padding: 12, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px 10px' }}>
                      {modelOptions.analysisObjects.map(obj => (
                        <div key={obj.id} style={{ display: 'flex', alignItems: 'center' }}>
                          <input
                            type="checkbox"
                            id={`analysis-obj-${obj.id}`}
                            checked={comparisonObjects.selectedAnalysisObjects.includes(obj.id)}
                            onChange={(e) => {
                              const newSelected = e.target.checked
                                ? [...comparisonObjects.selectedAnalysisObjects, obj.id]
                                : comparisonObjects.selectedAnalysisObjects.filter(id => id !== obj.id);
                              setComparisonObjects(prev => ({ ...prev, selectedAnalysisObjects: newSelected }));
                            }}
                            style={{ marginRight: 8 }}
                          />
                          <label htmlFor={`analysis-obj-${obj.id}`}>{obj.name}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 分析维度 */}
                  <div style={{ marginBottom: 16 }}>
                    <Text strong><span style={{ color: 'red' }}>*</span> 分析维度:</Text>
                    <div style={{ marginTop: 8, border: '1px solid #d9d9d9', borderRadius: 6, padding: 12, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px 10px' }}>
                      {modelOptions.analysisDimensions.map(dim => (
                        <div key={dim.id} style={{ display: 'flex', alignItems: 'center' }}>
                          <input
                            type="checkbox"
                            id={`analysis-dim-${dim.id}`}
                            checked={comparisonObjects.selectedAnalysisDimensions.includes(dim.id)}
                            onChange={(e) => {
                              const newSelected = e.target.checked
                                ? [...comparisonObjects.selectedAnalysisDimensions, dim.id]
                                : comparisonObjects.selectedAnalysisDimensions.filter(id => id !== dim.id);
                              setComparisonObjects(prev => ({ ...prev, selectedAnalysisDimensions: newSelected }));
                            }}
                            style={{ marginRight: 8 }}
                          />
                          <label htmlFor={`analysis-dim-${dim.id}`}>{dim.name}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 查询条件 */}
                  <div style={{ marginBottom: 16 }}>
                    <Text strong><span style={{ color: 'red' }}>*</span> 查询条件:</Text>
                    <div style={{ marginTop: 8, border: '1px solid #d9d9d9', borderRadius: 6, padding: 12, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px 10px' }}>
                      {modelOptions.queryConditions.map(cond => (
                        <div key={cond.id} style={{ display: 'flex', alignItems: 'center' }}>
                          <input
                            type="checkbox"
                            id={`query-cond-${cond.id}`}
                            checked={comparisonObjects.selectedQueryConditions.includes(cond.id)}
                            onChange={(e) => {
                              const newSelected = e.target.checked
                                ? [...comparisonObjects.selectedQueryConditions, cond.id]
                                : comparisonObjects.selectedQueryConditions.filter(id => id !== cond.id);
                              setComparisonObjects(prev => ({ ...prev, selectedQueryConditions: newSelected }));
                            }}
                            style={{ marginRight: 8 }}
                          />
                          <label htmlFor={`query-cond-${cond.id}`}>{cond.name}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      
      case 2:
        const baselineOptions = getBaselineOptions(comparisonObjects.modelId);
        
        return (
          <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: 24 }}>
              <Text strong><span style={{ color: 'red' }}>*</span> 配置基准对象:</Text>
              <div style={{ color: '#666', fontSize: '12px', marginTop: 4, marginBottom: 16 }}>
                (说明：根据比价模型中选择的基准指标、基准维度和基准查询条件，选择具体用于比对的项)
              </div>
              
              {comparisonObjects.modelId ? (
                <div>
                  {baselineOptions.baselineIndicators.map(indicator => (
                    <Card key={indicator.id} style={{ marginBottom: 16 }} size="small">
                      <div style={{ marginBottom: 16 }}>
                        <input
                          type="checkbox"
                          id={`baseline-${indicator.id}`}
                          checked={baselineConfig.selectedBaselineIndicators.includes(indicator.id)}
                          onChange={(e) => {
                            const newSelected = e.target.checked
                              ? [...baselineConfig.selectedBaselineIndicators, indicator.id]
                              : baselineConfig.selectedBaselineIndicators.filter(id => id !== indicator.id);
                            setBaselineConfig(prev => ({ 
                              ...prev, 
                              selectedBaselineIndicators: newSelected 
                            }));
                          }}
                          style={{ marginRight: 8 }}
                        />
                        <label htmlFor={`baseline-${indicator.id}`} style={{ fontWeight: 'bold', fontSize: '14px' }}>
                          {indicator.name}
                        </label>
                      </div>

                      {/* 该基准指标对应的基准维度 */}
                      <div style={{ marginBottom: 16 }}>
                        <Text strong style={{ fontSize: '13px' }}>基准维度:</Text>
                        <div style={{ color: '#666', fontSize: '12px', marginBottom: 8 }}>
                          (说明：选择用于基准比对的维度)
                        </div>
                        <div style={{ border: '1px solid #f0f0f0', borderRadius: 4, padding: 8, backgroundColor: '#fafafa', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px 10px' }}>
                          {baselineOptions.baselineDimensions.map(dimension => (
                            <div key={`${indicator.id}-${dimension.id}`} style={{ display: 'flex', alignItems: 'center' }}>
                              <input
                                type="checkbox"
                                id={`baseline-${indicator.id}-dim-${dimension.id}`}
                                checked={baselineConfig.selectedBaselineDimensions.includes(`${indicator.id}-${dimension.id}`)}
                                onChange={(e) => {
                                  const itemId = `${indicator.id}-${dimension.id}`;
                                  const newSelected = e.target.checked
                                    ? [...baselineConfig.selectedBaselineDimensions, itemId]
                                    : baselineConfig.selectedBaselineDimensions.filter(id => id !== itemId);
                                  setBaselineConfig(prev => ({ 
                                    ...prev, 
                                    selectedBaselineDimensions: newSelected 
                                  }));
                                }}
                                style={{ marginRight: 8 }}
                              />
                              <label htmlFor={`baseline-${indicator.id}-dim-${dimension.id}`} style={{ fontSize: '12px' }}>
                                {dimension.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 该基准指标对应的基准查询条件 */}
                      <div>
                        <Text strong style={{ fontSize: '13px' }}>基准查询条件:</Text>
                        <div style={{ color: '#666', fontSize: '12px', marginBottom: 8 }}>
                          (说明：选择用于基准数据查询的条件)
                        </div>
                        <div style={{ border: '1px solid #f0f0f0', borderRadius: 4, padding: 8, backgroundColor: '#fafafa', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px 10px' }}>
                          {baselineOptions.baselineQueryConditions.map(condition => (
                            <div key={`${indicator.id}-${condition.id}`} style={{ display: 'flex', alignItems: 'center' }}>
                              <input
                                type="checkbox"
                                id={`baseline-${indicator.id}-cond-${condition.id}`}
                                checked={baselineConfig.selectedBaselineQueryConditions.includes(`${indicator.id}-${condition.id}`)}
                                onChange={(e) => {
                                  const itemId = `${indicator.id}-${condition.id}`;
                                  const newSelected = e.target.checked
                                    ? [...baselineConfig.selectedBaselineQueryConditions, itemId]
                                    : baselineConfig.selectedBaselineQueryConditions.filter(id => id !== itemId);
                                  setBaselineConfig(prev => ({ 
                                    ...prev, 
                                    selectedBaselineQueryConditions: newSelected 
                                  }));
                                }}
                                style={{ marginRight: 8 }}
                              />
                              <label htmlFor={`baseline-${indicator.id}-cond-${condition.id}`} style={{ fontSize: '12px' }}>
                                {condition.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div style={{ color: '#999', fontStyle: 'italic' }}>
                  请先在上一步选择比价模型
                </div>
              )}
            </div>
          </div>
        );
      

      
      default:
        return null;
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>比价方案管理</Title>
          <Text type="secondary">管理和配置比价分析方案</Text>
        </div>
        <Space>
          <Button type="primary" icon={<Plus size={16} />} onClick={handleCreate}>
            新建方案
          </Button>
        </Space>
      </div>

      <Card>
        <div style={{ marginBottom: '16px', display: 'flex', gap: '16px' }}>
          <Input.Search
            placeholder="搜索方案名称或编码"
            style={{ width: 300 }}
            allowClear
          />
          <Select placeholder="选择状态" style={{ width: 120 }} allowClear>
            <Option value="active">启用</Option>
            <Option value="inactive">停用</Option>
            <Option value="draft">草稿</Option>
          </Select>
          <Select placeholder="选择类型" style={{ width: 120 }} allowClear>
            <Option value="template">模板</Option>
            <Option value="personal">个人</Option>
          </Select>
        </div>

        <Table
          columns={columns}
          dataSource={schemes}
          rowKey="id"
          scroll={{ x: 'max-content' }}
          pagination={{
            total: schemes.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      <Modal
        title={editingScheme ? '编辑比价方案' : '创建比价方案'}
        open={showCreateModal}
        onCancel={() => setShowCreateModal(false)}
        width={800}
        footer={null}
      >
        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          <Step title="基本信息" description="方案基本信息" />
          <Step title="选择比价对象" description="设置分析范围" />
          <Step title="配置基准对象" description="配置基准指标" />
        </Steps>

        <div style={{ minHeight: 400 }}>
          {renderStepContent()}
        </div>

        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <Space>
            {currentStep > 0 && (
              <Button onClick={handlePrevStep}>
                上一步
              </Button>
            )}
            {currentStep < 2 ? (
              <Button type="primary" onClick={handleNextStep}>
                下一步
              </Button>
            ) : (
              <Space>
                <Button type="primary" onClick={handleFinish}>
                  完成并执行分析
                </Button>
                <Button onClick={handleFinish}>
                  保存方案
                </Button>
              </Space>
            )}
          </Space>
        </div>
      </Modal>
    </div>
  );
};

export default PriceSchemeManagement;