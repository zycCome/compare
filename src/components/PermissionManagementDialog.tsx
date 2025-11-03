import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Card, Button, Space, message, Divider, Tag, Popconfirm, Empty } from 'antd';
import { TeamOutlined, DeleteOutlined, PlusOutlined, SearchOutlined, BankOutlined, EyeOutlined, EditOutlined, PlusCircleOutlined, MinusCircleOutlined, SettingOutlined, LoadingOutlined, UserAddOutlined } from '@ant-design/icons';
import AddPermissionDialog, { PermissionLevel, OrganizationPermission, Organization } from './AddPermissionDialog';

const { Option } = Select;

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
  const [operationLoading, setOperationLoading] = useState<string[]>([]);

  // 新增权限弹窗状态
  const [addPermissionDialogOpen, setAddPermissionDialogOpen] = useState(false);

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
      permissionLevel: 'delete'
    }
  ];

  // 权限级别配置
  const permissionLevels = [
    {
      value: 'view' as PermissionLevel,
      label: '👁️ 仅可查看',
      color: '#1890ff',
      description: '仅可查看，不可修改、删除'
    },
    {
      value: 'edit' as PermissionLevel,
      label: '✏️ 可编辑',
      color: '#52c41a',
      description: '可查看/编辑'
    },
    {
      value: 'delete' as PermissionLevel,
      label: '🗑️ 可删除',
      color: '#fa8c16',
      description: '可查看/编辑/删除'
    },
    {
      value: 'manage' as PermissionLevel,
      label: '⚙️ 可管理',
      color: '#722ed1',
      description: '可查看/编辑/删除/权限管理'
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

      setLoading(true);

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 800));

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
      message.error('添加组织权限失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAdd = () => {
    form.resetFields();
    setIsAddingOrg(false);
  };

  const handleDeletePermission = async (organizationId: string) => {
    try {
      setOperationLoading(prev => [...prev, organizationId]);

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));

      setPermissions(prev => prev.filter(perm => perm.organizationId !== organizationId));
      message.success('移除权限成功');
    } catch (error) {
      console.error('删除权限失败:', error);
      message.error('删除权限失败，请重试');
    } finally {
      setOperationLoading(prev => prev.filter(id => id !== organizationId));
    }
  };

  const handlePermissionChange = async (organizationId: string, newLevel: PermissionLevel | 'remove') => {
    if (newLevel === 'remove') {
      handleDeletePermission(organizationId);
      return;
    }

    try {
      setOperationLoading(prev => [...prev, organizationId]);

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));

      setPermissions(prev =>
        prev.map(perm =>
          perm.organizationId === organizationId
            ? { ...perm, permissionLevel: newLevel }
            : perm
        )
      );
      message.success('权限修改成功');
    } catch (error) {
      console.error('权限修改失败:', error);
      message.error('权限修改失败，请重试');
    } finally {
      setOperationLoading(prev => prev.filter(id => id !== organizationId));
    }
  };

  const handleSave = () => {
    // 移除全局保存逻辑，改为实时保存
    // 保留此函数以防止TypeScript错误
    onClose();
  };

  
  // 获取未授权的组织列表
  const getUnauthorizedOrganizations = () => {
    return mockOrganizations.filter(org =>
      !permissions.some(perm => perm.organizationId === org.id)
    );
  };

  // 新增权限弹窗处理函数
  const handleOpenAddPermissionDialog = () => {
    setAddPermissionDialogOpen(true);
  };

  const handleCloseAddPermissionDialog = () => {
    setAddPermissionDialogOpen(false);
  };

  const handleAddPermissions = (newPermissions: OrganizationPermission[]) => {
    setPermissions(prev => [...prev, ...newPermissions]);
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
        <Button key="close" onClick={onClose}>
          关闭
        </Button>,
      ]}
    >
      <div className="space-y-4">
        {/* 顶部操作区域 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <TeamOutlined className="mr-2 text-gray-600" />
            <span className="font-medium">已授权组织</span>
            <Tag className="ml-2">{permissions.length} 个组织</Tag>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={handleOpenAddPermissionDialog}
            >
              新增权限
            </Button>
            <Input
              placeholder="搜索组织"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
          </div>
        </div>

        {/* 已授权组织列表 */}
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
                        <div className="text-sm text-gray-500">共 {permission.memberCount} 个成员</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Select
                        value={permission.permissionLevel}
                        onChange={(value) => handlePermissionChange(permission.organizationId, value)}
                        style={{ width: 200 }}
                        disabled={operationLoading.includes(permission.organizationId)}
                        loading={operationLoading.includes(permission.organizationId)}
                        dropdownRender={(menu) => (
                          <div>
                            {permissionLevels.map(level => (
                              <div
                                key={level.value}
                                onClick={() => !operationLoading.includes(permission.organizationId) && handlePermissionChange(permission.organizationId, level.value)}
                                style={{
                                  padding: '8px 12px',
                                  cursor: operationLoading.includes(permission.organizationId) ? 'not-allowed' : 'pointer',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  color: level.color,
                                  borderRadius: '4px',
                                  opacity: operationLoading.includes(permission.organizationId) ? 0.5 : 1
                                }}
                                onMouseEnter={(e) => {
                                  if (!operationLoading.includes(permission.organizationId)) {
                                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                <div style={{ fontWeight: 500, marginBottom: '2px' }}>
                                  {level.label}
                                </div>
                                <div style={{ fontSize: '12px', color: '#666', lineHeight: '1.3' }}>
                                  {level.description}
                                </div>
                              </div>
                            ))}
                            <div style={{ margin: '4px 0', borderTop: '1px solid #f0f0f0' }} />
                            <div
                              onClick={() => !operationLoading.includes(permission.organizationId) && handlePermissionChange(permission.organizationId, 'remove')}
                              style={{
                                padding: '8px 12px',
                                cursor: operationLoading.includes(permission.organizationId) ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                color: '#ff4d4f',
                                opacity: operationLoading.includes(permission.organizationId) ? 0.5 : 1
                              }}
                              onMouseEnter={(e) => {
                                if (!operationLoading.includes(permission.organizationId)) {
                                  e.currentTarget.style.backgroundColor = '#fff2f0';
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              <span style={{ marginRight: '8px' }}>
                                {operationLoading.includes(permission.organizationId) ? <LoadingOutlined spin /> : '🗑️'}
                              </span>
                              <span>
                                {operationLoading.includes(permission.organizationId) ? '操作中...' : '移除权限'}
                              </span>
                            </div>
                          </div>
                        )}
                      >
                        {permissionLevels.map(level => (
                          <Option key={level.value} value={level.value}>
                            <span style={{ color: level.color }}>
                              {operationLoading.includes(permission.organizationId) && (
                                <LoadingOutlined spin style={{ marginRight: 8 }} />
                              )}
                              {level.label}
                            </span>
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
          <div className="text-center py-8">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                searchText ? '未找到匹配的组织' : '暂无授权组织'
              }
            />
            {!searchText && (
              <div className="mt-4">
                <Button
                  type="primary"
                  icon={<UserAddOutlined />}
                  onClick={handleOpenAddPermissionDialog}
                >
                  添加第一个权限
                </Button>
              </div>
            )}
          </div>
        )}

        </div>

      {/* 新增权限弹窗 */}
      <AddPermissionDialog
        open={addPermissionDialogOpen}
        onClose={handleCloseAddPermissionDialog}
        onAdd={handleAddPermissions}
        existingPermissions={permissions}
        organizations={mockOrganizations}
      />
    </Modal>
  );
};

export default PermissionManagementDialog;