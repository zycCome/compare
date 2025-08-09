import React, { useState, useEffect } from 'react';
import { Modal, Table, Input, Select, Button, Space, Tag, message, Typography, Card, Tabs, Popconfirm, Row, Col, Form, List } from 'antd';
import { Plus, Trash2, FileText, ChevronDown, ChevronRight, Settings, Database } from 'lucide-react';

const { Option } = Select;
const { Text } = Typography;

interface DatasetFieldConfigProps {
  open: boolean;
  dataset?: any;
  onClose: () => void;
  onSave: (data: any) => void;
}

interface FieldConfig {
  id: string;
  fieldName: string;
  displayName: string;
  fieldType: 'dimension' | 'measure';
  dataType: string;
  isVisible: boolean;
  sortOrder?: number;
  // 新增字段属性
  isRequired?: boolean;
  defaultValue?: string;
  validationRules?: ValidationRule[];
  aggregationType?: 'sum' | 'avg' | 'count' | 'max' | 'min' | 'none';
  formatPattern?: string;
  description?: string;
  businessMeaning?: string;
  dataSource?: string;
  updateFrequency?: string;
}

interface ValidationRule {
  type: 'range' | 'length' | 'pattern' | 'custom';
  value: any;
  message: string;
}



const DatasetFieldConfig: React.FC<DatasetFieldConfigProps> = ({
  open,
  dataset,
  onClose,
  onSave
}) => {
  const [selectedFields, setSelectedFields] = useState<FieldConfig[]>([]);
   const [loading, setLoading] = useState(false);
  
  const [associatedModels, setAssociatedModels] = useState<React.Key[]>([]);
  const [expandedModels, setExpandedModels] = useState<React.Key[]>([]);
  const [modelRelations, setModelRelations] = useState<any[]>([]);
  const [showAddRelation, setShowAddRelation] = useState(false);
  // 新增状态
  const [activeTab, setActiveTab] = useState('models');
   // const [fieldValidationRules, setFieldValidationRules] = useState<{[fieldId: string]: ValidationRule[]}>({});
  
  // 模型选择弹框状态
  const [showMainModelSelect, setShowMainModelSelect] = useState(false);
  const [showChildModelSelect, setShowChildModelSelect] = useState(false);
  const [selectedChildModel, setSelectedChildModel] = useState<any>(null);
  const [showEditRelation, setShowEditRelation] = useState(false);
  const [editingRelation, setEditingRelation] = useState<any>(null);

  // 模拟数据模型列表
  const mockModels = [
    { id: '1', code: 'SALES_ORDER', name: '销售订单模型', description: '包含订单基本信息' },
    { id: '2', code: 'PRODUCT_INFO', name: '产品信息模型', description: '产品基本信息、分类等' },
    { id: '3', code: 'CUSTOMER_INFO', name: '客户信息模型', description: '客户基本信息、联系方式' }
  ];

  // 添加模型关联关系
  const handleAddRelation = (relation: any) => {
    setModelRelations(prev => [...prev, { ...relation, id: Date.now().toString() }]);
    setShowAddRelation(false);
    setSelectedChildModel(null);
    message.success('关联关系添加成功');
  };

  // 删除模型关联关系
  const handleRemoveRelation = (relationId: string) => {
    setModelRelations(prev => prev.filter(rel => rel.id !== relationId));
    message.success('关联关系删除成功');
  };

  // 处理主模型选择
  const handleMainModelSelect = (model: any) => {
    setAssociatedModels([model.id]);
    setModelRelations([]);
    setShowMainModelSelect(false);
    message.success(`已选择主模型：${model.name}`);
  };

  // 处理子模型选择
  const handleChildModelSelect = (model: any) => {
    // 将子模型添加到关联模型列表中
    setAssociatedModels(prev => {
      if (!prev.includes(model.id)) {
        return [...prev, model.id];
      }
      return prev;
    });
    setSelectedChildModel(model);
    setShowChildModelSelect(false);
    setShowAddRelation(true);
    message.success(`已添加子模型：${model.name}`);
  };

  // 处理编辑关联关系
  const handleEditRelation = (relation: any) => {
    setEditingRelation(relation);
    setShowEditRelation(true);
  };

  // 更新关联关系
  const handleUpdateRelation = (updatedRelation: any) => {
    setModelRelations(prev => 
      prev.map(rel => rel.id === updatedRelation.id ? updatedRelation : rel)
    );
    setShowEditRelation(false);
    setEditingRelation(null);
    message.success('关联关系更新成功');
  };

  // 智能推荐关联关系
  const getRecommendedRelations = () => {
    if (associatedModels.length < 2) return [];
    
    const recommendations: any[] = [];
    const mainModel = mockModels.find(m => m.id === associatedModels[0]);
    const mainFields = getModelFields(mainModel?.id || '');
    
    // 遍历其他模型，寻找可能的关联
    mockModels.forEach(childModel => {
      if (childModel.id === mainModel?.id) return;
      
      const childFields = getModelFields(childModel.id);
      
      // 基于字段名称的智能匹配
      mainFields.forEach(mainField => {
        childFields.forEach(childField => {
          // 匹配规则：相同字段名或包含关键词
          const isNameMatch = mainField.fieldName === childField.fieldName;
          const isIdMatch = (
            (mainField.fieldName.includes('id') && childField.fieldName.includes('id')) ||
            (mainField.fieldName.includes('_id') && childField.fieldName.includes('_id')) ||
            (mainField.fieldName.endsWith('Id') && childField.fieldName.endsWith('Id'))
          );
          const isTypeMatch = mainField.dataType === childField.dataType;
          
          if ((isNameMatch || isIdMatch) && isTypeMatch) {
            // 检查是否已存在此关联
            const existingRelation = modelRelations.find(rel => 
              rel.fromModel === mainModel?.id && 
              rel.toModel === childModel.id &&
              rel.fromField === mainField.fieldName &&
              rel.toField === childField.fieldName
            );
            
            if (!existingRelation) {
              recommendations.push({
                fromModel: mainModel?.id,
                fromModelName: mainModel?.name,
                toModel: childModel.id,
                toModelName: childModel.name,
                fromField: mainField.fieldName,
                fromFieldName: mainField.displayName,
                toField: childField.fieldName,
                toFieldName: childField.displayName,
                confidence: isNameMatch ? 0.9 : 0.7,
                suggestedJoinType: 'inner',
                suggestedRelationType: 'one-to-many'
              });
            }
          }
        });
      });
    });
    
    return recommendations.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
  };

  // 应用推荐的关联关系
  const applyRecommendedRelation = (recommendation: any) => {
    const newRelation = {
      id: Date.now().toString(),
      fromModel: recommendation.fromModel,
      toModel: recommendation.toModel,
      fromField: recommendation.fromField,
      toField: recommendation.toField,
      relationType: recommendation.suggestedRelationType,
      joinType: recommendation.suggestedJoinType,
      description: `自动推荐：${recommendation.fromFieldName} → ${recommendation.toFieldName}`
    };
    
    setModelRelations(prev => [...prev, newRelation]);
    message.success(`已添加推荐关联：${recommendation.fromModelName} → ${recommendation.toModelName}`);
  };

  // 转换为Transfer组件需要的数据格式
  // const transferDataSource = mockModels.map(model => ({
  //   key: model.id,
  //   title: model.name,
  //   description: model.description
  // }));



  // 模拟字段数据
  const getModelFields = (modelId: string): FieldConfig[] => {
    const fieldMaps: { [key: string]: FieldConfig[] } = {
      '1': [
        {
          id: '1',
          fieldName: 'order_id',
          displayName: '订单ID',
          fieldType: 'dimension',
          dataType: 'string',
          isVisible: true,
          sortOrder: 1
        },
        {
          id: '2',
          fieldName: 'order_date',
          displayName: '订单日期',
          fieldType: 'dimension',
          dataType: 'date',
          isVisible: true,
          sortOrder: 2
        },
        {
          id: '3',
          fieldName: 'customer_name',
          displayName: '客户姓名',
          fieldType: 'dimension',
          dataType: 'string',
          isVisible: true,
          sortOrder: 3
        },
        {
          id: '4',
          fieldName: 'order_amount',
          displayName: '订单金额',
          fieldType: 'measure',
          dataType: 'decimal',
          isVisible: true,
          sortOrder: 4
        },
        {
          id: '1_5',
          fieldName: 'quantity',
          displayName: '订单数量',
          fieldType: 'measure',
          dataType: 'integer',
          isVisible: true,
          sortOrder: 5
        }
      ],
      '2': [
        {
          id: '2_1',
          fieldName: 'product_id',
          displayName: '产品ID',
          fieldType: 'dimension',
          dataType: 'string',
          isVisible: true,
          sortOrder: 1
        },
        {
          id: '2_2',
          fieldName: 'product_name',
          displayName: '产品名称',
          fieldType: 'dimension',
          dataType: 'string',
          isVisible: true,
          sortOrder: 2
        },
        {
          id: '2_3',
          fieldName: 'category',
          displayName: '产品类别',
          fieldType: 'dimension',
          dataType: 'string',
          isVisible: true,
          sortOrder: 3
        },
        {
          id: '2_4',
          fieldName: 'price',
          displayName: '产品价格',
          fieldType: 'measure',
          dataType: 'decimal',
          isVisible: true,
          sortOrder: 4
        }
      ],
      '3': [
        {
          id: '3_1',
          fieldName: 'customer_id',
          displayName: '客户ID',
          fieldType: 'dimension',
          dataType: 'string',
          isVisible: true,
          sortOrder: 1
        },
        {
          id: '3_2',
          fieldName: 'customer_name',
          displayName: '客户名称',
          fieldType: 'dimension',
          dataType: 'string',
          isVisible: true,
          sortOrder: 2
        },
        {
          id: '3_3',
          fieldName: 'phone',
          displayName: '联系电话',
          fieldType: 'dimension',
          dataType: 'string',
          isVisible: true,
          sortOrder: 3
        },
        {
          id: '3_4',
          fieldName: 'email',
          displayName: '邮箱地址',
          fieldType: 'dimension',
          dataType: 'string',
          isVisible: true,
          sortOrder: 4
        }
      ]
    };
    return fieldMaps[modelId] || [];
  };

  useEffect(() => {
    if (open && dataset) {
      // 加载已关联的模型
      const existingModels = dataset.associatedModels || [];
      setAssociatedModels(existingModels.map((model: any) => model.id || model));
      
      // 加载已选择的字段配置
      if (dataset.selectedFields) {
        setSelectedFields(dataset.selectedFields);
      } else {
        setSelectedFields([]);
      }
    } else {
      setSelectedFields([]);
      setAssociatedModels([]);
    }
  }, [open, dataset]);

  // 当关联模型变化时，更新可选字段
  // const handleAssociatedModelsChange = (newTargetKeys: React.Key[]) => {
  //   setAssociatedModels(newTargetKeys);
  //   // 移除不再关联模型的字段
  //   setSelectedFields(prev => 
  //     prev.filter(field => {
  //       const fieldModelId = field.id.split('_')[0]; // 假设字段ID格式为 modelId_fieldId
  //       return newTargetKeys.includes(fieldModelId);
  //     })
  //   );
  // };

  const handleDisplayNameChange = (fieldId: string, displayName: string) => {
    setSelectedFields(prev => prev.map(field => 
      field.id === fieldId ? { ...field, displayName } : field
    ));
  };

  const handleVisibilityChange = (fieldId: string, isVisible: boolean) => {
    setSelectedFields(prev => prev.map(field => 
      field.id === fieldId ? { ...field, isVisible } : field
    ));
  };

  const handleFieldTypeChange = (fieldId: string, fieldType: 'dimension' | 'measure') => {
    setSelectedFields(prev => prev.map(field => 
      field.id === fieldId ? { ...field, fieldType } : field
    ));
  };

  const handleAddFieldFromModel = (field: FieldConfig) => {
    // 检查字段是否已经添加
    const exists = selectedFields.some(f => f.id === field.id);
    if (!exists) {
      const newField: FieldConfig = {
        id: field.id,
        fieldName: field.fieldName,
        displayName: field.displayName,
        fieldType: field.fieldType,
        dataType: field.dataType,
        isVisible: true,
        sortOrder: selectedFields.length + 1
      };
      setSelectedFields(prev => [...prev, newField]);
      message.success(`字段 "${field.displayName}" 已添加`);
    } else {
      message.warning(`字段 "${field.displayName}" 已存在`);
    }
  };

  const handleRemoveField = (fieldId: string) => {
    setSelectedFields(prev => prev.filter(field => field.id !== fieldId));
    message.success('字段已移除');
  };

  const handleFieldNameChange = (fieldId: string, fieldName: string) => {
    setSelectedFields(prev => prev.map(field => 
      field.id === fieldId ? { ...field, fieldName } : field
    ));
  };

  // 新增字段属性处理函数
  const handleFieldPropertyChange = (fieldId: string, property: string, value: any) => {
    setSelectedFields(prev => prev.map(field => 
      field.id === fieldId ? { ...field, [property]: value } : field
    ));
  };

  // const handleAddValidationRule = (fieldId: string, rule: ValidationRule) => {
  //   setFieldValidationRules(prev => ({
  //     ...prev,
  //     [fieldId]: [...(prev[fieldId] || []), rule]
  //   }));
  // };

  // const handleRemoveValidationRule = (fieldId: string, ruleIndex: number) => {
  //   setFieldValidationRules(prev => ({
  //     ...prev,
  //     [fieldId]: (prev[fieldId] || []).filter((_, index) => index !== ruleIndex)
  //   }));
  // };



  const handleSave = async () => {
    if (associatedModels.length === 0) {
      message.error('请先关联数据模型');
      return;
    }

    if (selectedFields.length === 0) {
      message.error('请至少选择一个字段');
      return;
    }

    try {
      setLoading(true);
      const configData = {
        associatedModels,
        selectedFields
      };
      
      onSave(configData);
      message.success('字段配置保存成功');
      onClose();
    } catch (error) {
      console.error('保存失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '字段名',
      dataIndex: 'fieldName',
      key: 'fieldName',
      width: 150,
      render: (text: string, record: FieldConfig) => (
        <Input
          value={text}
          onChange={(e) => handleFieldNameChange(record.id, e.target.value)}
          placeholder="请输入字段名"
          size="small"
        />
      ),
    },
    {
      title: '显示别名',
      dataIndex: 'displayName',
      key: 'displayName',
      width: 150,
      render: (text: string, record: FieldConfig) => (
        <Input
          value={text}
          onChange={(e) => handleDisplayNameChange(record.id, e.target.value)}
          placeholder="请输入显示别名"
          size="small"
        />
      ),
    },
    {
      title: '字段类型',
      dataIndex: 'fieldType',
      key: 'fieldType',
      width: 120,
      render: (type: 'dimension' | 'measure', record: FieldConfig) => (
         <Select
           value={type}
           onChange={(value: 'dimension' | 'measure') => handleFieldTypeChange(record.id, value)}
           style={{ width: '100%' }}
           size="small"
         >
           <Option value="dimension">
             <Tag color="blue">维度</Tag>
           </Option>
           <Option value="measure">
             <Tag color="green">指标</Tag>
           </Option>
         </Select>
       ),
    },
    {
      title: '数据类型',
      dataIndex: 'dataType',
      key: 'dataType',
      width: 120,
      render: (text: string, record: FieldConfig) => (
        <Select
          value={text}
          onChange={(value) => handleFieldPropertyChange(record.id, 'dataType', value)}
          style={{ width: '100%' }}
          size="small"
        >
          <Option value="string">字符串</Option>
          <Option value="number">数字</Option>
          <Option value="decimal">小数</Option>
          <Option value="date">日期</Option>
          <Option value="datetime">日期时间</Option>
          <Option value="boolean">布尔</Option>
          <Option value="json">JSON</Option>
          <Option value="text">长文本</Option>
        </Select>
      ),
    },
    {
      title: '聚合类型',
      dataIndex: 'aggregationType',
      key: 'aggregationType',
      width: 120,
      render: (type: string, record: FieldConfig) => (
        <Select
          value={type || 'none'}
          onChange={(value) => handleFieldPropertyChange(record.id, 'aggregationType', value)}
          style={{ width: '100%' }}
          size="small"
          disabled={record.fieldType === 'dimension'}
        >
          <Option value="none">无</Option>
          <Option value="sum">求和</Option>
          <Option value="avg">平均值</Option>
          <Option value="count">计数</Option>
          <Option value="max">最大值</Option>
          <Option value="min">最小值</Option>
        </Select>
      ),
    },
    {
      title: '必填',
      dataIndex: 'isRequired',
      key: 'isRequired',
      width: 80,
      render: (isRequired: boolean, record: FieldConfig) => (
        <Select
          value={isRequired || false}
          onChange={(value) => handleFieldPropertyChange(record.id, 'isRequired', value)}
          style={{ width: '100%' }}
          size="small"
        >
          <Option value={false}>否</Option>
          <Option value={true}>是</Option>
        </Select>
      ),
    },
    {
      title: '是否显示',
      dataIndex: 'isVisible',
      key: 'isVisible',
      width: 100,
      render: (isVisible: boolean, record: FieldConfig) => (
        <Select
          value={isVisible}
          onChange={(value) => handleVisibilityChange(record.id, value)}
          style={{ width: '100%' }}
          size="small"
        >
          <Option value={true}>显示</Option>
          <Option value={false}>隐藏</Option>
        </Select>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, record: FieldConfig) => (
        <Popconfirm
          title="确定移除此字段吗？"
          onConfirm={() => handleRemoveField(record.id)}
          okText="确定"
          cancelText="取消"
        >
          <Button
            type="text"
            danger
            size="small"
            icon={<Trash2 size={14} />}
          />
        </Popconfirm>
      ),
    },
  ];

  return (
    <>
    <Modal
      title="数据集模型配置"
      open={open}
      onCancel={onClose}
      width={1400}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="save" type="primary" loading={loading} onClick={handleSave}>
          保存配置
        </Button>,
      ]}
    >
      <div style={{ height: '700px', display: 'flex', flexDirection: 'column' }}>
        {/* 上方：数据集基本信息 */}
        <Card 
          style={{ marginBottom: '16px', flex: '0 0 auto' }}
          bodyStyle={{ padding: '16px 24px' }}
        >
          <Row gutter={24}>
            <Col span={8}>
              <div>
                <Typography.Text type="secondary">数据集名称</Typography.Text>
                <div style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '4px' }}>
                  {dataset?.datasetName || '未命名数据集'}
                </div>
              </div>
            </Col>
            <Col span={8}>
              <div>
                <Typography.Text type="secondary">数据集描述</Typography.Text>
                <div style={{ marginTop: '4px' }}>
                  {dataset?.description || '暂无描述'}
                </div>
              </div>
            </Col>
            <Col span={8}>
              <div>
                <Typography.Text type="secondary">创建时间</Typography.Text>
                <div style={{ marginTop: '4px' }}>
                  {dataset?.createTime || '2024-01-01'}
                </div>
              </div>
            </Col>
          </Row>
        </Card>

        {/* 下方：选项卡内容 */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            style={{ height: '100%' }}
            items={[
              {
                key: 'models',
                label: (
                  <Space>
                    
                    <span>关联数据模型</span>
                  </Space>
                ),
                children: (
                  <div style={{ height: '500px' }}>
                    <Row gutter={16} style={{ height: '100%' }}>
                      {/* 左侧：模型选择配置 */}
                      <Col span={12}>
                        <Card 
                          title="模型关联配置"
                          style={{ height: '100%' }}
                          bodyStyle={{ padding: '16px' }}
                        >
                          <div style={{ marginBottom: '16px' }}>
                            <Typography.Text type="secondary">
                              请先选择主模型，然后添加子模型并配置关联关系
                            </Typography.Text>
                          </div>
                          
                          {/* 主模型选择 */}
                          <div style={{ marginBottom: '20px' }}>
                            <Text strong style={{ display: 'block', marginBottom: '8px' }}>主模型</Text>
                            {associatedModels.length > 0 ? (
                              <div style={{
                                border: '1px solid #d9d9d9',
                                borderRadius: '6px',
                                padding: '12px',
                                backgroundColor: '#fafafa',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}>
                                <div>
                                  <div style={{ fontWeight: 'bold' }}>
                                    {mockModels.find(m => m.id === associatedModels[0])?.name}
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#666' }}>
                                    {mockModels.find(m => m.id === associatedModels[0])?.description}
                                  </div>
                                </div>
                                <Button 
                                  type="link" 
                                  onClick={() => setShowMainModelSelect(true)}
                                >
                                  更换
                                </Button>
                              </div>
                            ) : (
                              <Button
                                type="dashed"
                                style={{ width: '100%', height: '60px' }}
                                onClick={() => setShowMainModelSelect(true)}
                              >
                                <div>
                                  <div>点击选择主模型</div>
                                  <div style={{ fontSize: '12px', color: '#999' }}>支持按模型编码和名称搜索</div>
                                </div>
                              </Button>
                            )}
                          </div>
                          
                          {/* 子模型列表 */}
                          {associatedModels.length > 0 && (
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <Text strong>子模型 ({modelRelations.length})</Text>
                                <Space size="small">
                                  {modelRelations.length > 0 && (
                                    <>
                                      <Button 
                                        type="text" 
                                        size="small" 
                                        onClick={() => {
                                          Modal.confirm({
                                            title: '批量删除确认',
                                            content: `确定要删除所有 ${modelRelations.length} 个子模型关联吗？`,
                                            onOk: () => {
                                              modelRelations.forEach(relation => {
                                                handleRemoveRelation(relation.id);
                                              });
                                              message.success('批量删除成功');
                                            }
                                          });
                                        }}
                                      >
                                        批量删除
                                      </Button>
                                      <Button 
                                        type="text" 
                                        size="small" 
                                        onClick={() => {
                                          message.info('批量编辑功能开发中...');
                                        }}
                                      >
                                        批量编辑
                                      </Button>
                                    </>
                                  )}
                                  <Button 
                                    type="dashed" 
                                    size="small" 
                                    icon={<Plus size={14} />}
                                    onClick={() => setShowChildModelSelect(true)}
                                  >
                                    添加子模型
                                  </Button>
                                </Space>
                              </div>
                              
                              {/* 已添加的子模型列表 */}
                              <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                {/* 显示所有已选择的子模型（除了主模型） */}
                                {associatedModels.slice(1).map((modelId) => {
                                  const childModel = mockModels.find(m => m.id === modelId);
                                   const relation = modelRelations.find(r => r.toModel === modelId);
                                   return (
                                     <div key={modelId} style={{ 
                                      border: '1px solid #f0f0f0', 
                                      borderRadius: '6px', 
                                      padding: '12px', 
                                      marginBottom: '8px',
                                      backgroundColor: '#fafafa'
                                    }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1 }}>
                                          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                            {childModel?.name}
                                          </div>
                                          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                                            {childModel?.description}
                                          </div>
                                          <div style={{ fontSize: '12px' }}>
                                            {relation ? (
                                              <>
                                                <Tag color="blue">{relation.relationType}</Tag>
                                                <span style={{ color: '#666' }}>通过 {relation.fromField} → {relation.toField}</span>
                                              </>
                                            ) : (
                                              <Tag color="orange">未配置关联</Tag>
                                            )}
                                          </div>
                                        </div>
                                        <Button 
                                          type="text" 
                                          size="small" 
                                          danger
                                          icon={<Trash2 size={14} />}
                                          onClick={() => {
                                            // 从关联模型列表中移除
                                            setAssociatedModels(prev => prev.filter(id => id !== modelId));
                                            // 如果有关联关系，也要删除
                                            if (relation) {
                                              handleRemoveRelation(relation.id);
                                            } else {
                                              message.success(`已移除模型：${childModel?.name}`);
                                            }
                                          }}
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                                
                                {modelRelations.length === 0 && (
                                  <div style={{ 
                                    textAlign: 'center', 
                                    color: '#999', 
                                    padding: '20px',
                                    border: '1px dashed #d9d9d9',
                                    borderRadius: '6px'
                                  }}>
                                    暂无子模型，点击上方按钮添加
                                  </div>
                                )}
                                
                                {/* 智能推荐区域 */}
                                {associatedModels.length > 0 && (() => {
                                  const recommendations = getRecommendedRelations();
                                  return recommendations.length > 0 && (
                                    <div style={{ 
                                      marginTop: '16px',
                                      padding: '12px',
                                      backgroundColor: '#f6ffed',
                                      border: '1px solid #b7eb8f',
                                      borderRadius: '6px'
                                    }}>
                                      <div style={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center',
                                        marginBottom: '8px'
                                      }}>
                                        <Text strong style={{ color: '#52c41a' }}>💡 智能推荐关联</Text>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                          发现 {recommendations.length} 个可能的关联
                                        </Text>
                                      </div>
                                      
                                      {recommendations.slice(0, 3).map((rec, index) => (
                                        <div key={index} style={{
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                          padding: '8px',
                                          backgroundColor: 'white',
                                          borderRadius: '4px',
                                          marginBottom: '4px',
                                          border: '1px solid #d9f7be'
                                        }}>
                                          <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '13px', fontWeight: 'bold' }}>
                                              {rec.toModelName}
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#666' }}>
                                              {rec.fromFieldName} → {rec.toFieldName}
                                              <Tag color={rec.confidence > 0.8 ? 'green' : 'orange'} style={{ marginLeft: '4px', fontSize: '10px' }}>
                                                {Math.round(rec.confidence * 100)}% 匹配
                                              </Tag>
                                            </div>
                                          </div>
                                          <Button 
                                            type="link" 
                                            size="small"
                                            style={{ color: '#52c41a' }}
                                            onClick={() => applyRecommendedRelation(rec)}
                                          >
                                            应用
                                          </Button>
                                        </div>
                                      ))}
                                      
                                      {recommendations.length > 3 && (
                                        <div style={{ textAlign: 'center', marginTop: '8px' }}>
                                          <Button type="link" size="small" style={{ color: '#52c41a' }}>
                                            查看更多推荐 ({recommendations.length - 3})
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          )}
                        </Card>
                      </Col>
                      
                      {/* 右侧：模型血缘关系 */}
                      <Col span={12}>
                        <Card 
                          title={
                            <Space>
                              <span>模型血缘关系</span>
                            </Space>
                          }
                          style={{ height: '100%' }}
                          bodyStyle={{ padding: '16px' }}
                        >
                          {associatedModels.length === 0 ? (
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'center', 
                              alignItems: 'center', 
                              height: '300px',
                              color: '#999'
                            }}>
                              <Text type="secondary">请先选择关联模型</Text>
                            </div>
                          ) : (
                            <div style={{ height: '400px', overflowY: 'auto' }}>
                              {/* ER图样式的关系图 */}
                              <div style={{ 
                                border: '1px solid #f0f0f0', 
                                borderRadius: '8px', 
                                padding: '20px',
                                backgroundColor: '#fafafa',
                                marginBottom: '20px',
                                minHeight: '200px',
                                position: 'relative'
                              }}>
                                <ModelRelationshipDiagram 
                                   models={mockModels.filter(model => associatedModels.includes(model.id))}
                                   relations={modelRelations}
                                   onAddRelation={() => setShowAddRelation(true)}
                                   onRemoveRelation={handleRemoveRelation}
                                   onEditRelation={handleEditRelation}
                                   canAddRelation={associatedModels.length >= 2}
                                   getModelFields={getModelFields}
                                 />
                              </div>
                              
                              {/* 关联关系列表 */}
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                   <Text strong>关联关系详情:</Text>
                                   {associatedModels.length >= 2 && (
                                     <Button 
                                       type="primary" 
                                       size="small" 
                                       icon={<Plus size={14} />}
                                       onClick={() => setShowAddRelation(true)}
                                     >
                                       添加关联
                                     </Button>
                                   )}
                                 </div>
                                 {modelRelations.length > 0 ? (
                                   <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                     {modelRelations.map((relation) => {
                                       const fromModel = mockModels.find(m => m.id === relation.fromModel);
                                       const toModel = mockModels.find(m => m.id === relation.toModel);
                                       return (
                                         <div key={relation.id} style={{
                                           padding: '8px 12px',
                                           border: '1px solid #e6f7ff',
                                           borderRadius: '4px',
                                           backgroundColor: '#f6ffed',
                                           marginBottom: '6px',
                                           fontSize: '12px'
                                         }}>
                                           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                             <div>
                                               <span style={{ fontWeight: 'bold' }}>{fromModel?.name}.{relation.fromField}</span>
                                               <span style={{ color: '#1890ff', margin: '0 8px' }}>→</span>
                                               <span style={{ fontWeight: 'bold' }}>{toModel?.name}.{relation.toField}</span>
                                               <Tag color="blue" style={{ marginLeft: '8px' }}>{relation.relationType}</Tag>
                                             </div>
                                             <Button 
                                               type="text" 
                                               size="small" 
                                               danger
                                               icon={<Trash2 size={12} />}
                                               onClick={() => handleRemoveRelation(relation.id)}
                                             />
                                           </div>
                                           <div style={{ color: '#666', fontStyle: 'italic', marginTop: '4px' }}>
                                             {relation.description}
                                           </div>
                                         </div>
                                       );
                                     })}
                                   </div>
                                 ) : (
                                   <div style={{ 
                                     textAlign: 'center', 
                                     color: '#999', 
                                     padding: '20px 0',
                                     fontStyle: 'italic',
                                     fontSize: '12px'
                                   }}>
                                     {associatedModels.length < 2 ? '请先关联至少2个模型' : '暂无字段关联关系，点击"添加关联"开始配置'}
                                   </div>
                                 )}
                              </div>
                            </div>
                          )}
                        </Card>
                      </Col>
                    </Row>
                  </div>
                )
              },
              {
                key: 'fields',
                label: (
                  <Space>
                    <FileText size={16} />
                    <span>字段配置</span>
                    {selectedFields.length > 0 && (
                      <Tag color="blue">{selectedFields.length}</Tag>
                    )}
                  </Space>
                ),
                children: (
                  <div style={{ height: '500px' }}>
                    <Row gutter={16} style={{ height: '100%' }}>
                      {/* 左侧：可选字段列表 */}
                      <Col span={7}>
                        <Card 
                          title={
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>可选字段列表</span>
                              {associatedModels.length > 0 && (
                                <Space size="small">
                                  <Button 
                                    size="small" 
                                    type="link"
                                    onClick={() => {
                                      // 全选所有可用字段
                                      const allAvailableFields = mockModels
                                        .filter(model => associatedModels.includes(model.id))
                                        .flatMap(model => getModelFields(model.id))
                                        .filter(field => !selectedFields.some(sf => sf.id === field.id));
                                      setSelectedFields(prev => [...prev, ...allAvailableFields]);
                                      message.success(`已添加 ${allAvailableFields.length} 个字段`);
                                    }}
                                  >
                                    全选
                                  </Button>
                                  <Button 
                                    size="small" 
                                    type="link"
                                    onClick={() => {
                                      // 选择所有维度字段
                                      const dimensionFields = mockModels
                                        .filter(model => associatedModels.includes(model.id))
                                        .flatMap(model => getModelFields(model.id))
                                        .filter(field => field.fieldType === 'dimension' && !selectedFields.some(sf => sf.id === field.id));
                                      setSelectedFields(prev => [...prev, ...dimensionFields]);
                                      message.success(`已添加 ${dimensionFields.length} 个维度字段`);
                                    }}
                                  >
                                    选择维度
                                  </Button>
                                  <Button 
                                    size="small" 
                                    type="link"
                                    onClick={() => {
                                      // 选择所有度量字段
                                      const measureFields = mockModels
                                        .filter(model => associatedModels.includes(model.id))
                                        .flatMap(model => getModelFields(model.id))
                                        .filter(field => field.fieldType === 'measure' && !selectedFields.some(sf => sf.id === field.id));
                                      setSelectedFields(prev => [...prev, ...measureFields]);
                                      message.success(`已添加 ${measureFields.length} 个度量字段`);
                                    }}
                                  >
                                    选择度量
                                  </Button>
                                </Space>
                              )}
                            </div>
                          }
                          style={{ height: '100%' }}
                          bodyStyle={{ padding: '16px' }}
                        >
                          {associatedModels.length === 0 ? (
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'center', 
                              alignItems: 'center', 
                              height: '300px',
                              color: '#999'
                            }}>
                              <Text type="secondary">请先在"关联数据模型"选项卡中关联模型</Text>
                            </div>
                          ) : (
                            <div style={{ height: '400px', overflowY: 'auto' }}>
                              {mockModels
                                .filter(model => associatedModels.includes(model.id))
                                .map(model => {
                                  const modelFields = getModelFields(model.id)
                                    .filter(field => !selectedFields.some(sf => sf.id === field.id));
                                  const isExpanded = expandedModels.includes(model.id);
                                  return (
                                    <div key={model.id} style={{ marginBottom: '16px' }}>
                                      <div 
                                        style={{ 
                                          fontWeight: 'bold', 
                                          color: '#1890ff', 
                                          marginBottom: '8px',
                                          borderBottom: '1px solid #f0f0f0',
                                          paddingBottom: '4px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'space-between'
                                        }}
                                      >
                                        <span 
                                          style={{ cursor: 'pointer' }}
                                          onClick={() => {
                                            setExpandedModels(prev => 
                                              isExpanded 
                                                ? prev.filter(id => id !== model.id)
                                                : [...prev, model.id]
                                            );
                                          }}
                                        >
                                          {model.name} {isExpanded ? <ChevronDown size={16} style={{ marginLeft: '4px' }} /> : <ChevronRight size={16} style={{ marginLeft: '4px' }} />}
                                        </span>
                                        {isExpanded && modelFields.length > 0 && (
                                          <Space size="small">
                                            <Button 
                                              size="small" 
                                              type="text"
                                              style={{ fontSize: '12px', padding: '0 4px' }}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedFields(prev => [...prev, ...modelFields]);
                                                message.success(`已添加 ${model.name} 的 ${modelFields.length} 个字段`);
                                              }}
                                            >
                                              全选
                                            </Button>
                                            <Button 
                                              size="small" 
                                              type="text"
                                              style={{ fontSize: '12px', padding: '0 4px' }}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const dimensionFields = modelFields.filter(field => field.fieldType === 'dimension');
                                                if (dimensionFields.length > 0) {
                                                  setSelectedFields(prev => [...prev, ...dimensionFields]);
                                                  message.success(`已添加 ${model.name} 的 ${dimensionFields.length} 个维度字段`);
                                                } else {
                                                  message.info(`${model.name} 没有可用的维度字段`);
                                                }
                                              }}
                                            >
                                              维度
                                            </Button>
                                            <Button 
                                              size="small" 
                                              type="text"
                                              style={{ fontSize: '12px', padding: '0 4px' }}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const measureFields = modelFields.filter(field => field.fieldType === 'measure');
                                                if (measureFields.length > 0) {
                                                  setSelectedFields(prev => [...prev, ...measureFields]);
                                                  message.success(`已添加 ${model.name} 的 ${measureFields.length} 个度量字段`);
                                                } else {
                                                  message.info(`${model.name} 没有可用的度量字段`);
                                                }
                                              }}
                                            >
                                              度量
                                            </Button>
                                          </Space>
                                        )}
                                      </div>
                                      {isExpanded && (
                                        <List
                                          size="small"
                                          dataSource={modelFields}
                                          renderItem={(field) => (
                                            <List.Item
                                              style={{
                                                padding: '8px 12px',
                                                border: '1px solid #f0f0f0',
                                                borderRadius: '4px',
                                                marginBottom: '4px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                              }}
                                              className="hover:bg-blue-50 hover:border-blue-200"
                                              onClick={() => handleAddFieldFromModel(field)}
                                            >
                                              <List.Item.Meta
                                                title={
                                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Text>{field.displayName}</Text>
                                                    <Tag color={field.fieldType === 'dimension' ? 'blue' : 'green'}>
                                                       {field.fieldType === 'dimension' ? '维度' : '指标'}
                                                     </Tag>
                                                  </div>
                                                }
                                                description={`${field.fieldName} (${field.dataType})`}
                                              />
                                            </List.Item>
                                          )}
                                        />
                                      )}
                                    </div>
                                  );
                                })
                              }
                            </div>
                          )}
                        </Card>
                      </Col>
                      
                      {/* 右侧：已选字段配置 */}
                      <Col span={17}>
                        <Card 
                          title={
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Space>
                                <Settings size={16} />
                                <span>已选字段配置</span>
                                <Text type="secondary">({selectedFields.length} 个字段)</Text>
                              </Space>
                              {selectedFields.length > 0 && (
                                <Space size="small">
                                  <Button 
                                    size="small" 
                                    type="link"
                                    danger
                                    onClick={() => {
                                      const dimensionCount = selectedFields.filter(field => field.fieldType === 'dimension').length;
                                      setSelectedFields(prev => prev.filter(field => field.fieldType !== 'dimension'));
                                      message.success(`已删除 ${dimensionCount} 个维度字段`);
                                    }}
                                  >
                                    删除维度
                                  </Button>
                                  <Button 
                                    size="small" 
                                    type="link"
                                    danger
                                    onClick={() => {
                                      const measureCount = selectedFields.filter(field => field.fieldType === 'measure').length;
                                      setSelectedFields(prev => prev.filter(field => field.fieldType !== 'measure'));
                                      message.success(`已删除 ${measureCount} 个度量字段`);
                                    }}
                                  >
                                    删除度量
                                  </Button>
                                  <Popconfirm
                                    title="确定要清空所有字段吗？"
                                    onConfirm={() => {
                                      const count = selectedFields.length;
                                      setSelectedFields([]);
                                      message.success(`已清空 ${count} 个字段`);
                                    }}
                                    okText="确定"
                                    cancelText="取消"
                                  >
                                    <Button 
                                      size="small" 
                                      type="link"
                                      danger
                                    >
                                      清空全部
                                    </Button>
                                  </Popconfirm>
                                </Space>
                              )}
                            </div>
                          }
                          style={{ height: '100%' }}
                          bodyStyle={{ padding: '16px' }}
                        >
                          {selectedFields.length === 0 ? (
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'center', 
                              alignItems: 'center', 
                              height: '300px',
                              color: '#999'
                            }}>
                              <Text type="secondary">请从左侧选择字段</Text>
                            </div>
                          ) : (
                            <>
                              <div style={{ marginBottom: '16px' }}>
                                <Text type="secondary">
                                  配置字段的显示别名和可见性，自定义别名将在报表中显示
                                </Text>
                              </div>
                              
                              <Table
                                columns={columns}
                                dataSource={selectedFields}
                                rowKey="id"
                                size="small"
                                pagination={false}
                                scroll={{ y: 350 }}
                              />
                            </>
                          )}
                        </Card>
                      </Col>
                    </Row>
                  </div>
                )
              }
            ]}
          />
        </div>
      </div>
    </Modal>

    {/* 主模型选择弹框 */}
    <ModelSelectModal
      visible={showMainModelSelect}
      onCancel={() => setShowMainModelSelect(false)}
      onOk={handleMainModelSelect}
      models={mockModels}
      title="选择主模型"
    />

    {/* 子模型选择弹框 */}
    <ModelSelectModal
      visible={showChildModelSelect}
      onCancel={() => setShowChildModelSelect(false)}
      onOk={handleChildModelSelect}
      models={mockModels}
      title="选择子模型"
      excludeIds={associatedModels.map(id => String(id))}
    />

    {/* 添加关联关系弹框 */}
    <AddRelationModal
      visible={showAddRelation}
      onCancel={() => {
        setShowAddRelation(false);
        setSelectedChildModel(null);
      }}
      onOk={handleAddRelation}
      getModelFields={getModelFields}
      mainModelId={String(associatedModels[0])}
      selectedChildModel={selectedChildModel}
    />

    {/* 编辑关联关系弹框 */}
    <EditRelationModal
      visible={showEditRelation}
      onCancel={() => {
        setShowEditRelation(false);
        setEditingRelation(null);
      }}
      onOk={handleUpdateRelation}
      models={mockModels.filter(model => associatedModels.includes(model.id))}
      getModelFields={getModelFields}
      relation={editingRelation}
    />
    

    </>
  );
};

