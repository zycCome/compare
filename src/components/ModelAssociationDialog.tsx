import { useState, useEffect } from 'react';
import { Modal, Form, Select, Transfer, message, Typography } from 'antd';

const { Option } = Select;
const { Text } = Typography;

interface ModelAssociationDialogProps {
  open: boolean;
  dataset?: any;
  onClose: () => void;
  onSave: (data: any) => void;
}

const ModelAssociationDialog: React.FC<ModelAssociationDialogProps> = ({
  open,
  dataset,
  onClose,
  onSave
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [targetKeys, setTargetKeys] = useState<React.Key[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);

  // 模拟可用的数据模型
  const mockDataSource = [
    {
      key: '1',
      title: '销售订单模型',
      description: '包含订单基本信息、客户信息等',
    },
    {
      key: '2',
      title: '产品信息模型',
      description: '产品基本信息、分类、价格等',
    },
    {
      key: '3',
      title: '客户信息模型',
      description: '客户基本信息、联系方式等',
    },
    {
      key: '4',
      title: '库存数据模型',
      description: '库存数量、仓库信息等',
    },
  ];

  useEffect(() => {
    if (open && dataset) {
      // 如果数据集已有关联模型，设置为已选中
      const associatedModels = dataset.associatedModels || [];
      setTargetKeys(associatedModels.map((model: any) => model.id || model));
      form.setFieldsValue({
        primaryModel: dataset.primaryModel || undefined
      });
    } else {
      setTargetKeys([]);
      form.resetFields();
    }
  }, [open, dataset, form]);

  const handleOk = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      const associationData = {
        datasetId: dataset?.id,
        primaryModel: values.primaryModel,
        associatedModels: targetKeys,
      };
      
      onSave(associationData);
      message.success('模型关联配置成功');
      onClose();
    } catch (error) {
      console.error('表单验证失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransferChange = (targetKeys: React.Key[], direction: 'left' | 'right') => {
    setTargetKeys(targetKeys);
  };

  const handleTransferSelectChange = (sourceSelectedKeys: React.Key[], targetSelectedKeys: React.Key[]) => {
    setSelectedKeys([...sourceSelectedKeys, ...targetSelectedKeys]);
  };

  return (
    <Modal
      title="数据集模型关联"
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      confirmLoading={loading}
      okText="确定"
      cancelText="取消"
      width={800}
    >
      <div style={{ marginBottom: 16 }}>
        <Text strong>数据集：</Text>
        <Text>{dataset?.datasetName}</Text>
      </div>
      
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          name="primaryModel"
          label="主要模型"
          rules={[{ required: true, message: '请选择主要模型' }]}
        >
          <Select placeholder="请选择主要模型">
            {mockDataSource.map(model => (
              <Option key={model.key} value={model.key}>
                {model.title}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="关联模型"
          extra="选择与此数据集相关的数据模型"
        >
          <Transfer
            dataSource={mockDataSource}
            titles={['可用模型', '已关联模型']}
            targetKeys={targetKeys}
            selectedKeys={selectedKeys}
            onChange={handleTransferChange}
            onSelectChange={handleTransferSelectChange}
            render={(item: any) => `${item.title} - ${item.description}`}
            listStyle={{
              width: 300,
              height: 300,
            }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ModelAssociationDialog;