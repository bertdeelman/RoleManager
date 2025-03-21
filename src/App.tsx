// src/App.tsx
import { useState } from 'react';
import { AppProvider } from './context/AppContext';
import RoleList from './components/RoleList';
import RoleDetail from './components/RoleDetail';
import CloneRole from './components/CloneRole';
import TemplateSqlView from './components/TemplateSqlView';
import './App.css';

function App() {
  const [viewMode, setViewMode] = useState<'list' | 'detail' | 'clone' | 'templateSql'>('list');
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [isNewRole, setIsNewRole] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [sourceRoleId, setSourceRoleId] = useState<number | undefined>(undefined);

  // Handle view role
  const handleViewRole = (roleId: number) => {
    setSelectedRoleId(roleId);
    setIsNewRole(false);
    setIsCloning(false);
    setViewMode('detail');
  };

  // Handle create new role
  const handleCreateRole = () => {
    setSelectedRoleId(null);
    setIsNewRole(true);
    setIsCloning(false);
    setViewMode('detail');
  };

  // Handle clone role
  const handleCloneRole = (roleId?: number) => {
    if (roleId) {
      setSourceRoleId(roleId);
      setSelectedRoleId(null);
      setIsNewRole(true);
      setIsCloning(true);
      setViewMode('detail');
    } else {
      setViewMode('clone');
    }
  };

  // Handle edit role
  const handleEditRole = (roleId: number) => {
    setSelectedRoleId(roleId);
    setIsNewRole(false);
    setIsCloning(false);
    setViewMode('detail');
  };

  // Handle viewing template SQL
  const handleViewTemplateSql = () => {
    setViewMode('templateSql');
  };

  // Handle close detail view
  const handleCloseDetail = () => {
    setViewMode('list');
  };

  // Handle save role
  const handleSaveRole = () => {
    // In a real app, you might actually save to a database here
    // For this demo, we'll just return to the list view
    setViewMode('list');
  };

  // Handle clone role from clone view
  const handleCloneFromView = () => {
    setViewMode('detail');
    setIsNewRole(true);
    setIsCloning(true);
  };

  return (
    <AppProvider>
      <div className="app-container">
        <header className="app-header">
          <h1>Role Manager</h1>
          {viewMode === 'list' && (
            <button 
              className="btn btn-info template-sql-btn" 
              onClick={handleViewTemplateSql}
            >
              View Template SQL
            </button>
          )}
        </header>
        
        <main className="app-content">
          {viewMode === 'list' && (
            <RoleList 
              onViewRole={handleViewRole}
              onCreateRole={handleCreateRole}
              onCloneRole={handleCloneRole}
              onEditRole={handleEditRole}
            />
          )}
          
          {viewMode === 'detail' && (
            <RoleDetail
              roleId={selectedRoleId}
              isNewRole={isNewRole}
              isCloning={isCloning}
              sourceRoleId={sourceRoleId}
              onClose={handleCloseDetail}
              onSave={handleSaveRole}
            />
          )}
          
          {viewMode === 'clone' && (
            <CloneRole
              onClose={handleCloseDetail}
              onCloned={handleCloneFromView}
            />
          )}

          {viewMode === 'templateSql' && (
            <TemplateSqlView
              onClose={handleCloseDetail}
            />
          )}
        </main>
        
        <footer className="app-footer">
          <p>&copy; 2025 RoleManager</p>
        </footer>
      </div>
    </AppProvider>
  );
}

export default App;