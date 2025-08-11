import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Modal, Form, Input, Select, Space, message, Popconfirm, Tag, Steps, Radio, Checkbox, Divider, Typography, Alert } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, CalculatorOutlined, FunctionOutlined, SaveOutlined, CheckCircleOutlined, SendOutlined } from '@ant-design/icons';
import { BarChart3, PieChart, TrendingUp } from 'lucide-react';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

// 接口定义
interface Metric {
  id: string;
  metricCode: string;
  metricName: string;
  type: 'atomic' | 'derived'; // 原子指标 | 计算指标
  bizSpec?: string; // 业务口径说明
  unit?: string;
  scale?: number; // 精度
  displayFormat?: 'number' | 'percent' | 'currency';
  mappings?: DatasetMapping[]; // 数据集字段绑定
  formula?: string; // 计算公式（计算指标）
  dependencies?: string[]; // 依赖指标
  placeholders?: string[]; // 占位符
  isBaselineEligible?: boolean; // 可作为基准指标
  tags?: string[]; // 适用范围标签
  category: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  usageCount?: number;
}

// 数据集字段映射
interface DatasetMapping {
  datasetId: string;
  datasetName?: string;
  fieldCode: string;
  fieldName?: string;
  defaultAgg?: 'NONE' | 'SUM' | 'AVG' | 'MIN' | 'MAX';
}

// 数据集定义
interface Dataset {
  id: string;
  name: string;
  fields: DatasetField[];
}

// 数据集字段
interface DatasetField {
  code: string;
  name: string;
  type: string;
}

