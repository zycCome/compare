import React, { useState, useEffect } from 'react';
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
  DatePicker, 
  Divider,
  Tag,
  Tooltip,
  Alert,
  Steps,
  Modal,
  Table,
  Collapse,
  Switch,
  InputNumber,
  TreeSelect,
  Checkbox
} from 'antd';
import { 
  PlusOutlined, 
  SaveOutlined, 
  EyeOutlined, 
  InfoCircleOutlined,
  SettingOutlined,
  DeleteOutlined,
  EditOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;

/**
 * 比价方案新版管理组件
 * 提供比对对象、基准对象、分析指标三模块的配置界面
 */
const PriceSchemeManagementV2: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [activeKey, setActiveKey] = useState(['1', '2', '3']); // 默认展开所有面板
  const [basicInfoExpanded, setBasicInfoExpanded] = useState(true); // 基本信息模块展开状态
  const [indicatorModalVisible, setIndicatorModalVisible] = useState(false); // 选择指标弹框状态
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([]); // 已选择的指标
  const [rangeModalVisible, setRangeModalVisible] = useState(false); // 设置比对范围弹框状态
  const [comparisonRanges, setComparisonRanges] = useState<Array<{
    id: string;
    field: string;
    condition: string;
    values: string[];
  }>>([]); // 比对范围条件列表
  
  // 比价数据集字段状态
  const [comparisonDatasetFields, setComparisonDatasetFields] = useState<Array<{
    field: string;
    name: string;
    type: string;
    value: string;
  }>>([]);
  
  // 拖拽相关状态
  const [draggedField, setDraggedField] = useState<{
    field: string;
    name: string;
    type: string;
  } | null>(null);
  
  const [droppedFields, setDroppedFields] = useState<Array<{
    id: string;
    field: string;
    name: string;
    valueType: string;
    range: string;
    conditionType?: string;
  }>>([]);
  
  // 比对维度弹框状态
  const [dimensionModalVisible, setDimensionModalVisible] = useState(false);
  const [selectedDimensions, setSelectedDimensions] = useState<Array<{
    field: string;
    name: string;
    type: string;
    attribute: string;
  }>>([]);
  
  // 状态管理
  const [comparisonConfig, setComparisonConfig] = useState({
    object: '',
    indicator: '',
    queryScope: {}
  });
  
  const [baselineConfig, setBaselineConfig] = useState({
    dataset: '',
    indicator: '',
    queryScope: {}
  });
  
  const [analysisMetrics, setAnalysisMetrics] = useState<Array<{
    id: string;
    name: string;
    expression: string;
    unit: string;
    description: string;
  }>>([]);

  // 基准对象相关状态
  const [datasetModalVisible, setDatasetModalVisible] = useState(false); // 数据集选择弹框状态
  const [selectedBaselineDatasets, setSelectedBaselineDatasets] = useState<Array<{
    id: string;
    name: string;
    description: string;
    recordCount: number;
  }>>([]);
  const [selectedBaselineDataset, setSelectedBaselineDataset] = useState<{
    id: string;
    name: string;
    description: string;
    recordCount: number;
  } | null>(null);
  const [baselineRangeModalVisible, setBaselineRangeModalVisible] = useState(false);
  const [baselineRanges, setBaselineRanges] = useState<Array<{
    id: string;
    field: string;
    condition: string;
    values: string;
  }>>([]);
  const [baselineMetricsModalVisible, setBaselineMetricsModalVisible] = useState(false);
  const [selectedBaselineMetrics, setSelectedBaselineMetrics] = useState<Array<{
    id: string;
    name: string;
    unit: string;
  }>>([]);

  // 模拟数据
  const mockComparisonObjects = [
    { id: 'supplier', name: '供应商', description: '按供应商维度进行比价分析' },
    { id: 'product', name: '产品', description: '按产品维度进行比价分析' },
    { id: 'category', name: '品类', description: '按品类维度进行比价分析' },
    { id: 'brand', name: '品牌', description: '按品牌维度进行比价分析' }
  ];

  const mockIndicators = [
    { id: 'agreement_price', name: '协议价格', unit: '元', description: '采购协议中的价格' },
    { id: 'bid_price', name: '招标价格', unit: '元', description: '招标过程中的报价' },
    { id: 'market_price', name: '市场价格', unit: '元', description: '市场参考价格' },
    { id: 'discount_rate', name: '折扣率', unit: '%', description: '相对于标准价格的折扣' }
  ];

  const mockDatasets = [
    { id: 'ds_agreement', name: '采购协议数据集', description: '包含所有采购协议的价格信息', recordCount: 15420 },
    { id: 'ds_bid', name: '招标数据集', description: '历史招标数据和价格信息', recordCount: 8930 },
    { id: 'ds_market', name: '市场价格数据集', description: '市场参考价格数据', recordCount: 23450 },
    { id: 'ds_historical', name: '历史采购数据集', description: '历史采购记录和价格变化', recordCount: 45670 }
  ];

  // 模拟数据集字段数据
  const mockDatasetFields = [
    { field: 'product_code', name: '商品编码', type: 'string', attribute: '产品维度' },
    { field: 'product_name', name: '商品名称', type: 'string', attribute: '产品维度' },
    { field: 'category', name: '商品分类', type: 'string', attribute: '分类维度' },
    { field: 'brand', name: '品牌', type: 'string', attribute: '品牌维度' },
    { field: 'supplier', name: '供应商', type: 'string', attribute: '供应商维度' },
    { field: 'region', name: '地区', type: 'string', attribute: '地区维度' },
    { field: 'price', name: '价格', type: 'number', attribute: '价格维度' },
    { field: 'quantity', name: '数量', type: 'number', attribute: '数量维度' },
    { field: 'purchase_date', name: '采购日期', type: 'date', attribute: '时间维度' }
  ];

  const mockOrganizations = [
    { 
      title: '集团总部', 
      value: 'org_group', 
      key: 'org_group',
      children: [
        { title: '子公司A', value: 'org_subsidiary_a', key: 'org_subsidiary_a' },
        { title: '子公司B', value: 'org_subsidiary_b', key: 'org_subsidiary_b' }
      ]
    },
    { 
      title: '分公司', 
      value: 'org_branch', 
      key: 'org_branch',
      children: [
        { title: '华东分公司', value: 'org_branch_east', key: 'org_branch_east' },
        { title: '华南分公司', value: 'org_branch_south', key: 'org_branch_south' }
      ]
    }
  ];

  // 拖拽处理函数
  const handleDragStart = (field: { field: string; name: string; type: string }) => {
    setDraggedField(field);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedField) {
      const newField = {
        id: Date.now().toString(),
        field: draggedField.field,
        name: draggedField.name,
        valueType: draggedField.type,
        range: ''
      };
      setDroppedFields(prev => [...prev, newField]);
      setDraggedField(null);
    }
  };

  const handleRemoveField = (id: string) => {
    setDroppedFields(prev => prev.filter(field => field.id !== id));
  };

  const handleRangeChange = (id: string, range: string) => {
    setDroppedFields(prev => 
      prev.map(field => 
        field.id === id ? { ...field, range } : field
      )
    );
  };

  /**
   * 处理条件类型变更
   * @param id 字段ID
   * @param conditionType 条件类型
   */
  const handleConditionTypeChange = (id: string, conditionType: string) => {
    setDroppedFields(prev => 
      prev.map(field => 
        field.id === id ? { ...field, conditionType } : field
      )
    );
  };

  /**
   * 处理表单提交
   * @param values 表单数据
   */
  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      
      // 构建完整的比价方案配置
      const schemeConfig = {
        ...values,
        comparisonConfig,
        baselineConfig,
        analysisMetrics,
        createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
      };
      
      console.log('比价方案配置:', schemeConfig);
      
      // 这里应该调用API保存数据
      await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟API调用
      
      message.success('比价方案创建成功！');
      form.resetFields();
      setComparisonConfig({ object: '', indicator: '', queryScope: {} });
      setBaselineConfig({ dataset: '', indicator: '', queryScope: {} });
      setAnalysisMetrics([]);
      
    } catch (error) {
      message.error('创建失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 添加分析指标
   */
  const addAnalysisMetric = () => {
    const newMetric = {
      id: `metric_${Date.now()}`,
      name: '',
      expression: '',
      unit: '',
      description: ''
    };
    setAnalysisMetrics([...analysisMetrics, newMetric]);
  };

  /**
   * 删除分析指标
   * @param index 指标索引
   */
  const removeAnalysisMetric = (index: number) => {
    const newMetrics = analysisMetrics.filter((_, i) => i !== index);
    setAnalysisMetrics(newMetrics);
  };

  /**
   * 更新分析指标
   * @param index 指标索引
   * @param field 字段名
   * @param value 字段值
   */
  const updateAnalysisMetric = (index: number, field: string, value: any) => {
    const newMetrics = [...analysisMetrics];
    newMetrics[index] = { ...newMetrics[index], [field]: value };
    setAnalysisMetrics(newMetrics);
  };

  /**
   * 预览配置
   */
  const handlePreview = () => {
    const values = form.getFieldsValue();
    console.log('预览配置:', { ...values, comparisonConfig, baselineConfig, analysisMetrics });
    setPreviewVisible(true);
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Card>
        <div style={{ marginBottom: '24px' }}>
          <Title level={3}>新建比价方案</Title>
          <Text type="secondary">
            配置比对对象、基准对象和分析指标，创建个性化的比价分析方案
          </Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            enabled: true,
            timeRange: [dayjs().subtract(3, 'month'), dayjs()]
          }}
        >
          {/* 基本信息 */}
          <div style={{ 
            border: '1px solid #f0f0f0', 
            borderRadius: '6px', 
            marginBottom: '16px',
            backgroundColor: '#fff'
          }}>
            {/* 模块标题栏 */}
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: '12px 16px',
                borderBottom: basicInfoExpanded ? '1px solid #f0f0f0' : 'none',
                cursor: 'pointer',
                backgroundColor: '#fafafa'
              }}
              onClick={() => setBasicInfoExpanded(!basicInfoExpanded)}
            >
              <div style={{ 
                width: '4px', 
                height: '20px', 
                backgroundColor: '#1890ff', 
                marginRight: '12px',
                borderRadius: '2px'
              }} />
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
                基本信息
              </span>
              <span style={{ 
                fontSize: '12px', 
                color: '#999',
                transform: basicInfoExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
                marginLeft: '8px'
              }}>
                ▶
              </span>
              <div style={{ flex: 1 }} />
            </div>
            
            {/* 模块内容 */}
            {basicInfoExpanded && (
              <div style={{ padding: '16px' }}>
                <Row gutter={[16, 16]}>
                  <Col span={8}>
                    <div style={{ display: 'flex', alignItems: 'center', height: '32px' }}>
                      <span style={{ width: '80px', textAlign: 'right', marginRight: '8px' }}>方案编码:</span>
                      <Form.Item
                        name="schemeCode"
                        style={{ flex: 1, margin: 0 }}
                        rules={[{ required: true, message: '请输入方案编码' }]}
                      >
                        <Input placeholder="请输入方案编码" />
                      </Form.Item>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ display: 'flex', alignItems: 'center', height: '32px' }}>
                      <span style={{ width: '80px', textAlign: 'right', marginRight: '8px' }}>方案名称:</span>
                      <Form.Item
                        name="schemeName"
                        style={{ flex: 1, margin: 0 }}
                        rules={[{ required: true, message: '请输入方案名称' }]}
                      >
                        <Input placeholder="请输入方案名称" />
                      </Form.Item>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ display: 'flex', alignItems: 'center', height: '32px' }}>
                      <span style={{ width: '80px', textAlign: 'right', marginRight: '8px' }}>比对模型:</span>
                      <Form.Item
                        name="comparisonModel"
                        style={{ flex: 1, margin: 0 }}
                        rules={[{ required: true, message: '请选择比对模型' }]}
                      >
                        <Select 
                          placeholder="请选择比对模型"
                          onChange={(value: string) => {
                            // 根据选择的比对模型自动带出比对数据集字段
                            const modelDatasets: Record<string, Array<{
                              field: string;
                              name: string;
                              type: string;
                              value: string;
                            }>> = {
                              'supplier': [
                                { field: 'supplier_code', name: '供应商编码', type: 'string', value: 'SUP001' },
                                { field: 'supplier_name', name: '供应商名称', type: 'string', value: '优质供应商A' },
                                { field: 'supplier_type', name: '供应商类型', type: 'string', value: '战略供应商' },
                                { field: 'supplier_level', name: '供应商等级', type: 'string', value: 'A级' }
                              ],
                              'product': [
                                { field: 'product_code', name: '产品编码', type: 'string', value: 'PRD001' },
                                { field: 'product_name', name: '产品名称', type: 'string', value: '标准产品A' },
                                { field: 'product_spec', name: '产品规格', type: 'string', value: '规格型号X' },
                                { field: 'product_brand', name: '产品品牌', type: 'string', value: '知名品牌' }
                              ],
                              'category': [
                                { field: 'category_code', name: '品类编码', type: 'string', value: 'CAT001' },
                                { field: 'category_name', name: '品类名称', type: 'string', value: '办公用品' },
                                { field: 'category_level', name: '品类层级', type: 'number', value: '2' },
                                { field: 'category_attr', name: '品类属性', type: 'string', value: '标准品类' }
                              ]
                            };
                            
                            // 设置比价数据集字段
                            const datasetFields = modelDatasets[value] || [];
                            setComparisonDatasetFields(datasetFields);
                            
                            console.log('选择的比对模型:', value, '对应数据集字段:', datasetFields);
                          }}
                        >
                          <Option value="supplier">供应商比对模型</Option>
                          <Option value="product">产品比对模型</Option>
                          <Option value="category">品类比对模型</Option>
                        </Select>
                      </Form.Item>
                    </div>
                  </Col>
                  
                  {/* 比对数据集字段 - 选择比对模型后显示 */}
                  {form.getFieldValue('comparisonModel') && (
                    <Col span={8}>
                      <div style={{ display: 'flex', alignItems: 'center', height: '32px' }}>
                        <span style={{ width: '80px', textAlign: 'right', marginRight: '8px' }}>比对数据集:</span>
                        <Form.Item
                          name="comparisonDataset"
                          style={{ flex: 1, margin: 0 }}
                        >
                          <Input 
                            placeholder="采购协议价"
                            defaultValue="采购协议价"
                            disabled
                            style={{ backgroundColor: '#f5f5f5' }}
                          />
                        </Form.Item>
                      </div>
                    </Col>
                  )}
                  <Col span={8}>
                    <div style={{ display: 'flex', alignItems: 'center', height: '32px' }}>
                      <span style={{ width: '80px', textAlign: 'right', marginRight: '8px' }}>启用状态:</span>
                      <Form.Item
                        name="enabled"
                        style={{ flex: 1, margin: 0 }}
                        valuePropName="checked"
                      >
                        <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                      </Form.Item>
                    </div>
                  </Col>
                </Row>
                
                {/* 方案描述 - 单独一行 */}
                <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                  <Col span={24}>
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                      <span style={{ width: '80px', textAlign: 'right', marginRight: '8px', marginTop: '8px' }}>方案描述:</span>
                      <Form.Item
                        name="description"
                        style={{ flex: 1, margin: 0 }}
                      >
                        <TextArea 
                          placeholder="请输入方案描述" 
                          rows={3}
                          style={{ resize: 'vertical' }}
                        />
                      </Form.Item>
                    </div>
                  </Col>
                </Row>
                
                {/* 标签 - 单独一行，下拉框很长 */}
                <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                  <Col span={24}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ width: '80px', textAlign: 'right', marginRight: '8px' }}>标签:</span>
                      <Form.Item
                        name="tags"
                        style={{ flex: 1, margin: 0 }}
                      >
                        <Select
                          mode="tags"
                          placeholder="请选择或输入标签"
                          style={{ width: '100%' }}
                          options={[
                            { value: '集团采购', label: '集团采购' },
                            { value: '价格监控', label: '价格监控' },
                            { value: '供应商管理', label: '供应商管理' },
                            { value: '成本控制', label: '成本控制' },
                            { value: '质量管控', label: '质量管控' },
                            { value: '风险评估', label: '风险评估' },
                            { value: '合规检查', label: '合规检查' },
                            { value: '战略采购', label: '战略采购' }
                          ]}
                        />
                      </Form.Item>
                    </div>
                  </Col>
                </Row>
              </div>
            )}
          </div>

          {/* 三大模块配置 - 折叠面板布局 */}
          <div style={{ marginBottom: '24px' }}>
            {/* 比对对象模块 */}
            <div style={{ 
              border: '1px solid #f0f0f0', 
              borderRadius: '6px', 
              marginBottom: '16px',
              backgroundColor: '#fff'
            }}>
              {/* 模块标题栏 */}
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '12px 16px',
                  borderBottom: '1px solid #f0f0f0',
                  cursor: 'pointer',
                  backgroundColor: '#fafafa'
                }}
                onClick={() => {
                  const newActiveKey = activeKey.includes('1') 
                    ? activeKey.filter(key => key !== '1')
                    : [...activeKey, '1'];
                  setActiveKey(newActiveKey);
                }}
              >
                <div style={{ 
                  width: '4px', 
                  height: '20px', 
                  backgroundColor: '#1890ff', 
                  marginRight: '12px',
                  borderRadius: '2px'
                }} />
                <span style={{ 
                  fontSize: '12px', 
                  color: '#999',
                  transform: activeKey.includes('1') ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                  marginRight: '8px'
                }}>
                  ▶
                </span>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff', flex: 1 }}>
                  比对对象
                </span>
              </div>
              
              {/* 模块内容 */}
              {activeKey.includes('1') && (
                <div style={{ padding: '16px' }}>
                  {/* 设置比对范围 */}
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ 
                      border: '1px solid #e8e8e8', 
                      borderRadius: '4px', 
                      padding: '12px',
                      backgroundColor: '#fafafa'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '12px'
                      }}>
                        <span style={{ fontSize: '13px', fontWeight: 'bold' }}>设置比对范围</span>
                        <Button 
                          type="dashed" 
                          size="small" 
                          icon={<PlusOutlined />}
                          onClick={() => setRangeModalVisible(true)}
                        >
                          添加条件
                        </Button>
                      </div>
                      
                      {/* 显示已设置的比对范围条件 */}
                      {comparisonRanges.length > 0 ? (
                        <div>
                          {comparisonRanges.map((range, index) => (
                            <div key={range.id} style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              padding: '8px 12px',
                              backgroundColor: '#fff',
                              border: '1px solid #e8e8e8',
                              borderRadius: '4px',
                              marginBottom: index < comparisonRanges.length - 1 ? '8px' : 0
                            }}>
                              <span style={{ flex: 1 }}>
                                <strong>{range.field}</strong> {range.condition} {range.values.join(', ')}
                              </span>
                              <Space>
                                <Button type="link" size="small">编辑</Button>
                                <Button 
                                  type="link" 
                                  size="small" 
                                  danger
                                  onClick={() => {
                                    setComparisonRanges(comparisonRanges.filter(r => r.id !== range.id));
                                  }}
                                >
                                  删除
                                </Button>
                              </Space>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ 
                          textAlign: 'center', 
                          color: '#999', 
                          padding: '20px',
                          border: '1px dashed #d9d9d9',
                          borderRadius: '4px',
                          backgroundColor: '#fff'
                        }}>
                          暂无比对范围条件，请点击"添加条件"按钮设置
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* 第二部分：维度和指标选择 */}
                  <Row gutter={24}>
                    <Col span={12}>
                      <div style={{ 
                        border: '1px solid #e8e8e8', 
                        borderRadius: '4px', 
                        padding: '16px',
                        height: '100%'
                      }}>
                        <div style={{ 
                          fontSize: '14px', 
                          fontWeight: 'bold', 
                          marginBottom: '12px',
                          color: '#333',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span>比对维度</span>
                          <Button 
                            type="primary"
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={() => setDimensionModalVisible(true)}
                          >
                            添加维度
                          </Button>
                        </div>
                        <Form.Item
                          name="comparisonDimensions"
                          rules={[{ required: true, message: '请选择比对维度' }]}
                        >
                          <div style={{
                            minHeight: '100px',
                            border: '1px dashed #d9d9d9',
                            borderRadius: '6px',
                            padding: '12px',
                            backgroundColor: selectedDimensions.length === 0 ? '#fafafa' : '#fff'
                          }}>
                            {selectedDimensions.length === 0 ? (
                              <div style={{
                                textAlign: 'center',
                                color: '#999',
                                fontSize: '13px',
                                paddingTop: '20px'
                              }}>
                                <div style={{ fontSize: '20px', marginBottom: '8px' }}>📊</div>
                                <div>点击"添加维度"按钮选择比对维度</div>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {selectedDimensions.map((dimension, index) => (
                                  <Tag
                                    key={index}
                                    closable
                                    color="blue"
                                    onClose={() => {
                                      setSelectedDimensions(prev => 
                                        prev.filter((_, i) => i !== index)
                                      );
                                    }}
                                    style={{ fontSize: '12px', padding: '4px 8px' }}
                                  >
                                    {dimension.name}
                                    <span style={{ 
                                      marginLeft: '4px', 
                                      fontSize: '10px', 
                                      opacity: 0.7 
                                    }}>
                                      ({dimension.attribute})
                                    </span>
                                  </Tag>
                                ))}
                              </div>
                            )}
                          </div>
                        </Form.Item>
                      </div>
                    </Col>
                    
                    <Col span={12}>
                      <div style={{ 
                        border: '1px solid #e8e8e8', 
                        borderRadius: '4px', 
                        padding: '16px',
                        height: '100%'
                      }}>
                        <div style={{ 
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '12px'
                        }}>
                          <span style={{ 
                            fontSize: '14px', 
                            fontWeight: 'bold', 
                            color: '#333'
                          }}>
                            比对指标
                          </span>
                          <Space>
                            <Button 
                              type="primary"
                              size="small"
                              onClick={() => setIndicatorModalVisible(true)}
                            >
                              选择指标
                            </Button>
                            <Button 
                              type="default"
                              size="small"
                              onClick={() => {
                                message.info('自定义指标功能待实现');
                              }}
                            >
                              自定义指标
                            </Button>
                          </Space>
                        </div>
                        {selectedIndicators.length > 0 && (
                          <div style={{ 
                            border: '1px dashed #d9d9d9', 
                            borderRadius: '4px', 
                            padding: '8px',
                            backgroundColor: '#f9f9f9'
                          }}>
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                              已选择指标 ({selectedIndicators.length})：
                            </div>
                            <div>
                              {selectedIndicators.map(id => {
                                const indicator = mockIndicators.find(item => item.id === id);
                                return indicator ? (
                                  <Tag 
                                    key={id} 
                                    closable 
                                    onClose={() => {
                                      setSelectedIndicators(prev => prev.filter(item => item !== id));
                                    }}
                                    style={{ marginBottom: '4px' }}
                                  >
                                    {indicator.name}
                                  </Tag>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </Col>
                  </Row>
                </div>
              )}
            </div>

            {/* 基准对象模块 */}
            <div style={{ 
              border: '1px solid #f0f0f0', 
              borderRadius: '6px', 
              marginBottom: '16px',
              backgroundColor: '#fff'
            }}>
              {/* 模块标题栏 */}
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '12px 16px',
                  borderBottom: '1px solid #f0f0f0',
                  cursor: 'pointer',
                  backgroundColor: '#fafafa'
                }}
                onClick={() => {
                  const newActiveKey = activeKey.includes('2') 
                    ? activeKey.filter(key => key !== '2')
                    : [...activeKey, '2'];
                  setActiveKey(newActiveKey);
                }}
              >
                <div style={{ 
                  width: '4px', 
                  height: '20px', 
                  backgroundColor: '#52c41a', 
                  marginRight: '12px',
                  borderRadius: '2px'
                }} />
                <span style={{ 
                  fontSize: '12px', 
                  color: '#999',
                  transform: activeKey.includes('2') ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                  marginRight: '8px'
                }}>
                  ▶
                </span>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#52c41a', flex: 1 }}>
                  基准对象
                </span>
              </div>
              
              {/* 模块内容 */}
              {activeKey.includes('2') && (
                <div style={{ padding: '16px' }}>
                  <Row gutter={16}>
                    {/* 左侧：基准数据集列表 (3:7 比例) */}
                    <Col span={7}>
                      <div style={{ 
                        border: '1px solid #e8e8e8', 
                        borderRadius: '4px', 
                        padding: '16px',
                        height: '500px',
                        display: 'flex',
                        flexDirection: 'column'
                      }}>
                        <div style={{ 
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '16px'
                        }}>
                          <div style={{ 
                            fontSize: '14px', 
                            fontWeight: 'bold', 
                            color: '#333'
                          }}>
                            基准数据集
                          </div>
                          <Button 
                            type="primary" 
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={() => setDatasetModalVisible(true)}
                          >
                            添加数据集
                          </Button>
                        </div>
                        
                        {/* 基准数据集列表 */}
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                          {selectedBaselineDatasets.length === 0 ? (
                            <div style={{ 
                              textAlign: 'center', 
                              color: '#999', 
                              padding: '40px 0',
                              fontSize: '14px'
                            }}>
                              暂无基准数据集
                              <br />
                              <span style={{ fontSize: '12px' }}>点击"添加数据集"按钮选择</span>
                            </div>
                          ) : (
                            selectedBaselineDatasets.map(dataset => (
                              <div 
                                key={dataset.id}
                                style={{ 
                                  padding: '12px',
                                  border: selectedBaselineDataset?.id === dataset.id ? '2px solid #52c41a' : '1px solid #f0f0f0',
                                  borderRadius: '4px',
                                  marginBottom: '8px',
                                  cursor: 'pointer',
                                  backgroundColor: selectedBaselineDataset?.id === dataset.id ? '#f6ffed' : '#fff',
                                  transition: 'all 0.2s'
                                }}
                                onClick={() => setSelectedBaselineDataset(dataset)}
                              >
                                <div style={{ 
                                  fontSize: '14px', 
                                  fontWeight: 'bold',
                                  marginBottom: '4px',
                                  color: '#333'
                                }}>
                                  {dataset.name}
                                </div>
                                <div style={{ 
                                  fontSize: '12px', 
                                  color: '#666',
                                  marginBottom: '8px'
                                }}>
                                  {dataset.description}
                                </div>
                                <div style={{ 
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center'
                                }}>
                                  <Tag color="blue">
                                    {dataset.recordCount} 条记录
                                  </Tag>
                                  <Button 
                                    type="text" 
                                    size="small"
                                    danger
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const newDatasets = selectedBaselineDatasets.filter(d => d.id !== dataset.id);
                                      setSelectedBaselineDatasets(newDatasets);
                                      if (selectedBaselineDataset?.id === dataset.id) {
                                        setSelectedBaselineDataset(newDatasets[0] || null);
                                      }
                                    }}
                                  >
                                    移除
                                  </Button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </Col>
                    
                    {/* 右侧：查询范围和基准指标 (3:7 比例) */}
                    <Col span={17}>
                      <div style={{ 
                        border: '1px solid #e8e8e8', 
                        borderRadius: '4px', 
                        padding: '16px',
                        height: '500px',
                        display: 'flex',
                        flexDirection: 'column'
                      }}>
                        {selectedBaselineDataset ? (
                          <>
                            {/* 上半部分：基准查询范围 */}
                            <div style={{ 
                              flex: 1,
                              marginBottom: '16px',
                              border: '1px solid #f0f0f0',
                              borderRadius: '4px',
                              padding: '16px'
                            }}>
                              <div style={{ 
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '16px'
                              }}>
                                <div style={{ 
                                  fontSize: '14px', 
                                  fontWeight: 'bold', 
                                  color: '#333'
                                }}>
                                  基准查询范围
                                </div>
                                <Button 
                                  type="primary" 
                                  size="small"
                                  icon={<SettingOutlined />}
                                  onClick={() => setBaselineRangeModalVisible(true)}
                                >
                                  设置基准查询范围搜索条件
                                </Button>
                              </div>
                              
                              {/* 基准查询范围条件列表 */}
                              <div style={{ minHeight: '120px' }}>
                                {baselineRanges.length === 0 ? (
                                  <div style={{ 
                                    textAlign: 'center', 
                                    color: '#999', 
                                    padding: '40px 0',
                                    fontSize: '14px'
                                  }}>
                                    暂无基准查询范围条件
                                    <br />
                                    <span style={{ fontSize: '12px' }}>点击"设置基准查询范围搜索条件"按钮添加</span>
                                  </div>
                                ) : (
                                  baselineRanges.map(range => (
                                    <div 
                                      key={range.id}
                                      style={{ 
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '8px 12px',
                                        border: '1px solid #f0f0f0',
                                        borderRadius: '4px',
                                        marginBottom: '8px',
                                        backgroundColor: '#fafafa'
                                      }}
                                    >
                                      <span style={{ flex: 1, fontSize: '14px' }}>
                                        {range.field} {range.condition} {range.values}
                                      </span>
                                      <Space>
                                        <Button 
                                          type="text" 
                                          size="small"
                                          icon={<EditOutlined />}
                                          onClick={() => {
                                            // 编辑基准查询范围条件
                                            message.info('编辑基准查询范围条件功能待实现');
                                          }}
                                        />
                                        <Button 
                                          type="text" 
                                          size="small"
                                          danger
                                          icon={<DeleteOutlined />}
                                          onClick={() => {
                                            const newRanges = baselineRanges.filter(r => r.id !== range.id);
                                            setBaselineRanges(newRanges);
                                          }}
                                        />
                                      </Space>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                            
                            {/* 下半部分：基准指标 */}
                            <div style={{ 
                              flex: 1,
                              border: '1px solid #f0f0f0',
                              borderRadius: '4px',
                              padding: '16px'
                            }}>
                              <div style={{ 
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '16px'
                              }}>
                                <div style={{ 
                                  fontSize: '14px', 
                                  fontWeight: 'bold', 
                                  color: '#333'
                                }}>
                                  基准指标
                                </div>
                                <Button 
                                  type="primary" 
                                  size="small"
                                  icon={<SettingOutlined />}
                                  onClick={() => setBaselineMetricsModalVisible(true)}
                                >
                                  选择基准指标
                                </Button>
                              </div>
                              
                              {/* 基准指标列表 */}
                              <div style={{ minHeight: '120px' }}>
                                {selectedBaselineMetrics.length === 0 ? (
                                  <div style={{ 
                                    textAlign: 'center', 
                                    color: '#999', 
                                    padding: '40px 0',
                                    fontSize: '14px'
                                  }}>
                                    暂无基准指标
                                    <br />
                                    <span style={{ fontSize: '12px' }}>点击"选择基准指标"按钮添加</span>
                                  </div>
                                ) : (
                                  selectedBaselineMetrics.map(metric => (
                                    <div 
                                      key={metric.id}
                                      style={{ 
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '8px 12px',
                                        border: '1px solid #f0f0f0',
                                        borderRadius: '4px',
                                        marginBottom: '8px',
                                        backgroundColor: '#fafafa'
                                      }}
                                    >
                                      <span style={{ flex: 1, fontSize: '14px' }}>
                                        {metric.name} ({metric.unit})
                                      </span>
                                      <Button 
                                        type="text" 
                                        size="small"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => {
                                          const newMetrics = selectedBaselineMetrics.filter(m => m.id !== metric.id);
                                          setSelectedBaselineMetrics(newMetrics);
                                        }}
                                      />
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </>
                        ) : (
                          <div style={{ 
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            color: '#999',
                            fontSize: '16px'
                          }}>
                            请先选择基准数据集
                          </div>
                        )}
                      </div>
                    </Col>
                  </Row>
                </div>
              )}
            </div>

            {/* 计算指标模块 */}
            <div style={{ 
              border: '1px solid #f0f0f0', 
              borderRadius: '6px', 
              marginBottom: '16px',
              backgroundColor: '#fff'
            }}>
              {/* 模块标题栏 */}
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '12px 16px',
                  borderBottom: '1px solid #f0f0f0',
                  cursor: 'pointer',
                  backgroundColor: '#fafafa'
                }}
                onClick={() => {
                  const newActiveKey = activeKey.includes('3') 
                    ? activeKey.filter(key => key !== '3')
                    : [...activeKey, '3'];
                  setActiveKey(newActiveKey);
                }}
              >
                <div style={{ 
                  width: '4px', 
                  height: '20px', 
                  backgroundColor: '#fa8c16', 
                  marginRight: '12px',
                  borderRadius: '2px'
                }} />
                <span style={{ 
                  fontSize: '12px', 
                  color: '#999',
                  transform: activeKey.includes('3') ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                  marginRight: '8px'
                }}>
                  ▶
                </span>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#fa8c16', flex: 1 }}>
                  计算指标
                </span>
                <Button 
                  type="primary" 
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    addAnalysisMetric();
                  }}
                  icon={<PlusOutlined />}
                  style={{ marginLeft: 'auto' }}
                >
                  添加计算指标
                </Button>
              </div>
              
              {/* 模块内容 */}
              {activeKey.includes('3') && (
                <div style={{ padding: '0' }}>
                  <Table
                    dataSource={analysisMetrics.map((metric, index) => ({
                      ...metric,
                      key: metric.id,
                      index: index + 1
                    }))}
                    columns={[
                      {
                        title: '指标名称',
                        dataIndex: 'name',
                        key: 'name',
                        width: 150,
                        render: (text, record, index) => (
                          <Input
                            placeholder="请输入指标名称"
                            value={text}
                            onChange={(e) => updateAnalysisMetric(index, 'name', e.target.value)}
                            bordered={false}
                            style={{ padding: '4px 0' }}
                          />
                        ),
                      },
                      {
                        title: '指标编码',
                        dataIndex: 'id',
                        key: 'id',
                        width: 120,
                        render: (text, record, index) => (
                          <span style={{ color: '#666', fontSize: '12px' }}>
                            {`CALC_${String(index + 1).padStart(3, '0')}`}
                          </span>
                        ),
                      },
                      {
                        title: '指标表达式',
                        dataIndex: 'expression',
                        key: 'expression',
                        render: (text, record, index) => (
                          <div style={{ 'flex': 'center', 'alignItems': 'center', 'gap': '8px' }}>
                            <Input
                              placeholder="例如：(比对数据集_采购价格-#1参照数据集_最高价)/#1参照数据集_最高价"
                              value={text}
                              onChange={(e) => updateAnalysisMetric(index, 'expression', e.target.value)}
                              bordered={false}
                              style={{ 
                                padding: '4px 0',
                                fontFamily: 'monospace',
                                fontSize: '12px'
                              }}
                            />
                            <Tooltip title="编辑表达式">
                              <Button 
                                type="text" 
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => {
                                  message.info('表达式编辑器功能待实现');
                                }}
                              />
                            </Tooltip>
                          </div>
                        ),
                      },
                      {
                        title: '指标公式',
                        dataIndex: 'formula',
                        key: 'formula',
                        width: 200,
                        render: (text, record, index) => (
                          <code style={{ 
                            backgroundColor: '#f5f5f5', 
                            padding: '2px 6px', 
                            borderRadius: '3px',
                            fontSize: '11px',
                            color: '#666'
                          }}>
                            {record.expression ? 
                              record.expression.replace(/比对数据集_/g, '').replace(/#1参照数据集_/g, 'REF_') :
                              '(比对指标-基准指标)/基准指标*100'
                            }
                          </code>
                        ),
                      },
                      {
                        title: '指标描述',
                        dataIndex: 'description',
                        key: 'description',
                        render: (text, record, index) => (
                          <Input
                            placeholder="请输入指标描述"
                            value={text}
                            onChange={(e) => updateAnalysisMetric(index, 'description', e.target.value)}
                            bordered={false}
                            style={{ padding: '4px 0' }}
                          />
                        ),
                      },
                      {
                        title: '阈值下限',
                        dataIndex: 'thresholdLower',
                        key: 'thresholdLower',
                        width: 150,
                        render: (text, record, index) => (
                          <Input
                            placeholder="请输入下限值"
                            value={text}
                            onChange={(e) => updateAnalysisMetric(index, 'thresholdLower', e.target.value)}
                            bordered={false}
                            style={{ padding: '4px 0' }}
                          />
                        ),
                      },
                      {
                        title: '阈值上限',
                        dataIndex: 'thresholdUpper',
                        key: 'thresholdUpper',
                        width: 150,
                        render: (text, record, index) => (
                          <Input
                            placeholder="请输入上限值"
                            value={text}
                            onChange={(e) => updateAnalysisMetric(index, 'thresholdUpper', e.target.value)}
                            bordered={false}
                            style={{ padding: '4px 0' }}
                          />
                        ),
                      },
                      {
                        title: '操作',
                        key: 'action',
                        width: 80,
                        render: (text, record, index) => (
                          <Button 
                            type="text" 
                            danger 
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => removeAnalysisMetric(index)}
                          />
                        ),
                      },
                    ]}
                    pagination={false}
                    size="small"
                    locale={{
                      emptyText: (
                        <div style={{ 
                          textAlign: 'center', 
                          padding: '40px', 
                          color: '#999'
                        }}>
                          <Text type="secondary">暂无计算指标，点击上方"添加计算指标"按钮开始配置</Text>
                        </div>
                      )
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* 操作按钮 */}
          <div style={{ 
            marginTop: '24px', 
            textAlign: 'center',
            padding: '16px',
            borderTop: '1px solid #f0f0f0'
          }}>
            <Space size="middle">
              <Button onClick={() => form.resetFields()}>
                重置
              </Button>
              <Button 
                type="default" 
                icon={<EyeOutlined />}
                onClick={handlePreview}
              >
                预览配置
              </Button>
              <Button 
                type="primary" 
                icon={<SaveOutlined />}
                htmlType="submit"
                loading={loading}
                size="large"
              >
                保存方案
              </Button>
            </Space>
          </div>
        </Form>
      </Card>

      {/* 选择指标弹框 */}
      <Modal
        title="选择指标"
        open={indicatorModalVisible}
        onCancel={() => setIndicatorModalVisible(false)}
        onOk={() => {
          setIndicatorModalVisible(false);
          message.success(`已选择 ${selectedIndicators.length} 个指标`);
        }}
        width={800}
      >
        <Table
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys: selectedIndicators,
            onChange: (selectedRowKeys) => {
              setSelectedIndicators(selectedRowKeys as string[]);
            },
          }}
          columns={[
            {
              title: '指标编码',
              dataIndex: 'id',
              key: 'id',
              width: 120,
            },
            {
              title: '指标名称',
              dataIndex: 'name',
              key: 'name',
              width: 150,
            },
            {
              title: '指标表达式',
              dataIndex: 'expression',
              key: 'expression',
              render: (text, record) => (
                <code style={{ 
                  backgroundColor: '#f5f5f5', 
                  padding: '2px 6px', 
                  borderRadius: '3px',
                  fontSize: '12px'
                }}>
                  {record.unit ? `SUM(${record.name})` : 'AVG(price)'}
                </code>
              ),
            },
            {
              title: '指标描述',
              dataIndex: 'description',
              key: 'description',
              ellipsis: true,
            },
          ]}
          dataSource={mockIndicators.map(item => ({
            ...item,
            key: item.id
          }))}
          pagination={false}
          size="small"
          scroll={{ y: 300 }}
        />
      </Modal>

      {/* 预览弹窗 */}
      <Modal
        title="配置预览"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        <div>
          <Title level={5}>比对对象配置</Title>
          <pre style={{ backgroundColor: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
            {JSON.stringify(comparisonConfig, null, 2)}
          </pre>
          
          <Title level={5}>基准对象配置</Title>
          <pre style={{ backgroundColor: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
            {JSON.stringify(baselineConfig, null, 2)}
          </pre>
          
          <Title level={5}>分析指标配置</Title>
          <pre style={{ backgroundColor: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
            {JSON.stringify(analysisMetrics, null, 2)}
          </pre>
        </div>
      </Modal>

      {/* 设置比对范围搜索条件弹框 */}
      <Modal
        title="设置比对范围搜索条件"
        open={rangeModalVisible}
        onCancel={() => setRangeModalVisible(false)}
        onOk={() => {
          // 将droppedFields转换为comparisonRanges格式并保存
          const newRanges = droppedFields.map(field => ({
            id: field.id,
            field: field.name, // 使用字段名称作为显示
            condition: field.valueType, // 使用值类型作为条件
            values: field.range ? [field.range] : [] // 使用默认值作为范围值
          }));
          
          setComparisonRanges(newRanges);
          setRangeModalVisible(false);
          message.success('比对范围搜索条件设置已保存');
        }}
        width={1200}
        bodyStyle={{ padding: '20px' }}
        style={{ top: 20 }}
      >
        <Row gutter={16} style={{ height: '600px' }}>
          {/* 左侧：数据集字段列表 */}
          <Col span={8}>
            <Collapse 
              defaultActiveKey={['1']} 
              style={{ 
                border: '1px solid #d9d9d9', 
                borderRadius: '6px', 
                height: '100%'
              }}
            >
              <Panel 
                header="数据集字段" 
                key="1"
                style={{ 
                  height: '100%'
                }}
              >
                <div style={{ 
                  height: '520px', 
                  overflowY: 'auto' 
                }}>
                  {[
                    { field: 'product_code', name: '商品编码', type: 'string' },
                    { field: 'product_name', name: '商品名称', type: 'string' },
                    { field: 'category', name: '商品分类', type: 'string' },
                    { field: 'brand', name: '品牌', type: 'string' },
                    { field: 'specification', name: '规格型号', type: 'string' },
                    { field: 'unit', name: '单位', type: 'string' },
                    { field: 'price', name: '价格', type: 'number' },
                    { field: 'quantity', name: '数量', type: 'number' },
                    { field: 'amount', name: '金额', type: 'number' },
                    { field: 'supplier', name: '供应商', type: 'string' },
                    { field: 'purchase_date', name: '采购日期', type: 'date' },
                    { field: 'region', name: '地区', type: 'string' },
                    { field: 'department', name: '部门', type: 'string' }
                  ].map((field, index) => (
                    <div
                      key={index}
                      draggable
                      onDragStart={(e) => {
                        handleDragStart(field);
                        e.currentTarget.style.cursor = 'grabbing';
                      }}
                      style={{
                        padding: '10px 12px',
                        margin: '6px 0',
                        backgroundColor: '#fff',
                        border: '1px solid #e8e8e8',
                        borderRadius: '6px',
                        cursor: 'grab',
                        transition: 'all 0.2s',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        userSelect: 'none'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f0f8ff';
                        e.currentTarget.style.borderColor = '#1890ff';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(24, 144, 255, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#fff';
                        e.currentTarget.style.borderColor = '#e8e8e8';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                      onDragEnd={(e) => {
                        e.currentTarget.style.cursor = 'grab';
                      }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: 500 }}>{field.name}</span>
                      <Tag 
                        color={field.type === 'string' ? 'blue' : field.type === 'number' ? 'green' : 'orange'}
                        style={{ fontSize: '11px' }}
                      >
                        {field.type}
                      </Tag>
                    </div>
                  ))}
                </div>
              </Panel>
            </Collapse>
          </Col>

          {/* 右侧：条件设置列表 */}
          <Col span={16}>
            <div style={{ 
              border: '1px solid #d9d9d9', 
              borderRadius: '6px', 
              height: '100%',
              overflow: 'hidden'
            }}>
              <div style={{ 
                backgroundColor: '#fafafa', 
                padding: '12px 16px', 
                borderBottom: '1px solid #d9d9d9',
                fontWeight: 500,
                fontSize: '14px'
              }}>
                条件设置列表
              </div>
              <div 
                style={{ 
                  padding: '16px', 
                  height: 'calc(100% - 49px)', 
                  overflowY: 'auto',
                  minHeight: '200px',
                  border: droppedFields.length === 0 ? '2px dashed #d9d9d9' : 'none',
                  borderRadius: droppedFields.length === 0 ? '6px' : '0',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: droppedFields.length === 0 ? 'center' : 'stretch',
                  justifyContent: droppedFields.length === 0 ? 'center' : 'flex-start'
                }}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {droppedFields.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    color: '#999',
                    fontSize: '14px'
                  }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>📋</div>
                    <div>将左侧字段拖拽到此处</div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>设置查询条件和范围</div>
                  </div>
                ) : (
                  <Table
                    dataSource={droppedFields}
                    pagination={false}
                    size="small"
                    rowKey="id"
                    style={{ width: '100%' }}
                    columns={[
                      {
                        title: '字段',
                        dataIndex: 'field',
                        key: 'field',
                        width: 120,
                        render: (text) => <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{text}</span>
                      },
                      {
                        title: '名称',
                        dataIndex: 'name',
                        key: 'name',
                        width: 120
                      },
                      {
                        title: '取值类型',
                        dataIndex: 'valueType',
                        key: 'valueType',
                        width: 120,
                        render: (type, record) => (
                          <Select
                            value={record.conditionType || '大于'}
                            onChange={(value) => handleConditionTypeChange(record.id, value)}
                            style={{ width: '100%' }}
                            size="small"
                          >
                            <Option value="大于">大于</Option>
                            <Option value="小于">小于</Option>
                            <Option value="等于">等于</Option>
                            <Option value="大于等于">大于等于</Option>
                            <Option value="小于等于">小于等于</Option>
                            <Option value="不等于">不等于</Option>
                            <Option value="包含">包含</Option>
                            <Option value="不包含">不包含</Option>
                            <Option value="日期区间">日期区间</Option>
                            <Option value="数值区间">数值区间</Option>
                          </Select>
                        )
                      },
                      {
                        title: '默认值',
                        dataIndex: 'range',
                        key: 'range',
                        render: (range, record) => (
                          <Input
                            placeholder="请输入默认值"
                            value={range}
                            onChange={(e) => handleRangeChange(record.id, e.target.value)}
                            style={{ fontSize: '12px' }}
                          />
                        )
                      },
                      {
                        title: '操作',
                        key: 'action',
                        width: 80,
                        render: (_, record) => (
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => handleRemoveField(record.id)}
                          />
                        )
                      }
                    ]}
                  />
                )}
              </div>
            </div>
          </Col>
        </Row>
      </Modal>

        {/* 添加维度弹框 */}
        <Modal
          title="选择比对维度"
          open={dimensionModalVisible}
          onCancel={() => setDimensionModalVisible(false)}
          width={800}
          footer={[
            <Button key="cancel" onClick={() => setDimensionModalVisible(false)}>
              取消
            </Button>,
            <Button 
              key="confirm" 
              type="primary" 
              onClick={() => {
                // 这里可以添加确认选择的逻辑
                setDimensionModalVisible(false);
              }}
            >
              确定
            </Button>
          ]}
        >
          <div style={{ padding: '16px 0' }}>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>数据集字段</span>
            </div>
            
            <Table
              dataSource={mockDatasetFields}
              pagination={false}
              size="small"
              rowKey="field"
              rowSelection={{
                type: 'checkbox',
                selectedRowKeys: selectedDimensions.map(d => d.field),
                onChange: (selectedRowKeys, selectedRows) => {
                  setSelectedDimensions(selectedRows);
                },
              }}
              columns={[
                {
                  title: '字段',
                  dataIndex: 'field',
                  key: 'field',
                  width: 150,
                  render: (text) => <code style={{ fontSize: '12px', backgroundColor: '#f5f5f5', padding: '2px 6px', borderRadius: '3px' }}>{text}</code>
                },
                {
                  title: '名称',
                  dataIndex: 'name',
                  key: 'name',
                  width: 150,
                },
                {
                  title: '类型',
                  dataIndex: 'type',
                  key: 'type',
                  width: 120,
                  render: (type: string) => {
                    const colorMap: { [key: string]: string } = {
                      'string': 'blue',
                      'number': 'green',
                      'date': 'orange',
                      'boolean': 'purple'
                    };
                    return <Tag color={colorMap[type] || 'default'}>{type}</Tag>;
                  }
                },
                {
                  title: '属性',
                  dataIndex: 'attribute',
                  key: 'attribute',
                  render: (attribute) => <Tag color="cyan">{attribute}</Tag>
                }
              ]}
              style={{ 
                border: '1px solid #f0f0f0',
                borderRadius: '6px'
              }}
            />
          </div>
        </Modal>

        {/* 数据集选择弹框 */}
        <Modal
          title="选择基准数据集"
          open={datasetModalVisible}
          onCancel={() => setDatasetModalVisible(false)}
          onOk={() => {
            setDatasetModalVisible(false);
            message.success(`已选择 ${selectedBaselineDatasets.length} 个数据集`);
          }}
          width={800}
        >
          <Table
            rowSelection={{
              type: 'checkbox',
              selectedRowKeys: selectedBaselineDatasets.map(d => d.id),
              onChange: (selectedRowKeys, selectedRows) => {
                setSelectedBaselineDatasets(selectedRows);
              },
            }}
            columns={[
              {
                title: '数据集名称',
                dataIndex: 'name',
                key: 'name',
                width: 200,
              },
              {
                title: '描述',
                dataIndex: 'description',
                key: 'description',
                width: 300,
              },
              {
                title: '记录数',
                dataIndex: 'recordCount',
                key: 'recordCount',
                width: 120,
                render: (count: number) => (
                  <Tag color="blue">{count.toLocaleString()} 条</Tag>
                ),
              },
            ]}
            dataSource={mockDatasets}
            rowKey="id"
            size="small"
            scroll={{ y: 300 }}
          />
        </Modal>

        {/* 基准查询范围设置弹框 */}
        <Modal
          title="设置基准查询范围"
          open={baselineRangeModalVisible}
          onCancel={() => setBaselineRangeModalVisible(false)}
          onOk={() => {
            setBaselineRangeModalVisible(false);
            message.success('基准查询范围设置已保存');
          }}
          width={1200}
          bodyStyle={{ padding: '20px' }}
          style={{ top: 20 }}
        >
          <Row gutter={16} style={{ height: '600px' }}>
            {/* 左侧：数据集字段列表 */}
            <Col span={8}>
              <Collapse 
                defaultActiveKey={['1']} 
                style={{ 
                  border: '1px solid #d9d9d9', 
                  borderRadius: '6px', 
                  height: '100%'
                }}
              >
                <Panel 
                  header="数据集字段" 
                  key="1"
                  style={{ 
                    height: '100%'
                  }}
                >
                  <div style={{ 
                    maxHeight: '500px', 
                    overflowY: 'auto',
                    padding: '8px'
                  }}>
                    {mockDatasetFields.map(field => (
                      <div
                        key={field.field}
                        draggable
                        style={{
                          padding: '8px 12px',
                          margin: '4px 0',
                          backgroundColor: '#f8f9fa',
                          border: '1px solid #e9ecef',
                          borderRadius: '4px',
                          cursor: 'move',
                          fontSize: '13px'
                        }}
                      >
                        <div style={{ fontWeight: 'bold', color: '#333' }}>
                          {field.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                          {field.type} | {field.attribute}
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>
              </Collapse>
            </Col>

            {/* 右侧：基准查询范围配置 */}
            <Col span={16}>
              <div style={{ 
                border: '1px solid #d9d9d9', 
                borderRadius: '6px', 
                height: '100%',
                padding: '16px'
              }}>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: 'bold', 
                  marginBottom: '16px',
                  color: '#333'
                }}>
                  基准查询范围配置
                </div>
                
                <div style={{ 
                  minHeight: '400px',
                  border: '2px dashed #d9d9d9',
                  borderRadius: '6px',
                  padding: '20px',
                  backgroundColor: '#fafafa'
                }}>
                  {baselineRanges.length === 0 ? (
                    <div style={{ 
                      textAlign: 'center', 
                      color: '#999',
                      fontSize: '14px',
                      paddingTop: '100px'
                    }}>
                      拖拽左侧字段到此处设置基准查询范围
                    </div>
                  ) : (
                    baselineRanges.map(range => (
                      <div 
                        key={range.id}
                        style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          padding: '12px',
                          border: '1px solid #e9ecef',
                          borderRadius: '4px',
                          marginBottom: '8px',
                          backgroundColor: '#fff'
                        }}
                      >
                        <span style={{ flex: 1, fontSize: '14px' }}>
                          {range.field} {range.condition} {range.values}
                        </span>
                        <Space>
                          <Button 
                            type="text" 
                            size="small"
                            icon={<EditOutlined />}
                          />
                          <Button 
                            type="text" 
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => {
                              const newRanges = baselineRanges.filter(r => r.id !== range.id);
                              setBaselineRanges(newRanges);
                            }}
                          />
                        </Space>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Col>
          </Row>
        </Modal>

        {/* 基准指标选择弹框 */}
        <Modal
          title="选择基准指标"
          open={baselineMetricsModalVisible}
          onCancel={() => setBaselineMetricsModalVisible(false)}
          onOk={() => {
            setBaselineMetricsModalVisible(false);
            message.success(`已选择 ${selectedBaselineMetrics.length} 个基准指标`);
          }}
          width={800}
        >
          <Table
            rowSelection={{
              type: 'checkbox',
              selectedRowKeys: selectedBaselineMetrics.map(m => m.id),
              onChange: (selectedRowKeys, selectedRows) => {
                setSelectedBaselineMetrics(selectedRows);
              },
            }}
            columns={[
              {
                title: '指标编码',
                dataIndex: 'id',
                key: 'id',
                width: 120,
              },
              {
                title: '指标名称',
                dataIndex: 'name',
                key: 'name',
                width: 150,
              },
              {
                title: '单位',
                dataIndex: 'unit',
                key: 'unit',
                width: 80,
                render: (unit: string) => (
                  <Tag color="green">{unit}</Tag>
                ),
              },
              {
                title: '描述',
                dataIndex: 'description',
                key: 'description',
                render: (text: string) => text || '暂无描述',
              },
            ]}
            dataSource={mockIndicators}
            rowKey="id"
            size="small"
            scroll={{ y: 300 }}
          />
        </Modal>
      </div>
    );
  };

export default PriceSchemeManagementV2;