import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Modal, Form, Input, Select, Space, message, Popconfirm, Tag, Row, Col, Checkbox, Radio, Steps, Upload } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, AppstoreOutlined, UnorderedListOutlined } from '@ant-design/icons';

const { Option } = Select;

// 数据集接口定义
interface Dataset {
  id: string;
  datasetCode: string;
  datasetName: string;
  analysisTheme?: string;
  sourceConfig: {
    type: 'DATA_MODEL' | 'EXCEL' | 'RAW_SQL' | 'API';
    primaryDataModelId?: string;
    relations?: DatasetRelation[];
    customSql?: string;
    excelConfig?: {
      fileName: string;
      sheetName: string;
    };
    apiConfig?: {
      endpoint: string;
      method: string;
      headers?: Record<string, string>;
    };
  };
  fieldSelections: {
    selections: FieldSelection[];
    conflictResolutions: ConflictResolution[];
  };
  status: 'ACTIVE' | 'INACTIVE';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// 数据集关联关系
interface DatasetRelation {
  relatedDataModelId: string;
  joinType: 'LEFT_JOIN' | 'RIGHT_JOIN' | 'INNER_JOIN' | 'FULL_JOIN';
  joinCondition: string;
}

// 字段选择
interface FieldSelection {
  sourceFieldId: string;
  alias: string;
  selected: boolean;
}

// 冲突解决
interface ConflictResolution {
  conceptId: string;
  dominantAlias: string;
}

// 数据模型字段（从数据模型管理页面复用）
interface DataModelField {
  fieldId: string;
  sourceType: 'PHYSICAL' | 'CALCULATED';
  physicalName?: string;
  expression?: string;
  businessName: string;
  role: 'DIMENSION_FK' | 'MEASURE_IMPL' | 'DESCRIPTIVE' | 'UNUSED';
  mappingTargetId?: string;
  contextFieldId?: string;
}

// 数据模型（从数据模型管理页面复用）
interface DataModel {
  id: string;
  dataModelCode: string;
  dataModelName: string;
  dataModelDesc: string;
  dataSourceType: 'DORIS' | 'MYSQL';
  databaseName: string;
  sourceTableName: string;
  fields: DataModelField[];
  status: 'ACTIVE' | 'INACTIVE';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

const DatasetManagement: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingDataset, setEditingDataset] = useState<Dataset | null>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('card');
  const [availableModels, setAvailableModels] = useState<DataModel[]>([]);
  const [selectedPrimaryModel, setSelectedPrimaryModel] = useState<string>('');
  const [relations, setRelations] = useState<DatasetRelation[]>([]);
  const [availableFields, setAvailableFields] = useState<any[]>([]);
  const [fieldSelections, setFieldSelections] = useState<FieldSelection[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [conflictResolutions, setConflictResolutions] = useState<ConflictResolution[]>([]);
  const [buildType, setBuildType] = useState<string>('');
  const [currentStep, setCurrentStep] = useState(0);
  const [isAddFieldModalVisible, setIsAddFieldModalVisible] = useState(false);

  // 模拟数据模型数据（与数据模型管理页面保持一致）
  const mockDataModels: DataModel[] = [
    {
      id: 'dm_001',
      dataModelCode: 'DM_AGREEMENT',
      dataModelName: '采购协议模型',
      dataModelDesc: '采购协议模型，包含协议编号、产品编码、供应商编码、净价、税率、协议价(含税)、协议品牌号',
      dataSourceType: 'DORIS',
      databaseName: 'yyigou_dsrp',
      sourceTableName: 'dwd_purchase_agreements',
      fields: [
        {
          fieldId: 'dmf_001',
          sourceType: 'PHYSICAL',
          physicalName: 'product_code',
          businessName: '产品编码',
          role: 'DIMENSION_FK',
          mappingTargetId: 'DIM_PRODUCT'
        },
        {
          fieldId: 'dmf_002',
          sourceType: 'PHYSICAL',
          physicalName: 'supplier_code',
          businessName: '供应商编码',
          role: 'DIMENSION_FK',
          mappingTargetId: 'DIM_SUPPLIER'
        },
        {
          fieldId: 'dmf_003',
          sourceType: 'CALCULATED',
          expression: 'net_price * (1 + tax_rate)',
          businessName: '协议价(含税)',
          role: 'MEASURE_IMPL',
          mappingTargetId: 'P001'
        }
      ],
      status: 'ACTIVE',
      createdBy: '张三',
      createdAt: '2025-01-20',
      updatedAt: '2025-01-20'
    },
    {
      id: 'dm_002',
      dataModelCode: 'DM_ORDER_HIST',
      dataModelName: '采购订单历史模型',
      dataModelDesc: '采购订单历史数据模型，用于分析历史订单价格趋势',
      dataSourceType: 'DORIS',
      databaseName: 'yyigou_dsrp',
      sourceTableName: 'dwd_purchase_orders',
      fields: [
        {
          fieldId: 'dmf_101',
          sourceType: 'PHYSICAL',
          physicalName: 'product_code',
          businessName: '产品编码',
          role: 'DIMENSION_FK',
          mappingTargetId: 'DIM_PRODUCT'
        },
        {
          fieldId: 'dmf_102',
          sourceType: 'PHYSICAL',
          physicalName: 'order_price',
          businessName: '订单价格',
          role: 'MEASURE_IMPL',
          mappingTargetId: 'P001'
        }
      ],
      status: 'ACTIVE',
      createdBy: '李四',
      createdAt: '2025-01-18',
      updatedAt: '2025-01-19'
    }
  ];

  // 模拟数据集数据
  const mockDatasets: Dataset[] = [
    {
      id: 'ds_001',
      datasetCode: 'DS_PURCHASE_FULL_LINK',
      datasetName: '采购全链路融合分析数据集',
      analysisTheme: '采购分析',
      sourceConfig: {
        type: 'DATA_MODEL',
        primaryDataModelId: 'dm_001',
        relations: [
          {
            relatedDataModelId: 'dm_002',
            joinType: 'LEFT_JOIN',
            joinCondition: '主模型.产品编码 = 关联模型.产品编码'
          }
        ]
      },
      fieldSelections: {
        selections: [
          {
            sourceFieldId: 'dmf_003',
            alias: '协议-协议价',
            selected: true
          },
          {
            sourceFieldId: 'dmf_102',
            alias: '订单-协议价',
            selected: true
          },
          {
            sourceFieldId: 'dmf_002',
            alias: '供应商名称',
            selected: true
          }
        ],
        conflictResolutions: [
          {
            conceptId: 'P001',
            dominantAlias: '协议-协议价'
          }
        ]
      },
      status: 'ACTIVE',
      createdBy: '张三',
      createdAt: '2025-01-20',
      updatedAt: '2025-01-20'
    },
    {
      id: 'ds_002',
      datasetCode: 'DS_SUPPLIER_ANALYSIS',
      datasetName: '供应商综合分析',
      analysisTheme: '供应商分析',
      sourceConfig: {
        type: 'RAW_SQL',
        customSql: 'SELECT * FROM supplier_analysis_view'
      },
      fieldSelections: {
        selections: [],
        conflictResolutions: []
      },
      status: 'ACTIVE',
      createdBy: '李四',
      createdAt: '2025-01-19',
      updatedAt: '2025-01-19'
    }
  ];

  useEffect(() => {
    setDatasets(mockDatasets);
    setAvailableModels(mockDataModels.filter(model => model.status === 'ACTIVE'));
  }, []);

  // 表格列定义（用于列表视图）
  const columns = [
    {
      title: '数据集编码',
      dataIndex: 'datasetCode',
      key: 'datasetCode',
      width: 180,
      render: (text: string) => <span className="font-mono text-sm">{text}</span>
    },
    {
      title: '数据集名称',
      dataIndex: 'datasetName',
      key: 'datasetName',
      width: 200,
      render: (text: string, record: Dataset) => (
        <Button 
          type="link" 
          className="p-0 h-auto font-medium text-left"
          onClick={() => handleView(record)}
        >
          {text}
        </Button>
      ),
    },
    {
      title: '分析主题',
      dataIndex: 'analysisTheme',
      key: 'analysisTheme',
      width: 120,
      render: (text: string) => text || '-'
    },
    {
      title: '数据源类型',
      dataIndex: ['sourceConfig', 'type'],
      key: 'buildType',
      width: 120,
      render: (type: string) => {
        const typeMap = {
          'DATA_MODEL': { text: '数据模型', color: 'blue' },
          'EXCEL': { text: 'Excel', color: 'green' },
          'RAW_SQL': { text: '原始SQL', color: 'orange' },
          'API': { text: 'API接口', color: 'purple' }
        };
        const config = typeMap[type as keyof typeof typeMap] || { text: type, color: 'default' };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '主数据模型',
      dataIndex: ['sourceConfig', 'primaryDataModelId'],
      key: 'primaryModel',
      width: 160,
      render: (modelId: string) => {
        const model = availableModels.find(m => m.id === modelId);
        return model ? model.dataModelName : '-';
      },
    },
    {
      title: '关联模型数',
      dataIndex: ['sourceConfig', 'relations'],
      key: 'relationCount',
      width: 110,
      align: 'center' as const,
      render: (relations: DatasetRelation[]) => relations?.length || 0,
    },

    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      align: 'center' as const,
      render: (status: string) => (
        <Tag color={status === 'ACTIVE' ? 'green' : 'red'}>
          {status === 'ACTIVE' ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '创建人',
      dataIndex: 'createdBy',
      key: 'createdBy',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 120,
      align: 'center' as const,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: Dataset) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            编辑
          </Button>
          <Button
            type="link"
            onClick={() => handleToggleStatus(record)}
            size="small"
          >
            {record.status === 'ACTIVE' ? '禁用' : '启用'}
          </Button>
          <Popconfirm
            title="确定要删除这个数据集吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleAdd = () => {
    setEditingDataset(null);
    form.resetFields();
    setSelectedPrimaryModel('');
    setRelations([]);
    setAvailableFields([]);
    setFieldSelections([]);
    setConflicts([]);
    setConflictResolutions([]);
    setBuildType('');
    setIsModalVisible(true);
  };

  const handleEdit = (dataset: Dataset) => {
    setEditingDataset(dataset);
    form.setFieldsValue({
      datasetCode: dataset.datasetCode,
      datasetName: dataset.datasetName,
      analysisTheme: dataset.analysisTheme,
      buildType: dataset.sourceConfig.type,
      primaryDataModelId: dataset.sourceConfig.primaryDataModelId,
      customSql: dataset.sourceConfig.customSql,
      apiEndpoint: dataset.sourceConfig.apiConfig?.endpoint,
      apiMethod: dataset.sourceConfig.apiConfig?.method,
      excelFileName: dataset.sourceConfig.excelConfig?.fileName,
      excelSheetName: dataset.sourceConfig.excelConfig?.sheetName,
    });
    setBuildType(dataset.sourceConfig.type);
    setSelectedPrimaryModel(dataset.sourceConfig.primaryDataModelId || '');
    setRelations(dataset.sourceConfig.relations || []);
    setFieldSelections(dataset.fieldSelections.selections);
    setConflictResolutions(dataset.fieldSelections.conflictResolutions);
    setIsModalVisible(true);
  };

  const handleView = (dataset: Dataset) => {
    message.info(`查看数据集: ${dataset.datasetName}`);
  };

  const handleToggleStatus = (dataset: Dataset) => {
    const newStatus = dataset.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setDatasets(prev => 
      prev.map(item => 
        item.id === dataset.id 
          ? { ...item, status: newStatus }
          : item
      )
    );
    message.success(`${dataset.datasetName} 已${newStatus === 'ACTIVE' ? '启用' : '禁用'}`);
  };

  const handleDelete = (id: string) => {
    setDatasets(prev => prev.filter(item => item.id !== id));
    message.success('数据集删除成功');
  };

  const handleAddRelation = () => {
    const newRelation: DatasetRelation = {
      relatedDataModelId: '',
      joinType: 'LEFT_JOIN',
      joinCondition: ''
    };
    setRelations(prev => [...prev, newRelation]);
  };

  const handleGenerateFields = () => {
    const primaryModel = availableModels.find(m => m.id === selectedPrimaryModel);
    if (!primaryModel) return;

    let allFields: any[] = [];
    
    // 添加主模型字段
    primaryModel.fields.forEach(field => {
      if (field.role !== 'UNUSED') {
        allFields.push({
          ...field,
          sourceModel: primaryModel.dataModelName,
          sourceModelId: primaryModel.id,
          identity: field.role === 'DIMENSION_FK' ? `维度: ${field.mappingTargetId}` : 
                   field.role === 'MEASURE_IMPL' ? `指标: ${field.mappingTargetId}` : '描述性属性'
        });
      }
    });

    // 添加关联模型字段
    relations.forEach(relation => {
      const relatedModel = availableModels.find(m => m.id === relation.relatedDataModelId);
      if (relatedModel) {
        relatedModel.fields.forEach(field => {
          if (field.role !== 'UNUSED') {
            allFields.push({
              ...field,
              sourceModel: relatedModel.dataModelName,
              sourceModelId: relatedModel.id,
              identity: field.role === 'DIMENSION_FK' ? `维度: ${field.mappingTargetId}` : 
                       field.role === 'MEASURE_IMPL' ? `指标: ${field.mappingTargetId}` : '描述性属性'
            });
          }
        });
      }
    });

    setAvailableFields(allFields);

    // 初始化字段选择
    const initialSelections: FieldSelection[] = allFields.map(field => ({
      sourceFieldId: field.fieldId,
      alias: field.businessName,
      selected: true
    }));
    setFieldSelections(initialSelections);

    // 检测冲突
    const conceptGroups: Record<string, any[]> = {};
    allFields.forEach(field => {
      if (field.mappingTargetId) {
        if (!conceptGroups[field.mappingTargetId]) {
          conceptGroups[field.mappingTargetId] = [];
        }
        conceptGroups[field.mappingTargetId].push(field);
      }
    });

    const detectedConflicts = Object.entries(conceptGroups)
      .filter(([_, fields]) => fields.length > 1)
      .map(([conceptId, fields]) => ({ conceptId, fields }));

    setConflicts(detectedConflicts);

    // 初始化冲突解决方案（默认选择主模型的字段）
    const initialResolutions: ConflictResolution[] = detectedConflicts.map(conflict => ({
      conceptId: conflict.conceptId,
      dominantAlias: conflict.fields.find(f => f.sourceModelId === selectedPrimaryModel)?.businessName || conflict.fields[0].businessName
    }));
    setConflictResolutions(initialResolutions);
  };

  const handleRemoveRelation = (index: number) => {
    setRelations(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateRelation = (index: number, updates: Partial<DatasetRelation>) => {
    setRelations(prev => 
      prev.map((relation, i) => 
        i === index ? { ...relation, ...updates } : relation
      )
    );
  };

  const handleLoadFields = () => {
    if (!selectedPrimaryModel) {
      message.warning('请先选择主数据模型');
      return;
    }
    handleGenerateFields();
  };

  const handleFieldSelectionChange = (fieldId: string, checked: boolean) => {
    setFieldSelections(prev => 
      prev.map(selection => 
        selection.sourceFieldId === fieldId 
          ? { ...selection, selected: checked }
          : selection
      )
    );
  };

  const handleFieldAliasChange = (fieldId: string, alias: string) => {
    setFieldSelections(prev => 
      prev.map(selection => 
        selection.sourceFieldId === fieldId 
          ? { ...selection, alias }
          : selection
      )
    );
  };

  const handleConflictResolutionChange = (conceptId: string, dominantAlias: string) => {
    setConflictResolutions(prev => 
      prev.map(resolution => 
        resolution.conceptId === conceptId 
          ? { ...resolution, dominantAlias }
          : resolution
      )
    );
  };

  const handleRemoveField = (fieldId: string) => {
    setAvailableFields(prev => prev.filter(field => field.fieldId !== fieldId));
    setFieldSelections(prev => prev.filter(selection => selection.sourceFieldId !== fieldId));
    message.success('字段已删除');
  };

  const handleAddFieldFromModal = (selectedFields: any[]) => {
    const newFields = selectedFields.filter(field => 
      !availableFields.some(existing => existing.fieldId === field.fieldId)
    );
    
    if (newFields.length > 0) {
      setAvailableFields(prev => [...prev, ...newFields]);
      
      const newSelections = newFields.map(field => ({
        sourceFieldId: field.fieldId,
        alias: field.businessName,
        selected: true
      }));
      setFieldSelections(prev => [...prev, ...newSelections]);
      
      message.success(`已添加 ${newFields.length} 个字段`);
    }
    
    setIsAddFieldModalVisible(false);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      // 根据数据源类型构建不同的sourceConfig
      let sourceConfig: any = {
        type: values.buildType
      };
      
      switch (values.buildType) {
        case 'DATA_MODEL':
          sourceConfig = {
            ...sourceConfig,
            primaryDataModelId: selectedPrimaryModel,
            relations: relations
          };
          break;
        case 'EXCEL':
          sourceConfig = {
            ...sourceConfig,
            excelConfig: {
              fileName: values.excelFileName,
              sheetName: values.excelSheetName
            }
          };
          break;
        case 'RAW_SQL':
          sourceConfig = {
            ...sourceConfig,
            customSql: values.customSql
          };
          break;
        case 'API':
          let headers = {};
          if (values.apiHeaders) {
            try {
              headers = JSON.parse(values.apiHeaders);
            } catch (e) {
              message.error('请求头格式不正确，请输入有效的JSON格式');
              return;
            }
          }
          sourceConfig = {
            ...sourceConfig,
            apiConfig: {
              endpoint: values.apiEndpoint,
              method: values.apiMethod,
              headers: headers
            }
          };
          break;
      }
      
      const datasetData: Dataset = {
        id: editingDataset?.id || `ds_${Date.now()}`,
        datasetCode: values.datasetCode,
        datasetName: values.datasetName,
        analysisTheme: values.analysisTheme,
        sourceConfig: sourceConfig,
        fieldSelections: {
          selections: fieldSelections,
          conflictResolutions: conflictResolutions
        },
        status: 'ACTIVE',
        createdBy: editingDataset?.createdBy || '当前用户',
        createdAt: editingDataset?.createdAt || new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      };

      if (editingDataset) {
        setDatasets(prev => 
          prev.map(item => item.id === editingDataset.id ? datasetData : item)
        );
        message.success('数据集更新成功');
      } else {
        setDatasets(prev => [...prev, datasetData]);
        message.success('数据集创建成功');
      }
      
      setIsModalVisible(false);
    } catch (error) {
      console.error('保存失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setCurrentStep(0);
    form.resetFields();
    setBuildType('');
    setSelectedPrimaryModel('');
    setRelations([]);
    setAvailableFields([]);
    setFieldSelections([]);
    setConflicts([]);
    setConflictResolutions([]);
  };

  const steps = [
    {
      title: '基本信息',
      content: 'basic-info'
    },
    {
      title: '关联模型',
      content: 'data-source'
    },
    {
      title: '字段选择',
      content: 'field-selection'
    }
  ];

  const renderBasicInfo = () => (
    <div>
      <Form.Item
        label="数据集编码"
        name="datasetCode"
        rules={[{ required: true, message: '请输入数据集编码' }]}
      >
        <Input placeholder="如: DS_PURCHASE_FULL_LINK" />
      </Form.Item>
      
      <Form.Item
        label="数据集名称"
        name="datasetName"
        rules={[{ required: true, message: '请输入数据集名称' }]}
      >
        <Input placeholder="如: 采购全链路融合分析" />
      </Form.Item>
      
      <Form.Item
        label="分析主题"
        name="analysisTheme"
        rules={[{ required: true, message: '请选择分析主题' }]}
      >
        <Select placeholder="请选择分析主题">
          <Option value="采购分析">采购分析</Option>
          <Option value="供应商分析">供应商分析</Option>
          <Option value="销售分析">销售分析</Option>
          <Option value="财务分析">财务分析</Option>
          <Option value="库存分析">库存分析</Option>
          <Option value="客户分析">客户分析</Option>
          <Option value="运营分析">运营分析</Option>
          <Option value="风险分析">风险分析</Option>
        </Select>
      </Form.Item>
      
      <Form.Item
        label="数据集描述"
        name="datasetDesc"
        rules={[{ required: true, message: '请输入数据集描述' }]}
      >
        <Input.TextArea 
          placeholder="包含超音数访问统计相关的指标和维度等"
          rows={4}
        />
      </Form.Item>
    </div>
  );

  const renderDataSourceConfig = () => (
    <div>
      <Form.Item
        label="数据源类型"
        name="buildType"
        rules={[{ required: true, message: '请选择数据源类型' }]}
      >
        <Select 
          placeholder="请选择数据源类型"
          onChange={(value) => setBuildType(value)}
        >
          <Option value="DATA_MODEL">数据模型</Option>
          <Option value="EXCEL">Excel</Option>
          <Option value="RAW_SQL">原始SQL</Option>
          <Option value="API">API接口</Option>
        </Select>
      </Form.Item>
      
      {buildType === 'EXCEL' && (
        <div className="mb-4">
          <h4 className="text-md font-medium mb-2">Excel文件配置</h4>
          <Form.Item
            label="上传Excel文件"
            name="excelFile"
            rules={[{ required: true, message: '请上传Excel文件' }]}
          >
            <Upload
              accept=".xlsx,.xls"
              maxCount={1}
              beforeUpload={() => false}
              onChange={(info) => {
                if (info.file) {
                  form.setFieldsValue({ excelFileName: info.file.name });
                }
              }}
            >
              <Button>选择Excel文件</Button>
            </Upload>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="文件名"
                name="excelFileName"
              >
                <Input placeholder="文件名将自动填充" disabled />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="工作表名称"
                name="excelSheetName"
                rules={[{ required: true, message: '请输入工作表名称' }]}
              >
                <Input placeholder="如: Sheet1" />
              </Form.Item>
            </Col>
          </Row>
        </div>
      )}
      
      {buildType === 'RAW_SQL' && (
        <div className="mb-4">
          <h4 className="text-md font-medium mb-2">SQL配置</h4>
          <Form.Item
            label="自定义SQL"
            name="customSql"
            rules={[{ required: true, message: '请输入SQL语句' }]}
          >
            <Input.TextArea
              rows={6}
              placeholder="请输入SQL查询语句，如：SELECT * FROM table_name WHERE condition"
            />
          </Form.Item>
        </div>
      )}
      
      {buildType === 'API' && (
        <div className="mb-4">
          <h4 className="text-md font-medium mb-2">API接口配置</h4>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                label="API地址"
                name="apiEndpoint"
                rules={[{ required: true, message: '请输入API地址' }]}
              >
                <Input placeholder="如: https://api.example.com/data" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="请求方法"
                name="apiMethod"
                rules={[{ required: true, message: '请选择请求方法' }]}
              >
                <Select placeholder="请求方法">
                  <Option value="GET">GET</Option>
                  <Option value="POST">POST</Option>
                  <Option value="PUT">PUT</Option>
                  <Option value="DELETE">DELETE</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
             label="请求头"
             name="apiHeaders"
           >
             <Input.TextArea
               rows={3}
               placeholder='请输入JSON格式的请求头，如：{"Content-Type": "application/json", "Authorization": "Bearer token"}'
             />
           </Form.Item>
        </div>
      )}
      
      {buildType === 'DATA_MODEL' && (
        <div>
          <h4 className="text-md font-medium mb-4">数据模型组合与关联</h4>
          
          <Form.Item
            label="主数据模型"
            name="primaryDataModelId"
            rules={[{ required: buildType === 'DATA_MODEL', message: '请选择主数据模型' }]}
          >
            <Select 
              placeholder="选择主数据模型"
              value={selectedPrimaryModel}
                onChange={setSelectedPrimaryModel}
              >
                {availableModels.map(model => (
                  <Option key={model.id} value={model.id}>
                    {model.dataModelName}
                  </Option>
                ))}
              </Select>
            </Form.Item>
        
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">关联数据模型</span>
                <Button type="dashed" onClick={handleAddRelation}>
                  + 添加关联数据模型
                </Button>
              </div>
              
              {relations.map((relation, index) => (
                <Card key={index} size="small" className="mb-2">
                  <Row gutter={16} align="middle">
                    <Col span={6}>
                      <Select
                        placeholder="选择关联模型"
                        value={relation.relatedDataModelId}
                        onChange={(value) => handleUpdateRelation(index, { relatedDataModelId: value })}
                        style={{ width: '100%' }}
                      >
                        {availableModels
                          .filter(model => model.id !== selectedPrimaryModel)
                          .map(model => (
                            <Option key={model.id} value={model.id}>
                              {model.dataModelName}
                            </Option>
                          ))
                        }
                      </Select>
                    </Col>
                    <Col span={4}>
                      <Select
                        value={relation.joinType}
                        onChange={(value) => handleUpdateRelation(index, { joinType: value })}
                        style={{ width: '100%' }}
                      >
                        <Option value="LEFT_JOIN">LEFT JOIN</Option>
                        <Option value="RIGHT_JOIN">RIGHT JOIN</Option>
                        <Option value="INNER_JOIN">INNER JOIN</Option>
                        <Option value="FULL_JOIN">FULL JOIN</Option>
                      </Select>
                    </Col>
                    <Col span={12}>
                      <Input
                        placeholder="关联条件，如: 主模型.产品编码 = 关联模型.产品编码"
                        value={relation.joinCondition}
                        onChange={(e) => handleUpdateRelation(index, { joinCondition: e.target.value })}
                      />
                    </Col>
                    <Col span={2}>
                      <Button 
                        type="link" 
                        danger 
                        onClick={() => handleRemoveRelation(index)}
                      >
                        删除
                      </Button>
                    </Col>
                  </Row>
                </Card>
              ))}
            </div>
            

          </div>
        )}
      </div>
    );
  
  const renderFieldSelection = () => (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h4 className="text-md font-medium">字段选择与配置</h4>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddFieldModalVisible(true)}>
          添加字段
        </Button>
      </div>
      
      {availableFields.length > 0 && (
        <div className="mb-6">
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b">
              <Row gutter={16}>
                <Col span={4}><strong>字段编码</strong></Col>
                <Col span={4}><strong>字段名</strong></Col>
                <Col span={4}><strong>所属模型</strong></Col>
                <Col span={4}><strong>显示名称</strong></Col>
                <Col span={4}><strong>字段类型</strong></Col>
                <Col span={4}><strong>操作</strong></Col>
              </Row>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {availableFields.map((field) => {
                const selection = fieldSelections.find(s => s.sourceFieldId === field.fieldId);
                return (
                  <div key={field.fieldId} className="px-4 py-3 border-b hover:bg-gray-50">
                    <Row gutter={16} align="middle">
                      <Col span={4}>
                        <span className="text-sm">{field.fieldId}</span>
                      </Col>
                      <Col span={4}>
                        <span className="text-sm font-medium">{field.businessName}</span>
                      </Col>
                      <Col span={4}>
                        <span className="text-sm">{field.sourceModel}</span>
                      </Col>
                      <Col span={4}>
                        <Input
                          size="small"
                          value={selection?.alias || field.businessName}
                          onChange={(e) => handleFieldAliasChange(field.fieldId, e.target.value)}
                        />
                      </Col>
                      <Col span={4}>
                        <span className="text-sm text-gray-600">{field.identity}</span>
                      </Col>
                      <Col span={4}>
                        <Button 
                          type="link" 
                          danger 
                          size="small"
                          onClick={() => handleRemoveField(field.fieldId)}
                        >
                          删除
                        </Button>
                      </Col>
                    </Row>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      

    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderBasicInfo();
      case 1:
        return renderDataSourceConfig();
      case 2:
        return renderFieldSelection();
      default:
        return renderBasicInfo();
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      // 从第一步到第二步时，自动加载字段
      if (currentStep === 1) {
        if (!selectedPrimaryModel) {
          message.warning('请先选择主数据模型');
          return;
        }
        handleGenerateFields();
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepButtons = () => (
    <div className="flex justify-end mt-6">
      <Space>
        <Button onClick={handleCancel}>取消</Button>
        {currentStep > 0 && (
          <Button onClick={handlePrev}>
            上一步
          </Button>
        )}
        {currentStep < steps.length - 1 ? (
          <Button type="primary" onClick={handleNext}>
            下一步
          </Button>
        ) : (
          <Button type="primary" onClick={handleSave} loading={loading}>
            保存数据集
          </Button>
        )}
      </Space>
    </div>
   );

  return (
    <div className="p-6">
      <Card>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">数据集管理</h2>
            <p className="text-gray-500 mt-1">组合多个已封装好的数据模型，通过选用、别名、最终形成可供分析的一站式数据集</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增数据集
          </Button>
        </div>
        
        <Table
          columns={columns}
          dataSource={datasets}
          rowKey="id"
          size="small"
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
        
        {datasets.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            暂无数据集，点击上方按钮创建第一个数据集
          </div>
        )}
      </Card>

      <Modal
        title={editingDataset ? '编辑数据集' : '创建数据集'}
        open={isModalVisible}
        onCancel={handleCancel}
        width={1200}
        footer={null}
      >
        <Steps current={currentStep} className="mb-6">
          {steps.map(item => (
            <Steps.Step key={item.title} title={item.title} />
          ))}
        </Steps>
        
        <Form form={form} layout="vertical">
          {renderStepContent()}
          {renderStepButtons()}
        </Form>
      </Modal>

      {/* 添加字段弹框 */}
      <Modal
        title="新增数据集字段"
        open={isAddFieldModalVisible}
        onCancel={() => setIsAddFieldModalVisible(false)}
        width={800}
        footer={null}
      >
        <AddFieldModal
          availableModels={availableModels}
          selectedPrimaryModel={selectedPrimaryModel}
          relations={relations}
          existingFields={availableFields}
          onAddFields={handleAddFieldFromModal}
          onCancel={() => setIsAddFieldModalVisible(false)}
        />
      </Modal>
    </div>
  );
};

// 添加字段弹框组件
interface AddFieldModalProps {
  availableModels: DataModel[];
  selectedPrimaryModel: string;
  relations: DatasetRelation[];
  existingFields: any[];
  onAddFields: (fields: any[]) => void;
  onCancel: () => void;
}

const AddFieldModal: React.FC<AddFieldModalProps> = ({
  availableModels,
  selectedPrimaryModel,
  relations,
  existingFields,
  onAddFields,
  onCancel
}) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  // 获取所有可用字段
  const getAllAvailableFields = () => {
    let allFields: any[] = [];
    
    // 添加主模型字段
    const primaryModel = availableModels.find(m => m.id === selectedPrimaryModel);
    if (primaryModel) {
      primaryModel.fields.forEach(field => {
        if (field.role !== 'UNUSED') {
          allFields.push({
            ...field,
            sourceModel: primaryModel.dataModelName,
            sourceModelId: primaryModel.id,
            identity: field.role === 'DIMENSION_FK' ? `维度: ${field.mappingTargetId}` : 
                     field.role === 'MEASURE_IMPL' ? `指标: ${field.mappingTargetId}` : '描述性属性'
          });
        }
      });
    }

    // 添加关联模型字段
    relations.forEach(relation => {
      const relatedModel = availableModels.find(m => m.id === relation.relatedDataModelId);
      if (relatedModel) {
        relatedModel.fields.forEach(field => {
          if (field.role !== 'UNUSED') {
            allFields.push({
              ...field,
              sourceModel: relatedModel.dataModelName,
              sourceModelId: relatedModel.id,
              identity: field.role === 'DIMENSION_FK' ? `维度: ${field.mappingTargetId}` : 
                       field.role === 'MEASURE_IMPL' ? `指标: ${field.mappingTargetId}` : '描述性属性'
            });
          }
        });
      }
    });

    // 过滤掉已存在的字段
    return allFields.filter(field => 
      !existingFields.some(existing => existing.fieldId === field.fieldId)
    );
  };

  const availableFieldsForAdd = getAllAvailableFields();

  const handleOk = () => {
    const fieldsToAdd = availableFieldsForAdd.filter(field => 
      selectedRowKeys.includes(field.fieldId)
    );
    
    onAddFields(fieldsToAdd);
    setSelectedRowKeys([]);
  };

  const handleCancel = () => {
    setSelectedRowKeys([]);
    onCancel();
  };

  const columns = [
    {
      title: '字段名称',
      dataIndex: 'businessName',
      key: 'businessName',
    },
    {
      title: '字段编码',
      dataIndex: 'fieldId',
      key: 'fieldId',
      render: (text: string) => <span className="font-mono text-sm">{text}</span>,
    },
    {
      title: '来源模型',
      dataIndex: 'sourceModel',
      key: 'sourceModel',
      render: (text: string) => <span className="text-sm">{text}</span>,
    },
    {
      title: '字段类型',
      dataIndex: 'identity',
      key: 'identity',
      render: (text: string) => {
        let color = 'default';
        if (text.includes('维度')) {
          color = 'blue';
        } else if (text.includes('指标')) {
          color = 'green';
        }
        return <Tag color={color}>{text}</Tag>;
      },
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys as string[]);
    },
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">
        从数据模型中选择要添加的字段（已选择 {selectedRowKeys.length} 个字段）：
      </div>
      
      {availableFieldsForAdd.length > 0 ? (
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={availableFieldsForAdd}
          rowKey="fieldId"
          pagination={false}
          scroll={{ y: 400 }}
          size="small"
        />
      ) : (
        <div className="text-center text-gray-500 py-8">
          没有可添加的字段
        </div>
      )}
      
      <div className="flex justify-end space-x-2">
        <Button onClick={handleCancel}>取消</Button>
        <Button 
          type="primary" 
          onClick={handleOk}
          disabled={selectedRowKeys.length === 0}
        >
          确定添加
        </Button>
      </div>
    </div>
  );
};

export default DatasetManagement;