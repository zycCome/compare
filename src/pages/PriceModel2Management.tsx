import React, { useState } from 'react';
import { Card, Button, Input, Radio, Checkbox, Select, Tag, Divider, Form, Space, Typography, Alert, Row, Col, Tabs, Modal } from 'antd';
import { PlusOutlined, SaveOutlined, EyeOutlined, SendOutlined, LeftOutlined, CheckOutlined, CloseOutlined, EditOutlined, CopyOutlined, DeleteOutlined, RightOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface PriceModel2 {
  id?: string;
  modelName: string;
  modelCode: string;
  tags: string[];
  description: string;
  status: 'enabled' | 'disabled';
  mainDataset: string;
  baselineDatasets: string[];
  compareObject: string;
  analysisObject: string;
  analysisDimensions: string[];
  analysisIndicators: string[];
  baselineCandidates: string[];
}

const PriceModel2Management: React.FC = () => {
  const [models, setModels] = useState<PriceModel2[]>([]);
  const [form] = Form.useForm();
  const [editingModel, setEditingModel] = useState<PriceModel2 | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentStep, setCurrentStep] = useState('1');
  const [baselineModalVisible, setBaselineModalVisible] = useState(false);
  const [selectedBaselines, setSelectedBaselines] = useState<string[]>([]);
  const [tempSelectedBaselines, setTempSelectedBaselines] = useState<string[]>([]);

  // Mock data
  const mockDatasets = [
    { value: 'ds_agreement_price', label: '集团采购协议数据集' },
    { value: 'ds_history_order', label: '历史采购订单数据集' },
    { value: 'ds_market_price', label: '市场行情价数据集' },
    { value: 'ds_tender_platform', label: '招采平台报价数据集' }
  ];

  const mockFields = [
    { value: 'product_id', label: '产品ID' },
    { value: 'vendor_id', label: '供应商ID' },
    { value: 'purchase_org', label: '采购组织' },
    { value: 'brand', label: '品牌' },
    { value: 'spec_model', label: '规格型号' },
    { value: 'reg_level', label: '注册证等级' },
    { value: 'purchase_mode', label: '采购模式' }
  ];

  const mockIndicators = [
    { value: 'ind_agreement_price', label: '协议价' },
    { value: 'ind_trade_avg_price', label: '平均成交价' },
    { value: 'ind_trade_min_price', label: '最低成交价' },
    { value: 'ind_history_min_price', label: '历史最低价' },
    { value: 'ind_market_ref_price', label: '市场参考价' },
    { value: 'ind_tender_win_price', label: '招采中标价' }
  ];

  const handleCreateNew = () => {
    setIsEditing(true);
    setEditingModel(null);
    form.resetFields();
  };

  const handleEdit = (model: PriceModel2) => {
    setIsEditing(true);
    setEditingModel(model);
    form.setFieldsValue(model);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const newModel: PriceModel2 = {
        ...values,
        id: editingModel?.id || Date.now().toString()
      };
      
      if (editingModel) {
        setModels(models.map(m => m.id === editingModel.id ? newModel : m));
      } else {
        setModels([...models, newModel]);
      }
      
      setIsEditing(false);
      setEditingModel(null);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleNext = () => {
    const stepOrder = ['1', '2', '3', '4', '5'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const handlePrev = () => {
    const stepOrder = ['1', '2', '3', '4', '5'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const handlePreview = () => {
    console.log('预览模型');
  };

  const handlePublish = () => {
    console.log('发布模型');
  };

  const handleBaselineModalOk = () => {
    setSelectedBaselines([...tempSelectedBaselines]);
    setBaselineModalVisible(false);
  };

  const handleBaselineModalCancel = () => {
    setTempSelectedBaselines([...selectedBaselines]);
    setBaselineModalVisible(false);
  };

  const handleSelectAllBaselines = (checked: boolean) => {
    if (checked) {
      setTempSelectedBaselines(mockDatasets.map(d => d.value));
    } else {
      setTempSelectedBaselines([]);
    }
  };

  const removeSelectedBaseline = (value: string) => {
    setSelectedBaselines(selectedBaselines.filter(item => item !== value));
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingModel(null);
    form.resetFields();
  };

  if (isEditing) {
    return (
      <div style={{ padding: '24px' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Button icon={<LeftOutlined />} onClick={handleCancel}>
              返回
            </Button>
            <Title level={2} style={{ margin: 0 }}>
              比价模型2 · {editingModel ? '编辑' : '新建'}
            </Title>
            <Tag color="orange">草稿</Tag>
          </div>
          <Space>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
              保存
            </Button>
            <Button icon={<SendOutlined />} onClick={handlePublish}>
              发布
            </Button>
          </Space>
        </div>

        {/* Form */}
        <Form form={form} layout="vertical" style={{ maxWidth: '1200px' }}>
           <Tabs 
             activeKey={currentStep}
             onChange={setCurrentStep}
             items={[
               {
                 key: '1',
                 label: '1. 基本信息',
                 children: (
                   <Card>
                     <Row gutter={16}>
                       <Col span={12}>
                         <Form.Item
                           label="模型名称"
                           name="modelName"
                           rules={[{ required: true, message: '请输入模型名称' }]}
                         >
                           <Input placeholder="请输入模型名称" />
                         </Form.Item>
                       </Col>
                       <Col span={12}>
                         <Form.Item
                           label="模型编码"
                           name="modelCode"
                           rules={[{ required: true, message: '请输入模型编码' }]}
                         >
                           <Input placeholder="mdl_vendor_price_compare" />
                         </Form.Item>
                       </Col>
                     </Row>
                     
                     <Form.Item label="场景标签" name="tags">
                       <Select mode="tags" placeholder="添加场景标签">
                         <Option value="同品多商">同品多商</Option>
                         <Option value="历史对比">历史对比</Option>
                       </Select>
                     </Form.Item>

                     <Form.Item label="描述" name="description">
                       <TextArea rows={3} placeholder="请输入模型描述" />
                     </Form.Item>

                     <Form.Item label="启用状态" name="status" initialValue="enabled">
                       <Radio.Group>
                         <Radio value="disabled">停用</Radio>
                         <Radio value="enabled">启用</Radio>
                       </Radio.Group>
                     </Form.Item>
                     
                     <div style={{ textAlign: 'right', marginTop: '24px' }}>
                        <Button type="primary" icon={<RightOutlined />} onClick={handleNext}>
                          下一步
                        </Button>
                      </div>
                   </Card>
                 )
               },
               {
                 key: '2',
                 label: '2. 数据绑定',
                 children: (
                   <Card>
                     <Form.Item
                       label="选择比价数据集（单选，主角：从这里取'被比较'的指标）"
                       name="mainDataset"
                       rules={[{ required: true, message: '请选择比价数据集' }]}
                     >
                       <Radio.Group>
                         {mockDatasets.map(dataset => (
                           <Radio key={dataset.value} value={dataset.value} style={{ display: 'block', marginBottom: '8px' }}>
                             {dataset.label}
                           </Radio>
                         ))}
                       </Radio.Group>
                     </Form.Item>

                     <Divider />

                     <Form.Item
                       label="选择基准数据集（可多选，参照物：从这里取'基准'指标）"
                       name="baselineDatasets"
                     >
                       <div>
                         <Button 
                           type="dashed" 
                           onClick={() => {
                             setTempSelectedBaselines([...selectedBaselines]);
                             setBaselineModalVisible(true);
                           }}
                           style={{ width: '100%', marginBottom: '16px' }}
                         >
                           选择基准数据集
                         </Button>
                         
                         {selectedBaselines.length > 0 && (
                           <div>
                             <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>已选基准数据集：</div>
                             <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                               {selectedBaselines.map(value => {
                                 const dataset = mockDatasets.find(d => d.value === value);
                                 return (
                                   <Tag 
                                     key={value} 
                                     closable 
                                     onClose={() => removeSelectedBaseline(value)}
                                   >
                                     {dataset?.label}
                                   </Tag>
                                 );
                               })}
                             </div>
                           </div>
                         )}
                       </div>
                     </Form.Item>
                     
                     <Alert
                       message="备注：后续'可选指标'会按上述选择自动过滤（只显示可取数的指标）"
                       type="info"
                       showIcon
                     />
                     
                     <div style={{ textAlign: 'right', marginTop: '24px' }}>
                        <Space>
                          <Button icon={<LeftOutlined />} onClick={handlePrev}>
                            上一步
                          </Button>
                          <Button type="primary" icon={<RightOutlined />} onClick={handleNext}>
                            下一步
                          </Button>
                        </Space>
                      </div>
                   </Card>
                 )
               },
               {
                 key: '3',
                 label: '3. 对象与维度配置',
                 children: (
                   <Card>
                     <Row gutter={16}>
                       <Col span={12}>
                         <Form.Item
                           label="比价对象（定义'按什么实体比较'）"
                           name="compareObject"
                           rules={[{ required: true, message: '请选择比价对象' }]}
                         >
                           <Select placeholder="选择比价对象字段">
                             {mockFields.map(field => (
                               <Option key={field.value} value={field.value}>
                                 {field.value} | {field.label}
                               </Option>
                             ))}
                           </Select>
                         </Form.Item>
                       </Col>
                       <Col span={12}>
                         <Form.Item
                           label="分析对象（定义'谁作为分组/对照'）"
                           name="analysisObject"
                           rules={[{ required: true, message: '请选择分析对象' }]}
                         >
                           <Select placeholder="选择分析对象字段">
                             {mockFields.map(field => (
                               <Option key={field.value} value={field.value}>
                                 {field.value} | {field.label}
                               </Option>
                             ))}
                           </Select>
                         </Form.Item>
                       </Col>
                     </Row>

                     <Form.Item label="分析维度（可多选）" name="analysisDimensions">
                       <Checkbox.Group>
                         <Row>
                           {mockFields.map(field => (
                             <Col span={12} key={field.value}>
                               <Checkbox value={field.value} style={{ marginBottom: '8px' }}>
                                 {field.value} | {field.label}
                               </Checkbox>
                             </Col>
                           ))}
                         </Row>
                       </Checkbox.Group>
                     </Form.Item>
                     
                     <div style={{ textAlign: 'right', marginTop: '24px' }}>
                        <Space>
                          <Button icon={<LeftOutlined />} onClick={handlePrev}>
                            上一步
                          </Button>
                          <Button type="primary" icon={<RightOutlined />} onClick={handleNext}>
                            下一步
                          </Button>
                        </Space>
                      </div>
                   </Card>
                 )
               },
               {
                 key: '4',
                 label: '4. 指标配置',
                 children: (
                   <Card>
                     <Form.Item
                       label="分析指标（来自指标库，必须映射到'比价数据集'）"
                       name="analysisIndicators"
                     >
                       <Checkbox.Group>
                         {mockIndicators.slice(0, 3).map(indicator => (
                           <Checkbox key={indicator.value} value={indicator.value} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '8px', whiteSpace: 'nowrap' }}>
                             <span style={{ wordBreak: 'keep-all', whiteSpace: 'nowrap' }}>
                               {indicator.value} | {indicator.label}
                             </span>
                           </Checkbox>
                         ))}
                       </Checkbox.Group>
                     </Form.Item>

                     <Divider />

                     <Form.Item
                       label="基准指标候选（来自指标库，必须映射到'基准数据集'之一，可多选）"
                       name="baselineCandidates"
                     >
                       <Checkbox.Group>
                         {mockIndicators.slice(3).map(indicator => (
                           <Checkbox key={indicator.value} value={indicator.value} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '8px', whiteSpace: 'nowrap' }}>
                             <span style={{ wordBreak: 'keep-all', whiteSpace: 'nowrap' }}>
                               {indicator.value} | {indicator.label}
                             </span>
                           </Checkbox>
                         ))}
                       </Checkbox.Group>
                     </Form.Item>
                     
                     <Alert
                       message="说明：真正使用哪一个基准指标，在'比价方案'中再单选"
                       type="info"
                       showIcon
                     />

                     <Divider />

                     <div>
                       <Text strong>计算指标（可选；模型级复用）</Text>
                       <div style={{ marginTop: '8px' }}>
                         <Button icon={<PlusOutlined />} size="small">
                           新增计算指标
                         </Button>
                       </div>
                     </div>
                     
                     <div style={{ textAlign: 'right', marginTop: '24px' }}>
                        <Space>
                          <Button icon={<LeftOutlined />} onClick={handlePrev}>
                            上一步
                          </Button>
                          <Button type="primary" icon={<RightOutlined />} onClick={handleNext}>
                            下一步
                          </Button>
                        </Space>
                      </div>
                   </Card>
                 )
               },
               {
                 key: '5',
                 label: '5. 校验与预览',
                 children: (
                   <Card>
                     <div style={{ marginBottom: '16px' }}>
                       <Text strong>校验：</Text>
                       <div style={{ marginTop: '8px' }}>
                         <div style={{ marginBottom: '8px' }}>
                           <CheckOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                           <Text>所选指标均可在对应数据集取数</Text>
                         </div>
                         <div style={{ marginBottom: '8px' }}>
                           <CheckOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                           <Text>基准维度与分析维度可匹配</Text>
                         </div>
                         <div style={{ marginBottom: '8px' }}>
                           <CheckOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                           <Text>基准指标候选非空</Text>
                         </div>
                       </div>
                     </div>
                     
                     <div>
                       <Text strong>预览：</Text>
                       <div style={{ marginTop: '8px' }}>
                         <Text type="secondary">按"比价对象 × 分析对象 × 维度 × 指标"生成样表</Text>
                         <div style={{ marginTop: '8px' }}>
                           <Button icon={<EyeOutlined />} onClick={handlePreview}>
                             生成预览表
                           </Button>
                         </div>
                       </div>
                     </div>
                     
                     <div style={{ textAlign: 'right', marginTop: '24px' }}>
                        <Space>
                          <Button icon={<LeftOutlined />} onClick={handlePrev}>
                            上一步
                          </Button>
                          <Button icon={<EyeOutlined />} onClick={handlePreview}>
                            预览
                          </Button>
                        </Space>
                      </div>
                   </Card>
                 )
               }
             ]}
           />
           
           {/* 基准数据集选择弹框 */}
           <Modal
             title="选择基准数据集"
             open={baselineModalVisible}
             onOk={handleBaselineModalOk}
             onCancel={handleBaselineModalCancel}
             width={600}
           >
             <div style={{ marginBottom: '16px' }}>
               <Checkbox 
                 indeterminate={tempSelectedBaselines.length > 0 && tempSelectedBaselines.length < mockDatasets.length}
                 checked={tempSelectedBaselines.length === mockDatasets.length}
                 onChange={(e) => handleSelectAllBaselines(e.target.checked)}
               >
                 全选
               </Checkbox>
             </div>
             <Checkbox.Group 
               value={tempSelectedBaselines} 
               onChange={setTempSelectedBaselines}
               style={{ width: '100%' }}
             >
               <Row>
                 {mockDatasets.map(dataset => (
                   <Col span={24} key={dataset.value} style={{ marginBottom: '8px' }}>
                     <Checkbox value={dataset.value}>
                       {dataset.label}
                     </Checkbox>
                   </Col>
                 ))}
               </Row>
             </Checkbox.Group>
           </Modal>
         </Form>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>比价模型2管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateNew}>
          新建模型
        </Button>
      </div>

      <Card title="模型列表">
        {models.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#999' }}>
            暂无数据，点击"新建模型"开始创建
          </div>
        ) : (
          <div>
            {models.map(model => (
              <Card
                key={model.id}
                size="small"
                style={{ marginBottom: '16px' }}
                hoverable
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Title level={4} style={{ margin: 0, marginBottom: '4px' }}>
                      {model.modelName}
                    </Title>
                    <Text type="secondary">{model.modelCode}</Text>
                    <div style={{ marginTop: '8px' }}>
                       {model.tags?.map(tag => (
                         <Tag key={tag} color="blue">
                           {tag}
                         </Tag>
                       ))}
                       <Tag color={model.status === 'enabled' ? 'green' : 'default'}>
                         {model.status === 'enabled' ? '启用' : '停用'}
                       </Tag>
                     </div>
                  </div>
                  <Space>
                    <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(model)}>
                      编辑
                    </Button>
                    <Button size="small" icon={<CopyOutlined />}>
                      复制
                    </Button>
                    <Button size="small" icon={<DeleteOutlined />} danger>
                      删除
                    </Button>
                  </Space>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default PriceModel2Management;