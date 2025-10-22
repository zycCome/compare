import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Modal, Form, Input, Select, Space, message, Popconfirm, Tag, Steps, Radio, Checkbox, Divider, Typography, Alert, Collapse } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, CalculatorOutlined, FunctionOutlined, SaveOutlined, CheckCircleOutlined, SendOutlined } from '@ant-design/icons';
import { BarChart3, PieChart, TrendingUp } from 'lucide-react';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

// 接口定义
interface Metric {
  id: string;
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
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedMappings, setSelectedMappings] = useState<DatasetMapping[]>([]);
  const [isDatasetModalVisible, setIsDatasetModalVisible] = useState(false);
  const [mappingForm] = Form.useForm();
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const [descriptionLength, setDescriptionLength] = useState<number>(0);
  const [expressionModalVisible, setExpressionModalVisible] = useState<boolean>(false);
  const [currentExpression, setCurrentExpression] = useState<string>('');
  const [expandedFieldGroups, setExpandedFieldGroups] = useState<Record<string, boolean>>({
    string: true,
    number: true,
    date: true
  });
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
    setIsModalVisible(true);
  };

  const handleEdit = (metric: Metric) => {
    setEditingMetric(metric);
    form.setFieldsValue({
      metricName: metric.metricName,
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

  
  const handleSave = () => {
    form.validateFields().then((values) => {
      // 检查描述长度
      if (values.bizSpec && values.bizSpec.length > 500) {
        message.error('指标描述不能超过500字');
        return;
      }
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
      form.resetFields();
      setDescriptionLength(0);
    });
  };

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
        title="新建指标"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>
            关闭
          </Button>,
          <Button key="save" type="primary" onClick={handleSave}>
            保存
          </Button>
        ]}
        width={800}
      >
        <Form form={form} layout="vertical">
          <div>
            <Title level={4}>基本信息</Title>
            <div className="grid grid-cols-1 gap-4">
              <Form.Item
                name="metricName"
                label={<span>指标名称 <span style={{ color: 'red' }}>*</span></span>}
                rules={[{ required: true, message: '请输入指标名称' }]}
              >
                <Input placeholder="协议价 / 最低价 / 差异率" />
              </Form.Item>
            </div>

            <Form.Item
              name="bizSpec"
              label="指标描述"
            >
              <TextArea
                placeholder="请描述指标的业务含义和计算逻辑"
                rows={3}
                onChange={(e) => setDescriptionLength(e.target.value.length)}
              />
              <div style={{ textAlign: 'right', color: '#999', fontSize: '12px', marginTop: '4px' }}>
                {descriptionLength}/500
              </div>
            </Form.Item>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="unit"
                label="单位"
              >
                <Input placeholder="万元、个、%" />
              </Form.Item>
              <Form.Item
                name="scale"
                label="精度"
              >
                <Input
                  placeholder="2"
                  type="number"
                  min={0}
                  max={10}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </div>
          </div>

          <Divider />

          <div>
            <Title level={4}>数据集字段绑定</Title>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="datasetId"
                label={<span>数据集 <span style={{ color: 'red' }}>*</span></span>}
                rules={[{ required: true, message: '请选择数据集' }]}
              >
                <Select placeholder="请选择">
                  {datasets.map(dataset => (
                    <Option key={dataset.id} value={dataset.id}>
                      {dataset.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                name="expression"
                label="表达式"
              >
                <Input
                  placeholder="点击编辑表达式"
                  readOnly
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setExpressionModalVisible(true);
                    setCurrentExpression(form.getFieldValue('expression') || '');
                  }}
                />
              </Form.Item>
            </div>
          </div>
        </Form>
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
          setSelectedDatasetId('');
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
                setSelectedDatasetId(value);
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

      {/* 表达式编辑弹窗 */}
      <Modal
        title="表达式编辑器"
        open={expressionModalVisible}
        onCancel={() => {
          setExpressionModalVisible(false);
          setCurrentExpression('');
        }}
        onOk={() => {
          form.setFieldsValue({ expression: currentExpression });
          setExpressionModalVisible(false);
          message.success('表达式已保存');
        }}
        width={1600}
        style={{ top: 20 }}
      >
        <div style={{ display: 'flex', gap: '16px', height: '700px' }}>
          {/* 左侧：数据集字段和数据库函数（组合） */}
          <div style={{ width: '480px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 数据集字段 */}
            <div style={{ flex: 1 }}>
            <Card 
              size="small" 
              style={{ 
                height: '100%',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                overflow: 'hidden'
              }}
              title={
                <div style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  margin: '-12px -16px 12px -16px',
                  padding: '12px 16px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                }}>
                  📊 数据集字段
                </div>
              }
            >
              <div style={{ 
                fontSize: '12px', 
                color: '#64748b', 
                marginBottom: '16px',
                padding: '8px 12px',
                background: 'rgba(99, 102, 241, 0.05)',
                borderRadius: '8px',
                border: '1px solid rgba(99, 102, 241, 0.1)'
              }}>
                💡 按类型分组，点击字段添加到表达式
              </div>

              <Collapse
                size="small"
                ghost
                activeKey={Object.keys(expandedFieldGroups).filter(key => expandedFieldGroups[key])}
                onChange={(keys) => {
                  const newExpandedState: Record<string, boolean> = {};
                  Object.keys(expandedFieldGroups).forEach(key => {
                    newExpandedState[key] = keys.includes(key);
                  });
                  setExpandedFieldGroups(newExpandedState);
                }}
                style={{
                  background: 'transparent'
                }}
                items={[
                  {
                    key: 'string',
                    label: (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#059669',
                        fontWeight: '500',
                        fontSize: '13px'
                      }}>
                        📝 文本类型
                        <span style={{ 
                          fontSize: '11px', 
                          color: '#6b7280',
                          background: 'rgba(5, 150, 105, 0.1)',
                          padding: '2px 6px',
                          borderRadius: '10px'
                        }}>
                          ({datasets.flatMap(ds => ds.fields.filter(f => f.type === 'STRING')).length})
                        </span>
                      </div>
                    ),
                    children: (
                      <div style={{ 
                        maxHeight: '150px', 
                        overflowY: 'auto',
                        padding: '8px 0'
                      }}>
                        {datasets.flatMap(dataset =>
                          dataset.fields
                            .filter(field => field.type === 'STRING')
                            .map(field => (
                              <Button
                                key={`${dataset.id}-${field.code}`}
                                type="text"
                                size="small"
                                style={{
                                  textAlign: 'left',
                                  height: 'auto',
                                  padding: '8px 12px',
                                  whiteSpace: 'normal',
                                  fontSize: '11px',
                                  display: 'block',
                                  width: '100%',
                                  marginBottom: '4px',
                                  borderRadius: '8px',
                                  background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                                  border: '1px solid #a7f3d0',
                                  transition: 'all 0.2s ease',
                                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                                }}
                                onClick={() => {
                                  setCurrentExpression(prev => prev ? `${prev} + ${field.code}` : field.code);
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
                                  e.currentTarget.style.background = 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                                  e.currentTarget.style.background = 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)';
                                }}
                              >
                                <div style={{ fontFamily: 'monospace', color: '#065f46', fontWeight: '500' }}>{field.code}</div>
                                <div style={{ fontSize: '10px', color: '#047857' }}>{field.name}</div>
                                <div style={{ fontSize: '9px', color: '#6b7280' }}>{dataset.name}</div>
                              </Button>
                            ))
                        )}
                      </div>
                    )
                  },
                  {
                    key: 'number',
                    label: (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#dc2626',
                        fontWeight: '500',
                        fontSize: '13px'
                      }}>
                        🔢 数值类型
                        <span style={{ 
                          fontSize: '11px', 
                          color: '#999' }}>
                          ({datasets.flatMap(ds => ds.fields.filter(f => ['INTEGER', 'DECIMAL', 'FLOAT', 'DOUBLE'].includes(f.type))).length})
                        </span>
                      </div>
                    ),
                    children: (
                      <div style={{ 
                        maxHeight: '150px', 
                        overflowY: 'auto',
                        padding: '8px 0'
                      }}>
                        {datasets.flatMap(dataset =>
                          dataset.fields
                            .filter(field => ['INTEGER', 'DECIMAL', 'FLOAT', 'DOUBLE'].includes(field.type))
                            .map(field => (
                              <Button
                                key={`${dataset.id}-${field.code}`}
                                type="text"
                                size="small"
                                style={{
                                  textAlign: 'left',
                                  height: 'auto',
                                  padding: '8px 12px',
                                  whiteSpace: 'normal',
                                  fontSize: '11px',
                                  display: 'block',
                                  width: '100%',
                                  marginBottom: '4px',
                                  borderRadius: '8px',
                                  background: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)',
                                  border: '1px solid #fca5a5',
                                  transition: 'all 0.2s ease',
                                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                                }}
                                onClick={() => {
                                  setCurrentExpression(prev => prev ? `${prev} + ${field.code}` : field.code);
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
                                  e.currentTarget.style.background = 'linear-gradient(135deg, #fecaca 0%, #f87171 100%)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                                  e.currentTarget.style.background = 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)';
                                }}
                              >
                                <div style={{ fontFamily: 'monospace', color: '#991b1b', fontWeight: '500' }}>{field.code}</div>
                                <div style={{ fontSize: '10px', color: '#dc2626' }}>{field.name}</div>
                                <div style={{ fontSize: '9px', color: '#6b7280' }}>{dataset.name}</div>
                              </Button>
                            ))
                        )}
                      </div>
                    )
                  },
                  {
                    key: 'date',
                    label: (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#7c3aed',
                        fontWeight: '500',
                        fontSize: '13px'
                      }}>
                        📅 日期类型
                        <span style={{ 
                          fontSize: '11px', 
                          color: '#6b7280',
                          background: 'rgba(124, 58, 237, 0.1)',
                          padding: '2px 6px',
                          borderRadius: '10px'
                        }}>
                          ({datasets.flatMap(ds => ds.fields.filter(f => ['DATE', 'DATETIME', 'TIMESTAMP'].includes(f.type))).length})
                        </span>
                      </div>
                    ),
                    children: (
                      <div style={{ 
                        maxHeight: '150px', 
                        overflowY: 'auto',
                        padding: '8px 0'
                      }}>
                        {datasets.flatMap(dataset =>
                          dataset.fields
                            .filter(field => ['DATE', 'DATETIME', 'TIMESTAMP'].includes(field.type))
                            .map(field => (
                              <Button
                                key={`${dataset.id}-${field.code}`}
                                type="text"
                                size="small"
                                style={{
                                  textAlign: 'left',
                                  height: 'auto',
                                  padding: '8px 12px',
                                  whiteSpace: 'normal',
                                  fontSize: '11px',
                                  display: 'block',
                                  width: '100%',
                                  marginBottom: '4px',
                                  borderRadius: '8px',
                                  background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                                  border: '1px solid #d1d5db',
                                  transition: 'all 0.2s ease',
                                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                                }}
                                onClick={() => {
                                  setCurrentExpression(prev => prev ? `${prev} + ${field.code}` : field.code);
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
                                  e.currentTarget.style.background = 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                                  e.currentTarget.style.background = 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)';
                                }}
                              >
                                <div style={{ fontFamily: 'monospace', color: '#374151', fontWeight: '500' }}>{field.code}</div>
                                <div style={{ fontSize: '10px', color: '#4b5563' }}>{field.name}</div>
                                <div style={{ fontSize: '9px', color: '#6b7280' }}>{dataset.name}</div>
                              </Button>
                            ))
                        )}
                      </div>
                    )
                  }
                ]}
              />
            </Card>
          </div>

          {/* 数据库函数 */}
          <div style={{ flex: 1 }}>
            <Card
              size="small"
              title={
                <div style={{
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  margin: '-12px -16px 12px -16px',
                  padding: '12px 16px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                }}>
                  ⚙️ 数据库函数
                </div>
              }
              style={{
                height: '100%',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                overflow: 'hidden'
              }}
            >
              <div style={{
                fontSize: '12px',
                color: '#64748b',
                marginBottom: '12px',
                padding: '8px 12px',
                background: 'rgba(5, 150, 105, 0.05)',
                borderRadius: '8px',
                border: '1px solid rgba(5, 150, 105, 0.1)'
              }}>
                💡 点击函数添加到表达式
              </div>

              <div style={{ height: '620px', overflowY: 'auto' }}>
                {/* 聚合函数 */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#333', borderBottom: '1px solid #f0f0f0', paddingBottom: '4px' }}>
                    聚合函数
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '4px' }}>
                    {[
                      { func: 'SUM', desc: '求和', example: 'SUM(column_name)' },
                      { func: 'COUNT', desc: '计数', example: 'COUNT(column_name)' },
                      { func: 'AVG', desc: '平均值', example: 'AVG(column_name)' },
                      { func: 'MAX', desc: '最大值', example: 'MAX(column_name)' },
                      { func: 'MIN', desc: '最小值', example: 'MIN(column_name)' },
                      { func: 'COUNT_DISTINCT', desc: '去重计数', example: 'COUNT(DISTINCT column_name)' },
                      { func: 'SUM_DISTINCT', desc: '去重求和', example: 'SUM(DISTINCT column_name)' },
                      { func: 'AVG_DISTINCT', desc: '去重平均', example: 'AVG(DISTINCT column_name)' },
                    ].map(item => (
                      <Button
                        key={item.func}
                        type="link"
                        size="small"
                        style={{
                          textAlign: 'left',
                          height: 'auto',
                          padding: '8px',
                          whiteSpace: 'normal',
                          fontSize: '11px',
                          border: '1px solid #f0f0f0',
                          borderRadius: '4px',
                          marginBottom: '4px',
                          width: '100%'
                        }}
                        onClick={() => {
                          setCurrentExpression(prev => prev ? `${prev} + ${item.func}()` : `${item.func}()`);
                        }}
                      >
                        <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#1890ff' }}>{item.func}</div>
                        <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>{item.desc}</div>
                        <div style={{ fontSize: '9px', color: '#999', fontFamily: 'monospace', marginTop: '2px' }}>{item.example}</div>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 数值函数 */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#333', borderBottom: '1px solid #f0f0f0', paddingBottom: '4px' }}>
                    数值函数
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '4px' }}>
                    {[
                      { func: 'ABS', desc: '绝对值', example: 'ABS(column_name)' },
                      { func: 'ROUND', desc: '四舍五入', example: 'ROUND(column_name, 2)' },
                      { func: 'CEIL', desc: '向上取整', example: 'CEIL(column_name)' },
                      { func: 'FLOOR', desc: '向下取整', example: 'FLOOR(column_name)' },
                      { func: 'POWER', desc: '幂运算', example: 'POWER(column_name, 2)' },
                      { func: 'SQRT', desc: '平方根', example: 'SQRT(column_name)' },
                      { func: 'EXP', desc: '指数', example: 'EXP(column_name)' },
                      { func: 'LOG', desc: '自然对数', example: 'LOG(column_name)' },
                      { func: 'LOG10', desc: '常用对数', example: 'LOG10(column_name)' },
                    ].map(item => (
                      <Button
                        key={item.func}
                        type="link"
                        size="small"
                        style={{
                          textAlign: 'left',
                          height: 'auto',
                          padding: '8px',
                          whiteSpace: 'normal',
                          fontSize: '11px',
                          border: '1px solid #f0f0f0',
                          borderRadius: '4px',
                          marginBottom: '4px',
                          width: '100%'
                        }}
                        onClick={() => {
                          setCurrentExpression(prev => prev ? `${prev} + ${item.func}()` : `${item.func}()`);
                        }}
                      >
                        <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#1890ff' }}>{item.func}</div>
                        <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>{item.desc}</div>
                        <div style={{ fontSize: '9px', color: '#999', fontFamily: 'monospace', marginTop: '2px' }}>{item.example}</div>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 字符串函数 */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#333', borderBottom: '1px solid #f0f0f0', paddingBottom: '4px' }}>
                    字符串函数
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '4px' }}>
                    {[
                      { func: 'CONCAT', desc: '连接字符串', example: 'CONCAT(str1, str2)' },
                      { func: 'LENGTH', desc: '字符串长度', example: 'LENGTH(column_name)' },
                      { func: 'UPPER', desc: '转大写', example: 'UPPER(column_name)' },
                      { func: 'LOWER', desc: '转小写', example: 'LOWER(column_name)' },
                      { func: 'TRIM', desc: '去除空格', example: 'TRIM(column_name)' },
                      { func: 'SUBSTRING', desc: '子字符串', example: 'SUBSTRING(column_name, 1, 5)' },
                      { func: 'REPLACE', desc: '替换字符串', example: 'REPLACE(column_name, "old", "new")' },
                    ].map(item => (
                      <Button
                        key={item.func}
                        type="link"
                        size="small"
                        style={{
                          textAlign: 'left',
                          height: 'auto',
                          padding: '8px',
                          whiteSpace: 'normal',
                          fontSize: '11px',
                          border: '1px solid #f0f0f0',
                          borderRadius: '4px',
                          marginBottom: '4px',
                          width: '100%'
                        }}
                        onClick={() => {
                          setCurrentExpression(prev => prev ? `${prev} + ${item.func}()` : `${item.func}()`);
                        }}
                      >
                        <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#1890ff' }}>{item.func}</div>
                        <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>{item.desc}</div>
                        <div style={{ fontSize: '9px', color: '#999', fontFamily: 'monospace', marginTop: '2px' }}>{item.example}</div>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 日期时间函数 */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#333', borderBottom: '1px solid #f0f0f0', paddingBottom: '4px' }}>
                    日期时间函数
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '4px' }}>
                    {[
                      { func: 'NOW', desc: '当前时间', example: 'NOW()' },
                      { func: 'CURDATE', desc: '当前日期', example: 'CURDATE()' },
                      { func: 'YEAR', desc: '年份', example: 'YEAR(column_name)' },
                      { func: 'MONTH', desc: '月份', example: 'MONTH(column_name)' },
                      { func: 'DAY', desc: '日期', example: 'DAY(column_name)' },
                      { func: 'DATE_FORMAT', desc: '日期格式化', example: 'DATE_FORMAT(column_name, "%Y-%m-%d")' },
                      { func: 'DATEDIFF', desc: '日期差', example: 'DATEDIFF(date1, date2)' },
                    ].map(item => (
                      <Button
                        key={item.func}
                        type="link"
                        size="small"
                        style={{
                          textAlign: 'left',
                          height: 'auto',
                          padding: '8px',
                          whiteSpace: 'normal',
                          fontSize: '11px',
                          border: '1px solid #f0f0f0',
                          borderRadius: '4px',
                          marginBottom: '4px',
                          width: '100%'
                        }}
                        onClick={() => {
                          setCurrentExpression(prev => prev ? `${prev} + ${item.func}()` : `${item.func}()`);
                        }}
                      >
                        <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#1890ff' }}>{item.func}</div>
                        <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>{item.desc}</div>
                        <div style={{ fontSize: '9px', color: '#999', fontFamily: 'monospace', marginTop: '2px' }}>{item.example}</div>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 条件函数 */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#333', borderBottom: '1px solid #f0f0f0', paddingBottom: '4px' }}>
                    条件函数
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '4px' }}>
                    {[
                      { func: 'CASE', desc: '条件判断', example: 'CASE WHEN condition THEN result ELSE default END' },
                      { func: 'IF', desc: '如果语句', example: 'IF(condition, true_value, false_value)' },
                      { func: 'COALESCE', desc: '返回第一个非NULL值', example: 'COALESCE(col1, col2, default_value)' },
                      { func: 'NULLIF', desc: '如果相等则返回NULL', example: 'NULLIF(expr1, expr2)' },
                    ].map(item => (
                      <Button
                        key={item.func}
                        type="link"
                        size="small"
                        style={{
                          textAlign: 'left',
                          height: 'auto',
                          padding: '8px',
                          whiteSpace: 'normal',
                          fontSize: '11px',
                          border: '1px solid #f0f0f0',
                          borderRadius: '4px',
                          marginBottom: '4px',
                          width: '100%'
                        }}
                        onClick={() => {
                          setCurrentExpression(prev => prev ? `${prev} + ${item.func}` : item.func);
                        }}
                      >
                        <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#1890ff' }}>{item.func}</div>
                        <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>{item.desc}</div>
                        <div style={{ fontSize: '9px', color: '#999', fontFamily: 'monospace', marginTop: '2px' }}>{item.example}</div>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* 中间：表达式编辑区（主要区域，更加突出） */}
          <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            </div>
            {/* 表达式编辑器 */}
            <Card 
              size="small" 
              title={
                <div style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold', 
                  color: '#1890ff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 0',
                  background: 'linear-gradient(90deg, #e6f7ff 0%, #bae7ff 100%)',
                  margin: '-12px -16px 16px -16px',
                  paddingLeft: '20px',
                  borderBottom: '1px solid #91d5ff'
                }}>
                  <span style={{ 
                    display: 'inline-block',
                    width: '6px',
                    height: '20px',
                    backgroundColor: '#1890ff',
                    borderRadius: '3px',
                    boxShadow: '0 2px 4px rgba(24, 144, 255, 0.3)'
                  }}></span>
                  <span style={{ textShadow: '0 1px 2px rgba(24, 144, 255, 0.1)' }}>
                    🎯 表达式编辑器
                  </span>
                </div>
              }
              style={{ 
                border: '2px solid #1890ff',
                borderRadius: '12px',
                boxShadow: '0 6px 16px rgba(24, 144, 255, 0.2)',
                background: 'linear-gradient(135deg, #f6f9ff 0%, #ffffff 100%)',
                overflow: 'hidden'
              }}
            >
              <TextArea
                value={currentExpression}
                onChange={(e) => setCurrentExpression(e.target.value)}
                placeholder="🚀 在此输入表达式，或点击右侧元素快速构建..."
                autoSize={{ minRows: 16, maxRows: 20 }}
                style={{ 
                  fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace', 
                  fontSize: '14px',
                  lineHeight: '1.6',
                  backgroundColor: '#f8fbff',
                  border: '1px solid #d9ecff',
                  borderRadius: '8px',
                  padding: '16px',
                  boxShadow: 'inset 0 2px 4px rgba(24, 144, 255, 0.05)',
                  transition: 'all 0.3s ease'
                }}
              />
            </Card>

            {/* 操作符按钮 */}
            <Card 
              size="small" 
              title={
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: 'bold', 
                  color: '#52c41a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ 
                    display: 'inline-block',
                    width: '4px',
                    height: '14px',
                    backgroundColor: '#52c41a',
                    borderRadius: '2px'
                  }}></span>
                  ⚡ 常用操作符
                </div>
              }
              style={{ 
                border: '1px solid #b7eb8f',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #f6ffed 0%, #ffffff 100%)'
              }}
            >
              <Space wrap>
                {['+', '-', '*', '/', '(', ')', '=', '<', '>', '<=', '>=', '<>', 'AND', 'OR', 'NOT', 'LIKE', 'IN', 'IS NULL', 'IS NOT NULL'].map(op => (
                  <Button
                    key={op}
                    size="small"
                    onClick={() => {
                      setCurrentExpression(prev => prev ? `${prev} ${op}` : op);
                    }}
                    style={{ 
                      fontFamily: 'monospace',
                      fontWeight: 'bold'
                    }}
                  >
                    {op}
                  </Button>
                ))}
              </Space>
            </Card>

            {/* 常用示例 */}
            <Card 
              size="small" 
              title={
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: 'bold', 
                  color: '#fa8c16',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ 
                    display: 'inline-block',
                    width: '4px',
                    height: '14px',
                    backgroundColor: '#fa8c16',
                    borderRadius: '2px'
                  }}></span>
                  💡 常用示例
                </div>
              }
              style={{ 
                border: '1px solid #ffd591',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #fff7e6 0%, #ffffff 100%)'
              }}
            >
              <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  {[
                    { expr: 'SUM(agreement_price)', desc: '求和：协议价格总和' },
                    { expr: 'AVG(unit_price)', desc: '平均值：单价平均值' },
                    { expr: 'COUNT(DISTINCT supplier_id)', desc: '去重计数：不同供应商数量' },
                    { expr: 'ROUND(amount * 0.1, 2)', desc: '计算：金额的10%并保留两位小数' },
                  ].map((example, index) => (
                    <Button
                      key={index}
                      type="link"
                      size="small"
                      style={{ textAlign: 'left', height: 'auto', padding: '4px 8px', whiteSpace: 'normal', width: '100%' }}
                      onClick={() => setCurrentExpression(example.expr)}
                    >
                      <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#1890ff' }}>{example.expr}</div>
                      <div style={{ fontSize: '11px', color: '#666' }}>{example.desc}</div>
                    </Button>
                  ))}
                </Space>
              </div>
            </Card>
          </div>

        </div>
      </Modal>
    </div>
  );
};

export default MetricManagement;