interface MetricCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const MetricManagement: React.FC = () => {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [categories, setCategories] = useState<MetricCategory[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingMetric, setEditingMetric] = useState<any>(null);
  const [form] = Form.useForm();
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedField, setSelectedField] = useState<string>('');
  const [selectedAggregationType, setSelectedAggregationType] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAssociateModalVisible, setIsAssociateModalVisible] = useState(false);
  const [associatingMetric, setAssociatingMetric] = useState<Metric | null>(null);
  const [associateForm] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedMappings, setSelectedMappings] = useState<DatasetMapping[]>([]);
  const [isDatasetModalVisible, setIsDatasetModalVisible] = useState(false);
  const [mappingForm] = Form.useForm();

  // 模拟数据
  useEffect(() => {
    setCategories([
      { id: 'sales', name: '销售指标', description: '销售相关的业务指标', icon: '💰' },
      { id: 'finance', name: '财务指标', description: '财务分析相关指标', icon: '📊' },
      { id: 'inventory', name: '库存指标', description: '库存管理相关指标', icon: '📦' },
      { id: 'customer', name: '客户指标', description: '客户分析相关指标', icon: '👥' },
      { id: 'operational', name: '运营指标', description: '运营效率相关指标', icon: '⚙️' }
    ]);

    // 模拟数据集数据
    setDatasets([
      {
        id: 'ds_agreement_price',
        name: '集团采购协议数据集',
        fields: [
          { code: 'agreement_id', name: '协议ID', type: 'STRING' },
          { code: 'supplier_id', name: '供应商ID', type: 'STRING' },
          { code: 'supplier_name', name: '供应商名称', type: 'STRING' },
          { code: 'product_category', name: '产品类别', type: 'STRING' },
          { code: 'product_name', name: '产品名称', type: 'STRING' },
          { code: 'agreement_price', name: '协议价格', type: 'DECIMAL' },
          { code: 'quantity', name: '数量', type: 'INTEGER' },
          { code: 'discount_rate', name: '折扣率', type: 'DECIMAL' },
          { code: 'effective_date', name: '生效日期', type: 'DATE' },
          { code: 'expire_date', name: '失效日期', type: 'DATE' },
          { code: 'contract_amount', name: '合同金额', type: 'DECIMAL' },
          { code: 'payment_terms', name: '付款条件', type: 'STRING' }
        ]
      },
      {
        id: 'ds_vendor_offer',
        name: '供应商报价数据集',
        fields: [
          { code: 'quote_id', name: '报价ID', type: 'STRING' },
          { code: 'supplier_id', name: '供应商ID', type: 'STRING' },
          { code: 'supplier_name', name: '供应商名称', type: 'STRING' },
          { code: 'product_id', name: '产品ID', type: 'STRING' },
          { code: 'product_name', name: '产品名称', type: 'STRING' },
          { code: 'product_spec', name: '产品规格', type: 'STRING' },
          { code: 'offer_price', name: '报价', type: 'DECIMAL' },
          { code: 'quote_quantity', name: '报价数量', type: 'INTEGER' },
          { code: 'unit_price', name: '单价', type: 'DECIMAL' },
          { code: 'delivery_time', name: '交货时间', type: 'INTEGER' },
          { code: 'quote_date', name: '报价日期', type: 'DATE' },
          { code: 'valid_until', name: '报价有效期', type: 'DATE' },
          { code: 'currency', name: '币种', type: 'STRING' },
          { code: 'tax_rate', name: '税率', type: 'DECIMAL' }
        ]
      },
      {
        id: 'ds_orders',
        name: '订单事实表',
        fields: [
          { code: 'order_id', name: '订单ID', type: 'STRING' },
          { code: 'supplier_id', name: '供应商ID', type: 'STRING' },
          { code: 'supplier_name', name: '供应商名称', type: 'STRING' },
          { code: 'product_id', name: '产品ID', type: 'STRING' },
          { code: 'product_name', name: '产品名称', type: 'STRING' },
          { code: 'product_category', name: '产品类别', type: 'STRING' },
          { code: 'order_amount', name: '订单金额', type: 'DECIMAL' },
          { code: 'order_quantity', name: '订单数量', type: 'INTEGER' },
          { code: 'unit_price', name: '单价', type: 'DECIMAL' },
          { code: 'order_date', name: '订单日期', type: 'DATE' },
          { code: 'delivery_date', name: '交货日期', type: 'DATE' },
          { code: 'order_status', name: '订单状态', type: 'STRING' },
          { code: 'payment_amount', name: '付款金额', type: 'DECIMAL' },
          { code: 'discount_amount', name: '折扣金额', type: 'DECIMAL' }
        ]
      },
      {
        id: 'ds_product_master',
        name: '产品主数据',
        fields: [
          { code: 'product_id', name: '产品ID', type: 'STRING' },
          { code: 'product_name', name: '产品名称', type: 'STRING' },
          { code: 'product_code', name: '产品编码', type: 'STRING' },
          { code: 'category_id', name: '类别ID', type: 'STRING' },
          { code: 'category_name', name: '类别名称', type: 'STRING' },
          { code: 'brand', name: '品牌', type: 'STRING' },
          { code: 'model', name: '型号', type: 'STRING' },
          { code: 'specification', name: '规格', type: 'STRING' },
          { code: 'unit', name: '单位', type: 'STRING' },
          { code: 'standard_price', name: '标准价格', type: 'DECIMAL' }
        ]
      },
      {
        id: 'ds_supplier_master',
        name: '供应商主数据',
        fields: [
          { code: 'supplier_id', name: '供应商ID', type: 'STRING' },
          { code: 'supplier_name', name: '供应商名称', type: 'STRING' },
          { code: 'supplier_code', name: '供应商编码', type: 'STRING' },
          { code: 'supplier_type', name: '供应商类型', type: 'STRING' },
          { code: 'contact_person', name: '联系人', type: 'STRING' },
          { code: 'contact_phone', name: '联系电话', type: 'STRING' },
          { code: 'address', name: '地址', type: 'STRING' },
          { code: 'credit_rating', name: '信用等级', type: 'STRING' },
          { code: 'cooperation_years', name: '合作年限', type: 'INTEGER' },
          { code: 'payment_terms', name: '付款条件', type: 'STRING' }
        ]
      }
    ]);

    setMetrics([
      {
        id: 'metric_001',
        metricCode: 'TOTAL_SALES',
        metricName: '总销售额',
        type: 'atomic',
        bizSpec: '统计所有销售订单的总金额',
        unit: '元',
        scale: 2,
        displayFormat: 'currency',
        formula: 'SUM(order_amount)',
        mappings: [{
          datasetId: 'ds_orders',
          datasetName: '订单事实表',
          fieldCode: 'order_amount',
          fieldName: '订单金额',
          defaultAgg: 'SUM'
        }],
        isBaselineEligible: true,
        tags: ['销售', '金额'],
        category: 'sales',
        status: 'ACTIVE',
        createdBy: '张三',
        createdAt: '2024-01-15',
        updatedAt: '2024-01-20',
        usageCount: 156
       },
       {
        id: 'metric_002',
        metricCode: 'SQL_ORDER_VALUE',
        metricName: 'SQL订单价值',
        type: 'derived',
        bizSpec: '基于SQL查询计算的订单价值指标',
        unit: '元',
        scale: 2,
        displayFormat: 'currency',
        formula: 'SUM(order_amount * discount_rate)',
        dependencies: ['TOTAL_SALES'],
        mappings: [{
          datasetId: 'ds_orders',
          datasetName: '订单事实表',
          fieldCode: 'order_amount',
          fieldName: '订单金额',
          defaultAgg: 'SUM'
        }],
        isBaselineEligible: false,
        tags: ['销售', '计算'],
        category: 'sales',
        status: 'ACTIVE',
        createdBy: '李四',
        createdAt: '2024-01-10',
        updatedAt: '2024-01-18',
        usageCount: 89
       },
       {
        id: 'metric_003',
        metricCode: 'CUSTOMER_COUNT',
        metricName: '客户数量统计',
        type: 'atomic',
        bizSpec: '统计活跃客户的总数量',
        unit: '个',
        scale: 0,
        displayFormat: 'number',
        formula: 'COUNT(DISTINCT customer_id)',
        mappings: [{
          datasetId: 'ds_customers',
          datasetName: '客户维度表',
          fieldCode: 'customer_id',
          fieldName: '客户ID',
          defaultAgg: 'NONE'
        }],
        isBaselineEligible: true,
        tags: ['客户', '统计'],
        category: 'customer',
        status: 'ACTIVE',
        createdBy: '王五',
        createdAt: '2024-01-12',
        updatedAt: '2024-01-19',
        usageCount: 234
      },
      {
        id: 'metric_004',
        metricCode: 'INVENTORY_CLOUD',
        metricName: '库存云指标',
        type: 'derived',
        bizSpec: '基于云端数据计算的库存相关指标',
        unit: '%',
        scale: 2,
        displayFormat: 'percent',
        formula: '(stock_in - stock_out) / total_capacity * 100',
        dependencies: [],
        mappings: [{
          datasetId: 'ds_inventory',
          datasetName: '库存事实表',
          fieldCode: 'stock_in',
          fieldName: '入库量',
          defaultAgg: 'SUM'
        }],
        isBaselineEligible: false,
        tags: ['库存', '比率'],
        category: 'inventory',
        status: 'ACTIVE',
        createdBy: '赵六',
        createdAt: '2024-01-08',
        updatedAt: '2024-01-16',
        usageCount: 67
      },
      {
        id: 'metric_005',
        metricCode: 'PROFIT_MARGIN',
        metricName: '利润率分析',
        type: 'derived',
        bizSpec: '计算销售利润占销售收入的比例',
        unit: '%',
        scale: 4,
        displayFormat: 'percent',
        formula: '((revenue - cost) / revenue) * 100',
        dependencies: [],
        mappings: [{
          datasetId: 'ds_finance',
          datasetName: '财务事实表',
          fieldCode: 'revenue',
          fieldName: '收入',
          defaultAgg: 'SUM'
        }],
        isBaselineEligible: false,
        tags: ['财务', '比率'],
        category: 'finance',
        status: 'ACTIVE',
        createdBy: '孙七',
        createdAt: '2024-01-05',
        updatedAt: '2024-01-14',
        usageCount: 123
      }
    ]);
  }, []);

  const filteredMetrics = selectedCategory === 'all' 
    ? metrics 
    : metrics.filter(m => m.category === selectedCategory);

  const columns = [
    {
      title: '指标编码',
      dataIndex: 'metricCode',
      key: 'metricCode',
      width: 120,
      render: (text: string) => <span className="font-mono text-sm">{text}</span>
    },
    {
      title: '指标名称',
      dataIndex: 'metricName',
      key: 'metricName',
      width: 150,
      render: (text: string, record: Metric) => (
        <Button 
          type="link" 
          className="p-0 h-auto font-medium text-left"
          onClick={() => handleView(record)}
        >
          {text}
        </Button>
      )
    },
    {
      title: '指标分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (categoryId: string) => {
        const category = categories.find(c => c.id === categoryId);
        return category ? category.name : categoryId;
      }
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 80
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={status === 'ACTIVE' ? 'green' : 'red'}>
          {status === 'ACTIVE' ? '启用' : '禁用'}
        </Tag>
      )
    },

    {
      title: '创建人',
      dataIndex: 'createdBy',
      key: 'createdBy',
      width: 100
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 120
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: Metric) => (
        <Space>
          <Button 
             type="link" 
             icon={<FunctionOutlined />} 
             size="small"
             onClick={() => handleAssociate(record)}
           >
             关联数据集
           </Button>
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            size="small"
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个指标吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              type="link" 
              icon={<DeleteOutlined />} 
              size="small"
              danger
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const handleAdd = () => {
    setEditingMetric(null);
    form.resetFields();
    setCurrentStep(0);
    setIsModalVisible(true);
  };

  const handleEdit = (metric: Metric) => {
    setEditingMetric(metric);
    form.setFieldsValue({
      metricName: metric.metricName,
      metricCode: metric.metricCode,
      type: metric.type,
      bizSpec: metric.bizSpec,
      unit: metric.unit,
      scale: metric.scale,
      displayFormat: metric.displayFormat,
      formula: metric.formula,
      category: metric.category,
      isBaselineEligible: metric.isBaselineEligible,
      tags: metric.tags
    });
    setCurrentStep(0);
    setIsModalVisible(true);
  };

  const handleView = (metric: Metric) => {
    message.info('查看指标详情功能');
  };

  const handleAssociate = (metric: Metric) => {
    setAssociatingMetric(metric);
    setSelectedModel('');
    setSelectedField('');
    setSelectedAggregationType('');
    associateForm.resetFields();
    setIsAssociateModalVisible(true);
  };

  const handleAssociateSubmit = async () => {
    try {
      const values = await associateForm.validateFields();
      // 这里可以添加实际的关联逻辑
      message.success('关联数据集成功');
      setIsAssociateModalVisible(false);
      // 可以在这里更新指标数据
    } catch (error) {
      console.error('关联数据集失败:', error);
    }
  };

  const handleAssociateModel = (metric: Metric) => {
    setAssociatingMetric(metric);
    setSelectedModel('');
    setSelectedField('');
    setSelectedAggregationType('');
    associateForm.resetFields();
    setIsAssociateModalVisible(true);
  };

  const handleAssociateSave = async () => {
    try {
      const values = await associateForm.validateFields();
      
      // 更新指标的关联数据集信息
      const updatedMetrics = metrics.map(metric => {
        if (metric.id === associatingMetric?.id) {
          return {
            ...metric,
            modelName: values.modelName,
            formula: `${values.aggregationType}(${values.fieldName})`
          };
        }
        return metric;
      });
      
      setMetrics(updatedMetrics);
      setIsAssociateModalVisible(false);
      message.success('关联数据模型成功！');
    } catch (error) {
      console.error('关联失败:', error);
    }
  };

  const handleAssociateCancel = () => {
    setIsAssociateModalVisible(false);
    setAssociatingMetric(null);
    setSelectedModel('');
    setSelectedField('');
    setSelectedAggregationType('');
    associateForm.resetFields();
  };

  const handleToggleStatus = (metric: Metric) => {
    const newStatus = metric.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setMetrics(metrics.map(m => 
      m.id === metric.id ? { ...m, status: newStatus } : m
    ));
    message.success(`指标已${newStatus === 'ACTIVE' ? '启用' : '禁用'}`);
  };

  const handleDelete = (id: string) => {
    setMetrics(metrics.filter(m => m.id !== id));
    message.success('删除成功');
  };

  const handleNext = async () => {
    if (currentStep === 0) {
      try {
        await form.validateFields(['metricCode', 'metricName', 'category']);
        setCurrentStep(1);
      } catch (error) {
        message.error('请填写完整的基本信息');
      }
    }
  };

  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSave = () => {
    form.validateFields().then((values) => {
      const newMetric: Metric = {
        id: editingMetric?.id || Date.now().toString(),
        ...values,
        status: 'ACTIVE',
        createdBy: editingMetric?.createdBy || '当前用户',
        createdAt: editingMetric?.createdAt || new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
        usageCount: editingMetric?.usageCount || 0
      };

      if (editingMetric) {
        setMetrics(metrics.map(m => 
          m.id === editingMetric.id ? newMetric : m
        ));
        message.success('更新成功');
      } else {
        setMetrics([...metrics, newMetric]);
        message.success('创建成功');
      }

      setIsModalVisible(false);
      setCurrentStep(0);
    });
  };

  const steps = [
    {
      title: '基本信息',
      description: '填写指标基本信息',
    },
    {
      title: '数据集字段绑定',
      description: '绑定数据集字段映射',
    },
    {
      title: '计算定义',
      description: '定义计算公式（计算指标）',
    },
    {
      title: '适用范围',
      description: '设置适用范围和标签',
    },
    {
      title: '预览与校验',
      description: '预览配置并校验',
    },
  ];

  const metricTypeOptions = [
    { value: 'COUNT', label: '计数 (COUNT)', description: '统计记录数量' },
    { value: 'SUM', label: '求和 (SUM)', description: '对数值字段求和' },
    { value: 'AVG', label: '平均值 (AVG)', description: '计算平均值' },
    { value: 'MAX', label: '最大值 (MAX)', description: '获取最大值' },
    { value: 'MIN', label: '最小值 (MIN)', description: '获取最小值' },
    { value: 'RATIO', label: '比率 (RATIO)', description: '计算比率或比例' },
    { value: 'CUSTOM', label: '自定义 (CUSTOM)', description: '自定义计算公式' }
  ];

  const dataTypeOptions = [
    { value: 'INTEGER', label: '整数' },
    { value: 'DECIMAL', label: '小数' },
    { value: 'PERCENTAGE', label: '百分比' }
  ];

  return (
    <div className="p-6">
      <Card>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">指标库管理</h2>
            <p className="text-gray-500 mt-1">管理系统中的所有业务指标，定义计算规则和分类</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增指标
          </Button>
        </div>
        
        <div className="mb-4">
          <Space>
            <span>指标分类：</span>
            <Select
              value={selectedCategory}
              onChange={setSelectedCategory}
              style={{ width: 200 }}
            >
              <Option value="all">全部分类</Option>
              {categories.map(category => (
                <Option key={category.id} value={category.id}>
                  <Space>
                    <span>{category.icon}</span>
                    {category.name}
                  </Space>
                </Option>
              ))}
            </Select>
          </Space>
        </div>
        
        <Table
          columns={columns}
          dataSource={filteredMetrics}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      <Modal
        title={
          <div className="flex items-center justify-between">
            <span>{editingMetric ? '编辑指标' : '新增指标'} · {editingMetric ? '编辑' : '新建'}</span>
            <Space>
              <Button icon={<SaveOutlined />}>保存</Button>
              <Button icon={<CheckCircleOutlined />}>校验</Button>
              <Button icon={<SendOutlined />} type="primary">发布</Button>
            </Space>
          </div>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>
            取消
          </Button>,
          currentStep > 0 && (
            <Button key="prev" onClick={handlePrev}>
              上一步
            </Button>
          ),
          currentStep < steps.length - 1 ? (
            <Button key="next" type="primary" onClick={handleNext}>
              下一步
            </Button>
          ) : (
            <Button key="save" type="primary" onClick={handleSave}>
              完成
            </Button>
          )
        ].filter(Boolean)}
        width={900}
      >
        <div className="mb-6">
          <Steps current={currentStep} items={steps} />
        </div>
        
        <div className="mt-6">
          <Form form={form} layout="vertical">
            {currentStep === 0 && (
              <div>
                <Title level={4}>基本信息</Title>
                <div className="grid grid-cols-2 gap-4">
                  <Form.Item
                    name="metricName"
                    label="指标名称"
                    rules={[{ required: true, message: '请输入指标名称' }]}
                  >
                    <Input placeholder="协议价 / 最低价 / 差异率" />
                  </Form.Item>
                  <Form.Item
                    name="metricCode"
                    label="指标编码"
                    rules={[{ required: true, message: '请输入指标编码' }]}
                  >
                    <Input 
                      placeholder="ind_agreement_price" 
                      disabled={!!editingMetric}
                    />
                  </Form.Item>
                </div>
                <Form.Item
                  name="type"
                  label="指标类型"
                  rules={[{ required: true, message: '请选择指标类型' }]}
                >
                  <Radio.Group>
                    <Radio value="atomic">原子指标</Radio>
                    <Radio value="derived">计算指标</Radio>
                  </Radio.Group>
                </Form.Item>
                <Form.Item
                  name="bizSpec"
                  label="业务口径说明"
                >
                  <TextArea 
                    placeholder="请描述指标的业务含义和计算逻辑" 
                    rows={3}
                  />
                </Form.Item>
                <div className="grid grid-cols-3 gap-4">
                  <Form.Item
                    name="unit"
                    label="单位/精度"
                  >
                    <Input placeholder="CNY" />
                  </Form.Item>
                  <Form.Item
                    name="scale"
                    label="精度"
                  >
                    <Input placeholder="2" type="number" />
                  </Form.Item>
                  <Form.Item
                    name="displayFormat"
                    label="展示格式"
                  >
                    <Select placeholder="选择格式">
                      <Option value="number">数字</Option>
                      <Option value="percent">百分比</Option>
                      <Option value="currency">货币</Option>
                    </Select>
                  </Form.Item>
                </div>
              </div>
            )}
          
            {currentStep === 1 && (
              <div>
                <Title level={4}>数据集字段绑定</Title>
                <Text type="secondary">原子指标必填；计算指标用于字段映射提示/血缘</Text>
                <Divider />
                
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <Text strong>已有关联</Text>
                    <Button 
                      type="primary" 
                      size="small" 
                      icon={<PlusOutlined />}
                      onClick={() => setIsDatasetModalVisible(true)}
                    >
                      添加映射
                    </Button>
                  </div>
                  
                  <Table
                    size="small"
                    dataSource={selectedMappings}
                    columns={[
                      {
                        title: '数据集',
                        dataIndex: 'datasetName',
                        key: 'datasetName',
                      },
                      {
                        title: '字段',
                        dataIndex: 'fieldName',
                        key: 'fieldName',
                      },
                      {
                        title: '默认聚合',
                        dataIndex: 'defaultAgg',
                        key: 'defaultAgg',
                      },
                      {
                        title: '操作',
                        key: 'action',
                        render: (_, record, index) => (
                          <Button 
                            type="link" 
                            size="small" 
                            danger
                            onClick={() => {
                              const newMappings = [...selectedMappings];
                              newMappings.splice(index, 1);
                              setSelectedMappings(newMappings);
                            }}
                          >
                            删除
                          </Button>
                        ),
                      },
                    ]}
                    pagination={false}
                  />
                </div>
              </div>
            )}
            
            {currentStep === 2 && (
              <div>
                <Title level={4}>计算定义</Title>
                <Alert 
                  message="当选择'计算指标'时显示此步骤" 
                  type="info" 
                  showIcon 
                  className="mb-4"
                />
                
                <Form.Item
                  name="formula"
                  label="公式编辑器"
                  help="可引用指标、常量、函数。例：MIN(ind_agreement_price) 或 (ind_agreement_price - ${BASELINE}) / ${BASELINE}"
                >
                  <TextArea 
                    placeholder="请输入计算公式" 
                    rows={4}
                  />
                </Form.Item>
                
                <Form.Item
                  name="dependencies"
                  label="依赖指标选择"
                  help="自动解析并校验依赖"
                >
                  <Select
                    mode="multiple"
                    placeholder="选择依赖的指标"
                    options={metrics.map(m => ({ label: m.metricName, value: m.metricCode }))}
                  />
                </Form.Item>
                
                <div className="bg-gray-50 p-3 rounded">
                  <Text type="secondary">维度粒度提示：按模型/方案的维度进行 group by</Text>
                </div>
              </div>
            )}
            
            {currentStep === 3 && (
              <div>
                <Title level={4}>适用范围</Title>
                
                <Form.Item
                  name="tags"
                  label="适用数据域/组织标签"
                >
                  <Select
                    mode="tags"
                    placeholder="添加标签，如：采购、集团等"
                    options={[
                      { label: '采购', value: '采购' },
                      { label: '集团', value: '集团' },
                      { label: '销售', value: '销售' },
                      { label: '财务', value: '财务' },
                    ]}
                  />
                </Form.Item>
                
                <Form.Item
                  name="isBaselineEligible"
                  label="可作为基准指标"
                >
                  <Radio.Group>
                    <Radio value={true}>是</Radio>
                    <Radio value={false}>否</Radio>
                  </Radio.Group>
                </Form.Item>
              </div>
            )}
            
            {currentStep === 4 && (
              <div>
                <Title level={4}>预览与校验</Title>
                
                <div className="space-y-4">
                  <div className="bg-green-50 p-4 rounded">
                    <Text strong className="text-green-600">校验结果</Text>
                    <div className="mt-2 space-y-1">
                      <div>✓ 映射完整</div>
                      <div>✓ 依赖存在</div>
                      <div>✓ 单位/精度合规</div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded">
                    <Text strong>解析公式/生成伪SQL</Text>
                    <div className="mt-2 font-mono text-sm bg-white p-2 rounded border">
                      SELECT SUM(agreement_price) as ind_agreement_price<br/>
                      FROM ds_agreement_price<br/>
                      GROUP BY product_id, supplier_id
                    </div>
                  </div>
                  
                  <div>
                    <Text strong>样例试算</Text>
                    <div className="mt-2">
                      <Space>
                        <Select placeholder="选择数据集" style={{ width: 200 }}>
                          {datasets.map(ds => (
                            <Option key={ds.id} value={ds.id}>{ds.name}</Option>
                          ))}
                        </Select>
                        <Select placeholder="选择维度" style={{ width: 200 }}>
                          <Option value="product_id">产品ID</Option>
                          <Option value="supplier_id">供应商ID</Option>
                        </Select>
                        <Button type="primary">预览10行</Button>
                      </Space>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Form>
        </div>
      </Modal>

      {/* 关联数据集弹框 */}
      <Modal
        title="关联数据模型"
        open={isAssociateModalVisible}
        onCancel={() => setIsAssociateModalVisible(false)}
         onOk={handleAssociateSubmit}
        width={600}
      >
        <Form form={associateForm} layout="vertical">
          <Form.Item
            name="modelName"
            label="选择数据模型"
            rules={[{ required: true, message: '请选择数据模型' }]}
          >
            <Select 
              placeholder="请选择数据模型"
              value={selectedModel}
              onChange={setSelectedModel}
            >
              <Option value="procurement_agreement_detail">采购协议明细表</Option>
              <Option value="procurement_order_detail">采购订单明细表</Option>
              <Option value="historical_procurement_inbound">历史采购入库明细</Option>
              <Option value="supplier_quotation_detail">供应商报价明细表</Option>
              <Option value="procurement_contract_detail">采购合同明细表</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="fieldName"
            label="选择字段"
            rules={[{ required: true, message: '请选择字段' }]}
          >
            <Select 
              placeholder="请选择字段"
              value={selectedField}
              onChange={setSelectedField}
            >
              <Option value="sales_amount">销售金额</Option>
              <Option value="order_amount">订单金额</Option>
              <Option value="customer_id">客户ID</Option>
              <Option value="product_id">产品ID</Option>
              <Option value="quantity">数量</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="aggregationType"
            label="聚合类型"
            rules={[{ required: true, message: '请选择聚合类型' }]}
          >
            <Select 
              placeholder="请选择聚合类型"
              value={selectedAggregationType}
              onChange={setSelectedAggregationType}
            >
              <Option value="COUNT">计数 (COUNT)</Option>
              <Option value="SUM">求和 (SUM)</Option>
              <Option value="AVG">平均值 (AVG)</Option>
              <Option value="MAX">最大值 (MAX)</Option>
              <Option value="MIN">最小值 (MIN)</Option>
              <Option value="RATIO">比率 (RATIO)</Option>
              <Option value="CUSTOM">自定义 (CUSTOM)</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 数据集字段绑定模态框 */}
      <Modal
        title="添加数据集字段映射"
        open={isDatasetModalVisible}
        onOk={() => {
          mappingForm.validateFields().then(values => {
            const selectedDataset = datasets.find(ds => ds.id === values.datasetId);
            const selectedField = selectedDataset?.fields.find(f => f.name === values.fieldName);
            
            const newMapping = {
               datasetId: values.datasetId,
               datasetName: selectedDataset?.name || '',
               fieldName: values.fieldName,
               fieldCode: selectedField?.code || values.fieldName,
               fieldType: selectedField?.type || '',
               defaultAgg: values.defaultAgg,
             };
            
            setSelectedMappings([...selectedMappings, newMapping]);
            setIsDatasetModalVisible(false);
            mappingForm.resetFields();
          });
        }}
        onCancel={() => {
          setIsDatasetModalVisible(false);
          mappingForm.resetFields();
        }}
        okText="添加"
        cancelText="取消"
      >
        <Form form={mappingForm} layout="vertical">
          <Form.Item
            name="datasetId"
            label="选择数据集"
            rules={[{ required: true, message: '请选择数据集' }]}
          >
            <Select 
              placeholder="请选择数据集"
              onChange={(value) => {
                mappingForm.setFieldsValue({ fieldName: undefined });
              }}
            >
              {datasets.map(ds => (
                <Option key={ds.id} value={ds.id}>{ds.name}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="fieldName"
            label="选择字段"
            rules={[{ required: true, message: '请选择字段' }]}
          >
            <Select placeholder="请选择字段">
              {(() => {
                const selectedDatasetId = mappingForm.getFieldValue('datasetId');
                const selectedDataset = datasets.find(ds => ds.id === selectedDatasetId);
                return selectedDataset?.fields.map(field => (
                  <Option key={field.name} value={field.name}>
                    {field.name} ({field.type})
                  </Option>
                )) || [];
              })()}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="defaultAgg"
            label="默认聚合方式"
            rules={[{ required: true, message: '请选择聚合方式' }]}
          >
            <Select placeholder="请选择聚合方式">
              <Option value="SUM">求和 (SUM)</Option>
              <Option value="COUNT">计数 (COUNT)</Option>
              <Option value="AVG">平均值 (AVG)</Option>
              <Option value="MAX">最大值 (MAX)</Option>
              <Option value="MIN">最小值 (MIN)</Option>
              <Option value="DISTINCT_COUNT">去重计数</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MetricManagement;