import React, { useState } from 'react';
import { Button, Input, Select, Table, Card, Modal, Badge, Tabs, Tag, Typography, Form, Space, Tooltip } from 'antd';
import { Plus, Edit, Trash2 } from 'lucide-react';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface EnumValue {
  value: string;
  label: string;
  description?: string;
}

interface PriceFactor {
  id: string;
  factorName: string;
  factorCode: string;
  factorType: 'CONTROL' | 'SCORE';
  description: string;
  valueType: 'ENUM' | 'MULTI_SELECT' | 'RANGE' | 'NUMERIC';
  enumValues?: EnumValue[];
  createTime: string;
  updateTime: string;
}

const PriceFactorManagement: React.FC = () => {
  const [factors, setFactors] = useState<PriceFactor[]>([
    {
      id: '1',
      factorName: '注册证等级',
      factorCode: 'cert_level',
      factorType: 'SCORE',
      description: '医疗器械注册证等级，影响产品质量评分',
      valueType: 'ENUM',
      enumValues: [
        { value: 'CLASS_I', label: '一类', description: '风险程度低' },
        { value: 'CLASS_II', label: '二类', description: '风险程度中等' },
        { value: 'CLASS_III', label: '三类', description: '风险程度高' }
      ],
      createTime: '2024-01-15',
      updateTime: '2024-01-15'
    },
    {
      id: '2',
      factorName: '采购方式',
      factorCode: 'purchase_method',
      factorType: 'CONTROL',
      description: '采购方式类型，用于过滤控制',
      valueType: 'ENUM',
      enumValues: [
        { value: 'PUBLIC_TENDER', label: '公开招标', description: '公开透明的招标方式' },
        { value: 'INVITE_TENDER', label: '邀请招标', description: '邀请特定供应商参与' },
        { value: 'NEGOTIATION', label: '竞争性谈判', description: '通过谈判确定供应商' },
        { value: 'SINGLE_SOURCE', label: '单一来源', description: '特殊情况下的单一供应商采购' }
      ],
      createTime: '2024-01-16',
      updateTime: '2024-01-16'
    },
    {
      id: '3',
      factorName: '品牌等级',
      factorCode: 'brand_level',
      factorType: 'SCORE',
      description: '品牌知名度和市场地位评级',
      valueType: 'ENUM',
      enumValues: [
        { value: 'PREMIUM', label: '重点品牌', description: '行业领先品牌' },
        { value: 'STANDARD', label: '标准品牌', description: '市场认可品牌' },
        { value: 'BASIC', label: '基础品牌', description: '一般市场品牌' }
      ],
      createTime: '2024-01-17',
      updateTime: '2024-01-17'
    }
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFactor, setEditingFactor] = useState<PriceFactor | null>(null);
  const [formData, setFormData] = useState({
    factorName: '',
    factorCode: '',
    factorType: 'CONTROL' as 'CONTROL' | 'SCORE',
    description: '',
    valueType: 'ENUM' as 'ENUM' | 'MULTI_SELECT' | 'RANGE' | 'NUMERIC',
    enumValues: [] as EnumValue[]
  });
  const [newEnumValue, setNewEnumValue] = useState({ value: '', label: '', description: '' });

  const handleSubmit = () => {
    if (editingFactor) {
      // 更新现有因子
      setFactors(factors.map(factor => 
        factor.id === editingFactor.id 
          ? { ...factor, ...formData, updateTime: new Date().toISOString().split('T')[0] }
          : factor
      ));
    } else {
      // 创建新因子
      const newFactor: PriceFactor = {
        id: Date.now().toString(),
        ...formData,
        createTime: new Date().toISOString().split('T')[0],
        updateTime: new Date().toISOString().split('T')[0]
      };
      setFactors([...factors, newFactor]);
    }
    
    resetForm();
    setIsDialogOpen(false);
  };

  const resetForm = () => {
    setFormData({
      factorName: '',
      factorCode: '',
      factorType: 'CONTROL',
      description: '',
      valueType: 'ENUM',
      enumValues: []
    });
    setEditingFactor(null);
    setNewEnumValue({ value: '', label: '', description: '' });
  };

  const handleEdit = (factor: PriceFactor) => {
    setEditingFactor(factor);
    setFormData({
      factorName: factor.factorName,
      factorCode: factor.factorCode,
      factorType: factor.factorType,
      description: factor.description,
      valueType: factor.valueType,
      enumValues: factor.enumValues || []
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setFactors(factors.filter(factor => factor.id !== id));
  };

  const addEnumValue = () => {
    if (newEnumValue.value && newEnumValue.label) {
      setFormData({
        ...formData,
        enumValues: [...formData.enumValues, { ...newEnumValue }]
      });
      setNewEnumValue({ value: '', label: '', description: '' });
    }
  };

  const removeEnumValue = (index: number) => {
    setFormData({
      ...formData,
      enumValues: formData.enumValues.filter((_, i) => i !== index)
    });
  };

  const getFactorTypeText = (type: string) => {
    return type === 'CONTROL' ? '控制型' : '评分型';
  };

  const getValueTypeText = (type: string) => {
    const typeMap = {
      'ENUM': '选项型（枚举）',
      'MULTI_SELECT': '多选型',
      'RANGE': '区间型',
      'NUMERIC': '数值型'
    };
    return typeMap[type as keyof typeof typeMap] || type;
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Title level={2}>比价因子管理</Title>
          <Text type="secondary">
            管理比价因子库，定义比价规则中使用的评价维度和控制条件
          </Text>
        </div>
        <Button type="primary" icon={<Plus />} onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          新建因子
        </Button>
      </div>

      <Modal
        title={editingFactor ? '编辑比价因子' : '新建比价因子'}
        open={isDialogOpen}
        onCancel={() => setIsDialogOpen(false)}
        width={800}
        footer={[
          <Button key="cancel" onClick={() => setIsDialogOpen(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={handleSubmit}>
            {editingFactor ? '更新' : '创建'}
          </Button>
        ]}
      >
        <Tabs defaultActiveKey="basic">
          <TabPane tab="基本信息" key="basic">
            <Form layout="vertical" style={{ marginTop: '16px' }}>
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <Form.Item label="因子名称 *">
                    <Input
                      placeholder="请输入因子名称"
                      value={formData.factorName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, factorName: e.target.value })}
                    />
                  </Form.Item>
                  <Form.Item label="因子编码 *">
                    <Input
                      placeholder="请输入因子编码"
                      value={formData.factorCode}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, factorCode: e.target.value })}
                    />
                  </Form.Item>
                </div>
                
                <Form.Item label="因子类型 *">
                  <Select 
                    value={formData.factorType} 
                    onChange={(value: 'CONTROL' | 'SCORE') => setFormData({ ...formData, factorType: value })}
                    placeholder="选择因子类型"
                  >
                    <Option value="CONTROL">CONTROL 控制型</Option>
                    <Option value="SCORE">SCORE 评分型</Option>
                  </Select>
                </Form.Item>
                
                <Form.Item label="描述">
                  <TextArea
                    placeholder="请输入因子描述"
                    value={formData.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </Form.Item>
              </Space>
            </Form>
          </TabPane>
          
          <TabPane tab="值域设置" key="values">
            <Form layout="vertical" style={{ marginTop: '16px' }}>
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Form.Item label="值类型 *">
                  <Select 
                    value={formData.valueType} 
                    onChange={(value: any) => setFormData({ ...formData, valueType: value })}
                    placeholder="选择值类型"
                  >
                    <Option value="ENUM">选项型（枚举）</Option>
                    <Option value="MULTI_SELECT">多选型</Option>
                    <Option value="RANGE">区间型</Option>
                    <Option value="NUMERIC">数值型</Option>
                  </Select>
                </Form.Item>
                
                {formData.valueType === 'ENUM' && (
                  <div>
                    <Text strong>枚举值配置</Text>
                    
                    {/* 添加新枚举值 */}
                    <Card size="small" style={{ marginTop: '8px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '8px', alignItems: 'end' }}>
                        <Form.Item label="值 *" style={{ margin: 0 }}>
                          <Input
                            placeholder="枚举值"
                            value={newEnumValue.value}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEnumValue({ ...newEnumValue, value: e.target.value })}
                          />
                        </Form.Item>
                        <Form.Item label="标签 *" style={{ margin: 0 }}>
                          <Input
                            placeholder="显示标签"
                            value={newEnumValue.label}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEnumValue({ ...newEnumValue, label: e.target.value })}
                          />
                        </Form.Item>
                        <Form.Item label="描述" style={{ margin: 0 }}>
                          <Input
                            placeholder="描述信息"
                            value={newEnumValue.description}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEnumValue({ ...newEnumValue, description: e.target.value })}
                          />
                        </Form.Item>
                        <Button type="primary" icon={<Plus />} onClick={addEnumValue}>
                          添加
                        </Button>
                      </div>
                    </Card>
                    
                    {/* 枚举值列表 */}
                    {formData.enumValues.length > 0 && (
                      <Card size="small" style={{ marginTop: '16px' }}>
                        <Text strong>已配置的枚举值</Text>
                        <div style={{ marginTop: '8px' }}>
                          {formData.enumValues.map((enumValue, index) => (
                            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '6px', marginBottom: '8px' }}>
                              <div>
                                <div style={{ fontWeight: 500 }}>{enumValue.label} ({enumValue.value})</div>
                                {enumValue.description && (
                                  <div style={{ fontSize: '12px', color: '#666' }}>{enumValue.description}</div>
                                )}
                              </div>
                              <Button
                                type="text"
                                icon={<Trash2 size={16} />}
                                onClick={() => removeEnumValue(index)}
                              />
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                  </div>
                )}
              </Space>
            </Form>
          </TabPane>
        </Tabs>
      </Modal>

      <Card title="因子列表" extra={<Text type="secondary">当前共有 {factors.length} 个比价因子</Text>}>
        <Table
          dataSource={factors}
          rowKey="id"
          columns={[
            {
              title: '因子名称',
              dataIndex: 'factorName',
              key: 'factorName',
              render: (text: string) => <Text strong>{text}</Text>
            },
            {
              title: '因子编码',
              dataIndex: 'factorCode',
              key: 'factorCode',
              render: (text: string) => <Tag color="blue">{text}</Tag>
            },
            {
              title: '因子类型',
              dataIndex: 'factorType',
              key: 'factorType',
              render: (type: string) => (
                <Badge 
                  color={type === 'CONTROL' ? 'default' : 'processing'}
                  text={getFactorTypeText(type)}
                />
              )
            },
            {
              title: '值类型',
              dataIndex: 'valueType',
              key: 'valueType',
              render: (type: string) => getValueTypeText(type)
            },
            {
              title: '描述',
              dataIndex: 'description',
              key: 'description',
              ellipsis: true,
              render: (text: string) => (
                <Tooltip title={text}>
                  <span>{text}</span>
                </Tooltip>
              )
            },
            {
              title: '更新时间',
              dataIndex: 'updateTime',
              key: 'updateTime'
            },
            {
              title: '操作',
              key: 'action',
              align: 'right' as const,
              render: (_: any, record: PriceFactor) => (
                <Space>
                  <Tooltip title="编辑">
                    <Button
                      type="text"
                      icon={<Edit size={16} />}
                      onClick={() => handleEdit(record)}
                    />
                  </Tooltip>
                  <Tooltip title="删除">
                    <Button
                      type="text"
                      danger
                      icon={<Trash2 size={16} />}
                      onClick={() => handleDelete(record.id)}
                    />
                  </Tooltip>
                </Space>
              )
            }
          ]}
        />
      </Card>
    </div>
  );
};

export default PriceFactorManagement;