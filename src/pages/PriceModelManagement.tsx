import React, { useState } from 'react';
import {
  Card,
  Button,
  Input,
  Select,
  Form,
  Space,
  Table,
  Row,
  Col,
  Typography,
  message,
  Radio,
  Checkbox,
  Tag,
  Tooltip,
  Modal,
  Tabs,
} from 'antd';
import {
  Plus,
  Trash2,
  Edit,
  Eye,
  Copy,
  Database,
  Settings,
  ArrowLeft,
} from 'lucide-react';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// --- Mock Data Interfaces ---
interface Dataset {
  id: string;
  name: string;
  fields: DatasetField[];
}

interface DatasetField {
  physicalName: string;
  businessName: string;
  fieldType: '指标' | '维度' | '属性' | '普通字段';
  componentType: '文本框' | '下拉框' | '弹框单选' | '弹框多选' | '时间格式' | '日期格式';
}

interface AnalysisConfig {
  selectedDatasetId: string;
  comparisonObjectFields: string[];
  analysisIndicatorFields: string[];
  analysisObjectFields: string[];
  analysisDimensionFields: string[];
  queryConditionFields: string[];
}

interface BaselineIndicatorConfig {
  id: string;
  baselineIndicatorId: string;
  baselineDimensionField: string;
  baselineQueryConditionField: string;
}

interface BaselineConfig {
  baselineIndicators: BaselineIndicatorConfig[];
}

interface PriceModel {
  modelId?: string;
  modelCode: string;
  modelName: string;
  description: string;
  analysisConfig: AnalysisConfig;
  baselineConfig: BaselineConfig;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  status?: 'active' | 'inactive' | 'draft';
}

interface Indicator {
  id: string;
  name: string;
}

// --- Mock Data ---
const mockDatasets: Dataset[] = [
  {
    id: 'dwd_agreement',
    name: 'DWD层-采购协议表',
    fields: [
      { physicalName: 'supplier_name', businessName: '供应商', fieldType: '维度', componentType: '弹框单选' },
      { physicalName: 'product_name', businessName: '产品', fieldType: '维度', componentType: '弹框多选' },
      { physicalName: 'org_name', businessName: '采购组织', fieldType: '维度', componentType: '下拉框' },
      { physicalName: 'agreement_price', businessName: '协议价(含税)', fieldType: '指标', componentType: '文本框' },
      { physicalName: 'agreement_qty', businessName: '协议数量', fieldType: '指标', componentType: '文本框' },
      { physicalName: 'brand_name', businessName: '品牌', fieldType: '属性', componentType: '下拉框' },
      { physicalName: 'agreement_code', businessName: '协议编号', fieldType: '普通字段', componentType: '文本框' },
    ],
  },
  {
    id: 'dwd_order_detail',
    name: '采购订单明细',
    fields: [
      { physicalName: 'order_no', businessName: '订单号', fieldType: '普通字段', componentType: '文本框' },
      { physicalName: 'supplier_name', businessName: '供应商', fieldType: '维度', componentType: '弹框单选' },
      { physicalName: 'product_name', businessName: '产品', fieldType: '维度', componentType: '弹框多选' },
      { physicalName: 'order_price', businessName: '订单价格', fieldType: '指标', componentType: '文本框' },
      { physicalName: 'order_qty', businessName: '订单数量', fieldType: '指标', componentType: '文本框' },
    ],
  },
  {
    id: 'dwd_receipt_detail',
    name: '历史采购入库明细',
    fields: [
      { physicalName: 'receipt_no', businessName: '入库单号', fieldType: '普通字段', componentType: '文本框' },
      { physicalName: 'supplier_name', businessName: '供应商', fieldType: '维度', componentType: '弹框单选' },
      { physicalName: 'product_name', businessName: '产品', fieldType: '维度', componentType: '弹框多选' },
      { physicalName: 'receipt_price', businessName: '入库价格', fieldType: '指标', componentType: '文本框' },
      { physicalName: 'receipt_qty', businessName: '入库数量', fieldType: '指标', componentType: '文本框' },
    ],
  },
];

const mockIndicators: Indicator[] = [
  { id: 'p001', name: '协议价(含税)(P001)' },
  { id: 'n001', name: '协议数量(N001)' },
  { id: 'h001', name: '历史订单均价(H001)' },
  { id: 'h002', name: '历史入库均价(H002)' },
  { id: 'g001', name: '集团指导价(G001)' },
];