// 添加子模型关联弹框组件
// 模型选择弹框组件
interface ModelSelectModalProps {
  visible: boolean;
  onCancel: () => void;
  onOk: (selectedModel: any) => void;
  models: any[];
  title: string;
  excludeIds?: string[];
}

const ModelSelectModal: React.FC<ModelSelectModalProps> = ({ visible, onCancel, onOk, models, title, excludeIds = [] }: ModelSelectModalProps) => {
  const [searchText, setSearchText] = useState('');
  const [selectedModel, setSelectedModel] = useState<any>(null);

  const filteredModels = models.filter((model: any) => {
    if (excludeIds.includes(model.id)) return false;
    if (!searchText) return true;
    return model.name.toLowerCase().includes(searchText.toLowerCase()) ||
           model.code?.toLowerCase().includes(searchText.toLowerCase());
  });

  const handleOk = () => {
    if (selectedModel) {
      onOk(selectedModel);
      setSelectedModel(null);
      setSearchText('');
    }
  };

  const handleCancel = () => {
    setSelectedModel(null);
    setSearchText('');
    onCancel();
  };

  return (
    <Modal
      title={title}
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      width={600}
      okButtonProps={{ disabled: !selectedModel }}
    >
      <div style={{ marginBottom: '16px' }}>
        <Input.Search
          placeholder="搜索模型编码或模型名称"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ marginBottom: '12px' }}
        />
      </div>
      
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {filteredModels.map((model: any) => (
          <div
            key={model.id}
            style={{
              border: selectedModel?.id === model.id ? '2px solid #1890ff' : '1px solid #f0f0f0',
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '8px',
              cursor: 'pointer',
              backgroundColor: selectedModel?.id === model.id ? '#f6ffed' : '#fff'
            }}
            onClick={() => setSelectedModel(model)}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
              {model.name}
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
              编码: {model.code || model.id}
            </div>
            <div style={{ fontSize: '12px', color: '#999' }}>
              {model.description}
            </div>
          </div>
        ))}
        {filteredModels.length === 0 && (
          <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
            未找到匹配的模型
          </div>
        )}
      </div>
    </Modal>
  );
};

