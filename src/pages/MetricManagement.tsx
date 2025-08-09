import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Modal, Form, Input, Select, Space, message, Popconfirm, Tag, Steps } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, CalculatorOutlined, FunctionOutlined } from '@ant-design/icons';
import { BarChart3, PieChart, TrendingUp } from 'lucide-react';

const { Option } = Select;
const { TextArea } = Input;

// 接口定义
interface Metric {
  id: string;
  metricCode: string;
  metricName: string;
  description?: string;
  metricType: 'COUNT' | 'SUM' | 'AVG' | 'MAX' | 'MIN' | 'RATIO' | 'CUSTOM';
  dataType: 'INTEGER' | 'DECIMAL' | 'PERCENTAGE';
  formula?: string;
  unit?: string;
  category: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  usageCount?: number;
  modelName?: string;
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

  // 模拟数据
  useEffect(() => {
    setCategories([
      { id: 'sales', name: '销售指标', description: '销售相关的业务指标', icon: '💰' },
      { id: 'finance', name: '财务指标', description: '财务分析相关指标', icon: '📊' },
      { id: 'inventory', name: '库存指标', description: '库存管理相关指标', icon: '📦' },
      { id: 'customer', name: '客户指标', description: '客户分析相关指标', icon: '👥' },
      { id: 'operational', name: '运营指标', description: '运营效率相关指标', icon: '⚙️' }
    ]);

    setMetrics([
      {
        id: 'metric_001',
        metricCode: 'TOTAL_SALES',
        metricName: '总销售额',
        description: '统计所有销售订单的总金额',
        metricType: 'SUM',
        dataType: 'DECIMAL',
        formula: 'SUM(order_amount)',
        unit: '元',
        category: 'sales',
        status: 'ACTIVE',
        createdBy: '张三',
        createdAt: '2024-01-15',
        updatedAt: '2024-01-20',
        usageCount: 156,
        modelName: '订单事实表'
      },
      {
        id: 'metric_002',
        metricCode: 'SQL_ORDER_VALUE',
        metricName: 'SQL订单价值',
        description: '基于SQL查询计算的订单价值指标',
        metricType: 'SUM',
        dataType: 'DECIMAL',
        formula: 'SUM(order_amount * discount_rate)',
        unit: '元',
        category: 'sales',
        status: 'ACTIVE',
        createdBy: '李四',
        createdAt: '2024-01-10',
        updatedAt: '2024-01-18',
        usageCount: 89,
        modelName: '订单事实表'
      },
      {
        id: 'metric_003',
        metricCode: 'CUSTOMER_COUNT',
        metricName: '客户数量统计',
        description: '统计活跃客户的总数量',
        metricType: 'COUNT',
        dataType: 'INTEGER',
        formula: 'COUNT(DISTINCT customer_id)',
        unit: '个',
        category: 'customer',
        status: 'ACTIVE',
        createdBy: '王五',
        createdAt: '2024-01-12',
        updatedAt: '2024-01-19',
        usageCount: 234,
        modelName: '客户维度表'
      },
      {
        id: 'metric_004',
        metricCode: 'INVENTORY_CLOUD',
        metricName: '库存云指标',
        description: '基于云端数据计算的库存相关指标',
        metricType: 'RATIO',
        dataType: 'DECIMAL',
        formula: '(stock_in - stock_out) / total_capacity * 100',
        unit: '%',
        category: 'inventory',
        status: 'ACTIVE',
        createdBy: '赵六',
        createdAt: '2024-01-08',
        updatedAt: '2024-01-16',
        usageCount: 67,
        modelName: '库存事实表'
      },
      {
        id: 'metric_005',
        metricCode: 'PROFIT_MARGIN',
        metricName: '利润率分析',
        description: '计算销售利润占销售收入的比例',
        metricType: 'RATIO',
        dataType: 'PERCENTAGE',
        formula: '((revenue - cost) / revenue) * 100',
        unit: '%',
        category: 'finance',
        status: 'ACTIVE',
        createdBy: '孙七',
        createdAt: '2024-01-05',
        updatedAt: '2024-01-14',
        usageCount: 123,
        modelName: '财务事实表'
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
             关联模型
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
      description: metric.description,
      metricType: metric.metricType,
      dataType: metric.dataType,
      formula: metric.formula,
      unit: metric.unit,
      category: metric.category
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
      message.success('关联模型成功');
      setIsAssociateModalVisible(false);
      // 可以在这里更新指标数据
    } catch (error) {
      console.error('关联模型失败:', error);
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
      
      // 更新指标的关联模型信息
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
      title: '关联数据模型',
      description: '选择数据模型和构建公式',
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
        title={editingMetric ? '编辑指标' : '新增指标'}
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
              保存
            </Button>
          )
        ].filter(Boolean)}
        width={800}
      >
        <div className="mb-6">
          <Steps current={currentStep} items={steps} />
        </div>
        
        <div className="mt-6">
          {currentStep === 0 && (
            <div>
              <h3 className="text-lg font-medium mb-4">基本信息</h3>
              <Form form={form} layout="vertical">
              <Form.Item
                name="metricCode"
                label="指标编码"
                rules={[{ required: true, message: '请输入指标编码' }]}
              >
                <Input 
                  placeholder="请输入指标编码" 
                  disabled={!!editingMetric}
                />
              </Form.Item>
              <Form.Item
                name="metricName"
                label="指标名称"
                rules={[{ required: true, message: '请输入指标名称' }]}
              >
                <Input placeholder="请输入指标名称" />
              </Form.Item>
              <Form.Item
                name="category"
                label="指标分类"
                rules={[{ required: true, message: '请选择指标分类' }]}
              >
                <Select placeholder="请选择指标分类">
                  {categories.map(category => (
                    <Option key={category.id} value={category.id}>
                      <Space>
                        <span>{category.icon}</span>
                        {category.name}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                name="unit"
                label="单位"
              >
                <Input placeholder="请输入单位（如：元、个、%等）" />
              </Form.Item>
              <Form.Item
                name="description"
                label="指标描述"
              >
                <TextArea 
                  placeholder="请输入指标描述" 
                  rows={3}
                />
              </Form.Item>
              </Form>
            </div>
          )}
          
          {currentStep === 1 && (
            <div>
              <h3 className="text-lg font-medium mb-4">关联数据模型</h3>
              <Form form={form} layout="vertical">
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
                  <Option value="dim_products">采购协议明细表</Option>
                  <Option value="dim_suppliers">采购订单明细表</Option>
                  <Option value="fact_orders">历史采购入库明细</Option>
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
            </div>
          )}
        </div>
      </Modal>

      {/* 关联模型弹框 */}
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
    </div>
  );
};

export default MetricManagement;