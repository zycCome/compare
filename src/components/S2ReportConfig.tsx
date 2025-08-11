import { useState, useEffect } from 'react';
import { Card, Form, Input, Select, Button, Space, Table, Tag, message, Divider, Typography, Row, Col, Collapse, Modal, Tabs } from 'antd';
import { Plus, Trash2, Settings, Save, X, ChevronDown, ChevronRight, Code } from 'lucide-react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

interface S2ReportConfigProps {
  template?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}

interface FieldConfig {
  id: string;
  fieldName: string;
  displayName: string;
  fieldType: 'dimension' | 'measure';
  dataType: string;
  aggregation?: string;
  format?: string;
  modelId?: string;
  modelName?: string;
}

interface FilterCondition {
  id: string;
  fieldId: string;
  fieldName: string;
  fieldType: string;
  operator: string;
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

interface FilterTemplate {
  id: string;
  name: string;
  description: string;
  conditions: FilterCondition[];
  expression: string;
}

interface S2FieldConfig {
  rows: FieldConfig[];     // 行维度字段
  columns: FieldConfig[];  // 列维度字段
  values: FieldConfig[];   // 值字段
  filters: FilterCondition[]; // 筛选条件
}

export const S2ReportConfig: React.FC<S2ReportConfigProps> = ({
  template,
  onSave,
  onCancel
}) => {
  const [form] = Form.useForm();
  const [availableFields, setAvailableFields] = useState<FieldConfig[]>([]);
  const [s2Fields, setS2Fields] = useState<S2FieldConfig>({
    rows: [],
    columns: [],
    values: [],
    filters: []
  });
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<FilterCondition | null>(null);
  const [filterTemplates, setFilterTemplates] = useState<FilterTemplate[]>([]);
  const [expressionMode, setExpressionMode] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // 模拟数据集列表
  const mockDatasets = [
    { id: '1', name: '销售数据集', description: '包含订单、客户、产品信息' },
    { id: '2', name: '库存数据集', description: '库存数量、仓库信息' },
    { id: '3', name: '财务数据集', description: '收入、成本、利润数据' }
  ];

  // 模拟数据模型列表
  const mockModels = [
    { id: '1', name: '销售订单模型', description: '包含订单基本信息' },
    { id: '2', name: '产品信息模型', description: '产品基本信息、分类等' },
    { id: '3', name: '客户信息模型', description: '客户基本信息、联系方式' }
  ];

  // 模拟数据集关联的模型
  const getDatasetModels = (datasetId: string) => {
    const datasetModelMap: { [key: string]: string[] } = {
      '1': ['1', '2', '3'], // 销售数据集关联所有模型
      '2': ['2'], // 库存数据集只关联产品模型
      '3': ['1'] // 财务数据集只关联订单模型
    };
    return datasetModelMap[datasetId] || [];
  };

  // 获取模型的字段
  const getModelFields = (modelId: string): FieldConfig[] => {
    const fieldMaps: { [key: string]: FieldConfig[] } = {
      '1': [
        {
          id: '1',
          fieldName: 'order_date',
          displayName: '订单日期',
          fieldType: 'dimension',
          dataType: 'date',
          modelId: '1',
          modelName: '销售订单模型'
        },
        {
          id: '4',
          fieldName: 'order_amount',
          displayName: '订单金额',
          fieldType: 'measure',
          dataType: 'decimal',
          aggregation: 'sum',
          modelId: '1',
          modelName: '销售订单模型'
        },
        {
          id: '5',
          fieldName: 'quantity',
          displayName: '数量',
          fieldType: 'measure',
          dataType: 'integer',
          aggregation: 'sum',
          modelId: '1',
          modelName: '销售订单模型'
        }
      ],
      '2': [
        {
          id: '3',
          fieldName: 'product_category',
          displayName: '产品类别',
          fieldType: 'dimension',
          dataType: 'string',
          modelId: '2',
          modelName: '产品信息模型'
        }
      ],
      '3': [
        {
          id: '2',
          fieldName: 'customer_name',
          displayName: '客户名称',
          fieldType: 'dimension',
          dataType: 'string',
          modelId: '3',
          modelName: '客户信息模型'
        }
      ]
    };
    return fieldMaps[modelId] || [];
  };

  // 获取数据集的所有可用字段
  const getAvailableFields = (datasetId: string): FieldConfig[] => {
    const modelIds = getDatasetModels(datasetId);
    const allFields: FieldConfig[] = [];
    modelIds.forEach(modelId => {
      allFields.push(...getModelFields(modelId));
    });
    return allFields;
  };

  useEffect(() => {
    if (template) {
      form.setFieldsValue({
        templateName: template.templateName,
        description: template.description,
        dataset: template.datasetRefs?.[0] || ''
      });
      setSelectedDataset(template.datasetRefs?.[0] || '');
      // 如果模板有S2配置，加载它们
      if (template.s2Config) {
        setS2Fields({
          rows: template.s2Config.rows || [],
          columns: template.s2Config.columns || [],
          values: template.s2Config.values || [],
          filters: template.s2Config.filters || []
        });
      }
    } else {
      form.resetFields();
      setAvailableFields([]);
      setS2Fields({
        rows: [],
        columns: [],
        values: [],
        filters: []
      });
    }
  }, [template, form]);

  const handleDatasetChange = (datasetId: string) => {
    setSelectedDataset(datasetId);
    // 加载对应数据集的字段
    const fields = getAvailableFields(datasetId);
    setAvailableFields(fields.map(field => ({
      ...field,
      displayName: field.displayName // 保持原有显示名称
    })));
    // 重置S2字段配置
      setS2Fields({
        rows: [],
        columns: [],
        values: [],
        filters: []
      });
  };

  const handleAddFieldToArea = (field: FieldConfig, area: 'rows' | 'columns' | 'values') => {
    // 检查字段是否已经在其他区域
    const isFieldUsed = s2Fields.rows.some(f => f.id === field.id) ||
                       s2Fields.columns.some(f => f.id === field.id) ||
                       s2Fields.values.some(f => f.id === field.id);
    
    if (isFieldUsed) {
      message.warning('该字段已被使用，请先从其他区域移除');
      return;
    }
    
    // 验证字段类型是否适合目标区域
    if (area === 'values' && field.fieldType !== 'measure') {
      message.warning('值区域只能添加度量字段');
      return;
    }
    
    if ((area === 'rows' || area === 'columns') && field.fieldType !== 'dimension') {
      message.warning('行维度和列维度只能添加维度字段');
      return;
    }
    
    setS2Fields(prev => ({
      ...prev,
      [area]: [...prev[area], field]
    }));
    
    message.success(`已将字段 "${field.displayName}" 添加到${area === 'rows' ? '行维度' : area === 'columns' ? '列维度' : '值'}`);
  };
  
  const handleRemoveFieldFromArea = (fieldId: string, area: 'rows' | 'columns' | 'values') => {
    setS2Fields(prev => ({
      ...prev,
      [area]: prev[area].filter(f => f.id !== fieldId)
    }));
  };

  const handleFieldDisplayNameChange = (fieldId: string, displayName: string, area: 'rows' | 'columns' | 'values') => {
    setS2Fields(prev => ({
      ...prev,
      [area]: prev[area].map(field => 
        field.id === fieldId ? { ...field, displayName } : field
      )
    }));
  };

  const handleFieldAggregationChange = (fieldId: string, aggregation: string) => {
    setS2Fields(prev => ({
      ...prev,
      values: prev.values.map(field => 
        field.id === fieldId ? { ...field, aggregation } : field
      )
    }));
  };

  // 筛选条件相关函数
  const getOperatorsByFieldType = (dataType: string) => {
    const operators = {
      string: [
        { value: 'equals', label: '等于' },
        { value: 'not_equals', label: '不等于' },
        { value: 'contains', label: '包含' },
        { value: 'not_contains', label: '不包含' },
        { value: 'starts_with', label: '开始于' },
        { value: 'ends_with', label: '结束于' },
        { value: 'is_empty', label: '为空' },
        { value: 'is_not_empty', label: '不为空' }
      ],
      integer: [
        { value: 'equals', label: '等于' },
        { value: 'not_equals', label: '不等于' },
        { value: 'greater_than', label: '大于' },
        { value: 'greater_than_or_equal', label: '大于等于' },
        { value: 'less_than', label: '小于' },
        { value: 'less_than_or_equal', label: '小于等于' },
        { value: 'between', label: '介于' },
        { value: 'in', label: '在列表中' },
        { value: 'not_in', label: '不在列表中' }
      ],
      decimal: [
        { value: 'equals', label: '等于' },
        { value: 'not_equals', label: '不等于' },
        { value: 'greater_than', label: '大于' },
        { value: 'greater_than_or_equal', label: '大于等于' },
        { value: 'less_than', label: '小于' },
        { value: 'less_than_or_equal', label: '小于等于' },
        { value: 'between', label: '介于' }
      ],
      date: [
        { value: 'equals', label: '等于' },
        { value: 'not_equals', label: '不等于' },
        { value: 'after', label: '晚于' },
        { value: 'before', label: '早于' },
        { value: 'between', label: '介于' },
        { value: 'last_n_days', label: '最近N天' },
        { value: 'next_n_days', label: '未来N天' }
      ],
      boolean: [
        { value: 'equals', label: '等于' },
        { value: 'not_equals', label: '不等于' }
      ]
    };
    return operators[dataType as keyof typeof operators] || operators.string;
  };

  const handleAddFilter = () => {
    setCurrentFilter(null);
    setFilterModalVisible(true);
  };

  const handleEditFilter = (filter: FilterCondition) => {
    setCurrentFilter(filter);
    setFilterModalVisible(true);
  };

  const handleDeleteFilter = (filterId: string) => {
    setS2Fields(prev => ({
      ...prev,
      filters: prev.filters.filter(f => f.id !== filterId)
    }));
    message.success('筛选条件已删除');
  };

  const handleSaveFilter = (filterData: Omit<FilterCondition, 'id'>) => {
    if (currentFilter) {
      // 编辑现有筛选条件
      setS2Fields(prev => ({
        ...prev,
        filters: prev.filters.map(f => 
          f.id === currentFilter.id ? { ...filterData, id: currentFilter.id } : f
        )
      }));
      message.success('筛选条件已更新');
    } else {
      // 添加新筛选条件
      const newFilter: FilterCondition = {
        ...filterData,
        id: Date.now().toString()
      };
      setS2Fields(prev => ({
        ...prev,
        filters: [...prev.filters, newFilter]
      }));
      message.success('筛选条件已添加');
    }
    setFilterModalVisible(false);
    setCurrentFilter(null);
  };

  const generateFilterExpression = () => {
    if (s2Fields.filters.length === 0) return '';
    
    return s2Fields.filters.map((filter, index) => {
      const prefix = index > 0 ? ` ${filter.logicalOperator || 'AND'} ` : '';
      return `${prefix}${filter.fieldName} ${filter.operator} ${filter.value}`;
    }).join('');
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      const allFields = [...s2Fields.rows, ...s2Fields.columns, ...s2Fields.values];
      
      const configData = {
        ...values,
        datasetRefs: [selectedDataset],
        fields: allFields,
        s2Config: {
          rows: s2Fields.rows,
          columns: s2Fields.columns,
          values: s2Fields.values,
          filters: s2Fields.filters
        }
      };
      
      onSave(configData);
      message.success('S2报表配置保存成功');
    } catch (error) {
      console.error('保存失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 可拖拽的字段项组件
  const DraggableFieldItem: React.FC<{
    field: FieldConfig;
  }> = ({ field }) => {
    const [{ isDragging }, drag] = useDrag({
      type: 'field',
      item: { field },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });

    const isUsed = s2Fields.rows.some(f => f.id === field.id) ||
                  s2Fields.columns.some(f => f.id === field.id) ||
                  s2Fields.values.some(f => f.id === field.id);

    if (isUsed) {
      return null; // 已使用的字段不显示
    }

    return (
      <div
        ref={drag}
        style={{
          padding: '6px 8px',
          margin: '2px 0',
          border: '1px solid #e8e8e8',
          borderRadius: '4px',
          backgroundColor: isDragging ? '#e6f7ff' : '#fff',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          cursor: 'move',
          opacity: isDragging ? 0.5 : 1,
          transition: 'all 0.2s',
        }}
      >
        <Tag 
          color={field.fieldType === 'dimension' ? 'blue' : 'green'}
          style={{ margin: 0, fontSize: '10px', padding: '0 4px' }}
        >
          {field.fieldType === 'dimension' ? '维' : '度'}
        </Tag>
        <span style={{ fontSize: '12px' }}>{field.displayName}</span>
      </div>
    );
  };

  // 按模型分组字段
  const groupFieldsByModel = () => {
    const groups: { [key: string]: FieldConfig[] } = {};
    availableFields.forEach(field => {
      if (!groups[field.modelName!]) {
        groups[field.modelName!] = [];
      }
      groups[field.modelName!].push(field);
    });
    return groups;
  };

  const fieldGroups = groupFieldsByModel();

  // 渲染字段项组件
  const FieldItem: React.FC<{
    field: FieldConfig;
    showActions?: boolean;
    area?: 'rows' | 'columns' | 'values';
    onRemove?: () => void;
    onDisplayNameChange?: (name: string) => void;
    onAggregationChange?: (agg: string) => void;
  }> = ({ field, showActions = false, area, onRemove, onDisplayNameChange, onAggregationChange }) => (
    <div style={{
      padding: '8px 12px',
      margin: '4px 0',
      backgroundColor: '#f5f5f5',
      border: '1px solid #d9d9d9',
      borderRadius: '6px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 500 }}>{field.displayName}</span>
          <Tag color={field.fieldType === 'dimension' ? 'blue' : 'green'}>
            {field.fieldType === 'dimension' ? '维度' : '度量'}
          </Tag>
          <Tag color="purple">{field.modelName}</Tag>
        </div>
        {showActions && (
          <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
            <Input
              size="small"
              value={field.displayName}
              onChange={(e) => onDisplayNameChange?.(e.target.value)}
              placeholder="显示别名"
              style={{ width: '150px' }}
            />
            {area === 'values' && field.fieldType === 'measure' && (
              <Select
                size="small"
                value={field.aggregation || 'sum'}
                onChange={onAggregationChange}
                style={{ width: '100px' }}
              >
                <Option value="sum">求和</Option>
                <Option value="avg">平均</Option>
                <Option value="count">计数</Option>
                <Option value="max">最大</Option>
                <Option value="min">最小</Option>
              </Select>
            )}
          </div>
        )}
      </div>
      {showActions && (
        <Button
          type="text"
          danger
          size="small"
          icon={<Trash2 className="w-4 h-4" />}
          onClick={onRemove}
        />
      )}
    </div>
  );
  
  // 可放置的配置区域组件
  const ConfigArea: React.FC<{
    title: string;
    fields: FieldConfig[];
    area: 'rows' | 'columns' | 'values';
    description: string;
  }> = ({ title, fields, area, description }) => {
    const [{ isOver, canDrop }, drop] = useDrop({
      accept: 'field',
      drop: (item: { field: FieldConfig }) => {
        handleAddFieldToArea(item.field, area);
      },
      canDrop: (item: { field: FieldConfig }) => {
        // 检查字段类型是否匹配
        if (area === 'values' && item.field.fieldType !== 'measure') {
          return false;
        }
        if ((area === 'rows' || area === 'columns') && item.field.fieldType !== 'dimension') {
          return false;
        }
        // 检查字段是否已存在
        const isUsed = s2Fields.rows.some(f => f.id === item.field.id) ||
                      s2Fields.columns.some(f => f.id === item.field.id) ||
                      s2Fields.values.some(f => f.id === item.field.id);
        return !isUsed;
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    });

    return (
    <Card size="small" title={title} style={{ minHeight: '200px', marginBottom: '8px' }}>
      <Text type="secondary" style={{ fontSize: '12px' }}>{description}</Text>
      <div 
        ref={drop}
        style={{ 
          marginTop: '12px', 
          minHeight: '120px',
          maxHeight: '180px', 
          overflowY: 'auto',
          border: `1px dashed ${isOver && canDrop ? '#1890ff' : 'transparent'}`,
          borderRadius: '6px',
          backgroundColor: isOver && canDrop ? '#f0f8ff' : 'transparent',
          padding: '4px'
        }}
      >
        {fields.map(field => (
          <FieldItem
            key={field.id}
            field={field}
            showActions
            area={area}
            onRemove={() => handleRemoveFieldFromArea(field.id, area)}
            onDisplayNameChange={(name) => handleFieldDisplayNameChange(field.id, name, area)}
            onAggregationChange={(agg) => handleFieldAggregationChange(field.id, agg)}
          />
        ))}
        {fields.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: '#999',
            padding: '20px',
            border: '2px dashed #d9d9d9',
            borderRadius: '6px'
          }}>
            {isOver && canDrop ? '释放以添加字段' : '拖拽字段到此区域或点击下方字段添加'}
          </div>
        )}
      </div>
    </Card>
    );
  };

  // 生成预览数据
  const generatePreviewData = () => {
    if (s2Fields.rows.length === 0 || s2Fields.values.length === 0) {
      return { data: [], meta: { fields: [] } };
    }
    
    // 模拟数据
    const mockData = [
      { region: '华东', city: '上海', category: '电子产品', sales: 12000, profit: 2400 },
      { region: '华东', city: '上海', category: '服装', sales: 8000, profit: 1600 },
      { region: '华东', city: '杭州', category: '电子产品', sales: 9000, profit: 1800 },
      { region: '华北', city: '北京', category: '电子产品', sales: 15000, profit: 3000 },
      { region: '华北', city: '北京', category: '服装', sales: 6000, profit: 1200 },
    ];
    
    return {
      data: mockData,
      meta: {
        fields: [...s2Fields.rows, ...s2Fields.columns, ...s2Fields.values].map(f => f.fieldName)
      }
    };
  };
  
  const previewData = generatePreviewData();

  // 筛选条件编辑模态框组件
  const FilterModal: React.FC = () => {
    const [filterForm] = Form.useForm();
    const [selectedField, setSelectedField] = useState<FieldConfig | null>(null);
    const [selectedOperator, setSelectedOperator] = useState<string>('');

    useEffect(() => {
      if (filterModalVisible) {
        if (currentFilter) {
          // 编辑模式
          const field = availableFields.find(f => f.id === currentFilter.fieldId);
          setSelectedField(field || null);
          setSelectedOperator(currentFilter.operator);
          filterForm.setFieldsValue({
            fieldId: currentFilter.fieldId,
            operator: currentFilter.operator,
            value: currentFilter.value,
            logicalOperator: currentFilter.logicalOperator || 'AND'
          });
        } else {
          // 新增模式
          filterForm.resetFields();
          setSelectedField(null);
          setSelectedOperator('');
        }
      }
    }, [filterModalVisible, currentFilter, filterForm]);

    const handleFieldChange = (fieldId: string) => {
      const field = availableFields.find(f => f.id === fieldId);
      setSelectedField(field || null);
      setSelectedOperator('');
      filterForm.setFieldsValue({ operator: undefined, value: undefined });
    };

    const handleOperatorChange = (operator: string) => {
      setSelectedOperator(operator);
      filterForm.setFieldsValue({ value: undefined });
    };

    const handleSubmit = async () => {
      try {
        const values = await filterForm.validateFields();
        const field = availableFields.find(f => f.id === values.fieldId);
        if (!field) return;

        const filterData: Omit<FilterCondition, 'id'> = {
          fieldId: values.fieldId,
          fieldName: field.displayName,
          fieldType: field.dataType,
          operator: values.operator,
          value: values.value,
          logicalOperator: values.logicalOperator
        };

        handleSaveFilter(filterData);
      } catch (error) {
        console.error('表单验证失败:', error);
      }
    };

    const renderValueInput = () => {
      if (!selectedField || !selectedOperator) return null;

      const { dataType } = selectedField;
      
      // 不需要值输入的操作符
      if (['is_empty', 'is_not_empty'].includes(selectedOperator)) {
        return null;
      }

      // 根据字段类型和操作符渲染不同的输入组件
      if (dataType === 'boolean') {
        return (
          <Select placeholder="请选择值">
            <Option value={true}>是</Option>
            <Option value={false}>否</Option>
          </Select>
        );
      }

      if (dataType === 'date') {
        if (['last_n_days', 'next_n_days'].includes(selectedOperator)) {
          return <Input type="number" placeholder="请输入天数" />;
        }
        if (selectedOperator === 'between') {
          return (
            <Input.Group compact>
              <Input style={{ width: '45%' }} type="date" placeholder="开始日期" />
              <Input style={{ width: '10%', textAlign: 'center', pointerEvents: 'none' }} placeholder="~" disabled />
              <Input style={{ width: '45%' }} type="date" placeholder="结束日期" />
            </Input.Group>
          );
        }
        return <Input type="date" placeholder="请选择日期" />;
      }

      if (['integer', 'decimal'].includes(dataType)) {
        if (selectedOperator === 'between') {
          return (
            <Input.Group compact>
              <Input style={{ width: '45%' }} type="number" placeholder="最小值" />
              <Input style={{ width: '10%', textAlign: 'center', pointerEvents: 'none' }} placeholder="~" disabled />
              <Input style={{ width: '45%' }} type="number" placeholder="最大值" />
            </Input.Group>
          );
        }
        if (['in', 'not_in'].includes(selectedOperator)) {
          return <Input placeholder="请输入值，用逗号分隔" />;
        }
        return <Input type="number" placeholder="请输入数值" />;
      }

      // 字符串类型
      if (['in', 'not_in'].includes(selectedOperator)) {
        return <Input placeholder="请输入值，用逗号分隔" />;
      }
      return <Input placeholder="请输入值" />;
    };

    return (
      <Modal
        title={currentFilter ? '编辑筛选条件' : '添加筛选条件'}
        open={filterModalVisible}
        onOk={handleSubmit}
        onCancel={() => setFilterModalVisible(false)}
        width={600}
      >
        <Form
          form={filterForm}
          layout="vertical"
        >
          <Form.Item
            name="fieldId"
            label="筛选字段"
            rules={[{ required: true, message: '请选择筛选字段' }]}
          >
            <Select
              placeholder="请选择字段"
              onChange={handleFieldChange}
              showSearch
              optionFilterProp="children"
            >
              {availableFields.map(field => (
                <Option key={field.id} value={field.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Tag color={field.fieldType === 'dimension' ? 'blue' : 'green'}>
                      {field.fieldType === 'dimension' ? '维' : '度'}
                    </Tag>
                    <span>{field.displayName}</span>
                    <Tag color="purple">{field.modelName}</Tag>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="operator"
            label="操作符"
            rules={[{ required: true, message: '请选择操作符' }]}
          >
            <Select
              placeholder="请选择操作符"
              onChange={handleOperatorChange}
              disabled={!selectedField}
            >
              {selectedField && getOperatorsByFieldType(selectedField.dataType).map(op => (
                <Option key={op.value} value={op.value}>{op.label}</Option>
              ))}
            </Select>
          </Form.Item>

          {renderValueInput() && (
            <Form.Item
              name="value"
              label="筛选值"
              rules={[{ required: true, message: '请输入筛选值' }]}
            >
              {renderValueInput()}
            </Form.Item>
          )}

          {s2Fields.filters.length > 0 && (
            <Form.Item
              name="logicalOperator"
              label="逻辑操作符"
              initialValue="AND"
            >
              <Select>
                <Option value="AND">AND (且)</Option>
                <Option value="OR">OR (或)</Option>
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>
    );
  };

  // 筛选条件列表组件
  const FilterList: React.FC = () => {
    const columns = [
      {
        title: '字段',
        dataIndex: 'fieldName',
        key: 'fieldName',
        render: (text: string, record: FilterCondition) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Tag color="blue">{text}</Tag>
          </div>
        )
      },
      {
        title: '操作符',
        dataIndex: 'operator',
        key: 'operator',
        render: (operator: string) => {
          const allOperators = [
            ...getOperatorsByFieldType('string'),
            ...getOperatorsByFieldType('integer'),
            ...getOperatorsByFieldType('date'),
            ...getOperatorsByFieldType('boolean')
          ];
          const operatorLabel = allOperators.find(op => op.value === operator)?.label || operator;
          return <Tag color="green">{operatorLabel}</Tag>;
        }
      },
      {
        title: '值',
        dataIndex: 'value',
        key: 'value',
        render: (value: any) => (
          <span style={{ fontFamily: 'monospace' }}>{String(value)}</span>
        )
      },
      {
        title: '逻辑操作符',
        dataIndex: 'logicalOperator',
        key: 'logicalOperator',
        render: (operator: string) => operator ? <Tag color="orange">{operator}</Tag> : '-'
      },
      {
        title: '操作',
        key: 'actions',
        render: (_: any, record: FilterCondition) => (
          <Space>
            <Button
              type="text"
              size="small"
              icon={<Settings className="w-4 h-4" />}
              onClick={() => handleEditFilter(record)}
            >
              编辑
            </Button>
            <Button
              type="text"
              danger
              size="small"
              icon={<Trash2 className="w-4 h-4" />}
              onClick={() => handleDeleteFilter(record.id)}
            >
              删除
            </Button>
          </Space>
        )
      }
    ];

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings className="w-4 h-4" />
            <span style={{ fontWeight: 500 }}>筛选条件</span>
            <Tag color="blue">{s2Fields.filters.length}</Tag>
          </div>
          <Button
            type="primary"
            size="small"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleAddFilter}
            disabled={!selectedDataset}
          >
            添加筛选条件
          </Button>
        </div>

        {s2Fields.filters.length > 0 ? (
          <>
            <Table
              dataSource={s2Fields.filters}
              columns={columns}
              rowKey="id"
              size="small"
              pagination={false}
              style={{ marginBottom: '16px' }}
            />
            
            <div style={{ 
              padding: '12px', 
              backgroundColor: '#f5f5f5', 
              borderRadius: '6px',
              border: '1px solid #d9d9d9'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Code className="w-4 h-4" />
                <span style={{ fontWeight: 500, fontSize: '12px' }}>筛选表达式预览</span>
              </div>
              <div style={{ 
                fontFamily: 'monospace', 
                fontSize: '12px', 
                color: '#666',
                backgroundColor: '#fff',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #e8e8e8'
              }}>
                {generateFilterExpression() || '暂无筛选条件'}
              </div>
            </div>
          </>
        ) : (
          <div style={{
            textAlign: 'center',
            color: '#999',
            padding: '40px 20px',
            border: '2px dashed #d9d9d9',
            borderRadius: '6px'
          }}>
            暂无筛选条件，点击上方按钮添加
          </div>
        )}
      </div>
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ padding: '16px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
        {/* 顶部操作按钮 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          marginBottom: '16px',
          gap: '8px'
        }}>
          <Button onClick={onCancel}>
            取消
          </Button>
          <Button type="primary" loading={loading} onClick={handleSave}>
            保存配置
          </Button>
        </div>
        
        <Row gutter={16} style={{ height: 'calc(100vh - 80px)' }}>
          {/* 左侧：数据集选择和基本信息 */}
         <Col span={6}>
          <Card title="报表配置" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Form
              form={form}
              layout="vertical"
              style={{ flex: 1 }}
            >
              <Form.Item
                name="templateName"
                label="模板名称"
                rules={[
                  { required: true, message: '请输入模板名称' },
                  { max: 50, message: '模板名称不能超过50个字符' }
                ]}
              >
                <Input placeholder="请输入模板名称" />
              </Form.Item>

              <Form.Item
                name="description"
                label="模板描述"
                rules={[
                  { max: 200, message: '模板描述不能超过200个字符' }
                ]}
              >
                <TextArea rows={3} placeholder="请输入模板描述" />
              </Form.Item>

              <Form.Item
                name="dataset"
                label="数据集"
                rules={[{ required: true, message: '请选择数据集' }]}
              >
                <Select
                  placeholder="请选择数据集"
                  onChange={handleDatasetChange}
                >
                  {mockDatasets.map(dataset => (
                    <Option key={dataset.id} value={dataset.id}>
                      {dataset.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              
              {selectedDataset && (
                <>
                  <Divider>可用字段</Divider>
                  <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    <Collapse 
                      size="small"
                      ghost
                      defaultActiveKey={Object.keys(fieldGroups)}
                      expandIcon={({ isActive }) => 
                        isActive ? <ChevronDown size={12} /> : <ChevronRight size={12} />
                      }
                    >
                      {Object.entries(fieldGroups).map(([modelName, fields]) => (
                        <Collapse.Panel 
                          key={modelName} 
                          header={
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '12px', fontWeight: 500 }}>{modelName}</span>
                              <Tag color="purple">{fields.length}</Tag>
                            </div>
                          }
                          style={{ border: 'none' }}
                        >
                          <div style={{ paddingLeft: '8px' }}>
                            {fields.map(field => (
                              <DraggableFieldItem key={field.id} field={field} />
                            ))}
                          </div>
                        </Collapse.Panel>
                      ))}
                    </Collapse>
                  </div>
                </>
              )}
            </Form>
            

          </Card>
        </Col>
        
        {/* 中间：字段配置区域 */}
         <Col span={10}>
          <Card title="字段配置" style={{ height: '100%' }}>
            {selectedDataset ? (
              <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 40px)' }}>
                <Tabs
                    defaultActiveKey="fields"
                    size="small"
                    style={{ flex: 1 }}
                    tabBarStyle={{ marginBottom: '16px' }}
                    items={[
                      {
                        key: 'fields',
                        label: '字段配置',
                        children: (
                          <div style={{ height: 'calc(100vh - 300px)' }}>
                            <Text type="secondary" style={{ marginBottom: '16px', display: 'block' }}>
                              拖拽或点击字段到对应区域进行配置
                            </Text>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', height: 'calc(100% - 40px)' }}>
                              <ConfigArea
                                title="行维度 (Rows)"
                                fields={s2Fields.rows}
                                area="rows"
                                description="显示在表格左侧的维度字段，支持多层级"
                              />
                              <ConfigArea
                                title="列维度 (Columns)"
                                fields={s2Fields.columns}
                                area="columns"
                                description="显示在表格顶部的维度字段，支持多层级"
                              />
                              <ConfigArea
                                title="值 (Values)"
                                fields={s2Fields.values}
                                area="values"
                                description="显示在单元格中的度量字段，支持聚合计算"
                              />
                            </div>
                          </div>
                        )
                      },
                      {
                        key: 'filters',
                        label: '筛选条件',
                        children: (
                          <div style={{ height: 'calc(100vh - 300px)', overflowY: 'auto' }}>
                            <FilterList />
                          </div>
                        )
                      }
                    ]}
                  />
              </div>
            ) : (
              <div style={{ 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#999'
              }}>
                请先选择数据集
              </div>
            )}
          </Card>
        </Col>
        
        {/* 右侧：实时预览 */}
         <Col span={8}>
          <Card title="实时预览" style={{ height: '100%' }}>
            {selectedDataset && (s2Fields.rows.length > 0 || s2Fields.values.length > 0) ? (
              <div style={{ height: 'calc(100% - 40px)' }}>
                <div style={{ 
                  border: '1px solid #d9d9d9', 
                  borderRadius: '6px', 
                  padding: '16px',
                  height: '100%',
                  backgroundColor: '#fafafa'
                }}>
                  <Text strong style={{ display: 'block', marginBottom: '12px' }}>预览配置</Text>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    <div>行维度: {s2Fields.rows.map(f => f.displayName).join(', ') || '无'}</div>
                    <div>列维度: {s2Fields.columns.map(f => f.displayName).join(', ') || '无'}</div>
                    <div>值字段: {s2Fields.values.map(f => f.displayName).join(', ') || '无'}</div>
                    <div>筛选条件: {s2Fields.filters.length > 0 ? `${s2Fields.filters.length}个条件` : '无'}</div>
                  </div>
                  
                  <Divider style={{ margin: '12px 0' }} />
                  
                  <div style={{ 
                    border: '1px solid #e8e8e8',
                    borderRadius: '4px',
                    padding: '8px',
                    backgroundColor: '#fff',
                    minHeight: '200px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#999'
                  }}>
                    {s2Fields.rows.length === 0 && s2Fields.values.length === 0 ? 
                      '请配置行维度和值字段以查看预览' : 
                      'S2透视表预览区域\n(实际项目中这里会渲染真实的S2组件)'
                    }
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#999'
              }}>
                配置字段后可查看预览
              </div>
            )}
          </Card>
        </Col>
      </Row>
      
      {/* 筛选条件编辑模态框 */}
      <FilterModal />
      </div>
    </DndProvider>
  );
};

export default S2ReportConfig;