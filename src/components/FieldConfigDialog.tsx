import { useState, useEffect } from 'react';
import { Modal, Table, Button, Form, Input, Select, Space, Tag, message, Tooltip } from 'antd';
import { Plus, Edit, Trash2 } from 'lucide-react';

const { Option } = Select;

interface FieldConfigDialogProps {
  open: boolean;
  model?: any;
  onClose: () => void;
  onSave: (data: any) => void;
}

interface Field {
  id: string;
  fieldName: string;
  fieldType: string;
  dataType: string;
  isRequired: boolean;
  description?: string;
  defaultValue?: string;
}

const FieldConfigDialog: React.FC<FieldConfigDialogProps> = ({
  open,
  model,
  onClose,
  onSave
}) => {
  const [fields, setFields] = useState<Field[]>([]);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [fieldFormOpen, setFieldFormOpen] = useState(false);
  const [addFieldModalOpen, setAddFieldModalOpen] = useState(false);
  const [availableFields, setAvailableFields] = useState<Field[]>([]);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && model) {
      // 模拟已选择的字段数据
      const mockSelectedFields: Field[] = [
        {
          id: '1',
          fieldName: 'order_no',
          fieldType: '维度',
          dataType: 'varchar',
          isRequired: true,
          description: '订单编号'
        },
        {
          id: '2',
          fieldName: 'customer_name',
          fieldType: '维度',
          dataType: 'varchar',
          isRequired: true,
          description: '客户姓名'
        },
        {
          id: '3',
          fieldName: 'order_amount',
          fieldType: '度量',
          dataType: 'decimal',
          isRequired: false,
          description: '订单金额'
        },
        {
          id: '4',
          fieldName: 'create_time',
          fieldType: '维度',
          dataType: 'datetime',
          isRequired: true,
          description: '创建时间'
        }
      ];
      
      // 模拟模型中所有可用字段（数据库表字段）
      const mockAllFields: Field[] = [
        {
          id: '1',
          fieldName: 'order_no',
          fieldType: '普通字段',
          dataType: 'varchar',
          isRequired: true,
          description: '订单编号'
        },
        {
          id: '2',
          fieldName: 'customer_name',
          fieldType: '普通字段',
          dataType: 'varchar',
          isRequired: true,
          description: '客户姓名'
        },
        {
          id: '3',
          fieldName: 'order_amount',
          fieldType: '普通字段',
          dataType: 'decimal',
          isRequired: false,
          description: '订单金额'
        },
        {
          id: '4',
          fieldName: 'create_time',
          fieldType: '普通字段',
          dataType: 'datetime',
          isRequired: true,
          description: '创建时间'
        },
        {
          id: '5',
          fieldName: 'quantity',
          fieldType: '普通字段',
          dataType: 'integer',
          isRequired: false,
          description: '订单数量'
        },
        {
          id: '6',
          fieldName: 'product_id',
          fieldType: '普通字段',
          dataType: 'bigint',
          isRequired: true,
          description: '产品ID'
        },
        {
          id: '7',
          fieldName: 'status',
          fieldType: '普通字段',
          dataType: 'varchar',
          isRequired: true,
          description: '订单状态'
        }
      ];
      
      setFields(mockSelectedFields);
      // 设置可用字段为未选择的字段
      const selectedFieldIds = mockSelectedFields.map(f => f.id);
      const unselectedFields = mockAllFields.filter(f => !selectedFieldIds.includes(f.id));
      setAvailableFields(unselectedFields);
    }
  }, [open, model]);

  const handleAddField = () => {
    setAddFieldModalOpen(true);
  };
  
  const handleSelectField = (field: Field) => {
    // 将选中的字段添加到已选字段列表，默认设置为普通字段类型
    const newField = {
      ...field,
      fieldType: '普通字段' // 默认类型，用户可以后续修改
    };
    setFields([...fields, newField]);
    
    // 从可用字段列表中移除
    setAvailableFields(availableFields.filter(f => f.id !== field.id));
    
    message.success(`已添加字段：${field.fieldName}`);
  };

  const handleEditField = (field: Field) => {
    setEditingField(field);
    form.setFieldsValue(field);
    setFieldFormOpen(true);
  };

  const handleDeleteField = (fieldId: string) => {
    if (window.confirm('确定要删除这个字段吗？')) {
      const fieldToDelete = fields.find(f => f.id === fieldId);
      if (fieldToDelete) {
        // 从已选字段中移除
        setFields(fields.filter(f => f.id !== fieldId));
        
        // 重新添加到可用字段列表（恢复为普通字段类型）
        const restoredField = {
          ...fieldToDelete,
          fieldType: '普通字段'
        };
        setAvailableFields([...availableFields, restoredField]);
        
        message.success(`已移除字段：${fieldToDelete.fieldName}`);
      }
    }
  };

  const handleFieldSave = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingField) {
        // 编辑字段
        setFields(fields.map(f => 
          f.id === editingField.id ? { ...f, ...values } : f
        ));
      } else {
        // 新增字段
        const newField: Field = {
          ...values,
          id: Date.now().toString()
        };
        setFields([...fields, newField]);
      }
      
      setFieldFormOpen(false);
      message.success(editingField ? '字段更新成功' : '字段添加成功');
    } catch (error) {
      console.error('字段保存失败:', error);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setLoading(true);
      const updatedModel = {
        ...model,
        fields,
        fieldCount: fields.length
      };
      onSave(updatedModel);
      message.success('字段配置保存成功');
      onClose();
    } catch (error) {
      console.error('配置保存失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '字段名称',
      dataIndex: 'fieldName',
      key: 'fieldName',
      width: 150,
    },
    {
      title: '字段类型',
      dataIndex: 'fieldType',
      key: 'fieldType',
      width: 120,
      render: (type: string) => {
        const colorMap: { [key: string]: string } = {
          '维度': 'blue',
          '度量': 'green',
          '普通字段': 'default'
        };
        return <Tag color={colorMap[type] || 'default'}>{type}</Tag>;
      },
    },
    {
      title: '数据类型',
      dataIndex: 'dataType',
      key: 'dataType',
      width: 100,
    },
    {
      title: '是否必填',
      dataIndex: 'isRequired',
      key: 'isRequired',
      width: 100,
      render: (required: boolean) => (
        <Tag color={required ? 'red' : 'default'}>
          {required ? '必填' : '可选'}
        </Tag>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (record: Field) => (
        <Space>
          <Tooltip title="编辑">
            <Button 
              type="text" 
              size="small" 
              icon={<Edit className="w-4 h-4" />} 
              onClick={() => handleEditField(record)} 
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button 
              type="text" 
              size="small" 
              danger 
              icon={<Trash2 className="w-4 h-4" />} 
              onClick={() => handleDeleteField(record.id)} 
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Modal
        title={`字段配置 - ${model?.modelName}`}
        open={open}
        onCancel={onClose}
        width={1000}
        footer={[
          <Button key="cancel" onClick={onClose}>
            取消
          </Button>,
          <Button key="save" type="primary" loading={loading} onClick={handleSaveConfig}>
            保存配置
          </Button>,
        ]}
      >
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<Plus className="w-4 h-4" />} onClick={handleAddField}>
            添加字段
          </Button>
        </div>
        
        <Table
          columns={columns}
          dataSource={fields}
          rowKey="id"
          size="small"
          pagination={false}
          scroll={{ y: 400 }}
        />
      </Modal>

      <Modal
        title={editingField ? '编辑字段' : '添加字段'}
        open={fieldFormOpen}
        onOk={handleFieldSave}
        onCancel={() => setFieldFormOpen(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="fieldName"
            label="字段名称"
            rules={[
              { required: true, message: '请输入字段名称' },
              { pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/, message: '字段名称只能包含字母、数字和下划线，且不能以数字开头' }
            ]}
          >
            <Input placeholder="请输入字段名称" />
          </Form.Item>

          <Form.Item
            name="fieldType"
            label="字段类型"
            rules={[{ required: true, message: '请选择字段类型' }]}
          >
            <Select placeholder="请选择字段类型">
              <Option value="维度">维度</Option>
              <Option value="度量">度量</Option>
              <Option value="普通字段">普通字段</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="dataType"
            label="数据类型"
            rules={[{ required: true, message: '请选择数据类型' }]}
          >
            <Select placeholder="请选择数据类型">
              <Option value="varchar">varchar</Option>
              <Option value="int">int</Option>
              <Option value="bigint">bigint</Option>
              <Option value="decimal">decimal</Option>
              <Option value="datetime">datetime</Option>
              <Option value="date">date</Option>
              <Option value="text">text</Option>
              <Option value="boolean">boolean</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="isRequired"
            label="是否必填"
            rules={[{ required: true, message: '请选择是否必填' }]}
          >
            <Select placeholder="请选择是否必填">
              <Option value={true}>必填</Option>
              <Option value={false}>可选</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="字段描述"
          >
            <Input.TextArea rows={2} placeholder="请输入字段描述（可选）" />
          </Form.Item>

          <Form.Item
            name="defaultValue"
            label="默认值"
          >
            <Input placeholder="请输入默认值（可选）" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="选择字段"
        open={addFieldModalOpen}
        onCancel={() => setAddFieldModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setAddFieldModalOpen(false)}>
            取消
          </Button>
        ]}
        width={800}
      >
        <div style={{ marginBottom: 16 }}>
          <span style={{ color: '#666' }}>从模型中选择要添加的字段：</span>
        </div>
        
        {availableFields.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
            暂无可添加的字段
          </div>
        ) : (
          <Table
            columns={[
              {
                title: '字段名称',
                dataIndex: 'fieldName',
                key: 'fieldName',
                width: 150,
              },
              {
                title: '数据类型',
                dataIndex: 'dataType',
                key: 'dataType',
                width: 100,
              },
              {
                title: '是否必填',
                dataIndex: 'isRequired',
                key: 'isRequired',
                width: 100,
                render: (required: boolean) => (
                  <Tag color={required ? 'red' : 'default'}>
                    {required ? '必填' : '可选'}
                  </Tag>
                ),
              },
              {
                title: '描述',
                dataIndex: 'description',
                key: 'description',
                ellipsis: true,
              },
              {
                title: '操作',
                key: 'action',
                width: 80,
                render: (record: Field) => (
                  <Button 
                    type="primary" 
                    size="small"
                    onClick={() => handleSelectField(record)}
                  >
                    添加
                  </Button>
                ),
              },
            ]}
            dataSource={availableFields}
            rowKey="id"
            size="small"
            pagination={false}
            scroll={{ y: 300 }}
          />
        )}
      </Modal>
    </>
  );
};

export default FieldConfigDialog;