import React, { useMemo, useState, useEffect } from 'react';
import {
  Card,
  Button,
  Form,
  Input,
  Select,
  Space,
  message,
  Row,
  Col,
  Typography,
  DatePicker,
  Divider,
  Tag,
  Tooltip,
  Alert,
  Steps,
  Modal,
  Table,
  Collapse,
  Switch,
  InputNumber,
  Radio,
  Dropdown,
  Badge
} from 'antd';
import {
  PlusOutlined,
  SaveOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  SettingOutlined,
  DeleteOutlined,
  EditOutlined,
  CheckCircleFilled,
  InboxOutlined,
  DatabaseOutlined,
  LockOutlined,
  SelectOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import CustomIndicatorDialog from '../components/CustomIndicatorDialog';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;

/**
 * 比价方案新版管理组件
 * 提供比对对象、基准对象、分析指标三模块的配置界面
 */
const PriceSchemeManagementV2: React.FC = () => {
  const [form] = Form.useForm();

  // 权限管理状态
  const [manageOrg, setManageOrg] = useState<string>(''); // 管理组织
  const [manageOrgModalVisible, setManageOrgModalVisible] = useState(false); // 管理组织选择弹窗
  const [applyOrgModalVisible, setApplyOrgModalVisible] = useState(false); // 使用组织选择弹窗
  const [applyOrgDraft, setApplyOrgDraft] = useState<string[]>([]);

  const mockOrganizations = [
    {
      title: '集团总部',
      value: 'org_group',
      key: 'org_group',
      code: 'ORG-GROUP',
      category: '集团',
      children: [
        { title: '子公司A', value: 'org_subsidiary_a', key: 'org_subsidiary_a', code: 'ORG-A', category: '子公司' },
        { title: '子公司B', value: 'org_subsidiary_b', key: 'org_subsidiary_b', code: 'ORG-B', category: '子公司' }
      ]
    },
    {
      title: '区域分公司',
      value: 'org_branch',
      key: 'org_branch',
      code: 'ORG-BR',
      category: '分公司',
      children: [
        { title: '华东分公司', value: 'org_branch_east', key: 'org_branch_east', code: 'ORG-BR-E', category: '分公司' },
        { title: '华南分公司', value: 'org_branch_south', key: 'org_branch_south', code: 'ORG-BR-S', category: '分公司' }
      ]
    }
  ];

  // 辅助函数：递归查找组织
  const findOrganizationById = (organizations: any[], id: string): any => {
    for (const org of organizations) {
      if (org.value === id) {
        return org;
      }
      if (org.children) {
        const found = findOrganizationById(org.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // 辅助函数：获取组织名称
  const getOrganizationTitle = (orgId: string): string => {
    const org = findOrganizationById(mockOrganizations, orgId);
    return org ? org.title : orgId;
  };

  const flattenOrganizations = (orgs: any[], level = 0, parentChain: string[] = []): Array<{
    value: string;
    title: string;
    code?: string;
    category?: string;
    level: number;
    fullPath: string;
  }> => {
    const result: Array<{ value: string; title: string; code?: string; category?: string; level: number; fullPath: string }> = [];
    const walk = (items: any[], currentLevel: number, chain: string[]) => {
      items.forEach((it) => {
        const nextChain = [...chain, it.title];
        result.push({
          value: it.value,
          title: it.title,
          code: it.code,
          category: it.category,
          level: currentLevel,
          fullPath: nextChain.join(' / ')
        });
        if (Array.isArray(it.children) && it.children.length > 0) {
          walk(it.children, currentLevel + 1, nextChain);
        }
      });
    };
    walk(orgs, level, parentChain);
    return result;
  };

  const flatOrgOptions = useMemo(
    () => flattenOrganizations(mockOrganizations),
    []
  );

  const [manageOrgSearch, setManageOrgSearch] = useState('');
  const [manageOrgCategory, setManageOrgCategory] = useState<string | undefined>(undefined);
  const [applyOrgSearch, setApplyOrgSearch] = useState('');
  const [applyOrgCategory, setApplyOrgCategory] = useState<string | undefined>(undefined);

  const manageOrgData = useMemo(() => {
    return flatOrgOptions.filter(org => {
      const matchKeyword = manageOrgSearch
        ? org.title.includes(manageOrgSearch) || (org.code || '').includes(manageOrgSearch)
        : true;
      const matchCategory = manageOrgCategory ? org.category === manageOrgCategory : true;
      return matchKeyword && matchCategory;
    });
  }, [flatOrgOptions, manageOrgSearch, manageOrgCategory]);

  const applyOrgData = useMemo(() => {
    return flatOrgOptions.filter(org => {
      const matchKeyword = applyOrgSearch
        ? org.title.includes(applyOrgSearch) || (org.code || '').includes(applyOrgSearch)
        : true;
      const matchCategory = applyOrgCategory ? org.category === applyOrgCategory : true;
      return matchKeyword && matchCategory;
    });
  }, [flatOrgOptions, applyOrgSearch, applyOrgCategory]);

  const organizationCategories = useMemo(() => {
    const set = new Set<string>();
    flatOrgOptions.forEach((org) => {
      if (org.category) set.add(String(org.category));
    });
    return Array.from(set);
  }, [flatOrgOptions]);

  const organizationColumns = useMemo(
    () => [
      {
        title: '组织编码',
        dataIndex: 'code',
        key: 'code',
        width: 160,
        render: (v: string) => v || '-'
      },
      {
        title: '组织名称',
        dataIndex: 'title',
        key: 'title',
        width: 260,
        render: (_: any, record: any) => record.title
      },
      {
        title: '组织类型',
        dataIndex: 'category',
        key: 'category',
        width: 120,
        render: (v: string) => v || '-'
      },
      {
        title: '路径',
        dataIndex: 'fullPath',
        key: 'fullPath',
        render: (v: string) => v || '-'
      }
    ],
    []
  );

  const manageOrgRowSelection = useMemo(
    () => ({
      type: 'radio' as const,
      selectedRowKeys: manageOrg ? [manageOrg] : [],
      onChange: (selectedRowKeys: React.Key[]) => {
        const next = selectedRowKeys?.[0];
        if (typeof next === 'string') setManageOrg(next);
      }
    }),
    [manageOrg]
  );

  const applyOrgRowSelection = useMemo(
    () => ({
      type: 'checkbox' as const,
      selectedRowKeys: applyOrgDraft,
      onChange: (selectedRowKeys: React.Key[]) => {
        setApplyOrgDraft((selectedRowKeys || []).filter((k): k is string => typeof k === 'string'));
      }
    }),
    [applyOrgDraft]
  );

  const applyOrgsValue = Form.useWatch('applyOrgs', form);
  const applyOrgSummary = useMemo(() => {
    const arr = Array.isArray(applyOrgsValue) ? applyOrgsValue : [];
    if (arr.length === 0) return '';
    return arr.map((id: string) => getOrganizationTitle(id)).join('、');
  }, [applyOrgsValue]);

  // 渲染管理组织选项的组件
  const RenderOrganizationOptions: React.FC<{
    organization: any;
    level: number;
    selectedValue: string;
    onChange: (value: string) => void;
  }> = ({ organization, level, selectedValue, onChange }) => {
    const paddingLeft = level * 24;

    return (
      <div style={{ paddingLeft }}>
        <Radio
          value={organization.value}
          checked={selectedValue === organization.value}
          onChange={(e) => onChange(e.target.value)}
          style={{ marginBottom: '4px' }}
        >
          <span style={{ fontWeight: level === 0 ? 500 : 'normal' }}>
            {organization.title}
          </span>
        </Radio>

        {organization.children && organization.children.map((child: any) => (
          <RenderOrganizationOptions
            key={child.value}
            organization={child}
            level={level + 1}
            selectedValue={selectedValue}
            onChange={onChange}
          />
        ))}
      </div>
    );
  };

  // 版本管理相关函数
  const handleComparisonModelChange = (modelId: string) => {
    const selectedModel = mockComparisonObjects.find(model => model.id === modelId);
    if (selectedModel) {
      // 设置表单值
      form.setFieldsValue({ comparisonModel: modelId });

      // 设置当前选择的模型信息
      setSelectedComparisonModel({
        ...selectedModel,
        isLatest: true
      });
    }
  };

  const checkForNewVersion = (currentModel: any) => {
    // 模拟检查最新版本的逻辑
    // 在实际应用中，这里会调用API检查最新版本
    const latestVersions: Record<string, string> = {
      'supplier': 'V3',
      'product': 'V2',
      'category': 'V2',
      'brand': 'V1'
    };

    // 模拟当前方案可能使用的是旧版本
    // 这里我们可以模拟一些情况来测试红点提示功能
    const simulatedCurrentVersions: Record<string, string> = {
      'supplier': 'V2', // 当前使用V2，最新是V3
      'product': 'V2',  // 当前使用V2，最新也是V2
      'category': 'V1', // 当前使用V1，最新是V2
      'brand': 'V1'     // 当前使用V1，最新也是V1
    };

    const modelId = currentModel.modelId || currentModel.id;
    const currentVersion = simulatedCurrentVersions[modelId] || currentModel.version;
    const latestVersion = latestVersions[modelId];

    if (latestVersion && latestVersion !== currentVersion) {
      setLatestVersionInfo({
        id: currentModel.id,
        name: currentModel.name,
        currentVersion: currentVersion,
        latestVersion: latestVersion
      });

      // 更新当前选择的模型版本为旧版本（模拟已使用的方案）
      setSelectedComparisonModel({
        ...currentModel,
        version: currentVersion,
        isLatest: false
      });

      // 强制重新渲染Select组件以显示更新的版本信息
      setSelectKey(prev => prev + 1);

      // 显示版本更新提示
      setShowVersionUpdateModal(true);
    } else {
      // 没有新版本时，设置为最新版本
      setSelectedComparisonModel({
        ...currentModel,
        version: latestVersion,
        isLatest: true
      });

      // 强制重新渲染Select组件
      setSelectKey(prev => prev + 1);
    }
  };

  const handleUpdateToLatestVersion = () => {
    if (latestVersionInfo) {
      const updatedModel = {
        ...selectedComparisonModel!,
        version: latestVersionInfo.latestVersion,
        isLatest: true
      };
      setSelectedComparisonModel(updatedModel);
      form.setFieldsValue({ comparisonModel: updatedModel.id });
      setShowVersionUpdateModal(false);
      setLatestVersionInfo(null);

      // 强制重新渲染Select组件
      setSelectKey(prev => prev + 1);

      message.success(`已更新到最新版本 ${latestVersionInfo.latestVersion}`);
    }
  };

  // ...
  const [loading, setLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [activeKey, setActiveKey] = useState(['1', '2', '3']); // 默认展开所有面板
  const [basicInfoExpanded, setBasicInfoExpanded] = useState(true); // 基本信息模块展开状态
  const [indicatorModalVisible, setIndicatorModalVisible] = useState(false); // 选择指标弹框状态
  const [customIndicatorModalVisible, setCustomIndicatorModalVisible] = useState(false); // 自定义指标弹框状态
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([]); // 已选择的指标
  // 旧版比对查询范围弹框已移除，改为顶部下拉添加条件
  const [comparisonRanges, setComparisonRanges] = useState<Array<{
    id: string;
    field: string;
    condition: string;
    values: string[];
  }>>([]); // 比对范围条件列表
  
  // 步骤条状态
  const [currentStep, setCurrentStep] = useState(0); // 当前步骤，0为比价配置，1为报表配置
  
  // 比价数据集字段状态
  const [comparisonDatasetFields, setComparisonDatasetFields] = useState<Array<{
    field: string;
    name: string;
    type: string;
    value: string;
  }>>([]);
  
  // 拖拽相关状态
  const [draggedField, setDraggedField] = useState<{
    field: string;
    name: string;
    type: string;
  } | null>(null);
  
  const [droppedFields, setDroppedFields] = useState<Array<{
    id: string;
    field: string;
    name: string;
    type: string;
    operator: string;
    value: string;
    value2?: string;
    isRange: boolean;
  }>>([]);
  
  // 比对维度弹框状态
  const [dimensionModalVisible, setDimensionModalVisible] = useState(false);
  const [showAddBenchmarkObjectModal, setShowAddBenchmarkObjectModal] = useState(false); // 添加基准对象弹窗状态
  const [newBenchmarkObject, setNewBenchmarkObject] = useState<{
    objectName: string;
    datasetId: string;
  }>({ objectName: '', datasetId: '' }); // 新基准对象数据
  const [newBenchmarkObjectDesc, setNewBenchmarkObjectDesc] = useState<string>('');
  const [selectedDimensions, setSelectedDimensions] = useState<Array<{
    field: string;
    name: string;
    type: string;
    attribute: string;
  }>>([]);
  
  // 状态管理
  const [comparisonConfig, setComparisonConfig] = useState({
    object: '',
    indicator: '',
    queryScope: {}
  });

  // 版本管理状态
  const [selectedComparisonModel, setSelectedComparisonModel] = useState<{
    id: string;
    name: string;
    version: string;
    isLatest: boolean;
  } | null>(null); // 当前选择的比对模型及版本

  const [latestVersionInfo, setLatestVersionInfo] = useState<{
    id: string;
    name: string;
    currentVersion: string;
    latestVersion: string;
  } | null>(null);
  const [showVersionUpdateModal, setShowVersionUpdateModal] = useState(false);
  const [selectKey, setSelectKey] = useState<number>(0);
  
  const [baselineConfig, setBaselineConfig] = useState({
    dataset: '',
    indicator: '',
    queryScope: {}
  });
  
  const [analysisMetrics, setAnalysisMetrics] = useState<Array<{
    id: string;
    name: string;
    expression: string;
    unit: string;
    description: string;
  }>>([]);

  // 查询条件元数据与辅助方法（名称选择即可，控件类型用于默认值控件与栅格占位）
  const availableQueryConditions: Array<{
    id: string;
    name: string;
    inputType: 'text' | 'select' | 'numberRange' | 'dateRange';
    gridSpan?: number;
    options?: string[];
  }> = [
    { id: 'org', name: '管理组织', inputType: 'select', gridSpan: 1, options: ['集团组织', '事业部A', '子公司B'] },
    { id: 'vendor', name: '供应商', inputType: 'select', gridSpan: 1, options: ['供应商A', '供应商B', '供应商C'] },
    { id: 'category', name: '品类', inputType: 'select', gridSpan: 1, options: ['品类X', '品类Y', '品类Z'] },
    { id: 'productName', name: '产品名称', inputType: 'text', gridSpan: 1 },
    { id: 'priceRange', name: '价格范围', inputType: 'numberRange', gridSpan: 2 },
    { id: 'timeRange', name: '时间范围', inputType: 'dateRange', gridSpan: 2 },
  ];

  const getConditionMeta = (id: string) => availableQueryConditions.find(c => c.id === id);

  const handleAddCondition = (value: string) => {
    const exists = comparisonRanges.some(r => r.id === value);
    if (exists) {
      message.info('该条件已存在');
      return;
    }
    const meta = getConditionMeta(value);
    const newItem = {
      id: value,
      field: meta?.name || value,
      condition: '',
      values: [] as string[],
    };
    setComparisonRanges(prev => [...prev, newItem]);
    message.success(`已添加查询条件：${newItem.field}`);
  };

  const handleAddBaselineCondition = (value: string) => {
    const exists = baselineRanges.some(r => r.id === value);
    if (exists) {
      message.info('该条件已存在');
      return;
    }
    const meta = getConditionMeta(value);
    const newItem = {
      id: value,
      field: meta?.name || value,
      condition: '',
      values: '',
    };
    setBaselineRanges(prev => [...prev, newItem]);
    message.success(`已添加基准查询条件：${newItem.field}`);
  };
  const getGridSpan = (id: string) => {
    const meta = getConditionMeta(id);
    if (!meta) return 1;
    if (typeof meta.gridSpan === 'number') return meta.gridSpan;
    switch (meta.inputType) {
      case 'numberRange':
      case 'dateRange':
        return 2;
      default:
        return 1;
    }
  };

      const renderDefaultControl = (range: { id: string; field: string; condition: string; values: string[] }) => {
        const meta = getConditionMeta(range.id);
        if (!meta) {
          return (
            <Input 
              size="small" 
              style={{ width: '100%' }}
              value={range.values[0] || ''} 
              onChange={(e) => {
                const v = e.target.value;
                setComparisonRanges(prev => prev.map(r => r.id === range.id ? { ...r, values: [String(v)] } : r));
              }} 
              placeholder="请输入默认值" 
            />
          );
        }
        switch (meta.inputType) {
          case 'text':
            return (
              <Input 
                size="small" 
                style={{ width: '100%' }}
                value={range.values[0] || ''} 
                onChange={(e) => {
                  const v = e.target.value;
                  setComparisonRanges(prev => prev.map(r => r.id === range.id ? { ...r, values: [String(v)] } : r));
                }} 
                placeholder={`设置${meta.name}默认值`} 
              />
            );
      case 'select':
        return (
          <Select 
            size="small" 
            style={{ width: '100%' }}
            placeholder={`选择${meta.name}默认值`}
            value={range.values[0] || undefined}
            onChange={(val: string) => {
              setComparisonRanges(prev => prev.map(r => r.id === range.id ? { ...r, values: [String(val)] } : r));
            }}
          >
            {(meta.options || []).map(opt => (
              <Option key={opt} value={opt}>{opt}</Option>
            ))}
          </Select>
        );
      case 'numberRange':
        return (
          <Space size={4}>
            <InputNumber 
              size="small" 
              style={{ width: 100 }}
              value={range.values[0] !== undefined && range.values[0] !== '' ? Number(range.values[0]) : undefined}
              onChange={(val) => {
                const v = val === null ? '' : String(val);
                setComparisonRanges(prev => prev.map(r => r.id === range.id ? { ...r, values: [v, r.values[1] || ''] } : r));
              }}
              placeholder="最小值"
            />
            <span style={{ color: '#999' }}>至</span>
            <InputNumber 
              size="small" 
              style={{ width: 100 }}
              value={range.values[1] !== undefined && range.values[1] !== '' ? Number(range.values[1]) : undefined}
              onChange={(val) => {
                const v = val === null ? '' : String(val);
                setComparisonRanges(prev => prev.map(r => r.id === range.id ? { ...r, values: [r.values[0] || '', v] } : r));
              }}
              placeholder="最大值"
            />
          </Space>
        );
      case 'dateRange':
        return (
          <RangePicker 
            size="small" 
            style={{ width: '100%' }}
            value={
              range.values[0] && range.values[1]
                ? [dayjs(range.values[0]), dayjs(range.values[1])]
                : undefined
            }
            onChange={(dates) => {
              const start = dates?.[0] ?? null;
              const end = dates?.[1] ?? null;
              if (!start || !end) {
                setComparisonRanges(prev => prev.map(r => r.id === range.id ? { ...r, values: [] } : r));
                return;
              }
              setComparisonRanges(prev => prev.map(r => r.id === range.id ? { ...r, values: [start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')] } : r));
            }}
          />
        );
      default:
        return (
          <Input 
            size="small" 
            value={range.values[0] || ''} 
            onChange={(e) => {
              const v = e.target.value;
              setComparisonRanges(prev => prev.map(r => r.id === range.id ? { ...r, values: [String(v)] } : r));
            }} 
            placeholder={`设置${meta.name}默认值`} 
          />
        );
    }
  };

  const renderDefaultControlForBaseline = (range: { id: string; field: string; condition: string; values: string }) => {
    const meta = getConditionMeta(range.id);
    if (!meta) {
      return (
        <Input
          size="small"
          style={{ width: '100%' }}
          value={range.values || ''}
          onChange={(e) => {
            const v = e.target.value;
            setBaselineRanges(prev => prev.map(r => r.id === range.id ? { ...r, values: String(v) } : r));
          }}
          placeholder="请输入默认值"
        />
      );
    }
    switch (meta.inputType) {
      case 'text':
        return (
          <Input
            size="small"
            style={{ width: '100%' }}
            value={range.values || ''}
            onChange={(e) => {
              const v = e.target.value;
              setBaselineRanges(prev => prev.map(r => r.id === range.id ? { ...r, values: String(v) } : r));
            }}
            placeholder={`设置${meta.name}默认值`}
          />
        );
      case 'select':
        return (
          <Select
            size="small"
            style={{ width: '100%' }}
            placeholder={`选择${meta.name}默认值`}
            value={range.values || undefined}
            onChange={(val: string) => {
              setBaselineRanges(prev => prev.map(r => r.id === range.id ? { ...r, values: String(val) } : r));
            }}
          >
            {(meta.options || []).map(opt => (
              <Option key={opt} value={opt}>{opt}</Option>
            ))}
          </Select>
        );
      case 'numberRange':
        const values = range.values ? range.values.split(',') : ['', ''];
        return (
          <Space size={4}>
            <InputNumber
              size="small"
              style={{ width: 100 }}
              value={values[0] !== '' ? Number(values[0]) : undefined}
              onChange={(val) => {
                const v = val === null ? '' : String(val);
                setBaselineRanges(prev => prev.map(r => r.id === range.id ? { ...r, values: `${v},${values[1] || ''}` } : r));
              }}
              placeholder="最小值"
            />
            <span style={{ color: '#999' }}>至</span>
            <InputNumber
              size="small"
              style={{ width: 100 }}
              value={values[1] !== '' ? Number(values[1]) : undefined}
              onChange={(val) => {
                const v = val === null ? '' : String(val);
                setBaselineRanges(prev => prev.map(r => r.id === range.id ? { ...r, values: `${values[0] || ''},${v}` } : r));
              }}
              placeholder="最大值"
            />
          </Space>
        );
      case 'dateRange':
        const dateValues = range.values ? range.values.split(',') : ['', ''];
        return (
          <RangePicker
            size="small"
            style={{ width: '100%' }}
            value={
              dateValues[0] && dateValues[1]
                ? [dayjs(dateValues[0]), dayjs(dateValues[1])]
                : undefined
            }
            onChange={(dates) => {
              const start = dates?.[0] ?? null;
              const end = dates?.[1] ?? null;
              if (!start || !end) {
                setBaselineRanges(prev => prev.map(r => r.id === range.id ? { ...r, values: '' } : r));
                return;
              }
              setBaselineRanges(prev => prev.map(r => r.id === range.id ? { ...r, values: `${start.format('YYYY-MM-DD')},${end.format('YYYY-MM-DD')}` } : r));
            }}
          />
        );
      default:
        return (
          <Input
            size="small"
            value={range.values || ''}
            onChange={(e) => {
              const v = e.target.value;
              setBaselineRanges(prev => prev.map(r => r.id === range.id ? { ...r, values: String(v) } : r));
            }}
            placeholder={`设置${meta.name}默认值`}
          />
        );
    }
  };

  // 分析主题状态
  const [analysisSubjects, setAnalysisSubjects] = useState<string[]>([]);

  // 比对对象（原型：仅用于对象信息/描述展示）
  const [comparisonObject, setComparisonObject] = useState<{
    datasetId: string;
    objectName: string;
    objectDescription: string;
  }>({
    datasetId: 'ds_agreement',
    objectName: '比对对象-采购协议',
    objectDescription: ''
  });

  // 基准对象相关状态
  const [datasetModalVisible, setDatasetModalVisible] = useState(false); // 数据集选择弹框状态
  const [selectedBaselineDatasets, setSelectedBaselineDatasets] = useState<Array<{
    id: string;
    name: string;
    description: string;
    recordCount: number;
    objectName?: string; // 添加基准对象名称字段
    objectDescription?: string; // 方案内对象描述
  }>>([]);
  const [selectedBaselineDataset, setSelectedBaselineDataset] = useState<{
    id: string;
    name: string;
    description: string;
    recordCount: number;
    objectName?: string; // 添加基准对象名称字段
    objectDescription?: string;
  } | null>(null);
  const [baselineRangeModalVisible, setBaselineRangeModalVisible] = useState(false);
  const [baselineRanges, setBaselineRanges] = useState<Array<{
    id: string;
    field: string;
    condition: string;
    values: string;
  }>>([]);
  const [baselineMetricsModalVisible, setBaselineMetricsModalVisible] = useState(false);
  const [customBaselineIndicatorModalVisible, setCustomBaselineIndicatorModalVisible] = useState(false); // 基准指标自定义指标弹窗状态
  const [selectedBaselineMetrics, setSelectedBaselineMetrics] = useState<Array<{
    id: string;
    name: string;
    unit: string;
  }>>([]);
  
  // 自定义指标存储状态
  const [customIndicators, setCustomIndicators] = useState<Array<{
    id: string;
    name: string;
    code: string;
    description: string;
    expression: string;
  }>>([]);
  
  // 计算指标相关状态
  const [calculatedIndicatorModalVisible, setCalculatedIndicatorModalVisible] = useState(false);
  const [calculatedIndicators, setCalculatedIndicators] = useState<Array<{
    id: string;
    name: string;
    code: string;
    description: string;
    formula: string;
    unit: string;
  }>>([]);

  // 模拟数据
  // 比对模型完整数据（包含所有版本）
  const mockComparisonModels = [
    { id: 'supplier_v1', modelId: 'supplier', name: '供应商比对模型', description: '按供应商维度进行比价分析', version: 'V1', isLatest: false },
    { id: 'supplier_v2', modelId: 'supplier', name: '供应商比对模型', description: '按供应商维度进行比价分析', version: 'V2', isLatest: false },
    { id: 'supplier_v3', modelId: 'supplier', name: '供应商比对模型', description: '按供应商维度进行比价分析', version: 'V3', isLatest: true },
    { id: 'product_v1', modelId: 'product', name: '产品比对模型', description: '按产品维度进行比价分析', version: 'V1', isLatest: false },
    { id: 'product_v2', modelId: 'product', name: '产品比对模型', description: '按产品维度进行比价分析', version: 'V2', isLatest: true },
    { id: 'category_v1', modelId: 'category', name: '品类比对模型', description: '按品类维度进行比价分析', version: 'V1', isLatest: false },
    { id: 'category_v2', modelId: 'category', name: '品类比对模型', description: '按品类维度进行比价分析', version: 'V2', isLatest: true },
    { id: 'brand_v1', modelId: 'brand', name: '品牌比对模型', description: '按品牌维度进行比价分析', version: 'V1', isLatest: true }
  ];

  // 下拉列表显示的模型（只显示最新版本）
  const mockComparisonObjects = [
    { id: 'supplier_v3', modelId: 'supplier', name: '供应商比对模型', description: '按供应商维度进行比价分析', version: 'V3', isLatest: true },
    { id: 'product_v2', modelId: 'product', name: '产品比对模型', description: '按产品维度进行比价分析', version: 'V2', isLatest: true },
    { id: 'category_v2', modelId: 'category', name: '品类比对模型', description: '按品类维度进行比价分析', version: 'V2', isLatest: true },
    { id: 'brand_v1', modelId: 'brand', name: '品牌比对模型', description: '按品牌维度进行比价分析', version: 'V1', isLatest: true }
  ];

  // 版本号映射到友好描述
  const getVersionDescription = (version: string): string => {
    const versionMap: Record<string, string> = {
      'V1': '标准版',
      'V2': '高级版',
      'V3': '专业版',
      'V4': '企业版',
      'V5': '旗舰版'
    };
    return versionMap[version] || version;
  };

  const mockIndicators = [
    { id: 'agreement_price', name: '协议价格', unit: '元', description: '采购协议中的价格', expression: 'SUM(协议价格)' },
    { id: 'bid_price', name: '招标价格', unit: '元', description: '招标过程中的报价', expression: 'AVG(招标价格)' },
    { id: 'market_price', name: '市场价格', unit: '元', description: '市场参考价格', expression: 'MAX(市场价格)' },
    { id: 'discount_rate', name: '折扣率', unit: '%', description: '相对于标准价格的折扣', expression: '(标准价格-实际价格)/标准价格*100' }
  ];

  const mockDatasets = [
    { id: 'ds_agreement', name: '采购协议数据集', description: '包含所有采购协议的价格信息', recordCount: 15420 },
    { id: 'ds_bid', name: '招标数据集', description: '历史招标数据和价格信息', recordCount: 8930 },
    { id: 'ds_market', name: '市场价格数据集', description: '市场参考价格数据', recordCount: 23450 },
    { id: 'ds_historical', name: '历史采购数据集', description: '历史采购记录和价格变化', recordCount: 45670 }
  ];

  const updateBaselineDataset = (datasetId: string, patch: Partial<{
    objectName: string;
    objectDescription: string;
  }>) => {
    setSelectedBaselineDatasets(prev => prev.map(d => {
      if (d.id !== datasetId) return d;
      return {
        ...d,
        ...patch
      };
    }));
    setSelectedBaselineDataset(prev => {
      if (!prev || prev.id !== datasetId) return prev;
      return {
        ...prev,
        ...patch
      };
    });
  };

  // 模拟数据集字段数据
  const mockDatasetFields = [
    { field: 'product_code', name: '商品编码', type: 'string', attribute: '文本' },
    { field: 'product_name', name: '商品名称', type: 'string', attribute: '文本' },
    { field: 'category', name: '商品分类', type: 'string', attribute: '文本' },
    { field: 'brand', name: '品牌', type: 'string', attribute: '文本' },
    { field: 'supplier', name: '供应商', type: 'string', attribute: '文本' },
    { field: 'region', name: '地区', type: 'string', attribute: '文本' },
    { field: 'price', name: '价格', type: 'number', attribute: '数值' },
    { field: 'quantity', name: '数量', type: 'number', attribute: '数值' },
    { field: 'purchase_date', name: '采购日期', type: 'date', attribute: '时间' }
  ];

  // 拖拽处理函数
  const handleDragStart = (field: { field: string; name: string; type: string }) => {
    setDraggedField(field);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedField) {
      const newField = {
        id: Date.now().toString(),
        field: draggedField.field,
        name: draggedField.name,
        type: draggedField.type,
        operator: getDefaultOperator(draggedField.type),
        value: '',
        isRange: false
      };
      setDroppedFields(prev => [...prev, newField]);
      setDraggedField(null);
    }
  };

  const handleRemoveField = (id: string) => {
    setDroppedFields(prev => prev.filter(field => field.id !== id));
  };

  const handleOperatorChange = (id: string, operator: string) => {
    setDroppedFields(prev =>
      prev.map(field => {
        const newField = { ...field, operator };
        // 如果操作符改变了，重置值
        if (field.operator !== operator) {
          newField.value = '';
          newField.value2 = undefined;
          newField.isRange = isRangeOperator(operator);
        }
        return newField;
      })
    );
  };

  const handleValueChange = (id: string, value: string) => {
    setDroppedFields(prev =>
      prev.map(field =>
        field.id === id ? { ...field, value } : field
      )
    );
  };

  const handleValue2Change = (id: string, value2: string) => {
    setDroppedFields(prev =>
      prev.map(field =>
        field.id === id ? { ...field, value2 } : field
      )
    );
  };

  /**
   * 获取默认操作符
   * @param fieldType 字段类型
   */
  const getDefaultOperator = (fieldType: string): string => {
    switch (fieldType) {
      case 'string':
        return '等于';
      case 'number':
        return '等于';
      case 'date':
        return '等于';
      default:
        return '等于';
    }
  };

  /**
   * 获取根据类型的操作符列表
   * @param fieldType 字段类型
   */
  const getOperatorsByType = (fieldType: string) => {
    switch (fieldType) {
      case 'string':
        return [
          { value: '等于', label: '等于' },
          { value: '不等于', label: '不等于' },
          { value: '包含', label: '包含' },
          { value: '不包含', label: '不包含' },
          { value: '开头是', label: '开头是' },
          { value: '结尾是', label: '结尾是' },
          { value: '为空', label: '为空' },
          { value: '不为空', label: '不为空' },
          { value: '正则匹配', label: '正则匹配' }
        ];
      case 'number':
        return [
          { value: '等于', label: '等于' },
          { value: '不等于', label: '不等于' },
          { value: '大于', label: '大于' },
          { value: '小于', label: '小于' },
          { value: '大于等于', label: '大于等于' },
          { value: '小于等于', label: '小于等于' },
          { value: '区间', label: '区间' }
        ];
      case 'date':
        return [
          { value: '等于', label: '等于' },
          { value: '不等于', label: '不等于' },
          { value: '大于', label: '大于' },
          { value: '小于', label: '小于' },
          { value: '大于等于', label: '大于等于' },
          { value: '小于等于', label: '小于等于' },
          { value: '区间', label: '区间' }
        ];
      default:
        return [
          { value: '等于', label: '等于' },
          { value: '不等于', label: '不等于' }
        ];
    }
  };

  /**
   * 判断是否为范围操作符
   * @param operator 操作符
   */
  const isRangeOperator = (operator: string): boolean => {
    return operator === '区间';
  };

  /**
   * 判断是否不需要值输入
   * @param operator 操作符
   */
  const isNoValueOperator = (operator: string): boolean => {
    return operator === '为空' || operator === '不为空';
  };

  /**
   * 渲染动态输入组件
   * @param field 字段对象
   */
  const renderDynamicInput = (field: any) => {
    const { operator, isRange, value, value2 } = field;

    if (isNoValueOperator(operator)) {
      return <span style={{ color: '#999', fontSize: '12px' }}>无需输入值</span>;
    }

    if (isRange) {
      return (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Input
            placeholder="最小值"
            value={value}
            onChange={(e) => handleValueChange(field.id, e.target.value)}
            style={{ fontSize: '12px', width: '120px' }}
          />
          <span style={{ fontSize: '12px', color: '#999' }}>至</span>
          <Input
            placeholder="最大值"
            value={value2 || ''}
            onChange={(e) => handleValue2Change(field.id, e.target.value)}
            style={{ fontSize: '12px', width: '120px' }}
          />
        </div>
      );
    }

    // 根据字段类型渲染不同的输入组件
    switch (field.type) {
      case 'date':
        return (
          <DatePicker
            placeholder="请选择日期"
            value={value ? dayjs(value) : null}
            onChange={(date) => handleValueChange(field.id, date ? date.format('YYYY-MM-DD') : '')}
            style={{ fontSize: '12px', width: '150px' }}
          />
        );
      case 'number':
        return (
          <InputNumber
            placeholder="请输入数值"
            value={value || 0}
            onChange={(val) => handleValueChange(field.id, val ? val.toString() : '')}
            style={{ fontSize: '12px', width: '120px' }}
          />
        );
      default:
        return (
          <Input
            placeholder="请输入值"
            value={value}
            onChange={(e) => handleValueChange(field.id, e.target.value)}
            style={{ fontSize: '12px', width: '150px' }}
          />
        );
    }
  };

  /**
   * 处理表单提交
   * @param values 表单数据
   */
  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      
      // 构建完整的比价方案配置
      const schemeConfig = {
        ...values,
        comparisonConfig,
        baselineConfig,
        analysisMetrics,
        createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
      };
      
      console.log('比价方案配置:', schemeConfig);
      
      // 这里应该调用API保存数据
      await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟API调用
      
      message.success('比价方案创建成功！');
      form.resetFields();
      setComparisonConfig({ object: '', indicator: '', queryScope: {} });
      setBaselineConfig({ dataset: '', indicator: '', queryScope: {} });
      setAnalysisMetrics([]);
      
    } catch (error) {
      message.error('创建失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 添加分析指标
   */
  const addAnalysisMetric = () => {
    const newMetric = {
      id: `metric_${Date.now()}`,
      name: '',
      expression: '',
      unit: '',
      description: ''
    };
    setAnalysisMetrics([...analysisMetrics, newMetric]);
  };

  /**
   * 删除分析指标
   * @param index 指标索引
   */
  const removeAnalysisMetric = (index: number) => {
    const newMetrics = analysisMetrics.filter((_, i) => i !== index);
    setAnalysisMetrics(newMetrics);
  };

  /**
   * 更新分析指标
   * @param index 指标索引
   * @param field 字段名
   * @param value 字段值
   */
  const updateAnalysisMetric = (index: number, field: string, value: any) => {
    const newMetrics = [...analysisMetrics];
    newMetrics[index] = { ...newMetrics[index], [field]: value };
    setAnalysisMetrics(newMetrics);
  };

  /**
   * 预览配置
   */
  const handlePreview = () => {
    const values = form.getFieldsValue();
    console.log('预览配置:', { ...values, comparisonConfig, baselineConfig, analysisMetrics });
    setPreviewVisible(true);
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Card>
        <div style={{ marginBottom: '24px' }}>
          <Title level={3}>新建比价方案</Title>
          <Text type="secondary">
            配置比对对象、基准对象和分析指标，创建个性化的比价分析方案
          </Text>
        </div>

        {/* 页面标题 */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#262626',
            textAlign: 'center'
          }}>
            比价配置
          </div>
          <div style={{
            fontSize: '14px',
            color: '#8c8c8c',
            textAlign: 'center',
            marginTop: '8px'
          }}>
            配置比对对象、基准对象和分析指标
          </div>
        </div>

            {/* 配置内容 */}
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              enabled: true,
              timeRange: [dayjs().subtract(3, 'month'), dayjs()]
            }}
          >
            {/* 基本信息 */}
            <div style={{ 
              border: '1px solid #f0f0f0', 
              borderRadius: '6px', 
              marginBottom: '16px',
              backgroundColor: '#fff'
            }}>
              {/* 模块标题栏 */}
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '12px 16px',
                borderBottom: basicInfoExpanded ? '1px solid #f0f0f0' : 'none',
                cursor: 'pointer',
                backgroundColor: '#fafafa'
              }}
              onClick={() => setBasicInfoExpanded(!basicInfoExpanded)}
            >
              <div style={{ 
                width: '4px', 
                height: '20px', 
                backgroundColor: '#1890ff', 
                marginRight: '12px',
                borderRadius: '2px'
              }} />
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
                基本信息
              </span>
              <span style={{ 
                fontSize: '12px', 
                color: '#999',
                transform: basicInfoExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
                marginLeft: '8px'
              }}>
                ▶
              </span>
              <div style={{ flex: 1 }} />
            </div>
            
            {/* 模块内容 */}
            {basicInfoExpanded && (
              <div style={{ padding: '16px' }}>
                <Row gutter={[16, 16]}>
                  <Col span={8}>
                    <div style={{ display: 'flex', alignItems: 'center', height: '32px' }}>
                      <span style={{ width: '80px', textAlign: 'right', marginRight: '8px' }}>方案编码:</span>
                      <Form.Item
                        name="schemeCode"
                        style={{ flex: 1, margin: 0 }}
                        rules={[{ required: true, message: '请输入方案编码' }]}
                      >
                        <Input placeholder="请输入方案编码" />
                      </Form.Item>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ display: 'flex', alignItems: 'center', height: '32px' }}>
                      <span style={{ width: '80px', textAlign: 'right', marginRight: '8px' }}>方案名称:</span>
                      <Form.Item
                        name="schemeName"
                        style={{ flex: 1, margin: 0 }}
                        rules={[{ required: true, message: '请输入方案名称' }]}
                      >
                        <Input placeholder="请输入方案名称" />
                      </Form.Item>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ display: 'flex', alignItems: 'center', height: '32px' }}>
                      <span style={{ width: '80px', textAlign: 'right', marginRight: '8px' }}>比对模型:</span>
                      <div style={{ position: 'relative', flex: 1 }}>
                      <Form.Item
                        name="comparisonModel"
                        style={{ margin: 0 }}
                        rules={[{ required: true, message: '请选择比对模型' }]}
                      >
                        <Select
                          key={selectKey}
                          placeholder="请选择比对模型"
                          onChange={handleComparisonModelChange}
                          value={form.getFieldValue('comparisonModel')}
                          optionLabelProp="label"
                          optionRender={(option) => {
                            const model = mockComparisonObjects.find(m => m.id === option.value);
                            if (!model) return option.label;

                            return (
                              <div style={{ padding: '4px 0' }}>
                                {model.name}({getVersionDescription(model.version)})
                              </div>
                            );
                          }}
                        >
                          {mockComparisonObjects.map(model => (
                            <Option
                              key={model.id}
                              value={model.id}
                              label={`${model.name}(${getVersionDescription(model.version)})`}
                            >
                              {model.name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>

                                          </div>
                    </div>
                  </Col>
                  
                  
                </Row>
  
                {/* 管理组织 - 移动到方案描述上方 */}
                <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                  <Col span={24}>
                    <div style={{ display: 'flex', alignItems: 'center', height: '32px' }}>
                      <span style={{ width: '80px', textAlign: 'right', marginRight: '8px', fontSize: '14px' }}>管理组织:</span>
                      <div
                        style={{
                          flex: 1,
                          maxWidth: '400px',
                          padding: '4px 8px',
                          border: '1px solid #d9d9d9',
                          borderRadius: '4px',
                          backgroundColor: '#fff',
                          cursor: 'pointer',
                          minHeight: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                        onClick={() => setManageOrgModalVisible(true)}
                      >
                        {manageOrg ? (
                          <span style={{ fontSize: '14px' }}>
                            {getOrganizationTitle(manageOrg)}
                          </span>
                        ) : (
                          <span style={{ fontSize: '14px', color: '#bfbfbf' }}>点击选择管理组织</span>
                        )}
                        <SelectOutlined style={{ color: '#bfbfbf', fontSize: '12px' }} />
                      </div>
                    </div>
                  </Col>
                </Row>

                <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                  <Col span={24}>
                    <div style={{ display: 'flex', alignItems: 'center', minHeight: '32px' }}>
                      <span style={{ width: '80px', textAlign: 'right', marginRight: '8px', fontSize: '14px' }}>使用组织:</span>
                      <div
                        style={{
                          flex: 1,
                          maxWidth: '400px',
                          padding: '4px 8px',
                          border: '1px solid #d9d9d9',
                          borderRadius: '4px',
                          backgroundColor: '#fff',
                          cursor: 'pointer',
                          minHeight: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                        onClick={() => {
                          const current = form.getFieldValue('applyOrgs') || [];
                          setApplyOrgDraft(Array.isArray(current) ? current : []);
                          setApplyOrgModalVisible(true);
                        }}
                      >
                        {applyOrgSummary ? (
                          <span style={{ fontSize: '14px' }}>{applyOrgSummary}</span>
                        ) : (
                          <span style={{ fontSize: '14px', color: '#bfbfbf' }}>点击选择使用组织</span>
                        )}
                        <SelectOutlined style={{ color: '#bfbfbf', fontSize: '12px' }} />
                      </div>
                      <Form.Item name="applyOrgs" hidden rules={[{ required: true, message: '请选择使用组织' }]}>
                        <Input />
                      </Form.Item>
                      <Tooltip title="权限说明：管理组织可编辑/删除/创建任务/创建报表；使用组织仅可查看方案/发布报表。">
                        <InfoCircleOutlined style={{ color: '#bfbfbf', marginLeft: 8 }} />
                      </Tooltip>
                    </div>
                  </Col>
                </Row>

                {/* 方案描述 - 单独一行 */}
                <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                  <Col span={24}>
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                      <span style={{ width: '80px', textAlign: 'right', marginRight: '8px', marginTop: '8px' }}>方案描述:</span>
                      <Form.Item
                        name="description"
                        style={{ flex: 1, margin: 0 }}
                      >
                        <TextArea
                          placeholder="请输入方案描述"
                          rows={3}
                          style={{ resize: 'vertical' }}
                        />
                      </Form.Item>
                    </div>
                  </Col>
                </Row>
                
                {/* 比对类型 - 只读表单项 */}
                <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                  <Col span={24}>
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                      <span style={{ 
                        width: '80px', 
                        textAlign: 'right', 
                        marginRight: '8px',
                        fontSize: '14px',
                        paddingTop: '6px'
                      }}>
                        比对类型：
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          padding: '8px 12px',
                          backgroundColor: '#f5f5f5',
                          borderRadius: '6px',
                          border: '1px solid #d9d9d9',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px'
                        }}>
                          {/* 比对标签 */}
                          <Tag 
                            color="blue" 
                            style={{ 
                              fontSize: '12px',
                              padding: '4px 8px',
                              borderRadius: '4px'
                            }}
                          >
                            同产品比对
                          </Tag>
                          
                          {/* 分隔符 */}
                          <div style={{ 
                            width: '1px', 
                            height: '20px', 
                            backgroundColor: '#d9d9d9' 
                          }}></div>
                          
                          {/* 比对字段 */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            <Tag style={{ 
                              fontSize: '12px',
                              padding: '2px 6px',
                              backgroundColor: '#e6f7ff',
                              color: '#1890ff',
                              border: '1px solid #91d5ff'
                            }}>
                              产品编码
                            </Tag>
                            <Tag style={{ 
                              fontSize: '12px',
                              padding: '2px 6px',
                              backgroundColor: '#e6f7ff',
                              color: '#1890ff',
                              border: '1px solid #91d5ff'
                            }}>
                              产品名称
                            </Tag>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>

              </div>
            )}
          </div>

  
          {/* 三大模块配置 - 折叠面板布局 */}
          <div style={{ marginBottom: '24px' }}>
            {/* 比对对象模块 */}
            <div style={{ 
              border: '1px solid #f0f0f0', 
              borderRadius: '6px', 
              marginBottom: '16px',
              backgroundColor: '#fff'
            }}>
              {/* 模块标题栏 */}
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '12px 16px',
                  borderBottom: '1px solid #f0f0f0',
                  cursor: 'pointer',
                  backgroundColor: '#fafafa'
                }}
                onClick={() => {
                  const newActiveKey = activeKey.includes('1') 
                    ? activeKey.filter(key => key !== '1')
                    : [...activeKey, '1'];
                  setActiveKey(newActiveKey);
                }}
              >
                <div style={{ 
                  width: '4px', 
                  height: '20px', 
                  backgroundColor: '#1890ff', 
                  marginRight: '12px',
                  borderRadius: '2px'
                }} />
                <span style={{ 
                  fontSize: '12px', 
                  color: '#999',
                  transform: activeKey.includes('1') ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                  marginRight: '8px'
                }}>
                  ▶
                </span>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff', flex: 1 }}>
                  比对对象
                </span>
              </div>
              
              {/* 模块内容 */}
              {activeKey.includes('1') && (
                <div style={{ padding: '16px' }}>
                  {/* 比对对象模块主体：左侧维度表格 / 右侧比对范围 + 比对指标 */}
                  <Row gutter={16}>
                    <Col span={7}>
                      <div style={{
                        border: '1px solid #e8e8e8',
                        borderRadius: '4px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'visible'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 12
                        }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#333' }}>比对维度</div>
                          <Button
                            type="primary"
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={() => setDimensionModalVisible(true)}
                          >
                            添加比对维度
                          </Button>
                        </div>

                        <Form.Item name="comparisonDimensions" rules={[{ required: true, message: '请选择比对维度' }]}>
                          <Table
                            rowKey="field"
                            size="small"
                            pagination={false}
                            dataSource={selectedDimensions.map((d, idx) => ({ ...d, key: d.field, sort: idx + 1 }))}
                            locale={{
                              emptyText: (
                                <div style={{ textAlign: 'center', color: '#999', padding: '40px 0', fontSize: 12 }}>
                                  暂无比对维度
                                </div>
                              )
                            }}
                            columns={[
                              { title: '序号', dataIndex: 'sort', key: 'sort', width: 60 },
                              { title: '名称', dataIndex: 'name', key: 'name', width: 140 },
                              { title: '编码', dataIndex: 'field', key: 'field' },
                              {
                                title: '操作',
                                key: 'action',
                                width: 60,
                                render: (_: any, record: any) => (
                                  <Button
                                    type="text"
                                    size="small"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => {
                                      setSelectedDimensions(prev => prev.filter(x => x.field !== record.field));
                                    }}
                                  />
                                )
                              }
                            ]}
                          />
                        </Form.Item>
                      </div>
                    </Col>

                    <Col span={17}>
                      <div style={{
                        border: '1px solid #e8e8e8',
                        borderRadius: '4px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'visible'
                      }}>
                        <div style={{
                          border: '1px solid #f0f0f0',
                          borderRadius: '4px',
                          padding: '10px',
                          marginBottom: 12,
                          backgroundColor: '#fff'
                        }}>
                          <Row gutter={10}>
                            <Col span={12}>
                              <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>比对数据集</div>
                              <Select
                                value={comparisonObject.datasetId}
                                style={{ width: '100%' }}
                                disabled
                              >
                                {mockDatasets.map(d => (
                                  <Option key={d.id} value={d.id}>{d.name}</Option>
                                ))}
                              </Select>
                            </Col>
                            <Col span={12}>
                              <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>对象描述</div>
                              <Input
                                value={comparisonObject.objectDescription}
                                onChange={(e) => setComparisonObject(prev => ({ ...prev, objectDescription: e.target.value }))}
                                placeholder="口径/用途说明"
                              />
                            </Col>
                          </Row>
                        </div>

                        {/* 比对范围（大区域） */}
                        <div style={{
                          flex: 3,
                          border: '1px solid #f0f0f0',
                          borderRadius: '4px',
                          padding: '12px',
                          marginBottom: 12,
                          overflow: 'auto'
                        }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 12
                          }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#333', display: 'flex', alignItems: 'center', gap: 6 }}>
                              比对范围
                              <Tooltip title="查询范围不可在比价报表中修改">
                                <InfoCircleOutlined style={{ fontSize: 12, color: '#999' }} />
                              </Tooltip>
                            </div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <Dropdown
                                trigger={["click"]}
                                menu={{
                                  items: availableQueryConditions
                                    .filter(cond => !comparisonRanges.some(r => r.id === cond.id))
                                    .map(cond => ({ key: cond.id, label: cond.name })),
                                  onClick: ({ key }) => handleAddCondition(String(key))
                                }}
                              >
                                <Button type="primary" size="small" icon={<PlusOutlined />}>添加比对条件</Button>
                              </Dropdown>
                              <Button size="small" onClick={() => setComparisonRanges([])}>清空</Button>
                            </div>
                          </div>

                          <div style={{ minHeight: 140 }}>
                            {comparisonRanges.length === 0 ? (
                              <div style={{ textAlign: 'center', color: '#999', padding: '50px 0', fontSize: 12 }}>
                                暂无比对范围
                              </div>
                            ) : (
                              <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                gridAutoFlow: 'dense',
                                gap: 8
                              }}>
                                {comparisonRanges.map(range => {
                                  const gridSpan = getGridSpan(range.id);
                                  return (
                                    <div
                                      key={range.id}
                                      style={{
                                        border: '1px solid #f0f0f0',
                                        borderRadius: 4,
                                        padding: '8px 10px',
                                        backgroundColor: '#fafafa',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        gridColumn: `span ${gridSpan}`
                                      }}
                                    >
                                      <span style={{ fontSize: 12, color: '#555', fontWeight: 500, flexShrink: 0, width: 100 }}>{range.field}</span>
                                      <div style={{ flex: 1 }}>{renderDefaultControl(range)}</div>
                                      <Button
                                        type="text"
                                        size="small"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => setComparisonRanges(prev => prev.filter(r => r.id !== range.id))}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 比对指标（小区域，可滚动） */}
                        <div style={{
                          flex: 1,
                          border: '1px solid #f0f0f0',
                          borderRadius: '4px',
                          padding: '12px',
                          overflow: 'auto'
                        }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 8
                          }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#333' }}>比对指标</div>
                            <Space>
                              <Button type="primary" size="small" onClick={() => setIndicatorModalVisible(true)}>添加比对指标</Button>
                              <Button size="small" onClick={() => setCustomIndicatorModalVisible(true)}>自定义指标</Button>
                            </Space>
                          </div>

                          {selectedIndicators.length > 0 ? (
                            <Table
                              dataSource={selectedIndicators.map(id => {
                                const customIndicator = customIndicators.find(item => item.id === id);
                                if (customIndicator) {
                                  return {
                                    key: id,
                                    code: customIndicator.code,
                                    name: customIndicator.name,
                                    expression: customIndicator.expression,
                                    unit: '个',
                                    description: customIndicator.description
                                  };
                                }
                                const calculatedIndicator = calculatedIndicators.find(item => item.id === id);
                                if (calculatedIndicator) {
                                  return {
                                    key: id,
                                    code: calculatedIndicator.code,
                                    name: calculatedIndicator.name,
                                    expression: calculatedIndicator.formula,
                                    unit: calculatedIndicator.unit,
                                    description: calculatedIndicator.description
                                  };
                                }
                                const indicator = mockIndicators.find(item => item.id === id);
                                if (!indicator) return null;
                                return {
                                  key: id,
                                  code: `IND_${id.toUpperCase()}`,
                                  name: indicator.name,
                                  expression: `SUM(${indicator.name})`,
                                  unit: indicator.unit,
                                  description: indicator.description
                                };
                              }).filter((item): item is NonNullable<typeof item> => item !== null)}
                              columns={[
                                { title: '序号', key: 'sort', width: 60, render: (_: any, __: any, index: number) => index + 1 },
                                { title: '操作', key: 'op', width: 80, render: (_: any, record: any) => (
                                  <Space size={0}>
                                    <Button type="text" size="small" icon={<EditOutlined />} onClick={() => message.info('编辑指标功能待实现')} />
                                    <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => setSelectedIndicators(prev => prev.filter(x => x !== record.key))} />
                                  </Space>
                                ) },
                                { title: '排序', key: 'order', width: 60, render: (_: any, __: any, index: number) => index + 1 },
                                { title: '名称', dataIndex: 'name', key: 'name', width: 160 },
                                { title: '指标表达式', dataIndex: 'expression', key: 'expression', ellipsis: true },
                                { title: '指标单位', dataIndex: 'unit', key: 'unit', width: 100 },
                                { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true }
                              ]}
                              pagination={false}
                              size="small"
                              scroll={{ y: 160 }}
                            />
                          ) : (
                            <div style={{ textAlign: 'center', color: '#999', padding: '20px 0', fontSize: 12 }}>
                              暂无比对指标
                            </div>
                          )}
                        </div>
                      </div>
                    </Col>
                  </Row>
                </div>
              )}
            </div>

            {/* 基准对象模块 */}
            <div style={{ 
              border: '1px solid #f0f0f0', 
              borderRadius: '6px', 
              marginBottom: '16px',
              backgroundColor: '#fff'
            }}>
              {/* 模块标题栏 */}
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '12px 16px',
                  borderBottom: '1px solid #f0f0f0',
                  cursor: 'pointer',
                  backgroundColor: '#fafafa'
                }}
                onClick={() => {
                  const newActiveKey = activeKey.includes('2') 
                    ? activeKey.filter(key => key !== '2')
                    : [...activeKey, '2'];
                  setActiveKey(newActiveKey);
                }}
              >
                <div style={{ 
                  width: '4px', 
                  height: '20px', 
                  backgroundColor: '#52c41a', 
                  marginRight: '12px',
                  borderRadius: '2px'
                }} />
                <span style={{ 
                  fontSize: '12px', 
                  color: '#999',
                  transform: activeKey.includes('2') ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                  marginRight: '8px'
                }}>
                  ▶
                </span>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#52c41a', flex: 1 }}>
                  基准对象
                </span>
              </div>
              
              {/* 模块内容 */}
              {activeKey.includes('2') && (
                <div style={{ padding: '16px' }}>
                  <Row gutter={16}>
                    {/* 左侧：基准数据集列表 (3:7 比例) */}
                    <Col span={7}>
                      <div style={{
                        border: '1px solid #e8e8e8',
                        borderRadius: '8px',
                        padding: '16px',
                        height: '500px',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                        backgroundColor: '#fff'
                      }}>
                        <div style={{ 
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                          marginBottom: '16px'
                        }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}>
                            <div style={{ 
                              fontSize: '14px', 
                              fontWeight: 'bold', 
                              color: '#333'
                            }}>
                              基准对象列表
                            </div>
                            <Button 
                              type="primary" 
                              size="small"
                              icon={<PlusOutlined />}
                              onClick={() => setShowAddBenchmarkObjectModal(true)}
                            >
                              添加基准对象
                            </Button>
                          </div>
                          
                          {/* 添加基准对象的简单说明 */}
                          <Alert
                            message="基准对象是比价分析的参照标准，点击添加按钮创建新的基准对象"
                            type="info"
                            showIcon
                            style={{ marginBottom: '8px' }}
                          />
                        </div>
                        
                        {/* 基准对象列表（表格化） */}
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <Table
                            rowKey="id"
                            size="small"
                            pagination={false}
                            dataSource={selectedBaselineDatasets}
                            scroll={{ y: 360 }}
                            locale={{
                              emptyText: (
                                <div style={{
                                  textAlign: 'center',
                                  color: '#8c8c8c',
                                  padding: '40px 20px',
                                  fontSize: '14px'
                                }}>
                                  <div style={{ marginBottom: 8, fontWeight: 500 }}>暂无基准对象</div>
                                  <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                                    基准对象是比价分析的参照标准
                                    <br />
                                    点击上方“添加基准对象”开始创建
                                  </div>
                                </div>
                              )
                            }}
                            rowSelection={{
                              type: 'radio',
                              selectedRowKeys: selectedBaselineDataset?.id ? [selectedBaselineDataset.id] : [],
                              onChange: (_keys, rows) => {
                                const r = (rows as any[])?.[0];
                                if (r) setSelectedBaselineDataset(r);
                              }
                            }}
                            onRow={(record) => ({
                              onClick: () => setSelectedBaselineDataset(record)
                            })}
                            columns={[
                              {
                                title: '#',
                                key: 'index',
                                width: 50,
                                render: (_: any, __: any, index: number) => index + 1
                              },
                              {
                                title: '名称',
                                dataIndex: 'objectName',
                                key: 'objectName',
                                width: 160,
                                render: (_: any, record: any) => {
                                  const name = record.objectName || `基准对象-${record.name}`;
                                  const desc = record.objectDescription || '';
                                  return desc ? (
                                    <Tooltip title={desc}>
                                      <span>{name}</span>
                                    </Tooltip>
                                  ) : (
                                    <span>{name}</span>
                                  );
                                }
                              },
                              {
                                title: '数据集',
                                dataIndex: 'name',
                                key: 'name',
                                width: 160
                              },
                              {
                                title: '操作',
                                key: 'action',
                                width: 70,
                                render: (_: any, record: any) => (
                                  <Button
                                    type="text"
                                    size="small"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const newDatasets = selectedBaselineDatasets.filter(d => d.id !== record.id);
                                      setSelectedBaselineDatasets(newDatasets);
                                      if (selectedBaselineDataset?.id === record.id) {
                                        setSelectedBaselineDataset(newDatasets[0] || null);
                                      }
                                    }}
                                  />
                                )
                              }
                            ]}
                          />
                        </div>
                      </div>
                    </Col>
                    
                    {/* 右侧：查询范围和基准指标 (3:7 比例) */}
                    <Col span={17}>
                      <div style={{ 
                        border: '1px solid #e8e8e8', 
                        borderRadius: '4px', 
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'visible'
                      }}>
                        {selectedBaselineDataset ? (
                          <>
                            {/* 对象信息 + 关联维度（原型） */}
                            <div style={{
                              border: '1px solid #f0f0f0',
                              borderRadius: '4px',
                              padding: '10px',
                              marginBottom: '10px',
                              backgroundColor: '#fff'
                            }}>
                              <Row gutter={10}>
                                <Col span={12}>
                                  <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>基准数据集</div>
                                  <Select
                                    value={selectedBaselineDataset.id}
                                    style={{ width: '100%' }}
                                    disabled
                                  >
                                    {mockDatasets.map(d => (
                                      <Option key={d.id} value={d.id}>{d.name}</Option>
                                    ))}
                                  </Select>
                                </Col>
                                <Col span={12}>
                                  <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>对象描述</div>
                                  <Input
                                    value={selectedBaselineDataset.objectDescription || ''}
                                    onChange={(e) => updateBaselineDataset(selectedBaselineDataset.id, { objectDescription: e.target.value })}
                                    placeholder="口径/用途说明"
                                  />
                                </Col>
                              </Row>
                            </div>

                            {/* 上半部分：基准范围 */}
                            <div style={{ 
                              flex: 2,
                              marginBottom: '12px',
                              border: '1px solid #f0f0f0',
                              borderRadius: '4px',
                              padding: '12px'
                            }}>
                              <div style={{ 
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '16px'
                              }}>
                                <div style={{
                                  fontSize: '14px',
                                  fontWeight: 'bold',
                                  color: '#333',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}>
                                  基准范围
                                  <Tooltip title="查询范围不可在比价报表中修改">
                                    <InfoCircleOutlined style={{
                                      fontSize: '12px',
                                      color: '#999',
                                      cursor: 'pointer'
                                    }} />
                                  </Tooltip>
                                </div>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                  <Dropdown
                                    trigger={["click"]}
                                    menu={{
                                      items: availableQueryConditions
                                        .filter(cond => !baselineRanges.some(r => r.id === cond.id))
                                        .map(cond => ({ key: cond.id, label: cond.name })),
                                      onClick: ({ key }) => handleAddBaselineCondition(String(key))
                                    }}
                                  >
                                    <Button
                                      type="primary"
                                      size="small"
                                      icon={<PlusOutlined />}
                                    >
                                      添加条件
                                    </Button>
                                  </Dropdown>
                                  <Button
                                    size="small"
                                    onClick={() => setBaselineRanges([])}
                                  >
                                    清空
                                  </Button>
                                </div>
                              </div>
                              
                              {/* 基准范围条件列表 */}
                              <div style={{ minHeight: '120px' }}>
                                {baselineRanges.length === 0 ? (
                                  <div style={{
                                    textAlign: 'center',
                                    color: '#999',
                                    padding: '40px 0',
                                    fontSize: '14px'
                                  }}>
                                    暂无基准范围条件
                                    <br />
                                    <span style={{ fontSize: '12px' }}>点击"添加条件"按钮添加</span>
                                  </div>
                                ) : (
                                  <div
                                    style={{
                                      display: 'grid',
                                      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                      gridAutoFlow: 'dense',
                                      gap: '8px'
                                    }}
                                  >
                                    {baselineRanges.map(range => {
                                      const gridSpan = getGridSpan(range.id);
                                      return (
                                        <div
                                          key={range.id}
                                          style={{
                                            border: '1px solid #f0f0f0',
                                            borderRadius: '4px',
                                            padding: '8px 10px',
                                            backgroundColor: '#fafafa',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            gridColumn: `span ${gridSpan}`
                                          }}
                                        >
                                          <span style={{ fontSize: '12px', color: '#555', fontWeight: 500, flexShrink: 0, width: 100 }}>{range.field}</span>
                                          <div style={{ flex: 1 }}>
                                            {renderDefaultControlForBaseline(range)}
                                          </div>
                                          <Button
                                            type="text"
                                            size="small"
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={() => {
                                              setBaselineRanges(prev => prev.filter(r => r.id !== range.id));
                                            }}
                                          />
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* 下半部分：基准指标 */}
                            <div style={{ 
                              flex: 3,
                              border: '1px solid #f0f0f0',
                              borderRadius: '4px',
                              padding: '12px',
                              overflow: 'visible'
                            }}>
                              <div style={{ 
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '16px'
                              }}>
                                <div style={{ 
                                  fontSize: '14px', 
                                  fontWeight: 'bold', 
                                  color: '#333'
                                }}>
                                  基准指标
                                </div>
                                <Space>
                                  <Button 
                                    type="primary"
                                    size="small"
                                    onClick={() => setBaselineMetricsModalVisible(true)}
                                  >
                                    选择指标
                                  </Button>
                                  <Button 
                                    type="default"
                                    size="small"
                                    onClick={() => {
                                      setCustomBaselineIndicatorModalVisible(true);
                                    }}
                                  >
                                    自定义指标
                                  </Button>
                                </Space>
                              </div>
                              
                              {/* 基准指标列表 */}
                              <div style={{ minHeight: '120px' }}>
                                {selectedBaselineMetrics.length === 0 ? (
                                  <div style={{ 
                                    textAlign: 'center', 
                                    color: '#999', 
                                    padding: '40px 0',
                                    fontSize: '14px',
                                    border: '1px dashed #d9d9d9',
                                    borderRadius: '4px',
                                    backgroundColor: '#fafafa'
                                  }}>
                                    暂无基准指标
                                    <br />
                                    <span style={{ fontSize: '12px' }}>点击"选择指标"按钮添加</span>
                                  </div>
                                ) : (
                                  <Table
                                    dataSource={selectedBaselineMetrics.map(metric => ({
                                      key: metric.id,
                                      code: `IND_${metric.id.toUpperCase()}`,
                                      name: metric.name,
                                      expression: `SUM(${metric.name})`,
                                      unit: metric.unit,
                                      description: '基准指标'
                                    }))}
                                    columns={[
                                      {
                                        title: '指标编码',
                                        dataIndex: 'code',
                                        key: 'code',
                                        width: 120,
                                      },
                                      {
                                        title: '指标名称',
                                        dataIndex: 'name',
                                        key: 'name',
                                        width: 150,
                                        render: (text, record, index) => (
                                          <Input
                                            value={text}
                                            onChange={(e) => {
                                              // 更新基准指标名称
                                              const newValue = e.target.value;
                                              // 这里需要更新对应的指标数据
                                              message.info('基准指标名称编辑功能已启用');
                                            }}
                                            bordered={false}
                                            style={{ padding: '4px 0' }}
                                            placeholder="请输入指标名称"
                                          />
                                        ),
                                      },
                                      {
                                        title: '指标公式',
                                        dataIndex: 'expression',
                                        key: 'expression',
                                        ellipsis: true,
                                        render: (text, record, index) => (
                                          <Input
                                            value={text}
                                            onChange={(e) => {
                                              // 更新基准指标表达式
                                              const newValue = e.target.value;
                                              message.info('基准指标表达式编辑功能已启用');
                                            }}
                                            bordered={false}
                                            style={{ padding: '4px 0' }}
                                            placeholder="请输入表达式"
                                          />
                                        ),
                                      },
                                      {
                                        title: '单位',
                                        dataIndex: 'unit',
                                        key: 'unit',
                                        width: 80,
                                        render: (text, record, index) => (
                                          <Input
                                            value={text}
                                            onChange={(e) => {
                                              // 更新基准指标单位
                                              const newValue = e.target.value;
                                              message.info('基准指标单位编辑功能已启用');
                                            }}
                                            bordered={false}
                                            style={{ padding: '4px 0' }}
                                            placeholder="单位"
                                          />
                                        ),
                                      },
                                      {
                                        title: '描述',
                                        dataIndex: 'description',
                                        key: 'description',
                                        ellipsis: true,
                                        render: (text, record, index) => (
                                          <Input
                                            value={text}
                                            onChange={(e) => {
                                              // 更新基准指标描述
                                              const newValue = e.target.value;
                                              message.info('基准指标描述编辑功能已启用');
                                            }}
                                            bordered={false}
                                            style={{ padding: '4px 0' }}
                                            placeholder="请输入描述"
                                          />
                                        ),
                                      },
                                      {
                                        title: '操作',
                                        key: 'action',
                                        width: 100,
                                        render: (_, record) => (
                                          <Space size="small">
                                            <Button
                                              type="text"
                                              size="small"
                                              icon={<EditOutlined />}
                                              onClick={() => {
                                                message.info('编辑基准指标功能待实现');
                                              }}
                                            />
                                            <Button
                                              type="text"
                                              size="small"
                                              danger
                                              icon={<DeleteOutlined />}
                                              onClick={() => {
                                                const newMetrics = selectedBaselineMetrics.filter(m => m.id !== record.key);
                                                setSelectedBaselineMetrics(newMetrics);
                                              }}
                                            />
                                          </Space>
                                        ),
                                      },
                                    ]}
                                    pagination={false}
                                    size="small"
                                    style={{ marginTop: '8px' }}
                                  />
                                )}
                              </div>
                            </div>
                          </>
                        ) : (
                          <div style={{ 
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            color: '#999',
                            fontSize: '16px'
                          }}>
                            请先选择基准数据集
                          </div>
                        )}
                      </div>
                    </Col>
                  </Row>
                </div>
              )}
            </div>

            {/* 计算指标模块 */}
            <div style={{ 
              border: '1px solid #f0f0f0', 
              borderRadius: '6px', 
              marginBottom: '16px',
              backgroundColor: '#fff'
            }}>
              {/* 模块标题栏 */}
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '12px 16px',
                  borderBottom: '1px solid #f0f0f0',
                  cursor: 'pointer',
                  backgroundColor: '#fafafa'
                }}
                onClick={() => {
                  const newActiveKey = activeKey.includes('3') 
                    ? activeKey.filter(key => key !== '3')
                    : [...activeKey, '3'];
                  setActiveKey(newActiveKey);
                }}
              >
                <div style={{ 
                  width: '4px', 
                  height: '20px', 
                  backgroundColor: '#fa8c16', 
                  marginRight: '12px',
                  borderRadius: '2px'
                }} />
                <span style={{ 
                  fontSize: '12px', 
                  color: '#999',
                  transform: activeKey.includes('3') ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                  marginRight: '8px'
                }}>
                  ▶
                </span>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#fa8c16', flex: 1 }}>
                  计算指标
                </span>
                <Button 
                  type="primary" 
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCalculatedIndicatorModalVisible(true);
                  }}
                  icon={<PlusOutlined />}
                  style={{ marginLeft: 'auto' }}
                >
                  自定义计算指标
                </Button>
              </div>
              
              {/* 模块内容 */}
              {activeKey.includes('3') && (
                <div style={{ padding: '0' }}>
                  <Table
                    dataSource={analysisMetrics.map((metric, index) => ({
                      ...metric,
                      key: metric.id,
                      index: index + 1
                    }))}
                    columns={[
                      {
                        title: '指标名称',
                        dataIndex: 'name',
                        key: 'name',
                        width: 150,
                        render: (text, record, index) => (
                          <Input
                            placeholder="请输入指标名称"
                            value={text}
                            onChange={(e) => updateAnalysisMetric(index, 'name', e.target.value)}
                            bordered={false}
                            style={{ padding: '4px 0' }}
                          />
                        ),
                      },
                      {
                        title: '指标编码',
                        dataIndex: 'id',
                        key: 'id',
                        width: 120,
                        render: (text, record, index) => (
                          <span style={{ color: '#666', fontSize: '12px' }}>
                            {`CALC_${String(index + 1).padStart(3, '0')}`}
                          </span>
                        ),
                      },
                        {
                        title: '指标公式',
                        dataIndex: 'formula',
                        key: 'formula',
                        width: 200,
                        render: (text, record, index) => (
                          <code style={{ 
                            backgroundColor: '#f5f5f5', 
                            padding: '2px 6px', 
                            borderRadius: '3px',
                            fontSize: '11px',
                            color: '#666'
                          }}>
                            {record.expression ? 
                              record.expression.replace(/比对数据集_/g, '').replace(/#1参照数据集_/g, 'REF_') :
                              '(比对指标-基准指标)/基准指标*100'
                            }
                          </code>
                        ),
                      },
                      {
                        title: '指标描述',
                        dataIndex: 'description',
                        key: 'description',
                        render: (text, record, index) => (
                          <Input
                            placeholder="请输入指标描述"
                            value={text}
                            onChange={(e) => updateAnalysisMetric(index, 'description', e.target.value)}
                            bordered={false}
                            style={{ padding: '4px 0' }}
                          />
                        ),
                      },
                      {
                        title: '操作',
                        key: 'action',
                        width: 80,
                        render: (text, record, index) => (
                          <Button 
                            type="text" 
                            danger 
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => removeAnalysisMetric(index)}
                          />
                        ),
                      },
                    ]}
                    pagination={false}
                    size="small"
                    locale={{
                      emptyText: (
                        <div style={{ 
                          textAlign: 'center', 
                          padding: '40px', 
                          color: '#999'
                        }}>
                          <Text type="secondary">暂无计算指标，点击上方"添加计算指标"按钮开始配置</Text>
                        </div>
                      )
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* 操作按钮 */}
          <div style={{
            marginTop: '24px',
            textAlign: 'center',
            padding: '16px',
            borderTop: '1px solid #f0f0f0'
          }}>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              htmlType="submit"
              loading={loading}
              size="large"
            >
              保存方案
            </Button>
          </div>
        </Form>
      </Card>

      {/* 选择指标弹框 */}
      <Modal
        title="选择指标"
        open={indicatorModalVisible}
        onCancel={() => setIndicatorModalVisible(false)}
        onOk={() => {
          setIndicatorModalVisible(false);
          message.success(`已选择 ${selectedIndicators.length} 个指标`);
        }}
        width={800}
      >
        <Table
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys: selectedIndicators,
            onChange: (selectedRowKeys) => {
              setSelectedIndicators(selectedRowKeys as string[]);
            },
          }}
          columns={[
            {
              title: '指标名称',
              dataIndex: 'name',
              key: 'name',
              width: 200,
            },
            {
              title: '指标公式',
              dataIndex: 'expression',
              key: 'expression',
              render: (text) => (
                <code style={{
                  backgroundColor: '#f5f5f5',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontSize: '12px'
                }}>
                  {text}
                </code>
              ),
            },
            {
              title: '指标描述',
              dataIndex: 'description',
              key: 'description',
              ellipsis: true,
            },
          ]}
          dataSource={mockIndicators.map(item => ({
            ...item,
            key: item.id
          }))}
          pagination={false}
          size="small"
          scroll={{ y: 300 }}
        />
      </Modal>

      {/* 预览弹窗 */}
      <Modal
        title="配置预览"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        <div>
          <Title level={5}>比对对象配置</Title>
          <pre style={{ backgroundColor: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
            {JSON.stringify(comparisonConfig, null, 2)}
          </pre>
          
          <Title level={5}>基准对象配置</Title>
          <pre style={{ backgroundColor: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
            {JSON.stringify(baselineConfig, null, 2)}
          </pre>
          
          <Title level={5}>分析指标配置</Title>
          <pre style={{ backgroundColor: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
            {JSON.stringify(analysisMetrics, null, 2)}
          </pre>
        </div>
      </Modal>


        {/* 添加维度弹框 */}
        <Modal
          title="选择比对维度"
          open={dimensionModalVisible}
          onCancel={() => setDimensionModalVisible(false)}
          width={800}
          footer={[
            <Button key="cancel" onClick={() => setDimensionModalVisible(false)}>
              取消
            </Button>,
            <Button 
              key="confirm" 
              type="primary" 
              onClick={() => {
                // 这里可以添加确认选择的逻辑
                setDimensionModalVisible(false);
              }}
            >
              确定
            </Button>
          ]}
        >
          <div style={{ padding: '16px 0' }}>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>数据集字段</span>
            </div>
            
            <Table
              dataSource={mockDatasetFields}
              pagination={false}
              size="small"
              rowKey="field"
              rowSelection={{
                type: 'checkbox',
                selectedRowKeys: selectedDimensions.map(d => d.field),
                onChange: (selectedRowKeys, selectedRows) => {
                  setSelectedDimensions(selectedRows);
                },
              }}
              columns={[
                {
                  title: '名称',
                  dataIndex: 'name',
                  key: 'name',
                  width: 200,
                },
                {
                  title: '属性',
                  dataIndex: 'attribute',
                  key: 'attribute',
                  width: 150,
                  render: (attribute) => <Tag color="cyan">{attribute}</Tag>
                }
              ]}
              style={{ 
                border: '1px solid #f0f0f0',
                borderRadius: '6px'
              }}
            />
          </div>
        </Modal>

        {/* 数据集选择弹框 */}
        <Modal
          title="添加基准对象"
          open={datasetModalVisible}
          onCancel={() => setDatasetModalVisible(false)}
          onOk={() => {
            setDatasetModalVisible(false);
            message.success(`已添加 ${selectedBaselineDatasets.length} 个基准对象`);
          }}
          width={800}
        >
          <div style={{ marginBottom: '16px' }}>
            <Alert
              message="请先选择数据集，然后为每个数据集指定基准对象名称"
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />
          </div>
          <Table
            rowSelection={{
              type: 'checkbox',
              selectedRowKeys: selectedBaselineDatasets.map(d => d.id),
              onChange: (selectedRowKeys, selectedRows) => {
                // 为新选择的数据集添加默认的基准对象名称
                const updatedRows = selectedRows.map(row => {
                  const existingRow = selectedBaselineDatasets.find(d => d.id === row.id);
                  return {
                    ...row,
                    objectName: existingRow?.objectName || `基准对象-${row.name}`
                  };
                });
                setSelectedBaselineDatasets(updatedRows);
              },
            }}
            columns={[
              {
                title: '数据集名称',
                dataIndex: 'name',
                key: 'name',
                width: 150,
              },
              {
                title: '基准对象名称',
                dataIndex: 'objectName',
                key: 'objectName',
                width: 200,
                render: (text, record) => (
                  <Input
                    value={record.name}
                    onChange={(e) => {
                      const newDatasets = selectedBaselineDatasets.map(d => {
                        if (d.id === record.id) {
                          return { ...d, objectName: e.target.value };
                        }
                        return d;
                      });
                      setSelectedBaselineDatasets(newDatasets);
                    }}
                    placeholder="请输入基准对象名称"
                  />
                )
              },
              {
                title: '描述',
                dataIndex: 'description',
                key: 'description',
                width: 350,
              },
            ]}
            dataSource={mockDatasets}
            rowKey="id"
            size="small"
            scroll={{ y: 300 }}
          />
        </Modal>

        {/* 基准范围设置弹框 */}
        <Modal
          title="设置基准范围"
          open={baselineRangeModalVisible}
          onCancel={() => setBaselineRangeModalVisible(false)}
          onOk={() => {
            setBaselineRangeModalVisible(false);
            message.success('基准范围设置已保存');
          }}
          width={1200}
          bodyStyle={{ padding: '20px' }}
          style={{ top: 20 }}
        >
          <Row gutter={16} style={{ height: '600px' }}>
            {/* 左侧：数据集字段列表 */}
            <Col span={8}>
              <Collapse 
                defaultActiveKey={['1']} 
                style={{ 
                  border: '1px solid #d9d9d9', 
                  borderRadius: '6px', 
                  height: '100%'
                }}
              >
                <Panel 
                  header="数据集字段" 
                  key="1"
                  style={{ 
                    height: '100%'
                  }}
                >
                  <div style={{ 
                    maxHeight: '500px', 
                    overflowY: 'auto',
                    padding: '8px'
                  }}>
                    {mockDatasetFields.map(field => (
                      <div
                        key={field.field}
                        draggable
                        style={{
                          padding: '8px 12px',
                          margin: '4px 0',
                          backgroundColor: '#f8f9fa',
                          border: '1px solid #e9ecef',
                          borderRadius: '4px',
                          cursor: 'move',
                          fontSize: '13px'
                        }}
                      >
                        <div style={{ fontWeight: 'bold', color: '#333' }}>
                          {field.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                          {field.type} | {field.attribute}
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>
              </Collapse>
            </Col>

            {/* 右侧：基准范围配置 */}
            <Col span={16}>
              <div style={{ 
                border: '1px solid #d9d9d9', 
                borderRadius: '6px', 
                height: '100%',
                padding: '16px'
              }}>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: 'bold', 
                  marginBottom: '16px',
                  color: '#333'
                }}>
                  基准范围配置
                </div>
                
                <div style={{ 
                  minHeight: '400px',
                  border: '2px dashed #d9d9d9',
                  borderRadius: '6px',
                  padding: '20px',
                  backgroundColor: '#fafafa'
                }}>
                  {baselineRanges.length === 0 ? (
                    <div style={{ 
                      textAlign: 'center', 
                      color: '#999',
                      fontSize: '14px',
                      paddingTop: '100px'
                    }}>
                      拖拽左侧字段到此处设置基准范围
                    </div>
                  ) : (
                    baselineRanges.map(range => (
                      <div 
                        key={range.id}
                        style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          padding: '12px',
                          border: '1px solid #e9ecef',
                          borderRadius: '4px',
                          marginBottom: '8px',
                          backgroundColor: '#fff'
                        }}
                      >
                        <span style={{ flex: 1, fontSize: '14px' }}>
                          {range.field} {range.condition} {range.values}
                        </span>
                        <Space>
                          <Button 
                            type="text" 
                            size="small"
                            icon={<EditOutlined />}
                          />
                          <Button 
                            type="text" 
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => {
                              const newRanges = baselineRanges.filter(r => r.id !== range.id);
                              setBaselineRanges(newRanges);
                            }}
                          />
                        </Space>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Col>
          </Row>
        </Modal>

        {/* 基准指标选择弹框 */}
        <Modal
          title="选择基准指标"
          open={baselineMetricsModalVisible}
          onCancel={() => setBaselineMetricsModalVisible(false)}
          onOk={() => {
            setBaselineMetricsModalVisible(false);
            message.success(`已选择 ${selectedBaselineMetrics.length} 个基准指标`);
          }}
          width={800}
        >
          <Table
            rowSelection={{
              type: 'checkbox',
              selectedRowKeys: selectedBaselineMetrics.map(m => m.id),
              onChange: (selectedRowKeys, selectedRows) => {
                setSelectedBaselineMetrics(selectedRows);
              },
            }}
            columns={[
              {
                title: '指标名称',
                dataIndex: 'name',
                key: 'name',
                width: 200,
              },
              {
                title: '指标公式',
                dataIndex: 'expression',
                key: 'expression',
                render: (text) => (
                  <code style={{
                    backgroundColor: '#f5f5f5',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontSize: '12px'
                  }}>
                    {text}
                  </code>
                ),
              },
              {
                title: '指标描述',
                dataIndex: 'description',
                key: 'description',
                ellipsis: true,
              },
            ]}
            dataSource={mockIndicators}
            rowKey="id"
            size="small"
            scroll={{ y: 300 }}
          />
        </Modal>

        {/* 比对指标自定义指标弹窗 */}
        <CustomIndicatorDialog
          visible={customIndicatorModalVisible}
          onCancel={() => setCustomIndicatorModalVisible(false)}
          onOk={(indicator) => {
            // 将自定义指标添加到比对指标列表
            const newIndicatorId = `custom_${Date.now()}`;
            setSelectedIndicators(prev => [...prev, newIndicatorId]);

            // 保存自定义指标的详细信息
            const newCustomIndicator = {
              id: newIndicatorId,
              name: indicator.metricName,
              code: `CUST_${Date.now()}`,
              description: indicator.bizSpec || '',
              expression: indicator.expression || ''
            };
            setCustomIndicators(prev => [...prev, newCustomIndicator]);

            // 这里可以将自定义指标保存到状态或发送到后端
            console.log('新增比对自定义指标:', indicator);

            setCustomIndicatorModalVisible(false);
          }}
          title="新增比对自定义指标"
        />

        {/* 基准指标自定义指标弹窗 */}
        <CustomIndicatorDialog
          visible={customBaselineIndicatorModalVisible}
          onCancel={() => setCustomBaselineIndicatorModalVisible(false)}
          onOk={(indicator) => {
            // 将自定义指标添加到基准指标列表
            const newMetric = {
              id: `custom_${Date.now()}`,
              name: indicator.metricName,
              unit: '个'
            };
            setSelectedBaselineMetrics(prev => [...prev, newMetric]);

            // 这里可以将自定义指标保存到状态或发送到后端
            console.log('新增基准自定义指标:', indicator);

            setCustomBaselineIndicatorModalVisible(false);
          }}
          title="新增基准自定义指标"
        />

        {/* 计算指标弹窗 */}
        <CustomIndicatorDialog
          visible={calculatedIndicatorModalVisible}
          onCancel={() => setCalculatedIndicatorModalVisible(false)}
          onOk={(indicator) => {
            // 将计算指标添加到比对指标列表
            const newIndicatorId = `calc_${Date.now()}`;
            setSelectedIndicators(prev => [...prev, newIndicatorId]);

            // 保存计算指标的详细信息
            const newCalculatedIndicator = {
              id: newIndicatorId,
              name: indicator.metricName,
              code: `CALC_${Date.now()}`,
              description: indicator.bizSpec || '',
              formula: indicator.expression || '',
              unit: '个'
            };
            setCalculatedIndicators(prev => [...prev, newCalculatedIndicator]);

            // 这里可以将计算指标保存到状态或发送到后端
            console.log('新增计算指标:', indicator);

            setCalculatedIndicatorModalVisible(false);
          }}
          title="自定义计算指标"
        />

        {/* 添加基准对象弹窗 */}
        <Modal
          title="添加基准对象"
          open={showAddBenchmarkObjectModal}
          onCancel={() => setShowAddBenchmarkObjectModal(false)}
          onOk={() => {
            // 验证输入
            if (!newBenchmarkObject.objectName.trim()) {
              message.error('请输入基准对象名称');
              return;
            }
            if (!newBenchmarkObject.datasetId) {
              message.error('请选择数据集');
              return;
            }

            // 检查重复名称
            const isDuplicate = selectedBaselineDatasets.some(
              dataset => (dataset.objectName || `基准对象-${dataset.name}`) === newBenchmarkObject.objectName.trim()
            );
            if (isDuplicate) {
              message.error('基准对象名称已存在，请使用其他名称');
              return;
            }

            // 查找选中的数据集
            const selectedDataset = mockDatasets.find(d => d.id === newBenchmarkObject.datasetId);
            if (selectedDataset) {
              const newObject = {
                ...selectedDataset,
                objectName: newBenchmarkObject.objectName.trim(),
                objectDescription: newBenchmarkObjectDesc || ''
              };

              setSelectedBaselineDatasets(prev => [...prev, newObject]);
              setSelectedBaselineDataset(newObject);

              // 重置并关闭弹窗
              setNewBenchmarkObject({ objectName: '', datasetId: '' });
              setNewBenchmarkObjectDesc('');
              setShowAddBenchmarkObjectModal(false);
              message.success('基准对象添加成功');
            }
          }}
          width={800}
        >
          <Form layout="vertical">
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  label="基准对象名称"
                  required
                  help="为基准对象设置一个易于识别的名称"
                  rules={[{ required: true, message: '请输入基准对象名称' }]}
                >
                  <Input
                    placeholder="例如：华东地区采购基准"
                    value={newBenchmarkObject.objectName}
                    onChange={(e) => setNewBenchmarkObject({
                      ...newBenchmarkObject,
                      objectName: e.target.value
                    })}
                    prefix={<DatabaseOutlined style={{ color: '#bfbfbf' }} />}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="选择数据集"
                  required
                  help="选择作为基准对象的数据集"
                  rules={[{ required: true, message: '请选择数据集' }]}
                >
                  <Select
                    placeholder="请选择数据集"
                    value={newBenchmarkObject.datasetId || undefined}
                    onChange={(value) => {
                      const dataset = mockDatasets.find(d => d.id === value);
                      setNewBenchmarkObject({
                        ...newBenchmarkObject,
                        datasetId: value,
                        // 如果用户还没有输入名称，自动生成一个默认名称
                        objectName: newBenchmarkObject.objectName || (dataset ? `基准对象-${dataset.name}` : '')
                      });
                    }}
                    style={{ width: '100%' }}
                    optionLabelProp="label"
                  >
                    {mockDatasets.map(dataset => (
                      <Option key={dataset.id} value={dataset.id} label={dataset.name}>
                        <div style={{ padding: '4px 0' }}>
                          <div style={{ fontWeight: 500, marginBottom: '2px' }}>{dataset.name}</div>
                          {dataset.description && (
                            <div style={{ fontSize: '12px', color: '#8c8c8c', lineHeight: '1.3' }}>
                              {dataset.description}
                            </div>
                          )}
                        </div>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="对象描述">
                  <Input.TextArea
                    value={newBenchmarkObjectDesc}
                    onChange={(e) => setNewBenchmarkObjectDesc(e.target.value)}
                    placeholder="请输入基准对象描述"
                    autoSize={{ minRows: 2, maxRows: 4 }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>

        {/* 管理组织选择弹窗 */}
        <Modal
          title="选择管理组织"
          open={manageOrgModalVisible}
          onCancel={() => setManageOrgModalVisible(false)}
          onOk={() => setManageOrgModalVisible(false)}
          width={800}
        >
          <div style={{ padding: '12px 0' }}>
            <Alert
              message="管理组织说明"
              description="管理组织拥有此方案的完全编辑权限，包括添加、修改、删除等所有操作。一个方案只能有一个管理组织。"
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
              <Input
                allowClear
                placeholder="搜索：名称 / 编码"
                style={{ width: 260 }}
                value={manageOrgSearch}
                onChange={(e) => setManageOrgSearch(e.target.value)}
              />
              <Select
                allowClear
                placeholder="组织类型"
                style={{ width: 160 }}
                value={manageOrgCategory}
                onChange={(value) => setManageOrgCategory(value || undefined)}
                options={organizationCategories.map(cat => ({ label: cat, value: cat }))}
              />
            </div>
            <Table
              rowKey="value"
              columns={organizationColumns}
              dataSource={manageOrgData}
              size="middle"
              pagination={{ pageSize: 10, showSizeChanger: false }}
              rowSelection={manageOrgRowSelection}
              onRow={(record) => ({
                onClick: () => setManageOrg(record.value)
              })}
            />
          </div>
        </Modal>

        <Modal
          title="选择使用组织"
          open={applyOrgModalVisible}
          onCancel={() => setApplyOrgModalVisible(false)}
          onOk={() => {
            form.setFieldValue('applyOrgs', applyOrgDraft);
            setApplyOrgModalVisible(false);
          }}
          width={800}
        >
          <div style={{ padding: '12px 0' }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
              <Input
                allowClear
                placeholder="搜索：名称 / 编码"
                style={{ width: 260 }}
                value={applyOrgSearch}
                onChange={(e) => setApplyOrgSearch(e.target.value)}
              />
              <Select
                allowClear
                placeholder="组织类型"
                style={{ width: 160 }}
                value={applyOrgCategory}
                onChange={(value) => setApplyOrgCategory(value || undefined)}
                options={organizationCategories.map(cat => ({ label: cat, value: cat }))}
              />
            </div>
            <Table
              rowKey="value"
              columns={organizationColumns}
              dataSource={applyOrgData}
              size="middle"
              pagination={{ pageSize: 10, showSizeChanger: false }}
              rowSelection={applyOrgRowSelection}
              onRow={(record) => ({
                onClick: () => {
                  setApplyOrgDraft(prev => {
                    const exists = prev.includes(record.value);
                    if (exists) {
                      return prev.filter(item => item !== record.value);
                    }
                    return [...prev, record.value];
                  });
                }
              })}
            />
            <div style={{ marginTop: 12, fontSize: 12, color: '#8c8c8c' }}>
              已选择 {applyOrgDraft.length} 个组织
            </div>
          </div>
        </Modal>

        
        </div>
    );
  };

export default PriceSchemeManagementV2;