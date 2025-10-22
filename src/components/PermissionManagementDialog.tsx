import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Card, Button, Space, message, Divider, Tag, Popconfirm, Empty } from 'antd';
import { TeamOutlined, DeleteOutlined, PlusOutlined, SearchOutlined, BankOutlined, EyeOutlined, EditOutlined, PlusCircleOutlined, MinusCircleOutlined, SettingOutlined } from '@ant-design/icons';

const { Option } = Select;

// 权限级别枚举
type PermissionLevel = 'view' | 'edit' | 'add_delete' | 'manage';

// 组织权限接口
interface OrganizationPermission {
  id: string;
  organizationId: string;
  organizationName: string;
  memberCount: number;
  permissionLevel: PermissionLevel;
}

// 组织信息接口
interface Organization {
  id: string;
  name: string;
  memberCount: number;
  parentId?: string;
  level: number;
}

interface PermissionManagementDialogProps {
  open: boolean;
  reportId?: string;
  reportName?: string;
  onClose: () => void;
  onSave: (permissions: OrganizationPermission[]) => void;
}

const PermissionManagementDialog: React.FC<PermissionManagementDialogProps> = ({
  open,
  reportId,
  reportName,
  onClose,
  onSave
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState<OrganizationPermission[]>([]);
  const [isAddingOrg, setIsAddingOrg] = useState(false);
  const [searchText, setSearchText] = useState('');

  // 模拟组织数据
  const mockOrganizations: Organization[] = [
    { id: 'org1', name: '销售部', memberCount: 15, level: 1 },
    { id: 'org2', name: '财务部', memberCount: 8, level: 1 },
    { id: 'org3', name: '采购部', memberCount: 12, level: 1 },
    { id: 'org4', name: '人事部', memberCount: 6, level: 1 },
    { id: 'org5', name: '技术部', memberCount: 20, level: 1 },
    { id: 'org6', name: '质检部', memberCount: 10, level: 1 },
  ];

  // 模拟初始权限数据
  const mockPermissions: OrganizationPermission[] = [
    {
      id: 'perm1',
      organizationId: 'org1',
      organizationName: '销售部',
      memberCount: 15,
      permissionLevel: 'edit'
    },
    {
      id: 'perm2',
      organizationId: 'org2',
      organizationName: '财务部',
      memberCount: 8,
      permissionLevel: 'view'
    },
    {
      id: 'perm3',
      organizationId: 'org3',
      organizationName: '采购部',
      memberCount: 12,
      permissionLevel: 'add_delete'
    }
  ];

  // 权限级别配置
  const permissionLevels = [
    {
      value: 'view' as PermissionLevel,
      label: '👁️ 可查看',
      color: '#1890ff',
      description: '可查看报表内容和数据'
    },
    {
      value: 'edit' as PermissionLevel,
      label: '✏️ 可编辑',
      color: '#52c41a',
      description: '可修改报表配置、筛选条件等'
    },
    {
      value: 'add_delete' as PermissionLevel,
      label: '➕🗑️ 可新增/删除',
      color: '#fa8c16',
      description: '可对报表数据进行增删操作'
    },
    {
      value: 'manage' as PermissionLevel,
      label: '⚙️ 可管理',
      color: '#722ed1',
      description: '可管理该报表的权限设置'
    }
  ];

  useEffect(() => {
    if (open) {
      setPermissions(mockPermissions);
      form.resetFields();
      setIsAddingOrg(false);
      setSearchText('');
    }
  }, [open, form]);

  const handleAddOrganization = () => {
    setIsAddingOrg(true);
  };

  const handleSaveOrganization = async () => {
    try {
      const values = await form.validateFields();
      const selectedOrg = mockOrganizations.find(org => org.id === values.organizationId);

      if (!selectedOrg) {
        message.error('请选择组织');
        return;
      }

      // 检查组织是否已存在
      if (permissions.some(perm => perm.organizationId === selectedOrg.id)) {
        message.error('该组织已存在权限配置');
        return;
      }

      const newPermission: OrganizationPermission = {
        id: `perm_${Date.now()}`,
        organizationId: selectedOrg.id,
        organizationName: selectedOrg.name,
        memberCount: selectedOrg.memberCount,
        permissionLevel: values.permissionLevel || 'view'
      };

      setPermissions(prev => [...prev, newPermission]);
      form.resetFields();
      setIsAddingOrg(false);
      message.success('添加组织权限成功');
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  const handleCancelAdd = () => {
    form.resetFields();
    setIsAddingOrg(false);
  };

  const handleDeletePermission = (organizationId: string) => {
    setPermissions(prev => prev.filter(perm => perm.organizationId !== organizationId));
    message.success('移除权限成功');
  };

  const handlePermissionChange = (organizationId: string, newLevel: PermissionLevel | 'remove') => {
    if (newLevel === 'remove') {
      handleDeletePermission(organizationId);
      return;
    }

    setPermissions(prev =>
      prev.map(perm =>
        perm.organizationId === organizationId
          ? { ...perm, permissionLevel: newLevel }
          : perm
      )
    );
    message.success('权限修改成功');
  };

  const handleSave = () => {
    onSave(permissions);
    message.success('权限配置保存成功');
    onClose();
  };

  // 权限下拉菜单渲染
  const renderPermissionDropdown = (menu: React.ReactNode) => (
    <div>
      {permissionLevels.map(level => (
        <div
          key={level.value}
          onClick={() => {
            // 这里会在具体的组织卡片中处理
          }}
          style={{
            padding: '8px 12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            color: level.color
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f5f5f5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <span style={{ marginRight: '8px' }}>{level.label.split(' ')[0]}</span>
          <span>{level.label.split(' ')[1]}</span>
        </div>
      ))}
      <div style={{ margin: '4px 0', borderTop: '1px solid #f0f0f0' }} />
      <div
        style={{
          padding: '8px 12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          color: '#ff4d4f'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#fff2f0';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <span style={{ marginRight: '8px' }}>🗑️</span>
        <span>移除权限</span>
      </div>
    </div>
  );

  // 过滤后的权限列表
  const filteredPermissions = permissions.filter(perm =>
    perm.organizationName.toLowerCase().includes(searchText.toLowerCase())
  );

  // 获取权限级别显示文本和颜色
  const getPermissionDisplay = (level: PermissionLevel) => {
    const config = permissionLevels.find(p => p.value === level);
    return config || { label: '未知权限', color: '#666' };
  };

  return (
    <Modal
      title={
        <div className="flex items-center">
          <TeamOutlined className="mr-2" />
          权限管理
        </div>
      }
      open={open}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="save" type="primary" onClick={handleSave}>
          保存权限配置
        </Button>,
      ]}
    >
      <div className="space-y-4">
        {/* 添加组织区域 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <BankOutlined className="mr-2 text-gray-600" />
              <span className="font-medium">添加组织权限</span>
            </div>
            {!isAddingOrg && (
              <Button
                type="dashed"
                size="small"
                icon={<PlusOutlined />}
                onClick={handleAddOrganization}
              >
                添加组织
              </Button>
            )}
          </div>

          {isAddingOrg && (
            <Form
              form={form}
              layout="inline"
              className="space-y-3"
            >
              <Form.Item
                name="organizationId"
                rules={[{ required: true, message: '请选择组织' }]}
                className="flex-1 mb-0"
              >
                <Select
                  placeholder="选择组织"
                  style={{ width: '100%' }}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {mockOrganizations.map(org => (
                    <Option
                      key={org.id}
                      value={org.id}
                      disabled={permissions.some(p => p.organizationId === org.id)}
                    >
                      <div>
                        <div>{org.name}</div>
                        <div className="text-xs text-gray-500">共 {org.memberCount} 个成员</div>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="permissionLevel"
                rules={[{ required: true, message: '请选择权限级别' }]}
                className="mb-0"
              >
                <Select placeholder="选择权限级别" style={{ width: 160 }}>
                  {permissionLevels.map(level => (
                    <Option key={level.value} value={level.value}>
                      {level.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <div className="flex space-x-2">
                <Button type="primary" size="small" onClick={handleSaveOrganization}>
                  确定
                </Button>
                <Button size="small" onClick={handleCancelAdd}>
                  取消
                </Button>
              </div>
            </Form>
          )}
        </div>

        <Divider className="my-4" />

        {/* 已授权组织列表 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <TeamOutlined className="mr-2 text-gray-600" />
              <span className="font-medium">已授权组织</span>
              <Tag className="ml-2">{permissions.length} 个组织</Tag>
            </div>

            <Input
              placeholder="搜索组织"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
          </div>

          {filteredPermissions.length > 0 ? (
            <div className="space-y-3">
              {filteredPermissions.map(permission => {
                const displayConfig = getPermissionDisplay(permission.permissionLevel);
                return (
                  <Card key={permission.id} size="small" className="permission-card">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <BankOutlined className="text-blue-600 text-lg" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{permission.organizationName}</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Select
                          value={permission.permissionLevel}
                          onChange={(value) => handlePermissionChange(permission.organizationId, value)}
                          style={{ width: 160 }}
                          dropdownRender={(menu) => (
                            <div>
                              {permissionLevels.map(level => (
                                <div
                                  key={level.value}
                                  onClick={() => handlePermissionChange(permission.organizationId, level.value)}
                                  style={{
                                    padding: '8px 12px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    color: level.color
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }}
                                >
                                  <span style={{ marginRight: '8px' }}>{level.label.split(' ')[0]}</span>
                                  <span>{level.label.split(' ')[1]}</span>
                                </div>
                              ))}
                              <div style={{ margin: '4px 0', borderTop: '1px solid #f0f0f0' }} />
                              <div
                                onClick={() => handlePermissionChange(permission.organizationId, 'remove')}
                                style={{
                                  padding: '8px 12px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  color: '#ff4d4f'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#fff2f0';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                <span style={{ marginRight: '8px' }}>🗑️</span>
                                <span>移除权限</span>
                              </div>
                            </div>
                          )}
                        >
                          {permissionLevels.map(level => (
                            <Option key={level.value} value={level.value}>
                              <span style={{ color: level.color }}>{level.label}</span>
                            </Option>
                          ))}
                        </Select>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                searchText ? '未找到匹配的组织' : '暂无授权组织'
              }
              className="py-8"
            />
          )}
        </div>

              </div>
    </Modal>
  );
};

export default PermissionManagementDialog;