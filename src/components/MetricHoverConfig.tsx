import React, { useState, useEffect, useRef } from 'react';
import { Form, Switch, Input, Select, Button, Space, Divider, InputNumber, message, Popover, Tooltip } from 'antd';
import { SettingOutlined, SaveOutlined, CloseOutlined, EditOutlined } from '@ant-design/icons';
import { MetricConfig } from '../types/metric';
import MetricConfigDialog from './MetricConfigDialog';

interface MetricHoverConfigProps {
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
  defaultGroupName: string;
  onDefaultGroupNameChange: (value: string) => void;
  onSave: (config: MetricConfig) => void;
  children: React.ReactNode;
  showDetailedConfig?: boolean; // 是否显示详细配置按钮
}

const MetricHoverConfig: React.FC<MetricHoverConfigProps> = ({
  item,
  availableFields,
  defaultGroupName,
  onDefaultGroupNameChange,
  onSave,
  children,
  showDetailedConfig = true
}) => {
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tempConfig, setTempConfig] = useState<MetricConfig | null>(null);
  const [detailedConfigOpen, setDetailedConfigOpen] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  // 过滤适合作为属性的字段
  const attributeOptions = availableFields.filter(field =>
    field.type === 'dimension' && field.componentType
  );

  // 过滤可以作为关联目标的基础指标（比对指标和基准指标）
  const associationTargetOptions = availableFields.filter(field =>
    (field.type === 'metric' || field.type === 'baseline') && field.componentType
  );

  useEffect(() => {
    if (item.metricConfig) {
      setTempConfig(item.metricConfig);
      form.setFieldsValue(item.metricConfig);
    } else {
      // 根据指标类型设置不同的默认配置
      const defaultConfig: MetricConfig = item.type === 'calculated'
        ? {
            groupEnabled: false,
            groupName: '',
            attributes: [],
            independentGroup: false,
            associationEnabled: false,
            associationTargetId: undefined
          }
        : {
            groupEnabled: false,
            groupName: '',
            attributes: [],
            independentGroup: false,
            associationEnabled: false,
            associationTargetId: undefined
          };
      setTempConfig(defaultConfig);
      form.setFieldsValue(defaultConfig);
    }
  }, [item.metricConfig, form, item.type]);

  const handleToggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!open) {
      // 计算弹窗位置
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const popupWidth = 380; // 弹窗宽度
        const popupHeight = 400; // 弹窗最大高度
        const margin = 8; // 边距

        let left = rect.left + rect.width / 2 - popupWidth / 2;
        let top = rect.bottom + margin;

        // 确保弹窗不超出屏幕边界
        if (left < margin) {
          left = margin;
        } else if (left + popupWidth > window.innerWidth - margin) {
          left = window.innerWidth - popupWidth - margin;
        }

        // 如果下方空间不够，显示在上方
        if (top + popupHeight > window.innerHeight - margin) {
          top = rect.top - popupHeight - margin;
        }

        setPopupPosition({ top, left });
      }
    }

    setOpen(!open);
  };

  // 关闭弹窗（只能通过关闭按钮）
  const handleClose = () => {
    setOpen(false);
  };

  const handleGroupEnabledChange = (checked: boolean) => {
    if (!checked) {
      // 禁用分组展示时，清空相关字段
      form.setFieldsValue({
        groupName: '',
        independentGroup: false
      });
    }
  };

  const handleQuickSave = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      let config: MetricConfig;

      if (item.type === 'calculated') {
        // 计算指标 - 保存关联展示配置
        if (values.associationEnabled && !values.associationTargetId) {
          message.error('启用关联展示时，必须选择关联的目标指标');
          setLoading(false);
          return;
        }

        config = {
          groupEnabled: false,
          groupName: '',
          attributes: [],
          independentGroup: false,
          associationEnabled: values.associationEnabled || false,
          associationTargetId: values.associationEnabled ? values.associationTargetId : undefined
        };
      } else {
        // 比对指标和基准指标 - 保存完整配置
        // 验证逻辑
        if (values.groupEnabled && !values.groupName?.trim()) {
          message.error('启用分组展示时，分组名称不能为空');
          setLoading(false);
          return;
        }

        config = {
          groupEnabled: values.groupEnabled || false,
          groupName: values.groupEnabled ? values.groupName.trim() : '',
          attributes: values.attributes || [],
          independentGroup: values.independentGroup || false,
          associationEnabled: false,
          associationTargetId: undefined
        };
      }

      setTempConfig(config);
      onSave(config);
      message.success('配置已保存');
      // 保存后关闭弹窗
      setOpen(false);
    } catch (error) {
      console.error('保存指标配置失败:', error);
      message.error('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const openDetailedConfig = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    setTimeout(() => setDetailedConfigOpen(true), 200);
  };

  const handleDetailedConfigSave = (config: MetricConfig) => {
    setTempConfig(config);
    onSave(config);
    setDetailedConfigOpen(false);
    message.success('详细配置已保存');
  };

  
  const content = (
    <div style={{ width: 380, maxHeight: 400, overflowY: 'auto' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <SettingOutlined className="mr-2 text-blue-600" />
          <span className="font-medium text-sm">指标配置 - {item.name}</span>
        </div>
        <div className="flex items-center gap-1">
          {showDetailedConfig && (
            <Tooltip title="详细配置">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={openDetailedConfig}
                className="text-gray-400 hover:text-blue-600"
              />
            </Tooltip>
          )}
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined />}
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            title="关闭"
          />
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        size="small"
        initialValues={{
          groupEnabled: false,
          groupName: '',
          attributes: [],
          independentGroup: false,
          associationEnabled: false,
          associationTargetId: undefined
        }}
      >
        <div className="space-y-4">
          {/* 根据指标类型显示不同配置 */}
          {item.type === 'calculated' ? (
            // 计算指标 - 简化配置
            <>
              <Form.Item
                name="associationEnabled"
                label={
                  <span className="text-sm font-medium">
                    关联展示
                  </span>
                }
                extra="启用后，该计算指标会与基础指标在同一分组下展示"
              >
                <Switch
                  checkedChildren="启用"
                  unCheckedChildren="关闭"
                />
              </Form.Item>

              {/* 条件显示：启用关联展示时显示目标指标选择 */}
              <Form.Item shouldUpdate={(prevValues, currentValues) => prevValues.associationEnabled !== currentValues.associationEnabled}>
                {({ getFieldValue }) => {
                  const associationEnabled = getFieldValue('associationEnabled');

                  if (!associationEnabled) {
                    // 关闭关联展示时显示默认分组名称设置
                    return (
                      <div className="space-y-4 pt-4 border-t border-gray-100">
                        <Form.Item
                          label={
                            <span className="text-sm font-medium">
                              默认分组名称
                            </span>
                          }
                          extra="此名称将用于未关联展示的指标分组"
                        >
                          <Input
                            value={defaultGroupName}
                            onChange={(e) => onDefaultGroupNameChange(e.target.value)}
                            placeholder="请输入默认分组名称"
                            maxLength={50}
                            showCount
                          />
                        </Form.Item>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                      <Form.Item
                        name="associationTargetId"
                        label={
                          <span className="text-sm">
                            关联指标 <span style={{ color: 'red' }}>*</span>
                          </span>
                        }
                        rules={[
                          { required: true, message: '请选择关联指标' }
                        ]}
                        extra="选择一个基础指标作为关联展示的目标"
                      >
                        <Select
                          placeholder="请选择关联指标"
                          size="small"
                          style={{ width: '100%' }}
                          allowClear
                        >
                          {associationTargetOptions.map(field => (
                            <Select.Option key={field.id} value={field.id}>
                              <div>
                                <div className="text-xs font-medium">{field.name}</div>
                                <div className="text-xs text-gray-500">{field.description}</div>
                              </div>
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </div>
                  );
                }}
              </Form.Item>
            </>
          ) : (
            // 比对指标和基准指标 - 完整配置
            <>
              {/* 分组展示开关 - 主要控制项 */}
              <Form.Item
                name="groupEnabled"
                label={
                  <span className="text-sm font-medium">
                    启用分组展示
                  </span>
                }
                className="mb-4"
              >
                <Switch
                  checkedChildren="启用"
                  unCheckedChildren="关闭"
                  onChange={handleGroupEnabledChange}
                />
              </Form.Item>

              {/* 条件显示：当启用分组展示时显示其他配置 */}
              <Form.Item shouldUpdate={(prevValues, currentValues) => prevValues.groupEnabled !== currentValues.groupEnabled}>
                {({ getFieldValue }) => {
                  const groupEnabled = getFieldValue('groupEnabled');

                  if (!groupEnabled) {
                    // 未启用分组时显示默认分组名称设置
                    return (
                      <div className="space-y-4 pt-4 border-t border-gray-100">
                        <Form.Item
                          label={
                            <span className="text-sm font-medium">
                              默认分组名称
                            </span>
                          }
                          extra="此名称将用于所有未配置分组的指标"
                        >
                          <Input
                            value={defaultGroupName}
                            onChange={(e) => onDefaultGroupNameChange(e.target.value)}
                            placeholder="请输入默认分组名称"
                            maxLength={50}
                            showCount
                          />
                        </Form.Item>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                      {/* 分组名称 - 必填 */}
                      <Form.Item
                        name="groupName"
                        label={
                          <span className="text-sm">
                            分组名称 <span style={{ color: 'red' }}>*</span>
                          </span>
                        }
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

                      {/* 指标属性 - 非必填 */}
                      <Form.Item
                        name="attributes"
                        label="指标属性"
                        extra="选择相关的维度字段作为指标的属性（可选）"
                      >
                        <Select
                          mode="multiple"
                          placeholder="请选择指标属性（可选）"
                          size="small"
                          style={{ width: '100%' }}
                          maxTagCount={2}
                          allowClear
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

                      {/* 独立分组开关 */}
                      <Form.Item
                        name="independentGroup"
                        label={
                          <span className="text-sm font-medium">
                            独立分组
                          </span>
                        }
                        extra="启用后，该指标将创建独立的分组展示，与其他指标分离"
                      >
                        <Switch
                          checkedChildren="启用"
                          unCheckedChildren="关闭"
                        />
                      </Form.Item>
                    </div>
                  );
                }}
              </Form.Item>
            </>
          )}

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
            <Button size="small" onClick={handleClose}>
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
      {/* 点击触发配置弹窗 */}
      <div
        ref={triggerRef}
        onClick={handleToggleOpen}
        style={{ display: 'inline-block', cursor: 'pointer' }}
      >
        {children}
      </div>

      {/* 固定显示的配置弹窗 */}
      {open && (
        <div
          className="fixed z-50"
          style={{
            top: `${popupPosition.top}px`,
            left: `${popupPosition.left}px`
          }}
          onClick={(e) => e.stopPropagation()} // 防止点击弹窗内容时关闭
        >
          <div className="bg-white border border-gray-200 rounded-lg shadow-2xl p-1">
            {content}
          </div>
        </div>
      )}

      {/* 详细配置弹窗 */}
      <MetricConfigDialog
        open={detailedConfigOpen}
        item={{
          id: item.id,
          name: item.name,
          type: item.type,
          metricConfig: tempConfig || undefined
        }}
        availableFields={availableFields}
        onSave={handleDetailedConfigSave}
        onClose={() => setDetailedConfigOpen(false)}
      />
    </>
  );
};

export default MetricHoverConfig;