import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Select,
  Card,
  message
} from 'antd';

const { Option } = Select;

// 简化的字段元数据配置接口
export interface FieldMetadataConfig {
  fieldId: string;
  fieldCode: string;
  fieldName: string;
  fieldType: string;
  displayName: string;
  
  // 查询组件配置
  queryComponent: {
    type: 'input' | 'select' | 'multiSelect' | 'datePicker' | 'dateRangePicker' | 'numberRange' | 'modalSelector';
  };
}

interface FieldMetadataConfigDialogProps {
  visible: boolean;
  field?: {
    id: string;
    fieldCode: string;
    fieldName: string;
    fieldType: string;
    displayName: string;
    attribute: string;
  };
  onCancel: () => void;
  onOk: (config: FieldMetadataConfig) => void;
  initialConfig?: Partial<FieldMetadataConfig>;
}

const FieldMetadataConfigDialog: React.FC<FieldMetadataConfigDialogProps> = ({
  visible,
  field,
  onCancel,
  onOk,
  initialConfig
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && field) {
      const defaultConfig = {
        fieldId: field.id,
        fieldCode: field.fieldCode,
        fieldName: field.fieldName,
        fieldType: field.fieldType,
        displayName: field.displayName,
        queryComponent: {
          type: 'input' as const
        }
      };

      const config = { ...defaultConfig, ...initialConfig };
      form.setFieldsValue({
        queryComponentType: config.queryComponent?.type || 'input'
      });
    }
  }, [visible, field, initialConfig, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (!field) return;

      const config: FieldMetadataConfig = {
        fieldId: field.id,
        fieldCode: field.fieldCode,
        fieldName: field.fieldName,
        fieldType: field.fieldType,
        displayName: field.displayName,
        queryComponent: {
          type: values.queryComponentType
        }
      };

      onOk(config);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  return (
    <Modal
      title={`配置字段: ${field?.displayName || field?.fieldName}`}
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      width={500}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        preserve={false}
      >
        <Card title="查询组件设置" size="small">
          <Form.Item
            label="组件类型"
            name="queryComponentType"
            rules={[{ required: true, message: '请选择查询组件类型' }]}
          >
            <Select placeholder="请选择查询组件类型">
              <Option value="input">输入框</Option>
              <Option value="select">下拉选择</Option>
              <Option value="multiSelect">多选下拉</Option>
              <Option value="datePicker">日期选择</Option>
              <Option value="dateRangePicker">日期范围</Option>
              <Option value="numberRange">数值范围</Option>
              <Option value="modalSelector">弹窗选择</Option>
            </Select>
          </Form.Item>
        </Card>
      </Form>
    </Modal>
  );
};

export default FieldMetadataConfigDialog;