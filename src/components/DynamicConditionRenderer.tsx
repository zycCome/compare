import React, { useState } from 'react';
import {
  Input,
  Select,
  DatePicker,
  InputNumber,
  Button,
  Space,
  Modal,
  Tree,
  Checkbox,
  Tag,
  Typography
} from 'antd';
import {
  CalendarOutlined,
  NumberOutlined,
  SearchOutlined,
  FolderOpenOutlined
} from '@ant-design/icons';
import { QueryCondition } from './QueryConditionsPanel';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

interface DynamicConditionRendererProps {
  condition: QueryCondition;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  editing?: boolean;
  inline?: boolean;
  allFields?: Array<{
    id: string;
    name: string;
    type: 'dimension' | 'metric' | 'baseline' | 'calculated';
    componentType: string;
  }>;
}

const DynamicConditionRenderer: React.FC<DynamicConditionRendererProps> = ({
  condition,
  value,
  onChange,
  disabled = false,
  editing = true,
  inline = false,
  allFields = []
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedModalItems, setSelectedModalItems] = useState<string[]>([]);

  // 根据字段类型和组件类型渲染对应的控件
  const renderControl = () => {
    // 指标比较控件
    if (condition.componentType === 'metricCompare') {
      return renderMetricCompare();
    }

    // 指标类型固定为数值区间
    if (condition.fieldType === 'metric') {
      return renderNumberRange();
    }

    // 根据组件类型渲染维度控件
    switch (condition.componentType) {
      case 'input':
        return renderTextInput();
      case 'select':
        return renderSelectInput();
      case 'multiSelect':
        return renderMultiSelect();
      case 'datePicker':
        return renderDatePicker();
      case 'dateRangePicker':
        return renderDateRange();
      case 'numberRange':
        return renderNumberRange();
      case 'modalSelector':
        return renderModalSelector();
      default:
        return renderTextInput();
    }
  };

  // 指标对比控件（两个指标 + 比较符）
  const renderMetricCompare = () => {
    const operator = value?.op || '=';
    const leftMetricId = value?.leftMetricId || undefined;
    const rightMetricId = value?.rightMetricId || undefined;

    const metricOptions = allFields.filter(f => f.type === 'metric' || f.type === 'baseline');

    const OperatorSelect = (
      <Select
        value={operator}
        onChange={(op) => onChange({ ...value, op })}
        disabled={disabled || !editing}
        size="small"
        style={inline ? { width: 60 } : { width: 100 }}
      >
        {['=', '≠', '>', '≥', '<', '≤'].map(op => (
          <Option key={op} value={op}>{op}</Option>
        ))}
      </Select>
    );

    const MetricSelect = (currentId: string | undefined, onChangeId: (id: string) => void) => (
      <Select
        showSearch
        placeholder={inline ? '指标' : '选择指标'}
        value={currentId}
        onChange={onChangeId}
        disabled={disabled || !editing}
        size="small"
        style={inline ? { width: 120 } : { width: '40%' }}
        filterOption={(input, option) =>
          (option?.label as string).toLowerCase().includes(input.toLowerCase())
        }
        options={metricOptions.map(m => ({ value: m.id, label: m.name }))}
      />
    );

    if (inline) {
      return (
        <Space size={4} align="center">
          {MetricSelect(leftMetricId, (id) => onChange({ ...value, leftMetricId: id }))}
          {OperatorSelect}
          {MetricSelect(rightMetricId, (id) => onChange({ ...value, rightMetricId: id }))}
        </Space>
      );
    }

    return (
      <Space style={{ width: '100%' }}>
        {MetricSelect(leftMetricId, (id) => onChange({ ...value, leftMetricId: id }))}
        {OperatorSelect}
        {MetricSelect(rightMetricId, (id) => onChange({ ...value, rightMetricId: id }))}
      </Space>
    );
  };

  // 文本输入框
  const renderTextInput = () => {
    return (
      <Input
        placeholder={inline ? '输入' : condition.placeholder || `请输入${condition.fieldName}`}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || !editing}
        size="small"
        style={inline ? { width: 80, minWidth: 60 } : { width: '100%' }}
      />
    );
  };

  // 下拉选择框
  const renderSelectInput = () => {
    return (
      <Select
        placeholder={inline ? '选择' : condition.placeholder || `请选择${condition.fieldName}`}
        value={value}
        onChange={onChange}
        disabled={disabled || !editing}
        size="small"
        style={inline ? { width: 80, minWidth: 60 } : { width: '100%' }}
        allowClear
      >
        {condition.options?.map(option => (
          <Option key={option} value={option}>
            {option}
          </Option>
        ))}
      </Select>
    );
  };

  // 多选框
  const renderMultiSelect = () => {
    if (inline && value && value.length > 0) {
      // 在inline模式下，如果有值，显示为紧凑的标签形式
      return (
        <div className="flex items-center gap-1 h-5">
          <span className="text-xs text-gray-600">
            {value.length === 1
              ? value[0].substring(0, 4) + (value[0].length > 4 ? '...' : '')
              : `${value.length}项`
            }
          </span>
        </div>
      );
    }

    return (
      <Select
        mode="multiple"
        placeholder={inline ? '多选' : condition.placeholder || `请选择${condition.fieldName}`}
        value={value || []}
        onChange={onChange}
        disabled={disabled || !editing}
        size="small"
        style={inline ? { width: 80, minWidth: 60 } : { width: '100%' }}
        maxTagCount={inline ? 0 : undefined}
        maxTagPlaceholder={(omittedValues) => `+${omittedValues.length}`}
        dropdownStyle={inline ? { fontSize: '12px' } : {}}
      >
        {condition.options?.map(option => (
          <Option key={option} value={option}>
            {option}
          </Option>
        ))}
      </Select>
    );
  };

  // 日期选择器
  const renderDatePicker = () => {
    return (
      <DatePicker
        placeholder={inline ? '日期' : condition.placeholder || `请选择${condition.fieldName}`}
        value={value}
        onChange={(date) => onChange(date)}
        disabled={disabled || !editing}
        size="small"
        style={inline ? { width: 100, minWidth: 80 } : { width: '100%' }}
      />
    );
  };

  // 日期区间选择器
  const renderDateRange = () => {
    return (
      <RangePicker
        placeholder={inline ? ['开始', '结束'] : ['开始日期', '结束日期']}
        value={value}
        onChange={(dates) => onChange(dates)}
        disabled={disabled || !editing}
        size="small"
        style={inline ? { width: 150, minWidth: 120 } : { width: '100%' }}
      />
    );
  };

  // 数值区间（指标和数值类型的维度都使用这个）
  const renderNumberRange = () => {
    const minValue = value?.min !== undefined ? value.min : null;
    const maxValue = value?.max !== undefined ? value.max : null;

    if (inline) {
      return (
        <Input.Group compact style={{ display: 'flex', alignItems: 'center' }}>
          <InputNumber
            placeholder="最小"
            value={minValue}
            onChange={(val) => onChange({ ...value, min: val })}
            disabled={disabled || !editing}
            size="small"
            style={{ width: 60 }}
            min={0}
          />
          <span className="px-1 text-gray-400">~</span>
          <InputNumber
            placeholder="最大"
            value={maxValue}
            onChange={(val) => onChange({ ...value, max: val })}
            disabled={disabled || !editing}
            size="small"
            style={{ width: 60 }}
            min={0}
          />
        </Input.Group>
      );
    }

    return (
      <Input.Group compact>
        <InputNumber
          placeholder="最小值"
          value={minValue}
          onChange={(val) => onChange({ ...value, min: val })}
          disabled={disabled || !editing}
          size="small"
          style={{ width: '45%' }}
          min={0}
        />
        <span className="text-center" style={{ width: '10%', display: 'inline-block', lineHeight: '24px' }}>
          ~
        </span>
        <InputNumber
          placeholder="最大值"
          value={maxValue}
          onChange={(val) => onChange({ ...value, max: val })}
          disabled={disabled || !editing}
          size="small"
          style={{ width: '45%' }}
          min={0}
        />
      </Input.Group>
    );
  };

  // 弹框选择器
  const renderModalSelector = () => {
    const handleModalOk = () => {
      onChange(selectedModalItems);
      setModalVisible(false);
    };

    const handleModalCancel = () => {
      setSelectedModalItems(value || []);
      setModalVisible(false);
    };

    // 模拟树形数据
    const treeData = [
      {
        title: '组织机构',
        key: 'org',
        children: [
          { title: '集团总部', key: 'org1' },
          { title: '华北分公司', key: 'org2' },
          { title: '华东分公司', key: 'org3' },
        ]
      },
      {
        title: '产品类别',
        key: 'category',
        children: [
          { title: '生化试剂', key: 'cat1' },
          { title: '免疫试剂', key: 'cat2' },
          { title: '分子诊断', key: 'cat3' },
        ]
      }
    ];

    return (
      <div>
        <div className="flex items-center gap-2">
          <Button
            icon={<SearchOutlined />}
            onClick={() => setModalVisible(true)}
            disabled={disabled || !editing}
            size="small"
            style={inline ? { padding: '0 8px', fontSize: '12px' } : {}}
          >
            {inline ? '选择' : `选择${condition.fieldName}`}
          </Button>

          {value && value.length > 0 && (
            <div className={inline ? '' : 'flex-1'}>
              <Space wrap>
                {value.slice(0, inline ? 1 : 3).map((item: string) => (
                  <Tag key={item} size="small" closable={!disabled} onClose={() => {
                    const newValue = value.filter((v: string) => v !== item);
                    onChange(newValue);
                  }}>
                    {item}
                  </Tag>
                ))}
                {value.length > (inline ? 1 : 3) && (
                  <Tag size="small" color="blue">
                    +{value.length - (inline ? 1 : 3)} 项
                  </Tag>
                )}
              </Space>
            </div>
          )}
        </div>

        <Modal
          title={`选择${condition.fieldName}`}
          open={modalVisible}
          onOk={handleModalOk}
          onCancel={handleModalCancel}
          width={600}
          okText="确定"
          cancelText="取消"
        >
          <div className="mb-4">
            <Typography.Text type="secondary">
              请选择{condition.fieldName}，支持多选
            </Typography.Text>
          </div>

          <Tree
            checkable
            checkedKeys={selectedModalItems}
            onCheck={(checkedKeys) => setSelectedModalItems(checkedKeys as string[])}
            treeData={treeData}
            defaultExpandAll
          />
        </Modal>
      </div>
    );
  };

  // 获取控件图标
  const getControlIcon = () => {
    switch (condition.componentType) {
      case 'metricCompare':
        return <NumberOutlined className="text-gray-400" />;
      case 'datePicker':
      case 'dateRangePicker':
        return <CalendarOutlined className="text-gray-400" />;
      case 'numberRange':
        return <NumberOutlined className="text-gray-400" />;
      case 'modalSelector':
        return <FolderOpenOutlined className="text-gray-400" />;
      default:
        return <SearchOutlined className="text-gray-400" />;
    }
  };

  return (
    <div className="dynamic-condition-renderer">
      <div className="flex items-center gap-2">
        {getControlIcon()}
        <div className="flex-1">
          {renderControl()}
        </div>
      </div>

      </div>
  );
};

export default DynamicConditionRenderer;
