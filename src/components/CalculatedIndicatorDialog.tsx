import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, Space, Card, Divider, Typography, message, InputNumber } from 'antd';
import { CalculatorOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;
const { Title } = Typography;

interface CalculatedIndicator {
  id?: string;
  metricName: string;
  bizSpec?: string;
  unit?: string;
  scale?: number;
  formula?: string; // 指标公式
}

interface CalculatedIndicatorDialogProps {
  visible: boolean;
  onCancel: () => void;
  onOk: (indicator: CalculatedIndicator) => void;
  title?: string;
}

const CalculatedIndicatorDialog: React.FC<CalculatedIndicatorDialogProps> = ({
  visible,
  onCancel,
  onOk,
  title = '自定义计算指标'
}) => {
  const [form] = Form.useForm();
  const [descriptionLength, setDescriptionLength] = useState<number>(0);

  // 重置表单
  const resetForm = () => {
    form.resetFields();
    setDescriptionLength(0);
  };

  // 保存指标
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      const indicator: CalculatedIndicator = {
        metricName: values.metricName,
        bizSpec: values.bizSpec,
        unit: values.unit,
        scale: values.scale,
        formula: values.formula
      };

      onOk(indicator);
      resetForm();
      message.success('计算指标保存成功');
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 取消操作
  const handleCancel = () => {
    resetForm();
    onCancel();
  };

  // 监听描述字段变化
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescriptionLength(e.target.value.length);
  };

  useEffect(() => {
    if (!visible) {
      resetForm();
    }
  }, [visible]);

  return (
    <Modal
      title={
        <div style={{
          display: 'flex',
          alignItems: 'center',
          fontSize: '18px',
          fontWeight: 600,
          color: '#1e293b'
        }}>
          <CalculatorOutlined style={{ color: '#8b5cf6', marginRight: '12px' }} />
          {title}
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button
          key="cancel"
          onClick={handleCancel}
          style={{
            borderRadius: '8px',
            height: '40px',
            minWidth: '100px'
          }}
        >
          取消
        </Button>,
        <Button
          key="save"
          type="primary"
          onClick={handleSave}
          style={{
            borderRadius: '8px',
            height: '40px',
            minWidth: '100px',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            border: 'none'
          }}
        >
          保存
        </Button>
      ]}
      width={700}
      destroyOnClose
      styles={{
        body: { padding: '24px' }
      }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          unit: '个',
          scale: 2
        }}
      >
        <div style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          marginBottom: '20px'
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
              rules={[
                { required: true, message: '请输入指标名称' },
                { max: 50, message: '指标名称不能超过50个字符' }
              ]}
            >
              <Input
                placeholder="请输入指标名称"
                size="large"
                style={{
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                }}
              />
            </Form.Item>

            <Form.Item
              name="bizSpec"
              label={
                <span style={{
                  color: '#374151',
                  fontWeight: 500,
                  fontSize: '14px'
                }}>
                  业务说明
                </span>
              }
              rules={[
                { max: 200, message: '业务说明不能超过200个字符' }
              ]}
            >
              <TextArea
                placeholder="请输入业务说明"
                rows={3}
                showCount
                maxLength={200}
                onChange={handleDescriptionChange}
                style={{
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                }}
              />
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
                <Select
                  size="large"
                  style={{
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                  }}
                >
                  <Option value="个">个</Option>
                  <Option value="元">元</Option>
                  <Option value="万元">万元</Option>
                  <Option value="%">%</Option>
                  <Option value="倍">倍</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="scale"
                label={
                  <span style={{
                    color: '#374151',
                    fontWeight: 500,
                    fontSize: '14px'
                  }}>
                    小数位数
                  </span>
                }
              >
                <InputNumber
                  min={0}
                  max={6}
                  size="large"
                  style={{
                    width: '100%',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                  }}
                />
              </Form.Item>
            </div>
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #fef7ff 0%, #ffffff 100%)',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #e9d5ff',
          marginBottom: '20px'
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
              🧮 计算配置
            </Title>
          </div>

          <Form.Item
            name="formula"
            label={
              <span style={{
                color: '#374151',
                fontWeight: 500,
                fontSize: '14px'
              }}>
                指标公式 <span style={{ color: 'red' }}>*</span>
              </span>
            }
            rules={[
              { required: true, message: '请输入指标公式' }
            ]}
          >
            <TextArea
              placeholder="请输入指标公式，如：(比对指标-基准指标)/基准指标*100"
              rows={4}
              style={{
                fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                fontSize: '14px',
                lineHeight: '1.6'
              }}
            />
          </Form.Item>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #dbeafe'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <div style={{
              width: '4px',
              height: '16px',
              background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
              borderRadius: '2px',
              marginRight: '10px'
            }}></div>
            <span style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#0c4a6e'
            }}>
              💡 计算说明
            </span>
          </div>
          <div style={{
            color: '#64748b',
            fontSize: '13px',
            lineHeight: '1.6',
            paddingLeft: '14px'
          }}>
            <div style={{ marginBottom: '8px' }}>• 指标公式用于定义具体的计算逻辑</div>
            <div style={{ marginBottom: '8px' }}>• 支持常见的数学运算符和函数</div>
            <div>• 可以引用其他指标数据进行计算</div>
          </div>
        </div>
      </Form>
    </Modal>
  );
};

export default CalculatedIndicatorDialog;