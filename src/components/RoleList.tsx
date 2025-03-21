// src/components/RoleList.tsx
import React, { useState } from 'react';
import { Role } from '../types/models';
import { useAppContext } from '../context/AppContext';
import '../styles/RoleList.css';

interface RoleListProps {
  onViewRole: (roleId: number) => void;
  onCreateRole: () => void;
  onCloneRole: (roleId?: number) => void;
  onEditRole: (roleId: number) => void;
}

const RoleList: React.FC<RoleListProps> = ({
  onViewRole,
  onCreateRole,
  onCloneRole,
  onEditRole
}) => {
  const { roles, getPermissionCountForRole, getUserCountForRole, loading, error } = useAppContext();
  const [filter, setFilter] = useState<string>('');

  if (loading) {
    return <div className="loading">Loading roles...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(filter.toLowerCase())
  );

  // Sort roles: templates first, then alphabetically
  const sortedRoles = [...filteredRoles].sort((a, b) => {
    // Template roles come first
    if (a.isTemplate && !b.isTemplate) return -1;
    if (!a.isTemplate && b.isTemplate) return 1;
    
    // Then alphabetically by name
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="role-list-container">
      <div className="role-list-header">
        <h1>Role Manager</h1>
        <div className="role-actions">
          <button className="btn btn-primary" onClick={onCreateRole}>Create New Role</button>
          <button className="btn btn-secondary" onClick={() => onCloneRole()}>Clone Role</button>
          <div className="search-container">
            <input
              type="text"
              placeholder="Search roles..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </div>

      <div className="role-table-container">
        <table className="role-table">
          <thead>
            <tr>
              <th>Role Name</th>
              <th>Permissions</th>
              <th>Users</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedRoles.map((role) => (
              <tr key={role.id} className={role.isTemplate ? 'template-role' : ''}>
                <td>
                  {role.name}
                  {role.isTemplate && <span className="template-badge">Template</span>}
                </td>
                <td>{getPermissionCountForRole(role.id)}</td>
                <td>{getUserCountForRole(role.id)}</td>
                <td className="action-buttons">
                  <button className="btn btn-view" title="View Role" onClick={() => onViewRole(role.id)}>View</button>
                  <button className="btn btn-clone" title="Clone Role" onClick={() => onCloneRole(role.id)}>Clone</button>
                  {!role.isTemplate && (
                    <button className="btn btn-edit" title="Edit Role" onClick={() => onEditRole(role.id)}>Edit</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RoleList;