// src/utils/dataParser.ts
import {
  Module,
  Page,
  Operation,
  Role,
  RolePermission,
  UserRole,
  ModuleWithPages,
  PageWithOperations
} from '../types/models';

/**
 * Parses SQL output text into structured data objects
 */
export class SqlDataParser {
  private sqlText: string;
  
  constructor(sqlText: string) {
    this.sqlText = sqlText;
  }
  
  /**
   * Extracts table data from SQL output text
   */
  private extractTableData(tableName: string): string[][] {
    // Find the section for the table
    const regex = new RegExp(`--\\s*${tableName}\\s*([\\s\\S]*?)(?:--\\s*|$)`, 'i');
    const match = this.sqlText.match(regex);
    
    if (!match || !match[1]) return [];
    
    // Split into lines and filter out empty lines
    const lines = match[1].split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    // Skip the header line and parse data lines
    return lines.slice(1).map(line => 
      line.split('\t').map(cell => cell.trim())
    );
  }
  
  /**
   * Parse modules from SQL data
   */
  parseModules(): Module[] {
    const data = this.extractTableData('MODULEID\\s+MODULENAME\\s+MODULECODE\\s+APPLICATIONTYPE');
    return data.map(row => ({
      id: parseInt(row[0], 10),
      name: row[1],
      code: row[2],
      applicationType: parseInt(row[3], 10)
    }));
  }
  
  /**
   * Parse pages from SQL data
   */
  parsePages(): Page[] {
    const data = this.extractTableData('PAGEID\\s+MODULEID\\s+PAGENAME\\s+PAGECODE\\s+PAGEURL');
    return data.map(row => ({
      id: parseInt(row[0], 10),
      moduleId: parseInt(row[1], 10),
      name: row[2],
      code: row[3],
      url: row[4]
    }));
  }
  
  /**
   * Parse operations from SQL data
   */
  parseOperations(): Operation[] {
    const data = this.extractTableData('PAGEID\\s+OPERATIONID\\s+OPERATIONCODE\\s+OPERATIONNAME');
    return data.map(row => ({
      pageId: parseInt(row[0], 10),
      id: parseInt(row[1], 10),
      code: row[2],
      name: row[3]
    }));
  }
  
  /**
   * Parse roles from SQL data
   */
  parseRoles(): Role[] {
    const data = this.extractTableData('ROLEID\\s+ROLENAME\\s+STATUS');
    return data.map(row => ({
      id: parseInt(row[0], 10),
      name: row[1],
      status: parseInt(row[2], 10),
      isTemplate: ['eManagerAdministrator', 'SuperUser', 'User'].includes(row[1])
    }));
  }
  
  /**
   * Parse role permissions from SQL data
   */
  parseRolePermissions(): RolePermission[] {
    const data = this.extractTableData('ROLEPERMISSIONID\\s+ROLEID\\s+PAGEID\\s+MODULEID\\s+OPERATIONID');
    return data.map(row => ({
      id: parseInt(row[0], 10),
      roleId: parseInt(row[1], 10),
      pageId: row[2] !== 'NULL' ? parseInt(row[2], 10) : null,
      moduleId: row[3] !== 'NULL' ? parseInt(row[3], 10) : null,
      operationId: row[4] !== 'NULL' ? parseInt(row[4], 10) : null
    }));
  }
  
  /**
   * Parse user roles from SQL data
   */
  parseUserRoles(): UserRole[] {
    const data = this.extractTableData('ROLEID\\s+USERID');
    return data.map(row => ({
      roleId: parseInt(row[0], 10),
      userId: parseInt(row[1], 10)
    }));
  }
  
  /**
   * Create a hierarchical structure of modules with their pages and operations
   */
  createHierarchy(): ModuleWithPages[] {
    const modules = this.parseModules();
    const pages = this.parsePages();
    const operations = this.parseOperations();
    
    return modules.map(module => {
      const modulePages = pages.filter(page => page.moduleId === module.id);
      
      const pagesWithOperations: PageWithOperations[] = modulePages.map(page => {
        const pageOperations = operations.filter(op => op.pageId === page.id);
        return {
          ...page,
          operations: pageOperations
        };
      });
      
      return {
        ...module,
        pages: pagesWithOperations
      };
    });
  }
  
  /**
   * Get all data in a structured format
   */
  parseAll() {
    return {
      modules: this.parseModules(),
      pages: this.parsePages(),
      operations: this.parseOperations(),
      roles: this.parseRoles(),
      rolePermissions: this.parseRolePermissions(),
      userRoles: this.parseUserRoles(),
      hierarchy: this.createHierarchy()
    };
  }
  
  /**
   * Generate permission mapping for role editing
   */
  generatePermissionSelectionForRole(roleId: number): { 
    selection: Record<string, boolean>,
    permissionMap: Record<string, RolePermission> 
  } {
    const rolePermissions = this.parseRolePermissions()
      .filter(perm => perm.roleId === roleId);
    
    const selection: Record<string, boolean> = {};
    const permissionMap: Record<string, RolePermission> = {};
    
    // Module permissions
    rolePermissions
      .filter(perm => perm.moduleId && !perm.pageId && !perm.operationId)
      .forEach(perm => {
        if (perm.moduleId) {
          const key = `module_${perm.moduleId}`;
          selection[key] = true;
          permissionMap[key] = perm;
        }
      });
    
    // Page permissions
    rolePermissions
      .filter(perm => perm.pageId && !perm.operationId)
      .forEach(perm => {
        if (perm.pageId) {
          const key = `page_${perm.pageId}`;
          selection[key] = true;
          permissionMap[key] = perm;
        }
      });
    
    // Operation permissions
    rolePermissions
      .filter(perm => perm.operationId)
      .forEach(perm => {
        if (perm.operationId) {
          const key = `operation_${perm.operationId}`;
          selection[key] = true;
          permissionMap[key] = perm;
        }
      });
    
    return { selection, permissionMap };
  }
}