import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Modal, Form, Input, Select, Space, message, Popconfirm, Tag, Row, Col, Steps } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, DatabaseOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

// 数据模型接口定义
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

// 数据模型字段接口定义
interface DataModelField {
  fieldId: string;
  sourceType: 'PHYSICAL' | 'CALCULATED';
  physicalName?: string;
  expression?: string;
  businessName: string;
  role: 'DIMENSION_FK' | 'MEASURE_IMPL' | 'DESCRIPTIVE' | 'UNUSED';
  relatedDimensionId?: string;
  relatedMetricId?: string;
  dataType?: string;
  fieldLength?: number;
  numericPrecision?: number;
  numericScale?: number;
  dateFormat?: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  componentType?: string;
}

// 数据库连接接口定义
interface DatabaseConnection {
  id: string;
  name: string;
  type: 'DORIS' | 'MYSQL';
  host: string;
  port: number;
  databases: string[];
}

// 数据库表接口定义
interface DatabaseTable {
  tableName: string;
  tableComment: string;
  fields: TableField[];
}

// 表字段接口定义
interface TableField {
  fieldName: string;
  fieldType: string;
  fieldComment: string;
}

// 模拟数据
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
        relatedDimensionId: 'DIM_PRODUCT'
      },
      {
        fieldId: 'dmf_002',
        sourceType: 'PHYSICAL',
        physicalName: 'supplier_code',
        businessName: '供应商编码',
        role: 'DIMENSION_FK',
        relatedDimensionId: 'DIM_SUPPLIER'
      },
      {
        fieldId: 'dmf_003',
        sourceType: 'CALCULATED',
        expression: 'net_price * (1 + tax_rate)',
        businessName: '协议价(含税)',
        role: 'MEASURE_IMPL',
        relatedMetricId: 'P001'
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
        physicalName: 'order_code',
        businessName: '订单编号',
        role: 'DESCRIPTIVE'
      },
      {
        fieldId: 'dmf_102',
        sourceType: 'PHYSICAL',
        physicalName: 'order_price',
        businessName: '订单价格',
        role: 'MEASURE_IMPL',
        relatedMetricId: 'P001'
      }
    ],
    status: 'ACTIVE',
    createdBy: '李四',
    createdAt: '2025-01-18',
    updatedAt: '2025-01-19'
  }
];

