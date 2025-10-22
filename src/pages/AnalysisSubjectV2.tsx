import React, { useState, useMemo, useCallback } from 'react';
import { Button, Input, Table, Modal, Form, Tag, Breadcrumb, Tooltip, message, Card, Space, Divider, Tree, Dropdown } from 'antd';
import {
  FolderIcon,
  TableIcon,
  SearchIcon,
  PlusIcon,
  EyeIcon,
  TrashIcon,
  EditIcon,
  FolderOpenIcon,
  InfoIcon,
  DatabaseIcon,
  MoreHorizontalIcon
} from 'lucide-react';
import {
  FolderOutlined,
  FileTextOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  SearchOutlined,
  PlusOutlined
} from '@ant-design/icons';
import type { DataNode, EventDataNode } from 'antd/es/tree';

const { Search } = Input;
const { Meta } = Card;

// 数据类型定义
interface AnalysisSubject {
  id: string;
  name: string;
  description?: string;
  datasets: Dataset[];
}

interface Dataset {
  id: string;
  name: string;
  subjectId: string;
  description?: string;
  dataSource: string;
  lastUpdatedBy: string;
  lastUpdatedTime: string;
  rowCount: number;
  fieldCount: number;
  fields: DatasetField[];
  relatedModelsCount: number;
  enabled: boolean;
}

interface DatasetField {
  id: string;
  name: string;
  type: string;
  role: 'dimension' | 'measure';
  description?: string;
}

