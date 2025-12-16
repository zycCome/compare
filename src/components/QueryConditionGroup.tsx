import React, { useState } from 'react';
import { Button } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
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
  allFields: FieldMetadata[];
}

const QueryConditionGroup: React.FC<QueryConditionGroupProps> = ({
  conditions,
  availableFields,
  onUpdateCondition,
  onRemoveCondition,
  onAddCondition,
  allFields
}) => {
  const [selectorVisible, setSelectorVisible] = useState(false);

  // 分离预置条件和自定义条件
  const predefinedConditions = conditions.filter(c => c.isPredefined);
  const customConditions = conditions.filter(c => !c.isPredefined);

  // 渲染条件项（行内样式）
  const renderConditionInline = (condition: QueryCondition) => {
    const renderTitle = () => {
      if (condition.componentType === 'metricCompare') {
        const leftId = (condition.value || {}).leftMetricId;
        const rightId = (condition.value || {}).rightMetricId;
        const op = (condition.value || {}).op || '=';
        const findName = (id?: string) => {
          if (!id) return '';
          const f = allFields.find(ff => ff.id === id);
          return f ? f.name : id;
        };
        const leftName = findName(leftId);
        const rightName = findName(rightId);
        if (leftName && rightName) {
          return `${leftName} ${op} ${rightName}`;
        }
        return '请选择两个指标';
      }
      return condition.fieldName;
    };
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
          {renderTitle()}
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
            allFields={allFields}
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
        title="选择查询字段"
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
