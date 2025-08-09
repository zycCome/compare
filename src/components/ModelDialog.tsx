import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, message, Radio } from 'antd';

const { TextArea } = Input;
const { Option } = Select;

interface ModelDialogProps {
  open: boolean;
  mode: 'add' | 'edit' | 'view';
  model?: any;
  onClose: () => void;
  onSave: (data: any) => void;
}

const ModelDialog: React.FC<ModelDialogProps> = ({
  open,
  mode,
  model,
  onClose,
  onSave
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [sourceType, setSourceType] = useState('');
  const [dataSource, setDataSource] = useState('database');

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && model) {
        form.setFieldsValue(model);
        setSourceType(model.sourceType || '');
        setDataSource(model.dataSource || 'database');
      } else {
        form.resetFields();
        setSourceType('');
        setDataSource('database');
      }
    }
  }, [open, mode, model, form]);

  const handleOk = async () => {
    if (mode === 'view') {
      onClose();
      return;
    }

    try {
      setLoading(true);
      const values = await form.validateFields();
      onSave(values);
      message.success(mode === 'add' ? '创建成功' : '更新成功');
      onClose();
    } catch (error) {
      console.error('表单验证失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'add':
        return '新建数据模型';
      case 'edit':
        return '编辑数据模型';
      case 'view':
        return '查看数据模型';
      default:
        return '数据模型';
    }
  };

  return (
    <Modal
      title={getTitle()}
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      confirmLoading={loading}
      okText={mode === 'view' ? '关闭' : '确定'}
      cancelText="取消"
      width={700}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="dataModelCode"
          label="模型编码"
          rules={[{ required: true, message: '请输入模型编码' }]}
        >
          <Input placeholder="请输入模型编码" disabled={mode === 'view'} />
        </Form.Item>
        
        <Form.Item
          name="dataModelName"
          label="模型名称"
          rules={[{ required: true, message: '请输入模型名称' }]}
        >
          <Input placeholder="请输入模型名称" disabled={mode === 'view'} />
        </Form.Item>
        
        <Form.Item
          name="dataModelDesc"
          label="模型描述"
        >
          <TextArea rows={3} placeholder="请输入模型描述" disabled={mode === 'view'} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ModelDialog;