// 模拟数据
const mockSubjects: AnalysisSubject[] = [
  {
    id: '1',
    name: '销售分析主题',
    description: '包含销售订单、客户、产品等维度的综合分析主题',
    datasets: [
      {
        id: '1-1',
        name: '销售订单数据集',
        subjectId: '1',
        description: '包含所有销售订单的详细信息，用于销售业绩分析',
        dataSource: 'MySQL - 销售库',
        lastUpdatedBy: '张三（zhangsan）',
        lastUpdatedTime: '2025-01-15 14:30',
        rowCount: 12000,
        fieldCount: 15,
        relatedModelsCount: 5,
        enabled: true,
        fields: [
          { id: 'f1', name: '订单号', type: 'VARCHAR(50)', role: 'dimension', description: '唯一订单标识符' },
          { id: 'f2', name: '客户名称', type: 'VARCHAR(100)', role: 'dimension', description: '购买客户的公司名称' },
          { id: 'f3', name: '订单金额', type: 'DECIMAL(10,2)', role: 'measure', description: '订单总金额，单位：元' },
          { id: 'f4', name: '订单日期', type: 'DATE', role: 'dimension', description: '客户下单的日期' },
          { id: 'f5', name: '产品类别', type: 'VARCHAR(50)', role: 'dimension', description: '产品所属的分类' },
          { id: 'f6', name: '销售员', type: 'VARCHAR(50)', role: 'dimension', description: '负责该订单的销售人员' },
          { id: 'f7', name: '订单数量', type: 'INT', role: 'measure', description: '订单中产品的总数量' },
          { id: 'f8', name: '折扣率', type: 'DECIMAL(5,2)', role: 'measure', description: '订单享受的折扣比例' }
        ]
      },
      {
        id: '1-2',
        name: '客户信息数据集',
        subjectId: '1',
        description: '客户基础信息和属性数据，用于客户画像分析',
        dataSource: 'MySQL - 客户库',
        lastUpdatedBy: '李四（lisi）',
        lastUpdatedTime: '2025-01-14 16:20',
        rowCount: 3500,
        fieldCount: 12,
        relatedModelsCount: 3,
        enabled: true,
        fields: [
          { id: 'f9', name: '客户ID', type: 'VARCHAR(20)', role: 'dimension', description: '客户唯一标识符' },
          { id: 'f10', name: '客户名称', type: 'VARCHAR(100)', role: 'dimension', description: '客户公司名称' },
          { id: 'f11', name: '客户等级', type: 'VARCHAR(20)', role: 'dimension', description: '客户重要程度等级' },
          { id: 'f12', name: '年度消费额', type: 'DECIMAL(12,2)', role: 'measure', description: '客户年度总消费金额' },
          { id: 'f13', name: '注册时间', type: 'DATETIME', role: 'dimension', description: '客户注册平台的时间' },
          { id: 'f14', name: '所在城市', type: 'VARCHAR(50)', role: 'dimension', description: '客户公司所在城市' }
        ]
      },
      {
        id: '1-3',
        name: '产品信息数据集',
        subjectId: '1',
        description: '产品基础信息和属性',
        dataSource: 'MySQL - 产品库',
        lastUpdatedBy: '王五（wangwu）',
        lastUpdatedTime: '2025-01-13 10:15',
        rowCount: 850,
        fieldCount: 8,
        relatedModelsCount: 2,
        enabled: false,
        fields: [
          { id: 'f15', name: '产品ID', type: 'VARCHAR(20)', role: 'dimension', description: '产品唯一标识符' },
          { id: 'f16', name: '产品名称', type: 'VARCHAR(100)', role: 'dimension', description: '产品完整名称' },
          { id: 'f17', name: '产品价格', type: 'DECIMAL(8,2)', role: 'measure', description: '产品单价' },
          { id: 'f18', name: '产品类别', type: 'VARCHAR(50)', role: 'dimension', description: '产品分类' }
        ]
      }
    ]
  },
  {
    id: '2',
    name: '库存分析主题',
    description: '库存管理和分析相关的数据主题',
    datasets: [
      {
        id: '2-1',
        name: '库存明细数据集',
        subjectId: '2',
        description: '各产品的库存详细信息和库存变动记录',
        dataSource: 'MySQL - 库存库',
        lastUpdatedBy: '赵六（zhaoliu）',
        lastUpdatedTime: '2025-01-15 09:15',
        rowCount: 8500,
        fieldCount: 10,
        relatedModelsCount: 4,
        enabled: true,
        fields: [
          { id: 'f19', name: '产品编码', type: 'VARCHAR(30)', role: 'dimension', description: '产品唯一编码' },
          { id: 'f20', name: '产品名称', type: 'VARCHAR(100)', role: 'dimension', description: '产品名称' },
          { id: 'f21', name: '当前库存', type: 'INT', role: 'measure', description: '当前库存数量' },
          { id: 'f22', name: '安全库存', type: 'INT', role: 'measure', description: '安全库存阈值' },
          { id: 'f23', name: '仓库位置', type: 'VARCHAR(50)', role: 'dimension', description: '存储仓库位置' },
          { id: 'f24', name: '库存成本', type: 'DECIMAL(10,2)', role: 'measure', description: '库存总成本' }
        ]
      },
      {
        id: '2-2',
        name: '库存周转数据集',
        subjectId: '2',
        description: '库存周转率和周转天数分析',
        dataSource: 'MySQL - 库存库',
        lastUpdatedBy: '孙七（sunqi）',
        lastUpdatedTime: '2025-01-12 15:45',
        rowCount: 2200,
        fieldCount: 7,
        relatedModelsCount: 1,
        enabled: true,
        fields: [
          { id: 'f25', name: '产品类别', type: 'VARCHAR(50)', role: 'dimension', description: '产品分类' },
          { id: 'f26', name: '周转率', type: 'DECIMAL(6,2)', role: 'measure', description: '库存周转率' },
          { id: 'f27', name: '周转天数', type: 'INT', role: 'measure', description: '平均库存周转天数' }
        ]
      }
    ]
  },
  {
    id: '3',
    name: '财务分析主题',
    description: '财务数据分析和报表相关主题',
    datasets: [
      {
        id: '3-1',
        name: '收入明细数据集',
        subjectId: '3',
        description: '各业务线收入明细数据',
        dataSource: 'Oracle - 财务库',
        lastUpdatedBy: '周八（zhouba）',
        lastUpdatedTime: '2025-01-14 18:30',
        rowCount: 15600,
        fieldCount: 12,
        relatedModelsCount: 6,
        enabled: true,
        fields: [
          { id: 'f28', name: '业务线', type: 'VARCHAR(50)', role: 'dimension', description: '业务线名称' },
          { id: 'f29', name: '收入金额', type: 'DECIMAL(12,2)', role: 'measure', description: '收入金额' },
          { id: 'f30', name: '收入日期', type: 'DATE', role: 'dimension', description: '收入确认日期' }
        ]
      }
    ]
  }
];

