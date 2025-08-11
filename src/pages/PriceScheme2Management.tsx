import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Modal, Form, Input, Select, Space, message, Popconfirm, Tag, Steps, Radio, Checkbox, Divider, Typography, Alert, DatePicker, Upload, Row, Col, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SaveOutlined, SendOutlined, UploadOutlined, InfoCircleOutlined, CopyOutlined, PlayCircleOutlined, FileTextOutlined, DownloadOutlined, SettingOutlined } from '@ant-design/icons';
// import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
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
    extra?: any;
  };
  baselines: BaselineBlock[];
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
    export: {
      excel: boolean;
      csv: boolean;
      api: boolean;
    };
  };
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface BaselineBlock {
  id: string;
  label: string;
  participantIndicatorId: string;
  datasetId: string;
  indicatorId: string;
  bindPlaceholders: { [key: string]: string };
  alignMode: {
    mode: 'inherit' | 'custom';
    dimensions?: string[];
  };
  filters?: any;
  resultAlias: {
    baselineColumn: string;
    diffRateColumn: string;
  };
}

interface ComparisonModel {
  id: string;
  name: string;
  primaryDataset: string;
  compareKeys: string[];
  analysisObject: string;
  dimensions: string[];
  indicators: string[];
  baselineCandidates: any[];
  defaultOutput: string[];
}

