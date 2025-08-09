import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Space, message, Tag, Popconfirm, Steps } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { Database, Layers, Key, FileText } from 'lucide-react';

const { Option } = Select;
const { TextArea } = Input;

// 接口定义
interface Dimension {
  id: string;
  dimensionCode: string;
  dimensionName: string;
  tableName: string;
  parentDimensionId?: string;
  parentDimensionName?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  fields: DimensionField[];
}

interface DimensionField {
  physicalName: string;
  businessName: string;
  role: 'PRIMARY_KEY' | 'DISPLAY_NAME' | 'GROUPABLE' | 'DESCRIPTIVE' | 'UNUSED';
}

interface DatabaseTable {
  tableName: string;
  tableComment: string;
  fields: TableField[];
}

interface TableField {
  fieldName: string;
  fieldType: string;
  fieldComment: string;
}

const DimensionManagement: React.FC = () => {
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [databaseTables, setDatabaseTables] = useState<DatabaseTable[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAssociateModalVisible, setIsAssociateModalVisible] = useState(false);
  const [editingDimension, setEditingDimension] = useState<Dimension | null>(null);
  const [associatingDimension, setAssociatingDimension] = useState<Dimension | null>(null);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableFields, setTableFields] = useState<TableField[]>([]);
  const [fieldRoles, setFieldRoles] = useState<{ [key: string]: string }>({});
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [associateForm] = Form.useForm();
  const [associateTableFields, setAssociateTableFields] = useState<TableField[]>([]);

  // 步骤定义
  const steps = [
    {
      title: '基本信息',
      description: '填写维度基本信息',
    },
    {
      title: '关联数据模型',
      description: '选择数据模型和定义字段角色',
    },
  ];

  // 步骤处理函数
  const handleNext = async () => {
    if (currentStep === 0) {
      try {
        await form.validateFields(['dimensionCode', 'dimensionName']);
        setCurrentStep(1);
      } catch (error) {
        message.error('请填写完整的基本信息');
      }
    }
  };

  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  // 模拟数据
  useEffect(() => {
    setDimensions([
      {
        id: 'dim_001',
        dimensionCode: 'DIM_PRODUCT',
        dimensionName: '产品',
        tableName: 'dim_products',
        status: 'ACTIVE',
        createdAt: '2025-01-15',
        updatedAt: '2025-01-20',
        fields: [
          { physicalName: 'product_code', businessName: '产品编码', role: 'PRIMARY_KEY' },
          { physicalName: 'product_name', businessName: '产品名称', role: 'DISPLAY_NAME' },
          { physicalName: 'category_name', businessName: '产品分类', role: 'GROUPABLE' },
          { physicalName: 'brand_name', businessName: '品牌', role: 'GROUPABLE' }
        ]
      },
      {
        id: 'dim_002',
        dimensionCode: 'DIM_BRAND',
        dimensionName: '品牌',
        tableName: 'dim_brands',
        parentDimensionId: 'dim_001',
        parentDimensionName: '产品',
        status: 'ACTIVE',
        createdAt: '2025-01-15',
        updatedAt: '2025-01-20',
        fields: [
          { physicalName: 'brand_code', businessName: '品牌编码', role: 'PRIMARY_KEY' },
          { physicalName: 'brand_name', businessName: '品牌名称', role: 'DISPLAY_NAME' }
        ]
      },
      {
        id: 'dim_003',
        dimensionCode: 'DIM_SUPPLIER',
        dimensionName: '供应商',
        tableName: 'dim_suppliers',
        status: 'ACTIVE',
        createdAt: '2025-01-15',
        updatedAt: '2025-01-20',
        fields: [
          { physicalName: 'supplier_code', businessName: '供应商编码', role: 'PRIMARY_KEY' },
          { physicalName: 'supplier_name', businessName: '供应商名称', role: 'DISPLAY_NAME' }
        ]
      }
    ]);

    setDatabaseTables([
      {
        tableName: 'dim_products',
        tableComment: '产品维度表',
        fields: [
          { fieldName: 'product_code', fieldType: 'VARCHAR(50)', fieldComment: '产品编码' },
          { fieldName: 'product_name', fieldType: 'VARCHAR(200)', fieldComment: '产品名称' },
          { fieldName: 'category_name', fieldType: 'VARCHAR(100)', fieldComment: '产品分类' },
          { fieldName: 'brand_name', fieldType: 'VARCHAR(100)', fieldComment: '品牌名称' },
          { fieldName: 'manufacturer', fieldType: 'VARCHAR(200)', fieldComment: '生产企业' },
          { fieldName: 'registration_no', fieldType: 'VARCHAR(100)', fieldComment: '注册证号' },
          { fieldName: 'create_date', fieldType: 'DATETIME', fieldComment: '创建日期' }
        ]
      },
      {
        tableName: 'dim_suppliers',
        tableComment: '供应商维度表',
        fields: [
          { fieldName: 'supplier_code', fieldType: 'VARCHAR(50)', fieldComment: '供应商编码' },
          { fieldName: 'supplier_name', fieldType: 'VARCHAR(200)', fieldComment: '供应商名称' },
          { fieldName: 'supplier_type', fieldType: 'VARCHAR(50)', fieldComment: '供应商类型' },
          { fieldName: 'contact_person', fieldType: 'VARCHAR(100)', fieldComment: '联系人' }
        ]
      }
    ]);
  }, []);

  const columns = [
    {
      title: '维度编码',
      dataIndex: 'dimensionCode',
      key: 'dimensionCode',
      width: 150,
    },
    {
      title: '维度名称',
      dataIndex: 'dimensionName',
      key: 'dimensionName',
      width: 150,
      render: (text: string, record: Dimension) => (
        <Button 
          type="link" 
          onClick={() => handleView(record)}
          style={{ padding: 0, height: 'auto' }}
        >
          {text}
        </Button>
      ),
    },
    {
      title: '关联的维度表',
      dataIndex: 'tableName',
      key: 'tableName',
      width: 180,
      render: (text: string, record: Dimension) => {
        if (!text || text === '') {
          return (
            <Button 
              type="link" 
              size="small"
              onClick={() => handleAssociateTable(record)}
            >
              关联维度表
            </Button>
          );
        }
        return text;
      },
    },
    {
      title: '上级维度',
      dataIndex: 'parentDimensionName',
      key: 'parentDimensionName',
      width: 120,
      render: (text: string) => text || '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config = status === 'ACTIVE' 
          ? { text: '启用', color: '#52c41a' }
          : { text: '禁用', color: '#f5222d' };
        return <span style={{ color: config.color }}>{config.text}</span>;
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: Dimension) => (
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
            onClick={() => handleAssociateTable(record)}
          >
            关联数据模型
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => handleToggleStatus(record)}
          >
            {record.status === 'ACTIVE' ? '禁用' : '启用'}
          </Button>
          <Popconfirm
            title="确定要删除这个维度吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const fieldRoleOptions = [
    { value: 'PRIMARY_KEY', label: '主键 (Primary Key)', icon: <Key className="h-4 w-4" /> },
    { value: 'DISPLAY_NAME', label: '主显示名 (Display Name)', icon: <Tag className="h-4 w-4" /> },
    { value: 'GROUPABLE', label: '可分组属性 (Groupable)', icon: <Layers className="h-4 w-4" /> },
    { value: 'DESCRIPTIVE', label: '描述性属性 (Descriptive)', icon: <FileText className="h-4 w-4" /> },
    { value: 'UNUSED', label: '(不使用)', icon: null }
  ];

  const handleAdd = () => {
    setEditingDimension(null);
    setSelectedTable('');
    setTableFields([]);
    setFieldRoles({});
    setCurrentStep(0);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (dimension: Dimension) => {
    setEditingDimension(dimension);
    setSelectedTable(dimension.tableName);
    setCurrentStep(0);
    
    // 加载表字段
    const table = databaseTables.find(t => t.tableName === dimension.tableName);
    if (table) {
      setTableFields(table.fields);
      
      // 设置字段角色
      const roles: { [key: string]: string } = {};
      dimension.fields.forEach(field => {
        roles[field.physicalName] = field.role;
      });
      setFieldRoles(roles);
    }
    
    form.setFieldsValue({
      dimensionName: dimension.dimensionName,
      dimensionCode: dimension.dimensionCode,
      tableName: dimension.tableName,
      parentDimensionId: dimension.parentDimensionId
    });
    setIsModalVisible(true);
  };

  const handleView = (dimension: Dimension) => {
    // 可以实现查看详情的逻辑
    message.info('查看维度详情功能');
  };

  const handleAssociateTable = (dimension: Dimension) => {
    setAssociatingDimension(dimension);
    setSelectedModel('');
    setSelectedTable('');
    setTableFields([]);
    setFieldRoles({});
    setAssociateTableFields([]);
    associateForm.resetFields();
    setIsAssociateModalVisible(true);
  };



  const handleModelChange = (modelName: string) => {
    // 根据选择的数据模型设置对应的字段
    const modelFields = {
      'dim_products': [
        { fieldName: 'product_code', fieldType: 'VARCHAR(50)', fieldComment: '产品编码' },
        { fieldName: 'product_name', fieldType: 'VARCHAR(200)', fieldComment: '产品名称' },
        { fieldName: 'category_id', fieldType: 'INT', fieldComment: '分类ID' },
        { fieldName: 'brand_id', fieldType: 'INT', fieldComment: '品牌ID' },
        { fieldName: 'status', fieldType: 'VARCHAR(20)', fieldComment: '状态' }
      ],
      'dim_suppliers': [
        { fieldName: 'supplier_code', fieldType: 'VARCHAR(50)', fieldComment: '供应商编码' },
        { fieldName: 'supplier_name', fieldType: 'VARCHAR(200)', fieldComment: '供应商名称' },
        { fieldName: 'contact_person', fieldType: 'VARCHAR(100)', fieldComment: '联系人' },
        { fieldName: 'phone', fieldType: 'VARCHAR(20)', fieldComment: '电话' }
      ],
      'dim_customers': [
        { fieldName: 'customer_code', fieldType: 'VARCHAR(50)', fieldComment: '客户编码' },
        { fieldName: 'customer_name', fieldType: 'VARCHAR(200)', fieldComment: '客户名称' },
        { fieldName: 'customer_type', fieldType: 'VARCHAR(50)', fieldComment: '客户类型' }
      ],
      'dim_brands': [
        { fieldName: 'brand_code', fieldType: 'VARCHAR(50)', fieldComment: '品牌编码' },
        { fieldName: 'brand_name', fieldType: 'VARCHAR(200)', fieldComment: '品牌名称' },
        { fieldName: 'brand_desc', fieldType: 'TEXT', fieldComment: '品牌描述' }
      ]
    };
    
    const fields = modelFields[modelName as keyof typeof modelFields] || [];
    setTableFields(fields);
  };

  const handleAssociateModelChange = (modelName: string) => {
    // 根据选择的数据模型设置对应的字段
    const modelFields = {
      'dim_products': [
        { fieldName: 'product_code', fieldType: 'VARCHAR(50)', fieldComment: '产品编码' },
        { fieldName: 'product_name', fieldType: 'VARCHAR(200)', fieldComment: '产品名称' },
        { fieldName: 'category_id', fieldType: 'INT', fieldComment: '分类ID' },
        { fieldName: 'brand_id', fieldType: 'INT', fieldComment: '品牌ID' },
        { fieldName: 'status', fieldType: 'VARCHAR(20)', fieldComment: '状态' }
      ],
      'dim_suppliers': [
        { fieldName: 'supplier_code', fieldType: 'VARCHAR(50)', fieldComment: '供应商编码' },
        { fieldName: 'supplier_name', fieldType: 'VARCHAR(200)', fieldComment: '供应商名称' },
        { fieldName: 'contact_person', fieldType: 'VARCHAR(100)', fieldComment: '联系人' },
        { fieldName: 'phone', fieldType: 'VARCHAR(20)', fieldComment: '电话' }
      ],
      'dim_customers': [
        { fieldName: 'customer_code', fieldType: 'VARCHAR(50)', fieldComment: '客户编码' },
        { fieldName: 'customer_name', fieldType: 'VARCHAR(200)', fieldComment: '客户名称' },
        { fieldName: 'customer_type', fieldType: 'VARCHAR(50)', fieldComment: '客户类型' }
      ],
      'dim_brands': [
        { fieldName: 'brand_code', fieldType: 'VARCHAR(50)', fieldComment: '品牌编码' },
        { fieldName: 'brand_name', fieldType: 'VARCHAR(200)', fieldComment: '品牌名称' },
        { fieldName: 'brand_desc', fieldType: 'TEXT', fieldComment: '品牌描述' }
      ]
    };
    
    const fields = modelFields[modelName as keyof typeof modelFields] || [];
    setAssociateTableFields(fields);
  };

  const handleAssociateSave = async () => {
    try {
      const values = await associateForm.validateFields();
      
      // 更新维度的关联表信息
      const updatedDimensions = dimensions.map(dim => {
        if (dim.id === associatingDimension?.id) {
          return {
            ...dim,
            tableName: values.tableName,
            dataSource: values.dataSource,
            database: values.database
          };
        }
        return dim;
      });
      
      setDimensions(updatedDimensions);
      setIsAssociateModalVisible(false);
      message.success('关联维度表成功！');
    } catch (error) {
      console.error('关联失败:', error);
    }
  };

  const handleAssociateCancel = () => {
    setIsAssociateModalVisible(false);
    setAssociatingDimension(null);
    setSelectedModel('');
    setAssociateTableFields([]);
    associateForm.resetFields();
  };

  const handleToggleStatus = (dimension: Dimension) => {
    const newStatus = dimension.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setDimensions(dimensions.map(d => 
      d.id === dimension.id ? { ...d, status: newStatus } : d
    ));
    message.success(`维度已${newStatus === 'ACTIVE' ? '启用' : '禁用'}`);
  };

  const handleDelete = (id: string) => {
    setDimensions(dimensions.filter(d => d.id !== id));
    message.success('删除成功');
  };

  const handleTableChange = (tableName: string) => {
    setSelectedTable(tableName);
    const table = databaseTables.find(t => t.tableName === tableName);
    if (table) {
      setTableFields(table.fields);
      setFieldRoles({});
    }
  };

  const handleFieldRoleChange = (fieldName: string, role: string) => {
    setFieldRoles(prev => ({
      ...prev,
      [fieldName]: role
    }));
  };

  const handleSave = () => {
    form.validateFields().then((values) => {
      // 验证必须有一个主键
      const primaryKeys = Object.values(fieldRoles).filter(role => role === 'PRIMARY_KEY');
      if (primaryKeys.length !== 1) {
        message.error('必须指定一个且仅一个主键字段');
        return;
      }

      // 构建字段配置
      const fields: DimensionField[] = tableFields.map(field => ({
        physicalName: field.fieldName,
        businessName: field.fieldComment || field.fieldName,
        role: (fieldRoles[field.fieldName] || 'UNUSED') as any
      })).filter(field => field.role !== 'UNUSED');

      const newDimension: Dimension = {
        id: editingDimension?.id || Date.now().toString(),
        ...values,
        parentDimensionName: values.parentDimensionId 
          ? dimensions.find(d => d.id === values.parentDimensionId)?.dimensionName 
          : undefined,
        status: 'ACTIVE',
        createdAt: editingDimension?.createdAt || new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
        fields
      };

      if (editingDimension) {
        setDimensions(dimensions.map(d => 
          d.id === editingDimension.id ? newDimension : d
        ));
        message.success('更新成功');
      } else {
        setDimensions([...dimensions, newDimension]);
        message.success('创建成功');
      }

      setIsModalVisible(false);
      setCurrentStep(0);
    });
  };

  const fieldColumns = [
    {
      title: '物理字段名',
      dataIndex: 'fieldName',
      key: 'fieldName',
      width: 150,
    },
    {
      title: '业务显示名',
      dataIndex: 'fieldComment',
      key: 'fieldComment',
      width: 150,
    },
    {
      title: '数据类型',
      dataIndex: 'fieldType',
      key: 'fieldType',
      width: 120,
    },
    {
      title: '字段角色',
      key: 'role',
      width: 200,
      render: (_: any, record: TableField) => (
        <Select
          value={fieldRoles[record.fieldName] || 'UNUSED'}
          onChange={(value) => handleFieldRoleChange(record.fieldName, value)}
          style={{ width: '100%' }}
        >
          {fieldRoleOptions.map(option => (
            <Option key={option.value} value={option.value}>
              <Space>
                {option.icon}
                {option.label}
              </Space>
            </Option>
          ))}
        </Select>
      )
    },
    {
      title: '备注',
      key: 'note',
      render: (_: any, record: TableField) => {
        const role = fieldRoles[record.fieldName];
        if (role === 'PRIMARY_KEY') return '* 必须指定一个主键';
        if (role === 'DISPLAY_NAME') return '* 用于报表默认显示';
        if (role === 'GROUPABLE') return '* 可拖拽到行列头';
        if (role === 'DESCRIPTIVE') return '* 仅用于展示';
        if (role === 'UNUSED') return '* 此字段不参与分析';
        return '';
      }
    }
  ];

  return (
    <div className="p-6">
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">维度库管理</h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增维度
          </Button>
        </div>
        
        <Table
          columns={columns}
          dataSource={dimensions}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      <Modal
        title={editingDimension ? '编辑维度' : '新增维度'}
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
              保存维度
            </Button>
          )
        ].filter(Boolean)}
        width={1000}
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
                name="dimensionCode"
                label="维度编码"
                rules={[{ required: true, message: '请输入维度编码' }]}
              >
                <Input 
                  placeholder="请输入维度编码" 
                  disabled={!!editingDimension}
                />
              </Form.Item>
              <Form.Item
                name="dimensionName"
                label="维度名称"
                rules={[{ required: true, message: '请输入维度名称' }]}
              >
                <Input placeholder="请输入维度名称" />
              </Form.Item>
              <Form.Item
                name="dimensionDesc"
                label="维度描述"
              >
                <TextArea rows={3} placeholder="请输入维度描述（可选）" />
              </Form.Item>
            </Form>
          </div>
          )}

          {currentStep === 1 && (
            <div>
              <h3 className="text-lg font-medium mb-4">关联数据模型</h3>
              <Form form={form} layout="vertical">
                <Form.Item
                  name="tableName"
                  label="选择数据表"
                  rules={[{ required: true, message: '请选择数据表' }]}
                >
                  <Select 
                    placeholder="请选择数据表"
                    value={selectedTable}
                    onChange={handleTableChange}
                  >
                    {databaseTables.map(table => (
                      <Option key={table.tableName} value={table.tableName}>
                        {table.tableName} ({table.tableComment})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Form>

              {tableFields.length > 0 && (
                <div>
                  <h4 className="text-md font-medium mb-3">字段角色定义</h4>
                  <Table
                    columns={fieldColumns}
                    dataSource={tableFields}
                    rowKey="fieldName"
                    pagination={false}
                    size="small"
                    scroll={{ y: 300 }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

        {/* 关联维度表模态框 */}
        <Modal
          title="关联维度表"
          open={isAssociateModalVisible}
          onCancel={handleAssociateCancel}
          onOk={handleAssociateSave}
          width={800}
          okText="确定"
          cancelText="取消"
        >
          <div className="space-y-6">
            <Form form={associateForm} layout="vertical">
              <Form.Item
                name="modelName"
                label="选择数据模型"
                rules={[{ required: true, message: '请选择数据模型' }]}
              >
                <Select 
                  placeholder="请选择数据模型"
                  value={selectedModel}
                  onChange={(value) => {
                    setSelectedModel(value);
                    handleAssociateModelChange(value);
                  }}
                >
                  <Option value="dim_products">产品维度模型</Option>
                  <Option value="dim_suppliers">供应商维度模型</Option>
                  <Option value="dim_customers">客户维度模型</Option>
                  <Option value="dim_brands">品牌维度模型</Option>
                </Select>
              </Form.Item>
            </Form>

            {associateTableFields.length > 0 && (
              <div>
                <h4 className="text-md font-medium mb-3">字段角色定义</h4>
                <Table
                  columns={fieldColumns}
                  dataSource={associateTableFields}
                  rowKey="fieldName"
                  pagination={false}
                  size="small"
                  scroll={{ y: 300 }}
                />
              </div>
            )}
          </div>
        </Modal>
      </div>
    );
  };
  
  export default DimensionManagement;