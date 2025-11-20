import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Switch, Button, message, Select } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { MetricConfig } from '../types/metric';

interface MetricConfigDialogProps {
  open: boolean;
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
  onClose: () => void;
}

const MetricConfigDialog: React.FC<MetricConfigDialogProps> = ({
  open,
  item,
  availableFields,
  onSave,
  onClose
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const attributeOptions = availableFields.filter(field =>
    field.type === 'dimension'
  );

  // 过滤可以作为关联目标的基础指标（比对指标和基准指标）
  const associationTargetOptions = availableFields.filter(field =>
    (field.type === 'metric' || field.type === 'baseline')
  );

  useEffect(() => {
    if (item.metricConfig) {
      form.setFieldsValue(item.metricConfig);
    } else {
      // 根据指标类型设置不同的默认配置
      const defaultConfig = item.type === 'calculated'
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
      form.setFieldsValue(defaultConfig);
    }
  }, [item.metricConfig, form, item.type]);

  const handleGroupEnabledChange = (checked: boolean) => {
    if (!checked) {
      form.setFieldsValue({
        groupName: '',
        independentGroup: false
      });
    }
  };

  const handleSave = async () => {
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

      onSave(config);
      message.success('配置已保存');
      onClose(); // 保存后关闭弹窗
    } catch (error) {
      console.error('保存指标配置失败:', error);
      message.error('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center">
          <SettingOutlined className="mr-2 text-blue-600" />
          指标配置 - {item.name}
        </div>
      }
      open={open}
      onCancel={onClose}
      width={600}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="save" type="primary" loading={loading} onClick={handleSave}>
          保存配置
        </Button>
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          groupEnabled: false,
          groupName: '',
          attributes: [],
          independentGroup: false,
          associationEnabled: false,
          associationTargetId: undefined
        }}
      >
        {/* 根据指标类型显示不同配置 */}
        {item.type === 'calculated' ? (
          // 计算指标 - 简化配置
          <>
            <Form.Item
              name="associationEnabled"
              label="关联展示"
              extra="启用后，该计算指标会与基础指标在同一分组下展示"
            >
              <Switch
                checkedChildren="启用"
                unCheckedChildren="关闭"
              />
            </Form.Item>

            {/* 条件显示：启用关联展示时显示目标指标选择 */}
            <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.associationEnabled !== currentValues.associationEnabled}>
              {({ getFieldValue }) =>
                getFieldValue('associationEnabled') ? (
                  <Form.Item
                    name="associationTargetId"
                    label="关联指标"
                    rules={[
                      { required: true, message: '请选择关联指标' }
                    ]}
                    extra="选择一个基础指标作为关联展示的目标"
                  >
                    <Select
                      placeholder="请选择关联指标"
                      style={{ width: '100%' }}
                      allowClear
                    >
                      {associationTargetOptions.map(field => (
                        <Select.Option key={field.id} value={field.id}>
                          <div>
                            <div className="font-medium">{field.name}</div>
                            <div className="text-xs text-gray-500">{field.description}</div>
                          </div>
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                ) : null
              }
            </Form.Item>
          </>
        ) : (
          // 比对指标和基准指标 - 完整配置
          <>
            <Form.Item
              name="groupEnabled"
              label="启用分组展示"
              extra="启用后，指标数据将按照指定分组进行展示和汇总"
            >
              <Switch
                checkedChildren="启用"
                unCheckedChildren="关闭"
                onChange={handleGroupEnabledChange}
              />
            </Form.Item>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) => prevValues.groupEnabled !== currentValues.groupEnabled}
            >
              {({ getFieldValue }) =>
                getFieldValue('groupEnabled') ? (
                  <>
                    <Form.Item
                      name="groupName"
                      label="分组名称"
                      rules={[
                        { required: true, message: '请输入分组名称' },
                        { max: 50, message: '分组名称不能超过50个字符' }
                      ]}
                      extra="指定分组的名称，将在报表中作为分组标识显示"
                    >
                      <Input
                        placeholder="例如：价格区间、供应商类型等"
                        showCount
                        maxLength={50}
                      />
                    </Form.Item>

                    <Form.Item
                      name="attributes"
                      label="指标属性"
                      extra="选择相关的属性来修饰指标"
                    >
                      <Select
                        mode="multiple"
                        placeholder="请选择指标属性（可选）"
                        style={{ width: '100%' }}
                        maxTagCount={3}
                        allowClear
                      >
                        {attributeOptions.map(field => (
                          <Select.Option key={field.id} value={field.id}>
                            <div>
                              <div className="font-medium">{field.name}</div>
                              <div className="text-xs text-gray-500">{field.description}</div>
                            </div>
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item
                      name="independentGroup"
                      label="独立分组"
                      extra="启用独立分组后，指标分组将不在实际的列维度下展示，适用于基准指标"
                    >
                      <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.groupEnabled !== currentValues.groupEnabled}>
                        {({ getFieldValue }) => {
                          const groupEnabled = getFieldValue('groupEnabled');
                          const isMetric = item.type === 'metric'; // 比对指标
                          return (
                            <Switch
                              checkedChildren="启用"
                              unCheckedChildren="关闭"
                              disabled={isMetric && groupEnabled}
                              checked={isMetric && groupEnabled ? false : getFieldValue('independentGroup')}
                              onChange={(checked) => {
                                if (!(isMetric && groupEnabled)) {
                                  form.setFieldValue('independentGroup', checked);
                                }
                              }}
                            />
                          );
                        }}
                      </Form.Item>
                    </Form.Item>
                  </>
                ) : null
              }
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  );
};

export default MetricConfigDialog;