const PriceModelManagement: React.FC = () => {
  const [isListView, setIsListView] = useState(true);
  const [form] = Form.useForm<PriceModel>();
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [baselineIndicators, setBaselineIndicators] = useState<BaselineIndicatorConfig[]>([]);
  const [datasetSelectVisible, setDatasetSelectVisible] = useState(false);
  const [fieldSelectVisible, setFieldSelectVisible] = useState(false);
  const [indicatorSelectVisible, setIndicatorSelectVisible] = useState(false);
  const [selectedDatasetRows, setSelectedDatasetRows] = useState<string[]>([]);
  const [selectedFieldRows, setSelectedFieldRows] = useState<string[]>([]);
  const [selectedIndicatorRows, setSelectedIndicatorRows] = useState<string[]>([]);
  const [comparisonObjectFields, setComparisonObjectFields] = useState<string[]>([]);
  const [analysisIndicatorFields, setAnalysisIndicatorFields] = useState<string[]>([]);
  const [analysisObjectFields, setAnalysisObjectFields] = useState<string[]>([]);
  const [analysisDimensionFields, setAnalysisDimensionFields] = useState<string[]>([]);
  const [queryConditionFields, setQueryConditionFields] = useState<string[]>([]);
  const [baselineDimensionFields, setBaselineDimensionFields] = useState<string[]>([]);
  const [baselineQueryConditionFields, setBaselineQueryConditionFields] = useState<string[]>([]);
  const [currentFieldType, setCurrentFieldType] = useState<string>('');
  const [currentBaselineIndex, setCurrentBaselineIndex] = useState<number>(-1);
  const [activeTab, setActiveTab] = useState<string>('analysis');

  const handleSelectDataset = (datasetId: string) => {
    const selected = mockDatasets.find(d => d.id === datasetId);
    setSelectedDataset(selected || null);
    form.setFieldsValue({ 
      analysisConfig: { 
        ...form.getFieldValue('analysisConfig'),
        selectedDatasetId: datasetId 
      } 
    });
    setDatasetSelectVisible(false);
  };

  const handleFieldSelect = (fieldName: string) => {
    const field = selectedDataset?.fields.find(f => f.physicalName === fieldName);
    if (!field) return;

    switch (currentFieldType) {
      case 'comparisonObjectFields':
        if (!comparisonObjectFields.includes(fieldName)) {
          setComparisonObjectFields([...comparisonObjectFields, fieldName]);
        }
        break;
      case 'analysisIndicatorFields':
        if (!analysisIndicatorFields.includes(fieldName)) {
          setAnalysisIndicatorFields([...analysisIndicatorFields, fieldName]);
        }
        break;
      case 'analysisObjectFields':
        if (!analysisObjectFields.includes(fieldName)) {
          setAnalysisObjectFields([...analysisObjectFields, fieldName]);
        }
        break;
      case 'analysisDimensionFields':
        if (!analysisDimensionFields.includes(fieldName)) {
          setAnalysisDimensionFields([...analysisDimensionFields, fieldName]);
        }
        break;
      case 'queryConditionFields':
        if (!queryConditionFields.includes(fieldName)) {
          setQueryConditionFields([...queryConditionFields, fieldName]);
        }
        break;
      case 'baselineDimensionFields':
        if (!baselineDimensionFields.includes(fieldName)) {
          setBaselineDimensionFields([...baselineDimensionFields, fieldName]);
        }
        break;
      case 'baselineQueryConditionFields':
        if (!baselineQueryConditionFields.includes(fieldName)) {
          setBaselineQueryConditionFields([...baselineQueryConditionFields, fieldName]);
        }
        break;
    }
    message.success(`已添加字段: ${field.businessName}`);
  };

  const removeField = (fieldName: string, fieldType: string) => {
    switch (fieldType) {
      case 'comparisonObjectFields':
        setComparisonObjectFields(comparisonObjectFields.filter(f => f !== fieldName));
        break;
      case 'analysisIndicatorFields':
        setAnalysisIndicatorFields(analysisIndicatorFields.filter(f => f !== fieldName));
        break;
      case 'analysisObjectFields':
        setAnalysisObjectFields(analysisObjectFields.filter(f => f !== fieldName));
        break;
      case 'analysisDimensionFields':
        setAnalysisDimensionFields(analysisDimensionFields.filter(f => f !== fieldName));
        break;
      case 'queryConditionFields':
        setQueryConditionFields(queryConditionFields.filter(f => f !== fieldName));
        break;
      case 'baselineDimensionFields':
        setBaselineDimensionFields(baselineDimensionFields.filter(f => f !== fieldName));
        break;
      case 'baselineQueryConditionFields':
        setBaselineQueryConditionFields(baselineQueryConditionFields.filter(f => f !== fieldName));
        break;
    }
  };

  const getFieldDisplayName = (fieldName: string) => {
    const field = selectedDataset?.fields.find(f => f.physicalName === fieldName);
    return field ? field.businessName : fieldName;
  };

  const renderFieldTags = (fields: string[], fieldType: string, label: string) => {
    return (
      <div style={{ minHeight: 32, padding: 8, border: '1px dashed #d9d9d9', borderRadius: 6, backgroundColor: '#fafafa' }}>
        {fields.length === 0 ? (
          <span style={{ color: '#999', fontSize: 12 }}>暂无选择的字段</span>
        ) : (
          <Space wrap>
            {fields.map(fieldName => (
              <Tag
                key={fieldName}
                closable
                onClose={() => removeField(fieldName, fieldType)}
                style={{ marginBottom: 4 }}
              >
                {getFieldDisplayName(fieldName)}
              </Tag>
            ))}
          </Space>
        )}
      </div>
    );
  };

  const handleFieldSelectOld = (fieldName: string) => {
    const analysisConfig = form.getFieldValue('analysisConfig') || {};
    form.setFieldsValue({ 
      analysisConfig: { 
        ...analysisConfig,
        [currentFieldType]: fieldName 
      } 
    });
    setFieldSelectVisible(false);
  };

  const handleIndicatorSelect = (indicatorId: string) => {
    if (currentBaselineIndex >= 0) {
      const newIndicators = [...baselineIndicators];
      newIndicators[currentBaselineIndex] = {
        ...newIndicators[currentBaselineIndex],
        baselineIndicatorId: indicatorId
      };
      setBaselineIndicators(newIndicators);
      form.setFieldsValue({ baselineConfig: { baselineIndicators: newIndicators } });
    }
    setIndicatorSelectVisible(false);
  };

  const handleMultipleIndicatorSelect = (indicatorIds: string[]) => {
    const newIndicators = indicatorIds.map(indicatorId => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      baselineIndicatorId: indicatorId,
      baselineDimensionField: '',
      baselineQueryConditionField: ''
    }));
    const updatedIndicators = [...baselineIndicators, ...newIndicators];
    setBaselineIndicators(updatedIndicators);
    form.setFieldsValue({ baselineConfig: { baselineIndicators: updatedIndicators } });
    setSelectedIndicatorRows([]);
  };

  const addBaselineIndicator = () => {
    setIndicatorSelectVisible(true);
  };

  const removeBaselineIndicator = (index: number) => {
    const newIndicators = baselineIndicators.filter((_, i) => i !== index);
    setBaselineIndicators(newIndicators);
    form.setFieldsValue({ baselineConfig: { baselineIndicators: newIndicators } });
  };



  const onFinish = (values: PriceModel) => {
    console.log('Form Submitted:', values);
    message.success('模型已保存!');
    setIsListView(true);
  };

  const renderForm = () => {
    const tabItems = [
      {
        key: 'analysis',
        label: '分析对象配置',
        children: (
          <div style={{ padding: '24px 0' }}>
            <Row gutter={24}>
              <Col span={24}>
                <Row gutter={16} style={{ marginBottom: 24, alignItems: 'center' }}>
                  <Col span={4}>
                    <span style={{ fontWeight: 500 }}>选择数据集:</span>
                  </Col>
                  <Col span={18}>
                    <Form.Item name={['analysisConfig', 'selectedDatasetId']} rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                      <Button 
                        onClick={() => setDatasetSelectVisible(true)}
                        style={{ width: '100%', textAlign: 'left' }}
                      >
                        {selectedDataset ? selectedDataset.name : '点击选择数据集'}
                      </Button>
                    </Form.Item>
                  </Col>
                </Row>
              </Col>
              <Col span={24}>
                {selectedDataset && (
                  <div style={{ marginTop: 16 }}>
                    <Row gutter={[16, 16]}>
                       <Col span={24}>
                         <Row gutter={16} style={{ marginBottom: 16, alignItems: 'center' }}>
                           <Col span={4}>
                             <span style={{ fontWeight: 500 }}>选择比价对象:</span>
                           </Col>
                           <Col span={18}>
                             {renderFieldTags(comparisonObjectFields, 'comparisonObjectFields', '')}
                           </Col>
                           <Col span={2} style={{ textAlign: 'right' }}>
                             <Button 
                               size="small" 
                               type="link" 
                               onClick={() => {
                                 setCurrentFieldType('comparisonObjectFields');
                                 setFieldSelectVisible(true);
                               }}
                               disabled={!selectedDataset}
                               style={{ padding: '0 8px' }}
                               title={!selectedDataset ? '请先选择数据集' : ''}
                             >
                               + 添加字段
                             </Button>
                           </Col>
                         </Row>
                       </Col>
                       <Col span={24}>
                         <Row gutter={16} style={{ marginBottom: 16, alignItems: 'center' }}>
                           <Col span={4}>
                             <span style={{ fontWeight: 500 }}>选择分析指标:</span>
                           </Col>
                           <Col span={18}>
                             {renderFieldTags(analysisIndicatorFields, 'analysisIndicatorFields', '')}
                           </Col>
                           <Col span={2} style={{ textAlign: 'right' }}>
                             <Button 
                               size="small" 
                               type="link" 
                               onClick={() => {
                                 setCurrentFieldType('analysisIndicatorFields');
                                 setFieldSelectVisible(true);
                               }}
                               disabled={!selectedDataset}
                               style={{ padding: '0 8px' }}
                               title={!selectedDataset ? '请先选择数据集' : ''}
                             >
                               + 添加字段
                             </Button>
                           </Col>
                         </Row>
                       </Col>
                       <Col span={24}>
                         <Row gutter={16} style={{ marginBottom: 16, alignItems: 'center' }}>
                           <Col span={4}>
                             <span style={{ fontWeight: 500 }}>选择分析对象:</span>
                           </Col>
                           <Col span={18}>
                             {renderFieldTags(analysisObjectFields, 'analysisObjectFields', '')}
                           </Col>
                           <Col span={2} style={{ textAlign: 'right' }}>
                             <Button 
                               size="small" 
                               type="link" 
                               onClick={() => {
                                 setCurrentFieldType('analysisObjectFields');
                                 setFieldSelectVisible(true);
                               }}
                               disabled={!selectedDataset}
                               style={{ padding: '0 8px' }}
                               title={!selectedDataset ? '请先选择数据集' : ''}
                             >
                               + 添加字段
                             </Button>
                           </Col>
                         </Row>
                       </Col>
                       <Col span={24}>
                         <Row gutter={16} style={{ marginBottom: 16, alignItems: 'center' }}>
                           <Col span={4}>
                             <span style={{ fontWeight: 500 }}>选择分析维度:</span>
                           </Col>
                           <Col span={18}>
                             {renderFieldTags(analysisDimensionFields, 'analysisDimensionFields', '')}
                           </Col>
                           <Col span={2} style={{ textAlign: 'right' }}>
                             <Button 
                               size="small" 
                               type="link" 
                               onClick={() => {
                                 setCurrentFieldType('analysisDimensionFields');
                                 setFieldSelectVisible(true);
                               }}
                               disabled={!selectedDataset}
                               style={{ padding: '0 8px' }}
                               title={!selectedDataset ? '请先选择数据集' : ''}
                             >
                               + 添加字段
                             </Button>
                           </Col>
                         </Row>
                       </Col>
                       <Col span={24}>
                         <Row gutter={16} style={{ marginBottom: 16, alignItems: 'center' }}>
                           <Col span={4}>
                             <span style={{ fontWeight: 500 }}>选择查询条件:</span>
                           </Col>
                           <Col span={18}>
                             {renderFieldTags(queryConditionFields, 'queryConditionFields', '')}
                           </Col>
                           <Col span={2} style={{ textAlign: 'right' }}>
                             <Button 
                               size="small" 
                               type="link" 
                               onClick={() => {
                                 setCurrentFieldType('queryConditionFields');
                                 setFieldSelectVisible(true);
                               }}
                               disabled={!selectedDataset}
                               style={{ padding: '0 8px' }}
                               title={!selectedDataset ? '请先选择数据集' : ''}
                             >
                               + 添加字段
                             </Button>
                           </Col>
                         </Row>
                       </Col>
                     </Row>
                  </div>
                )}
              </Col>
            </Row>
          </div>
        ),
      },
      {
        key: 'baseline',
        label: '基准对象配置',
        children: (
          <div style={{ padding: '24px 0' }}>
            <div style={{ marginBottom: 16, textAlign: 'right' }}>
              <Button type="primary" onClick={addBaselineIndicator}>
                + 添加基准指标
              </Button>
            </div>
            
            {baselineIndicators.map((indicator, index) => (
              <Card 
                key={indicator.id} 
                size="small" 
                style={{ marginBottom: 16 }}
                extra={
                  <Button 
                    type="text" 
                    danger 
                    size="small" 
                    onClick={() => removeBaselineIndicator(index)}
                  >
                    删除
                  </Button>
                }
              >
                <Row gutter={16} style={{ marginBottom: 16, alignItems: 'center' }}>
                  <Col span={4}>
                    <span style={{ fontWeight: 500 }}>基准指标:</span>
                  </Col>
                  <Col span={20}>
                    <div style={{ minHeight: 32, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      {indicator.baselineIndicatorId ? (
                        <Tag>
                          {mockIndicators.find(i => i.id === indicator.baselineIndicatorId)?.name || '未知指标'}
                        </Tag>
                      ) : (
                        <span style={{ color: '#999' }}>暂无选择的指标</span>
                      )}
                    </div>
                  </Col>
                </Row>

                <Row gutter={16} style={{ marginBottom: 16, alignItems: 'center' }}>
                  <Col span={4}>
                    <span style={{ fontWeight: 500 }}>选择基准维度:</span>
                  </Col>
                  <Col span={18}>
                    <div style={{ minHeight: 32, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      {renderFieldTags(baselineDimensionFields, 'baselineDimensionFields', '')}
                    </div>
                  </Col>
                  <Col span={2} style={{ textAlign: 'right' }}>
                    <Button 
                      type="link" 
                      size="small" 
                      onClick={() => {
                        setCurrentFieldType('baselineDimensionFields');
                        setFieldSelectVisible(true);
                      }}
                      disabled={!selectedDataset}
                      style={{ padding: 0 }}
                    >
                      + 添加字段
                    </Button>
                  </Col>
                </Row>

                <Row gutter={16} style={{ marginBottom: 16, alignItems: 'center' }}>
                  <Col span={4}>
                    <span style={{ fontWeight: 500 }}>选择基准查询条件:</span>
                  </Col>
                  <Col span={18}>
                    <div style={{ minHeight: 32, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      {renderFieldTags(baselineQueryConditionFields, 'baselineQueryConditionFields', '')}
                    </div>
                  </Col>
                  <Col span={2} style={{ textAlign: 'right' }}>
                    <Button 
                      type="link" 
                      size="small" 
                      onClick={() => {
                        setCurrentFieldType('baselineQueryConditionFields');
                        setFieldSelectVisible(true);
                      }}
                      disabled={!selectedDataset}
                      style={{ padding: 0 }}
                    >
                      + 添加字段
                    </Button>
                  </Col>
                </Row>
              </Card>
            ))}
          </div>
        ),
      },
    ];

    return (
      <div>
        {/* 页面头部 */}
        <div style={{ 
          marginBottom: 24, 
          padding: '16px 0', 
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button 
              type="text" 
              icon={<ArrowLeft size={16} />} 
              onClick={() => setIsListView(true)}
              style={{ marginRight: 16 }}
            >
              返回
            </Button>
            <Title level={3} style={{ margin: 0 }}>创建比价模型</Title>
          </div>
          <Space>
            <Button onClick={() => setIsListView(true)}>取消</Button>
            <Button type="primary" onClick={() => form.submit()}>保存模型</Button>
          </Space>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish}>
          {/* 基本信息 */}
          <Card title="基本信息" style={{ marginBottom: 24 }}>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Row gutter={16}>
                  <Col span={4}>
                    <span style={{ fontWeight: 500 }}>模型编码:</span>
                  </Col>
                  <Col span={20}>
                    <Form.Item name="modelCode" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                      <Input placeholder="系统自动生成..." />
                    </Form.Item>
                  </Col>
                </Row>
              </Col>
              <Col span={24}>
                <Row gutter={16}>
                  <Col span={4}>
                    <span style={{ fontWeight: 500 }}>模型名称:</span>
                  </Col>
                  <Col span={20}>
                    <Form.Item name="modelName" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                      <Input placeholder="医疗器械核心耗材比价模型..." />
                    </Form.Item>
                  </Col>
                </Row>
              </Col>
              <Col span={24}>
                <Row gutter={16}>
                  <Col span={4}>
                    <span style={{ fontWeight: 500 }}>模型描述:</span>
                  </Col>
                  <Col span={20}>
                    <Form.Item name="description" style={{ marginBottom: 0 }}>
                      <TextArea rows={3} placeholder="输入模型的用途和适用场景..." />
                    </Form.Item>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Card>

          {/* Tab页 */}
          <Card>
            <Tabs 
              activeKey={activeTab} 
              onChange={setActiveTab}
              items={tabItems}
            />
          </Card>
        </Form>
      </div>
    );
  };

  const renderListView = () => {
    const mockModels: PriceModel[] = [
      {
        modelId: 'pm_001',
        modelCode: 'PM001',
        modelName: '协议价vs多源基准对标模型',
        description: '用于协议价格与多个基准价格的对比分析',
        analysisConfig: {
          selectedDatasetId: 'dwd_agreement',
          comparisonObjectFields: ['product_name'],
          analysisIndicatorFields: ['agreement_price'],
          analysisObjectFields: ['supplier_name'],
          analysisDimensionFields: ['org_name'],
          queryConditionFields: ['brand_name']
        },
        baselineConfig: {
          baselineIndicators: [
            {
              id: '1',
              baselineIndicatorId: 'h001',
              baselineDimensionField: '',
              baselineQueryConditionField: ''
            }
          ]
        },
        status: 'active',
        createdBy: '张三',
        createdAt: '2024-01-15',
        updatedAt: '2024-01-20'
      },
      {
        modelId: 'pm_002',
        modelCode: 'PM002',
        modelName: '历史价格趋势分析模型',
        description: '分析产品价格的历史变化趋势',
        analysisConfig: {
          selectedDatasetId: 'dwd_order_detail',
          comparisonObjectFields: ['product_name'],
          analysisIndicatorFields: ['order_price'],
          analysisObjectFields: ['supplier_name'],
          analysisDimensionFields: ['org_name'],
          queryConditionFields: ['order_no']
        },
        baselineConfig: {
          baselineIndicators: []
        },
        status: 'draft',
        createdBy: '李四',
        createdAt: '2024-01-10',
        updatedAt: '2024-01-18'
      }
    ];

    const columns = [
      {
        title: '模型编码',
        dataIndex: 'modelCode',
        key: 'modelCode',
        width: 120,
      },
      {
        title: '模型名称',
        dataIndex: 'modelName',
        key: 'modelName',
        width: 200,
        render: (text: string) => (
          <Button type="link" style={{ padding: 0, height: 'auto' }}>
            {text}
          </Button>
        ),
      },
      {
        title: '描述',
        dataIndex: 'description',
        key: 'description',
        ellipsis: true,
      },

      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 100,
        render: (status: string) => {
          const statusMap = {
            'active': <Tag color="green">启用</Tag>,
            'inactive': <Tag color="red">停用</Tag>,
            'draft': <Tag color="orange">草稿</Tag>
          };
          return statusMap[status as keyof typeof statusMap] || status;
        },
      },
      {
        title: '创建人',
        dataIndex: 'createdBy',
        key: 'createdBy',
        width: 100,
      },
      {
        title: '更新时间',
        dataIndex: 'updatedAt',
        key: 'updatedAt',
        width: 120,
      },
      {
        title: '操作',
        key: 'action',
        width: 200,
        fixed: 'right' as const,
        render: () => (
          <Space>
            <Button size="small" type="link" onClick={() => setIsListView(false)}>
              编辑
            </Button>
            <Button size="small" type="link">
              停用
            </Button>
            <Button size="small" type="link">
              复制
            </Button>
            <Button size="small" type="link" danger>
              删除
            </Button>
          </Space>
        ),
      },
    ];

    return (
      <div className="price-model-list">
        <div className="list-header" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3} style={{ margin: 0 }}>比价模型管理</Title>
          <Space>
            <Input.Search
              placeholder="搜索模型名称或编码"
              style={{ width: 300 }}
              allowClear
            />
            <Button type="primary" icon={<Plus size={16} />} onClick={() => setIsListView(false)}>
              创建模型
            </Button>
          </Space>
        </div>
        
        <Card>
          <Table
            dataSource={mockModels}
            columns={columns}
            rowKey="modelId"
            scroll={{ x: 1200 }}
            pagination={{
              total: mockModels.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
            }}
          />
        </Card>
      </div>
    );
  };

  return (
    <div style={{ padding: 24 }}>
      {isListView ? renderListView() : renderForm()}
      
      {/* 数据集选择弹框 */}
      <Modal
        title="选择数据集"
        open={datasetSelectVisible}
        onCancel={() => setDatasetSelectVisible(false)}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Button onClick={() => setDatasetSelectVisible(false)} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" onClick={() => {
              if (selectedDatasetRows.length > 0) {
                handleSelectDataset(selectedDatasetRows[0]);
                setDatasetSelectVisible(false);
              }
            }}>
              确定添加
            </Button>
          </div>
        }
        width={800}
      >
        <div style={{ marginBottom: 16 }}>
          从数据模型中选择要添加的数据集（已选择 {selectedDatasetRows.length} 个数据集）：
        </div>
        <Table
           dataSource={mockDatasets.map((dataset, index) => {
             const analysisSubjects = ['采购比价分析', '供应商绩效分析', '历史价格趋势分析'];
             return {
               key: dataset.id,
               datasetName: dataset.name,
               datasetCode: dataset.id,
               sourceModel: 'DWD层数据模型',
               analysisSubject: analysisSubjects[index % analysisSubjects.length]
             };
           })}
           columns={[
             {
               title: '',
               dataIndex: 'key',
               width: 50,
               render: (key) => (
                 <Checkbox
                   checked={selectedDatasetRows.includes(key)}
                   onChange={(e) => {
                     if (e.target.checked) {
                       setSelectedDatasetRows([key]); // 单选
                     } else {
                       setSelectedDatasetRows([]);
                     }
                   }}
                 />
               ),
             },
             {
               title: '数据集名称',
               dataIndex: 'datasetName',
               key: 'datasetName',
             },
             {
               title: '数据集编码',
               dataIndex: 'datasetCode',
               key: 'datasetCode',
             },
             {
               title: '来源模型',
               dataIndex: 'sourceModel',
               key: 'sourceModel',
             },
             {
               title: '分析主题',
               dataIndex: 'analysisSubject',
               key: 'analysisSubject',
               render: (subject) => (
                 <Tag color="green">{subject}</Tag>
               ),
             },
           ]}
          pagination={false}
          size="small"
          scroll={{ y: 300 }}
        />
      </Modal>

      {/* 字段选择弹框 */}
      <Modal
        title="新增数据集字段"
        open={fieldSelectVisible}
        onCancel={() => setFieldSelectVisible(false)}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Button onClick={() => setFieldSelectVisible(false)} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" onClick={() => {
              // 批量处理选中的字段
              const fieldsToAdd = selectedFieldRows.filter(fieldName => {
                const field = selectedDataset?.fields.find(f => f.physicalName === fieldName);
                return field;
              });
              
              if (fieldsToAdd.length > 0) {
                // 根据当前字段类型批量添加
                switch (currentFieldType) {
                  case 'comparisonObjectFields':
                    const newComparisonFields = fieldsToAdd.filter(name => !comparisonObjectFields.includes(name));
                    if (newComparisonFields.length > 0) {
                      setComparisonObjectFields([...comparisonObjectFields, ...newComparisonFields]);
                    }
                    break;
                  case 'analysisIndicatorFields':
                    const newAnalysisIndicatorFields = fieldsToAdd.filter(name => !analysisIndicatorFields.includes(name));
                    if (newAnalysisIndicatorFields.length > 0) {
                      setAnalysisIndicatorFields([...analysisIndicatorFields, ...newAnalysisIndicatorFields]);
                    }
                    break;
                  case 'analysisObjectFields':
                    const newAnalysisObjectFields = fieldsToAdd.filter(name => !analysisObjectFields.includes(name));
                    if (newAnalysisObjectFields.length > 0) {
                      setAnalysisObjectFields([...analysisObjectFields, ...newAnalysisObjectFields]);
                    }
                    break;
                  case 'analysisDimensionFields':
                    const newAnalysisDimensionFields = fieldsToAdd.filter(name => !analysisDimensionFields.includes(name));
                    if (newAnalysisDimensionFields.length > 0) {
                      setAnalysisDimensionFields([...analysisDimensionFields, ...newAnalysisDimensionFields]);
                    }
                    break;
                  case 'queryConditionFields':
                    const newQueryConditionFields = fieldsToAdd.filter(name => !queryConditionFields.includes(name));
                    if (newQueryConditionFields.length > 0) {
                      setQueryConditionFields([...queryConditionFields, ...newQueryConditionFields]);
                    }
                    break;
                  case 'baselineDimensionFields':
                    const newBaselineDimensionFields = fieldsToAdd.filter(name => !baselineDimensionFields.includes(name));
                    if (newBaselineDimensionFields.length > 0) {
                      setBaselineDimensionFields([...baselineDimensionFields, ...newBaselineDimensionFields]);
                    }
                    break;
                  case 'baselineQueryConditionFields':
                    const newBaselineQueryConditionFields = fieldsToAdd.filter(name => !baselineQueryConditionFields.includes(name));
                    if (newBaselineQueryConditionFields.length > 0) {
                      setBaselineQueryConditionFields([...baselineQueryConditionFields, ...newBaselineQueryConditionFields]);
                    }
                    break;
                }
                message.success(`已批量添加 ${fieldsToAdd.length} 个字段`);
              }
              
              setSelectedFieldRows([]);
              setFieldSelectVisible(false);
            }}>
              确定添加
            </Button>
          </div>
        }
        width={800}
      >
        <div style={{ marginBottom: 16 }}>
          从数据模型中选择要添加的字段（已选择 {selectedFieldRows.length} 个字段）：
        </div>
        <Table
          dataSource={selectedDataset?.fields.map(field => ({
            key: field.physicalName,
            fieldName: field.businessName,
            fieldCode: field.physicalName,
            sourceModel: selectedDataset?.name || 'DWD层数据模型',
            fieldType: field.fieldType,
            componentType: field.componentType
          })) || []}
          rowSelection={{
            selectedRowKeys: selectedFieldRows,
            onChange: (selectedRowKeys) => {
              setSelectedFieldRows(selectedRowKeys as string[]);
            },
            onSelectAll: (selected, selectedRows, changeRows) => {
              if (selected) {
                const allKeys = selectedDataset?.fields.map(field => field.physicalName) || [];
                setSelectedFieldRows(allKeys);
              } else {
                setSelectedFieldRows([]);
              }
            },
          }}
          columns={[
            {
              title: '字段名称',
              dataIndex: 'fieldName',
              key: 'fieldName',
            },
            {
              title: '字段编码',
              dataIndex: 'fieldCode',
              key: 'fieldCode',
            },
            {
              title: '来源模型',
              dataIndex: 'sourceModel',
              key: 'sourceModel',
            },
            {
              title: '字段类型',
              dataIndex: 'fieldType',
              key: 'fieldType',
              render: (type: string) => {
                 const colorMap: Record<string, string> = {
                   '指标': 'blue',
                   '维度': 'green',
                   '属性': 'orange',
                   '普通字段': 'default'
                 };
                 return <Tag color={colorMap[type] || 'default'}>{type}</Tag>;
               },
            },
            {
              title: '组件类型',
              dataIndex: 'componentType',
              key: 'componentType',
              render: (componentType: string) => {
                 const colorMap: Record<string, string> = {
                   '文本框': 'default',
                   '下拉框': 'blue',
                   '弹框单选': 'green',
                   '弹框多选': 'orange',
                   '时间格式': 'purple',
                   '日期格式': 'cyan'
                 };
                 return <Tag color={colorMap[componentType] || 'default'}>{componentType}</Tag>;
               },
            },
          ]}
          pagination={false}
          size="small"
          scroll={{ y: 300 }}
        />
      </Modal>

      {/* 指标选择弹框 */}
      <Modal
        title="选择指标"
        open={indicatorSelectVisible}
        onCancel={() => setIndicatorSelectVisible(false)}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Button onClick={() => setIndicatorSelectVisible(false)} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" onClick={() => {
              if (selectedIndicatorRows.length > 0) {
                handleMultipleIndicatorSelect(selectedIndicatorRows);
                setIndicatorSelectVisible(false);
              }
            }}>
              确定添加
            </Button>
          </div>
        }
        width={800}
      >
        <div style={{ marginBottom: 16 }}>
          从数据模型中选择要添加的指标（已选择 {selectedIndicatorRows.length} 个指标）：
        </div>
        <Table
          dataSource={mockIndicators.map(indicator => ({
            key: indicator.id,
            indicatorName: indicator.name,
            indicatorCode: indicator.id,
            sourceModel: '采购订单历史模型',
            indicatorType: '指标'
          }))}
          rowSelection={{
            selectedRowKeys: selectedIndicatorRows,
            onChange: (selectedRowKeys) => {
              setSelectedIndicatorRows(selectedRowKeys as string[]);
            },
            onSelectAll: (selected, selectedRows, changeRows) => {
              const allKeys = mockIndicators.map(indicator => indicator.id);
              if (selected) {
                setSelectedIndicatorRows(allKeys);
              } else {
                setSelectedIndicatorRows([]);
              }
            },
          }}
          columns={[
            {
              title: '指标名称',
              dataIndex: 'indicatorName',
              key: 'indicatorName',
            },
            {
              title: '指标编码',
              dataIndex: 'indicatorCode',
              key: 'indicatorCode',
            },
            {
              title: '来源模型',
              dataIndex: 'sourceModel',
              key: 'sourceModel',
            },
            {
              title: '指标类型',
              dataIndex: 'indicatorType',
              key: 'indicatorType',
              render: (type) => (
                <Tag color="green">{type}</Tag>
              ),
            },
          ]}
          pagination={false}
          size="small"
          scroll={{ y: 300 }}
        />
      </Modal>
    </div>
  );
};

export default PriceModelManagement;