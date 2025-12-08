import React, { useState, useMemo } from 'react';
import {
  Modal,
  Input,
  Typography,
  Card,
  Tag,
  Empty,
  Button
} from 'antd';
import { FieldMetadata } from './QueryConditionsPanel';

const { Search } = Input;

interface ConditionSelectorProps {
  visible: boolean;
  fields: FieldMetadata[];
  title: string;
  onFieldSelect: (field: FieldMetadata) => void;
  onCancel: () => void;
}

const ConditionSelector: React.FC<ConditionSelectorProps> = ({
  visible,
  fields,
  title,
  onFieldSelect,
  onCancel
}) => {
  const [searchText, setSearchText] = useState('');

  // 过滤字段
  const filteredFields = useMemo(() => {
    let result = fields;

    // 按搜索文本过滤
    if (searchText) {
      result = result.filter(field =>
        field.name.toLowerCase().includes(searchText.toLowerCase()) ||
        field.id.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    return result;
  }, [fields, searchText]);

  // 获取控件类型的中文名称
  const getComponentTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      'input': '文本输入',
      'select': '下拉选择',
      'multiSelect': '多选',
      'datePicker': '日期选择',
      'dateRangePicker': '日期区间',
      'numberRange': '数值区间',
      'modalSelector': '弹窗选择',
      'metricCompare': '指标对比'
    };
    return typeMap[type] || '未知类型';
  };

  // 获取控件类型的颜色
  const getComponentTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      'input': 'blue',
      'select': 'green',
      'multiSelect': 'cyan',
      'datePicker': 'orange',
      'dateRangePicker': 'orange',
      'numberRange': 'purple',
      'modalSelector': 'geekblue',
      'metricCompare': 'magenta'
    };
    return colorMap[type] || 'default';
  };

  // 渲染字段卡片
  const renderFieldCard = (field: FieldMetadata) => {
    const handleFieldClick = () => {
      onFieldSelect(field);
    };

    return (
      <Card
        key={field.id}
        size="small"
        hoverable
        className="cursor-pointer mb-2"
        onClick={handleFieldClick}
        bodyStyle={{ padding: '12px 16px' }}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-800">
            {field.name}
          </span>
          <Tag color={getComponentTypeColor(field.componentType)} size="small">
            {getComponentTypeName(field.componentType)}
          </Tag>
        </div>
      </Card>
    );
  };

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={600}
      destroyOnClose
    >
      {/* 搜索区域 */}
      <div className="mb-4">
        <Search
          placeholder="搜索字段名称"
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ marginBottom: 12 }}
        />

        {searchText && (
          <Typography.Text type="secondary" className="text-sm">
            找到 {filteredFields.length} 个匹配字段
          </Typography.Text>
        )}
      </div>

      {/* 字段列表区域 */}
      <div style={{ maxHeight: 400, overflowY: 'auto' }}>
        {filteredFields.length > 0 ? (
          <div>
            {filteredFields.map(renderFieldCard)}
          </div>
        ) : (
          <Empty
            description="暂无匹配的字段"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            {searchText && (
              <Button size="small" onClick={() => setSearchText('')}>
                清除搜索条件
              </Button>
            )}
          </Empty>
        )}
      </div>
    </Modal>
  );
};

export default ConditionSelector;
