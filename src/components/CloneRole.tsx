// src/components/CloneRole.tsx
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { SqlGenerator } from '../utils/sqlGenerator';
import '../styles/CloneRole.css';

interface CloneRoleProps {
  onClose: () => void;
  onCloned: () => void;
}

const CloneRole: React.FC<CloneRoleProps> = ({ onClose, onCloned }) => {
  const { roles } = useAppContext();
  
  const [selectedRoleId, setSelectedRoleId] = useState<number | ''>('');
  const [newRoleName, setNewRoleName] = useState('');
  const [customizePermissions, setCustomizePermissions] = useState(false);
  const [generatedSql, setGeneratedSql] = useState('');
  
  // Filter for template roles first (for dropdown)
  const templateRoles = roles.filter(role => role.isTemplate);
  const otherRoles = roles.filter(role => !role.isTemplate);
  
  // Generate SQL when selections change
  const handleGenerateSql = () => {
    if (selectedRoleId === '' || !newRoleName.trim()) {
      return;
    }
    
    const sql = SqlGenerator.generateCloneRoleScript(
      Number(selectedRoleId),
      newRoleName
    );
    
    setGeneratedSql(sql);
  };
  
  // Handle role selection
  const handleRoleSelect = (roleId: string) => {
    setSelectedRoleId(roleId);
    
    // Set a default name based on selected role
    if (roleId) {
      const selectedRole = roles.find(r => r.id === Number(roleId));
      if (selectedRole) {
        setNewRoleName(`Copy of ${selectedRole.name}`);
      }
    } else {
      setNewRoleName('');
    }
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
  
  // Handle clone button click
  const handleClone = () => {
    handleGenerateSql();
    if (!customizePermissions) {
      onCloned();
    }
  };
  
  return (
    <div className="clone-role-container">
      <div className="clone-role-header">
        <h2>Clone Role</h2>
        <div className="close-button" onClick={onClose}>&times;</div>
      </div>
      
      <div className="clone-role-content">
        <div className="form-group">
          <label htmlFor="templateRole">Template Role:</label>
          <select
            id="templateRole"
            value={selectedRoleId}
            onChange={(e) => handleRoleSelect(e.target.value)}
            className="select-role"
          >
            <option value="">-- Select a role --</option>
            
            {templateRoles.length > 0 && (
              <optgroup label="Templates">
                {templateRoles.map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </optgroup>
            )}
            
            {otherRoles.length > 0 && (
              <optgroup label="Other Roles">
                {otherRoles.map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="newRoleName">New Role Name:</label>
          <input
            type="text"
            id="newRoleName"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            className="input-role-name"
          />
        </div>
        
        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={customizePermissions}
              onChange={(e) => setCustomizePermissions(e.target.checked)}
            />
            Customize permissions before saving
          </label>
        </div>
        
        {!customizePermissions && (
          <div className="sql-preview">
            <div className="sql-preview-header">
              <h3>SQL Preview</h3>
              <button 
                className="btn btn-copy" 
                onClick={copySqlToClipboard}
                disabled={!generatedSql}
              >
                Copy to Clipboard
              </button>
            </div>
            <pre className="sql-content">
              {generatedSql || 'Click "Generate SQL" to preview the SQL statements.'}
            </pre>
            <button 
              className="btn btn-generate-sql" 
              onClick={handleGenerateSql}
              disabled={!selectedRoleId || !newRoleName.trim()}
            >
              Generate SQL
            </button>
          </div>
        )}
      </div>
      
      <div className="clone-role-footer">
        <button className="btn btn-cancel" onClick={onClose}>Cancel</button>
        <button 
          className="btn btn-clone" 
          onClick={handleClone}
          disabled={!selectedRoleId || !newRoleName.trim()}
        >
          {customizePermissions ? 'Continue to Edit Permissions' : 'Clone Role'}
        </button>
      </div>
    </div>
  );
};

export default CloneRole;