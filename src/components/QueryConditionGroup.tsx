import React, { useState } from 'react';
import {
  Button,
  Space,
  Typography,
  Row,
  Col,
  Tag,
  Dropdown,
  Divider,
  Alert
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  LockOutlined
} from '@ant-design/icons';
import DynamicConditionRenderer from './DynamicConditionRenderer';
import ConditionSelector from './ConditionSelector';
import { QueryCondition, FieldMetadata } from './QueryConditionsPanel';


interface QueryConditionGroupProps {
  type: 'comparison' | 'groupPrice' | 'historyPrice' | 'metric';
  conditions: QueryCondition[];
  availableFields: FieldMetadata[];
  onUpdateCondition: (conditionId: string, value: any) => void;
  onRemoveCondition: (conditionId: string) => void;
  onAddCondition: (field: FieldMetadata) => void;
}

const QueryConditionGroup: React.FC<QueryConditionGroupProps> = ({
  type,
  conditions,
  availableFields,
  onUpdateCondition,
  onRemoveCondition,
  onAddCondition
}) => {
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [editingCondition, setEditingCondition] = useState<string | null>(null);

  // 分离预置条件和自定义条件
  const predefinedConditions = conditions.filter(c => c.isPredefined);
  const customConditions = conditions.filter(c => !c.isPredefined);

  // 获取分组的颜色主题
  const getGroupTheme = () => {
    switch (type) {
      case 'comparison':
        return { color: 'blue', bgColor: '#f0f7ff' };
      case 'groupPrice':
        return { color: 'green', bgColor: '#f6ffed' };
      case 'historyPrice':
        return { color: 'purple', bgColor: '#f9f0ff' };
      case 'metric':
        return { color: 'orange', bgColor: '#fff7e6' };
      default:
        return { color: 'default', bgColor: '#f5f5f5' };
    }
  };

  const theme = getGroupTheme();

  // 渲染条件项（行内样式）
  const renderConditionInline = (condition: QueryCondition) => {
    return (
      <div
        key={condition.id}
        className={`inline-flex items-center gap-1 px-2 py-1 border rounded mr-2 mb-2 transition-all h-8 leading-6 ${
          condition.isPredefined
            ? 'border-gray-200 bg-gray-100 opacity-75'
            : 'border-blue-200 bg-white hover:border-blue-300'
        }`}
        style={{ minHeight: '32px', maxHeight: '32px' }}
      >
        {/* 字段名称 */}
        <span className={`text-xs font-medium whitespace-nowrap ${
          condition.isPredefined ? 'text-gray-600' : 'text-gray-800'
        }`}>
          {condition.fieldName}
        </span>

        {/* 分隔符 */}
        <span className="text-gray-400 text-xs flex-shrink-0">:</span>

        {/* 条件控件 */}
        <div className="min-w-0 flex-1 flex items-center">
          <DynamicConditionRenderer
            condition={condition}
            value={condition.value}
            onChange={(value) => onUpdateCondition(condition.id, value)}
            disabled={condition.isPredefined}
            editing={!condition.isPredefined}
            inline={true}
          />
        </div>

        {/* 删除按钮（仅自定义条件显示） */}
        {!condition.isPredefined && (
          <Button
            type="text"
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => onRemoveCondition(condition.id)}
            className="text-gray-400 hover:text-red-500 p-0 h-4 w-4 min-w-0 ml-1 flex-shrink-0"
            title="删除条件"
          />
        )}
      </div>
    );
  };

  return (
    <div className="query-condition-group">
      {/* 条件区域 */}
      <div className="flex flex-wrap items-center gap-2">
        {/* 显示所有条件 */}
        {[...predefinedConditions, ...customConditions].map(renderConditionInline)}

        {/* 添加条件按钮 */}
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={() => setSelectorVisible(true)}
          disabled={availableFields.length === 0}
          size="small"
          className="h-6 px-2 text-xs border-gray-300 hover:border-blue-400 hover:text-blue-600"
        >
          {availableFields.length > 0 ? '添加' : '无可用'}
        </Button>
      </div>

      {/* 条件选择器 */}
      <ConditionSelector
        visible={selectorVisible}
        fields={availableFields}
        title={`选择${type === 'metric' ? '指标' : '维度'}字段`}
        onFieldSelect={(field) => {
          onAddCondition(field);
          setSelectorVisible(false);
        }}
        onCancel={() => setSelectorVisible(false)}
      />
    </div>
  );
};

export default QueryConditionGroup;