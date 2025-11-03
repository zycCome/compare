import React, { useState, useEffect } from 'react';
import { Modal, Transfer, Select, Button, message, Space, Tag } from 'antd';
import { PlusCircleOutlined, LoadingOutlined } from '@ant-design/icons';

const { Option } = Select;

// 权限级别枚举
export type PermissionLevel = 'view' | 'edit' | 'delete' | 'manage';

// 组织信息接口
export interface Organization {
  id: string;
  name: string;
  memberCount: number;
  parentId?: string;
  level: number;
}

// 组织权限接口
export interface OrganizationPermission {
  id: string;
  organizationId: string;
  organizationName: string;
  memberCount: number;
  permissionLevel: PermissionLevel;
}

interface SelectedOrganization {
  id: string;
  name: string;
  memberCount: number;
  permissionLevel: PermissionLevel;
}

interface AddPermissionDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (permissions: OrganizationPermission[]) => void;
  existingPermissions: OrganizationPermission[];
  organizations: Organization[];
}

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

const AddPermissionDialog: React.FC<AddPermissionDialogProps> = ({
  open,
  onClose,
  onAdd,
  existingPermissions,
  organizations
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);
  const [selectedOrgsWithPermissions, setSelectedOrgsWithPermissions] = useState<SelectedOrganization[]>([]);

  // 获取未授权的组织列表
  const getUnauthorizedOrganizations = () => {
    return organizations.filter(org =>
      !existingPermissions.some(perm => perm.organizationId === org.id)
    );
  };

  useEffect(() => {
    if (open) {
      setSelectedOrgs([]);
      setSelectedOrgsWithPermissions([]);
    }
  }, [open]);

  // Transfer组件的onChange处理
  const handleTransferChange = (targetKeys: string[]) => {
    setSelectedOrgs(targetKeys);

    // 更新已选组织的权限设置
    const newSelectedOrgsWithPermissions: SelectedOrganization[] = targetKeys.map(orgId => {
      const org = organizations.find(o => o.id === orgId);
      const existing = selectedOrgsWithPermissions.find(item => item.id === orgId);

      return {
        id: orgId,
        name: org?.name || '',
        memberCount: org?.memberCount || 0,
        permissionLevel: existing?.permissionLevel || 'view'
      };
    });

    setSelectedOrgsWithPermissions(newSelectedOrgsWithPermissions);
  };

  // 单个组织权限变更
  const handleOrgPermissionChange = (orgId: string, permissionLevel: PermissionLevel) => {
    setSelectedOrgsWithPermissions(prev =>
      prev.map(org =>
        org.id === orgId ? { ...org, permissionLevel } : org
      )
    );
  };

  
  const handleAdd = async () => {
    if (selectedOrgsWithPermissions.length === 0) {
      message.warning('请选择要添加的组织');
      return;
    }

    // 检查是否所有组织都设置了权限
    const hasUnsetPermissions = selectedOrgsWithPermissions.some(org => !org.permissionLevel || org.permissionLevel === '');
    if (hasUnsetPermissions) {
      message.warning('请为所有选中的组织设置权限级别');
      return;
    }

    try {
      setLoading(true);

      // 检查权限冲突（理论上不应该有，因为我们只显示未授权的组织）
      const conflictingOrgs = selectedOrgsWithPermissions.filter(org =>
        existingPermissions.some(perm => perm.organizationId === org.id)
      );

      if (conflictingOrgs.length > 0) {
        message.error('选中的组织中已存在权限配置，请重新选择');
        return;
      }

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 800));

      const newPermissions = selectedOrgsWithPermissions.map(org => ({
        id: `perm_${Date.now()}_${org.id}`,
        organizationId: org.id,
        organizationName: org.name,
        memberCount: org.memberCount,
        permissionLevel: org.permissionLevel
      }));

      onAdd(newPermissions);
      message.success(`成功为 ${selectedOrgsWithPermissions.length} 个组织设置权限`);
      onClose();
    } catch (error) {
      console.error('添加权限失败:', error);
      message.error('添加权限失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const unauthorizedOrgs = getUnauthorizedOrganizations();

  return (
    <Modal
      title={
        <div className="flex items-center">
          <PlusCircleOutlined className="mr-2 text-blue-600" />
          新增权限
        </div>
      }
      open={open}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={loading}>
          取消
        </Button>,
        <Button
          key="confirm"
          type="primary"
          onClick={handleAdd}
          loading={loading}
          disabled={selectedOrgsWithPermissions.length === 0}
        >
          确认添加 ({selectedOrgsWithPermissions.length})
        </Button>,
      ]}
    >
      <div className="space-y-6">
        {/* 说明文字 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">
            选择需要授权的组织，为每个组织独立设置权限级别。只有未授权的组织会出现在可选列表中。
          </p>
        </div>

        {/* 组织选择 */}
        <div>
          <div className="text-sm font-medium text-gray-700 mb-3">第一步：选择组织</div>
          {unauthorizedOrgs.length > 0 ? (
            <Transfer
              dataSource={unauthorizedOrgs.map(org => ({
                key: org.id,
                title: org.name
              }))}
              targetKeys={selectedOrgs}
              onChange={handleTransferChange}
              render={item => (
                <div className="font-medium">{item.title}</div>
              )}
              oneWay
              listStyle={{
                width: 300,
                height: 250,
              }}
              titles={[`可选组织 (${unauthorizedOrgs.length})`, `已选组织 (${selectedOrgs.length})`]}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">
              所有组织均已设置权限，无需添加新的权限配置
            </div>
          )}
        </div>

        {/* 已选组织的权限设置 */}
        {selectedOrgsWithPermissions.length > 0 && (
          <div>
            <div className="text-sm font-medium text-gray-700 mb-3">
              第二步：设置权限级别
            </div>

            <div className="space-y-3">
              {selectedOrgsWithPermissions.map(org => {
                const levelConfig = permissionLevels.find(l => l.value === org.permissionLevel);
                return (
                  <div key={org.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center mr-3">
                        <span className="text-blue-600 text-xs font-medium">
                          {org.name.charAt(0)}
                        </span>
                      </div>
                      <div className="font-medium text-gray-900">{org.name}</div>
                    </div>

                    <Select
                      value={org.permissionLevel}
                      onChange={(value) => handleOrgPermissionChange(org.id, value)}
                      style={{ width: 200 }}
                      size="small"
                      dropdownRender={(menu) => (
                        <div>
                          {permissionLevels.map(level => (
                            <div
                              key={level.value}
                              onClick={() => handleOrgPermissionChange(org.id, level.value)}
                              style={{
                                padding: '8px 12px',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                color: level.color,
                                borderRadius: '4px'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#f5f5f5';
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
                );
              })}
            </div>
          </div>
        )}

        </div>
    </Modal>
  );
};

export default AddPermissionDialog;