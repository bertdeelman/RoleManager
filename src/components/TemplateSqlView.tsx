// src/components/TemplateSqlView.tsx
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { generateTemplateRoleSql, generateAllTemplatesSql } from '../utils/templateSqlGenerator';
import '../styles/TemplateSqlView.css';

interface TemplateSqlViewProps {
  onClose: () => void;
}

const TemplateSqlView: React.FC<TemplateSqlViewProps> = ({ onClose }) => {
  const { roles, rolePermissions } = useAppContext();
  const [selectedRoleId, setSelectedRoleId] = useState<number | 'all'>('all');
  const [generatedSql, setGeneratedSql] = useState<string>('');

  // Get template roles
  const templateRoles = roles.filter(role => role.isTemplate);

  // Generate SQL when selection changes
  useEffect(() => {
    if (selectedRoleId === 'all') {
      setGeneratedSql(generateAllTemplatesSql(roles, rolePermissions));
    } else {
      const role = roles.find(r => r.id === selectedRoleId);
      if (role) {
        const permissions = rolePermissions.filter(p => p.roleId === role.id);
        setGeneratedSql(generateTemplateRoleSql(role, permissions));
      }
    }
  }, [selectedRoleId, roles, rolePermissions]);

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

  // Download SQL as file
  const downloadSqlFile = () => {
    const fileName = selectedRoleId === 'all' 
      ? 'all-template-roles.sql' 
      : `template-role-${selectedRoleId}.sql`;
    
    const blob = new Blob([generatedSql], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="template-sql-container">
      <div className="template-sql-header">
        <h2>Template Role SQL</h2>
        <div className="close-button" onClick={onClose}>&times;</div>
      </div>
      
      <div className="template-sql-content">
        <div className="form-group">
          <label htmlFor="templateSelect">Select Template:</label>
          <select
            id="templateSelect"
            value={selectedRoleId}
            onChange={(e) => setSelectedRoleId(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            className="template-select"
          >
            <option value="all">All Templates</option>
            {templateRoles.map(role => (
              <option key={role.id} value={role.id}>{role.name}</option>
            ))}
          </select>
        </div>
        
        <div className="sql-preview">
          <div className="sql-preview-header">
            <h3>SQL Script</h3>
            <div className="sql-actions">
              <button className="btn btn-copy" onClick={copySqlToClipboard}>
                Copy to Clipboard
              </button>
              <button className="btn btn-download" onClick={downloadSqlFile}>
                Download SQL
              </button>
            </div>
          </div>
          <pre className="sql-content">{generatedSql}</pre>
        </div>
      </div>
    </div>
  );
};

export default TemplateSqlView;