import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, message, Upload, Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;

interface DatasetDialogProps {
  open: boolean;
  mode: 'add' | 'edit' | 'view';
  dataset?: any;
  onClose: () => void;
  onSave: (data: any) => void;
  preSelectedSubject?: any;
}

const DatasetDialog: React.FC<DatasetDialogProps> = ({
  open,
  mode,
  dataset,
  onClose,
  onSave,
  preSelectedSubject
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [dataSourceType, setDataSourceType] = useState<string>('');

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && dataset) {
        form.setFieldsValue(dataset);
        setDataSourceType(dataset.type || '');
      } else {
        form.resetFields();
        setDataSourceType('');
        // 如果有预选的分析主题，自动设置
        if (preSelectedSubject) {
          form.setFieldsValue({
            analysisSubject: preSelectedSubject.subjectName
          });
        }
      }
    }
  }, [open, mode, dataset, form, preSelectedSubject]);

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
        return '新建数据集';
      case 'edit':
        return '编辑数据集';
      case 'view':
        return '查看数据集';
      default:
        return '数据集';
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
      <Form
        form={form}
        layout="vertical"
        disabled={mode === 'view'}
      >
        <Form.Item
          name="datasetName"
          label="数据集名称"
          rules={[
            { required: true, message: '请输入数据集名称' },
            { max: 50, message: '数据集名称不能超过50个字符' }
          ]}
        >
          <Input placeholder="请输入数据集名称" />
        </Form.Item>

        <Form.Item
          name="description"
          label="数据集描述"
          rules={[
            { required: true, message: '请输入数据集描述' },
            { max: 200, message: '数据集描述不能超过200个字符' }
          ]}
        >
          <TextArea
            rows={3}
            placeholder="请输入数据集描述"
          />
        </Form.Item>

        <Form.Item
          name="analysisSubject"
          label="分析主题"
          rules={[{ required: true, message: '请选择分析主题' }]}
        >
          <Select 
            placeholder="请选择分析主题"
            disabled={!!preSelectedSubject || mode === 'view'}
          >
            <Option value="销售分析主题">销售分析主题</Option>
            <Option value="库存分析主题">库存分析主题</Option>
            <Option value="财务分析主题">财务分析主题</Option>
            <Option value="价格比对分析主题">价格比对分析主题</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="type"
          label="数据来源类型"
          rules={[{ required: true, message: '请选择数据来源类型' }]}
        >
          <Select 
            placeholder="请选择数据来源类型"
            onChange={(value) => setDataSourceType(value)}
          >
            <Option value="数据模型">数据模型</Option>
            <Option value="SQL">SQL</Option>
            <Option value="Excel">Excel</Option>
            <Option value="API接口">API接口</Option>
          </Select>
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

        {mode === 'add' && dataSourceType === 'Excel' && (
          <Form.Item
            name="file"
            label="数据文件"
            rules={[{ required: true, message: '请上传数据文件' }]}
          >
            <Upload
              beforeUpload={() => false}
              maxCount={1}
              accept=".xlsx,.xls"
            >
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
          </Form.Item>
        )}

        {mode === 'add' && dataSourceType === 'SQL' && (
          <>
            <Form.Item
              name="sqlQuery"
              label="SQL查询语句"
              rules={[{ required: true, message: '请输入SQL查询语句' }]}
            >
              <TextArea
                rows={6}
                placeholder="请输入SQL查询语句，例如：SELECT * FROM table_name WHERE condition"
              />
            </Form.Item>
            <Form.Item
              name="dataSource"
              label="数据源"
              rules={[{ required: true, message: '请选择数据源' }]}
            >
              <Select placeholder="请选择数据源">
                <Option value="mysql_prod">MySQL生产库</Option>
                <Option value="postgresql_dev">PostgreSQL开发库</Option>
                <Option value="oracle_warehouse">Oracle数据仓库</Option>
              </Select>
            </Form.Item>
          </>
        )}

        {mode === 'add' && dataSourceType === 'API接口' && (
          <>
            <Form.Item
              name="apiUrl"
              label="API地址"
              rules={[{ required: true, message: '请输入API地址' }]}
            >
              <Input placeholder="请输入API地址，例如：https://api.example.com/data" />
            </Form.Item>
            <Form.Item
              name="requestMethod"
              label="请求方式"
              rules={[{ required: true, message: '请选择请求方式' }]}
              initialValue="GET"
            >
              <Select placeholder="请选择请求方式">
                <Option value="GET">GET</Option>
                <Option value="POST">POST</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="authType"
              label="认证方式"
              rules={[{ required: true, message: '请选择认证方式' }]}
              initialValue="none"
            >
              <Select placeholder="请选择认证方式">
                <Option value="none">无认证</Option>
                <Option value="apikey">API Key</Option>
                <Option value="bearer">Bearer Token</Option>
              </Select>
            </Form.Item>
            <Form.Item
               name="requestHeaders"
               label="请求头"
             >
               <TextArea
                 rows={3}
                 placeholder='请输入请求头信息（JSON格式），例如：{"Content-Type": "application/json"}'
               />
             </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  );
};

export default DatasetDialog;