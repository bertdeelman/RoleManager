// src/utils/sqlGenerator.ts
import { Role, RolePermission } from '../types/models';

export class SqlGenerator {
  /**
   * Generate SQL to create a new role
   */
  static createRole(role: Omit<Role, 'id'>): string {
    return `INSERT INTO ROLES (RoleName, Status)
VALUES ('${role.name}', 0);
-- Get the new role ID
DECLARE @NewRoleId INT = SCOPE_IDENTITY();`;
  }
  
  /**
   * Generate SQL to add a module permission
   */
  static addModulePermission(roleId: number, moduleId: number): string {
    return `INSERT INTO ROLEPERMISSIONS (RoleId, PageId, ModuleId, OperationId)
VALUES (${roleId}, NULL, ${moduleId}, NULL);`;
  }
  
  /**
   * Generate SQL to add a page permission
   */
  static addPagePermission(roleId: number, pageId: number): string {
    return `INSERT INTO ROLEPERMISSIONS (RoleId, PageId, ModuleId, OperationId)
VALUES (${roleId}, ${pageId}, NULL, NULL);`;
  }
  
  /**
   * Generate SQL to add an operation permission
   */
  static addOperationPermission(roleId: number, operationId: number): string {
    return `INSERT INTO ROLEPERMISSIONS (RoleId, PageId, ModuleId, OperationId)
VALUES (${roleId}, NULL, NULL, ${operationId});`;
  }
  
  /**
   * Generate SQL to delete a permission
   */
  static deletePermission(permissionId: number): string {
    return `DELETE FROM ROLEPERMISSIONS WHERE RolePermissionId = ${permissionId};`;
  }
  
  /**
   * Generate complete SQL script for creating a new role with permissions
   */
  static generateCreateRoleScript(
    role: Omit<Role, 'id'>,
    moduleIds: number[],
    pageIds: number[],
    operationIds: number[]
  ): string {
    const lines: string[] = [];
    
    // Add transaction control
    lines.push('BEGIN TRANSACTION;');
    lines.push('');
    
    // Create role
    lines.push(this.createRole(role));
    lines.push('');
    
    // Add module permissions
    if (moduleIds.length > 0) {
      lines.push('-- Add module permissions');
      moduleIds.forEach(moduleId => {
        lines.push(`INSERT INTO ROLEPERMISSIONS (RoleId, PageId, ModuleId, OperationId)
VALUES (@NewRoleId, NULL, ${moduleId}, NULL);`);
      });
      lines.push('');
    }
    
    // Add page permissions
    if (pageIds.length > 0) {
      lines.push('-- Add page permissions');
      pageIds.forEach(pageId => {
        lines.push(`INSERT INTO ROLEPERMISSIONS (RoleId, PageId, ModuleId, OperationId)
VALUES (@NewRoleId, ${pageId}, NULL, NULL);`);
      });
      lines.push('');
    }
    
    // Add operation permissions
    if (operationIds.length > 0) {
      lines.push('-- Add operation permissions');
      operationIds.forEach(operationId => {
        lines.push(`INSERT INTO ROLEPERMISSIONS (RoleId, PageId, ModuleId, OperationId)
VALUES (@NewRoleId, NULL, NULL, ${operationId});`);
      });
    }
    
    // Add transaction control comments
    lines.push('');
    lines.push('-- COMMIT TRANSACTION;');
    lines.push('-- ROLLBACK TRANSACTION;');
    
    return lines.join('\n');
  }
  
  /**
   * Generate SQL script based on permission changes
   */
  static generatePermissionsChangeScript(
    roleId: number,
    toAdd: { moduleIds: number[], pageIds: number[], operationIds: number[] },
    toRemove: RolePermission[]
  ): string {
    const lines: string[] = [];
    
    // Add transaction control
    lines.push('BEGIN TRANSACTION;');
    lines.push('');
    
    // Delete permissions
    if (toRemove.length > 0) {
      lines.push('-- Remove permissions');
      toRemove.forEach(permission => {
        lines.push(this.deletePermission(permission.id));
      });
      lines.push('');
    }
    
    // Add module permissions
    if (toAdd.moduleIds.length > 0) {
      lines.push('-- Add module permissions');
      toAdd.moduleIds.forEach(moduleId => {
        lines.push(this.addModulePermission(roleId, moduleId));
      });
      lines.push('');
    }
    
    // Add page permissions
    if (toAdd.pageIds.length > 0) {
      lines.push('-- Add page permissions');
      toAdd.pageIds.forEach(pageId => {
        lines.push(this.addPagePermission(roleId, pageId));
      });
      lines.push('');
    }
    
    // Add operation permissions
    if (toAdd.operationIds.length > 0) {
      lines.push('-- Add operation permissions');
      toAdd.operationIds.forEach(operationId => {
        lines.push(this.addOperationPermission(roleId, operationId));
      });
    }
    
    // Add transaction control comments
    lines.push('');
    lines.push('-- COMMIT TRANSACTION;');
    lines.push('-- ROLLBACK TRANSACTION;');
    
    return lines.join('\n');
  }
  
  /**
   * Generate SQL script for cloning a role
   */
  static generateCloneRoleScript(
    sourceRoleId: number, 
    newRoleName: string
  ): string {
    return `-- Clone role: ${newRoleName} from role ID: ${sourceRoleId}
BEGIN TRANSACTION;

INSERT INTO ROLES (RoleName, Status)
VALUES ('${newRoleName}', 0);

DECLARE @NewRoleId INT = SCOPE_IDENTITY();

-- Copy permissions from source role
INSERT INTO ROLEPERMISSIONS (RoleId, PageId, ModuleId, OperationId)
SELECT @NewRoleId, PageId, ModuleId, OperationId
FROM ROLEPERMISSIONS
WHERE RoleId = ${sourceRoleId};

-- COMMIT TRANSACTION;
-- ROLLBACK TRANSACTION;`;
  }
}