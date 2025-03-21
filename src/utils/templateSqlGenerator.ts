// src/utils/templateSqlGenerator.ts
import { Role, RolePermission } from '../types/models';
import { SqlGenerator } from './sqlGenerator';

/**
 * Generates SQL script for creating template roles from scratch
 */
export const generateTemplateRoleSql = (
  role: Role,
  permissions: RolePermission[]
): string => {
  // Step 1: Create role
  let sql = `-- SQL to create template role: ${role.name}\n`;
  sql += `INSERT INTO Roles (RoleName, Status)\nVALUES ('${role.name}', ${role.status});\n\n`;
  sql += `DECLARE @RoleId INT = SCOPE_IDENTITY();\n\n`;

  // Step 2: Group permissions by type (module, page, operation)
  const modulePermissions = permissions.filter(p => p.moduleId !== null && p.pageId === null && p.operationId === null);
  const pagePermissions = permissions.filter(p => p.pageId !== null && p.operationId === null);
  const operationPermissions = permissions.filter(p => p.operationId !== null);

  // Step 3: Generate SQL for module permissions
  if (modulePermissions.length > 0) {
    sql += `-- Add module permissions\n`;
    modulePermissions.forEach(p => {
      sql += `INSERT INTO RolePermissions (RoleId, PageId, ModuleId, OperationId)\n`;
      sql += `VALUES (@RoleId, NULL, ${p.moduleId}, NULL);\n`;
    });
    sql += '\n';
  }

  // Step 4: Generate SQL for page permissions
  if (pagePermissions.length > 0) {
    sql += `-- Add page permissions\n`;
    pagePermissions.forEach(p => {
      sql += `INSERT INTO RolePermissions (RoleId, PageId, ModuleId, OperationId)\n`;
      sql += `VALUES (@RoleId, ${p.pageId}, NULL, NULL);\n`;
    });
    sql += '\n';
  }

  // Step 5: Generate SQL for operation permissions
  if (operationPermissions.length > 0) {
    sql += `-- Add operation permissions\n`;
    operationPermissions.forEach(p => {
      sql += `INSERT INTO RolePermissions (RoleId, PageId, ModuleId, OperationId)\n`;
      sql += `VALUES (@RoleId, NULL, NULL, ${p.operationId});\n`;
    });
  }

  return sql;
};

/**
 * Generates complete SQL script for all template roles
 */
export const generateAllTemplatesSql = (
  roles: Role[],
  rolePermissions: RolePermission[]
): string => {
  const templateRoles = roles.filter(role => role.isTemplate);
  let sql = `-- SQL to recreate all template roles\n\n`;

  templateRoles.forEach(role => {
    const permissions = rolePermissions.filter(p => p.roleId === role.id);
    sql += generateTemplateRoleSql(role, permissions);
    sql += '\n\n';
  });

  return sql;
};