import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, Space, Card, Divider, Typography, message } from 'antd';
import { FunctionOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;
const { Title } = Typography;

interface CustomIndicator {
  id?: string;
  metricName: string;
  bizSpec?: string;
  unit?: string;
  scale?: number;
  expression?: string;
}

interface CustomIndicatorDialogProps {
  visible: boolean;
  onCancel: () => void;
  onOk: (indicator: CustomIndicator) => void;
  title?: string;
}

const CustomIndicatorDialog: React.FC<CustomIndicatorDialogProps> = ({
  visible,
  onCancel,
  onOk,
  title = '新增自定义指标'
}) => {
  const [form] = Form.useForm();
  const [descriptionLength, setDescriptionLength] = useState<number>(0);
  const [expressionModalVisible, setExpressionModalVisible] = useState<boolean>(false);
  const [currentExpression, setCurrentExpression] = useState<string>('');
  const [expandedFieldGroups, setExpandedFieldGroups] = useState<Record<string, boolean>>({
    string: true,
    number: true,
    date: true
  });

  
  // 重置表单
  const resetForm = () => {
    form.resetFields();
    setDescriptionLength(0);
    setCurrentExpression('');
    // 不再需要设置数据集ID到表单，因为已经移除了数据集选择功能
  };

  // 处理弹窗打开
  useEffect(() => {
    if (visible) {
      resetForm();
    }
  }, [visible]);

  // 处理保存
  const handleSave = () => {
    form.validateFields().then((values) => {
      // 检查描述长度
      if (values.bizSpec && values.bizSpec.length > 500) {
        message.error('指标描述不能超过500字');
        return;
      }

      const newIndicator: CustomIndicator = {
        id: Date.now().toString(),
        ...values,
        expression: currentExpression
      };

      onOk(newIndicator);
      message.success('自定义指标创建成功');
    });
  };

  // 处理取消
  const handleCancel = () => {
    resetForm();
    onCancel();
  };

  // 处理表达式编辑器确认
  const handleExpressionOk = () => {
    form.setFieldsValue({ expression: currentExpression });
    setExpressionModalVisible(false);
  };

  return (
    <>
      <Modal
        title={title}
        open={visible}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            取消
          </Button>,
          <Button key="save" type="primary" onClick={handleSave}>
            保存
          </Button>
        ]}
        width={800}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <div style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            marginBottom: '16px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '12px',
              borderBottom: '2px solid #e2e8f0'
            }}>
              <div style={{
                width: '4px',
                height: '20px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                borderRadius: '2px',
                marginRight: '12px'
              }}></div>
              <Title level={4} style={{ margin: 0, color: '#1e293b', fontWeight: 600 }}>
                📝 基本信息
              </Title>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <Form.Item
                name="metricName"
                label={
                  <span style={{
                    color: '#374151',
                    fontWeight: 500,
                    fontSize: '14px'
                  }}>
                    指标名称 <span style={{ color: 'red' }}>*</span>
                  </span>
                }
                rules={[{ required: true, message: '请输入指标名称' }]}
              >
                <Input
                  placeholder="例如：协议价、最低价、差异率"
                  size="large"
                  style={{
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                  }}
                />
              </Form.Item>
            </div>

            <Form.Item
              name="bizSpec"
              label={
                <span style={{
                  color: '#374151',
                  fontWeight: 500,
                  fontSize: '14px'
                }}>
                  指标描述
                </span>
              }
            >
              <TextArea
                placeholder="请描述指标的业务含义和计算逻辑"
                rows={3}
                onChange={(e) => setDescriptionLength(e.target.value.length)}
                style={{
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                }}
              />
              <div style={{
                textAlign: 'right',
                color: descriptionLength > 500 ? '#ef4444' : '#9ca3af',
                fontSize: '12px',
                marginTop: '4px',
                fontWeight: descriptionLength > 500 ? 600 : 400
              }}>
                {descriptionLength}/500
              </div>
            </Form.Item>

            <div className="grid grid-cols-2 gap-6">
              <Form.Item
                name="unit"
                label={
                  <span style={{
                    color: '#374151',
                    fontWeight: 500,
                    fontSize: '14px'
                  }}>
                    单位
                  </span>
                }
              >
                <Input
                  placeholder="例如：万元、个、%"
                  size="large"
                  style={{
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                  }}
                />
              </Form.Item>
              <Form.Item
                name="scale"
                label={
                  <span style={{
                    color: '#374151',
                    fontWeight: 500,
                    fontSize: '14px'
                  }}>
                    精度
                  </span>
                }
              >
                <Input
                  placeholder="2"
                  type="number"
                  min={0}
                  max={10}
                  size="large"
                  style={{
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                  }}
                />
              </Form.Item>
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #fef7ff 0%, #ffffff 100%)',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid #e9d5ff',
            marginTop: '16px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '12px',
              borderBottom: '2px solid #e9d5ff'
            }}>
              <div style={{
                width: '4px',
                height: '20px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                borderRadius: '2px',
                marginRight: '12px'
              }}></div>
              <Title level={4} style={{ margin: 0, color: '#1e293b', fontWeight: 600 }}>
                🎯 指标公式
              </Title>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <Form.Item
                name="expression"
                label={
                  <span style={{
                    color: '#374151',
                    fontWeight: 500,
                    fontSize: '14px'
                  }}>
                    指标公式
                  </span>
                }
              >
                <Input
                  placeholder="点击编辑指标公式"
                  readOnly
                  value={currentExpression}
                  style={{
                    cursor: 'pointer',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    background: '#f8fafc'
                  }}
                  onClick={() => {
                    setExpressionModalVisible(true);
                  }}
                  suffix={
                    <FunctionOutlined
                      style={{
                        color: '#8b5cf6',
                        fontSize: '16px'
                      }}
                    />
                  }
                />
              </Form.Item>
            </div>
          </div>
        </Form>
      </Modal>

      {/* 指标公式编辑器弹窗 */}
      <Modal
        title="指标公式编辑器"
        open={expressionModalVisible}
        onCancel={() => setExpressionModalVisible(false)}
        onOk={handleExpressionOk}
        width={1200}
        style={{ top: 20 }}
      >
        <div style={{ display: 'flex', gap: '16px', height: '600px' }}>
          {/* 左侧：数据库函数 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Card 
              size="small" 
              title={
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: 'bold', 
                  color: '#722ed1',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ 
                    display: 'inline-block',
                    width: '4px',
                    height: '14px',
                    backgroundColor: '#722ed1',
                    borderRadius: '2px'
                  }}></span>
                  🔢 聚合函数
                </div>
              }
              style={{ 
                border: '1px solid #d3adf7',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #f9f0ff 0%, #ffffff 100%)'
              }}
            >
              <Space wrap>
                {['SUM', 'AVG', 'COUNT', 'MAX', 'MIN', 'COUNT(DISTINCT)'].map(func => (
                  <Button
                    key={func}
                    size="small"
                    onClick={() => {
                      setCurrentExpression(prev => prev ? `${prev} ${func}()` : `${func}()`);
                    }}
                    style={{ 
                      fontFamily: 'monospace',
                      fontWeight: 'bold'
                    }}
                  >
                    {func}
                  </Button>
                ))}
              </Space>
            </Card>

            <Card 
              size="small" 
              title={
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: 'bold', 
                  color: '#1890ff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ 
                    display: 'inline-block',
                    width: '4px',
                    height: '14px',
                    backgroundColor: '#1890ff',
                    borderRadius: '2px'
                  }}></span>
                  🔢 数值函数
                </div>
              }
              style={{ 
                border: '1px solid #91d5ff',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #e6f7ff 0%, #ffffff 100%)'
              }}
            >
              <Space wrap>
                {['ROUND', 'CEIL', 'FLOOR', 'ABS', 'POWER', 'SQRT'].map(func => (
                  <Button
                    key={func}
                    size="small"
                    onClick={() => {
                      setCurrentExpression(prev => prev ? `${prev} ${func}()` : `${func}()`);
                    }}
                    style={{ 
                      fontFamily: 'monospace',
                      fontWeight: 'bold'
                    }}
                  >
                    {func}
                  </Button>
                ))}
              </Space>
            </Card>
          </div>

          {/* 中间：表达式编辑区 */}
          <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Card 
              size="small" 
              title={
                <div style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold', 
                  color: '#1890ff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 0'
                }}>
                  <span style={{ 
                    display: 'inline-block',
                    width: '6px',
                    height: '20px',
                    backgroundColor: '#1890ff',
                    borderRadius: '3px'
                  }}></span>
                  🎯 指标公式编辑器
                </div>
              }
              style={{ 
                border: '2px solid #1890ff',
                borderRadius: '12px',
                flex: 1
              }}
            >
              <TextArea
                value={currentExpression}
                onChange={(e) => setCurrentExpression(e.target.value)}
                placeholder="🚀 在此输入指标公式，或点击右侧元素快速构建..."
                autoSize={{ minRows: 16, maxRows: 20 }}
                style={{ 
                  fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace', 
                  fontSize: '14px',
                  lineHeight: '1.6'
                }}
              />
            </Card>

            {/* 操作符按钮 */}
            <Card 
              size="small" 
              title="⚡ 常用操作符"
              style={{ 
                border: '1px solid #b7eb8f',
                borderRadius: '8px'
              }}
            >
              <Space wrap>
                {['+', '-', '*', '/', '(', ')', '=', '<', '>', '<=', '>=', '<>', 'AND', 'OR', 'NOT'].map(op => (
                  <Button
                    key={op}
                    size="small"
                    onClick={() => {
                      setCurrentExpression(prev => prev ? `${prev} ${op}` : op);
                    }}
                    style={{ 
                      fontFamily: 'monospace',
                      fontWeight: 'bold'
                    }}
                  >
                    {op}
                  </Button>
                ))}
              </Space>
            </Card>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default CustomIndicatorDialog;