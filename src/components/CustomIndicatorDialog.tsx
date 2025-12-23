import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Form, Input, Select, Button, Space, Card, Typography, message, Radio, Checkbox, InputNumber } from 'antd';
import { CloseCircleOutlined, EyeOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Text } = Typography;

interface CustomIndicator {
  id?: string;
  metricName: string;
  bizSpec?: string;
  scale?: number;
  expression?: string;
  // 显示格式配置
  displayType?: 'auto' | 'percent'; // 显示类型
  quantityUnit?: string; // 数量单位
  unitSuffix?: string; // 单位后缀
  useThousandSeparator?: boolean; // 千分符
}

interface CustomIndicatorDialogProps {
  visible: boolean;
  onCancel: () => void;
  onOk: (indicator: CustomIndicator) => void;
  title?: string;
  initialData?: CustomIndicator; // 编辑时的初始数据
  mode?: 'create' | 'edit' | 'view'; // 模式：创建/编辑/查看
}

// 数量单位选项
const quantityUnitOptions = [
  { label: '无', value: '' },
  { label: '万', value: 'wan' },
  { label: '亿', value: 'yi' },
  { label: '千', value: 'qian' },
  { label: '百万', value: 'baiwan' },
];

const CustomIndicatorDialog: React.FC<CustomIndicatorDialogProps> = ({
  visible,
  onCancel,
  onOk,
  title,
  initialData,
  mode = 'create'
}) => {
  const [form] = Form.useForm();
  const [, setDescriptionLength] = useState<number>(0);
  const [expressionModalVisible, setExpressionModalVisible] = useState<boolean>(false);
  const [currentExpression, setCurrentExpression] = useState<string>('');
  
  // 显示格式相关状态
  const [displayType, setDisplayType] = useState<'auto' | 'percent'>('auto');
  const [quantityUnit, setQuantityUnit] = useState<string>('');
  const [unitSuffix, setUnitSuffix] = useState<string>('');
  const [useThousandSeparator, setUseThousandSeparator] = useState<boolean>(false);

  // 计算示例预览
  const examplePreview = useMemo(() => {
    const baseValue = 20000000;
    let displayValue = baseValue;
    let suffix = unitSuffix;
    
    // 根据数量单位转换
    switch (quantityUnit) {
      case 'wan':
        displayValue = baseValue / 10000;
        break;
      case 'yi':
        displayValue = baseValue / 100000000;
        break;
      case 'qian':
        displayValue = baseValue / 1000;
        break;
      case 'baiwan':
        displayValue = baseValue / 1000000;
        break;
    }
    
    // 格式化数字
    let formattedValue: string;
    if (displayType === 'percent') {
      formattedValue = (displayValue * 100).toFixed(2) + '%';
    } else {
      if (useThousandSeparator) {
        formattedValue = displayValue.toLocaleString('zh-CN');
      } else {
        formattedValue = displayValue.toString();
      }
    }
    
    return formattedValue + (suffix || '');
  }, [displayType, quantityUnit, unitSuffix, useThousandSeparator]);

  // 动态标题
  const dialogTitle = useMemo(() => {
    if (title) return title;
    switch (mode) {
      case 'edit': return '编辑指标';
      case 'view': return '查看指标';
      default: return '新增自定义指标';
    }
  }, [title, mode]);

  const isViewMode = mode === 'view';

  // 重置表单
  const resetForm = () => {
    form.resetFields();
    setDescriptionLength(0);
    setCurrentExpression('');
    setDisplayType('auto');
    setQuantityUnit('');
    setUnitSuffix('');
    setUseThousandSeparator(false);
  };

  // 处理弹窗打开
  useEffect(() => {
    if (visible) {
      if (initialData) {
        form.setFieldsValue({
          metricName: initialData.metricName,
          bizSpec: initialData.bizSpec,
          scale: initialData.scale,
          expression: initialData.expression,
        });
        setCurrentExpression(initialData.expression || '');
        setDescriptionLength(initialData.bizSpec?.length || 0);
        setDisplayType(initialData.displayType === 'percent' ? 'percent' : 'auto');
        setQuantityUnit(initialData.quantityUnit || '');
        setUnitSuffix(initialData.unitSuffix || '');
        setUseThousandSeparator(initialData.useThousandSeparator || false);
      } else {
        resetForm();
      }
    }
  }, [visible, initialData]);

  // 处理保存
  const handleSave = () => {
    form.validateFields().then((values) => {
      // 检查描述长度
      if (values.bizSpec && values.bizSpec.length > 500) {
        message.error('指标描述不能超过500字');
        return;
      }

      const newIndicator: CustomIndicator = {
        id: initialData?.id || Date.now().toString(),
        ...values,
        expression: currentExpression,
        displayType,
        quantityUnit,
        unitSuffix,
        useThousandSeparator,
      };

      onOk(newIndicator);
      message.success(mode === 'edit' ? '指标修改成功' : '自定义指标创建成功');
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

  // 清除表达式
  const handleClearExpression = () => {
    setCurrentExpression('');
    form.setFieldsValue({ expression: '' });
  };

  return (
    <>
      <Modal
        title={dialogTitle}
        open={visible}
        onCancel={handleCancel}
        footer={isViewMode ? [
          <Button key="close" onClick={handleCancel}>关闭</Button>
        ] : [
          <Button key="cancel" onClick={handleCancel}>取消</Button>,
          <Button key="save" type="primary" onClick={handleSave}>保存</Button>
        ]}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="horizontal" labelCol={{ span: 4 }} wrapperCol={{ span: 20 }}>
          {/* 基本信息区块 */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: 16,
              paddingBottom: 8,
              borderBottom: '1px solid #f0f0f0'
            }}>
              <div style={{
                width: 3,
                height: 14,
                backgroundColor: '#1890ff',
                marginRight: 8,
                borderRadius: 2
              }} />
              <Text strong style={{ fontSize: 14 }}>基本信息</Text>
              <span style={{ marginLeft: 4, color: '#999', fontSize: 12 }}>▼</span>
            </div>

            <Form.Item
              name="metricName"
              label={<span><span style={{ color: 'red' }}>*</span> 指标名称</span>}
              rules={[{ required: true, message: '请输入指标名称' }]}
              style={{ marginBottom: 16 }}
            >
              <Input 
                placeholder="子公司最低价" 
                disabled={isViewMode}
              />
            </Form.Item>

            <Form.Item
              name="bizSpec"
              label="指标描述"
              style={{ marginBottom: 16 }}
            >
              <TextArea
                placeholder="请填写"
                rows={3}
                maxLength={500}
                showCount
                onChange={(e) => setDescriptionLength(e.target.value.length)}
                disabled={isViewMode}
              />
            </Form.Item>

          </div>

          {/* 数据集字段绑定区块 */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: 16,
              paddingBottom: 8,
              borderBottom: '1px solid #f0f0f0'
            }}>
              <div style={{
                width: 3,
                height: 14,
                backgroundColor: '#1890ff',
                marginRight: 8,
                borderRadius: 2
              }} />
              <Text strong style={{ fontSize: 14 }}>数据集字段绑定</Text>
              <span style={{ marginLeft: 4, color: '#999', fontSize: 12 }}>▼</span>
            </div>

            <Form.Item
              name="expression"
              label={<span><span style={{ color: 'red' }}>*</span> 指标公式</span>}
              style={{ marginBottom: 16 }}
            >
              <Input
                placeholder="点击编辑指标公式"
                value={currentExpression}
                readOnly={isViewMode}
                style={{ cursor: isViewMode ? 'default' : 'pointer' }}
                onClick={() => !isViewMode && setExpressionModalVisible(true)}
                suffix={
                  <Space size={4}>
                    {currentExpression && !isViewMode && (
                      <CloseCircleOutlined 
                        style={{ color: '#999', cursor: 'pointer' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearExpression();
                        }}
                      />
                    )}
                    <EyeOutlined style={{ color: '#999' }} />
                  </Space>
                }
              />
            </Form.Item>
          </div>

          {/* 显示格式配置区块 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: 16,
              paddingBottom: 8,
              borderBottom: '1px solid #f0f0f0'
            }}>
              <div style={{
                width: 3,
                height: 14,
                backgroundColor: '#1890ff',
                marginRight: 8,
                borderRadius: 2
              }} />
              <Text strong style={{ fontSize: 14 }}>显示格式</Text>
              <span style={{ marginLeft: 4, color: '#999', fontSize: 12 }}>▼</span>
            </div>

            {/* 显示类型 */}
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}>
              <Radio.Group 
                value={displayType} 
                onChange={(e) => setDisplayType(e.target.value)}
                disabled={isViewMode}
              >
                <Radio value="auto">自动</Radio>
                <Radio value="percent">百分比</Radio>
              </Radio.Group>
            </div>

            {/* 数量单位 */}
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}>
              <Text style={{ width: 70, flexShrink: 0 }}>数量单位：</Text>
              <Select
                value={quantityUnit}
                onChange={setQuantityUnit}
                style={{ width: 200 }}
                options={quantityUnitOptions}
                disabled={isViewMode}
              />
            </div>

            {/* 单位后缀 */}
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}>
              <Text style={{ width: 70, flexShrink: 0 }}>单位后缀：</Text>
              <Input
                value={unitSuffix}
                onChange={(e) => setUnitSuffix(e.target.value)}
                placeholder="自定义输入"
                style={{ width: 200 }}
                disabled={isViewMode}
              />
            </div>

            {/* 千分符 */}
            <div style={{ marginBottom: 16 }}>
              <Checkbox
                checked={useThousandSeparator}
                onChange={(e) => setUseThousandSeparator(e.target.checked)}
                disabled={isViewMode}
              >
                千分符
              </Checkbox>
            </div>

            {/* 精度 */}
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}>
              <Text style={{ width: 70, flexShrink: 0 }}>精度：</Text>
              <InputNumber
                value={form.getFieldValue('scale')}
                onChange={(val) => form.setFieldsValue({ scale: val })}
                min={0}
                max={10}
                style={{ width: 200 }}
                placeholder="小数位数"
                disabled={isViewMode}
              />
            </div>

            {/* 示例预览 */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Text style={{ width: 70, flexShrink: 0 }}>示例：</Text>
              <Text style={{ color: '#666' }}>{examplePreview}</Text>
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
                  聚合函数
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
                  数值函数
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
                  fontSize: '16px', 
                  fontWeight: 'bold', 
                  color: '#1890ff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '4px 0'
                }}>
                  <span style={{ 
                    display: 'inline-block',
                    width: '4px',
                    height: '16px',
                    backgroundColor: '#1890ff',
                    borderRadius: '2px'
                  }}></span>
                  指标公式编辑器
                </div>
              }
              style={{ 
                border: '2px solid #1890ff',
                borderRadius: '8px',
                flex: 1
              }}
            >
              <TextArea
                value={currentExpression}
                onChange={(e) => setCurrentExpression(e.target.value)}
                placeholder="在此输入指标公式，或点击左侧元素快速构建..."
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
              title="常用操作符"
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