const AnalysisSubjectV2: React.FC = () => {
  const [subjects, setSubjects] = useState<AnalysisSubject[]>(mockSubjects);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');
  const [selectedNodeType, setSelectedNodeType] = useState<'subject' | 'dataset'>('subject');
  const [searchText, setSearchText] = useState('');
  const [treeSearchValue, setTreeSearchValue] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [isCreateDatasetModalOpen, setIsCreateDatasetModalOpen] = useState(false);
  const [isCreateSubjectModalOpen, setIsCreateSubjectModalOpen] = useState(false);
  const [isEditSubjectModalOpen, setIsEditSubjectModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditFieldModalOpen, setIsEditFieldModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<DatasetField | null>(null);
  const [editingSubject, setEditingSubject] = useState<AnalysisSubject | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [form] = Form.useForm();
  const [subjectForm] = Form.useForm();
  const [fieldForm] = Form.useForm();

  // 获取当前选中的主题
  const selectedSubject = useMemo(() => {
    return subjects.find(s => s.id === selectedNodeId);
  }, [subjects, selectedNodeId]);

  // 获取当前选中的数据集
  const selectedDataset = useMemo(() => {
    if (selectedNodeType !== 'dataset') return null;
    for (const subject of subjects) {
      const dataset = subject.datasets.find(d => d.id === selectedNodeId);
      if (dataset) return dataset;
    }
    return null;
  }, [subjects, selectedNodeId, selectedNodeType]);

  // 过滤后的数据集列表
  const filteredDatasets = useMemo(() => {
    if (!selectedSubject) return [];
    return selectedSubject.datasets.filter(dataset =>
      dataset.name.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [selectedSubject, searchText]);

  // 处理节点点击
  const handleNodeClick = (nodeId: string, nodeType: 'subject' | 'dataset') => {
    setSelectedNodeId(nodeId);
    setSelectedNodeType(nodeType);
    setSearchText('');
    setIsEditMode(false);
  };

  // 构建树形数据
  const buildTreeData = (): DataNode[] => {
    const filteredSubjects = treeSearchValue
      ? subjects.filter(subject =>
          subject.name.toLowerCase().includes(treeSearchValue.toLowerCase()) ||
          subject.datasets.some(dataset =>
            dataset.name.toLowerCase().includes(treeSearchValue.toLowerCase())
          )
        )
      : subjects;

    return filteredSubjects.map(subject => {
      const filteredDatasets = treeSearchValue
        ? subject.datasets.filter(dataset =>
            dataset.name.toLowerCase().includes(treeSearchValue.toLowerCase())
          )
        : subject.datasets;

      return {
        title: (
          <div className={`flex justify-between items-center pr-2 group rounded px-2 py-1 ${
            selectedNodeId === subject.id && selectedNodeType === 'subject' ? 'bg-blue-50' : 'hover:bg-gray-50'
          }`}>
            <span className="flex-1 truncate">{subject.name}</span>
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'edit',
                    label: '编辑主题',
                    icon: <EditOutlined />,
                    onClick: () => handleEditSubject(subject)
                  }
                ]
              }}
              trigger={['click']}
              placement="bottomRight"
            >
              <Button
                type="text"
                size="small"
                icon={<MoreOutlined />}
                className={`opacity-60 group-hover:opacity-100 ml-2 transition-opacity ${
                  selectedNodeId === subject.id && selectedNodeType === 'subject' ? 'text-blue-600' : ''
                }`}
                onClick={(e) => e.stopPropagation()}
              />
            </Dropdown>
          </div>
        ),
        key: subject.id,
        icon: <FolderOutlined className={selectedNodeId === subject.id && selectedNodeType === 'subject' ? 'text-blue-600' : ''} />,
        children: filteredDatasets.map(dataset => ({
          title: dataset.name,
          key: dataset.id,
          icon: <FileTextOutlined />,
          isLeaf: true,
          datasetData: dataset
        }))
      };
    });
  };

  // 处理树节点选择
  const handleSelect = useCallback(
    (selectedKeys: React.Key[], info: { selected: boolean; node: EventDataNode<DataNode> }) => {
      const { node } = info;

      if (node.isLeaf) {
        // 选择数据集
        const dataset = node.datasetData as Dataset;
        if (dataset) {
          handleNodeClick(dataset.id, 'dataset');
        }
      } else {
        // 选择分析主题
        handleNodeClick(node.key as string, 'subject');
        // 展开该主题
        setExpandedKeys(prev => [...prev.filter(k => k !== node.key), node.key]);
      }
    },
    [subjects]
  );

  // 处理创建数据集
  const handleCreateDataset = () => {
    form.validateFields().then(values => {
      message.success('数据集创建成功');
      setIsCreateDatasetModalOpen(false);
      form.resetFields();
    });
  };

  // 处理创建分析主题
  const handleCreateSubject = () => {
    subjectForm.validateFields().then(values => {
      const newSubject: AnalysisSubject = {
        id: Date.now().toString(),
        name: values.name,
        description: values.description,
        datasets: []
      };
      setSubjects([...subjects, newSubject]);
      message.success('分析主题创建成功');
      setIsCreateSubjectModalOpen(false);
      subjectForm.resetFields();
    });
  };

  // 处理编辑分析主题
  const handleEditSubject = (subject: AnalysisSubject) => {
    setEditingSubject(subject);
    subjectForm.setFieldsValue({
      name: subject.name,
      description: subject.description
    });
    setIsEditSubjectModalOpen(true);
  };

  // 保存编辑的分析主题
  const handleSaveSubject = () => {
    subjectForm.validateFields().then(values => {
      if (editingSubject) {
        const updatedSubjects = subjects.map(s => 
          s.id === editingSubject.id 
            ? { ...s, name: values.name, description: values.description }
            : s
        );
        setSubjects(updatedSubjects);
        message.success('分析主题更新成功');
        setIsEditSubjectModalOpen(false);
        subjectForm.resetFields();
        setEditingSubject(null);
      }
    });
  };

  // 处理删除数据集
  const handleDeleteDataset = (datasetId: string) => {
    setIsDeleteModalOpen(true);
  };

  // 确认删除
  const confirmDelete = () => {
    message.success('数据集删除成功');
    setIsDeleteModalOpen(false);
  };

  // 处理编辑字段备注
  const handleEditField = (field: DatasetField) => {
    setEditingField(field);
    fieldForm.setFieldsValue({ description: field.description || '' });
    setIsEditFieldModalOpen(true);
  };

  // 保存字段备注
  const saveFieldDescription = () => {
    fieldForm.validateFields().then(values => {
      message.success('字段备注更新成功');
      setIsEditFieldModalOpen(false);
      fieldForm.resetFields();
      setEditingField(null);
    });
  };

  // 格式化数据规模
  const formatDataScale = (rowCount: number, fieldCount: number) => {
    const formatCount = (count: number) => {
      if (count >= 10000) {
        return `${(count / 10000).toFixed(1)}万`;
      }
      return count.toString();
    };
    return `${formatCount(rowCount)}行 / ${fieldCount}字段`;
  };

  // 渲染左侧树状菜单
  const renderTreeMenu = () => {
    return (
      <div className="w-80 bg-white border-r overflow-hidden flex flex-col">
        {/* 搜索区域 */}
        <div className="p-4 border-b">
          <Search
            placeholder="搜索分析主题或数据集..."
            value={treeSearchValue}
            onChange={(e) => setTreeSearchValue(e.target.value)}
            prefix={<SearchOutlined />}
            allowClear
          />
        </div>

        {/* 分组管理区域 */}
        <div className="border-b">
          <div className="px-4 py-3 flex justify-between items-center">
            <span className="font-medium text-gray-700">分析主题</span>
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => setIsCreateSubjectModalOpen(true)}
            >
              新建主题
            </Button>
          </div>
        </div>

        {/* 树形结构区域 */}
        <div className="flex-1 overflow-auto p-4">
          <style jsx>{`
            .custom-tree .ant-tree-node-content-wrapper {
              display: flex;
              align-items: center;
              min-height: 32px;
            }
            .custom-tree .ant-tree-title {
              flex: 1;
              display: flex;
              align-items: center;
            }
            .custom-tree .ant-tree-switcher {
              display: flex;
              align-items: center;
            }
            .custom-tree .ant-tree-node-content-wrapper:hover {
              background-color: transparent;
            }
            .custom-tree .ant-tree-node-content-wrapper.ant-tree-node-selected {
              background-color: transparent;
            }
          `}</style>
          <Tree
            showIcon
            treeData={buildTreeData()}
            onSelect={handleSelect}
            expandedKeys={expandedKeys}
            onExpand={setExpandedKeys}
            blockNode
            className="custom-tree"
          />
        </div>
      </div>
    );
  };

  // 渲染面包屑导航
  const renderBreadcrumb = () => {
    const items = [
      { title: '首页' },
      { title: '分析主题' }
    ];

    if (selectedNodeType === 'subject' && selectedSubject) {
      items.push({ title: selectedSubject.name });
    } else if (selectedNodeType === 'dataset' && selectedDataset) {
      const subject = subjects.find(s => s.id === selectedDataset.subjectId);
      if (subject) {
        items.push({ title: subject.name });
        items.push({ title: selectedDataset.name });
      }
    }

    return (
      <Breadcrumb
        className="mb-6"
        items={items}
        style={{ fontSize: '12px', lineHeight: '20px', color: '#666666' }}
      />
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* 顶部标题栏 */}
      <div className="bg-white shadow-sm p-4 border-b">
        <div>
          <h2 className="text-xl font-semibold mb-0">数据集管理</h2>
          <p className="text-sm text-gray-600">管理分析主题和数据集，构建完整的数据分析体系</p>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧菜单区 */}
        {renderTreeMenu()}

        {/* 右侧内容面板 */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 h-full bg-white">
            {renderBreadcrumb()}

            {/* 根据选中状态渲染不同内容 */}
            {selectedNodeType === 'subject' && selectedSubject && (
              <div>
                {/* 顶部操作栏 */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-[#333333]">数据集列表</h3>
                  <div className="flex items-center gap-3">
                    <Search
                      placeholder="搜索数据集名称"
                      style={{ width: 240 }}
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      allowClear
                    />
                    <Button
                      type="primary"
                      icon={<PlusIcon className="w-4 h-4" />}
                      onClick={() => setIsCreateDatasetModalOpen(true)}
                    >
                      新增数据集
                    </Button>
                  </div>
                </div>

                {/* 数据集卡片 */}
                {filteredDatasets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredDatasets.map(dataset => (
                      <Card
                        key={dataset.id}
                        hoverable
                        className="cursor-pointer transition-all hover:shadow-lg hover:border-blue-200 border-2"
                        onClick={() => handleNodeClick(dataset.id, 'dataset')}
                        bodyStyle={{ padding: '20px' }}
                      >
                        <div className="flex flex-col h-full">
                          {/* 标题 */}
                          <div className="mb-4">
                            <div className="font-semibold text-gray-900 text-sm truncate">
                              {dataset.name}
                            </div>
                          </div>

                          {/* 描述 */}
                          <div className="flex-1 mb-4">
                            <div className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                              {dataset.description || '暂无描述'}
                            </div>
                          </div>

                          {/* 元数据信息 */}
                          <div className="space-y-2 mb-4">
                            <div className="text-xs text-gray-500">
                              数据连接：{dataset.dataSource}
                            </div>
                            <div className="text-xs text-gray-500">
                              关联模型数：{dataset.relatedModelsCount}
                            </div>
                            <div className="flex items-center">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                dataset.enabled
                                  ? 'bg-green-100 text-green-600'
                                  : 'bg-red-100 text-red-600'
                              }`}>
                                {dataset.enabled ? '启用' : '禁用'}
                              </span>
                            </div>
                          </div>

                          {/* 底部信息 */}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <div className="flex items-center text-xs text-gray-500">
                              <span>{dataset.lastUpdatedBy}</span>
                              <span className="mx-2">·</span>
                              <span>{dataset.lastUpdatedTime}</span>
                            </div>

                            {/* 操作按钮 */}
                            <div className="flex space-x-1">
                              <Button
                                type="text"
                                size="small"
                                icon={<EyeIcon className="w-3 h-3" />}
                                className="text-gray-400 hover:text-blue-500 p-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNodeClick(dataset.id, 'dataset');
                                }}
                                title="查看详情"
                              />
                              <Button
                                type="text"
                                size="small"
                                icon={<TrashIcon className="w-3 h-3" />}
                                className="text-gray-400 hover:text-red-500 p-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteDataset(dataset.id);
                                }}
                                title="删除"
                              />
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  /* 空状态 */
                  <Card className="text-center py-12">
                    <FolderOpenIcon className="w-16 h-16 text-[#D9D9D9] mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-[#999999] mb-2">暂无数据集</h4>
                    <p className="text-sm text-[#999999] mb-6">
                      {searchText ? '没有找到匹配的数据集' : '当前主题下暂无数据集，点击右上角按钮创建'}
                    </p>
                    {!searchText && (
                      <Button
                        type="primary"
                        icon={<PlusIcon className="w-4 h-4" />}
                        onClick={() => setIsCreateDatasetModalOpen(true)}
                      >
                        创建数据集
                      </Button>
                    )}
                  </Card>
                )}
              </div>
            )}

            {selectedNodeType === 'dataset' && selectedDataset && (
              <div>
                {/* 数据集详情页 */}
                {/* 顶部操作栏 */}
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-[#333333]">{selectedDataset.name}</h2>
                    <p className="text-sm text-[#666666] mt-1">
                      {selectedDataset.description || '暂无描述'}
                    </p>
                  </div>
                  <Button
                    type={isEditMode ? "default" : "primary"}
                    icon={<EditIcon className="w-4 h-4" />}
                    onClick={() => setIsEditMode(!isEditMode)}
                  >
                    {isEditMode ? '保存' : '编辑'}
                  </Button>
                </div>

                {/* 详情内容区 */}
                <div className="space-y-6">
                  {/* 基础信息 */}
                  <Card title="基础信息" className="shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-[#666666] mb-2">所属主题</label>
                        <div className="flex items-center">
                          <FolderIcon className="w-4 h-4 text-[#1890FF] mr-2" />
                          <span className="text-sm text-[#333333]">
                            {subjects.find(s => s.id === selectedDataset.subjectId)?.name}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#666666] mb-2">数据来源</label>
                        <div className="flex items-center">
                          <DatabaseIcon className="w-4 h-4 text-[#52C41A] mr-2" />
                          <span className="text-sm text-[#333333]">{selectedDataset.dataSource}</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#666666] mb-2">数据规模</label>
                        <span className="text-sm text-[#333333]">
                          {formatDataScale(selectedDataset.rowCount, selectedDataset.fieldCount)}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#666666] mb-2">最后更新</label>
                        <div>
                          <div className="text-sm text-[#333333]">{selectedDataset.lastUpdatedTime}</div>
                          <div className="text-xs text-[#999999]">{selectedDataset.lastUpdatedBy}</div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* 字段结构 */}
                  <Card
                    title={
                      <div className="flex items-center justify-between">
                        <span>字段结构</span>
                        <div className="text-xs text-[#999999] space-y-1">
                          <div className="flex items-center">
                            <Tag color="blue">维度</Tag>
                            <span className="ml-2">用于分组 / 筛选</span>
                          </div>
                          <div className="flex items-center">
                            <Tag color="green">度量</Tag>
                            <span className="ml-2">用于计算 / 统计</span>
                          </div>
                        </div>
                      </div>
                    }
                    className="shadow-sm"
                  >
                    <Table
                      dataSource={selectedDataset.fields}
                      rowKey="id"
                      pagination={false}
                      size="small"
                      className="custom-table"
                      columns={[
                        {
                          title: '字段名称',
                          dataIndex: 'name',
                          width: '25%',
                          render: (text) => (
                            <span className="font-medium text-[#333333]">{text}</span>
                          )
                        },
                        {
                          title: '数据类型',
                          dataIndex: 'type',
                          width: '20%',
                          render: (text) => (
                            <Tag color="default" className="font-mono text-xs">{text}</Tag>
                          )
                        },
                        {
                          title: '字段角色',
                          dataIndex: 'role',
                          width: '15%',
                          render: (role) => (
                            <Tag color={role === 'dimension' ? 'blue' : 'green'}>
                              {role === 'dimension' ? '维度' : '度量'}
                            </Tag>
                          )
                        },
                        {
                          title: '字段描述',
                          dataIndex: 'description',
                          width: '30%',
                          render: (text) => (
                            <span className="text-sm text-[#666666]">
                              {text || <span className="text-[#D9D9D9]">暂无描述</span>}
                            </span>
                          )
                        },
                        {
                          title: '操作',
                          width: '10%',
                          render: (_, record) => (
                            <Button
                              type="link"
                              size="small"
                              onClick={() => handleEditField(record)}
                              className="p-0"
                            >
                              编辑备注
                            </Button>
                          )
                        }
                      ]}
                    />
                  </Card>
                </div>
              </div>
            )}

            {!selectedNodeId && (
              <div className="flex flex-col items-center justify-center h-96">
                <InfoIcon className="w-16 h-16 text-[#D9D9D9] mb-4" />
                <h3 className="text-lg font-medium text-[#999999] mb-2">欢迎使用分析主题管理</h3>
                <p className="text-sm text-[#999999] text-center max-w-md">
                  请从左侧菜单选择分析主题或数据集来查看详细信息。您可以管理数据集、配置字段结构，构建完整的数据分析体系。
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 新建数据集弹窗 */}
      <Modal
        title="新建数据集"
        open={isCreateDatasetModalOpen}
        onOk={handleCreateDataset}
        onCancel={() => {
          setIsCreateDatasetModalOpen(false);
          form.resetFields();
        }}
        width={500}
        maskClosable={false}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
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
          >
            <Input.TextArea 
              placeholder="请输入数据集描述（可选）" 
              rows={3}
              maxLength={200}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 新建分析主题弹窗 */}
      <Modal
        title="新建分析主题"
        open={isCreateSubjectModalOpen}
        onOk={handleCreateSubject}
        onCancel={() => {
          setIsCreateSubjectModalOpen(false);
          subjectForm.resetFields();
        }}
        width={500}
        maskClosable={false}
      >
        <Form form={subjectForm} layout="vertical">
          <Form.Item
            name="name"
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
          >
            <Input.TextArea 
              placeholder="请输入主题描述（可选）" 
              rows={3}
              maxLength={200}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑分析主题弹窗 */}
      <Modal
        title="编辑分析主题"
        open={isEditSubjectModalOpen}
        onOk={handleSaveSubject}
        onCancel={() => {
          setIsEditSubjectModalOpen(false);
          subjectForm.resetFields();
          setEditingSubject(null);
        }}
        width={500}
        maskClosable={false}
      >
        <Form form={subjectForm} layout="vertical">
          <Form.Item
            name="name"
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
          >
            <Input.TextArea 
              placeholder="请输入主题描述（可选）" 
              rows={3}
              maxLength={200}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 删除确认弹窗 */}
      <Modal
        title="确认删除"
        open={isDeleteModalOpen}
        onOk={confirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        okText="确认删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <div className="flex items-start">
          <InfoIcon className="w-5 h-5 text-[#FF4D4F] mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[#333333] mb-2">确定要删除这个数据集吗？</p>
            <p className="text-sm text-[#999999]">删除后将无法恢复，请谨慎操作。</p>
          </div>
        </div>
      </Modal>

      {/* 编辑字段备注弹窗 */}
      <Modal
        title={`编辑字段备注 - ${editingField?.name}`}
        open={isEditFieldModalOpen}
        onOk={saveFieldDescription}
        onCancel={() => {
          setIsEditFieldModalOpen(false);
          fieldForm.resetFields();
          setEditingField(null);
        }}
        width={500}
      >
        <Form form={fieldForm} layout="vertical">
          <Form.Item
            name="description"
            label="字段描述"
          >
            <Input.TextArea
              placeholder="请输入字段描述信息"
              rows={4}
              maxLength={200}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AnalysisSubjectV2;