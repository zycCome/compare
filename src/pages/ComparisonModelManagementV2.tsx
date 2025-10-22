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
  Tag,
  Modal,
  Table,
  Checkbox,
  Dropdown,
  Badge,
  Radio
} from 'antd';
import { DragOutlined } from '@ant-design/icons';
import {
  PlusOutlined,
  SaveOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  CloseOutlined,
  LinkOutlined,
  DownOutlined
} from '@ant-design/icons';
import FieldMetadataConfigDialog, { FieldMetadataConfig } from '../components/FieldMetadataConfigDialog';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

/**
 * 比对模型管理组件（垂直卡片布局版本）
 * 提供基本信息、比对数据集、基准数据集三模块的配置界面
 */
// 基准数据集项类型，约束 joinType 为字面量联合类型
type BaselineDatasetItem = {
  id: string;
  name: string;
  description: string;
  recordCount: number;
  joinType: 'LEFT JOIN' | 'RIGHT JOIN' | 'INNER JOIN';
};

const ComparisonModelManagementV2: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 基本信息相关状态
  const [tags, setTags] = useState<string[]>([]);
  const [inputTag, setInputTag] = useState('');

  // 新增：数据连接相关状态
  const [selectedDataConnection, setSelectedDataConnection] = useState<string>('');

  // 比对数据集相关状态
  const [selectedComparisonDataset, setSelectedComparisonDataset] = useState<{id: string; name: string} | null>(null);
    // 组织权限字段ID
  const [organizationPermissionFieldId, setOrganizationPermissionFieldId] = useState<string | null>(null);
  // 比对数据集字段（显示为Tag标签）
  const [comparisonObjectFields, setComparisonObjectFields] = useState<Array<{
    id: string;
    fieldCode: string;
    fieldName: string;
    fieldType: string;
    displayName: string;
    attribute: string;
  }>>([]);
  // 数据集字段（显示为表格）
  const [comparisonFields, setComparisonFields] = useState<Array<{
    id: string;
    fieldCode: string;
    fieldName: string;
    fieldType: string;
    displayName: string;
    attribute: string;
  }>>([]);
  const [comparisonFieldModalVisible, setComparisonFieldModalVisible] = useState(false);
  const [comparisonDatasetModalVisible, setComparisonDatasetModalVisible] = useState(false);
  const [comparisonObjectModalVisible, setComparisonObjectModalVisible] = useState(false);
  const [comparisonObjectFieldModalVisible, setComparisonObjectFieldModalVisible] = useState(false);
  const [selectedComparisonFields, setSelectedComparisonFields] = useState<string[]>([]);
  const [selectedComparisonObjectFields, setSelectedComparisonObjectFields] = useState<string[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');

  // 字段配置相关状态
  const [fieldConfigModalVisible, setFieldConfigModalVisible] = useState(false);
  const [currentConfigField, setCurrentConfigField] = useState<any>(null);
  const [fieldConfigs, setFieldConfigs] = useState<Map<string, FieldMetadataConfig>>(new Map());

  // 查询条件相关状态
  interface QueryCondition {
    id: string;
    name: string;           // 条件名称
    componentType: string;  // 组件类型
    fieldId: string;       // 对应字段ID
    remark?: string;       // 备注
    required: boolean;     // 是否必填
  }

  const [queryConditions, setQueryConditions] = useState<{
    comparison: QueryCondition[];    // 比对数据集的查询条件
    baseline: {[datasetId: string]: QueryCondition[]}  // 基准数据集的查询条件（按数据集分组）
  }>({ comparison: [], baseline: {} });

  // 查询条件弹窗相关状态
  const [queryConditionModalVisible, setQueryConditionModalVisible] = useState(false);
  const [editingQueryCondition, setEditingQueryCondition] = useState<QueryCondition | null>(null);
  const [currentQueryType, setCurrentQueryType] = useState<'comparison' | 'baseline'>('comparison');
  const [currentDatasetId, setCurrentDatasetId] = useState<string>('');

  // 保证比对数据集字段始终是数据集字段的子集
  useEffect(() => {
    if (comparisonObjectFields.length > 0) {
      const fieldIds = new Set(comparisonFields.map(f => f.id));
      const filtered = comparisonObjectFields.filter(f => fieldIds.has(f.id));
      if (filtered.length !== comparisonObjectFields.length) {
        setComparisonObjectFields(filtered);
      }
    }
  }, [comparisonFields]);

  // 基准数据集相关状态
  const [selectedBaselineDatasets, setSelectedBaselineDatasets] = useState<BaselineDatasetItem[]>([]);
  const [joinTypeModalVisible, setJoinTypeModalVisible] = useState(false);
  const [currentEditingDataset, setCurrentEditingDataset] = useState<string | null>(null);
  const [currentBaselineDataset, setCurrentBaselineDataset] = useState<string>('');
  // 基准数据集组织权限字段ID
  const [baselineOrganizationPermissionFieldId, setBaselineOrganizationPermissionFieldId] = useState<string | null>(null);
  const [baselineFields, setBaselineFields] = useState<{[key: string]: Array<{
    id: string;
    fieldCode: string;
    fieldName: string;
    fieldType: string;
    displayName: string;
    attribute: string;
  }>}>({});
  const [baselineDatasetFields, setBaselineDatasetFields] = useState<Array<{
    id: string;
    fieldCode: string;
    fieldName: string;
    fieldType: string;
    displayName: string;
    attribute: string;
  }>>([]);
  const [selectedBaselineFields, setSelectedBaselineFields] = useState<string[]>([]);
  const [baselineFieldModalVisible, setBaselineFieldModalVisible] = useState(false);
  const [baselineDatasetModalVisible, setBaselineDatasetModalVisible] = useState(false);

  // 模拟数据
  const mockDatasets = [
    { id: 'ds_agreement', name: '采购协议数据集', description: '包含所有采购协议的价格信息', recordCount: 15420 },
    { id: 'ds_bid', name: '招标数据集', description: '历史招标数据和价格信息', recordCount: 8930 },
    { id: 'ds_market', name: '市场价格数据集', description: '市场参考价格数据', recordCount: 23450 },
    { id: 'ds_historical', name: '历史采购数据集', description: '历史采购记录和价格变化', recordCount: 45670 }
  ];

  const mockDatasetFields = [
    { id: 'field_1', fieldCode: 'product_code', fieldName: '商品编码', fieldType: 'string', displayName: '商品编码', attribute: '文本' },
    { id: 'field_2', fieldCode: 'product_name', fieldName: '商品名称', fieldType: 'string', displayName: '商品名称', attribute: '文本' },
    { id: 'field_3', fieldCode: 'category', fieldName: '商品分类', fieldType: 'string', displayName: '商品分类', attribute: '文本' },
    { id: 'field_4', fieldCode: 'brand', fieldName: '品牌', fieldType: 'string', displayName: '品牌', attribute: '文本' },
    { id: 'field_5', fieldCode: 'supplier', fieldName: '供应商', fieldType: 'string', displayName: '供应商', attribute: '文本' },
    { id: 'field_6', fieldCode: 'price', fieldName: '价格', fieldType: 'number', displayName: '价格', attribute: '数值' },
    { id: 'field_7', fieldCode: 'quantity', fieldName: '数量', fieldType: 'number', displayName: '数量', attribute: '数值' },
    { id: 'field_8', fieldCode: 'purchase_date', fieldName: '采购日期', fieldType: 'date', displayName: '采购日期', attribute: '时间' }
  ];

  /**
   * 添加标签
   */
  const handleAddTag = () => {
    if (inputTag && !tags.includes(inputTag)) {
      setTags([...tags, inputTag]);
      setInputTag('');
    }
  };

  /**
   * 删除标签
   */
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  /**
   * 保存表单
   */
  const handleSave = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      console.log('表单数据:', {
        ...values,
        tags,
        comparisonFields,
        selectedBaselineDatasets,
        baselineFields
      });
      message.success('比对模型保存成功');
    } catch (error) {
      console.error('表单验证失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Card>
        <style>{`
          .ant-table-tbody > tr.ant-table-row-selected > td {
            background-color: #f6ffed !important;
          }
          .ant-table-tbody > tr:hover > td {
            background-color: #e6f7ff !important;
          }
          .ant-table-tbody > tr.ant-table-row-selected:hover > td {
            background-color: #d9f7be !important;
          }
        `}</style>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            modelCode: '',
            modelName: '',
            modelDescription: ''
          }}
        >
          {/* 页面标题 */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <Title level={3} style={{ margin: 0 }}>
              比对模型管理（卡片布局）
            </Title>
            <Space>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={loading}
                onClick={handleSave}
              >
                保存
              </Button>
              <Button icon={<EyeOutlined />}>
                预览
              </Button>
            </Space>
          </div>

          {/* 基本信息模块 */}
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: '4px',
                  height: '20px',
                  backgroundColor: '#1890ff',
                  marginRight: '12px',
                  borderRadius: '2px'
                }} />
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
                  基本信息
                </span>
              </div>
            }
            style={{ marginBottom: '16px' }}
          >
            {/* 第一行：模型编码、模型名称 */}
            <Row gutter={24} style={{ marginBottom: '16px' }}>
              <Col span={8}>
                <Form.Item
                  name="modelCode"
                  label="模型编码"
                  rules={[{ required: true, message: '请输入模型编码' }]}
                >
                  <Input placeholder="请输入模型编码" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="modelName"
                  label="模型名称"
                  rules={[{ required: true, message: '请输入模型名称' }]}
                >
                  <Input placeholder="请输入模型名称" />
                </Form.Item>
              </Col>
            </Row>

            {/* 第二行：数据连接 */}
            <Row style={{ marginBottom: '16px' }}>
              <Col span={8}>
                <Form.Item
                  name="dataConnection"
                  label="数据连接"
                >
                  <Select
                    placeholder="请选择数据连接"
                    value={selectedDataConnection}
                    onChange={(value) => {
                      setSelectedDataConnection(value);
                    }}
                  >
                    <Option value="mysql_prod">MySQL生产库</Option>
                    <Option value="oracle_dw">Oracle数据仓库</Option>
                    <Option value="postgres_bi">PostgreSQL BI库</Option>
                    <Option value="clickhouse_olap">ClickHouse OLAP</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            {/* 第三行：模型描述 */}
            <Row style={{ marginBottom: '16px' }}>
              <Col span={16}>
                <Form.Item
                  name="modelDescription"
                  label="模型描述"
                >
                  <TextArea
                    placeholder="请输入模型描述"
                    rows={3}
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* 第四行：标签 */}
            <Row>
              <Col span={16}>
                <Form.Item label="分类标签">
                  <div style={{ marginBottom: '8px' }}>
                    {tags.map(tag => (
                      <Tag
                        key={tag}
                        closable
                        onClose={() => handleRemoveTag(tag)}
                        style={{ marginBottom: '4px' }}
                      >
                        {tag}
                      </Tag>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Input
                      value={inputTag}
                      onChange={(e) => setInputTag(e.target.value)}
                      onPressEnter={handleAddTag}
                      placeholder="输入标签后按回车添加"
                      style={{ width: '200px', marginRight: '8px' }}
                    />
                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={handleAddTag}
                    >
                      添加标签
                    </Button>
                  </div>
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* 比对数据集设置 - 垂直卡片布局 */}
          <div style={{
            backgroundColor: '#fafafa',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '24px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <div style={{
                width: '4px',
                height: '20px',
                backgroundColor: '#52c41a',
                marginRight: '12px',
                borderRadius: '2px'
              }} />
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
                比对数据集设置
              </span>
            </div>

            {/* 卡片1：比对配置 */}
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{
                    width: '3px',
                    height: '16px',
                    backgroundColor: '#52c41a',
                    marginRight: '8px',
                    borderRadius: '2px'
                  }} />
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    比对配置
                  </span>
                </div>
              }
              size="small"
              style={{ marginBottom: '16px' }}
            >
              {/* 比对数据集和比对数据集在同一行 */}
              <Row gutter={16}>
                <Col span={12}>
                  <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                    比对数据集
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Input
                      value={selectedComparisonDataset?.name || ''}
                      placeholder="请选择比对数据集"
                      readOnly
                      style={{ flex: 1, cursor: 'pointer', marginRight: '8px' }}
                      onClick={() => setComparisonDatasetModalVisible(true)}
                    />
                    <Button
                      type="primary"
                      size="small"
                      onClick={() => setComparisonDatasetModalVisible(true)}
                    >
                      选择
                    </Button>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                    比对数据集
                  </div>
                  <div style={{
                    border: '1px solid #d9d9d9',
                    borderRadius: '6px',
                    padding: '8px',
                    minHeight: '32px',
                    backgroundColor: '#fafafa',
                    cursor: selectedComparisonDataset ? 'pointer' : 'not-allowed',
                    position: 'relative'
                  }}
                  onClick={() => selectedComparisonDataset && setComparisonObjectFieldModalVisible(true)}
                  >
                    {comparisonObjectFields.length > 0 ? (
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '4px',
                        marginBottom: '4px'
                      }}>
                        {comparisonObjectFields.map((field) => (
                          <Tag
                            key={field.id}
                            closable
                            color="blue"
                            onClose={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const remainingObjectFields = comparisonObjectFields.filter(f => f.id !== field.id);
                              setComparisonObjectFields(remainingObjectFields);
                              setComparisonFields(comparisonFields.filter(f => f.id !== field.id));
                            }}
                            style={{
                              margin: 0,
                              fontSize: '12px',
                              lineHeight: '20px'
                            }}
                          >
                            {field.fieldName}
                          </Tag>
                        ))}
                      </div>
                    ) : (
                      <div style={{
                        color: '#999',
                        fontSize: '14px',
                        lineHeight: '20px'
                      }}>
                        {selectedComparisonDataset ? '点击选择比对字段' : '请先选择比对数据集'}
                      </div>
                    )}
                    <Button
                      type="primary"
                      size="small"
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)'
                      }}
                      disabled={!selectedComparisonDataset}
                      onClick={(e) => {
                        e.stopPropagation();
                        setComparisonObjectFieldModalVisible(true);
                      }}
                    >
                      选择
                    </Button>
                  </div>
                </Col>
              </Row>
            </Card>

            {/* 卡片2：可用字段 */}
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{
                      width: '3px',
                      height: '16px',
                      backgroundColor: '#52c41a',
                      marginRight: '8px',
                      borderRadius: '2px'
                    }} />
                    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                      可用字段
                    </span>
                    {selectedComparisonDataset && (
                      <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal', marginLeft: '8px' }}>
                        （{selectedComparisonDataset.name}）
                      </span>
                    )}
                  </div>
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    size="small"
                    onClick={() => {
                      setComparisonFieldModalVisible(true);
                    }}
                    disabled={!selectedComparisonDataset}
                  >
                    添加字段
                  </Button>
                </div>
              }
              size="small"
              style={{ marginBottom: '16px' }}
            >
              {!selectedComparisonDataset ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '120px',
                  color: '#999',
                  fontSize: '16px',
                  border: '1px dashed #d9d9d9',
                  borderRadius: '6px'
                }}>
                  请先选择比对数据集
                </div>
              ) : comparisonFields.length === 0 ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '120px',
                  color: '#999',
                  fontSize: '16px',
                  border: '1px dashed #d9d9d9',
                  borderRadius: '6px'
                }}>
                  暂无字段，请点击"添加字段"按钮
                </div>
              ) : (
                <Table
                  dataSource={comparisonFields}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  scroll={{ y: 200 }}
                  columns={[
                    {
                      title: '排序',
                      key: 'sort',
                      width: 40,
                      render: (_, __, index) => (
                        <div
                          style={{ cursor: index > 0 ? 'grab' : 'default', color: index > 0 ? '#666' : '#ccc' }}
                          draggable={index > 0}
                          onDragStart={(e) => {
                            if (index > 0) {
                              e.dataTransfer.setData('text/plain', index.toString());
                            }
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                            const toIndex = index;
                            if (fromIndex !== toIndex && fromIndex > 0) {
                              const newFields = [...comparisonFields];
                              const [movedItem] = newFields.splice(fromIndex, 1);
                              newFields.splice(toIndex, 0, movedItem);
                              setComparisonFields(newFields);
                            }
                          }}
                        >
                          <DragOutlined />
                        </div>
                      )
                    },
                    {
                      title: '显示名称',
                      dataIndex: 'displayName',
                      key: 'displayName',
                      width: 120,
                    },
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
                      width: 120,
                    },
                    {
                      title: '字段类型',
                      dataIndex: 'fieldType',
                      key: 'fieldType',
                      width: 100,
                      render: (type: string) => {
                        const colorMap: { [key: string]: string } = {
                          'string': 'blue',
                          'number': 'green',
                          'date': 'orange'
                        };
                        return <Tag color={colorMap[type] || 'default'}>{type}</Tag>;
                      }
                    },
                    {
                      title: '属性',
                      dataIndex: 'attribute',
                      key: 'attribute',
                      width: 100,
                      render: (attribute: string) => {
                        const colorMap: { [key: string]: string } = {
                          '文本': 'blue',
                          '数值': 'green',
                          '时间': 'orange'
                        };
                        return (
                          <Tag color={colorMap[attribute] || 'default'}>
                            {attribute}
                          </Tag>
                        );
                      }
                    },
                    {
                      title: '组织权限字段',
                      key: 'organizationPermission',
                      width: 100,
                      render: (_, record) => (
                        <Radio
                          checked={organizationPermissionFieldId === record.id}
                          onChange={() => {
                            setOrganizationPermissionFieldId(record.id);
                            message.success(`已将"${record.displayName}"设为组织权限字段`);
                          }}
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
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => {
                            setComparisonFields(comparisonFields.filter(f => f.id !== record.id));
                            setComparisonObjectFields(comparisonObjectFields.filter(f => f.id !== record.id));
                            const newConfigs = new Map(fieldConfigs);
                            newConfigs.delete(record.id);
                            setFieldConfigs(newConfigs);
                            message.success('已删除字段');
                          }}
                          title="删除字段"
                        />
                      ),
                    },
                  ]}
                />
              )}
            </Card>

            {/* 卡片3：查询条件配置 */}
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{
                      width: '3px',
                      height: '16px',
                      backgroundColor: '#52c41a',
                      marginRight: '8px',
                      borderRadius: '2px'
                    }} />
                    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                      查询条件配置
                    </span>
                  </div>
                  <Button
                    type="primary"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setCurrentQueryType('comparison');
                      setEditingQueryCondition(null);
                      setQueryConditionModalVisible(true);
                    }}
                  >
                    新增查询条件
                  </Button>
                </div>
              }
              size="small"
            >
              <Table
                dataSource={queryConditions.comparison}
                columns={[
                  {
                    title: '条件名称',
                    dataIndex: 'name',
                    key: 'name',
                    width: 150,
                  },
                  {
                    title: '组件类型',
                    dataIndex: 'componentType',
                    key: 'componentType',
                    width: 120,
                    render: (type: string) => {
                      const componentTypeMap: { [key: string]: string } = {
                        'input': '输入框',
                        'select': '下拉选择',
                        'multiSelect': '多选下拉',
                        'datePicker': '日期选择',
                        'dateRangePicker': '日期范围',
                        'numberRange': '数值范围'
                      };
                      return componentTypeMap[type] || type;
                    }
                  },
                  {
                    title: '对应字段',
                    dataIndex: 'fieldId',
                    key: 'fieldId',
                    width: 150,
                    render: (fieldId: string) => {
                      const field = comparisonFields.find(f => f.id === fieldId);
                      return field ? field.displayName : fieldId;
                    }
                  },
                  {
                    title: '是否必填',
                    dataIndex: 'required',
                    key: 'required',
                    width: 80,
                    render: (required: boolean) => (
                      <Tag color={required ? 'red' : 'green'}>
                        {required ? '是' : '否'}
                      </Tag>
                    )
                  },
                  {
                    title: '操作',
                    key: 'action',
                    width: 120,
                    render: (_, record) => (
                      <Space size="small">
                        <Button
                          type="text"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => {
                            setEditingQueryCondition(record);
                            setQueryConditionModalVisible(true);
                          }}
                          title="编辑"
                        />
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => {
                            const newConditions = queryConditions.comparison.filter(c => c.id !== record.id);
                            setQueryConditions(prev => ({ ...prev, comparison: newConditions }));
                            message.success('查询条件已删除');
                          }}
                          title="删除"
                        />
                      </Space>
                    )
                  }
                ]}
                size="small"
                pagination={false}
                locale={{ emptyText: '暂无查询条件，点击"新增查询条件"按钮添加' }}
              />
            </Card>
          </div>

          {/* 基准数据集设置 - 动态多卡片布局 */}
          <div style={{
            backgroundColor: '#fafafa',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '24px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: '4px',
                  height: '20px',
                  backgroundColor: '#fa8c16',
                  marginRight: '12px',
                  borderRadius: '2px'
                }} />
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
                  基准数据集设置
                </span>
              </div>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setBaselineDatasetModalVisible(true)}
              >
                添加基准数据集
              </Button>
            </div>

            {selectedBaselineDatasets.length === 0 ? (
              <Card style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                暂无基准数据集，点击"添加基准数据集"按钮添加
              </Card>
            ) : (
              selectedBaselineDatasets.map((dataset, index) => (
                <div key={dataset.id} style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
                  marginBottom: '16px',
                  overflow: 'hidden'
                }}>
                  {/* 基准数据集标题 */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    backgroundColor: '#fff7e6',
                    borderBottom: '1px solid #ffd591'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{
                        width: '3px',
                        height: '16px',
                        backgroundColor: '#fa8c16',
                        marginRight: '8px',
                        borderRadius: '2px'
                      }} />
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#d46b08' }}>
                        {dataset.name}
                      </span>
                    </div>
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => {
                        const newDatasets = selectedBaselineDatasets.filter(d => d.id !== dataset.id);
                        setSelectedBaselineDatasets(newDatasets);
                        if (currentBaselineDataset === dataset.id) {
                          setCurrentBaselineDataset('');
                        }
                        message.success('基准数据集已删除');
                      }}
                      title="删除数据集"
                    />
                  </div>

                  {/* 子卡片1：数据集基本信息 */}
                  <div style={{
                    padding: '16px',
                    borderBottom: '1px solid #f0f0f0'
                  }}>
                    <Row gutter={16}>
                      <Col span={12}>
                        <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                          连接类型
                        </div>
                        <Dropdown
                          menu={{
                            items: [
                              {
                                key: 'INNER',
                                label: (
                                  <div>
                                    <div style={{ fontWeight: 'bold' }}>INNER JOIN</div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>内连接</div>
                                  </div>
                                ),
                                onClick: () => {
                                  const updatedDatasets: BaselineDatasetItem[] = selectedBaselineDatasets.map(d =>
                                    d.id === dataset.id
                                      ? { ...d, joinType: 'INNER JOIN' }
                                      : d
                                  );
                                  setSelectedBaselineDatasets(updatedDatasets);
                                  message.success('连接类型已更新为 INNER JOIN');
                                }
                              },
                              {
                                key: 'LEFT',
                                label: (
                                  <div>
                                    <div style={{ fontWeight: 'bold' }}>LEFT JOIN</div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>左连接</div>
                                  </div>
                                ),
                                onClick: () => {
                                  const updatedDatasets: BaselineDatasetItem[] = selectedBaselineDatasets.map(d =>
                                    d.id === dataset.id
                                      ? { ...d, joinType: 'LEFT JOIN' }
                                      : d
                                  );
                                  setSelectedBaselineDatasets(updatedDatasets);
                                  message.success('连接类型已更新为 LEFT JOIN');
                                }
                              },
                              {
                                key: 'RIGHT',
                                label: (
                                  <div>
                                    <div style={{ fontWeight: 'bold' }}>RIGHT JOIN</div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>右连接</div>
                                  </div>
                                ),
                                onClick: () => {
                                  const updatedDatasets: BaselineDatasetItem[] = selectedBaselineDatasets.map(d =>
                                    d.id === dataset.id
                                      ? { ...d, joinType: 'RIGHT JOIN' }
                                      : d
                                  );
                                  setSelectedBaselineDatasets(updatedDatasets);
                                  message.success('连接类型已更新为 RIGHT JOIN');
                                }
                              }
                            ]
                          }}
                          trigger={['click']}
                        >
                          <Tag
                            color={
                              dataset.joinType === 'LEFT JOIN' ? 'blue' :
                              dataset.joinType === 'RIGHT JOIN' ? 'orange' : 'green'
                            }
                            style={{ cursor: 'pointer' }}
                          >
                            {dataset.joinType || 'INNER JOIN'} <DownOutlined style={{ fontSize: '10px' }} />
                          </Tag>
                        </Dropdown>
                      </Col>
                      <Col span={12}>
                        {/* 可以在这里添加其他数据集信息，如记录数等 */}
                      </Col>
                    </Row>
                  </div>

                  {/* 子卡片2：可用字段 */}
                  <div style={{
                    padding: '16px',
                    borderBottom: '1px solid #f0f0f0'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{
                          width: '3px',
                          height: '16px',
                          backgroundColor: '#fa8c16',
                          marginRight: '8px',
                          borderRadius: '2px'
                        }} />
                        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                          可用字段
                        </span>
                      </div>
                      <Button
                        type="dashed"
                        icon={<PlusOutlined />}
                        size="small"
                        onClick={() => {
                          setCurrentBaselineDataset(dataset.id);
                          setBaselineFieldModalVisible(true);
                        }}
                      >
                        添加字段
                      </Button>
                    </div>
                    {baselineDatasetFields.length === 0 ? (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '120px',
                        color: '#999',
                        fontSize: '16px',
                        border: '1px dashed #d9d9d9',
                        borderRadius: '6px'
                      }}>
                        暂无字段，请点击"添加字段"按钮
                      </div>
                    ) : (
                      <Table
                        dataSource={baselineDatasetFields}
                        rowKey="id"
                        size="small"
                        pagination={false}
                        scroll={{ y: 150 }}
                        columns={[
                          {
                            title: '排序',
                            key: 'sort',
                            width: 40,
                            render: (_, __, index) => (
                              <div
                                style={{ cursor: index > 0 ? 'grab' : 'default', color: index > 0 ? '#666' : '#ccc' }}
                                draggable={index > 0}
                                onDragStart={(e) => {
                                  if (index > 0) {
                                    e.dataTransfer.setData('text/plain', index.toString());
                                  }
                                }}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                                  const toIndex = index;
                                  if (fromIndex !== toIndex && fromIndex > 0) {
                                    const newFields = [...baselineDatasetFields];
                                    const [movedItem] = newFields.splice(fromIndex, 1);
                                    newFields.splice(toIndex, 0, movedItem);
                                    setBaselineDatasetFields(newFields);
                                  }
                                }}
                              >
                                <DragOutlined />
                              </div>
                            )
                          },
                          {
                            title: '显示名称',
                            dataIndex: 'displayName',
                            key: 'displayName',
                            width: 120,
                          },
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
                            width: 120,
                          },
                          {
                            title: '字段类型',
                            dataIndex: 'fieldType',
                            key: 'fieldType',
                            width: 100,
                            render: (type: string) => {
                              const colorMap: { [key: string]: string } = {
                                'string': 'blue',
                                'number': 'green',
                                'date': 'orange'
                              };
                              return <Tag color={colorMap[type] || 'default'}>{type}</Tag>;
                            }
                          },
                          {
                            title: '属性',
                            dataIndex: 'attribute',
                            key: 'attribute',
                            width: 100,
                            render: (attribute: string) => {
                              const colorMap: { [key: string]: string } = {
                                '文本': 'blue',
                                '数值': 'green',
                                '时间': 'orange'
                              };
                              return (
                                <Tag color={colorMap[attribute] || 'default'}>
                                  {attribute}
                                </Tag>
                              );
                            }
                          },
                          {
                            title: '组织权限字段',
                            key: 'organizationPermission',
                            width: 100,
                            render: (_, record) => (
                              <Radio
                                checked={baselineOrganizationPermissionFieldId === record.id}
                                onChange={() => {
                                  setBaselineOrganizationPermissionFieldId(record.id);
                                  message.success(`已将"${record.fieldName}"设为组织权限字段`);
                                }}
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
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => {
                                  setBaselineDatasetFields(baselineDatasetFields.filter(f => f.id !== record.id));
                                  message.success('已删除字段');
                                }}
                              />
                            ),
                          },
                        ]}
                      />
                    )}
                  </div>

                  {/* 子卡片3：查询条件配置 */}
                  <div style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{
                          width: '3px',
                          height: '16px',
                          backgroundColor: '#fa8c16',
                          marginRight: '8px',
                          borderRadius: '2px'
                        }} />
                        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                          查询条件配置
                        </span>
                      </div>
                      <Button
                        type="primary"
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => {
                          setCurrentQueryType('baseline');
                          setCurrentDatasetId(dataset.id);
                          setEditingQueryCondition(null);
                          setQueryConditionModalVisible(true);
                        }}
                      >
                        新增查询条件
                      </Button>
                    </div>
                    <Table
                      dataSource={queryConditions.baseline[dataset.id] || []}
                      columns={[
                        {
                          title: '条件名称',
                          dataIndex: 'name',
                          key: 'name',
                          width: 150,
                        },
                        {
                          title: '组件类型',
                          dataIndex: 'componentType',
                          key: 'componentType',
                          width: 120,
                          render: (type: string) => {
                            const componentTypeMap: { [key: string]: string } = {
                              'input': '输入框',
                              'select': '下拉选择',
                              'multiSelect': '多选下拉',
                              'datePicker': '日期选择',
                              'dateRangePicker': '日期范围',
                              'numberRange': '数值范围'
                            };
                            return componentTypeMap[type] || type;
                          }
                        },
                        {
                          title: '对应字段',
                          dataIndex: 'fieldId',
                          key: 'fieldId',
                          width: 150,
                          render: (fieldId: string) => {
                            const field = baselineDatasetFields.find(f => f.id === fieldId);
                            return field ? field.displayName : fieldId;
                          }
                        },
                        {
                          title: '是否必填',
                          dataIndex: 'required',
                          key: 'required',
                          width: 80,
                          render: (required: boolean) => (
                            <Tag color={required ? 'red' : 'green'}>
                              {required ? '是' : '否'}
                            </Tag>
                          )
                        },
                        {
                          title: '操作',
                          key: 'action',
                          width: 120,
                          render: (_, record) => (
                            <Space size="small">
                              <Button
                                type="text"
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => {
                                  setEditingQueryCondition(record);
                                  setCurrentDatasetId(dataset.id);
                                  setQueryConditionModalVisible(true);
                                }}
                                title="编辑"
                              />
                              <Button
                                type="text"
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => {
                                  const currentConditions = queryConditions.baseline[dataset.id] || [];
                                  const newConditions = currentConditions.filter(c => c.id !== record.id);
                                  setQueryConditions(prev => ({
                                    ...prev,
                                    baseline: { ...prev.baseline, [dataset.id]: newConditions }
                                  }));
                                  message.success('查询条件已删除');
                                }}
                                title="删除"
                              />
                            </Space>
                          )
                        }
                      ]}
                      size="small"
                      pagination={false}
                      locale={{ emptyText: '暂无查询条件，点击"新增查询条件"按钮添加' }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </Form>
      </Card>

      {/* 所有弹窗组件 */}
      {/* 比对数据集选择弹框 */}
      <Modal
        title="选择比对数据集"
        open={comparisonDatasetModalVisible}
        onCancel={() => {
          setComparisonDatasetModalVisible(false);
          setSelectedDatasetId('');
        }}
        onOk={() => {
          const selectedDataset = mockDatasets.find(d => d.id === selectedDatasetId);
          if (selectedDataset) {
            setSelectedComparisonDataset({ id: selectedDataset.id, name: selectedDataset.name });
            setComparisonFields([]);
            message.success(`已选择数据集：${selectedDataset.name}`);
          } else {
            message.warning('请选择一个数据集');
            return;
          }
          setComparisonDatasetModalVisible(false);
          setSelectedDatasetId('');
        }}
        width={800}
      >
        <Table
          rowSelection={{
            type: 'radio',
            selectedRowKeys: selectedDatasetId ? [selectedDatasetId] : [],
            onChange: (selectedRowKeys) => {
              setSelectedDatasetId(selectedRowKeys[0] as string || '');
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
          ]}
          dataSource={mockDatasets}
          rowKey="id"
          size="small"
          scroll={{ y: 300 }}
        />
      </Modal>

      {/* 基准数据集选择弹框 */}
      <Modal
        title="选择基准数据集"
        open={baselineDatasetModalVisible}
        onCancel={() => setBaselineDatasetModalVisible(false)}
        onOk={() => {
          setBaselineDatasetModalVisible(false);
          message.success(`已选择 ${selectedBaselineDatasets.length} 个数据集`);
        }}
        width={800}
      >
        <Table
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys: selectedBaselineDatasets.map(d => d.id),
            onChange: (selectedRowKeys, selectedRows) => {
              const datasetsWithJoinType: BaselineDatasetItem[] = selectedRows.map((row: any) => ({
                ...row,
                joinType: 'INNER JOIN' as BaselineDatasetItem['joinType']
              }));
              setSelectedBaselineDatasets(datasetsWithJoinType);
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
          ]}
          dataSource={mockDatasets}
          rowKey="id"
          size="small"
          scroll={{ y: 300 }}
        />
      </Modal>

      {/* 比对数据集字段选择弹框 */}
      <Modal
        title="选择可用字段"
        open={comparisonObjectFieldModalVisible}
        onCancel={() => {
          setComparisonObjectFieldModalVisible(false);
          setSelectedComparisonObjectFields([]);
        }}
        onOk={() => {
          const selectedFields = mockDatasetFields.filter(f => selectedComparisonObjectFields.includes(f.id));
          const newObjectFields = selectedFields.filter(f => !comparisonObjectFields.some(existing => existing.id === f.id));
          if (newObjectFields.length > 0) {
            setComparisonObjectFields([...comparisonObjectFields, ...newObjectFields]);
          }
          if (selectedFields.length > 0) {
            const selectedIdSet = new Set(selectedFields.map(f => f.id));
            const others = comparisonFields.filter(f => !selectedIdSet.has(f.id));
            const newFieldsToAdd = selectedFields.filter(f => !comparisonFields.some(existing => existing.id === f.id));
            setComparisonFields([...newFieldsToAdd, ...others]);
            message.success(`已添加 ${selectedFields.length} 个字段到比对数据集和可用字段`);
          }
          setComparisonObjectFieldModalVisible(false);
          setSelectedComparisonObjectFields([]);
        }}
        width={800}
      >
        <Table
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys: selectedComparisonObjectFields,
            onChange: (selectedRowKeys) => {
              setSelectedComparisonObjectFields(selectedRowKeys as string[]);
            },
          }}
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
              width: 120,
            },
            {
              title: '字段类型',
              dataIndex: 'fieldType',
              key: 'fieldType',
              width: 100,
              render: (type: string) => {
                const colorMap: { [key: string]: string } = {
                  'string': 'blue',
                  'number': 'green',
                  'date': 'orange'
                };
                return <Tag color={colorMap[type] || 'default'}>{type}</Tag>;
              }
            },
            {
              title: '显示名称',
              dataIndex: 'displayName',
              key: 'displayName',
              width: 120,
            },
            {
              title: '属性',
              dataIndex: 'attribute',
              key: 'attribute',
              width: 80,
              render: (attribute: string) => {
                const colorMap: { [key: string]: string } = {
                  '文本': 'blue',
                  '数值': 'green',
                  '时间': 'orange'
                };
                return (
                  <Tag color={colorMap[attribute] || 'default'}>
                    {attribute}
                  </Tag>
                );
              }
            }
          ]}
          dataSource={mockDatasetFields}
          rowKey="id"
          size="small"
          scroll={{ y: 300 }}
        />
      </Modal>

      {/* 比对字段添加弹框 */}
      <Modal
        title="添加可用字段"
        open={comparisonFieldModalVisible}
        onCancel={() => setComparisonFieldModalVisible(false)}
        onOk={() => {
          const newFields = mockDatasetFields.filter(field =>
            selectedComparisonFields.includes(field.id) &&
            !comparisonFields.some(existing => existing.id === field.id)
          );
          if (newFields.length > 0) {
            setComparisonFields([...comparisonFields, ...newFields]);
            message.success(`已添加 ${newFields.length} 个字段`);
          }
          setComparisonFieldModalVisible(false);
          setSelectedComparisonFields([]);
        }}
        width={800}
      >
        <Table
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys: selectedComparisonFields,
            onChange: (selectedRowKeys) => {
              setSelectedComparisonFields(selectedRowKeys as string[]);
            },
          }}
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
              width: 120,
            },
            {
              title: '字段类型',
              dataIndex: 'fieldType',
              key: 'fieldType',
              width: 100,
              render: (type: string) => {
                const colorMap: { [key: string]: string } = {
                  'string': 'blue',
                  'number': 'green',
                  'date': 'orange'
                };
                return <Tag color={colorMap[type] || 'default'}>{type}</Tag>;
              }
            },
            {
              title: '显示名称',
              dataIndex: 'displayName',
              key: 'displayName',
              width: 120,
            },
            {
              title: '属性',
              dataIndex: 'attribute',
              key: 'attribute',
              width: 80,
              render: (attribute: string) => {
                const colorMap: { [key: string]: string } = {
                  '文本': 'blue',
                  '数值': 'green',
                  '时间': 'orange'
                };
                return (
                  <Tag color={colorMap[attribute] || 'default'}>
                    {attribute}
                  </Tag>
                );
              }
            }
          ]}
          dataSource={mockDatasetFields}
          rowKey="id"
          size="small"
          scroll={{ y: 300 }}
        />
      </Modal>

      {/* 基准字段添加弹框 */}
      <Modal
        title="添加可用字段"
        open={baselineFieldModalVisible}
        onCancel={() => setBaselineFieldModalVisible(false)}
        onOk={() => {
          const newFields = mockDatasetFields.filter(field =>
            selectedBaselineFields.includes(field.id) &&
            !baselineDatasetFields.some(existing => existing.id === field.id)
          );
          if (newFields.length > 0) {
            setBaselineDatasetFields([...baselineDatasetFields, ...newFields]);
            message.success(`已添加 ${newFields.length} 个字段`);
          }
          setBaselineFieldModalVisible(false);
          setSelectedBaselineFields([]);
        }}
        width={800}
      >
        <Table
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys: selectedBaselineFields,
            onChange: (selectedRowKeys) => {
              setSelectedBaselineFields(selectedRowKeys as string[]);
            },
          }}
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
              width: 120,
            },
            {
              title: '字段类型',
              dataIndex: 'fieldType',
              key: 'fieldType',
              width: 100,
              render: (type: string) => {
                const colorMap: { [key: string]: string } = {
                  'string': 'blue',
                  'number': 'green',
                  'date': 'orange'
                };
                return <Tag color={colorMap[type] || 'default'}>{type}</Tag>;
              }
            },
            {
              title: '显示名称',
              dataIndex: 'displayName',
              key: 'displayName',
              width: 120,
            },
            {
              title: '属性',
              dataIndex: 'attribute',
              key: 'attribute',
              width: 80,
              render: (attribute: string) => {
                const colorMap: { [key: string]: string } = {
                  '文本': 'blue',
                  '数值': 'green',
                  '时间': 'orange'
                };
                return (
                  <Tag color={colorMap[attribute] || 'default'}>
                    {attribute}
                  </Tag>
                );
              }
            }
          ]}
          dataSource={mockDatasetFields}
          rowKey="id"
          size="small"
          scroll={{ y: 300 }}
        />
      </Modal>

      {/* 查询条件配置弹窗 */}
      <Modal
        title={editingQueryCondition ? "编辑查询条件" : "新增查询条件"}
        open={queryConditionModalVisible}
        onCancel={() => {
          setQueryConditionModalVisible(false);
          setEditingQueryCondition(null);
        }}
        onOk={async () => {
          try {
            const form = document.querySelector('#queryConditionForm') as HTMLFormElement;
            if (!form) return;

            const formData = new FormData(form);
            const conditionData: QueryCondition = {
              id: editingQueryCondition?.id || `query_${Date.now()}`,
              name: formData.get('name') as string,
              componentType: formData.get('componentType') as string,
              fieldId: formData.get('fieldId') as string,
              remark: formData.get('remark') as string,
              required: formData.get('required') === 'on'
            };

            if (!conditionData.name || !conditionData.componentType || !conditionData.fieldId) {
              message.error('请填写所有必填字段');
              return;
            }

            if (currentQueryType === 'comparison') {
              const newConditions = editingQueryCondition
                ? queryConditions.comparison.map(c => c.id === editingQueryCondition.id ? conditionData : c)
                : [...queryConditions.comparison, conditionData];
              setQueryConditions(prev => ({ ...prev, comparison: newConditions }));
            } else {
              const currentBaselineConditions = queryConditions.baseline[currentDatasetId] || [];
              const newConditions = editingQueryCondition
                ? currentBaselineConditions.map(c => c.id === editingQueryCondition.id ? conditionData : c)
                : [...currentBaselineConditions, conditionData];
              setQueryConditions(prev => ({
                ...prev,
                baseline: { ...prev.baseline, [currentDatasetId]: newConditions }
              }));
            }

            message.success(editingQueryCondition ? '查询条件更新成功' : '查询条件添加成功');
            setQueryConditionModalVisible(false);
            setEditingQueryCondition(null);
          } catch (error) {
            console.error('保存查询条件失败:', error);
            message.error('保存失败，请重试');
          }
        }}
        width={600}
      >
        <form id="queryConditionForm" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
              条件名称 <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              name="name"
              type="text"
              placeholder="请输入条件名称"
              defaultValue={editingQueryCondition?.name}
              style={{ width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '6px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
              组件类型 <span style={{ color: 'red' }}>*</span>
            </label>
            <select
              name="componentType"
              defaultValue={editingQueryCondition?.componentType || ''}
              style={{ width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '6px' }}
            >
              <option value="">请选择组件类型</option>
              <option value="input">输入框</option>
              <option value="select">下拉选择</option>
              <option value="multiSelect">多选下拉</option>
              <option value="datePicker">日期选择</option>
              <option value="dateRangePicker">日期范围</option>
              <option value="numberRange">数值范围</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
              对应字段 <span style={{ color: 'red' }}>*</span>
            </label>
            <select
              name="fieldId"
              defaultValue={editingQueryCondition?.fieldId || ''}
              style={{ width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '6px' }}
            >
              <option value="">请选择对应字段</option>
              {(currentQueryType === 'comparison' ? comparisonFields : baselineDatasetFields).map(field => (
                <option key={field.id} value={field.id}>
                  {field.displayName} ({field.fieldName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
              备注
            </label>
            <textarea
              name="remark"
              placeholder="可选的备注说明"
              defaultValue={editingQueryCondition?.remark || ''}
              rows={2}
              style={{ width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '6px', resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
              <input
                type="checkbox"
                name="required"
                defaultChecked={editingQueryCondition?.required || false}
                style={{ marginRight: '8px' }}
              />
              是否必填
            </label>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default ComparisonModelManagementV2;