import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Modal, Form, Input, Select, Space, message, Popconfirm, Tag, Steps, Radio, Checkbox, Divider, Typography, Alert, DatePicker, Upload, Row, Col, Tooltip, InputNumber, TreeSelect, Transfer, TimePicker, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SaveOutlined, SendOutlined, UploadOutlined, InfoCircleOutlined, CopyOutlined, PlayCircleOutlined, FileTextOutlined, DownloadOutlined, SettingOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Step } = Steps;

// 接口定义
interface ComparisonScheme {
  id: string;
  schemeName: string;
  schemeCode: string;
  tags: string[];
  description?: string;
  enabled: boolean;
  modelRef: {
    id: string;
    name: string;
  };
  scope: {
    org: string[];
    product: {
      category?: string;
      brand?: string;
      skuList?: string[];
    };
    vendor?: string[];
    timeRange: [string, string];
    extraFilters: FilterCondition[];
  };
  compareIndicator: {
    id: string;
    name: string;
    datasetAlias: string;
  };
  baselines: BaselineConfig[];
  computedIndicators: ComputedIndicator[];
  ruleSetRef?: {
    id: string;
    name: string;
  };
  output: {
    columns: string[];
    orderBy: {
      field: string;
      order: 'asc' | 'desc';
    }[];
    styleRules: StyleRule[];
    export: string[];
  };
  status: 'DRAFT' | 'SAVED' | 'PREVIEW' | 'ENABLED';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface BaselineConfig {
  alias: string;
  datasetAlias: string;
  indicatorLibId: string;
  name: string;
  conditions: string[];
}

interface ComputedIndicator {
  id: string;
  name: string;
  formula: string;
  bindBaselineAlias: string;
  unit: string;
}

interface FilterCondition {
  field: string;
  op: 'IN' | 'LIKE' | 'BETWEEN' | '=' | '>' | '<';
  value: any;
}

interface StyleRule {
  expr: string;
  style: { color?: string; backgroundColor?: string };
}

interface ComparisonModel {
  id: string;
  name: string;
  primaryDataset: string;
  compareKeys: string[];
  analysisObject: string;
  dimensions: string[];
  analysisIndicators: string[];
  baselineCandidates: any[];
  displayAttributes: string[];
  defaultOutput: string[];
}

const PriceScheme2Management: React.FC = () => {
  const [schemes, setSchemes] = useState<ComparisonScheme[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingScheme, setEditingScheme] = useState<ComparisonScheme | null>(null);
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [baselines, setBaselines] = useState<BaselineConfig[]>([]);
  const [outputColumns, setOutputColumns] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<ComparisonModel | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [sqlPreview, setSqlPreview] = useState('');

  // 模拟数据
  const mockModels: ComparisonModel[] = [
    {
      id: 'model_vendor_compare',
      name: '通用供应商比价模型',
      primaryDataset: 'ds_agreement_price',
      compareKeys: ['item_id', 'brand'],
      analysisObject: '供应商',
      dimensions: ['供应商', '组织', '时间(月)'],
      analysisIndicators: ['ind_agreement_price', 'ind_discount_rate'],
      baselineCandidates: [
        { datasetId: 'ds_bid', indicators: ['ind_bid_min'] },
        { datasetId: 'ds_po_hist', indicators: ['ind_hist_min'] }
      ],
      displayAttributes: ['供应商', '组织', '产品'],
      defaultOutput: ['供应商', '协议价', '${BASELINE}', '差异率']
    }
  ];

  const mockDatasets = [
    { id: 'ds_agreement_price', name: '集团采购协议数据集' },
    { id: 'ds_bid', name: '招采数据集' },
    { id: 'ds_po_hist', name: '历史采购数据集' }
  ];

  const mockIndicators = [
    { id: 'ind_agreement_price', name: '协议价格' },
    { id: 'ind_bid_min', name: '招采最低价' },
    { id: 'ind_hist_min', name: '历史最低价' },
    { id: 'ind_discount_rate', name: '折扣率' }
  ];

  const mockRuleSets = [
    { id: 'rule_vendor_compare_default', name: '供应商比价默认规则集' },
    { id: 'rule_price_alert', name: '价格预警规则集' }
  ];

  const mockOrganizations = [
    { id: 'org_group', name: '集团' },
    { id: 'org_subsidiary_a', name: '子公司A' },
    { id: 'org_subsidiary_b', name: '子公司B' }
  ];

  const mockCategories = [
    { id: 'cat_ivd', name: 'IVD试剂' },
    { id: 'cat_medical', name: '医疗器械' },
    { id: 'cat_pharma', name: '药品' }
  ];

  const mockBrands = [
    { id: 'brand_roche', name: 'Roche' },
    { id: 'brand_abbott', name: 'Abbott' },
    { id: 'brand_siemens', name: 'Siemens' }
  ];

  const mockVendors = [
    { id: 'vendor_001', name: '供应商A' },
    { id: 'vendor_002', name: '供应商B' },
    { id: 'vendor_003', name: '供应商C' }
  ];

  useEffect(() => {
    // 模拟加载数据
    setSchemes([
      {
        id: '1',
        schemeName: '同品多商-协议价对比多基准_2024Q1',
        schemeCode: 'cmp_vendor_multi_baseline_2024Q1',
        tags: ['集团采购', '价格监控'],
        description: '2024年第一季度供应商协议价格多基准比价分析',
        enabled: true,
        modelRef: {
          id: 'model_vendor_compare',
          name: '通用供应商比价模型'
        },
        scope: {
          org: ['org_group'],
          product: {
            category: 'cat_ivd',
            brand: 'brand_roche'
          },
          timeRange: ['2024-01-01', '2024-03-31'],
          extraFilters: []
        },
        compareIndicator: {
          id: 'ind_agreement_price',
          name: '协议价',
          datasetAlias: 'ds_agreement_price'
        },
        baselines: [
          {
            alias: 'baseline_1',
            datasetAlias: 'ds_bid',
            indicatorLibId: 'ind_bid_min',
            name: '招采最低价',
            conditions: ['same_product', 'same_vendor']
          }
        ],
        computedIndicators: [
          {
            id: 'diff_rate_A',
            name: '差异率A',
            formula: '(协议价 - 招采最低价) / 招采最低价',
            bindBaselineAlias: 'baseline_1',
            unit: '%'
          }
        ],
        output: {
          columns: ['供应商', '采购组织', '协议价', 'baseline_price_A', 'diff_rate_A'],
          orderBy: [{ field: 'diff_rate_A', order: 'desc' }],
          styleRules: [],
          export: ['excel']
        },
        status: 'DRAFT',
        createdBy: 'admin',
        createdAt: '2024-01-15',
        updatedAt: '2024-01-15'
      }
    ]);
  }, []);

  const steps = [
    { title: '基本信息', description: '方案名称、编码、标签等' },
    { title: '绑定比价模型', description: '选择比价模型、比价指标、基准指标' },
    { title: '查询范围', description: '时间、组织、商品、供应商范围' },
    { title: '输出与样式', description: '维度列、指标列、排序、样式' },
    { title: '预览与执行', description: '预览结果、导出设置' },
    { title: '调度与推送', description: '调度配置、推送设置（可选）' }
  ];

  const handleCreate = () => {
    setEditingScheme(null);
    setCurrentStep(0);
    setBaselines([]);
    setOutputColumns([]);
    setSelectedModel(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (scheme: ComparisonScheme) => {
    setEditingScheme(scheme);
    setCurrentStep(0);
    setBaselines(scheme.baselines);
    setOutputColumns(scheme.output.columns);
    setSelectedModel(mockModels.find(m => m.id === scheme.modelRef.id) || null);
    form.setFieldsValue({
        schemeName: scheme.schemeName,
        schemeCode: scheme.schemeCode,
        tags: scheme.tags,
        description: scheme.description,
        enabled: scheme.enabled,
        modelId: scheme.modelRef.id,
        orgScope: scheme.scope.org,
        productCategory: scheme.scope.product.category,
        productBrand: scheme.scope.product.brand,
        vendorScope: scheme.scope.vendor,
        timeRange: [dayjs(scheme.scope.timeRange[0]), dayjs(scheme.scope.timeRange[1])],
        ruleSetId: scheme.ruleSetRef?.id,
        orderBy: scheme.output.orderBy[0]?.field,
        orderDirection: scheme.output.orderBy[0]?.order,
        exportExcel: scheme.output.export.includes('excel'),
        exportCsv: scheme.output.export.includes('csv'),
        exportApi: scheme.output.export.includes('api')
      });
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    setSchemes(schemes.filter(s => s.id !== id));
    message.success('删除成功');
  };

  const handleModelChange = (modelId: string) => {
    const model = mockModels.find(m => m.id === modelId);
    setSelectedModel(model || null);
    if (model) {
      setOutputColumns([...model.defaultOutput]);
    } else {
      // 清空相关字段
      setOutputColumns([]);
      form.setFieldsValue({
        compareIndicatorId: undefined,
        baselineAliases: undefined
      });
    }
  };

  const addBaselineBlock = () => {
    const newBaseline: BaselineConfig = {
      alias: `baseline_${Date.now()}`,
      datasetAlias: '',
      indicatorLibId: '',
      name: `基准块 #${baselines.length + 1}`,
      conditions: []
    };
    setBaselines([...baselines, newBaseline]);
  };

  const updateBaselineBlock = (index: number, updates: Partial<BaselineConfig>) => {
    const newBaselines = [...baselines];
    newBaselines[index] = { ...newBaselines[index], ...updates };
    setBaselines(newBaselines);
  };

  const removeBaselineBlock = (index: number) => {
    setBaselines(baselines.filter((_, i) => i !== index));
  };

  const copyBaselineBlock = (index: number) => {
    const original = baselines[index];
    const copy: BaselineConfig = {
      ...original,
      alias: `baseline_${Date.now()}`,
      name: `${original.name} (副本)`
    };
    setBaselines([...baselines, copy]);
  };

  // const handleDragEnd = (result: any) => {
  //   if (!result.destination) return;

  //   const items = Array.from(outputColumns);
  //   const [reorderedItem] = items.splice(result.source.index, 1);
  //   items.splice(result.destination.index, 0, reorderedItem);

  //   setOutputColumns(items);
  // };

  const generateSQL = () => {
    const sql = `-- 比价方案SQL预览
WITH
-- P: 参与侧（主数据集）
P AS (
  SELECT
    p.item_id,
    p.brand,
    p.vendor_id,
    p.org_id,
    DATE_FORMAT(p.tx_date, '%Y-%m-01') AS month_key,
    p.agreement_price AS ind_agreement_price
  FROM ds_agreement_price p
  WHERE p.org_id IN ('org_group')
    AND p.brand = 'brand_roche'
    AND p.tx_date BETWEEN '2024-01-01' AND '2024-03-31'
),

-- B_A: 基准块A（招采最低价）
B_A AS (
  SELECT
    b.item_id,
    b.brand,
    DATE_FORMAT(b.bid_date, '%Y-%m-01') AS month_key,
    MIN(b.bid_price) AS baseline_value
  FROM ds_bid b
  WHERE b.bid_date BETWEEN '2024-01-01' AND '2024-03-31'
  GROUP BY b.item_id, b.brand, DATE_FORMAT(b.bid_date, '%Y-%m-01')
)

SELECT
  P.vendor_id AS 供应商,
  P.org_id AS 采购组织,
  P.ind_agreement_price AS 协议价,
  B_A.baseline_value AS baseline_price_A,
  CASE
    WHEN B_A.baseline_value IS NULL OR B_A.baseline_value = 0 THEN NULL
    ELSE (P.ind_agreement_price - B_A.baseline_value) / B_A.baseline_value
  END AS diff_rate_A
FROM P
LEFT JOIN B_A
  ON P.item_id = B_A.item_id
 AND P.brand = B_A.brand
 AND P.month_key = B_A.month_key
ORDER BY diff_rate_A DESC
LIMIT 1000;`;
    setSqlPreview(sql);
    setPreviewVisible(true);
  };

  const handleSubmit = () => {
    form.validateFields().then(values => {
      const schemeData: ComparisonScheme = {
        id: editingScheme?.id || `scheme_${Date.now()}`,
        schemeName: values.schemeName,
        schemeCode: values.schemeCode,
        tags: values.tags || [],
        description: values.description,
        enabled: values.enabled,
        modelRef: {
          id: values.modelId,
          name: mockModels.find(m => m.id === values.modelId)?.name || ''
        },
        scope: {
          org: values.orgScope || [],
          product: {
            category: values.productCategory,
            brand: values.productBrand,
            skuList: []
          },
          vendor: values.vendorScope,
          timeRange: [values.timeRange[0].format('YYYY-MM-DD'), values.timeRange[1].format('YYYY-MM-DD')],
          extraFilters: []
        },
        compareIndicator: {
          id: 'ind_agreement_price',
          name: '协议价',
          datasetAlias: 'ds_agreement_price'
        },
        baselines,
        computedIndicators: [],
        ruleSetRef: values.ruleSetId ? {
          id: values.ruleSetId,
          name: mockRuleSets.find(r => r.id === values.ruleSetId)?.name || ''
        } : undefined,
        output: {
          columns: outputColumns,
          orderBy: values.orderBy ? [{
            field: values.orderBy,
            order: values.orderDirection || 'desc'
          }] : [],
          styleRules: [],
          export: [
            ...(values.exportExcel ? ['excel'] : []),
            ...(values.exportCsv ? ['csv'] : []),
            ...(values.exportApi ? ['api'] : [])
          ]
        },
        status: 'DRAFT',
        createdBy: 'admin',
        createdAt: editingScheme?.createdAt || new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
      };

      if (editingScheme) {
        setSchemes(schemes.map(s => s.id === editingScheme.id ? schemeData : s));
        message.success('更新成功');
      } else {
        setSchemes([...schemes, schemeData]);
        message.success('创建成功');
      }

      setIsModalVisible(false);
    });
  };

  const columns = [
    {
      title: '方案编码',
      dataIndex: 'schemeCode',
      key: 'schemeCode',
      width: 200,
      ellipsis: true,
    },
    {
      title: '方案名称',
      dataIndex: 'schemeName',
      key: 'schemeName',
      width: 250,
      ellipsis: {
        showTitle: false,
      },
      render: (text: string, record: ComparisonScheme) => (
        <Tooltip placement="topLeft" title={text}>
          <Button
            type="link"
            onClick={() => handleEdit(record)}
            style={{ padding: 0, height: 'auto', textAlign: 'left', width: '100%' }}
          >
            {text}
          </Button>
        </Tooltip>
      ),
    },
    {
      title: '绑定模型',
      dataIndex: ['modelRef', 'name'],
      key: 'modelName',
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
          {tags.map(tag => (
            <Tag key={tag} color="blue" style={{ marginBottom: 2 }}>{tag}</Tag>
          ))}
        </>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusConfig = {
          DRAFT: { color: 'orange', text: '草稿' },
          PUBLISHED: { color: 'green', text: '已发布' },
          ARCHIVED: { color: 'gray', text: '已归档' }
        };
        const config = statusConfig[status as keyof typeof statusConfig];
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
          {enabled ? '启用' : '停用'}
        </Tag>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 120,
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right' as const,
      render: (_: any, record: ComparisonScheme) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              // 处理停用逻辑
              const updatedSchemes = schemes.map(s => 
                s.id === record.id ? { ...s, enabled: false } : s
              );
              setSchemes(updatedSchemes);
              message.success('已停用');
            }}
          >
            停用
          </Button>
          <Popconfirm
            title="确定删除这个比价方案吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // 基本信息
        return (
          <div className="space-y-4">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="schemeName"
                  label="方案名称"
                  rules={[{ required: true, message: '请输入方案名称' }]}
                >
                  <Input placeholder="请输入方案名称" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="schemeCode"
                  label="方案编码"
                  rules={[{ required: true, message: '请输入方案编码' }]}
                >
                  <Input placeholder="请输入方案编码" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="tags" label="标签">
              <Select mode="tags" placeholder="请选择或输入标签">
                <Option value="集团采购">集团采购</Option>
                <Option value="价格监控">价格监控</Option>
                <Option value="供应商管理">供应商管理</Option>
              </Select>
            </Form.Item>
            <Form.Item name="description" label="描述">
              <TextArea rows={3} placeholder="请输入方案描述" />
            </Form.Item>
            <Form.Item name="enabled" label="启用" valuePropName="checked">
              <Checkbox>启用</Checkbox>
            </Form.Item>
          </div>
        );

      case 1: // 绑定比价模型（只读概览）
        return (
          <div className="space-y-4">
            <Form.Item
              name="modelId"
              label="选择比价模型"
              rules={[{ required: true, message: '请选择比价模型' }]}
            >
              <Select
                placeholder="请选择一个比价模型以配置指标"
                onChange={handleModelChange}
                allowClear
              >
                {mockModels.map(model => (
                  <Option key={model.id} value={model.id}>{model.name}</Option>
                ))}
              </Select>
            </Form.Item>
            
            {!selectedModel && (
              <Alert
                message="请先选择比价模型"
                description="选择比价模型后，将显示该模型的比价指标、基准指标和计算指标配置选项"
                type="info"
                showIcon
                style={{ marginTop: 16 }}
              />
            )}
            
            {selectedModel && (
              <div className="space-y-4 mt-4">
                <Divider>比价与基准指标选择</Divider>
                <Form.Item
                   name="compareIndicatorId"
                   label="比价指标"
                   rules={[{ required: true, message: '请选择比价指标' }]}
                   extra="从模型'主数据集原子指标'挑选"
                 >
                  <Select placeholder="请选择比价指标">
                    {mockIndicators.filter(ind => ind.id.includes('agreement')).map(ind => (
                      <Option key={ind.id} value={ind.id}>{ind.name}</Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item
                  name="baselineAliases"
                  label="基准指标"
                  rules={[{ required: true, message: '请至少选择一个基准指标' }]}
                  extra="决定启用哪些基准"
                >
                  <Checkbox.Group>
                    <Row>
                      <Col span={8}><Checkbox value="b1">b1 (历史最低)</Checkbox></Col>
                      <Col span={8}><Checkbox value="b2">b2 (市场参考)</Checkbox></Col>
                      <Col span={8}><Checkbox value="b3">b3 (招采最低)</Checkbox></Col>
                    </Row>
                  </Checkbox.Group>
                </Form.Item>
                <div>
                  <Text strong>计算指标</Text>
                  <div className="text-sm text-gray-500 mb-2">勾选要输出的计算指标（来自模型，含 *_b1/_b2 自动展开）</div>
                  <Table
                    size="small"
                    pagination={false}
                    columns={[
                      {
                        title: '选择',
                        dataIndex: 'selected',
                        width: 60,
                        render: (_, record) => <Checkbox />
                      },
                      { title: 'ID', dataIndex: 'id', width: 120 },
                      { title: '名称', dataIndex: 'name' },
                      { title: '绑定模式', dataIndex: 'bindMode', width: 100 },
                      { title: '可用后缀', dataIndex: 'suffixes', width: 120 },
                      { title: '单位', dataIndex: 'unit', width: 80 },
                      { title: '说明', dataIndex: 'description' }
                    ]}
                    dataSource={[
                      {
                        key: '1',
                        id: 'ind_diff_amount',
                        name: '差异额',
                        bindMode: 'ALL',
                        suffixes: '_b1, _b2, _b3',
                        unit: '元',
                        description: '对比侧价格与基准价格的差异金额'
                      },
                      {
                        key: '2',
                        id: 'ind_diff_rate',
                        name: '差异率',
                        bindMode: 'ALL',
                        suffixes: '_b1, _b2, _b3',
                        unit: '%',
                        description: '对比侧价格与基准价格的差异比例'
                      }
                    ]}
                  />
                </div>
                <Alert
                  message="说明"
                  description="计算列由模型定义，方案只做启用与基准勾选。勾选后将输出最终列名（如 ind_diff_rate_b1）"
                  type="info"
                  showIcon
                />
              </div>
            )}
          </div>
        );

      case 2: // 查询范围（WHERE）
        return (
          <div className="space-y-4">
            <Row gutter={16} align="middle">
              <Col span={4} style={{ textAlign: 'right' }}>
                <span><span style={{ color: 'red' }}>*</span> 时间范围:</span>
              </Col>
              <Col span={20}>
                <Form.Item
                  name="timeRange"
                  rules={[{ required: true, message: '请选择时间范围' }]}
                  style={{ marginBottom: 0 }}
                >
                  <RangePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <div className="text-xs text-gray-500 ml-[16.67%]">字段继承模型主表时间口径</div>
            
            <Row gutter={16} align="middle">
              <Col span={4} style={{ textAlign: 'right' }}>
                <span>组织范围:</span>
              </Col>
              <Col span={20}>
                <Form.Item name="orgScope" style={{ marginBottom: 0 }}>
                  <TreeSelect
                    multiple
                    placeholder="请选择组织范围"
                    treeData={mockOrganizations.map(org => ({ title: org.name, value: org.id, key: org.id }))}
                  />
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={16} align="middle">
              <Col span={4} style={{ textAlign: 'right' }}>
                <span>产品:</span>
              </Col>
              <Col span={20}>
                <Form.Item name="productCategory" style={{ marginBottom: 0 }}>
                  <Button 
                    onClick={() => {
                      const mockProducts = [
                        { id: '1', materialCode: 'MAT001', materialName: 'IVD试剂A', brand: 'Roche', specification: '100ml', model: 'R001', itemCode: 'IT001' },
                        { id: '2', materialCode: 'MAT002', materialName: '医疗器械B', brand: 'Siemens', specification: '50ml', model: 'S002', itemCode: 'IT002' },
                        { id: '3', materialCode: 'MAT003', materialName: '药品C', brand: 'Abbott', specification: '200ml', model: 'A003', itemCode: 'IT003' },
                        { id: '4', materialCode: 'MAT004', materialName: '耗材D', brand: 'BD', specification: '10个/盒', model: 'B004', itemCode: 'IT004' },
                        { id: '5', materialCode: 'MAT005', materialName: '设备E', brand: 'GE', specification: '台', model: 'G005', itemCode: 'IT005' }
                      ];
                      
                      Modal.info({
                        title: '选择产品',
                        width: 900,
                        content: (
                          <Table
                            dataSource={mockProducts}
                            rowKey="id"
                            rowSelection={{
                              type: 'checkbox',
                              onChange: (selectedRowKeys, selectedRows) => {
                                console.log('选中的产品:', selectedRows);
                              },
                            }}
                            pagination={{
                              pageSize: 10,
                              showSizeChanger: true,
                              showQuickJumper: true,
                              showTotal: (total, range) => `共 ${total} 条记录，当前显示 ${range[0]}-${range[1]} 条`
                            }}
                            columns={[
                              { title: '物料编码', dataIndex: 'materialCode', key: 'materialCode', width: 120 },
                              { title: '物料名称', dataIndex: 'materialName', key: 'materialName', width: 150 },
                              { title: '品牌', dataIndex: 'brand', key: 'brand', width: 100 },
                              { title: '规格', dataIndex: 'specification', key: 'specification', width: 120 },
                              { title: '型号', dataIndex: 'model', key: 'model', width: 100 },
                              { title: '货号', dataIndex: 'itemCode', key: 'itemCode', width: 100 }
                            ]}
                          />
                        ),
                      });
                    }}
                  >
                    请选择产品
                  </Button>
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={16} align="middle">
              <Col span={4} style={{ textAlign: 'right' }}>
                <span>品牌:</span>
              </Col>
              <Col span={20}>
                <Form.Item name="productBrand" style={{ marginBottom: 0 }}>
                  <Button 
                    onClick={() => {
                      const mockBrands = [
                        { id: '1', brandCode: 'BR001', brandName: 'Roche', brandType: '国际品牌', country: '瑞士', establishYear: '1896', mainProducts: 'IVD试剂、诊断设备' },
                        { id: '2', brandCode: 'BR002', brandName: 'Siemens', brandType: '国际品牌', country: '德国', establishYear: '1847', mainProducts: '医疗设备、影像设备' },
                        { id: '3', brandCode: 'BR003', brandName: 'Abbott', brandType: '国际品牌', country: '美国', establishYear: '1888', mainProducts: '药品、医疗器械' },
                        { id: '4', brandCode: 'BR004', brandName: 'BD', brandType: '国际品牌', country: '美国', establishYear: '1897', mainProducts: '医疗耗材、注射器' },
                        { id: '5', brandCode: 'BR005', brandName: 'GE Healthcare', brandType: '国际品牌', country: '美国', establishYear: '1994', mainProducts: '医疗设备、影像系统' }
                      ];
                      
                      Modal.info({
                        title: '选择品牌',
                        width: 900,
                        content: (
                          <Table
                            dataSource={mockBrands}
                            rowKey="id"
                            rowSelection={{
                              type: 'checkbox',
                              onChange: (selectedRowKeys, selectedRows) => {
                                console.log('选中的品牌:', selectedRows);
                              },
                            }}
                            pagination={{
                              pageSize: 10,
                              showSizeChanger: true,
                              showQuickJumper: true,
                              showTotal: (total, range) => `共 ${total} 条记录，当前显示 ${range[0]}-${range[1]} 条`
                            }}
                            columns={[
                              { title: '品牌编码', dataIndex: 'brandCode', key: 'brandCode', width: 120 },
                              { title: '品牌名称', dataIndex: 'brandName', key: 'brandName', width: 150 },
                              { title: '品牌类型', dataIndex: 'brandType', key: 'brandType', width: 100 },
                              { title: '国家/地区', dataIndex: 'country', key: 'country', width: 120 },
                              { title: '成立年份', dataIndex: 'establishYear', key: 'establishYear', width: 100 },
                              { title: '主营产品', dataIndex: 'mainProducts', key: 'mainProducts', width: 200 }
                            ]}
                          />
                        ),
                      });
                    }}
                  >
                    请选择品牌
                  </Button>
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={16} align="middle">
              <Col span={4} style={{ textAlign: 'right' }}>
                <span>供应商:</span>
              </Col>
              <Col span={20}>
                <Form.Item name="vendorScope" style={{ marginBottom: 0 }}>
                  <Button 
                    onClick={() => {
                      const mockVendors = [
                        { id: '1', vendorCode: 'VD001', vendorName: '上海医疗器械有限公司', vendorType: '代理商', region: '华东地区', contactPerson: '张经理', businessScope: 'IVD试剂、医疗设备' },
                        { id: '2', vendorCode: 'VD002', vendorName: '北京康复医疗科技股份有限公司', vendorType: '制造商', region: '华北地区', contactPerson: '李总监', businessScope: '康复设备、理疗器械' },
                        { id: '3', vendorCode: 'VD003', vendorName: '广州生物医药集团', vendorType: '经销商', region: '华南地区', contactPerson: '王主任', businessScope: '生物制品、药品' },
                        { id: '4', vendorCode: 'VD004', vendorName: '深圳精密医疗器械制造厂', vendorType: '制造商', region: '华南地区', contactPerson: '陈工程师', businessScope: '精密器械、手术器具' },
                        { id: '5', vendorCode: 'VD005', vendorName: '成都医疗耗材供应链公司', vendorType: '供应商', region: '西南地区', contactPerson: '刘采购', businessScope: '一次性耗材、防护用品' }
                      ];
                      
                      Modal.info({
                        title: '选择供应商',
                        width: 900,
                        content: (
                          <Table
                            dataSource={mockVendors}
                            rowKey="id"
                            rowSelection={{
                              type: 'checkbox',
                              onChange: (selectedRowKeys, selectedRows) => {
                                console.log('选中的供应商:', selectedRows);
                              },
                            }}
                            pagination={{
                              pageSize: 10,
                              showSizeChanger: true,
                              showQuickJumper: true,
                              showTotal: (total, range) => `共 ${total} 条记录，当前显示 ${range[0]}-${range[1]} 条`
                            }}
                            columns={[
                              { title: '供应商编码', dataIndex: 'vendorCode', key: 'vendorCode', width: 120 },
                              { title: '供应商名称', dataIndex: 'vendorName', key: 'vendorName', width: 200 },
                              { title: '供应商类型', dataIndex: 'vendorType', key: 'vendorType', width: 100 },
                              { title: '所属区域', dataIndex: 'region', key: 'region', width: 120 },
                              { title: '联系人', dataIndex: 'contactPerson', key: 'contactPerson', width: 100 },
                              { title: '经营范围', dataIndex: 'businessScope', key: 'businessScope', width: 200 }
                            ]}
                          />
                        ),
                      });
                    }}
                  >
                    请选择供应商
                  </Button>
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={16} align="middle">
              <Col span={4} style={{ textAlign: 'right' }}>
                <span>其他条件:</span>
              </Col>
              <Col span={20}>
                <Button type="dashed" icon={<PlusOutlined />}>添加条件</Button>
                <div className="text-sm text-gray-500 mt-1">来自模型白名单字段；支持继承到基准</div>
              </Col>
            </Row>
            
            <Alert
              message="空基准行处理策略"
              description={
                <Form.Item name="onMissingBaseline" style={{ marginBottom: 0 }}>
                  <Radio.Group>
                    <Radio value="keep">保留</Radio>
                    <Radio value="filter">过滤</Radio>
                    <Radio value="mark">标记</Radio>
                  </Radio.Group>
                </Form.Item>
              }
              type="info"
              showIcon
            />
          </div>
        );



      case 3: // 输出与样式
        return (
          <div className="space-y-6">
            <Alert
              message="透视表配置"
              description="配置AntV/S2透视表的行列布局、数值字段和展示样式"
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />
            
            {/* 透视表结构配置 */}
            <Card title="透视表结构" size="small" style={{ marginBottom: 16 }}>
              <Row gutter={24}>
                <Col span={8}>
                  <div className="mb-4">
                    <Text strong className="block mb-2">行字段 (Rows)</Text>
                    <div className="text-xs text-gray-500 mb-2">拖拽字段到此区域作为行维度</div>
                    <div className="border border-dashed border-gray-300 rounded p-3 min-h-[120px] bg-gray-50">
                      <div className="space-y-2">
                        <Tag color="blue">供应商</Tag>
                        <Tag color="blue">采购组织</Tag>
                      </div>
                    </div>
                  </div>
                </Col>
                <Col span={8}>
                  <div className="mb-4">
                    <Text strong className="block mb-2">列字段 (Columns)</Text>
                    <div className="text-xs text-gray-500 mb-2">拖拽字段到此区域作为列维度</div>
                    <div className="border border-dashed border-gray-300 rounded p-3 min-h-[120px] bg-gray-50">
                      <div className="space-y-2">
                        <Tag color="green">商品类别</Tag>
                      </div>
                    </div>
                  </div>
                </Col>
                <Col span={8}>
                  <div className="mb-4">
                    <Text strong className="block mb-2">数值字段 (Values)</Text>
                    <div className="text-xs text-gray-500 mb-2">拖拽指标到此区域</div>
                    <div className="border border-dashed border-gray-300 rounded p-3 min-h-[120px] bg-gray-50">
                      <div className="space-y-2">
                        <Tag color="orange">协议价</Tag>
                        <Tag color="orange">差异率_b1</Tag>
                        <Tag color="orange">差异额_b1</Tag>
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
              
              <Divider style={{ margin: '16px 0' }} />
              
              <div className="mb-4">
                <Text strong className="block mb-2">可用字段</Text>
                <div className="border rounded p-3 bg-white">
                  <div className="flex flex-wrap gap-2">
                    <Tag className="cursor-pointer hover:bg-blue-100">供应商</Tag>
                    <Tag className="cursor-pointer hover:bg-blue-100">采购组织</Tag>
                    <Tag className="cursor-pointer hover:bg-blue-100">商品</Tag>
                    <Tag className="cursor-pointer hover:bg-blue-100">商品类别</Tag>
                    <Tag className="cursor-pointer hover:bg-blue-100">品牌</Tag>
                    <Tag className="cursor-pointer hover:bg-orange-100">协议价</Tag>
                    <Tag className="cursor-pointer hover:bg-orange-100">基准价格_b1</Tag>
                    <Tag className="cursor-pointer hover:bg-orange-100">差异率_b1</Tag>
                    <Tag className="cursor-pointer hover:bg-orange-100">差异额_b1</Tag>
                  </div>
                </div>
              </div>
            </Card>

            {/* 展示配置 */}
            <Card title="展示配置" size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="tableType" label="表格类型">
                    <Select defaultValue="pivot" placeholder="选择表格类型">
                      <Option value="pivot">透视表</Option>
                      <Option value="table">明细表</Option>
                      <Option value="tree">树形表</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="showTotals" label="显示汇总">
                    <Switch defaultChecked />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="showSubTotals" label="显示小计">
                    <Switch defaultChecked />
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="orderBy" label="排序字段">
                    <Select placeholder="请选择排序字段">
                      <Option value="diff_rate_b1">差异率_b1</Option>
                      <Option value="diff_amount_b1">差异额_b1</Option>
                      <Option value="agreement_price">协议价</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="orderDirection" label="排序方向">
                    <Select placeholder="请选择排序方向">
                      <Option value="desc">降序</Option>
                      <Option value="asc">升序</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* 样式配置 */}
            <Card title="样式配置" size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="theme" label="主题风格">
                    <Select defaultValue="default" placeholder="选择主题">
                      <Option value="default">默认</Option>
                      <Option value="gray">简约灰</Option>
                      <Option value="colorful">多彩</Option>
                      <Option value="dark">深色</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="cellSize" label="单元格大小">
                    <Select defaultValue="default" placeholder="选择大小">
                      <Option value="compact">紧凑</Option>
                      <Option value="default">默认</Option>
                      <Option value="loose">宽松</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              
              <div className="mb-4">
                <Text strong className="block mb-2">条件格式</Text>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 border rounded">
                     <span className="text-sm">差异率 {'>'} 10% 时高亮显示</span>
                     <div className="flex items-center gap-2">
                       <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                       <Button size="small" type="link">编辑</Button>
                     </div>
                   </div>
                   <div className="flex items-center justify-between p-2 border rounded">
                     <span className="text-sm">差异率 {'<'} -5% 时标记为绿色</span>
                     <div className="flex items-center gap-2">
                       <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                       <Button size="small" type="link">编辑</Button>
                     </div>
                   </div>
                  <Button type="dashed" size="small" icon={<PlusOutlined />}>添加条件格式</Button>
                </div>
              </div>
            </Card>

            {/* 导出配置 */}
            <Card title="导出配置" size="small">
              <Row gutter={16}>
                <Col span={12}>
                  <div>
                    <Text strong className="block mb-2">导出格式</Text>
                    <div className="space-x-4">
                      <Form.Item name="exportExcel" valuePropName="checked" style={{ display: 'inline-block', marginBottom: 0 }}>
                        <Checkbox defaultChecked>Excel</Checkbox>
                      </Form.Item>
                      <Form.Item name="exportCsv" valuePropName="checked" style={{ display: 'inline-block', marginBottom: 0 }}>
                        <Checkbox>CSV</Checkbox>
                      </Form.Item>
                      <Form.Item name="exportApi" valuePropName="checked" style={{ display: 'inline-block', marginBottom: 0 }}>
                        <Checkbox>API</Checkbox>
                      </Form.Item>
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <Form.Item name="exportFileName" label="文件名模板">
                    <Input placeholder="比价结果_{YYYY-MM-DD}" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </div>
        );



      case 4: // 预览与执行
        return (
          <div className="space-y-4">
            <Alert
              message="预览比价结果并执行方案，确认无误后可保存并启用方案。"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Alert
              message="SQL校验"
              description="占位符就绪 ✓  对齐维度一致 ✓  时间口径：按月"
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Space wrap>
              <Button icon={<FileTextOutlined />} onClick={generateSQL}>生成SQL</Button>
              <Button icon={<EyeOutlined />}>预览样例10行</Button>
              <Button type="primary" icon={<PlayCircleOutlined />}>执行</Button>
              <Button icon={<DownloadOutlined />}>导出</Button>
              <Button icon={<SettingOutlined />}>配置调度</Button>
              <Button>仅保存不执行</Button>
            </Space>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Card title="执行统计" size="small">
                  <div><Text strong>预计记录数:</Text> 约 1,250 条</div>
                  <div><Text strong>执行时间:</Text> 预计 2-3 秒</div>
                  <div><Text strong>数据更新:</Text> 实时</div>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="方案状态" size="small">
                  <div><Text strong>当前状态:</Text> <Tag color="orange">草稿</Tag></div>
                  <div><Text strong>创建时间:</Text> {new Date().toLocaleString()}</div>
                  <div><Text strong>修改时间:</Text> {new Date().toLocaleString()}</div>
                </Card>
              </Col>
            </Row>
          </div>
        );

      case 5: // 调度与推送
        return (
          <div className="space-y-4">
            <Alert
              message="配置方案的自动执行调度和结果推送设置（可选）。"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <div>
              <Text strong>启用调度</Text>
              <div className="mt-2">
                <Checkbox>开启自动调度</Checkbox>
                <Text className="ml-2 text-sm text-gray-500">开启后方案将按设定时间自动执行</Text>
              </div>
            </div>
            <div>
              <Text strong>调度频率</Text>
              <Radio.Group defaultValue="daily" className="mt-2">
                <Radio value="daily">每日</Radio>
                <Radio value="weekly">每周</Radio>
                <Radio value="monthly">每月</Radio>
                <Radio value="custom">自定义</Radio>
              </Radio.Group>
            </div>
            <div>
              <Text strong>执行时间</Text>
              <Input
                style={{ marginTop: 8, width: 120 }}
                placeholder="09:00"
                defaultValue="09:00"
              />
            </div>
            <div>
              <Text strong>推送设置</Text>
              <div className="mt-2 space-y-2">
                <Checkbox>邮件推送</Checkbox>
                <Checkbox>钉钉推送</Checkbox>
                <Checkbox>企业微信推送</Checkbox>
              </div>
            </div>
            <div>
              <Text strong>推送对象</Text>
              <Select
                mode="multiple"
                style={{ width: '100%', marginTop: 8 }}
                placeholder="选择推送对象"
              >
                <Option value="admin">管理员</Option>
                <Option value="buyer">采购员</Option>
                <Option value="finance">财务</Option>
              </Select>
            </div>
            <div>
              <Text strong>推送内容</Text>
              <Checkbox.Group className="mt-2">
                <div className="space-y-1">
                  <div><Checkbox value="summary">执行摘要</Checkbox></div>
                  <div><Checkbox value="excel">Excel附件</Checkbox></div>
                  <div><Checkbox value="alert">异常告警</Checkbox></div>
                </div>
              </Checkbox.Group>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={2}>比价方案2管理</Title>
          <Text type="secondary">管理多基准比价方案，支持复杂的对比分析配置</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新建方案
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={schemes}
          rowKey="id"
          scroll={{ x: 1200, y: 600 }}
          pagination={{
            total: schemes.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      {/* 新建/编辑方案弹框 */}
      <Modal
        title={
          <div className="flex items-center justify-between">
            <span>{editingScheme ? '编辑比价方案' : '新建比价方案'}</span>
            <div className="flex items-center space-x-2">
              <Tag color="orange">状态: 草稿</Tag>
              <Tooltip title="方案信息">
                <InfoCircleOutlined className="text-gray-400" />
              </Tooltip>
            </div>
          </div>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={
          <div className="flex justify-between">
            <Button onClick={() => setIsModalVisible(false)}>返回</Button>
            <Space>
              {currentStep > 0 && (
                <Button onClick={() => setCurrentStep(currentStep - 1)}>上一步</Button>
              )}
              {currentStep < steps.length - 1 ? (
                <Button type="primary" onClick={() => setCurrentStep(currentStep + 1)}>下一步</Button>
              ) : (
                <Space>
                  <Button icon={<SaveOutlined />} onClick={handleSubmit}>保存</Button>
                  <Button type="primary" icon={<SendOutlined />} onClick={handleSubmit}>发布</Button>
                </Space>
              )}
            </Space>
          </div>
        }
        width={1000}
        destroyOnClose
      >
        <div className="mb-6">
          <Steps current={currentStep} size="small">
            {steps.map((step, index) => (
              <Step
                key={index}
                title={step.title}
                description={step.description}
                onClick={() => setCurrentStep(index)}
                style={{ cursor: 'pointer' }}
              />
            ))}
          </Steps>
        </div>

        <Form form={form} layout="vertical">
          {renderStepContent()}
        </Form>
      </Modal>

      {/* SQL预览弹框 */}
      <Modal
        title="SQL预览"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>关闭</Button>,
          <Button key="copy" type="primary">复制SQL</Button>
        ]}
        width={800}
      >
        <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto max-h-96">
          {sqlPreview}
        </pre>
      </Modal>
    </div>
  );
};

export default PriceScheme2Management;