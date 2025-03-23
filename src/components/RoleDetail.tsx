// src/components/RoleDetail.tsx
import React, { useState, useEffect } from 'react';
import { RolePermission } from '../types/models';
import { useAppContext } from '../context/AppContext';
import { SqlGenerator } from '../utils/sqlGenerator';
import '../styles/RoleDetail.css';

interface RoleDetailProps {
  roleId: number | null;
  isNewRole?: boolean;
  isCloning?: boolean;
  sourceRoleId?: number;
  onClose: () => void;
  onSave: () => void;
}

const RoleDetail: React.FC<RoleDetailProps> = ({
  roleId,
  isNewRole = false,
  isCloning = false,
  sourceRoleId,
  onClose,
  onSave,
}) => {
  const { 
    hierarchy,
    getRoleById,
    getPermissionsForRole
  } = useAppContext();
  
  // State for role properties
  const [roleName, setRoleName] = useState('');
  const [originalRoleName, setOriginalRoleName] = useState('');
  const [isEditing, setIsEditing] = useState(isNewRole || isCloning);
  
  // Permission selection state
  const [selectedModules, setSelectedModules] = useState<Record<number, boolean>>({});
  const [selectedPages, setSelectedPages] = useState<Record<number, boolean>>({});
  const [selectedOperations, setSelectedOperations] = useState<Record<number, boolean>>({});
  
  // SQL preview
  const [generatedSql, setGeneratedSql] = useState('');
  
  // Permission map for tracking existing permissions
  const [permissionMap, setPermissionMap] = useState<Record<string, RolePermission>>({});
  
  // Load role data
  useEffect(() => {
    if (isNewRole || !roleId) {
      const defaultName = isCloning && sourceRoleId 
        ? `Copy of ${getRoleById(sourceRoleId)?.name || ''}` 
        : 'New Role';
      
      setRoleName(defaultName);
      setOriginalRoleName(defaultName);
      setIsEditing(true);
      return;
    }
    
    const role = getRoleById(roleId);
    if (role) {
      setRoleName(role.name);
      setOriginalRoleName(role.name);
      setIsEditing(isNewRole || isCloning);
    }
    
    // Load permissions
    const permissions = getPermissionsForRole(isCloning && sourceRoleId ? sourceRoleId : roleId);
    
    // Reset selection state
    const modulesMap: Record<number, boolean> = {};
    const pagesMap: Record<number, boolean> = {};
    const operationsMap: Record<number, boolean> = {};
    const permMap: Record<string, RolePermission> = {};
    
    // Process module permissions
    permissions.filter(p => p.moduleId !== null && p.pageId === null && p.operationId === null)
      .forEach(p => {
        if (p.moduleId !== null) {
          modulesMap[p.moduleId] = true;
          permMap[`module_${p.moduleId}`] = p;
        }
      });
    
    // Process page permissions
    permissions.filter(p => p.pageId !== null && p.operationId === null)
      .forEach(p => {
        if (p.pageId !== null) {
          pagesMap[p.pageId] = true;
          permMap[`page_${p.pageId}`] = p;
        }
      });
    
    // Process operation permissions
    permissions.filter(p => p.operationId !== null)
      .forEach(p => {
        if (p.operationId !== null) {
          operationsMap[p.operationId] = true;
          permMap[`operation_${p.operationId}`] = p;
        }
      });
    
    setSelectedModules(modulesMap);
    setSelectedPages(pagesMap);
    setSelectedOperations(operationsMap);
    setPermissionMap(permMap);
    
  }, [roleId, isNewRole, isCloning, sourceRoleId, getRoleById, getPermissionsForRole]);
  
  // Generate SQL when selections change
  useEffect(() => {
    if (isNewRole || isCloning) {
      const moduleIds = Object.entries(selectedModules)
        .filter(([, selected]) => selected)
        .map(([id]) => parseInt(id, 10));
      
      const pageIds = Object.entries(selectedPages)
        .filter(([, selected]) => selected)
        .map(([id]) => parseInt(id, 10));
      
      const operationIds = Object.entries(selectedOperations)
        .filter(([, selected]) => selected)
        .map(([id]) => parseInt(id, 10));
      
      const sql = isCloning && sourceRoleId 
        ? SqlGenerator.generateCloneRoleScript(sourceRoleId, roleName)
        : SqlGenerator.generateCreateRoleScript({ name: roleName, status: 0 }, moduleIds, pageIds, operationIds);
      
      setGeneratedSql(sql);
    } else if (roleId) {
      // Determine changes for existing role
      const toAdd = {
        moduleIds: [] as number[],
        pageIds: [] as number[],
        operationIds: [] as number[]
      };
      
      const toRemove: RolePermission[] = [];
      
      // Find modules to add
      Object.entries(selectedModules)
        .filter(([, selected]) => selected)
        .forEach(([id]) => {
          const moduleId = parseInt(id, 10);
          const key = `module_${moduleId}`;
          if (!permissionMap[key]) {
            toAdd.moduleIds.push(moduleId);
          }
        });
      
      // Find pages to add
      Object.entries(selectedPages)
        .filter(([, selected]) => selected)
        .forEach(([id]) => {
          const pageId = parseInt(id, 10);
          const key = `page_${pageId}`;
          if (!permissionMap[key]) {
            toAdd.pageIds.push(pageId);
          }
        });
      
      // Add SQL for role rename if needed
      let sql = '';
      const role = getRoleById(roleId);
      if (role && role.name !== roleName && isEditing) {
        sql += `-- Rename role\nUPDATE ROLES SET RoleName = '${roleName}' WHERE RoleId = ${roleId};\n\n`;
      }
      
      // Find operations to add
      Object.entries(selectedOperations)
        .filter(([, selected]) => selected)
        .forEach(([id]) => {
          const operationId = parseInt(id, 10);
          const key = `operation_${operationId}`;
          if (!permissionMap[key]) {
            toAdd.operationIds.push(operationId);
          }
        });
      
      // Find permissions to remove
      Object.entries(permissionMap).forEach(([key, permission]) => {
        if (key.startsWith('module_')) {
          const moduleId = parseInt(key.replace('module_', ''), 10);
          if (!selectedModules[moduleId]) {
            toRemove.push(permission);
          }
        } else if (key.startsWith('page_')) {
          const pageId = parseInt(key.replace('page_', ''), 10);
          if (!selectedPages[pageId]) {
            toRemove.push(permission);
          }
        } else if (key.startsWith('operation_')) {
          const operationId = parseInt(key.replace('operation_', ''), 10);
          if (!selectedOperations[operationId]) {
            toRemove.push(permission);
          }
        }
      });
      
      if (toAdd.moduleIds.length > 0 || toAdd.pageIds.length > 0 || toAdd.operationIds.length > 0 || toRemove.length > 0 || sql !== '') {
        if (sql === '') {
          sql = SqlGenerator.generatePermissionsChangeScript(roleId, toAdd, toRemove);
        } else {
          sql += SqlGenerator.generatePermissionsChangeScript(roleId, toAdd, toRemove);
        }
        setGeneratedSql(sql);
      } else {
        setGeneratedSql('-- No changes to save');
      }
    }
  }, [isNewRole, isCloning, roleId, sourceRoleId, roleName, selectedModules, selectedPages, selectedOperations, permissionMap, getRoleById, isEditing]);
  
  // Handle checkbox changes
  const handleModuleChange = (moduleId: number, checked: boolean) => {
    // Update module selection
    setSelectedModules(prev => ({
      ...prev,
      [moduleId]: checked
    }));
    
    // If module is checked, also check all its pages
    if (checked) {
      const module = hierarchy.find(m => m.id === moduleId);
      if (module) {
        const newPageSelections = { ...selectedPages };
        const newOperationSelections = { ...selectedOperations };
        
        module.pages.forEach(page => {
          newPageSelections[page.id] = true;
          
          // Also select all operations for each page
          page.operations.forEach(operation => {
            newOperationSelections[operation.id] = true;
          });
        });
        
        setSelectedPages(newPageSelections);
        setSelectedOperations(newOperationSelections);
      }
    }
    // If module is unchecked, also uncheck all its pages
    else {
      const module = hierarchy.find(m => m.id === moduleId);
      if (module) {
        const newPageSelections = { ...selectedPages };
        const newOperationSelections = { ...selectedOperations };
        
        module.pages.forEach(page => {
          newPageSelections[page.id] = false;
          
          // Also unselect all operations for each page
          page.operations.forEach(operation => {
            newOperationSelections[operation.id] = false;
          });
        });
        
        setSelectedPages(newPageSelections);
        setSelectedOperations(newOperationSelections);
      }
    }
  };
  
  const handlePageChange = (pageId: number, checked: boolean) => {
    // Update page selection
    setSelectedPages(prev => ({
      ...prev,
      [pageId]: checked
    }));
    
    // Find the page and its operations
    let pageOperations: number[] = [];
    for (const module of hierarchy) {
      const page = module.pages.find(p => p.id === pageId);
      if (page) {
        pageOperations = page.operations.map(op => op.id);
        
        // Update module selection based on all pages
        const modulePages = module.pages.map(p => p.id);
        const allPagesSelected = modulePages.every(p => p === pageId ? checked : selectedPages[p]);
        setSelectedModules(prev => ({
          ...prev,
          [module.id]: allPagesSelected
        }));
        
        break;
      }
    }
    
    // Update operations based on page selection
    if (pageOperations.length > 0) {
      const newOperationSelections = { ...selectedOperations };
      pageOperations.forEach(opId => {
        newOperationSelections[opId] = checked;
      });
      setSelectedOperations(newOperationSelections);
    }
  };
  
  const handleOperationChange = (operationId: number, pageId: number, checked: boolean) => {
    // Update operation selection
    setSelectedOperations(prev => ({
      ...prev,
      [operationId]: checked
    }));
    
    // Find the page and its module
    for (const module of hierarchy) {
      const page = module.pages.find(p => p.id === pageId);
      if (page) {
        // Check if all operations for this page are selected/deselected
        const pageOperations = page.operations.map(op => op.id);
        const allOpsSelected = pageOperations.every(op => op === operationId ? checked : selectedOperations[op]);
        
        // Update page selection accordingly
        setSelectedPages(prev => ({
          ...prev,
          [pageId]: allOpsSelected
        }));
        
        // Also update module selection if needed
        const modulePages = module.pages.map(p => p.id);
        const allPagesSelected = modulePages.every(p => {
          if (p === pageId) {
            return allOpsSelected;
          } else {
            return selectedPages[p];
          }
        });
        
        setSelectedModules(prev => ({
          ...prev,
          [module.id]: allPagesSelected
        }));
        
        break;
      }
    }
  };
  
  // Handle "Select All" functionality
  const handleSelectAll = (checked: boolean) => {
    const newModuleSelections: Record<number, boolean> = {};
    const newPageSelections: Record<number, boolean> = {};
    const newOperationSelections: Record<number, boolean> = {};
    
    hierarchy.forEach(module => {
      newModuleSelections[module.id] = checked;
      
      module.pages.forEach(page => {
        newPageSelections[page.id] = checked;
        
        page.operations.forEach(operation => {
          newOperationSelections[operation.id] = checked;
        });
      });
    });
    
    setSelectedModules(newModuleSelections);
    setSelectedPages(newPageSelections);
    setSelectedOperations(newOperationSelections);
  };
  
  // Calculate if "Select All" should be checked
  const isAllSelected = () => {
    return hierarchy.every(module => selectedModules[module.id]);
  };
  
  // Copy SQL to clipboard
  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(generatedSql)
      .then(() => {
        alert('SQL copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy SQL: ', err);
        alert('Failed to copy SQL to clipboard');
      });
  };

  // Toggle editing mode for role name
  const toggleEditing = () => {
    if (!isNewRole && !isCloning) {
      if (isEditing) {
        // Cancel editing - revert to original name
        setRoleName(originalRoleName);
        setIsEditing(false);
      } else {
        // Start editing
        setIsEditing(true);
      }
    }
  };
  
  // Handle the save action
  const handleSave = () => {
    if (isEditing && !isNewRole && !isCloning) {
      // Update the original role name when saving
      setOriginalRoleName(roleName);
    }
    onSave();
  };
  
  return (
    <div className="role-detail">
      <div className="role-detail-header">
        <h2>{isNewRole ? (isCloning ? 'Clone Role' : 'Create New Role') : 'Edit Role'}</h2>
        <div className="close-button" onClick={onClose}>&times;</div>
      </div>
      
      <div className="role-detail-content">
        <div className="role-properties">
          <div className="form-group">
            <label htmlFor="roleName">Role Name:</label>
            <div className="role-name-edit-container">
              <input
                type="text"
                id="roleName"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                disabled={!isEditing}
                className={isEditing ? "" : "disabled-input"}
              />
              {!isNewRole && !isCloning && (
                <button 
                  className="btn btn-edit role-name-edit-btn" 
                  onClick={toggleEditing}
                  title={isEditing ? "Cancel editing" : "Edit role name"}
                >
                  {isEditing ? "Cancel" : "Rename"}
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className="permissions-section">
          <div className="permissions-header">
            <h3>Permissions</h3>
            <div className="select-all">
              <label>
                <input
                  type="checkbox"
                  checked={isAllSelected()}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
                Select All
              </label>
            </div>
          </div>
          
          <div className="permissions-tree">
            {hierarchy.map(module => (
              <div key={module.id} className="module-item">
                <div className="module-header">
                  <label>
                    <input
                      type="checkbox"
                      checked={!!selectedModules[module.id]}
                      onChange={(e) => handleModuleChange(module.id, e.target.checked)}
                    />
                    <strong>{module.name}</strong>
                  </label>
                </div>
                
                <div className="module-pages">
                  {module.pages.map(page => (
                    <div key={page.id} className="page-item">
                      <div className="page-header">
                        <label>
                          <input
                            type="checkbox"
                            checked={!!selectedPages[page.id]}
                            onChange={(e) => handlePageChange(page.id, e.target.checked)}
                          />
                          {page.name}
                        </label>
                      </div>
                      
                      {page.operations.length > 0 && (
                        <div className="page-operations">
                          {page.operations.map(operation => (
                            <div key={operation.id} className="operation-item">
                              <label>
                                <input
                                  type="checkbox"
                                  checked={!!selectedOperations[operation.id]}
                                  onChange={(e) => handleOperationChange(operation.id, page.id, e.target.checked)}
                                />
                                {operation.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="sql-preview">
          <div className="sql-preview-header">
            <h3>SQL Preview</h3>
            <button className="btn btn-copy" onClick={copySqlToClipboard}>Copy to Clipboard</button>
          </div>
          <pre className="sql-content">{generatedSql}</pre>
        </div>
      </div>
      
      <div className="role-detail-footer">
        <button className="btn btn-cancel" onClick={onClose}>Cancel</button>
        <button 
          className="btn btn-save" 
          onClick={handleSave} 
          disabled={!roleName.trim()}
        >
          {isNewRole ? 'Create Role' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default RoleDetail;