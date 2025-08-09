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
  Empty
} from 'antd';

import { 
  Plus, 
  Edit, 
  Trash2, 
  Search
} from 'lucide-react';

const { Title } = Typography;

// 数据集字段接口
interface DatasetField {
  id: string;
  field_name: string;
  field_code: string;
  field_type: 'dimension' | 'metric'; // 维度/指标
  data_type: 'string' | 'number' | 'date' | 'boolean';
  is_dimension_field: boolean; // 是否维度字段
  is_factor: boolean; // 是否比价因子
  description?: string;
}

// 数据集接口
interface Dataset {
  id: string;
  dataset_code: string;
  dataset_name: string;
  description?: string;
  fields: DatasetField[];
}

// 比价规则接口
interface PriceRule {
  id: string;
  rule_code: string;
  rule_name: string;
  dataset_code: string;
  dataset_name: string;
  is_scoring: boolean; // 是否评分型
  enable_flag: boolean;
  create_time: string;
  update_time: string;
  field_configs: FieldConfig[];
}

// 字段配置接口
interface FieldConfig {
  field_code: string;
  field_name: string;
  field_type: 'dimension' | 'metric';
  is_dimension_field: boolean;
  is_factor: boolean;
}

const PriceCompareRule: React.FC = () => {
  // 状态管理
  const [rules, setRules] = useState<PriceRule[]>([
    {
      id: '1',
      rule_code: 'RULE_PROCUREMENT_001',
      rule_name: '采购比价规则',
      dataset_code: 'procurement_data',
      dataset_name: '采购数据集',
      is_scoring: true,
      enable_flag: true,
      create_time: '2024-01-15 10:30:00',
      update_time: '2024-01-15 10:30:00',
      field_configs: [
        { field_code: 'brand', field_name: '品牌', field_type: 'dimension', is_dimension_field: true, is_factor: false },
        { field_code: 'price', field_name: '采购价', field_type: 'metric', is_dimension_field: false, is_factor: true },
        { field_code: 'quality_score', field_name: '质量评分', field_type: 'metric', is_dimension_field: false, is_factor: true }
      ]
    },
    {
      id: '2',
      rule_code: 'RULE_SUPPLIER_001',
      rule_name: '供应商比价规则',
      dataset_code: 'supplier_data',
      dataset_name: '供应商数据集',
      is_scoring: false,
      enable_flag: true,
      create_time: '2024-01-16 14:20:00',
      update_time: '2024-01-16 14:20:00',
      field_configs: [
        { field_code: 'supplier_name', field_name: '供应商名称', field_type: 'dimension', is_dimension_field: true, is_factor: false },
        { field_code: 'credit_level', field_name: '信用等级', field_type: 'metric', is_dimension_field: false, is_factor: false }
      ]
    }
  ]);

  // 示例数据集
  const [datasets] = useState<Dataset[]>([
    {
      id: '1',
      dataset_code: 'procurement_data',
      dataset_name: '采购数据集',
      description: '包含采购相关的所有数据字段',
      fields: [
        { id: '1', field_name: '商品名称', field_code: 'product_name', field_type: 'dimension', data_type: 'string', is_dimension_field: true, is_factor: false },
        { id: '2', field_name: '品牌', field_code: 'brand', field_type: 'dimension', data_type: 'string', is_dimension_field: true, is_factor: false },
        { id: '3', field_name: '供应商', field_code: 'supplier', field_type: 'dimension', data_type: 'string', is_dimension_field: true, is_factor: false },
        { id: '4', field_name: '采购价', field_code: 'price', field_type: 'metric', data_type: 'number', is_dimension_field: false, is_factor: true },
        { id: '5', field_name: '集采价', field_code: 'group_price', field_type: 'metric', data_type: 'number', is_dimension_field: false, is_factor: true },
        { id: '6', field_name: '采购模式', field_code: 'purchase_mode', field_type: 'dimension', data_type: 'string', is_dimension_field: true, is_factor: false },
        { id: '7', field_name: '质量评分', field_code: 'quality_score', field_type: 'metric', data_type: 'number', is_dimension_field: false, is_factor: true },
        { id: '8', field_name: '交期', field_code: 'delivery_time', field_type: 'metric', data_type: 'number', is_dimension_field: false, is_factor: true },
        { id: '9', field_name: '服务评分', field_code: 'service_score', field_type: 'metric', data_type: 'number', is_dimension_field: false, is_factor: true },
      ]
    },
    {
      id: '2',
      dataset_code: 'supplier_data',
      dataset_name: '供应商数据集',
      description: '供应商基础信息数据',
      fields: [
        { id: '10', field_name: '供应商编码', field_code: 'supplier_code', field_type: 'dimension', data_type: 'string', is_dimension_field: true, is_factor: false },
        { id: '11', field_name: '供应商名称', field_code: 'supplier_name', field_type: 'dimension', data_type: 'string', is_dimension_field: true, is_factor: false },
        { id: '12', field_name: '信用等级', field_code: 'credit_level', field_type: 'metric', data_type: 'string', is_dimension_field: false, is_factor: false },
      ]
    }
  ]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<PriceRule | null>(null);
  const [searchText, setSearchText] = useState('');
  
  // 表单状态
  const [form] = Form.useForm();
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [fieldConfigs, setFieldConfigs] = useState<FieldConfig[]>([]);

  // 处理数据集变更
  const handleDatasetChange = (datasetCode: string) => {
    setSelectedDataset(datasetCode);
    const dataset = datasets.find(d => d.dataset_code === datasetCode);
    if (dataset) {
      // 初始化字段配置
      const configs: FieldConfig[] = dataset.fields.map(field => ({
        field_code: field.field_code,
        field_name: field.field_name,
        field_type: field.field_type,
        is_dimension_field: field.is_dimension_field,
        is_factor: field.is_factor
      }));
      setFieldConfigs(configs);
    }
  };

  // 处理字段配置变更
  const handleFieldConfigChange = (fieldCode: string, field: string, value: boolean) => {
    setFieldConfigs(prev => 
      prev.map(config => 
        config.field_code === fieldCode 
          ? { ...config, [field]: value }
          : config
      )
    );
  };

  // 新建规则
  const handleCreate = () => {
    setEditingRule(null);
    setSelectedDataset('');
    setFieldConfigs([]);
    form.resetFields();
    setIsModalVisible(true);
  };

  // 编辑规则
  const handleEdit = (rule: PriceRule) => {
    setEditingRule(rule);
    setSelectedDataset(rule.dataset_code);
    setFieldConfigs(rule.field_configs);
    form.setFieldsValue({
      rule_name: rule.rule_name,
      rule_code: rule.rule_code,
      dataset_code: rule.dataset_code,
      is_scoring: rule.is_scoring
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
      const dataset = datasets.find(d => d.dataset_code === selectedDataset);
      
      if (!dataset) {
        message.error('请选择数据集');
        return;
      }

      const newRule: PriceRule = {
        id: editingRule?.id || Date.now().toString(),
        rule_code: values.rule_code || `RULE_${values.rule_name.replace(/\s+/g, '_').toUpperCase()}_${Date.now()}`,
        rule_name: values.rule_name,
        dataset_code: selectedDataset,
        dataset_name: dataset.dataset_name,
        is_scoring: values.is_scoring || false,
        enable_flag: true,
        create_time: editingRule?.create_time || new Date().toLocaleString(),
        update_time: new Date().toLocaleString(),
        field_configs: fieldConfigs
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

  // 过滤规则
  const filteredRules = rules.filter(rule => 
    rule.rule_name.toLowerCase().includes(searchText.toLowerCase()) ||
    rule.rule_code.toLowerCase().includes(searchText.toLowerCase())
  );

  // 规则列表表格列定义
  const columns = [
    {
      title: '规则编码',
      dataIndex: 'rule_code',
      key: 'rule_code',
      width: 200,
    },
    {
      title: '规则名称',
      dataIndex: 'rule_name',
      key: 'rule_name',
      width: 200,
    },
    {
      title: '数据集',
      dataIndex: 'dataset_name',
      key: 'dataset_name',
      width: 150,
    },
    {
      title: '是否评分型',
      dataIndex: 'is_scoring',
      key: 'is_scoring',
      width: 120,
      render: (is_scoring: boolean) => (
        <Tag color={is_scoring ? 'green' : 'blue'}>
          {is_scoring ? '评分型' : '控制型'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'enable_flag',
      key: 'enable_flag',
      width: 100,
      render: (enable_flag: boolean) => (
        <Tag color={enable_flag ? 'green' : 'red'}>
          {enable_flag ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'update_time',
      key: 'update_time',
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

  // 字段配置表格列定义
  const fieldColumns = [
    {
      title: '字段名',
      dataIndex: 'field_name',
      key: 'field_name',
      width: 150,
    },
    {
      title: '类型',
      dataIndex: 'field_type',
      key: 'field_type',
      width: 100,
      render: (type: string) => (
        <Tag color={type === 'dimension' ? 'blue' : 'green'}>
          {type === 'dimension' ? '维度' : '指标'}
        </Tag>
      ),
    },
    {
      title: '是否维度字段',
      dataIndex: 'is_dimension_field',
      key: 'is_dimension_field',
      width: 120,
      render: (_: any, record: FieldConfig) => (
        <Switch
          checked={record.is_dimension_field}
          onChange={(checked) => handleFieldConfigChange(record.field_code, 'is_dimension_field', checked)}
          size="small"
        />
      ),
    },
    {
      title: '是否比价因子',
      dataIndex: 'is_factor',
      key: 'is_factor',
      width: 120,
      render: (_: any, record: FieldConfig) => {
        const isScoring = form.getFieldValue('is_scoring');
        return (
          <Switch
            checked={record.is_factor}
            onChange={(checked) => handleFieldConfigChange(record.field_code, 'is_factor', checked)}
            disabled={!isScoring}
            size="small"
          />
        );
      },
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
              placeholder="搜索规则名称或编码"
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
        onCancel={() => setIsModalVisible(false)}
        onOk={handleSave}
        width={800}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="规则名称"
                name="rule_name"
                rules={[{ required: true, message: '请输入规则名称' }]}
              >
                <Input placeholder="请输入规则名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="规则编码"
                name="rule_code"
              >
                <Input placeholder="系统自动生成" disabled />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="选择数据集"
                name="dataset_code"
                rules={[{ required: true, message: '请选择数据集' }]}
              >
                <Select
                  placeholder="请选择数据集"
                  onChange={handleDatasetChange}
                  value={selectedDataset}
                >
                  {datasets.map(dataset => (
                    <Select.Option key={dataset.id} value={dataset.dataset_code}>
                      {dataset.dataset_name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="是否评分型"
                name="is_scoring"
                valuePropName="checked"
              >
                <Switch 
                  checkedChildren="是评分型（启用因子权重配置）" 
                  unCheckedChildren="控制型" 
                  onChange={(checked) => {
                    // 当切换评分型时，重置比价因子配置
                    if (!checked) {
                      setFieldConfigs(prev => 
                        prev.map(config => ({ ...config, is_factor: false }))
                      );
                    }
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider>字段配置（从数据集字段中自动带出，可勾选）</Divider>
          
          {selectedDataset ? (
            <div>
              <Alert
                message="说明：是否比价因子选项仅在'评分型'时启用"
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Table
                columns={fieldColumns}
                dataSource={fieldConfigs}
                rowKey="field_code"
                pagination={false}
                size="small"
                scroll={{ y: 300 }}
              />
            </div>
          ) : (
            <Empty 
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="请先选择数据集"
            />
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default PriceCompareRule;