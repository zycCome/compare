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
  Checkbox
} from 'antd';
import { 
  PlusOutlined, 
  SaveOutlined, 
  EyeOutlined, 
  InfoCircleOutlined,
  SettingOutlined,
  DeleteOutlined,
  EditOutlined,
  CloseOutlined
} from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

/**
 * 比对模型管理组件
 * 提供基本信息、比对对象、基准对象三模块的配置界面
 */
const ComparisonModelManagement: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  
  // 模块展开收缩状态
  const [activeKey, setActiveKey] = useState<string[]>(['1', '2', '3']);
  
  // 基本信息相关状态
  const [tags, setTags] = useState<string[]>([]);
  const [inputTag, setInputTag] = useState('');
  
  // 比对对象相关状态
  const [selectedComparisonDataset, setSelectedComparisonDataset] = useState<{id: string; name: string} | null>(null);
  const [selectedComparisonObjects, setSelectedComparisonObjects] = useState<Array<{id: string; name: string}>>([]);
  // 比对对象字段（显示为Tag标签）
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
  const [comparisonObjectFieldModalVisible, setComparisonObjectFieldModalVisible] = useState(false);
  const [comparisonDatasetModalVisible, setComparisonDatasetModalVisible] = useState(false);
  const [comparisonObjectModalVisible, setComparisonObjectModalVisible] = useState(false);
  const [selectedComparisonFields, setSelectedComparisonFields] = useState<string[]>([]);
  const [selectedComparisonObjectFields, setSelectedComparisonObjectFields] = useState<string[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  
  // 基准对象相关状态
  const [selectedBaselineDatasets, setSelectedBaselineDatasets] = useState<Array<{
    id: string;
    name: string;
    description: string;
    recordCount: number;
  }>>([]);
  const [currentBaselineDataset, setCurrentBaselineDataset] = useState<string>('');
  const [baselineFields, setBaselineFields] = useState<{[key: string]: Array<{
    id: string;
    fieldCode: string;
    fieldName: string;
    fieldType: string;
    displayName: string;
    attribute: string;
  }>}>({});
  const [baselineDatasetModalVisible, setBaselineDatasetModalVisible] = useState(false);
  const [baselineFieldModalVisible, setBaselineFieldModalVisible] = useState(false);
  
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
    { id: 'field_1', fieldCode: 'product_code', fieldName: '商品编码', fieldType: 'string', displayName: '商品编码', attribute: '维度' },
    { id: 'field_2', fieldCode: 'product_name', fieldName: '商品名称', fieldType: 'string', displayName: '商品名称', attribute: '维度' },
    { id: 'field_3', fieldCode: 'category', fieldName: '商品分类', fieldType: 'string', displayName: '商品分类', attribute: '维度' },
    { id: 'field_4', fieldCode: 'brand', fieldName: '品牌', fieldType: 'string', displayName: '品牌', attribute: '维度' },
    { id: 'field_5', fieldCode: 'supplier', fieldName: '供应商', fieldType: 'string', displayName: '供应商', attribute: '维度' },
    { id: 'field_6', fieldCode: 'price', fieldName: '价格', fieldType: 'number', displayName: '价格', attribute: '指标' },
    { id: 'field_7', fieldCode: 'quantity', fieldName: '数量', fieldType: 'number', displayName: '数量', attribute: '指标' },
    { id: 'field_8', fieldCode: 'purchase_date', fieldName: '采购日期', fieldType: 'date', displayName: '采购日期', attribute: '维度' }
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
                {/* 第一行：模型编码、模型名称 */}
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
                </Row>

                {/* 第二行：模型描述 */}
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

                {/* 第三行：标签 */}
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
                        标签：
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
                          >
                            添加标签
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>
            )}
          </div>

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
                比对对象
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
                {/* 选择比对数据集 */}
                <Row style={{ marginBottom: '16px' }}>
                  <Col span={24}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ 
                        width: '120px', 
                        textAlign: 'right', 
                        marginRight: '12px',
                        fontSize: '14px'
                      }}>
                        选择比对数据集：
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Input
                          value={selectedComparisonDataset?.name || ''}
                          placeholder="请选择比对数据集"
                          readOnly
                          style={{ width: '300px', cursor: 'pointer' }}
                          onClick={() => setComparisonDatasetModalVisible(true)}
                        />
                        <Button 
                          type="primary" 
                          style={{ marginLeft: '8px' }}
                          onClick={() => setComparisonDatasetModalVisible(true)}
                        >
                          选择
                        </Button>
                      </div>
                    </div>
                  </Col>
                </Row>

                {/* 选择比对对象 */}
                <Row style={{ marginBottom: '16px' }}>
                  <Col span={24}>
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                      <span style={{ 
                        width: '120px', 
                        textAlign: 'right', 
                        marginRight: '12px',
                        fontSize: '14px',
                        paddingTop: '6px'
                      }}>
                        选择比对对象：
                      </span>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start' }}>
                        <div style={{ 
                          flex: 1, 
                          marginRight: '8px',
                          border: '1px solid #d9d9d9',
                          borderRadius: '6px',
                          padding: '8px',
                          minHeight: '32px',
                          backgroundColor: '#fafafa',
                          display: 'flex',
                          flexWrap: 'wrap',
                          alignItems: 'flex-start',
                          alignContent: 'flex-start'
                        }}>
                          {/* 显示比对对象 */}
                          {selectedComparisonObjects.map(obj => (
                            <Tag 
                              key={obj.id}
                              closable
                              onClose={() => {
                                setSelectedComparisonObjects(selectedComparisonObjects.filter(o => o.id !== obj.id));
                                message.success('已删除比对对象');
                              }}
                              style={{ marginBottom: '4px', marginRight: '4px' }}
                            >
                              {obj.name}
                            </Tag>
                          ))}
                          {/* 显示比对对象字段 */}
                          {comparisonObjectFields.map(field => (
                            <Tag 
                              key={field.id}
                              closable
                              onClose={() => {
                                setComparisonObjectFields(comparisonObjectFields.filter(f => f.id !== field.id));
                                message.success('已删除比对字段');
                              }}
                              style={{ marginBottom: '4px', marginRight: '4px', backgroundColor: '#e6f7ff', borderColor: '#91d5ff' }}
                            >
                              {field.displayName} ({field.fieldName})
                            </Tag>
                          ))}
                          {/* 当没有任何标签时显示占位文本 */}
                          {selectedComparisonObjects.length === 0 && comparisonObjectFields.length === 0 && (
                            <span style={{ color: '#bfbfbf', fontSize: '14px', lineHeight: '16px' }}>
                              请选择比对对象
                            </span>
                          )}
                        </div>
                        <Button 
                          type="dashed" 
                          icon={<PlusOutlined />}
                          onClick={() => {
                            if (!selectedComparisonDataset) {
                              message.warning('请先选择比对数据集');
                              setComparisonDatasetModalVisible(true);
                              return;
                            }
                            setComparisonObjectFieldModalVisible(true);
                          }}
                        >
                          选择比对对象
                        </Button>
                      </div>
                    </div>
                  </Col>
                </Row>

                {/* 数据集字段列表 */}
                <Row>
                  <Col span={24}>
                    <div style={{ 
                      border: '1px solid #f0f0f0',
                      borderRadius: '4px',
                      padding: '16px',
                      marginTop: '16px'
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
                          选择数据集字段
                          {selectedComparisonDataset && (
                            <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}>
                              （{selectedComparisonDataset.name}）
                            </span>
                          )}
                        </div>
                        <Button 
                          type="primary" 
                          size="small"
                          icon={<PlusOutlined />}
                          onClick={() => {
                            if (!selectedComparisonDataset) {
                              message.warning('请先选择比对数据集');
                              return;
                            }
                            setComparisonFieldModalVisible(true);
                          }}
                          disabled={!selectedComparisonDataset}
                        >
                          添加字段
                        </Button>
                      </div>
                      
                      {!selectedComparisonDataset ? (
                        <div style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '200px',
                          color: '#999',
                          fontSize: '16px'
                        }}>
                          请先选择比对数据集
                        </div>
                      ) : comparisonFields.length === 0 ? (
                        <div style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '200px',
                          color: '#999',
                          fontSize: '14px'
                        }}>
                          暂无数据集字段
                          <br />
                          <span style={{ fontSize: '12px' }}>点击"添加字段"按钮添加</span>
                        </div>
                      ) : (
                        <Table
                          dataSource={comparisonFields}
                          rowKey="id"
                          size="small"
                          pagination={false}
                          scroll={{ y: 280 }}
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
                              render: (text: string, record: any) => (
                                <Input
                                  value={text || record.fieldName}
                                  size="small"
                                  onChange={(e) => {
                                    const newFields = comparisonFields.map(field => 
                                      field.id === record.id 
                                        ? { ...field, displayName: e.target.value }
                                        : field
                                    );
                                    setComparisonFields(newFields);
                                  }}
                                />
                              )
                            },
                            {
                              title: '属性',
                              dataIndex: 'attribute',
                              key: 'attribute',
                              width: 100,
                              render: (attribute: string, record: any) => (
                                <Select
                                  value={attribute}
                                  size="small"
                                  style={{ width: '100%' }}
                                  onChange={(value) => {
                                    const newFields = comparisonFields.map(field => 
                                      field.id === record.id 
                                        ? { ...field, attribute: value }
                                        : field
                                    );
                                    setComparisonFields(newFields);
                                  }}
                                >
                                  <Option value="维度">维度</Option>
                                  <Option value="指标">指标</Option>
                                </Select>
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
                                    message.success('已删除字段');
                                  }}
                                />
                              ),
                            },
                          ]}
                        />
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
                基准对象
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
                      padding: '16px',
                      height: '400px'
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
                        maxHeight: '320px',
                        overflowY: 'auto'
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
                          selectedBaselineDatasets.map(dataset => (
                            <div 
                              key={dataset.id}
                              style={{ 
                                padding: '12px',
                                border: currentBaselineDataset === dataset.id ? '2px solid #1890ff' : '1px solid #f0f0f0',
                                borderRadius: '4px',
                                marginBottom: '8px',
                                cursor: 'pointer',
                                backgroundColor: currentBaselineDataset === dataset.id ? '#f6ffed' : '#fafafa'
                              }}
                              onClick={() => setCurrentBaselineDataset(dataset.id)}
                            >
                              <div style={{ 
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}>
                                <div>
                                  <div style={{ 
                                    fontSize: '14px', 
                                    fontWeight: 'bold',
                                    marginBottom: '4px'
                                  }}>
                                    {dataset.name}
                                  </div>
                                  <div style={{ 
                                    fontSize: '12px', 
                                    color: '#666',
                                    marginBottom: '4px'
                                  }}>
                                    {dataset.description}
                                  </div>
                                  <Tag color="blue">
                                    {dataset.recordCount} 条记录
                                  </Tag>
                                </div>
                                <Button 
                                  type="text" 
                                  size="small"
                                  danger
                                  icon={<DeleteOutlined />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newDatasets = selectedBaselineDatasets.filter(d => d.id !== dataset.id);
                                    setSelectedBaselineDatasets(newDatasets);
                                    if (currentBaselineDataset === dataset.id) {
                                      setCurrentBaselineDataset('');
                                    }
                                  }}
                                />
                              </div>
                            </div>
                          ))
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
                      height: '400px'
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
                          数据集字段
                          {currentBaselineDataset && (
                            <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}>
                              （{selectedBaselineDatasets.find(d => d.id === currentBaselineDataset)?.name}）
                            </span>
                          )}
                        </div>
                        {currentBaselineDataset && (
                          <Button 
                            type="primary" 
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={() => setBaselineFieldModalVisible(true)}
                          >
                            添加数据集字段
                          </Button>
                        )}
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
                        <Table
                          dataSource={baselineFields[currentBaselineDataset] || mockDatasetFields}
                          rowKey="id"
                          size="small"
                          pagination={false}
                          scroll={{ y: 280 }}
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
                              render: (text: string, record: any) => (
                                <Input
                                  value={text || record.fieldName}
                                  size="small"
                                  onChange={(e) => {
                                    const currentFields = baselineFields[currentBaselineDataset] || mockDatasetFields;
                                    const newFields = currentFields.map(field => 
                                      field.id === record.id 
                                        ? { ...field, displayName: e.target.value }
                                        : field
                                    );
                                    setBaselineFields({
                                      ...baselineFields,
                                      [currentBaselineDataset]: newFields
                                    });
                                  }}
                                />
                              )
                            },
                            {
                              title: '属性',
                              dataIndex: 'attribute',
                              key: 'attribute',
                              width: 100,
                              render: (attribute: string, record: any) => (
                                <Select
                                  value={attribute}
                                  size="small"
                                  style={{ width: '100%' }}
                                  onChange={(value) => {
                                    const currentFields = baselineFields[currentBaselineDataset] || mockDatasetFields;
                                    const newFields = currentFields.map(field => 
                                      field.id === record.id 
                                        ? { ...field, attribute: value }
                                        : field
                                    );
                                    setBaselineFields({
                                      ...baselineFields,
                                      [currentBaselineDataset]: newFields
                                    });
                                  }}
                                >
                                  <Option value="维度">维度</Option>
                                  <Option value="指标">指标</Option>
                                </Select>
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
                                    const currentFields = baselineFields[currentBaselineDataset] || mockDatasetFields;
                                    const newFields = currentFields.filter(f => f.id !== record.id);
                                    setBaselineFields({
                                      ...baselineFields,
                                      [currentBaselineDataset]: newFields
                                    });
                                  }}
                                />
                              ),
                            },
                          ]}
                        />
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
              render: (attribute: string) => (
                <Tag color={attribute === '维度' ? 'cyan' : 'purple'}>
                  {attribute}
                </Tag>
              )
            }
          ]}
          dataSource={mockDatasetFields}
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

      {/* 比对对象选择弹框 */}
      <Modal
        title="选择比对对象"
        open={comparisonObjectModalVisible}
        onCancel={() => setComparisonObjectModalVisible(false)}
        onOk={() => {
          const selectedIds = selectedComparisonObjects.map(obj => obj.id);
          const newObjects = mockComparisonObjects.filter(obj => 
            selectedIds.includes(obj.id) && !selectedComparisonObjects.some(selected => selected.id === obj.id)
          );
          if (newObjects.length > 0) {
            setSelectedComparisonObjects([...selectedComparisonObjects, ...newObjects.map(obj => ({id: obj.id, name: obj.name}))]);
            message.success(`已添加 ${newObjects.length} 个比对对象`);
          }
          setComparisonObjectModalVisible(false);
        }}
        width={600}
      >
        <Table
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys: selectedComparisonObjects.map(obj => obj.id),
            onChange: (selectedRowKeys) => {
              const newSelectedObjects = selectedRowKeys.map(id => {
                const obj = mockComparisonObjects.find(o => o.id === id);
                return obj ? {id: obj.id, name: obj.name} : null;
              }).filter(Boolean) as Array<{id: string; name: string}>;
              setSelectedComparisonObjects(newSelectedObjects);
            },
          }}
          columns={[
            {
              title: '对象名称',
              dataIndex: 'name',
              key: 'name',
              width: 120,
            },
            {
              title: '描述',
              dataIndex: 'description',
              key: 'description',
            }
          ]}
          dataSource={mockComparisonObjects}
          rowKey="id"
          size="small"
          pagination={false}
        />
      </Modal>

      {/* 比对对象字段选择弹框 */}
      <Modal
        title="选择比对对象字段"
        open={comparisonObjectFieldModalVisible}
        onCancel={() => {
          setComparisonObjectFieldModalVisible(false);
          setSelectedComparisonObjectFields([]);
        }}
        onOk={() => {
          const newFields = mockDatasetFields.filter(field => 
            selectedComparisonObjectFields.includes(field.id) && 
            !comparisonObjectFields.some(existing => existing.id === field.id)
          );
          if (newFields.length > 0) {
            setComparisonObjectFields([...comparisonObjectFields, ...newFields]);
            message.success(`已添加 ${newFields.length} 个比对字段`);
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
              render: (attribute: string) => (
                <Tag color={attribute === '维度' ? 'cyan' : 'purple'}>
                  {attribute}
                </Tag>
              )
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
        title="选择数据集字段"
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
              render: (attribute: string) => (
                <Tag color={attribute === '维度' ? 'cyan' : 'purple'}>
                  {attribute}
                </Tag>
              )
            }
          ]}
          dataSource={mockDatasetFields}
          rowKey="id"
          size="small"
          scroll={{ y: 300 }}
        />
      </Modal>

      {/* 基准数据集字段选择弹框 */}
      <Modal
        title="选择基准数据集字段"
        open={baselineFieldModalVisible}
        onCancel={() => setBaselineFieldModalVisible(false)}
        onOk={() => {
          setBaselineFieldModalVisible(false);
          message.success(`已添加字段`);
        }}
        width={800}
      >
        <Table
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys: (baselineFields[currentBaselineDataset] || []).map(f => f.id),
            onChange: (selectedRowKeys, selectedRows) => {
              setBaselineFields({
                ...baselineFields,
                [currentBaselineDataset]: selectedRows
              });
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
              render: (attribute: string) => (
                <Tag color={attribute === '维度' ? 'cyan' : 'purple'}>
                  {attribute}
                </Tag>
              )
            }
          ]}
          dataSource={mockDatasetFields}
          rowKey="id"
          size="small"
          scroll={{ y: 300 }}
        />
      </Modal>
    </div>
  );
};

export default ComparisonModelManagement;