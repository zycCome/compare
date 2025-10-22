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
  Badge
} from 'antd';
import { DragOutlined, DownOutlined } from '@ant-design/icons';
import {
  PlusOutlined,
  SaveOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  CloseOutlined,
  LinkOutlined
} from '@ant-design/icons';
import FieldMetadataConfigDialog, { FieldMetadataConfig } from '../components/FieldMetadataConfigDialog';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;


/**
 * 比对模型管理组件
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

const ComparisonModelManagement: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 模块展开收缩状态
  const [activeKey, setActiveKey] = useState<string[]>(['1', '2', '3']);
  
  // 基本信息相关状态
  const [tags, setTags] = useState<string[]>([]);
  const [inputTag, setInputTag] = useState('');
  
  // 新增：数据连接相关状态
  const [selectedDataConnection, setSelectedDataConnection] = useState<string>('');
    // 比对数据集相关状态
  const [selectedComparisonDataset, setSelectedComparisonDataset] = useState<{id: string; name: string} | null>(null);
    // 字段标记管理 - 比对数据集区域
  const [comparisonFieldTags, setComparisonFieldTags] = useState<Map<string, string[]>>(new Map());
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
  // 字段标记管理 - 基准数据集区域
  const [baselineFieldTags, setBaselineFieldTags] = useState<Map<string, string[]>>(new Map());

  // 标签使用说明弹窗
  const [tagUsageModalVisible, setTagUsageModalVisible] = useState(false);
  const [tagUsageContent, setTagUsageContent] = useState<{title: string, content: string}>({title: '', content: ''});

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

  const mockComparisonObjects = [
    { id: 'supplier', name: '供应商', description: '按供应商维度进行比价分析' },
    { id: 'product', name: '产品', description: '按产品维度进行比价分析' },
    { id: 'category', name: '品类', description: '按品类维度进行比价分析' },
    { id: 'brand', name: '品牌', description: '按品牌维度进行比价分析' }
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
   * 添加快捷标签
   */
  const handleQuickTag = (quickTag: string) => {
    if (!tags.includes(quickTag)) {
      setTags([...tags, quickTag]);
    }
  };

  /**
   * 删除标签
   */
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // ===== 字段标记管理函数 =====

  /**
   * 获取标记的颜色
   */
  const getTagColor = (tagType: string): string => {
    const colorMap: { [key: string]: string } = {
      'organizationPermission': 'orange',
      'sensitive': 'red',
      'primaryKey': 'blue',
      'required': 'green'
    };
    return colorMap[tagType] || 'default';
  };

  /**
   * 获取标记的显示名称
   */
  const getTagDisplayName = (tagType: string): string => {
    const nameMap: { [key: string]: string } = {
      'organizationPermission': '组织权限',
      'sensitive': '敏感字段',
      'primaryKey': '主键',
      'required': '必填'
    };
    return nameMap[tagType] || tagType;
  };

  /**
   * 显示标签使用说明弹窗
   */
  const handleShowTagUsageDialog = (type: string) => {
    const content = getTagUsageContent(type);
    setTagUsageContent(content);
    setTagUsageModalVisible(true);
  };

  /**
   * 获取标签使用说明内容
   */
  const getTagUsageContent = (type: string): {title: string, content: string} => {
    if (type === '字段') {
      return {
        title: '字段说明',
        content: '字段是数据表中的列，定义了数据的类型和属性。字段编码用于程序识别，字段名称用于显示。'
      };
    } else if (type === '所有标记') {
      return {
        title: '标记使用说明',
        content: `
          <div style="line-height: 1.8;">
            <div style="margin-bottom: 12px;">
              <strong>组织权限</strong>（橙色）：
              <div style="margin-left: 16px; color: #666;">用于标识需要根据组织架构进行权限控制的字段，如部门、区域等。</div>
            </div>
            <div style="margin-bottom: 12px;">
              <strong>敏感字段</strong>（红色）：
              <div style="margin-left: 16px; color: #666;">用于标识包含敏感信息的字段，如价格、成本、个人隐私信息等。</div>
            </div>
            <div style="margin-bottom: 12px;">
              <strong>主键</strong>（蓝色）：
              <div style="margin-left: 16px; color: #666;">用于标识数据表的主键字段，确保数据记录的唯一性。</div>
            </div>
            <div>
              <strong>必填</strong>（绿色）：
              <div style="margin-left: 16px; color: #666;">用于标识必填字段，在数据录入时必须提供有效值。</div>
            </div>
          </div>
        `
      };
    }
    return { title: '', content: '' };
  };

  /**
   * 检查字段是否有指定标记
   */
  const hasFieldTag = (fieldId: string, tagType: string, area: 'comparison' | 'baseline'): boolean => {
    const tags = area === 'comparison' ? comparisonFieldTags : baselineFieldTags;
    return tags.get(fieldId)?.includes(tagType) || false;
  };

  /**
   * 获取字段的所有标记
   */
  const getFieldTags = (fieldId: string, area: 'comparison' | 'baseline'): string[] => {
    const tags = area === 'comparison' ? comparisonFieldTags : baselineFieldTags;
    return tags.get(fieldId) || [];
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
              比对模型管理
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
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
                基本信息
              </span>
              <span style={{ 
                fontSize: '12px', 
                color: '#999',
                transform: activeKey.includes('1') ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
                marginLeft: '8px'
              }}>
                ▶
              </span>
            </div>

            {/* 模块内容 */}
            {activeKey.includes('1') && (
              <div style={{ padding: '20px' }}>
                {/* 第一行：模型编码、模型名称、版本 */}
                <Row gutter={24} style={{ marginBottom: '16px' }}>
                  <Col span={8}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{
                        width: '100px',
                        textAlign: 'right',
                        marginRight: '12px',
                        fontSize: '14px'
                      }}>
                        模型编码：
                      </span>
                      <Form.Item
                        name="modelCode"
                        style={{ flex: 1, margin: 0 }}
                        rules={[{ required: true, message: '请输入模型编码' }]}
                      >
                        <Input placeholder="请输入模型编码" />
                      </Form.Item>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{
                        width: '100px',
                        textAlign: 'right',
                        marginRight: '12px',
                        fontSize: '14px'
                      }}>
                        模型名称：
                      </span>
                      <Form.Item
                        name="modelName"
                        style={{ flex: 1, margin: 0 }}
                        rules={[{ required: true, message: '请输入模型名称' }]}
                      >
                        <Input placeholder="请输入模型名称" />
                      </Form.Item>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{
                        width: '100px',
                        textAlign: 'right',
                        marginRight: '12px',
                        fontSize: '14px'
                      }}>
                        版本描述：
                      </span>
                      <Form.Item
                        name="version"
                        style={{ flex: 1, margin: 0 }}
                        initialValue="V1"
                      >
                        <Input placeholder="请输入版本描述" />
                      </Form.Item>
                    </div>
                  </Col>
                </Row>

                {/* 第二行：数据连接 */}
                <Row style={{ marginBottom: '16px' }}>
                  <Col span={24}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{
                        width: '100px',
                        textAlign: 'right',
                        marginRight: '12px',
                        fontSize: '14px'
                      }}>
                        数据连接：
                      </span>
                      <Form.Item
                        name="dataConnection"
                        style={{ flex: 1, margin: 0, maxWidth: '300px' }}
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
                    </div>
                  </Col>
                </Row>

                {/* 第三行：模型描述 */}
                <Row style={{ marginBottom: '16px' }}>
                  <Col span={24}>
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                      <span style={{ 
                        width: '100px', 
                        textAlign: 'right', 
                        marginRight: '12px',
                        fontSize: '14px',
                        paddingTop: '6px'
                      }}>
                        模型描述：
                      </span>
                      <Form.Item 
                        name="modelDescription" 
                        style={{ flex: 1, margin: 0 }}
                      >
                        <TextArea 
                          placeholder="请输入模型描述" 
                          rows={3}
                        />
                      </Form.Item>
                    </div>
                  </Col>
                </Row>

                {/* 第四行：标签 */}
                <Row>
                  <Col span={24}>
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                      <span style={{ 
                        width: '100px', 
                        textAlign: 'right', 
                        marginRight: '12px',
                        fontSize: '14px',
                        paddingTop: '6px'
                      }}>
                        模型分类：
                      </span>
                      <div style={{ flex: 1 }}>
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
                            style={{ marginRight: '8px' }}
                          >
                            添加标签
                          </Button>
                          <Button
                            type="primary"
                            ghost
                            onClick={() => handleQuickTag('同产品比对')}
                            size="small"
                          >
                            同产品比对
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>

                {/* 第五行：分析主题 - 已隐藏 */}
                {/* <Row>
                  <Col span={24}>
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                      <span style={{
                        width: '100px',
                        textAlign: 'right',
                        marginRight: '12px',
                        fontSize: '14px',
                        paddingTop: '6px'
                      }}>
                        分析主题：
                      </span>
                      <div style={{ flex: 1 }}>
                        {analysisSubjects.length > 0 ? (
                          <div>
                            {analysisSubjects.map((subject, index) => (
                              <Tag
                                key={index}
                                color="blue"
                                style={{ marginBottom: '4px', marginRight: '8px' }}
                              >
                                {subject}
                              </Tag>
                            ))}
                          </div>
                        ) : (
                          <Text type="secondary" style={{ fontSize: '14px' }}>
                            请先选择数据连接，分析主题将根据比对数据集和基准数据集自动生成
                          </Text>
                        )}
                      </div>
                    </div>
                  </Col>
                </Row> */}
              </div>
            )}
          </div>

          {/* 比对数据集模块 */}
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
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
                比对数据集设置
              </span>
              <span style={{ 
                fontSize: '12px', 
                color: '#999',
                transform: activeKey.includes('2') ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
                marginLeft: '8px'
              }}>
                ▶
              </span>
            </div>

            {/* 模块内容 */}
            {activeKey.includes('2') && (
              <div style={{ padding: '20px' }}>
                {/* 比对数据集字段 - 左右布局（与基准数据集一致：8/16 列、卡片样式） */}
                <Row gutter={16}>
                  {/* 左侧：比对数据集字段 */}
                  <Col span={8}>
                    <div style={{
                      border: '1px solid #f0f0f0',
                      borderRadius: '4px',
                      padding: '12px',
                      minHeight: '300px'
                    }}>
                      {/* 比对数据集选择 */}
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: 'bold',
                          color: '#333',
                          marginBottom: '8px'
                        }}>
                          比对数据集
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <Input
                            value={selectedComparisonDataset?.name || ''}
                            placeholder="请选择比对数据集"
                            readOnly
                            style={{ flex: 1, cursor: 'pointer' }}
                            onClick={() => setComparisonDatasetModalVisible(true)}
                          />
                          <Button 
                            type="primary" 
                            size="small"
                            style={{ marginLeft: '8px' }}
                            onClick={() => setComparisonDatasetModalVisible(true)}
                          >
                            选择
                          </Button>
                        </div>
                      </div>

                      {/* 比对字段配置 */}
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: 'bold',
                          color: '#333',
                          marginBottom: '8px'
                        }}>
                          比对数据集字段
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
                                    // 从比对数据集字段与数据集字段同时删除
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
                      </div>

                    </div>
                  </Col>

                  {/* 右侧：可用字段和查询条件配置 */}
                  <Col span={16}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {/* 可用字段卡片 */}
                      <Card
                        title={
                          <div style={{
                            fontSize: '14px',
                            fontWeight: 'bold',
                            color: '#333'
                          }}>
                            可用字段
                            {selectedComparisonDataset && (
                              <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}>
                                （{selectedComparisonDataset.name}）
                              </span>
                            )}
                          </div>
                        }
                        size="small"
                        style={{ minHeight: '280px' }}
                      >

                      {!selectedComparisonDataset ? (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '320px',
                          color: '#999',
                          fontSize: '16px'
                        }}>
                          请先选择比对数据集
                        </div>
                      ) : (
                        <div style={{
                          border: '1px solid #d9d9d9',
                          borderRadius: '6px',
                          padding: '16px',
                          minHeight: '320px',
                          backgroundColor: '#fafafa'
                        }}>
                          <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={() => {
                              setComparisonFieldModalVisible(true);
                            }}
                            disabled={!selectedComparisonDataset}
                          >
                            添加可用字段
                          </Button>

                          {comparisonFields.length > 0 && (
                            <div style={{ marginTop: '16px' }}>
                              <Table
                                dataSource={comparisonFields}
                                rowKey="id"
                                size="small"
                                pagination={false}
                                scroll={{ y: 280 }}
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
                                    render: (text: string) => (
                                      <div>{text}</div>
                                    )
                                  },
                                  {
                                    title: '字段编码',
                                    dataIndex: 'fieldCode',
                                    key: 'fieldCode',
                                    width: 120,
                                  },
                                  {
                                    title: (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        字段名称
                                        <InfoCircleOutlined
                                          style={{ color: '#999', cursor: 'pointer' }}
                                          onClick={() => handleShowTagUsageDialog('字段')}
                                        />
                                      </div>
                                    ),
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
                                    title: (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        字段标记
                                        <InfoCircleOutlined
                                          style={{ color: '#999', cursor: 'pointer' }}
                                          onClick={() => handleShowTagUsageDialog('所有标记')}
                                        />
                                      </div>
                                    ),
                                    key: 'fieldTags',
                                    width: 150,
                                    render: (_, record) => {
                                      const fieldTags = getFieldTags(record.id, 'comparison');

                                      // 可选的标记选项
                                      const availableTags = [
                                        { key: 'organizationPermission', label: '组织权限', color: 'orange' },
                                        { key: 'sensitive', label: '敏感字段', color: 'red' },
                                        { key: 'primaryKey', label: '主键', color: 'blue' },
                                        { key: 'required', label: '必填', color: 'green' }
                                      ];

                                      // 过滤出未选中的标记
                                      const availableToAdd = availableTags.filter(tag => !fieldTags.includes(tag.key));

                                      if (fieldTags.length === 0) {
                                        return (
                                          <Dropdown
                                            menu={{
                                              items: availableToAdd.map(tag => ({
                                                key: tag.key,
                                                label: (
                                                  <span>
                                                    <Tag color={tag.color} style={{ marginRight: 8 }}>
                                                      {tag.label}
                                                    </Tag>
                                                  </span>
                                                ),
                                                onClick: () => {
                                                  const selectedTag = tag;
                                                  const newTags = [...fieldTags, selectedTag.key];
                                                  const updatedTags = new Map(comparisonFieldTags);
                                                  updatedTags.set(record.id, newTags);
                                                  setComparisonFieldTags(updatedTags);
                                                  message.success(`已为"${record.displayName}"添加"${selectedTag.label}"标记`);
                                                }
                                              }))
                                            }}
                                            trigger={['click']}
                                          >
                                            <Button
                                              size="small"
                                              icon={<PlusOutlined />}
                                              style={{
                                                borderRadius: '50%',
                                                width: '28px',
                                                height: '28px',
                                                padding: 0,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                              }}
                                              type="dashed"
                                            />
                                          </Dropdown>
                                        );
                                      }

                                      return (
                                        <Space size={4}>
                                          {fieldTags.map(tagType => {
                                            const tag = availableTags.find(t => t.key === tagType);
                                            return (
                                              <Dropdown
                                                key={tagType}
                                                menu={{
                                                  items: [
                                                    {
                                                      key: 'remove',
                                                      label: '移除标记',
                                                      danger: true,
                                                      onClick: () => {
                                                        const newTags = fieldTags.filter(t => t !== tagType);
                                                        const updatedTags = new Map(comparisonFieldTags);
                                                        if (newTags.length > 0) {
                                                          updatedTags.set(record.id, newTags);
                                                        } else {
                                                          updatedTags.delete(record.id);
                                                        }
                                                        setComparisonFieldTags(updatedTags);
                                                        message.success(`已移除"${tag.label}"标记`);
                                                      }
                                                    }
                                                  ]
                                                }}
                                                trigger={['click']}
                                              >
                                                <Tag color={tag.color} style={{ cursor: 'pointer' }}>
                                                  {tag.label}
                                                </Tag>
                                              </Dropdown>
                                            );
                                          })}
                                          {availableToAdd.length > 0 && (
                                            <Dropdown
                                              menu={{
                                                items: availableToAdd.map(tag => ({
                                                  key: tag.key,
                                                  label: (
                                                    <span>
                                                      <Tag color={tag.color} style={{ marginRight: 8 }}>
                                                        {tag.label}
                                                      </Tag>
                                                    </span>
                                                  ),
                                                  onClick: () => {
                                                    const selectedTag = tag;
                                                    const newTags = [...fieldTags, selectedTag.key];
                                                    const updatedTags = new Map(comparisonFieldTags);
                                                    updatedTags.set(record.id, newTags);
                                                    setComparisonFieldTags(updatedTags);
                                                    message.success(`已为"${record.displayName}"添加"${selectedTag.label}"标记`);
                                                  }
                                                }))
                                              }}
                                              trigger={['click']}
                                            >
                                              <Button size="small" type="dashed" icon={<DownOutlined />} />
                                            </Dropdown>
                                          )}
                                        </Space>
                                      );
                                    }
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
                                          // 删除数据集字段时，若该字段是比对数据集字段字段，也同步删除
                                          setComparisonFields(comparisonFields.filter(f => f.id !== record.id));
                                          setComparisonObjectFields(comparisonObjectFields.filter(f => f.id !== record.id));
                                          // 同时删除字段配置
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
                            </div>
                          )}
                        </div>
                        )}
                      </Card>

                      {/* 查询条件配置卡片 */}
                      <Card
                        title={
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                              查询条件配置
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
                        style={{ minHeight: '200px' }}
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
                  </Col>
                </Row>
              </div>
            )}
          </div>

          {/* 基准数据集模块 */}
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
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
                基准数据集设置
              </span>
              <span style={{ 
                fontSize: '12px', 
                color: '#999',
                transform: activeKey.includes('3') ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
                marginLeft: '8px'
              }}>
                ▶
              </span>
            </div>

            {/* 模块内容 */}
            {activeKey.includes('3') && (
              <div style={{ padding: '20px' }}>
                <Row gutter={16}>
                  {/* 左侧：基准数据集 */}
                  <Col span={8}>
                    <div style={{
                      border: '1px solid #f0f0f0',
                      borderRadius: '4px',
                      padding: '12px',
                      height: '450px'
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
                          {currentBaselineDataset && (
                            <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}>
                              （{selectedBaselineDatasets.find(d => d.id === currentBaselineDataset)?.name}）
                            </span>
                          )}
                        </div>
                        <Button 
                          type="primary" 
                          size="small"
                          icon={<PlusOutlined />}
                          onClick={() => setBaselineDatasetModalVisible(true)}
                        >
                          选择数据集
                        </Button>
                      </div>
                      
                      <div style={{
                        maxHeight: '380px',
                        overflow: 'auto'
                      }}>
                        {selectedBaselineDatasets.length === 0 ? (
                          <div style={{
                            textAlign: 'center',
                            color: '#999',
                            padding: '40px 0',
                            fontSize: '14px'
                          }}>
                            暂无基准数据集
                            <br />
                            <span style={{ fontSize: '12px' }}>点击"选择数据集"按钮添加</span>
                          </div>
                        ) : (
                          <Table
                            dataSource={selectedBaselineDatasets}
                            rowKey="id"
                            size="small"
                            pagination={false}
                            scroll={{ y: 350 }}
                            rowClassName={(record) =>
                              currentBaselineDataset === record.id ? 'ant-table-row-selected' : ''
                            }
                            onRow={(record) => ({
                              onClick: () => setCurrentBaselineDataset(record.id),
                              style: {
                                cursor: 'pointer'
                              }
                            })}
                            columns={[
                              {
                                title: '数据集名称',
                                dataIndex: 'name',
                                key: 'name',
                                render: (text: string, record: any) => (
                                  <div style={{ fontWeight: currentBaselineDataset === record.id ? 'bold' : 'normal' }}>
                                    {text}
                                  </div>
                                )
                              },
                              {
                                title: '连接类型',
                                dataIndex: 'joinType',
                                key: 'joinType',
                                width: 160,
                                render: (joinType: BaselineDatasetItem['joinType'], record: BaselineDatasetItem) => (
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
                                            const updatedDatasets: BaselineDatasetItem[] = selectedBaselineDatasets.map(dataset =>
                                              dataset.id === record.id
                                                ? { ...dataset, joinType: 'INNER JOIN' }
                                                : dataset
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
                                            const updatedDatasets: BaselineDatasetItem[] = selectedBaselineDatasets.map(dataset =>
                                              dataset.id === record.id
                                                ? { ...dataset, joinType: 'LEFT JOIN' }
                                                : dataset
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
                                            const updatedDatasets: BaselineDatasetItem[] = selectedBaselineDatasets.map(dataset =>
                                              dataset.id === record.id
                                                ? { ...dataset, joinType: 'RIGHT JOIN' }
                                                : dataset
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
                                        joinType === 'LEFT JOIN' ? 'blue' :
                                        joinType === 'RIGHT JOIN' ? 'orange' : 'green'
                                      }
                                      style={{ cursor: 'pointer' }}
                                    >
                                      {joinType || 'INNER JOIN'} <DownOutlined style={{ fontSize: '10px' }} />
                                    </Tag>
                                  </Dropdown>
                                )
                              },
                              {
                                title: '操作',
                                key: 'action',
                                width: 80,
                                render: (_, record: any) => (
                                  <Button
                                    type="text"
                                    size="small"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const newDatasets = selectedBaselineDatasets.filter(d => d.id !== record.id);
                                      setSelectedBaselineDatasets(newDatasets);
                                      if (currentBaselineDataset === record.id) {
                                        setCurrentBaselineDataset('');
                                      }
                                    }}
                                    title="删除"
                                  />
                                )
                              }
                            ]}
                          />
                        )}
                      </div>
                    </div>
                  </Col>

                  {/* 右侧：数据集字段 */}
                  <Col span={16}>
                    <div style={{
                      border: '1px solid #f0f0f0',
                      borderRadius: '4px',
                      padding: '16px',
                      height: '450px'
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
                          可用字段
                          {currentBaselineDataset && (
                            <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}>
                              （{selectedBaselineDatasets.find(d => d.id === currentBaselineDataset)?.name}）
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {!currentBaselineDataset ? (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '320px',
                          color: '#999',
                          fontSize: '16px'
                        }}>
                          请先选择基准数据集
                        </div>
                      ) : (
                        <div style={{
                          border: '1px solid #d9d9d9',
                          borderRadius: '6px',
                          padding: '16px',
                          minHeight: '320px',
                          backgroundColor: '#fafafa'
                        }}>
                          <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={() => setBaselineFieldModalVisible(true)}
                          >
                            添加可用字段
                          </Button>

                          {/* 字段详细表格 */}
                          {baselineDatasetFields.length > 0 && (
                            <div style={{ marginTop: '16px' }}>
                              <Table
                                dataSource={baselineDatasetFields}
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
                                    render: (text: string) => (
                                      <div>{text}</div>
                                    )
                                  },
                                  {
                                    title: '字段编码',
                                    dataIndex: 'fieldCode',
                                    key: 'fieldCode',
                                    width: 120,
                                  },
                                  {
                                    title: (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        字段名称
                                        <InfoCircleOutlined
                                          style={{ color: '#999', cursor: 'pointer' }}
                                          onClick={() => handleShowTagUsageDialog('字段')}
                                        />
                                      </div>
                                    ),
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
                                    title: (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        字段标记
                                        <InfoCircleOutlined
                                          style={{ color: '#999', cursor: 'pointer' }}
                                          onClick={() => handleShowTagUsageDialog('所有标记')}
                                        />
                                      </div>
                                    ),
                                    key: 'fieldTags',
                                    width: 150,
                                    render: (_, record) => {
                                      const fieldTags = getFieldTags(record.id, 'baseline');

                                      // 可选的标记选项
                                      const availableTags = [
                                        { key: 'organizationPermission', label: '组织权限', color: 'orange' },
                                        { key: 'sensitive', label: '敏感字段', color: 'red' },
                                        { key: 'primaryKey', label: '主键', color: 'blue' },
                                        { key: 'required', label: '必填', color: 'green' }
                                      ];

                                      // 过滤出未选中的标记
                                      const availableToAdd = availableTags.filter(tag => !fieldTags.includes(tag.key));

                                      if (fieldTags.length === 0) {
                                        return (
                                          <Dropdown
                                            menu={{
                                              items: availableToAdd.map(tag => ({
                                                key: tag.key,
                                                label: (
                                                  <span>
                                                    <Tag color={tag.color} style={{ marginRight: 8 }}>
                                                      {tag.label}
                                                    </Tag>
                                                  </span>
                                                ),
                                                onClick: () => {
                                                  const selectedTag = tag;
                                                  const newTags = [...fieldTags, selectedTag.key];
                                                  const updatedTags = new Map(baselineFieldTags);
                                                  updatedTags.set(record.id, newTags);
                                                  setBaselineFieldTags(updatedTags);
                                                  message.success(`已为"${record.fieldName}"添加"${selectedTag.label}"标记`);
                                                }
                                              }))
                                            }}
                                            trigger={['click']}
                                          >
                                            <Button
                                              size="small"
                                              icon={<PlusOutlined />}
                                              style={{
                                                borderRadius: '50%',
                                                width: '28px',
                                                height: '28px',
                                                padding: 0,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                              }}
                                              type="dashed"
                                            />
                                          </Dropdown>
                                        );
                                      }

                                      return (
                                        <Space size={4}>
                                          {fieldTags.map(tagType => {
                                            const tag = availableTags.find(t => t.key === tagType);
                                            return (
                                              <Dropdown
                                                key={tagType}
                                                menu={{
                                                  items: [
                                                    {
                                                      key: 'remove',
                                                      label: '移除标记',
                                                      danger: true,
                                                      onClick: () => {
                                                        const newTags = fieldTags.filter(t => t !== tagType);
                                                        const updatedTags = new Map(baselineFieldTags);
                                                        if (newTags.length > 0) {
                                                          updatedTags.set(record.id, newTags);
                                                        } else {
                                                          updatedTags.delete(record.id);
                                                        }
                                                        setBaselineFieldTags(updatedTags);
                                                        message.success(`已移除"${tag.label}"标记`);
                                                      }
                                                    }
                                                  ]
                                                }}
                                                trigger={['click']}
                                              >
                                                <Tag color={tag.color} style={{ cursor: 'pointer' }}>
                                                  {tag.label}
                                                </Tag>
                                              </Dropdown>
                                            );
                                          })}
                                          {availableToAdd.length > 0 && (
                                            <Dropdown
                                              menu={{
                                                items: availableToAdd.map(tag => ({
                                                  key: tag.key,
                                                  label: (
                                                    <span>
                                                      <Tag color={tag.color} style={{ marginRight: 8 }}>
                                                        {tag.label}
                                                      </Tag>
                                                    </span>
                                                  ),
                                                  onClick: () => {
                                                    const selectedTag = tag;
                                                    const newTags = [...fieldTags, selectedTag.key];
                                                    const updatedTags = new Map(baselineFieldTags);
                                                    updatedTags.set(record.id, newTags);
                                                    setBaselineFieldTags(updatedTags);
                                                    message.success(`已为"${record.fieldName}"添加"${selectedTag.label}"标记`);
                                                  }
                                                }))
                                              }}
                                              trigger={['click']}
                                            >
                                              <Button size="small" type="dashed" icon={<DownOutlined />} />
                                            </Dropdown>
                                          )}
                                        </Space>
                                      );
                                    }
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
                            </div>
                          )}

                          {/* 查询条件配置区域 */}
                          {currentBaselineDataset && (
                            <Card
                              title={
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                                    查询条件配置
                                  </div>
                                  <Button
                                    type="primary"
                                    size="small"
                                    icon={<PlusOutlined />}
                                    onClick={() => {
                                      setCurrentQueryType('baseline');
                                      setCurrentDatasetId(currentBaselineDataset);
                                      setEditingQueryCondition(null);
                                      setQueryConditionModalVisible(true);
                                    }}
                                  >
                                    新增查询条件
                                  </Button>
                                </div>
                              }
                              size="small"
                              style={{ marginTop: '16px', minHeight: '200px' }}
                            >
                              <Table
                                dataSource={queryConditions.baseline[currentBaselineDataset] || []}
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
                                            setCurrentDatasetId(currentBaselineDataset);
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
                                            const currentConditions = queryConditions.baseline[currentBaselineDataset] || [];
                                            const newConditions = currentConditions.filter(c => c.id !== record.id);
                                            setQueryConditions(prev => ({
                                              ...prev,
                                              baseline: { ...prev.baseline, [currentBaselineDataset]: newConditions }
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
                            </Card>
                          )}
                        </div>
                        )}
                    </div>
                  </Col>
                </Row>
              </div>
            )}
          </div>
        </Form>
      </Card>

      {/* 比对字段选择弹框 */}
      <Modal
        title="选择比对数据集字段"
        open={comparisonFieldModalVisible}
        onCancel={() => setComparisonFieldModalVisible(false)}
        onOk={() => {
          setComparisonFieldModalVisible(false);
          message.success(`已添加字段`);
        }}
        width={800}
      >
        <Table
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys: comparisonFields.map(f => f.id),
            onChange: (selectedRowKeys, selectedRows) => {
              setComparisonFields(selectedRows);
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
          dataSource={comparisonFields}
          rowKey="id"
          size="small"
          scroll={{ y: 300 }}
        />
      </Modal>

      {/* 连接类型配置弹框 */}
      <Modal
        title="配置连接类型"
        open={joinTypeModalVisible}
        onCancel={() => {
          setJoinTypeModalVisible(false);
          setCurrentEditingDataset(null);
        }}
        onOk={() => {
          setJoinTypeModalVisible(false);
          setCurrentEditingDataset(null);
          message.success('连接类型配置成功');
        }}
        width={500}
      >
        <div style={{ padding: '20px 0' }}>
          <Text style={{ fontSize: '14px', color: '#666', marginBottom: '16px', display: 'block' }}>
            请选择比对数据集与基准数据集的连接类型：
          </Text>
          <Select
            defaultValue={currentEditingDataset
              ? selectedBaselineDatasets.find(d => d.id === currentEditingDataset)?.joinType || 'INNER JOIN'
              : 'INNER JOIN'
            }
            style={{ width: '100%' }}
            size="large"
            onChange={(value: BaselineDatasetItem['joinType']) => {
              if (currentEditingDataset) {
                const updatedDatasets = selectedBaselineDatasets.map(dataset =>
                  dataset.id === currentEditingDataset
                    ? { ...dataset, joinType: value }
                    : dataset
                );
                setSelectedBaselineDatasets(updatedDatasets);
              }
            }}
          >
            <Option value="INNER JOIN">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Text strong>INNER JOIN</Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>内连接 - 只返回匹配的记录</Text>
              </div>
            </Option>
            <Option value="LEFT JOIN">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Text strong>LEFT JOIN</Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>左连接 - 返回左表所有记录</Text>
              </div>
            </Option>
            <Option value="RIGHT JOIN">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Text strong>RIGHT JOIN</Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>右连接 - 返回右表所有记录</Text>
              </div>
            </Option>
          </Select>
          <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f6ffed', borderRadius: '4px' }}>
            <Text style={{ fontSize: '12px', color: '#52c41a' }}>
              提示：连接类型决定了比对数据集和基准数据集在关联时的数据匹配规则
            </Text>
          </div>
        </div>
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
              // 为新选择的数据集添加默认的连接类型
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
            // 清空之前选择的字段
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

      {/* 比对数据集字段选择弹框 */}
      <Modal
        title="添加比对数据集字段"
        open={comparisonObjectModalVisible}
        onCancel={() => setComparisonObjectModalVisible(false)}
        onOk={() => {
          // 同步行为与“选择数据集字段”保持一致：加入比对数据集字段并置顶到数据集字段
          const selectedFields = comparisonFields.filter(f => selectedComparisonObjectFields.includes(f.id));
          const newObjectFields = selectedFields.filter(f => !comparisonObjectFields.some(existing => existing.id === f.id));
          if (newObjectFields.length > 0) {
            setComparisonObjectFields([...comparisonObjectFields, ...newObjectFields]);
          }
          if (selectedFields.length > 0) {
            const selectedIdSet = new Set(selectedFields.map(f => f.id));
            const others = comparisonFields.filter(f => !selectedIdSet.has(f.id));
            const orderedSelected = comparisonFields.filter(f => selectedIdSet.has(f.id));
            setComparisonFields([...orderedSelected, ...others]);
            message.success(`已同步 ${orderedSelected.length} 个字段到最前并加入比对数据集字段`);
          }
          setComparisonObjectModalVisible(false);
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
          dataSource={comparisonFields}
          rowKey="id"
          size="small"
          scroll={{ y: 300 }}
        />
      </Modal>

      {/* 比对数据集字段字段选择弹框 */}
      <Modal
        title="选择可用字段"
        open={comparisonObjectFieldModalVisible}
        onCancel={() => {
          setComparisonObjectFieldModalVisible(false);
          setSelectedComparisonObjectFields([]);
        }}
        onOk={() => {
          // 从数据集所有字段中选择，确认时将所选字段：
          // 1) 添加到比对数据集字段字段（去重追加）
          // 2) 置顶插入到可用字段（若不存在则插入最前）
          const selectedFields = mockDatasetFields.filter(f => selectedComparisonObjectFields.includes(f.id));
          const newObjectFields = selectedFields.filter(f => !comparisonObjectFields.some(existing => existing.id === f.id));
          if (newObjectFields.length > 0) {
            setComparisonObjectFields([...comparisonObjectFields, ...newObjectFields]);
          }
          // 可用字段置顶：将选择的字段置于最前，同时保持其他字段顺序
          if (selectedFields.length > 0) {
            const selectedIdSet = new Set(selectedFields.map(f => f.id));
            const others = comparisonFields.filter(f => !selectedIdSet.has(f.id));
            // 新选择的字段按mockDatasetFields中的顺序添加到最前
            const newFieldsToAdd = selectedFields.filter(f => !comparisonFields.some(existing => existing.id === f.id));
            setComparisonFields([...newFieldsToAdd, ...others]);
            message.success(`已添加 ${selectedFields.length} 个字段到比对数据集字段和可用字段`);
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

      {/* 数据集字段选择弹框 */}
      <Modal
        title="选择可用字段"
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

      {/* 基准可用字段选择弹框 */}
      <Modal
        title="选择可用字段"
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

      {/* 字段配置弹窗 */}
      <FieldMetadataConfigDialog
        visible={fieldConfigModalVisible}
        field={currentConfigField}
        initialConfig={currentConfigField ? fieldConfigs.get(currentConfigField.id) : undefined}
        onOk={(config) => {
          if (currentConfigField) {
            const newConfigs = new Map(fieldConfigs);
            newConfigs.set(currentConfigField.id, config);
            setFieldConfigs(newConfigs);
            message.success('字段配置已保存');
          }
          setFieldConfigModalVisible(false);
          setCurrentConfigField(null);
        }}
        onCancel={() => {
          setFieldConfigModalVisible(false);
          setCurrentConfigField(null);
        }}
      />

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

            // 验证必填字段
            if (!conditionData.name || !conditionData.componentType || !conditionData.fieldId) {
              message.error('请填写所有必填字段');
              return;
            }

            // 更新查询条件
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
              {/* 根据当前查询类型显示对应的字段选项 */}
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

      {/* 标签使用说明弹窗 */}
      <Modal
        title={tagUsageContent.title}
        open={tagUsageModalVisible}
        onCancel={() => setTagUsageModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setTagUsageModalVisible(false)}>
            我知道了
          </Button>
        ]}
        width={600}
      >
        <div dangerouslySetInnerHTML={{ __html: tagUsageContent.content }} />
      </Modal>

      </div>
  );
};

export default ComparisonModelManagement;