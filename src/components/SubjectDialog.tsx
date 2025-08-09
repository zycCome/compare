import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, message } from 'antd';

const { TextArea } = Input;
const { Option } = Select;

interface SubjectDialogProps {
  open: boolean;
  mode: 'add' | 'edit' | 'view';
  subject?: any;
  onClose: () => void;
  onSave: (data: any) => void;
}

const SubjectDialog: React.FC<SubjectDialogProps> = ({
  open,
  mode,
  subject,
  onClose,
  onSave
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && subject) {
        form.setFieldsValue(subject);
      } else {
        form.resetFields();
      }
    }
  }, [open, mode, subject, form]);

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
        return '新建分析主题';
      case 'edit':
        return '编辑分析主题';
      case 'view':
        return '查看分析主题';
      default:
        return '分析主题';
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
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        disabled={mode === 'view'}
      >
        <Form.Item
          name="subjectName"
          label="主题名称"
          rules={[
            { required: true, message: '请输入主题名称' },
            { max: 50, message: '主题名称不能超过50个字符' }
          ]}
        >
          <Input placeholder="请输入主题名称" />
        </Form.Item>

        <Form.Item
          name="description"
          label="主题描述"
          rules={[
            { required: true, message: '请输入主题描述' },
            { max: 200, message: '主题描述不能超过200个字符' }
          ]}
        >
          <TextArea
            rows={4}
            placeholder="请输入主题描述"
          />
        </Form.Item>

        <Form.Item
          name="status"
          label="状态"
          rules={[{ required: true, message: '请选择状态' }]}
          initialValue={1}
        >
          <Select placeholder="请选择状态">
            <Option value={1}>启用</Option>
            <Option value={0}>停用</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SubjectDialog;