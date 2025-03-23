// src/components/CloneRole.tsx
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { SqlGenerator } from '../utils/sqlGenerator';
import '../styles/CloneRole.css';

interface CloneRoleProps {
  onClose: () => void;
  onCloned: () => void;
}

const CloneRole: React.FC<CloneRoleProps> = ({ onClose, onCloned }) => {
  const { roles, cloneRole } = useAppContext();
  
  const [selectedRoleId, setSelectedRoleId] = useState<number | ''>('');
  const [newRoleName, setNewRoleName] = useState('');
  const [customizePermissions, setCustomizePermissions] = useState(false);
  const [generatedSql, setGeneratedSql] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isCloning, setIsCloning] = useState(false);
  
  // Filter for template roles first (for dropdown)
  const templateRoles = roles.filter(role => role.isTemplate);
  const otherRoles = roles.filter(role => !role.isTemplate);
  
  // Initialize with first template role if available
  useEffect(() => {
    if (roles.length > 0 && selectedRoleId === '') {
      const firstTemplateRole = templateRoles[0];
      if (firstTemplateRole) {
        setSelectedRoleId(firstTemplateRole.id);
        setNewRoleName(`Copy of ${firstTemplateRole.name}`);
      } else if (otherRoles.length > 0) {
        const firstRole = otherRoles[0];
        setSelectedRoleId(firstRole.id);
        setNewRoleName(`Copy of ${firstRole.name}`);
      }
    }
  }, [roles, templateRoles, otherRoles, selectedRoleId]);
  
  // Generate SQL when selections change
  useEffect(() => {
    if (selectedRoleId !== '' && newRoleName.trim()) {
      const sql = SqlGenerator.generateCloneRoleScript(
        Number(selectedRoleId),
        newRoleName
      );
      setGeneratedSql(sql);
      setValidationError('');
    } else {
      setGeneratedSql('');
      if (selectedRoleId === '') {
        setValidationError('Please select a role to clone');
      } else if (!newRoleName.trim()) {
        setValidationError('Please enter a name for the new role');
      } else {
        setValidationError('');
      }
    }
  }, [selectedRoleId, newRoleName]);
  
  // Handle role selection
  const handleRoleSelect = (roleId: string) => {
    setSelectedRoleId(roleId === '' ? '' : Number(roleId));
    
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
  const handleClone = async () => {
    if (selectedRoleId === '' || !newRoleName.trim()) {
      setValidationError('Please select a role and provide a name for the new role');
      return;
    }
    
    try {
      setIsCloning(true);
      await cloneRole(Number(selectedRoleId), newRoleName);
      
      if (customizePermissions) {
        // Pass to the edit view
        onCloned();
      } else {
        // Just close and return to the list
        onClose();
      }
    } catch (error) {
      console.error('Error cloning role:', error);
      setValidationError(`Failed to clone role: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCloning(false);
    }
  };
  
  return (
    <div className="clone-role-container">
      <div className="clone-role-header">
        <h2>Clone Role</h2>
        <div className="close-button" onClick={onClose}>&times;</div>
      </div>
      
      <div className="clone-role-content">
        {validationError && (
          <div className="validation-error">
            {validationError}
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="templateRole">Template Role:</label>
          <select
            id="templateRole"
            value={selectedRoleId}
            onChange={(e) => handleRoleSelect(e.target.value)}
            className="select-role"
            disabled={isCloning}
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
            disabled={isCloning}
          />
        </div>
        
        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={customizePermissions}
              onChange={(e) => setCustomizePermissions(e.target.checked)}
              disabled={isCloning}
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
                disabled={!generatedSql || isCloning}
              >
                Copy to Clipboard
              </button>
            </div>
            <pre className="sql-content">
              {generatedSql || 'Select a role and provide a name to preview the SQL statements.'}
            </pre>
          </div>
        )}
      </div>
      
      <div className="clone-role-footer">
        <button className="btn btn-cancel" onClick={onClose} disabled={isCloning}>Cancel</button>
        <button 
          className="btn btn-clone" 
          onClick={handleClone}
          disabled={!selectedRoleId || !newRoleName.trim() || isCloning}
        >
          {isCloning 
            ? 'Cloning...' 
            : (customizePermissions ? 'Continue to Edit Permissions' : 'Clone Role')
          }
        </button>
      </div>
    </div>
  );
};

export default CloneRole;