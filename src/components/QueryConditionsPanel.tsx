import React, { useState, useCallback } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Divider,
  Tag,
  Empty,
  Collapse,
  message
} from 'antd';
import {
  PlusOutlined,
  FilterOutlined,
  DeleteOutlined,
  SettingOutlined
} from '@ant-design/icons';
import QueryConditionGroup from './QueryConditionGroup';
import ConditionSelector from './ConditionSelector';

const { Title } = Typography;
const { Panel } = Collapse;

// 查询条件接口
export interface QueryCondition {
  id: string;
  fieldId: string;
  fieldName: string;
  fieldType: 'dimension' | 'metric';
  groupType: 'comparison' | 'groupPrice' | 'historyPrice' | 'metric';
  value: any;
  isPredefined: boolean;
  componentType: 'input' | 'select' | 'multiSelect' | 'dateRange' | 'numberRange' | 'modalSelector';
  options?: string[]; // 用于select类型的选项
  placeholder?: string;
}

// 查询条件分组接口
export interface QueryConditionGroupData {
  type: 'comparison' | 'groupPrice' | 'historyPrice' | 'metric';
  title: string;
  description: string;
  conditions: QueryCondition[];
}

// 字段元数据接口
export interface FieldMetadata {
  id: string;
  name: string;
  type: 'dimension' | 'metric';
  componentType: 'input' | 'select' | 'multiSelect' | 'dateRange' | 'numberRange' | 'modalSelector';
  options?: string[];
  placeholder?: string;
  description?: string;
}

interface QueryConditionsPanelProps {
  visible?: boolean;
  conditions: QueryCondition[];
  onConditionsChange: (conditions: QueryCondition[]) => void;
  availableFields: FieldMetadata[];
  predefinedConditions?: QueryCondition[];
  loading?: boolean;
}

