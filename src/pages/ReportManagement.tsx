import React, { useState, useCallback } from 'react';
import {
  Card,
  Button,
  Input,
  Select,
  Form,
  Space,
  Table,
  Tag,
  Row,
  Col,
  Typography,
  message,
  Popconfirm,
  Modal,
  Divider,
  Empty
} from 'antd';
import {
  Plus,
  Edit,
  Delete,
  GripVertical
} from 'lucide-react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// 字段接口
interface Field {
  id: string;
  name: string;
  type: 'dimension' | 'measure';
}

// 报表接口
interface ReportTemplate {
  id: string;
  templateName: string;
  description: string;
  schemeId: string;
  schemeName?: string;
  rowFields: Field[];
  columnFields: Field[];
  valueFields: Field[];
  creator: string;
  createTime: string;
  updateTime: string;
}

// 拖拽项类型
const ItemTypes = {
  FIELD: 'field'
};

// 可拖拽的字段组件
interface DraggableFieldProps {
  field: Field;
  onRemove?: () => void;
  isDragging?: boolean;
}

const DraggableField: React.FC<DraggableFieldProps> = ({ field, onRemove, isDragging }) => {
  const [{ isDragging: dragState }, drag] = useDrag({
    type: ItemTypes.FIELD,
    item: { field },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <Tag
      ref={drag}
      className={`cursor-move ${dragState || isDragging ? 'opacity-50' : ''}`}
      closable={!!onRemove}
      onClose={onRemove}
      icon={<GripVertical size={12} />}
    >
      {field.name}
    </Tag>
  );
};

// 可放置的区域组件
interface DropZoneProps {
  title: string;
  fields: Field[];
  onDrop: (field: Field) => void;
  onRemove: (index: number) => void;
  className?: string;
}

const DropZone: React.FC<DropZoneProps> = ({ title, fields, onDrop, onRemove, className = '' }) => {
  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.FIELD,
    drop: (item: { field: Field }) => {
      onDrop(item.field);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div
      ref={drop}
      className={`border-2 border-dashed p-4 min-h-[80px] rounded-lg ${
        isOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      } ${className}`}
    >
      <Text strong className="block mb-2">{title}:</Text>
      <div className="flex flex-wrap gap-2">
        {fields.length === 0 ? (
          <Text type="secondary" className="text-sm">拖拽字段到此处</Text>
        ) : (
          fields.map((field, index) => (
            <DraggableField
              key={`${field.id}-${index}`}
              field={field}
              onRemove={() => onRemove(index)}
            />
          ))
        )}
      </div>
    </div>
  );
};

// S2报表预览组件（模拟）
interface S2PreviewProps {
  rowFields: Field[];
  columnFields: Field[];
  valueFields: Field[];
}

const S2Preview: React.FC<S2PreviewProps> = ({ rowFields, columnFields, valueFields }) => {
  // 模拟数据
  const mockData = [
    {
      supplierName: '西门子（中国）有限公司',
      purchaseOrg: '华东采购部',
      productCategory: 'CPU类',
      comparisonValue: 100.00,
      diffRate: 0.00
    },
    {
      supplierName: '博世贸易（上海）有限公司',
      purchaseOrg: '华东采购部',
      productCategory: 'CPU类',
      comparisonValue: 105.00,
      diffRate: 0.05
    },
    {
      supplierName: '艾默生电气（中国）投资有限公司',
      purchaseOrg: '华南采购部',
      productCategory: '内存条',
      comparisonValue: 45.50,
      diffRate: -0.0521
    },
    {
      supplierName: '西门子（中国）有限公司',
      purchaseOrg: '华南采购部',
      productCategory: '内存条',
      comparisonValue: 48.00,
      diffRate: 0.00
    }
  ];

  if (rowFields.length === 0 && columnFields.length === 0 && valueFields.length === 0) {
    return (
      <div className="border rounded-lg p-8 bg-gray-50">
        <Empty description="请配置字段以预览报表" />
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 bg-white">
      <Title level={5} className="mb-4">报表预览 (基于 AntV S2)</Title>
      <div className="overflow-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              {rowFields.map(field => (
                <th key={field.id} className="border border-gray-300 p-2 text-left">
                  {field.name}
                </th>
              ))}
              {columnFields.map(field => (
                <th key={field.id} className="border border-gray-300 p-2 text-center" colSpan={valueFields.length}>
                  {field.name}
                </th>
              ))}
            </tr>
            {valueFields.length > 0 && (
              <tr className="bg-gray-50">
                {rowFields.map((_, index) => (
                  <th key={index} className="border border-gray-300 p-2"></th>
                ))}
                {columnFields.map(() =>
                  valueFields.map(field => (
                    <th key={field.id} className="border border-gray-300 p-2 text-center">
                      {field.name}
                    </th>
                  ))
                )}
              </tr>
            )}
          </thead>
          <tbody>
            {mockData.slice(0, 4).map((row, index) => (
              <tr key={index}>
                <td className="border border-gray-300 p-2">{row.supplierName}</td>
                <td className="border border-gray-300 p-2">{row.purchaseOrg}</td>
                <td className="border border-gray-300 p-2">{row.comparisonValue}</td>
                <td className="border border-gray-300 p-2">
                  {(row.diffRate * 100).toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 text-sm text-gray-500">
        注：这是一个简化的预览示例，实际应用中将集成完整的 AntV S2 组件
      </div>
    </div>
  );
};

const ReportManagement: React.FC = () => {
  const [templates, setTemplates] = useState<ReportTemplate[]>([
    {
      id: 'template_001',
      templateName: '同产品采购协议价比较分析',
      description: '选择比价方案与筛选条件，进行各维度的协议价对比分析； ',
      schemeId: 'scheme_001',
      schemeName: '同产品采购协议价比价方案',
      rowFields: [
        { id: 'supplierName', name: '供应商名称', type: 'dimension' },
        { id: 'purchaseOrg', name: '采购组织', type: 'dimension' }
      ],
      columnFields: [
        { id: 'productCategory', name: '产品品类', type: 'dimension' }
      ],
      valueFields: [
        { id: 'comparisonValue', name: '采购订单含税价', type: 'measure' },
        { id: 'diffRate', name: '价格差异率', type: 'measure' }
      ],
      creator: '业务用户A',
      createTime: '2025-08-05 16:30:00',
      updateTime: '2025-08-05 17:00:00'
    }
  ]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ReportTemplate | null>(null);
  const [form] = Form.useForm();
  
  // 配置状态
  const [rowFields, setRowFields] = useState<Field[]>([]);
  const [columnFields, setColumnFields] = useState<Field[]>([]);
  const [valueFields, setValueFields] = useState<Field[]>([]);

  // 可用字段（模拟数据）
  const availableDimensions: Field[] = [
    { id: 'supplierName', name: '供应商名称', type: 'dimension' },
    { id: 'purchaseOrg', name: '采购组织', type: 'dimension' },
    { id: 'productCategory', name: '产品品类', type: 'dimension' },
    { id: 'brand', name: '品牌', type: 'dimension' },
    { id: 'productName', name: '产品名称', type: 'dimension' }
  ];

  const availableMeasures: Field[] = [
    { id: 'comparisonValue', name: '采购订单含税价', type: 'measure' },
    { id: 'baselineValue', name: '采购协议价', type: 'measure' },
    { id: 'diffValue', name: '价格差异额', type: 'measure' },
    { id: 'diffRate', name: '价格差异率', type: 'measure' }
  ];

  const showModal = (template?: ReportTemplate) => {
    setEditingTemplate(template || null);
    
    if (template) {
      form.setFieldsValue({
        templateName: template.templateName,
        description: template.description,
        schemeId: template.schemeId
      });
      setRowFields([...template.rowFields]);
      setColumnFields([...template.columnFields]);
      setValueFields([...template.valueFields]);
    } else {
      form.resetFields();
      setRowFields([]);
      setColumnFields([]);
      setValueFields([]);
    }
    
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingTemplate(null);
    setRowFields([]);
    setColumnFields([]);
    setValueFields([]);
    form.resetFields();
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      if (rowFields.length === 0 && columnFields.length === 0 && valueFields.length === 0) {
        message.error('请至少配置一个字段');
        return;
      }

      const newTemplate: ReportTemplate = {
        id: editingTemplate?.id || `template_${Date.now()}`,
        templateName: values.templateName,
        description: values.description,
        schemeId: values.schemeId,
        schemeName: '采购订单价格对标方案', // 实际应该从API获取
        rowFields: [...rowFields],
        columnFields: [...columnFields],
        valueFields: [...valueFields],
        creator: '当前用户',
        createTime: editingTemplate?.createTime || new Date().toLocaleString(),
        updateTime: new Date().toLocaleString()
      };

      if (editingTemplate) {
        setTemplates(templates.map(t => t.id === editingTemplate.id ? newTemplate : t));
        message.success('报表更新成功');
      } else {
        setTemplates([...templates, newTemplate]);
        message.success('报表创建成功');
      }

      handleCancel();
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  const deleteTemplate = (templateId: string) => {
    setTemplates(templates.filter(t => t.id !== templateId));
    message.success('报表删除成功');
  };

  // 拖拽处理函数
  const handleDropToRow = useCallback((field: Field) => {
    if (!rowFields.find(f => f.id === field.id)) {
      setRowFields([...rowFields, field]);
    }
  }, [rowFields]);

  const handleDropToColumn = useCallback((field: Field) => {
    if (!columnFields.find(f => f.id === field.id)) {
      setColumnFields([...columnFields, field]);
    }
  }, [columnFields]);

  const handleDropToValue = useCallback((field: Field) => {
    if (!valueFields.find(f => f.id === field.id)) {
      setValueFields([...valueFields, field]);
    }
  }, [valueFields]);

  const removeFromRow = (index: number) => {
    setRowFields(rowFields.filter((_, i) => i !== index));
  };

  const removeFromColumn = (index: number) => {
    setColumnFields(columnFields.filter((_, i) => i !== index));
  };

  const removeFromValue = (index: number) => {
    setValueFields(valueFields.filter((_, i) => i !== index));
  };

  const columns = [
    {
      title: '报表名称',
      dataIndex: 'templateName',
      key: 'templateName',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '关联方案',
      dataIndex: 'schemeName',
      key: 'schemeName',
    },
    {
      title: '创建人',
      dataIndex: 'creator',
      key: 'creator',
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ReportTemplate) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<Edit size={16} />}
            onClick={() => showModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个报表吗？"
            onConfirm={() => deleteTemplate(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              danger
              icon={<Delete size={16} />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-6">
        <Card>
          <div className="flex justify-between items-center mb-6">
            <Title level={3}>报表管理</Title>
            <Button
              type="primary"
              icon={<Plus size={16} />}
              onClick={() => showModal()}
            >
              新增报表
            </Button>
          </div>

          <Table
            columns={columns}
            dataSource={templates}
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
          title={editingTemplate ? '编辑报表' : '新增报表'}
          open={isModalVisible}
          onCancel={handleCancel}
          width={1200}
          footer={[
            <Button key="cancel" onClick={handleCancel}>
              取消
            </Button>,
            <Button key="save" type="primary" onClick={handleSave}>
              保存报表
            </Button>,
          ]}
        >
          <Form
            form={form}
            layout="vertical"
            requiredMark={false}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="报表名称"
                  name="templateName"
                  rules={[{ required: true, message: '请输入报表名称' }]}
                >
                  <Input placeholder="输入报表名称..." />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="关联方案"
                  name="schemeId"
                  rules={[{ required: true, message: '请选择关联方案' }]}
                >
                  <Select placeholder="选择比价方案">
                    <Option value="scheme_001">采购订单价格对标方案</Option>
                    <Option value="scheme_002">集团内部价格一致性方案</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  label="报表描述"
                  name="description"
                  rules={[{ required: true, message: '请输入报表描述' }]}
                >
                  <TextArea rows={2} placeholder="输入报表的用途和说明..." />
                </Form.Item>
              </Col>
            </Row>
          </Form>

          <Divider>报表布局配置</Divider>

          <Row gutter={24}>
            {/* 左侧：可用字段 */}
            <Col span={6}>
              <Card size="small" title="可用字段" className="h-full">
                <div className="mb-4">
                  <Text strong className="block mb-2">维度 (Dimensions)</Text>
                  <div className="space-y-1">
                    {availableDimensions.map(field => (
                      <div key={field.id}>
                        <DraggableField field={field} />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Text strong className="block mb-2">指标 (Measures)</Text>
                  <div className="space-y-1">
                    {availableMeasures.map(field => (
                      <div key={field.id}>
                        <DraggableField field={field} />
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </Col>

            {/* 右侧：配置区域和预览 */}
            <Col span={18}>
              <div className="space-y-4">
                {/* 配置区域 */}
                <Card size="small" title="配置区域">
                  <Row gutter={16}>
                    <Col span={8}>
                      <DropZone
                        title="行 (Rows)"
                        fields={rowFields}
                        onDrop={handleDropToRow}
                        onRemove={removeFromRow}
                      />
                    </Col>
                    <Col span={8}>
                      <DropZone
                        title="列 (Columns)"
                        fields={columnFields}
                        onDrop={handleDropToColumn}
                        onRemove={removeFromColumn}
                      />
                    </Col>
                    <Col span={8}>
                      <DropZone
                        title="值 (Values)"
                        fields={valueFields}
                        onDrop={handleDropToValue}
                        onRemove={removeFromValue}
                      />
                    </Col>
                  </Row>
                </Card>

                {/* 预览区域 */}
                <Card size="small" title="实时预览">
                  <S2Preview
                    rowFields={rowFields}
                    columnFields={columnFields}
                    valueFields={valueFields}
                  />
                </Card>
              </div>
            </Col>
          </Row>
        </Modal>
      </div>
    </DndProvider>
  );
};

export default ReportManagement;