const PriceScheme2Management: React.FC = () => {
  const [schemes, setSchemes] = useState<ComparisonScheme[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingScheme, setEditingScheme] = useState<ComparisonScheme | null>(null);
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [baselines, setBaselines] = useState<BaselineBlock[]>([]);
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
      indicators: ['ind_agreement_price', 'ind_discount_rate'],
      baselineCandidates: [
        { datasetId: 'ds_bid', indicators: ['ind_bid_min'] },
        { datasetId: 'ds_po_hist', indicators: ['ind_hist_min'] }
      ],
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
          timeRange: ['2024-01-01', '2024-03-31']
        },
        baselines: [
          {
            id: 'baseline_1',
            label: '基准块 #1',
            participantIndicatorId: 'ind_agreement_price',
            datasetId: 'ds_bid',
            indicatorId: 'ind_bid_min',
            bindPlaceholders: { '${BASELINE}': 'ind_bid_min' },
            alignMode: { mode: 'inherit' },
            resultAlias: {
              baselineColumn: 'baseline_price_A',
              diffRateColumn: 'diff_rate_A'
            }
          }
        ],
        output: {
          columns: ['供应商', '采购组织', '协议价', 'baseline_price_A', 'diff_rate_A'],
          orderBy: [{ field: 'diff_rate_A', order: 'desc' }],
          export: { excel: true, csv: false, api: false }
        },
        status: 'DRAFT',
        createdBy: 'admin',
        createdAt: '2024-01-15',
        updatedAt: '2024-01-15'
      }
    ]);
  }, []);

  const steps = [
    { title: '基本信息', description: '方案名称、编码等基础信息' },
    { title: '绑定比价模型', description: '选择比价模型并查看摘要' },
    { title: '执行范围', description: '设置WHERE条件和过滤范围' },
    { title: '多基准设置', description: '配置基准块和对齐策略' },
    { title: '规则集', description: '绑定控制和评分规则' },
    { title: '输出与排序', description: '配置输出列和排序方式' },
    { title: '预览与执行', description: '生成SQL并预览结果' }
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
      exportExcel: scheme.output.export.excel,
      exportCsv: scheme.output.export.csv,
      exportApi: scheme.output.export.api
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
    }
  };

  const addBaselineBlock = () => {
    const newBaseline: BaselineBlock = {
      id: `baseline_${Date.now()}`,
      label: `基准块 #${baselines.length + 1}`,
      participantIndicatorId: '',
      datasetId: '',
      indicatorId: '',
      bindPlaceholders: {},
      alignMode: { mode: 'inherit' },
      resultAlias: {
        baselineColumn: `baseline_price_${String.fromCharCode(65 + baselines.length)}`,
        diffRateColumn: `diff_rate_${String.fromCharCode(65 + baselines.length)}`
      }
    };
    setBaselines([...baselines, newBaseline]);
  };

  const updateBaselineBlock = (index: number, updates: Partial<BaselineBlock>) => {
    const newBaselines = [...baselines];
    newBaselines[index] = { ...newBaselines[index], ...updates };
    setBaselines(newBaselines);
  };

  const removeBaselineBlock = (index: number) => {
    setBaselines(baselines.filter((_, i) => i !== index));
  };

  const copyBaselineBlock = (index: number) => {
    const original = baselines[index];
    const copy: BaselineBlock = {
      ...original,
      id: `baseline_${Date.now()}`,
      label: `${original.label} (副本)`,
      resultAlias: {
        baselineColumn: `${original.resultAlias.baselineColumn}_copy`,
        diffRateColumn: `${original.resultAlias.diffRateColumn}_copy`
      }
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
          timeRange: [values.timeRange[0].format('YYYY-MM-DD'), values.timeRange[1].format('YYYY-MM-DD')]
        },
        baselines,
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
          export: {
            excel: values.exportExcel || false,
            csv: values.exportCsv || false,
            api: values.exportApi || false
          }
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
      title: '方案名称',
      dataIndex: 'schemeName',
      key: 'schemeName',
      render: (text: string, record: ComparisonScheme) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-sm text-gray-500">{record.schemeCode}</div>
        </div>
      ),
    },
    {
      title: '绑定模型',
      dataIndex: ['modelRef', 'name'],
      key: 'modelName',
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string[]) => (
        <>
          {tags.map(tag => (
            <Tag key={tag} color="blue">{tag}</Tag>
          ))}
        </>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
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
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ComparisonScheme) => (
        <Space size="middle">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleEdit(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
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

      case 1: // 绑定比价模型
        return (
          <div className="space-y-4">
            <Form.Item
              name="modelId"
              label="选择比价模型"
              rules={[{ required: true, message: '请选择比价模型' }]}
            >
              <Select
                placeholder="请选择比价模型"
                onChange={handleModelChange}
              >
                {mockModels.map(model => (
                  <Option key={model.id} value={model.id}>{model.name}</Option>
                ))}
              </Select>
            </Form.Item>
            {selectedModel && (
              <Card title="模型摘要（只读）" size="small">
                <div className="space-y-2 text-sm">
                  <div>• 主数据集: {selectedModel.primaryDataset}</div>
                  <div>• compare keys: {selectedModel.compareKeys.join(', ')}</div>
                  <div>• 分析对象: {selectedModel.analysisObject}</div>
                  <div>• 维度: {selectedModel.dimensions.join('/')}</div>
                  <div>• 可用/原子指标: {selectedModel.indicators.join(', ')}</div>
                  <div>• 可用基准候选: {selectedModel.baselineCandidates.map(bc => `${bc.datasetId}[${bc.indicators.join(',')}]`).join(', ')}</div>
                  <div>• 默认输出: {selectedModel.defaultOutput.join(', ')}</div>
                </div>
              </Card>
            )}
          </div>
        );

      case 2: // 执行范围
        return (
          <div className="space-y-4">
            <Form.Item name="orgScope" label="组织范围">
              <Select mode="multiple" placeholder="请选择组织范围">
                {mockOrganizations.map(org => (
                  <Option key={org.id} value={org.id}>{org.name}</Option>
                ))}
              </Select>
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="productCategory" label="商品分类">
                  <Select placeholder="请选择商品分类">
                    {mockCategories.map(cat => (
                      <Option key={cat.id} value={cat.id}>{cat.name}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="productBrand" label="品牌">
                  <Select placeholder="请选择品牌">
                    {mockBrands.map(brand => (
                      <Option key={brand.id} value={brand.id}>{brand.name}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="SKU/清单导入">
              <Upload>
                <Button icon={<UploadOutlined />}>选择文件</Button>
              </Upload>
            </Form.Item>
            <Form.Item
              name="timeRange"
              label="时间范围"
              rules={[{ required: true, message: '请选择时间范围' }]}
            >
              <RangePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="vendorScope" label="供应商（可选）">
              <Select mode="multiple" placeholder="请选择供应商">
                {mockVendors.map(vendor => (
                  <Option key={vendor.id} value={vendor.id}>{vendor.name}</Option>
                ))}
              </Select>
            </Form.Item>
          </div>
        );

      case 3: // 多基准设置
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Title level={5}>基准块配置</Title>
              <Button type="primary" icon={<PlusOutlined />} onClick={addBaselineBlock}>
                添加基准块
              </Button>
            </div>
            {baselines.map((baseline, index) => (
              <Card
                key={baseline.id}
                title={baseline.label}
                size="small"
                extra={
                  <Space>
                    <Button size="small" icon={<CopyOutlined />} onClick={() => copyBaselineBlock(index)}>复制</Button>
                    <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeBaselineBlock(index)}>删除</Button>
                  </Space>
                }
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <div className="mb-2">
                      <Text strong>参与侧指标 *</Text>
                      <Select
                        style={{ width: '100%', marginTop: 4 }}
                        placeholder="请选择参与侧指标"
                        value={baseline.participantIndicatorId}
                        onChange={(value) => updateBaselineBlock(index, { participantIndicatorId: value })}
                      >
                        {mockIndicators.map(ind => (
                          <Option key={ind.id} value={ind.id}>{ind.name}</Option>
                        ))}
                      </Select>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="mb-2">
                      <Text strong>基准数据集 *</Text>
                      <Select
                        style={{ width: '100%', marginTop: 4 }}
                        placeholder="请选择基准数据集"
                        value={baseline.datasetId}
                        onChange={(value) => updateBaselineBlock(index, { datasetId: value })}
                      >
                        {mockDatasets.map(ds => (
                          <Option key={ds.id} value={ds.id}>{ds.name}</Option>
                        ))}
                      </Select>
                    </div>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}>
                    <div className="mb-2">
                      <Text strong>基准指标 *</Text>
                      <Select
                        style={{ width: '100%', marginTop: 4 }}
                        placeholder="请选择基准指标"
                        value={baseline.indicatorId}
                        onChange={(value) => updateBaselineBlock(index, { indicatorId: value })}
                      >
                        {mockIndicators.map(ind => (
                          <Option key={ind.id} value={ind.id}>{ind.name}</Option>
                        ))}
                      </Select>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="mb-2">
                      <Text strong>占位符绑定</Text>
                      <Input
                        style={{ marginTop: 4 }}
                        placeholder="${BASELINE} ← 基准指标"
                        value={`\${BASELINE} ← ${baseline.indicatorId}`}
                        disabled
                      />
                    </div>
                  </Col>
                </Row>
                <div className="mb-2">
                  <Text strong>对齐维度策略</Text>
                  <Radio.Group
                    style={{ marginTop: 4 }}
                    value={baseline.alignMode.mode}
                    onChange={(e) => updateBaselineBlock(index, { alignMode: { mode: e.target.value } })}
                  >
                    <Radio value="inherit">继承模型</Radio>
                    <Radio value="custom">自定义</Radio>
                  </Radio.Group>
                  {baseline.alignMode.mode === 'custom' && (
                    <Select
                      mode="multiple"
                      style={{ width: '100%', marginTop: 8 }}
                      placeholder="请选择自定义维度"
                      value={baseline.alignMode.dimensions}
                      onChange={(value) => updateBaselineBlock(index, { alignMode: { mode: 'custom', dimensions: value } })}
                    >
                      <Option value="组织">组织</Option>
                      <Option value="月份">月份</Option>
                      <Option value="地区">地区</Option>
                    </Select>
                  )}
                </div>
                <Row gutter={16}>
                  <Col span={12}>
                    <div className="mb-2">
                      <Text strong>基准列名</Text>
                      <Input
                        style={{ marginTop: 4 }}
                        placeholder="基准列名"
                        value={baseline.resultAlias.baselineColumn}
                        onChange={(e) => updateBaselineBlock(index, {
                          resultAlias: { ...baseline.resultAlias, baselineColumn: e.target.value }
                        })}
                      />
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="mb-2">
                      <Text strong>差异率列名</Text>
                      <Input
                        style={{ marginTop: 4 }}
                        placeholder="差异率列名"
                        value={baseline.resultAlias.diffRateColumn}
                        onChange={(e) => updateBaselineBlock(index, {
                          resultAlias: { ...baseline.resultAlias, diffRateColumn: e.target.value }
                        })}
                      />
                    </div>
                  </Col>
                </Row>
              </Card>
            ))}
          </div>
        );

      case 4: // 规则集
        return (
          <div className="space-y-4">
            <Form.Item name="ruleSetId" label="绑定规则集">
              <Select placeholder="请选择规则集" allowClear>
                {mockRuleSets.map(rule => (
                  <Option key={rule.id} value={rule.id}>{rule.name}</Option>
                ))}
              </Select>
            </Form.Item>
            <Card title="规则示例" size="small">
              <div className="space-y-1 text-sm">
                <div>• control: diff_rate_A &gt; 0.2 → 标红 &amp; 邮件</div>
                <div>• score: 0.6*scoreA + 0.4*vendor_reputation</div>
              </div>
            </Card>
          </div>
        );

      case 5: // 输出与排序
        return (
          <div className="space-y-4">
            <div>
              <Text strong>输出列</Text>
              <div className="mt-2 p-2 border border-dashed border-gray-300 rounded">
                {outputColumns.map((column, index) => (
                  <div
                    key={column}
                    className="p-2 mb-1 bg-blue-50 border border-blue-200 rounded flex justify-between items-center"
                  >
                    <span>{column}</span>
                    <Space>
                      {index > 0 && (
                        <Button
                          size="small"
                          onClick={() => {
                            const newColumns = [...outputColumns];
                            [newColumns[index], newColumns[index - 1]] = [newColumns[index - 1], newColumns[index]];
                            setOutputColumns(newColumns);
                          }}
                        >
                          ↑
                        </Button>
                      )}
                      {index < outputColumns.length - 1 && (
                        <Button
                          size="small"
                          onClick={() => {
                            const newColumns = [...outputColumns];
                            [newColumns[index], newColumns[index + 1]] = [newColumns[index + 1], newColumns[index]];
                            setOutputColumns(newColumns);
                          }}
                        >
                          ↓
                        </Button>
                      )}
                    </Space>
                  </div>
                ))}
              </div>
            </div>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="orderBy" label="默认排序">
                  <Select placeholder="请选择排序字段">
                    {outputColumns.map(col => (
                      <Option key={col} value={col}>{col}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="orderDirection" label="排序方向">
                  <Select placeholder="请选择排序方向">
                    <Option value="asc">升序</Option>
                    <Option value="desc">降序</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <div>
              <Text strong>导出格式</Text>
              <div className="mt-2 space-x-4">
                <Form.Item name="exportExcel" valuePropName="checked" style={{ display: 'inline-block', margin: 0 }}>
                  <Checkbox>Excel</Checkbox>
                </Form.Item>
                <Form.Item name="exportCsv" valuePropName="checked" style={{ display: 'inline-block', margin: 0 }}>
                  <Checkbox>CSV</Checkbox>
                </Form.Item>
                <Form.Item name="exportApi" valuePropName="checked" style={{ display: 'inline-block', margin: 0 }}>
                  <Checkbox>API</Checkbox>
                </Form.Item>
              </div>
            </div>
          </div>
        );

      case 6: // 预览与执行
        return (
          <div className="space-y-4">
            <Alert
              message="SQL校验"
              description="占位符就绪 ✓  对齐维度一致 ✓  时间口径：按月"
              type="success"
              showIcon
            />
            <Space wrap>
              <Button icon={<FileTextOutlined />} onClick={generateSQL}>生成SQL</Button>
              <Button icon={<EyeOutlined />}>预览样例10行</Button>
              <Button type="primary" icon={<PlayCircleOutlined />}>执行</Button>
              <Button icon={<DownloadOutlined />}>导出</Button>
              <Button icon={<SettingOutlined />}>配置调度</Button>
              <Button>仅保存不执行</Button>
            </Space>
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