import { useState } from 'react';
import { Card, Button, Input, Tag, Table, Space, Tooltip, Typography } from 'antd';
import { Search, Plus, Edit, Trash2, Eye, Database } from 'lucide-react';
import SubjectDialog from '../components/SubjectDialog.tsx';
import DatasetDialog from '../components/DatasetDialog.tsx';

const { Title, Text } = Typography;

interface Subject {
  id: number;
  subjectName: string;
  description: string;
  status: number;
  createName: string;
  createTime: string;
}

const AnalysisSubject = () => {
  const [subjects, setSubjects] = useState([
    {
      id: 1,
      subjectName: '销售分析主题',
      description: '包含销售订单、客户、产品等维度的综合分析',
      status: 1,
      createName: '张三',
      createTime: '2024-01-15 10:30:00'
    },
    {
      id: 2,
      subjectName: '库存分析主题',
      description: '库存周转、库存预警、库存结构分析',
      status: 1,
      createName: '李四',
      createTime: '2024-01-16 14:20:00'
    }
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'view'>('add');
  const [currentSubject, setCurrentSubject] = useState<any>(null);
  
  // 数据集对话框状态
  const [datasetDialogOpen, setDatasetDialogOpen] = useState(false);
  const [datasetDialogMode, setDatasetDialogMode] = useState<'add' | 'edit' | 'view'>('add');
  const [currentDatasetSubject, setCurrentDatasetSubject] = useState<any>(null);

  const handleAdd = () => {
    setDialogMode('add');
    setCurrentSubject(null);
    setDialogOpen(true);
  };

  const handleEdit = (subject: Subject) => {
    setDialogMode('edit');
    setCurrentSubject(subject);
    setDialogOpen(true);
  };

  const handleView = (subject: Subject) => {
    setDialogMode('view');
    setCurrentSubject(subject);
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('确定要删除这个分析主题吗？')) {
      setSubjects(subjects.filter(s => s.id !== id));
    }
  };

  const handleCreateDataset = (subject: any) => {
    setDatasetDialogMode('add');
    setCurrentDatasetSubject(subject);
    setDatasetDialogOpen(true);
  };

  const handleDatasetSave = (formData: any) => {
    // 这里可以添加数据集保存逻辑
    console.log('新建数据集:', {
      ...formData,
      subjectName: currentDatasetSubject?.subjectName,
      subjectUuid: currentDatasetSubject?.id
    });
    setDatasetDialogOpen(false);
  };

  const handleSave = (formData: any) => {
    if (dialogMode === 'add') {
      const newSubject = {
        ...formData,
        id: Math.max(...subjects.map(s => s.id)) + 1,
        createName: '当前用户',
        createTime: new Date().toLocaleString('zh-CN')
      };
      setSubjects([...subjects, newSubject]);
    } else {
      setSubjects(subjects.map(s => 
        s.id === currentSubject?.id 
          ? { ...s, ...formData, updateTime: new Date().toLocaleString('zh-CN') }
          : s
      ));
    }
  };

  const columns = [
    {
      title: '主题名称',
      dataIndex: 'subjectName',
      key: 'subjectName',
      render: (text: string, record: any) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>{text}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.description}
          </Text>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => (
        <Tag color={status === 1 ? 'green' : 'default'}>
          {status === 1 ? '启用' : '停用'}
        </Tag>
      ),
    },
    {
      title: '创建信息',
      key: 'createInfo',
      render: (record: any) => (
        <div>
          <Text style={{ fontSize: 12 }}>创建人: {record.createName}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>创建时间: {record.createTime}</Text>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (record: any) => (
        <Space>
          <Tooltip title="新建数据集">
            <Button type="text" size="small" icon={<Database className="w-4 h-4" />} onClick={() => handleCreateDataset(record)} />
          </Tooltip>
          <Tooltip title="查看详情">
            <Button type="text" size="small" icon={<Eye className="w-4 h-4" />} onClick={() => handleView(record)} />
          </Tooltip>
          <Tooltip title="编辑">
            <Button type="text" size="small" icon={<Edit className="w-4 h-4" />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Tooltip title="删除">
            <Button type="text" size="small" danger icon={<Trash2 className="w-4 h-4" />} onClick={() => handleDelete(record.id)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>分析主题管理</Title>
          <Text type="secondary">管理和组织您的数据分析主题</Text>
        </div>
        <Button type="primary" icon={<Plus className="w-4 h-4" />} onClick={handleAdd}>
          新建主题
        </Button>
      </div>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="搜索主题名称或描述..."
            prefix={<Search className="w-4 h-4" />}
            style={{ width: 300 }}
          />
        </div>
        
        <Table
          columns={columns}
          dataSource={subjects}
          rowKey="id"
          pagination={false}
        />
      </Card>
      
      <SubjectDialog
        open={dialogOpen}
        mode={dialogMode}
        subject={currentSubject}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />
      
      <DatasetDialog
        open={datasetDialogOpen}
        mode={datasetDialogMode}
        dataset={null}
        onClose={() => setDatasetDialogOpen(false)}
        onSave={handleDatasetSave}
        preSelectedSubject={currentDatasetSubject}
      />
    </div>
  );
};

export default AnalysisSubject;
