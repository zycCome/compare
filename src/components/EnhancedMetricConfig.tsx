import React, { useState, useEffect } from 'react';
import { Form, Switch, Input, Select, Button, Space, Divider, message, Modal, Tooltip } from 'antd';
import { SettingOutlined, SaveOutlined, CloseOutlined, EditOutlined } from '@ant-design/icons';
import { MetricConfig } from '../types/metric';
import MetricConfigDialog from './MetricConfigDialog';

interface EnhancedMetricConfigProps {
  item: {
    id: string;
    name: string;
    type: 'metric' | 'calculated' | 'baseline';
    metricConfig?: MetricConfig;
  };
  availableFields: Array<{
    id: string;
    name: string;
    type: string;
    description: string;
  }>;
  onSave: (config: MetricConfig) => void;
  mode?: 'hover' | 'click' | 'hybrid'; // hover: 仅悬浮, click: 仅弹窗, hybrid: 混合模式
  children: React.ReactNode;
}

const EnhancedMetricConfig: React.FC<EnhancedMetricConfigProps> = ({
  item,
  availableFields,
  onSave,
  mode = 'hybrid',
  children
}) => {
  const [form] = Form.useForm();
  const [hoverOpen, setHoverOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tempConfig, setTempConfig] = useState<MetricConfig | null>(null);

  // 过滤适合作为属性的字段
  const attributeOptions = availableFields.filter(field =>
    field.type === 'dimension' && field.componentType
  );

  useEffect(() => {
    if (item.metricConfig) {
      setTempConfig(item.metricConfig);
      form.setFieldsValue(item.metricConfig);
    } else {
      const defaultConfig: MetricConfig = {
        groupEnabled: false,
        groupName: '',
        attributes: [],
        independentGroup: false
      };
      setTempConfig(defaultConfig);
      form.setFieldsValue(defaultConfig);
    }
  }, [item.metricConfig, form]);

  const handleHoverVisibleChange = (visible: boolean) => {
    if (visible && mode === 'hover') {
      setHoverOpen(true);
    } else if (!visible) {
      setTimeout(() => {
        setHoverOpen(false);
      }, 200);
    }
  };

  const handleGroupEnabledChange = (checked: boolean) => {
    if (!checked) {
      form.setFieldsValue({
        groupName: '',
        independentGroup: false
      });
      setTempConfig(prev => prev ? {
        ...prev,
        groupEnabled: false,
        groupName: '',
        independentGroup: false
      } : null);
    } else {
      setTempConfig(prev => prev ? {
        ...prev,
        groupEnabled: true
      } : null);
    }
  };

  const handleQuickSave = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      // 验证逻辑
      if (values.groupEnabled && !values.groupName?.trim()) {
        message.error('启用分组展示时，分组名称不能为空');
        setLoading(false);
        return;
      }

      const config: MetricConfig = {
        groupEnabled: values.groupEnabled,
        groupName: values.groupEnabled ? values.groupName.trim() : '',
        attributes: values.attributes || [],
        independentGroup: values.independentGroup || false
      };

      setTempConfig(config);
      onSave(config);
      message.success('配置已保存');

      setTimeout(() => {
        setHoverOpen(false);
      }, 800);
    } catch (error) {
      console.error('保存指标配置失败:', error);
      message.error('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickToggle = async (field: keyof MetricConfig) => {
    const currentValue = tempConfig?.[field] || false;
    const newValue = field === 'groupName' ? '' : !currentValue;

    let updatedConfig: MetricConfig;

    if (field === 'groupEnabled') {
      updatedConfig = {
        ...(tempConfig || { groupEnabled: false, groupName: '', attributes: [], independentGroup: false }),
        groupEnabled: newValue,
        groupName: newValue ? (tempConfig?.groupName || '') : '',
        independentGroup: newValue ? (tempConfig?.independentGroup || false) : false
      };
      form.setFieldsValue(updatedConfig);
    } else if (field === 'independentGroup') {
      updatedConfig = {
        ...(tempConfig || { groupEnabled: false, groupName: '', attributes: [], independentGroup: false }),
        independentGroup: newValue
      };
      form.setFieldValue('independentGroup', newValue);
    } else {
      updatedConfig = {
        ...(tempConfig || { groupEnabled: false, groupName: '', attributes: [], independentGroup: false }),
        [field]: newValue
      };
    }

    setTempConfig(updatedConfig);
    onSave(updatedConfig);
    message.success('配置已更新');
  };

  const openModal = () => {
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const handleModalSave = (config: MetricConfig) => {
    setTempConfig(config);
    onSave(config);
    setModalOpen(false);
    message.success('详细配置已保存');
  };

  // 悬浮内容
  const hoverContent = mode === 'click' ? null : (
    <div style={{ width: 320, maxHeight: 350, overflowY: 'auto' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <SettingOutlined className="mr-2 text-blue-600" />
          <span className="font-medium text-sm">快速配置 - {item.name}</span>
        </div>
        <div className="flex items-center gap-1">
          {mode === 'hybrid' && (
            <Tooltip title="详细配置">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  setHoverOpen(false);
                  setTimeout(() => setModalOpen(true), 200);
                }}
                className="text-gray-400 hover:text-blue-600"
              />
            </Tooltip>
          )}
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined />}
            onClick={() => setHoverOpen(false)}
            className="text-gray-400 hover:text-gray-600"
          />
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        size="small"
      >
        <div className="space-y-3">
          {/* 快速开关区域 */}
          <div className="bg-gray-50 rounded p-3">
              <div className="text-xs font-medium text-gray-700 mb-2">快速配置</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">分组展示</span>
                  <Switch
                    size="small"
                    checked={tempConfig?.groupEnabled || false}
                    onChange={(checked) => handleQuickToggle('groupEnabled')}
                  />
                </div>
              </div>
            </div>

          {/* 分组名称 */}
          {tempConfig?.groupEnabled && (
            <Form.Item
              name="groupName"
              label="分组名称"
              rules={[
                { required: true, message: '请输入分组名称' },
                { max: 50, message: '分组名称不能超过50个字符' }
              ]}
            >
              <Input
                placeholder="例如：价格区间、供应商类型等"
                size="small"
                showCount
                maxLength={50}
              />
            </Form.Item>
          )}

          <Divider style={{ margin: '12px 0' }} />

          {/* 指标属性 */}
          <Form.Item
            name="attributes"
            label="指标属性"
            extra="选择相关的维度字段作为指标的属性"
          >
            <Select
              mode="multiple"
              placeholder="请选择指标属性"
              size="small"
              style={{ width: '100%' }}
              maxTagCount={2}
            >
              {attributeOptions.map(field => (
                <Select.Option key={field.id} value={field.id}>
                  <div>
                    <div className="text-xs font-medium">{field.name}</div>
                    <div className="text-xs text-gray-500">{field.description}</div>
                  </div>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-2 pt-2 border-t">
            <Button size="small" onClick={() => setHoverOpen(false)}>
              取消
            </Button>
            <Button
              type="primary"
              size="small"
              icon={<SaveOutlined />}
              loading={loading}
              onClick={handleQuickSave}
            >
              保存
            </Button>
          </div>
        </div>
      </Form>
    </div>
  );

  return (
    <>
      {/* 悬浮模式 */}
      {mode === 'hover' && hoverContent && (
        <div
          onMouseEnter={() => setHoverOpen(true)}
          onMouseLeave={() => setHoverOpen(false)}
        >
          {children}
          {/* 这里可以添加悬浮提示 */}
        </div>
      )}

      {/* 点击模式 */}
      {mode === 'click' && (
        <div onClick={openModal}>
          {children}
        </div>
      )}

      {/* 混合模式 - 默认 */}
      {mode === 'hybrid' && (
        <>
          <div
            onMouseEnter={() => setHoverOpen(true)}
            onMouseLeave={() => setHoverOpen(false)}
          >
            {children}
          </div>

          {/* 悬浮弹窗 */}
          {hoverOpen && hoverContent && (
            <div
              className="absolute z-50"
              style={{
                top: '100%',
                left: 0,
                marginTop: '4px'
              }}
              onMouseEnter={() => setHoverOpen(true)}
              onMouseLeave={() => setHoverOpen(false)}
            >
              <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-1">
                {hoverContent}
              </div>
            </div>
          )}
        </>
      )}

      {/* 详细配置弹窗 */}
      <MetricConfigDialog
        open={modalOpen}
        item={{
          id: item.id,
          name: item.name,
          type: item.type,
          metricConfig: tempConfig || undefined
        }}
        availableFields={availableFields}
        onSave={handleModalSave}
        onClose={closeModal}
      />
    </>
  );
};

export default EnhancedMetricConfig;