const QueryConditionsPanel: React.FC<QueryConditionsPanelProps> = ({
  visible = true,
  conditions,
  onConditionsChange,
  availableFields,
  predefinedConditions = [],
  loading = false
}) => {
  const [activeGroups, setActiveGroups] = useState<string[]>(['comparison', 'groupPrice', 'historyPrice', 'metric']);
  const [selectorVisible, setSelectorVisible] = useState<string | null>(null);

  // 按分组类型组织条件
  const organizeConditionsByGroup = useCallback(() => {
    const groups: Record<string, QueryCondition[]> = {
      comparison: [],
      groupPrice: [],
      historyPrice: [],
      metric: []
    };

    // 处理用户添加的条件
    conditions.forEach(condition => {
      groups[condition.groupType].push(condition);
    });

    // 处理预置条件，将原来的baseline类型条件分配到对应分组
    predefinedConditions.forEach(condition => {
      if (condition.groupType === 'baseline') {
        // 根据baselineName分配到对应分组
        const groupName = (condition as any).baselineName === '历史价' ? 'historyPrice' : 'groupPrice';
        // 检查是否已存在相同的预置条件
        const exists = groups[groupName].some(c =>
          c.isPredefined && c.fieldId === condition.fieldId
        );
        if (!exists) {
          groups[groupName].push({
            ...condition,
            groupType: groupName
          });
        }
      } else {
        groups[condition.groupType].push(condition);
      }
    });

    return groups;
  }, [conditions, predefinedConditions]);

  // 获取已使用的字段ID
  const getUsedFieldIds = useCallback(() => {
    return conditions
      .filter(condition => !condition.isPredefined) // 预置条件不算占用
      .map(condition => condition.fieldId);
  }, [conditions]);

  // 添加查询条件
  const handleAddCondition = useCallback((
    groupType: 'comparison' | 'groupPrice' | 'historyPrice' | 'metric',
    field: FieldMetadata
  ) => {
    const usedFieldIds = getUsedFieldIds();
    if (usedFieldIds.includes(field.id)) {
      message.warning('该字段已添加过查询条件');
      return;
    }

    const newCondition: QueryCondition = {
      id: `${field.id}_${Date.now()}`,
      fieldId: field.id,
      fieldName: field.name,
      fieldType: field.type,
      groupType,
      value: null,
      isPredefined: false,
      componentType: field.componentType,
      options: field.options,
      placeholder: field.placeholder
    };

    onConditionsChange([...conditions, newCondition]);
    message.success(`已添加${field.name}查询条件`);
  }, [conditions, getUsedFieldIds, onConditionsChange]);

  // 更新查询条件值
  const handleUpdateCondition = useCallback((
    conditionId: string,
    value: any
  ) => {
    const updatedConditions = conditions.map(condition =>
      condition.id === conditionId ? { ...condition, value } : condition
    );
    onConditionsChange(updatedConditions);
  }, [conditions, onConditionsChange]);

  // 删除查询条件
  const handleRemoveCondition = useCallback((
    conditionId: string
  ) => {
    const condition = conditions.find(c => c.id === conditionId);
    if (condition?.isPredefined) {
      message.warning('预置条件不能删除');
      return;
    }
    onConditionsChange(conditions.filter(c => c.id !== conditionId));
  }, [conditions, onConditionsChange]);

  // 清空自定义条件
  const handleClearCustomConditions = useCallback(() => {
    const predefinedOnly = conditions.filter(c => c.isPredefined);
    onConditionsChange(predefinedOnly);
    message.success('已清空自定义查询条件');
  }, [conditions, onConditionsChange]);

  const groupedConditions = organizeConditionsByGroup();
  const usedFieldIds = getUsedFieldIds();

  // 分组配置
  const groupConfigs = [
    {
      key: 'comparison',
      title: '比对对象',
      description: '设置比对对象的查询条件',
      icon: <FilterOutlined className="text-blue-600" />,
      color: 'blue'
    },
    {
      key: 'groupPrice',
      title: '集团价',
      description: '设置集团采购价格基准条件',
      icon: <SettingOutlined className="text-green-600" />,
      color: 'green'
    },
    {
      key: 'historyPrice',
      title: '历史价',
      description: '设置历史采购价格基准条件',
      icon: <SettingOutlined className="text-purple-600" />,
      color: 'purple'
    },
    {
      key: 'metric',
      title: '指标',
      description: '设置指标的数值区间条件',
      icon: <FilterOutlined className="text-orange-600" />,
      color: 'orange'
    }
  ];

  if (!visible) {
    return null;
  }

  return (
    <Card
      className="mb-4"
      size="small"
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FilterOutlined className="mr-2 text-blue-600" />
            <Title level={5} className="mb-0">查询条件</Title>
          </div>
          <Space>
            <Button
              size="small"
              onClick={handleClearCustomConditions}
              disabled={conditions.filter(c => !c.isPredefined).length === 0}
            >
              清空条件
            </Button>
          </Space>
        </div>
      }
    >
      <Collapse
        activeKey={activeGroups}
        onChange={setActiveGroups}
        size="small"
        ghost
      >
        {groupConfigs.map(config => {
          const groupConditions = groupedConditions[config.key];

          return (
            <Panel
              key={config.key}
              header={
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    {config.icon}
                    <span className="ml-2 font-medium">{config.title}</span>
                    <Typography.Text type="secondary" className="ml-2 text-xs">
                      {config.description}
                    </Typography.Text>
                  </div>
                </div>
              }
            >
              <QueryConditionGroup
                type={config.key as 'comparison' | 'groupPrice' | 'historyPrice' | 'metric'}
                conditions={groupConditions}
                availableFields={availableFields.filter(field => {
                  // 比对对象、集团价、历史价主要是维度，指标分组主要是指标
                  if (config.key === 'metric') {
                    return field.type === 'metric' && !usedFieldIds.includes(field.id);
                  } else {
                    return field.type === 'dimension' && !usedFieldIds.includes(field.id);
                  }
                })}
                onUpdateCondition={handleUpdateCondition}
                onRemoveCondition={handleRemoveCondition}
                onAddCondition={(field) => handleAddCondition(config.key as 'comparison' | 'groupPrice' | 'historyPrice' | 'metric', field)}
              />
            </Panel>
          );
        })}
      </Collapse>

      {conditions.length === 0 && predefinedConditions.length === 0 && (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="暂无查询条件"
          className="py-4"
        >
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setSelectorVisible('comparison')}
          >
            添加查询条件
          </Button>
        </Empty>
      )}
    </Card>
  );
};

export default QueryConditionsPanel;