const DataModelManagement: React.FC = () => {
  const [dataModels, setDataModels] = useState<DataModel[]>(mockDataModels);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingModel, setEditingModel] = useState<DataModel | null>(null);
  const [form] = Form.useForm();
  const [loading] = useState(false);
  
  // 步骤相关状态
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedDatabase, setSelectedDatabase] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableFields, setTableFields] = useState<TableField[]>([]);
  const [modelFields, setModelFields] = useState<DataModelField[]>([]);
  
  // 弹窗状态
  const [metricModalVisible, setMetricModalVisible] = useState(false);
  const [dimensionModalVisible, setDimensionModalVisible] = useState(false);
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [currentFieldId, setCurrentFieldId] = useState<string>('');

  // 模拟数据库连接
  const mockConnections: DatabaseConnection[] = [
    {
      id: 'conn_001',
      name: 'Doris生产环境',
      type: 'DORIS',
      host: '192.168.1.100',
      port: 9030,
      databases: ['yyigou_dsrp', 'ods_layer', 'dwd_layer']
    },
    {
      id: 'conn_002',
      name: 'MySQL业务库',
      type: 'MYSQL',
      host: '192.168.1.101',
      port: 3306,
      databases: ['business_db', 'user_db']
    }
  ];

  // 模拟数据库表
  const mockTables: Record<string, DatabaseTable[]> = {
    'yyigou_dsrp': [
      {
        tableName: 'dwd_purchase_agreements',
        tableComment: '采购协议明细表',
        fields: [
          { fieldName: 'agreement_code', fieldType: 'VARCHAR(50)', fieldComment: '协议编号' },
          { fieldName: 'product_code', fieldType: 'VARCHAR(50)', fieldComment: '产品编码' },
          { fieldName: 'supplier_code', fieldType: 'VARCHAR(50)', fieldComment: '供应商编码' },
          { fieldName: 'net_price', fieldType: 'DECIMAL(10,2)', fieldComment: '净价' },
          { fieldName: 'tax_rate', fieldType: 'DECIMAL(5,4)', fieldComment: '税率' },
          { fieldName: 'brand_name', fieldType: 'VARCHAR(100)', fieldComment: '品牌名称' }
        ]
      },
      {
        tableName: 'dwd_purchase_orders',
        tableComment: '采购订单明细表',
        fields: [
          { fieldName: 'order_code', fieldType: 'VARCHAR(50)', fieldComment: '订单编号' },
          { fieldName: 'product_code', fieldType: 'VARCHAR(50)', fieldComment: '产品编码' },
          { fieldName: 'supplier_code', fieldType: 'VARCHAR(50)', fieldComment: '供应商编码' },
          { fieldName: 'order_price', fieldType: 'DECIMAL(10,2)', fieldComment: '订单价格' },
          { fieldName: 'order_quantity', fieldType: 'INT', fieldComment: '订单数量' }
        ]
      }
    ]
  };

  useEffect(() => {
    // 初始化数据
  }, []);

  // 表格列定义
  const columns = [
    {
      title: '模型编码',
      dataIndex: 'dataModelCode',
      key: 'dataModelCode',
      width: 150,
      fixed: 'left' as const,
    },
    {
      title: '模型名称',
      dataIndex: 'dataModelName',
      key: 'dataModelName',
      width: 200,
      fixed: 'left' as const,
      render: (text: string, record: DataModel) => (
        <Button type="link" onClick={() => handleView(record)} style={{ padding: 0 }}>
          {text}
        </Button>
      ),
    },
    {
      title: '数据源类型',
      dataIndex: 'dataSourceType',
      key: 'dataSourceType',
      width: 120,
      render: (type: string) => (
        <Tag icon={<DatabaseOutlined />} color={type === 'DORIS' ? 'blue' : 'green'}>
          {type}
        </Tag>
      ),
    },
    {
      title: '数据库',
      dataIndex: 'databaseName',
      key: 'databaseName',
      width: 150,
    },
    {
      title: '源表',
      dataIndex: 'sourceTableName',
      key: 'sourceTableName',
      width: 200,
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
      fixed: 'right' as const,
      render: (_: any, record: DataModel) => (
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
            title="确定要删除这个数据模型吗？"
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
    setEditingModel(null);
    setCurrentStep(0);
    setSelectedDatabase('');
    setSelectedTable('');
    setTableFields([]);
    setModelFields([]);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (model: DataModel) => {
    setEditingModel(model);
    setCurrentStep(0);
    setSelectedDatabase(model.databaseName);
    setSelectedTable(model.sourceTableName);
    setModelFields(model.fields);
    form.setFieldsValue({
      dataModelCode: model.dataModelCode,
      dataModelName: model.dataModelName,
      dataModelDesc: model.dataModelDesc,
      dataSourceType: model.dataSourceType,
      databaseName: model.databaseName,
      sourceTableName: model.sourceTableName
    });
    setIsModalVisible(true);
  };

  const handleView = (model: DataModel) => {
    // 查看详情逻辑
  };

  const handleToggleStatus = (model: DataModel) => {
    const newStatus = model.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setDataModels(prev => prev.map(item => 
      item.id === model.id ? { ...item, status: newStatus } : item
    ));
    message.success(`数据模型已${newStatus === 'ACTIVE' ? '启用' : '禁用'}`);
  };

  const handleDelete = (id: string) => {
    setDataModels(prev => prev.filter(item => item.id !== id));
    message.success('数据模型删除成功');
  };

  const handleDatabaseChange = (databaseName: string) => {
    setSelectedDatabase(databaseName);
    setSelectedTable('');
    setTableFields([]);
    setModelFields([]);
  };

  const handleTableChange = (tableName: string) => {
    setSelectedTable(tableName);
    const tables = mockTables[selectedDatabase] || [];
    const selectedTableData = tables.find(table => table.tableName === tableName);
    if (selectedTableData) {
      setTableFields(selectedTableData.fields);
      // 自动创建模型字段
      const autoFields: DataModelField[] = selectedTableData.fields.map((field, index) => ({
        fieldId: `dmf_${Date.now()}_${index}`,
        sourceType: 'PHYSICAL',
        physicalName: field.fieldName,
        businessName: field.fieldComment || field.fieldName,
        role: 'DESCRIPTIVE',
        dataType: field.fieldType.includes('VARCHAR') ? '字符串' : 
                 field.fieldType.includes('DECIMAL') ? '小数' : 
                 field.fieldType.includes('INT') ? '整数' : '字符串',
        fieldLength: field.fieldType.includes('VARCHAR') ? 
                    parseInt(field.fieldType.match(/\((\d+)\)/)?.[1] || '50') : undefined,
        numericPrecision: field.fieldType.includes('DECIMAL') ? 
                         parseInt(field.fieldType.match(/\((\d+),\d+\)/)?.[1] || '10') : undefined,
        numericScale: field.fieldType.includes('DECIMAL') ? 
                     parseInt(field.fieldType.match(/\(\d+,(\d+)\)/)?.[1] || '2') : undefined,
        isPrimaryKey: false,
        isForeignKey: false,
        componentType: '文本框'
      }));
      setModelFields(autoFields);
    }
  };

  const addModelFields = (fields: any[]) => {
    setModelFields(prev => [...prev, ...fields]);
    setShowAddFieldModal(false);
  };

  const handleNext = async () => {
    if (currentStep === 0) {
      try {
        await form.validateFields(['dataModelCode', 'dataModelName', 'dataModelDesc']);
        setCurrentStep(1);
      } catch (error) {
        if (error instanceof Error) {
          message.error('请填写完整的基本信息');
        }
      }
    }
  };

  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const newModel: DataModel = {
        id: editingModel?.id || `dm_${Date.now()}`,
        ...values,
        fields: modelFields,
        status: editingModel?.status || 'ACTIVE',
        createdBy: editingModel?.createdBy || '当前用户',
        createdAt: editingModel?.createdAt || new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
      };

      if (editingModel) {
        setDataModels(prev => prev.map(item => item.id === editingModel.id ? newModel : item));
        message.success('数据模型更新成功');
      } else {
        setDataModels(prev => [...prev, newModel]);
        message.success('数据模型创建成功');
      }
      setIsModalVisible(false);
    } catch (error) {
      message.error('保存失败，请检查表单信息');
    }
  };

  const updateFieldMapping = (fieldId: string, updates: Partial<DataModelField>) => {
    setModelFields(prev => prev.map(field => 
      field.fieldId === fieldId ? { ...field, ...updates } : field
    ));
  };

  const removeField = (fieldId: string) => {
    setModelFields(prev => prev.filter(field => field.fieldId !== fieldId));
  };

  const handleSelectMetric = (metricId: string) => {
    if (currentFieldId) {
      updateFieldMapping(currentFieldId, { relatedMetricId: metricId, role: 'MEASURE_IMPL' });
    }
    setMetricModalVisible(false);
    setCurrentFieldId('');
  };

  const handleSelectDimension = (dimensionId: string) => {
    if (currentFieldId) {
      updateFieldMapping(currentFieldId, { relatedDimensionId: dimensionId, role: 'DIMENSION_FK' });
    }
    setDimensionModalVisible(false);
    setCurrentFieldId('');
  };

  const openMetricModal = (fieldId: string) => {
    setCurrentFieldId(fieldId);
    setMetricModalVisible(true);
  };

  const openDimensionModal = (fieldId: string) => {
    setCurrentFieldId(fieldId);
    setDimensionModalVisible(true);
  };

  const getUnselectedFields = () => {
    return tableFields.filter(tableField => 
      !modelFields.some(modelField => modelField.physicalName === tableField.fieldName)
    );
  };

  const steps = [
    {
      title: '基本信息',
      description: '填写数据模型基本信息',
    },
    {
      title: '数据源配置',
      description: '选择数据源和物理表',
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">数据模型管理</h1>
          <p className="text-gray-600 mt-1">管理和配置数据模型，定义业务字段映射关系</p>
        </div>
        <div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建数据模型
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={dataModels}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1400 }}
        pagination={{
          total: dataModels.length,
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
        }}
      />

      <Modal
        title={editingModel ? '编辑数据模型' : '新建数据模型'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        width={1200}
        footer={
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setIsModalVisible(false)}>取消</Button>
            {currentStep > 0 && (
              <Button onClick={handlePrev}>上一步</Button>
            )}
            {currentStep < steps.length - 1 ? (
              <Button type="primary" onClick={handleNext}>下一步</Button>
            ) : (
              <Button type="primary" onClick={handleSave}>保存</Button>
            )}
          </div>
        }
      >
        <div className="mb-6">
          <Steps current={currentStep} items={steps} />
        </div>

        <Form form={form} layout="vertical" className="data-model-form">
          {currentStep === 0 && (
            <div>
              <Form.Item
                label="模型编码"
                name="dataModelCode"
                rules={[{ required: true, message: '请输入模型编码' }]}
              >
                <Input placeholder="请输入模型编码，如：DM_AGREEMENT" />
              </Form.Item>
              <Form.Item
                label="模型名称"
                name="dataModelName"
                rules={[{ required: true, message: '请输入模型名称' }]}
              >
                <Input placeholder="请输入模型名称" />
              </Form.Item>
              <Form.Item
                label="模型描述"
                name="dataModelDesc"
                rules={[{ required: true, message: '请输入模型描述' }]}
              >
                <TextArea rows={3} placeholder="请输入模型描述" />
              </Form.Item>
            </div>
          )}

          {currentStep === 1 && (
            <div>
              <Form.Item
                label="数据源类型"
                name="dataSourceType"
                rules={[{ required: true, message: '请选择数据源类型' }]}
              >
                <Select placeholder="请选择数据源类型">
                  <Option value="DORIS">DORIS</Option>
                  <Option value="MYSQL">MYSQL</Option>
                </Select>
              </Form.Item>
              <Form.Item
                label="数据库名称"
                name="databaseName"
                rules={[{ required: true, message: '请选择数据库' }]}
              >
                <Select 
                  placeholder="请选择数据库"
                  onChange={handleDatabaseChange}
                  value={selectedDatabase}
                >
                  {Object.keys(mockTables).map(dbName => (
                    <Option key={dbName} value={dbName}>{dbName}</Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                label="关联物理表"
                name="sourceTableName"
                rules={[{ required: true, message: '请选择物理表' }]}
              >
                <Select 
                  placeholder="请选择物理表"
                  onChange={handleTableChange}
                  value={selectedTable}
                  disabled={!selectedDatabase}
                >
                  {(mockTables[selectedDatabase] || []).map(table => (
                    <Option key={table.tableName} value={table.tableName}>
                      {table.tableName} ({table.tableComment})
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              {selectedTable && tableFields.length > 0 && (
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">模型字段属性管理</h3>
                    <Button
                      type="primary"
                      onClick={() => setShowAddFieldModal(true)}
                    >
                      添加字段
                    </Button>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <div className="min-w-[1320px]">
                        <div className="bg-gray-50 px-4 py-2 border-b">
                          <div className="grid gap-4 items-center" style={{gridTemplateColumns: '120px 150px 100px 140px 80px 80px 90px 80px 80px 120px 80px'}}>
                            <div><strong>字段编码</strong></div>
                            <div><strong>字段名</strong></div>
                            <div><strong>数据类型</strong></div>
                            <div><strong>日期格式</strong></div>
                            <div><strong>字段长度</strong></div>
                            <div><strong>数值精度</strong></div>
                            <div><strong>数值小数位</strong></div>
                            <div><strong>是否主键</strong></div>
                            <div><strong>是否外键</strong></div>
                            <div><strong>组件类型</strong></div>
                            <div><strong>操作</strong></div>
                          </div>
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                          {modelFields.map((field) => (
                            <div key={field.fieldId} className="px-4 py-3 border-b hover:bg-gray-50">
                              <div className="grid gap-4 items-center" style={{gridTemplateColumns: '120px 150px 100px 140px 80px 80px 90px 80px 80px 120px 80px'}}>
                                <div>
                                  <span className="font-mono text-sm truncate block">{field.physicalName || field.fieldId}</span>
                                </div>
                                <div>
                                  <Input
                                    value={field.businessName}
                                    onChange={(e) => updateFieldMapping(field.fieldId, { businessName: e.target.value })}
                                    placeholder="字段名"
                                    size="small"
                                  />
                                </div>
                                <div>
                                  <Select
                                    value={field.dataType || '字符串'}
                                    onChange={(value) => updateFieldMapping(field.fieldId, { dataType: value })}
                                    size="small"
                                    style={{ width: '100%' }}
                                  >
                                    <Option value="整数">整数</Option>
                                    <Option value="小数">小数</Option>
                                    <Option value="字符串">字符串</Option>
                                    <Option value="日期">日期</Option>
                                    <Option value="时间">时间</Option>
                                    <Option value="布尔">布尔</Option>
                                  </Select>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-600">
                                    {field.dataType === '日期' || field.dataType === '时间' ? (field.dateFormat || 'yyyy-MM-dd') : '-'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-600">
                                    {field.fieldLength || '-'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-600">
                                    {field.dataType === '小数' ? (field.numericPrecision || '-') : '-'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-600">
                                    {field.dataType === '小数' ? (field.numericScale || '-') : '-'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-600">
                                    {field.isPrimaryKey ? '是' : '否'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-600">
                                    {field.isForeignKey ? '是' : '否'}
                                  </span>
                                </div>
                                <div>
                                  <Select
                                    value={field.componentType || '文本框'}
                                    onChange={(value) => updateFieldMapping(field.fieldId, { componentType: value })}
                                    size="small"
                                    style={{ width: '100%' }}
                                  >
                                    <Option value="文本框">文本框</Option>
                                    <Option value="下拉框">下拉框</Option>
                                    <Option value="弹框单选">弹框单选</Option>
                                    <Option value="弹框多选">弹框多选</Option>
                                    <Option value="日期选择器">日期选择器</Option>
                                    <Option value="时间选择器">时间选择器</Option>
                                    <Option value="日期时间选择器">日期时间选择器</Option>
                                    <Option value="数字选择器">数字选择器</Option>
                                    <Option value="文件上传">文件上传</Option>
                                  </Select>
                                </div>
                                <div>
                                  <Button
                                    type="link"
                                    danger
                                    size="small"
                                    onClick={() => removeField(field.fieldId)}
                                  >
                                    删除
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Form>
      </Modal>

      {/* 指标选择弹窗 */}
      <MetricSelectModal
        visible={metricModalVisible}
        onCancel={() => {
          setMetricModalVisible(false);
          setCurrentFieldId('');
        }}
        onSelect={handleSelectMetric}
      />

      {/* 维度选择弹窗 */}
      <DimensionSelectModal
        visible={dimensionModalVisible}
        onCancel={() => {
          setDimensionModalVisible(false);
          setCurrentFieldId('');
        }}
        onSelect={handleSelectDimension}
      />

      {/* 添加字段弹窗 */}
      <AddFieldModal
        visible={showAddFieldModal}
        onCancel={() => setShowAddFieldModal(false)}
        onAddFields={addModelFields}
        availableFields={getUnselectedFields()}
      />
    </div>
  );
};

// 指标选择弹窗组件
interface MetricSelectModalProps {
  visible: boolean;
  onCancel: () => void;
  onSelect: (metricId: string) => void;
}

const MetricSelectModal: React.FC<MetricSelectModalProps> = ({ visible, onCancel, onSelect }) => {
  const [searchText, setSearchText] = useState('');
  const [selectedMetric, setSelectedMetric] = useState<string>('');

  // 模拟指标数据
  const mockMetrics = [
    { id: 'M001', code: 'PRICE_WITH_TAX', name: '含税价格' },
    { id: 'M002', code: 'NET_PRICE', name: '净价' },
    { id: 'M003', code: 'TAX_AMOUNT', name: '税额' },
    { id: 'M004', code: 'DISCOUNT_RATE', name: '折扣率' },
    { id: 'M005', code: 'TOTAL_AMOUNT', name: '总金额' },
  ];

  const filteredMetrics = mockMetrics.filter(metric => 
    !searchText || 
    metric.name.toLowerCase().includes(searchText.toLowerCase()) ||
    metric.code.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleOk = () => {
    if (selectedMetric) {
      onSelect(selectedMetric);
    }
  };

  const handleCancel = () => {
    setSelectedMetric('');
    setSearchText('');
    onCancel();
  };

  return (
    <Modal
      title="选择关联指标"
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="确定"
      cancelText="取消"
      width={600}
      okButtonProps={{ disabled: !selectedMetric }}
    >
      <div className="space-y-4">
        <Input.Search
          placeholder="根据指标编号/名称搜索"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
        
        <div className="max-h-96 overflow-y-auto border rounded">
          {filteredMetrics.map(metric => (
            <div
              key={metric.id}
              className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                selectedMetric === metric.id ? 'bg-blue-50 border-blue-200' : ''
              }`}
              onClick={() => setSelectedMetric(metric.id)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{metric.name}</div>
                  <div className="text-sm text-gray-500 font-mono">{metric.code}</div>
                </div>
                {selectedMetric === metric.id && (
                  <div className="text-blue-600">✓</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

// 维度选择弹窗组件
interface DimensionSelectModalProps {
  visible: boolean;
  onCancel: () => void;
  onSelect: (dimensionId: string) => void;
}

const DimensionSelectModal: React.FC<DimensionSelectModalProps> = ({ visible, onCancel, onSelect }) => {
  const [searchText, setSearchText] = useState('');
  const [selectedDimension, setSelectedDimension] = useState<string>('');

  // 模拟维度数据
  const mockDimensions = [
    { id: 'DIM_PRODUCT', code: 'DIM_PRODUCT', name: '产品维度' },
    { id: 'DIM_SUPPLIER', code: 'DIM_SUPPLIER', name: '供应商维度' },
    { id: 'DIM_TIME', code: 'DIM_TIME', name: '时间维度' },
    { id: 'DIM_REGION', code: 'DIM_REGION', name: '地区维度' },
  ];

  const filteredDimensions = mockDimensions.filter(dimension => 
    !searchText || 
    dimension.name.toLowerCase().includes(searchText.toLowerCase()) ||
    dimension.code.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleOk = () => {
    if (selectedDimension) {
      onSelect(selectedDimension);
    }
  };

  const handleCancel = () => {
    setSelectedDimension('');
    setSearchText('');
    onCancel();
  };

  return (
    <Modal
      title="选择关联维度"
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="确定"
      cancelText="取消"
      width={600}
      okButtonProps={{ disabled: !selectedDimension }}
    >
      <div className="space-y-4">
        <Input.Search
          placeholder="根据维度编号/名称搜索"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
        
        <div className="max-h-96 overflow-y-auto border rounded">
          {filteredDimensions.map(dimension => (
            <div
              key={dimension.id}
              className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                selectedDimension === dimension.id ? 'bg-blue-50 border-blue-200' : ''
              }`}
              onClick={() => setSelectedDimension(dimension.id)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{dimension.name}</div>
                  <div className="text-sm text-gray-500 font-mono">{dimension.code}</div>
                </div>
                {selectedDimension === dimension.id && (
                  <div className="text-blue-600">✓</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

// 添加字段弹窗组件
interface AddFieldModalProps {
  visible: boolean;
  onCancel: () => void;
  onAddFields: (fields: any[]) => void;
  availableFields: any[];
}

const AddFieldModal: React.FC<AddFieldModalProps> = ({ visible, onCancel, onAddFields, availableFields }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  const handleOk = () => {
    const fieldsToAdd = availableFields
      .filter(field => selectedRowKeys.includes(field.fieldName))
      .map((field, index) => ({
        fieldId: `dmf_${Date.now()}_${index}`,
        sourceType: 'PHYSICAL',
        physicalName: field.fieldName,
        businessName: field.fieldComment || field.fieldName,
        role: 'DESCRIPTIVE',
        dataType: field.fieldType.includes('VARCHAR') ? '字符串' : 
                 field.fieldType.includes('DECIMAL') ? '小数' : 
                 field.fieldType.includes('INT') ? '整数' : '字符串',
        fieldLength: field.fieldType.includes('VARCHAR') ? 
                    parseInt(field.fieldType.match(/\((\d+)\)/)?.[1] || '50') : undefined,
        numericPrecision: field.fieldType.includes('DECIMAL') ? 
                         parseInt(field.fieldType.match(/\((\d+),\d+\)/)?.[1] || '10') : undefined,
        numericScale: field.fieldType.includes('DECIMAL') ? 
                     parseInt(field.fieldType.match(/\(\d+,(\d+)\)/)?.[1] || '2') : undefined,
        isPrimaryKey: false,
        isForeignKey: false,
        componentType: '文本框'
      }));
    
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
      dataIndex: 'fieldComment',
      key: 'fieldComment',
      render: (text: string, record: any) => text || record.fieldName,
    },
    {
      title: '字段编码',
      dataIndex: 'fieldName',
      key: 'fieldName',
      render: (text: string) => <span className="font-mono text-sm">{text}</span>,
    },
    {
      title: '数据类型',
      dataIndex: 'fieldType',
      key: 'fieldType',
      render: (text: string) => <span className="text-sm">{text}</span>,
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys as string[]);
    },
  };

  return (
    <Modal
      title="新增数据模型字段"
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="确定添加"
      cancelText="取消"
      width={800}
      okButtonProps={{ disabled: selectedRowKeys.length === 0 }}
    >
      <div className="space-y-4">
        <div className="text-sm text-gray-600">
          从物理表中选择要添加的字段（已选择 {selectedRowKeys.length} 个字段）：
        </div>
        
        {availableFields.length > 0 ? (
          <Table
            rowSelection={rowSelection}
            columns={columns}
            dataSource={availableFields}
            rowKey="fieldName"
            pagination={false}
            scroll={{ y: 400 }}
            size="small"
          />
        ) : (
          <div className="text-center text-gray-500 py-8">
            没有可添加的字段
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DataModelManagement;