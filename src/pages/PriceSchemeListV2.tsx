import React, { useMemo, useState } from 'react';
import { Card, Button, Table, Tag, Space, Tooltip, Input, Select, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Search } = Input;
const { Option } = Select;

interface SchemeRow {
  id: string;
  status: '启用' | '停用';
  manageOrg: string;
  schemeCode: string;
  schemeName: string;
  modelName: string;
  reportCount: number;
  creator: string;
  updatedAt: string;
}

const PriceSchemeListV2: React.FC = () => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState<string>('');
  const [org, setOrg] = useState<string | undefined>(undefined);

  const data: SchemeRow[] = useMemo(() => [
    { id: '1', status: '启用', manageOrg: '集团', schemeCode: 'CP00001062', schemeName: '华东耗材专题V2', modelName: '供应商比价', reportCount: 2, creator: '管理员', updatedAt: '2025-12-02' },
    { id: '2', status: '启用', manageOrg: '事业部A', schemeCode: 'CP00001061', schemeName: '某型号降价专项', modelName: '供应商比价', reportCount: 4, creator: '管理员', updatedAt: '2025-11-27' },
    { id: '3', status: '停用', manageOrg: '子公司B', schemeCode: 'CP00001059', schemeName: '招采对标复盘', modelName: '供应商比价', reportCount: 0, creator: '张三', updatedAt: '2025-11-17' },
  ], []);

  const filtered = useMemo(() => {
    return data.filter(r => {
      const matchKw = keyword
        ? r.schemeName.includes(keyword) || r.schemeCode.includes(keyword)
        : true;
      const matchOrg = org ? r.manageOrg === org : true;
      return matchKw && matchOrg;
    });
  }, [data, keyword, org]);

  const columns = [
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (v: SchemeRow['status']) => (
      <Tag color={v === '启用' ? 'green' : 'red'}>{v}</Tag>
    ) },
    { title: '管理组织', dataIndex: 'manageOrg', key: 'manageOrg', width: 120 },
    { title: '方案编码', dataIndex: 'schemeCode', key: 'schemeCode', width: 140 },
    { title: '方案名称', dataIndex: 'schemeName', key: 'schemeName', width: 240, render: (text: string) => (
      <Tooltip title={text}><span>{text}</span></Tooltip>
    ) },
    { title: '绑定模型', dataIndex: 'modelName', key: 'modelName', width: 140 },
    {
      title: '报表数量',
      dataIndex: 'reportCount',
      key: 'reportCount',
      width: 100,
      render: (v: number, record: SchemeRow) => (
        <Button
          type="link"
          size="small"
          disabled={v <= 0}
          style={{ padding: 0, height: 'auto' }}
          onClick={() => {
            message.info('跳转到该方案下的报表列表（原型）');
            console.log('open reports for scheme:', record.id);
          }}
        >
          {v}
        </Button>
      )
    },
    { title: '创建人', dataIndex: 'creator', key: 'creator', width: 100 },
    { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 120 },
    {
      title: '操作', key: 'action', fixed: 'right' as const, width: 200,
      render: (_: any, record: SchemeRow) => (
        <Space size="small">
          <Button size="small" type="link" icon={<EditOutlined />} onClick={() => navigate(`/price-scheme-v2/create?id=${record.id}`)}>编辑</Button>
          <Button size="small" type="link" onClick={() => navigate(`/monitoring-management?entry=create&schemeId=${record.id}`)}>创建监控(V1)</Button>
          <Button size="small" type="link" onClick={() => navigate(`/monitoring-task-create-v2?solutionId=${record.id}`)}>创建监控(V2)</Button>
          <Button size="small" type="link" danger icon={<DeleteOutlined />} onClick={() => message.success('已删除(原型)')}>删除</Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Search
            placeholder="搜索：编码、名称"
            allowClear
            onSearch={setKeyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 260 }}
          />
          <Select
            allowClear
            placeholder="管理组织"
            style={{ width: 180 }}
            value={org}
            onChange={setOrg}
          >
            <Option value="集团">集团</Option>
            <Option value="事业部A">事业部A</Option>
            <Option value="子公司B">子公司B</Option>
          </Select>
          <Button onClick={() => message.info('筛选(原型)')}>查询</Button>
        </div>
        <Space>
          <Button onClick={() => navigate('/monitoring-management')}>监控任务</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/price-scheme-v2/create')}>
            新建方案
          </Button>
        </Space>
      </div>

      <Card>
        <Table
          rowKey="id"
          columns={columns as any}
          dataSource={filtered}
          pagination={{ pageSize: 10, showSizeChanger: true, showQuickJumper: true, showTotal: (t) => `共 ${t} 条记录` }}
          scroll={{ x: 1100, y: 600 }}
        />
      </Card>
    </div>
  );
};

export default PriceSchemeListV2;