interface AddRelationModalProps {
  visible: boolean;
  onCancel: () => void;
  onOk: (relationData: any) => void;
  getModelFields: (modelId: string) => any[];
  mainModelId: string;
  selectedChildModel: any;
}

const AddRelationModal: React.FC<AddRelationModalProps> = ({ visible, onCancel, onOk, getModelFields, mainModelId, selectedChildModel }: AddRelationModalProps) => {
  const [form] = Form.useForm();
  const [relationType, setRelationType] = useState('');

  const handleOk = () => {
    form.validateFields().then(values => {
      const relationData = {
        ...values,
        fromModel: mainModelId,
        toModel: selectedChildModel?.id,
        relationType: values.relationType,
        joinType: values.joinType
      };
      onOk(relationData);
      form.resetFields();
      // setRelationType('');
    });
  };

  const handleCancel = () => {
    form.resetFields();
    // setRelationType('');
    onCancel();
  };

  const mainModelFields = mainModelId ? getModelFields(mainModelId) : [];
  const childModelFields = selectedChildModel ? getModelFields(selectedChildModel.id) : [];
  return (
    <Modal
      title="添加子模型关联"
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      width={600}
    >
      <Form form={form} layout="vertical">
        <div style={{
          border: '1px solid #d9d9d9',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '16px',
          backgroundColor: '#fafafa'
        }}>
          <Text strong style={{ display: 'block', marginBottom: '8px' }}>已选择子模型</Text>
          <div>
            <div style={{ fontWeight: 'bold' }}>{selectedChildModel?.name}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>编码: {selectedChildModel?.code}</div>
            <div style={{ fontSize: '12px', color: '#999' }}>{selectedChildModel?.description}</div>
          </div>
        </div>
        
        <Form.Item
          name="relationType"
          label="关联类型"
          rules={[{ required: true, message: '请选择关联类型' }]}
        >
          <Select 
            placeholder="选择关联类型"
            onChange={(value) => setRelationType(value)}
          >
            <Option value="一对一">一对一 (1:1)</Option>
            <Option value="一对多">一对多 (1:N)</Option>
            <Option value="多对一">多对一 (N:1)</Option>
            <Option value="多对多">多对多 (N:N)</Option>
          </Select>
        </Form.Item>
        
        <Form.Item
          name="joinType"
          label="关联关系"
          rules={[{ required: true, message: '请选择关联关系' }]}
        >
          <Select placeholder="选择关联关系">
            <Option value="inner">Inner Join</Option>
            <Option value="left">Left Join</Option>
            <Option value="right">Right Join</Option>
          </Select>
        </Form.Item>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="fromField"
              label="主模型关联字段"
              rules={[{ required: true, message: '请选择主模型关联字段' }]}
            >
              <Select placeholder="选择主模型字段">
                {mainModelFields.map((field: any) => (
                  <Option key={field.id} value={field.fieldName}>
                    {field.displayName} ({field.fieldName})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="toField"
              label="子模型关联字段"
              rules={[{ required: true, message: '请选择子模型关联字段' }]}
            >
              <Select placeholder="选择子模型字段" disabled={!selectedChildModel}>
                {childModelFields.map((field: any) => (
                  <Option key={field.id} value={field.fieldName}>
                    {field.displayName} ({field.fieldName})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        
        <Form.Item
           name="description"
           label="关联描述"
         >
           <Input.TextArea 
             placeholder="请输入关联关系的描述信息（可选）"
             rows={3}
           />
         </Form.Item>
       </Form>
     </Modal>
  );
};

// 编辑关联关系弹框组件
interface EditRelationModalProps {
  visible: boolean;
  onCancel: () => void;
  onOk: (updatedRelation: any) => void;
  models: any[];
  getModelFields: (modelId: string) => any[];
  relation: any;
}

const EditRelationModal: React.FC<EditRelationModalProps> = ({ visible, onCancel, onOk, models, getModelFields, relation }: EditRelationModalProps) => {
  const [form] = Form.useForm();
  
  useEffect(() => {
    if (visible && relation) {
      // const fromModel = models.find((m: any) => m.id === relation.fromModel);
      // const toModel = models.find((m: any) => m.id === relation.toModel);
      
      form.setFieldsValue({
        fromModel: relation.fromModel,
        toModel: relation.toModel,
        fromField: relation.fromField,
        toField: relation.toField,
        relationType: relation.relationType,
        joinType: relation.joinType,
        description: relation.description
      });
    }
  }, [visible, relation, form, models]);
  
  const handleOk = () => {
    form.validateFields().then(values => {
      onOk({
        ...relation,
        ...values
      });
      form.resetFields();
    });
  };
  
  const fromModel = models.find((m: any) => m.id === form.getFieldValue('fromModel'));
  const toModel = models.find((m: any) => m.id === form.getFieldValue('toModel'));
  const fromFields = fromModel ? getModelFields(fromModel.id) : [];
  const toFields = toModel ? getModelFields(toModel.id) : [];
  
  return (
    <Modal
      title="编辑关联关系"
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      width={600}
      okText="更新"
      cancelText="取消"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          relationType: 'one-to-many',
          joinType: 'inner'
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="fromModel"
              label="主模型"
              rules={[{ required: true, message: '请选择主模型' }]}
            >
              <Select placeholder="选择主模型" disabled>
                {models.map((model: any) => (
                  <Option key={model.id} value={model.id}>
                    {model.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="toModel"
              label="子模型"
              rules={[{ required: true, message: '请选择子模型' }]}
            >
              <Select placeholder="选择子模型" disabled>
                {models.map((model: any) => (
                  <Option key={model.id} value={model.id}>
                    {model.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        
        <Form.Item
          name="relationType"
          label="关联关系"
          rules={[{ required: true, message: '请选择关联关系' }]}
        >
          <Select placeholder="选择关联关系">
            <Option value="one-to-one">一对一</Option>
            <Option value="one-to-many">一对多</Option>
            <Option value="many-to-one">多对一</Option>
            <Option value="many-to-many">多对多</Option>
          </Select>
        </Form.Item>
        
        <Form.Item
          name="joinType"
          label="关联类型"
          rules={[{ required: true, message: '请选择关联类型' }]}
        >
          <Select placeholder="选择关联类型">
            <Option value="inner">Inner Join</Option>
            <Option value="left">Left Join</Option>
            <Option value="right">Right Join</Option>
          </Select>
        </Form.Item>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="fromField"
              label="主模型字段"
              rules={[{ required: true, message: '请选择主模型字段' }]}
            >
              <Select placeholder="选择主模型字段">
                {fromFields.map((field: any) => (
                  <Option key={field.id} value={field.fieldName}>
                    {field.displayName} ({field.fieldName})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="toField"
              label="子模型字段"
              rules={[{ required: true, message: '请选择子模型字段' }]}
            >
              <Select placeholder="选择子模型字段">
                {toFields.map((field: any) => (
                  <Option key={field.id} value={field.fieldName}>
                    {field.displayName} ({field.fieldName})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        
        <Form.Item
           name="description"
           label="关联描述"
         >
           <Input.TextArea 
             placeholder="请输入关联关系的描述信息（可选）"
             rows={3}
           />
         </Form.Item>
       </Form>
     </Modal>
  );
};

// 模型关系图组件
interface ModelRelationshipDiagramProps {
  models: any[];
  relations: any[];
  onAddRelation: () => void;
  onRemoveRelation: (relationId: string) => void;
  onEditRelation: (relation: any) => void;
  canAddRelation: boolean;
  getModelFields: (modelId: string) => any[];
}

const ModelRelationshipDiagram: React.FC<ModelRelationshipDiagramProps> = ({ models, relations, onAddRelation, onRemoveRelation, onEditRelation, canAddRelation, getModelFields }: ModelRelationshipDiagramProps) => {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const [modelPositions, setModelPositions] = React.useState<{ [key: string]: { x: number; y: number } }>({});

  // 初始化模型位置
  React.useEffect(() => {
    if (models.length > 0) {
      const positions: { [key: string]: { x: number; y: number } } = {};
      
      if (models.length === 1) {
        // 单个模型居中
        positions[models[0].id] = { x: 250, y: 100 };
      } else if (models.length === 2) {
        // 两个模型水平排列
        positions[models[0].id] = { x: 150, y: 100 };
        positions[models[1].id] = { x: 350, y: 100 };
      } else if (models.length === 3) {
        // 三个模型三角形排列
        positions[models[0].id] = { x: 250, y: 60 };  // 顶部
        positions[models[1].id] = { x: 180, y: 140 }; // 左下
        positions[models[2].id] = { x: 320, y: 140 }; // 右下
      } else {
        // 多个模型圆形排列
        const centerX = 250;
        const centerY = 100;
        const radius = Math.max(100, 30 + models.length * 15);
        
        models.forEach((model: any, index: number) => {
          const angle = (index * 2 * Math.PI) / models.length - Math.PI / 2; // 从顶部开始
          positions[model.id] = {
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle)
          };
        });
      }
      
      setModelPositions(positions);
    }
  }, [models]);

  // 绘制连接线
  const renderConnections = () => {
    return relations.map((relation: any, index: number) => {
      const fromPos = modelPositions[relation.fromModel];
      const toPos = modelPositions[relation.toModel];
      
      if (!fromPos || !toPos) return null;
      
      // 计算连接点（从模型边缘开始，而不是中心）
      const dx = toPos.x - fromPos.x;
      const dy = toPos.y - fromPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const unitX = dx / distance;
      const unitY = dy / distance;
      
      // 模型框的半宽和半高
      const modelWidth = 60;
      const modelHeight = 25;
      
      const startX = fromPos.x + unitX * modelWidth;
      const startY = fromPos.y + unitY * modelHeight;
      const endX = toPos.x - unitX * modelWidth;
      const endY = toPos.y - unitY * modelHeight;
      
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;
      
      // 为多条连线添加偏移，避免重叠
      const offset = (index % 2 === 0 ? 1 : -1) * Math.floor(index / 2) * 20;
      const offsetMidX = midX + offset * 0.3;
      const offsetMidY = midY + offset * 0.3;
      
      return (
        <g key={relation.id}>
          {/* 连接线 */}
          <line
            x1={startX}
            y1={startY}
            x2={endX}
            y2={endY}
            stroke="#1890ff"
            strokeWidth="2"
            strokeDasharray={relation.joinType === 'left' ? '5,5' : relation.joinType === 'right' ? '10,5' : 'none'}
            markerEnd="url(#arrowhead)"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              onEditRelation(relation);
            }}
          />
          
          {/* 关系类型标签 */}
          <rect
            x={offsetMidX - 25}
            y={offsetMidY - 20}
            width="50"
            height="40"
            fill="white"
            stroke="#1890ff"
            strokeWidth="1"
            rx="4"
            style={{ 
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
              cursor: 'pointer'
            }}
            onClick={() => {
              if (window.confirm('是否要删除此关联关系？')) {
                onRemoveRelation(relation.id);
              }
            }}
          />
          
          {/* 删除按钮 */}
          <circle
            cx={offsetMidX + 20}
            cy={offsetMidY - 15}
            r="6"
            fill="#ff4d4f"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              if (window.confirm('确定要删除此关联关系吗？')) {
                onRemoveRelation(relation.id);
              }
            }}
          />
          <text
            x={offsetMidX + 20}
            y={offsetMidY - 12}
            textAnchor="middle"
            fontSize="8"
            fill="white"
            style={{ cursor: 'pointer', userSelect: 'none' }}
            onClick={() => {
              if (window.confirm('确定要删除此关联关系吗？')) {
                onRemoveRelation(relation.id);
              }
            }}
          >
            ×
          </text>
          
          {/* 关联类型 */}
          <text
            x={offsetMidX}
            y={offsetMidY - 8}
            textAnchor="middle"
            fontSize="9"
            fill="#1890ff"
            fontWeight="bold"
          >
            {relation.relationType}
          </text>
          
          {/* Join类型 */}
          <text
            x={offsetMidX}
            y={offsetMidY + 4}
            textAnchor="middle"
            fontSize="8"
            fill="#666"
          >
            {relation.joinType?.toUpperCase() || 'INNER'} JOIN
          </text>
          
          {/* 字段关联信息 */}
          <text
            x={offsetMidX}
            y={offsetMidY + 14}
            textAnchor="middle"
            fontSize="7"
            fill="#999"
          >
            {relation.fromField} → {relation.toField}
          </text>
        </g>
      );
    });
  };

  if (models.length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '200px',
        color: '#999'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Database size={32} style={{ marginBottom: '8px' }} />
          <div>请先选择关联模型</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '200px' }}>
      <svg
        ref={svgRef}
        width="100%"
        height="200"
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {/* 箭头标记定义 */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#1890ff"
            />
          </marker>
        </defs>
        
        {/* 渲染连接线 */}
        {renderConnections()}
      </svg>
      
      {/* 渲染模型节点 */}
      {models.map((model: any) => {
        const position = modelPositions[model.id];
        const fieldCount = getModelFields(model.id).length;
        if (!position) return null;
        
        return (
          <div
            key={model.id}
            style={{
              position: 'absolute',
              left: position.x - 60,
              top: position.y - 30,
              width: '120px',
              height: '60px',
              backgroundColor: '#fff',
              border: '2px solid #1890ff',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            }}
            title={`点击查看${model.name}的详细字段信息`}
          >
            <div style={{ color: '#1890ff', marginBottom: '2px', fontSize: '11px' }}>
              {model.name}
            </div>
            <div style={{ 
              fontSize: '10px', 
              color: fieldCount > 10 ? '#ff4d4f' : fieldCount > 5 ? '#faad14' : '#52c41a',
              fontWeight: 'bold'
            }}>
              {fieldCount} 字段
            </div>
            {/* 权限标识 */}
            {model.isTemplate && (
              <div style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                width: '12px',
                height: '12px',
                backgroundColor: '#722ed1',
                borderRadius: '50%',
                fontSize: '8px',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                T
              </div>
            )}
          </div>
        );
      })}
      
      {/* 添加关联按钮 */}
      {canAddRelation && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px'
        }}>
          <Button
            type="primary"
            size="small"
            icon={<Plus size={14} />}
            onClick={onAddRelation}
          >
            添加关联
          </Button>
        </div>
      )}
    </div>
  );
};



export default DatasetFieldConfig;