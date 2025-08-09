import React, { useState } from 'react';
import { Card, Button, Select, Badge, Typography, Row, Col, Checkbox, Modal, Table } from 'antd';
import { Star, Download, RotateCcw, ChevronDown, ChevronRight } from 'lucide-react';
import { SheetComponent } from '@antv/s2-react';
import '@antv/s2-react/dist/s2-react.min.css';

const { Title } = Typography;
const { Option } = Select;

interface ReportCenterProps {}

const ReportCenter: React.FC<ReportCenterProps> = () => {
  // 分析对象设置状态
  const [analysisIndicators, setAnalysisIndicators] = useState<string[]>(['cost', 'history']);
  const [analysisObject, setAnalysisObject] = useState<string>('supplier');
  const [analysisDimensions, setAnalysisDimensions] = useState<string[]>(['supplier']);

  // 基准选择状态
  const [baselineIndicator, setBaselineIndicator] = useState<string>('lowest');
  const [baselineDimensions, setBaselineDimensions] = useState<string[]>(['supplier']);

  const [currentDimension, setCurrentDimension] = useState('supplier');
  const [currentBaseline, setCurrentBaseline] = useState('history');

  // 弹框状态
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<string>('');
  const [modalTitle, setModalTitle] = useState<string>('');
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  // 展开收起状态
  const [analysisExpanded, setAnalysisExpanded] = useState(true);
  const [baselineExpanded, setBaselineExpanded] = useState(true);

  // 选项数据
  const indicatorOptions = [
    { label: '协议价（含税）', value: 'agreementPriceTax' },
    { label: '协议价（不含税）', value: 'agreementPriceNoTax' },
    { label: '税率', value: 'taxRate' }
  ];

  // 筛选条件状态
  const [filterConditions, setFilterConditions] = useState<{[key: string]: string[]}>({
    managementOrg: [],
    supplier: [],
    product: [],
    brand: [],
    inventoryCategory: []
  });

  const [baselineConditions, setBaselineConditions] = useState<{[key: string]: string[]}>({  
    managementOrg: [],
    supplier: [],
    product: [],
    brand: [],
    inventoryCategory: []
  });

  // 弹框处理函数
  const handleModalOpen = (type: string, title: string, isBaseline: boolean = false) => {
    setModalType(type);
    setModalTitle(title);
    const currentValues = isBaseline ? baselineConditions[type] : filterConditions[type];
    setSelectedValues(currentValues || []);
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setModalType('');
    setModalTitle('');
    setSelectedValues([]);
  };

  const handleModalConfirm = () => {
    const isBaseline = modalTitle.includes('基准');
    if (isBaseline) {
      setBaselineConditions(prev => ({
        ...prev,
        [modalType]: selectedValues
      }));
    } else {
      setFilterConditions(prev => ({
        ...prev,
        [modalType]: selectedValues
      }));
    }
    handleModalClose();
  };

  // 格式化按钮显示文本
  const formatButtonText = (values: string[], type: string, placeholder: string) => {
    if (values.length === 0) return placeholder;
    
    const options = getModalOptions(type);
    const selectedOptions = options.filter(option => values.includes(option.value));
    
    if (selectedOptions.length === 1) {
      return selectedOptions[0].name;
    } else if (selectedOptions.length > 1) {
      return `${selectedOptions[0].name} +${selectedOptions.length - 1}`;
    }
    
    return placeholder;
  };

  // 获取弹框选项数据
  const getModalOptions = (type: string) => {
    switch (type) {
      case 'managementOrg':
        return [
          { code: 'DIAN001', name: '迪安诊断技术集团', value: 'dian' },
          { code: 'HUADA001', name: '华大基因', value: 'huada' },
          { code: 'JINYU001', name: '金域医学', value: 'jinyu' }
        ];
      case 'supplier':
        return [
          { code: 'SUP001', name: '罗氏Roche Diagnostics', value: 'roche' },
          { code: 'SUP002', name: '迪安诊断技术集团股份有限公司', value: 'dian_supplier' },
          { code: 'SUP003', name: '西门子医疗', value: 'siemens' },
          { code: 'SUP004', name: '雅培诊断', value: 'abbott' }
        ];
      case 'product':
          return [
            { code: '11000003', name: '糖类抗原15-3(检测试剂) CA15-3', brand: '罗氏Roche', registrationNo: '国械注准20173400123', specification: '100测试/盒', model: 'CA15-3 Kit', itemNo: 'RO-CA153-100', value: 'ca15_3' },
            { code: '11000005', name: '三碘甲状腺原氨酸测定试剂 T3', brand: '罗氏Roche', registrationNo: '国械注准20173400124', specification: '100测试/盒', model: 'T3 Kit', itemNo: 'RO-T3-100', value: 't3' },
            { code: '11000006', name: '癌胚抗原测定试剂 CEA CalSet', brand: '罗氏Roche', registrationNo: '国械注准20173400125', specification: '100测试/盒', model: 'CEA Kit', itemNo: 'RO-CEA-100', value: 'cea' },
            { code: '11000008', name: '糖类抗原19-9(检测试剂) CA19-9', brand: '罗氏Roche', registrationNo: '国械注准20173400126', specification: '100测试/盒', model: 'CA19-9 Kit', itemNo: 'RO-CA199-100', value: 'ca19_9' }
          ];
      case 'brand':
        return [
          { code: 'BR001', name: '罗氏Roche', value: 'roche' },
          { code: 'BR002', name: '西门子Siemens', value: 'siemens' },
          { code: 'BR003', name: '雅培Abbott', value: 'abbott' },
          { code: 'BR004', name: '贝克曼Beckman', value: 'beckman' }
        ];
      case 'inventoryCategory':
        return [
          { code: 'CAT001', name: '体外诊断试剂', value: 'ivd' },
          { code: 'CAT002', name: '医疗器械', value: 'medical_device' },
          { code: 'CAT003', name: '实验室耗材', value: 'lab_consumables' },
          { code: 'CAT004', name: '检测设备', value: 'testing_equipment' }
        ];
      default:
        return [];
    }
  };

  const analysisObjectOptions = [
    { label: '供应商', value: 'supplier' },
    { label: '采购组织', value: 'procurementOrg' },
    { label: '采购模式', value: 'procurementMode' }
  ];

  const dimensionOptions = [
    { label: '管理组织', value: 'managementOrg' },
    { label: '采购组织', value: 'procurementOrg' },
    { label: '采购模式', value: 'procurementMode' },
    { label: '供应商', value: 'supplier' }
  ];

  const baselineIndicatorOptions = [
    { label: '最高价', value: 'highest' },
    { label: '最低价', value: 'lowest' },
    { label: '平均价', value: 'average' }
  ];

  const baselineDimensionOptions = [
    { label: '供应商', value: 'supplier' },
    { label: '采购模式', value: 'procurementMode' },
    { label: '采购组织', value: 'procurementOrg' }
  ];



  // 模拟数据 - 基于文档中的医疗器械数据
  const mockData = [
    {
      productCode: '11000003',
      productName: '糖类抗原15-3(检测试剂) CA15-3',
      brand: '罗氏Roche',
      supplier: '罗氏Roche Diagnostics',
      managementOrg: '迪安诊断技术集团',
      procurementMode: '集中采购',
      agreementPrice: 196.46,
      taxRate: 13.0,
      diffRate: 0
    },
    {
      productCode: '11000003',
      productName: '糖类抗原15-3(检测试剂) CA15-3',
      brand: '罗氏Roche',
      supplier: '迪安诊断技术集团股份有限公司',
      managementOrg: '迪安诊断技术集团',
      procurementMode: '集中采购',
      agreementPrice: 222.00,
      taxRate: 13.0,
      diffRate: 13.00
    },
    {
      productCode: '11000005',
      productName: '三碘甲状腺原氨酸测定试剂 T3',
      brand: '罗氏Roche',
      supplier: '罗氏Roche Diagnostics',
      managementOrg: '迪安诊断技术集团',
      procurementMode: '自行采购',
      agreementPrice: 227.43,
      taxRate: 13.0,
      diffRate: 0
    },
    {
      productCode: '11000006',
      productName: '癌胚抗原测定试剂 CEA CalSet',
      brand: '罗氏Roche',
      supplier: '罗氏Roche Diagnostics',
      managementOrg: '迪安诊断技术集团',
      procurementMode: '集中采购',
      agreementPrice: 98.23,
      taxRate: 13.0,
      diffRate: 0
    },
    {
      productCode: '11000006',
      productName: '癌胚抗原测定试剂 CEA CalSet',
      brand: '罗氏Roche',
      supplier: '迪安诊断技术集团股份有限公司',
      managementOrg: '迪安诊断技术集团',
      procurementMode: '集中采购',
      agreementPrice: 111.00,
      taxRate: 13.0,
      diffRate: 13.00
    },
    {
      productCode: '11000008',
      productName: '糖类抗原19-9(检测试剂) CA19-9',
      brand: '罗氏Roche',
      supplier: '罗氏Roche Diagnostics',
      managementOrg: '迪安诊断技术集团',
      procurementMode: '自行采购',
      agreementPrice: 149.56,
      taxRate: 13.0,
      diffRate: 0
    },
    {
      productCode: '11000012',
      productName: '非小细胞肺癌相关抗原21-1',
      brand: '罗氏Roche',
      supplier: '罗氏Roche Diagnostics',
      managementOrg: '迪安诊断技术集团',
      procurementMode: '集中采购',
      agreementPrice: 182.30,
      taxRate: 13.0,
      diffRate: 0
    },
    {
      productCode: '11000012',
      productName: '非小细胞肺癌相关抗原21-1',
      brand: '罗氏Roche',
      supplier: '迪安诊断技术集团股份有限公司',
      managementOrg: '迪安诊断技术集团',
      procurementMode: '集中采购',
      agreementPrice: 456.00,
      taxRate: 13.0,
      diffRate: 150.1
    }
  ];

  // S2 配置
  const s2DataConfig = {
    fields: {
      rows: ['productCode', 'productName', 'brand'],
      columns: ['supplier'],
      values: ['managementOrg', 'procurementMode', 'agreementPrice', 'diffRate'],
      valueInCols: true
    },
    meta: [
      {
        field: 'productCode',
        name: '产品编号'
      },
      {
        field: 'productName',
        name: '产品名称'
      },
      {
        field: 'brand',
        name: '品牌'
      },
      {
        field: 'supplier',
        name: '供应商'
      },
      {
        field: 'managementOrg',
        name: '管理组织'
      },
      {
        field: 'procurementMode',
        name: '采购模式'
      },
      {
        field: 'agreementPrice',
        name: '协议单价',
        formatter: (value: any) => `¥${value?.toFixed(2) || '-'}`
      },
      {
        field: 'diffRate',
        name: '差异率',
        formatter: (value: any) => {
          if (value === null || value === undefined || value === 0) return '-';
          return value > 0 ? `+${value.toFixed(2)}%` : `${value.toFixed(2)}%`;
        }
      },
      {
        field: 'taxRate',
        name: '税率',
        formatter: (value: any) => `${value}%`
      }
    ],
    data: mockData
  };

  const s2Options = {
    width: 1200,
    height: 600,
    interaction: {
      selectedCellsSpotlight: true,
      hoverHighlight: true
    },
    style: {
      layoutWidthType: 'adaptive' as const,
      cellCfg: {
        height: 40
      }
    },
    conditions: {
      text: [
        {
          field: 'diffRate',
          mapping: (value: any) => {
            if (value > 50) {
              return {
                fill: '#ff4d4f'
              };
            }
            if (value > 0) {
              return {
                fill: '#faad14'
              };
            }
            return {
              fill: '#52c41a'
            };
          }
        }
      ]
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* 报表头部区 */}
      <Card title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3} style={{ margin: 0 }}>
            同产品采购协议价比较分析 (方案: PLAN_20250806_MED001)
          </Title>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button icon={<Star size={16} />} size="small">
              收藏
            </Button>
            <Button icon={<Download size={16} />} size="small">
              导出
            </Button>
            <Button icon={<RotateCcw size={16} />} size="small">
              重置
            </Button>
          </div>
        </div>
      }>
        <div style={{ marginBottom: '24px' }}>
          {/* 分析对象设置 */}
          <div style={{ marginBottom: '24px' }}>
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                cursor: 'pointer',
                marginBottom: '16px'
              }}
              onClick={() => setAnalysisExpanded(!analysisExpanded)}
            >
              <div style={{ width: '4px', height: '20px', backgroundColor: '#1890ff', marginRight: '8px' }}></div>
              <Title level={4} style={{ margin: 0, marginRight: '8px' }}>分析对象设置:</Title>
              {analysisExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
            
            {analysisExpanded && (
            <div>
            
            {/* 分析指标 */}
            <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold', marginRight: '12px', minWidth: '80px' }}>分析指标：</span>
              <Checkbox.Group 
                value={analysisIndicators} 
                onChange={setAnalysisIndicators}
                style={{ display: 'flex', gap: '16px' }}
              >
                {indicatorOptions.map(option => (
                  <Checkbox key={option.value} value={option.value}>
                    {option.label}
                  </Checkbox>
                ))}
              </Checkbox.Group>
            </div>

            {/* 分析对象 */}
            <div style={{ marginBottom: '12px' }}>
              <span style={{ fontWeight: 'bold', marginRight: '12px' }}>分析对象：</span>
              <Select 
                value={analysisObject} 
                onChange={setAnalysisObject} 
                style={{ width: 160 }}
              >
                {analysisObjectOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </div>

            {/* 分析维度 */}
            <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold', marginRight: '12px', minWidth: '80px' }}>分析维度：</span>
              <Checkbox.Group 
                value={analysisDimensions} 
                onChange={setAnalysisDimensions}
                style={{ display: 'flex', gap: '16px' }}
              >
                {dimensionOptions.map(option => (
                  <Checkbox key={option.value} value={option.value}>
                    {option.label}
                  </Checkbox>
                ))}
              </Checkbox.Group>
            </div>

            {/* 筛选范围 */}
            <div style={{ marginBottom: '12px' }}>
              <span style={{ fontWeight: 'bold', marginRight: '12px' }}>筛选范围：</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ minWidth: '80px', textAlign: 'right' }}>管理组织：</span>
                  <Button 
                    onClick={() => handleModalOpen('managementOrg', '选择管理组织')}
                    style={{ width: 220, textAlign: 'left' }}
                  >
                    {formatButtonText(filterConditions.managementOrg, 'managementOrg', '请选择管理组织')}
                  </Button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ minWidth: '80px', textAlign: 'right' }}>采购模式：</span>
                  <Select mode="multiple" placeholder="请选择采购模式" style={{ width: 220 }}>
                    <Option value="centralized">集中采购</Option>
                    <Option value="independent">自行采购</Option>
                    <Option value="delegated">委托采购</Option>
                  </Select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ minWidth: '80px', textAlign: 'right' }}>供应商：</span>
                  <Button 
                    onClick={() => handleModalOpen('supplier', '选择供应商')}
                    style={{ width: 220, textAlign: 'left' }}
                  >
                    {formatButtonText(filterConditions.supplier, 'supplier', '请选择供应商')}
                  </Button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ minWidth: '80px', textAlign: 'right' }}>产品：</span>
                  <Button 
                    onClick={() => handleModalOpen('product', '选择产品')}
                    style={{ width: 220, textAlign: 'left' }}
                  >
                    {formatButtonText(filterConditions.product, 'product', '请选择产品')}
                  </Button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ minWidth: '80px', textAlign: 'right' }}>品牌：</span>
                  <Button 
                    onClick={() => handleModalOpen('brand', '选择品牌')}
                    style={{ width: 220, textAlign: 'left' }}
                  >
                    {formatButtonText(filterConditions.brand, 'brand', '请选择品牌')}
                  </Button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ minWidth: '80px', textAlign: 'right' }}>存货分类：</span>
                  <Button 
                    onClick={() => handleModalOpen('inventoryCategory', '选择存货分类')}
                    style={{ width: 220, textAlign: 'left' }}
                  >
                    {formatButtonText(filterConditions.inventoryCategory, 'inventoryCategory', '请选择存货分类')}
                  </Button>
                </div>
              </div>
            </div>
            </div>
            )}
          </div>

          {/* 基准选择 */}
          <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                cursor: 'pointer',
                marginBottom: '16px'
              }}
              onClick={() => setBaselineExpanded(!baselineExpanded)}
            >
              <div style={{ width: '4px', height: '20px', backgroundColor: '#1890ff', marginRight: '8px' }}></div>
              <Title level={4} style={{ margin: 0, marginRight: '8px' }}>基准选择:</Title>
              {baselineExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
            
            {baselineExpanded && (
            <div>
            
            {/* 基准指标 */}
            <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold', marginRight: '12px', minWidth: '80px' }}>基准指标：</span>
              <Checkbox.Group 
                value={[baselineIndicator]} 
                onChange={(values) => setBaselineIndicator(values[values.length - 1] || 'lowest')}
                style={{ display: 'flex', gap: '16px' }}
              >
                {baselineIndicatorOptions.map(option => (
                  <Checkbox key={option.value} value={option.value}>
                    {option.label}
                  </Checkbox>
                ))}
              </Checkbox.Group>
            </div>

            {/* 基准维度 */}
            <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold', marginRight: '12px', minWidth: '80px' }}>基准维度：</span>
              <Checkbox.Group 
                value={baselineDimensions} 
                onChange={setBaselineDimensions}
                style={{ display: 'flex', gap: '16px' }}
              >
                {baselineDimensionOptions.map(option => (
                  <Checkbox key={option.value} value={option.value}>
                    {option.label}
                  </Checkbox>
                ))}
              </Checkbox.Group>
            </div>

            {/* 基准范围 */}
            <div style={{ marginBottom: '12px' }}>
              <span style={{ fontWeight: 'bold', marginRight: '12px' }}>基准范围：</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ minWidth: '80px', textAlign: 'right' }}>管理组织：</span>
                  <Button 
                    onClick={() => handleModalOpen('baselineManagementOrg', '选择管理组织')}
                    style={{ width: 220, textAlign: 'left' }}
                  >
                    {formatButtonText(baselineConditions.managementOrg, 'managementOrg', '请选择管理组织')}
                  </Button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ minWidth: '80px', textAlign: 'right' }}>采购模式：</span>
                  <Select mode="multiple" placeholder="请选择采购模式" style={{ width: 220 }}>
                    <Option value="centralized">集中采购</Option>
                    <Option value="independent">自行采购</Option>
                    <Option value="delegated">委托采购</Option>
                  </Select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ minWidth: '80px', textAlign: 'right' }}>供应商：</span>
                  <Button 
                    onClick={() => handleModalOpen('baselineSupplier', '选择供应商')}
                    style={{ width: 220, textAlign: 'left' }}
                  >
                    {formatButtonText(baselineConditions.supplier, 'supplier', '请选择供应商')}
                  </Button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ minWidth: '80px', textAlign: 'right' }}>产品：</span>
                  <Button 
                    onClick={() => handleModalOpen('baselineProduct', '选择产品')}
                    style={{ width: 220, textAlign: 'left' }}
                  >
                    {formatButtonText(baselineConditions.product, 'product', '请选择产品')}
                  </Button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ minWidth: '80px', textAlign: 'right' }}>品牌：</span>
                  <Button 
                    onClick={() => handleModalOpen('baselineBrand', '选择品牌')}
                    style={{ width: 220, textAlign: 'left' }}
                  >
                    {formatButtonText(baselineConditions.brand, 'brand', '请选择品牌')}
                  </Button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ minWidth: '80px', textAlign: 'right' }}>存货分类：</span>
                  <Button 
                    onClick={() => handleModalOpen('baselineInventoryCategory', '选择存货分类')}
                    style={{ width: 220, textAlign: 'left' }}
                  >
                    {formatButtonText(baselineConditions.inventoryCategory, 'inventoryCategory', '请选择存货分类')}
                  </Button>
                </div>
              </div>
            </div>
            </div>
            )}
          </div>
        </div>
      </Card>

      {/* 报表主体区 */}
      <Card title="同产品采购协议价比较分析">
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <SheetComponent
            dataCfg={s2DataConfig}
            options={s2Options}
            sheetType="pivot"
          />
        </div>
      </Card>

      {/* 数据说明 */}
      <Card>
        <div style={{ padding: '16px' }}>
          <div style={{ fontSize: '14px', color: '#666', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <span style={{ fontWeight: 'bold' }}>基准对象:</span>
              <span>罗氏Roche Diagnostics (所有差异率以此为准)</span>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <span style={{ fontWeight: 'bold' }}>分析对象:</span>
              <span>迪安诊断技术集团股份有限公司</span>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <span style={{ fontWeight: 'bold' }}>颜色说明:</span>
              <span style={{ color: '#52c41a' }}>绿色: 基准价格</span>
              <span style={{ color: '#faad14' }}>黄色: 轻微差异 (0-50%)</span>
              <span style={{ color: '#ff4d4f' }}>红色: 显著差异 (&gt;50%)</span>
            </div>
          </div>
        </div>
      </Card>

        {/* 弹框组件 */}
        <Modal
          title={modalTitle}
          open={modalVisible}
          onOk={handleModalConfirm}
          onCancel={handleModalClose}
          width={modalType.includes('product') ? 1000 : 600}
        >
          <Table
            rowSelection={{
               type: 'checkbox',
               selectedRowKeys: selectedValues,
               onChange: (selectedRowKeys) => setSelectedValues(selectedRowKeys as string[]),
             }}
            dataSource={getModalOptions(modalType.replace('baseline', ''))}
            rowKey="value"
            pagination={false}
            size="small"
            columns={[
              {
                title: '编码',
                dataIndex: 'code',
                key: 'code',
                width: 120,
              },
              {
                title: '名称',
                dataIndex: 'name',
                key: 'name',
                ellipsis: true,
              },
              ...(modalType.includes('product') ? [
                 {
                   title: '品牌',
                   dataIndex: 'brand',
                   key: 'brand',
                   width: 100,
                 },
                 {
                   title: '注册证号',
                   dataIndex: 'registrationNo',
                   key: 'registrationNo',
                   width: 140,
                 },
                 {
                   title: '规格',
                   dataIndex: 'specification',
                   key: 'specification',
                   width: 100,
                 },
                 {
                   title: '型号',
                   dataIndex: 'model',
                   key: 'model',
                   width: 100,
                 },
                 {
                   title: '货号',
                   dataIndex: 'itemNo',
                   key: 'itemNo',
                   width: 120,
                 }
               ] : [])
            ]}
          />
        </Modal>

    </div>
  );
};

export default ReportCenter;