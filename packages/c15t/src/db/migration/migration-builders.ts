
import type { KyselyDatabaseType } from '../../adapters/kysely-adapter/types';
import type { MigrationOperation, TableToCreate, ColumnsToAdd } from './types';
import { getType } from './type-mapping';
import { createLogger } from '../../utils/logger';
import type { Kysely } from 'kysely';

/**
 * Builds migrations for adding columns to existing tables
 * 
 * @param db - Kysely instance
 * @param toBeAdded - Columns to be added
 * @param dbType - Database type
 * @returns Array of migration operations
 */
export function buildColumnAddMigrations(
  db: Kysely<any>,
  toBeAdded: ColumnsToAdd[],
  dbType: KyselyDatabaseType
): MigrationOperation[] {
  const migrations: MigrationOperation[] = [];
  
  for (const table of toBeAdded) {
    for (const [fieldName, field] of Object.entries(table.fields)) {
      const type = getType(field, dbType);
      const exec = db.schema
        .alterTable(table.table)
        .addColumn(fieldName, type, (col) => {
          let column = field.required !== false ? col.notNull() : col;
          if (field.references) {
            column = column.references(
              `${field.references.model}.${field.references.field}`
            );
          }
          if (field.unique) {
            column = column.unique();
          }
          return column;
        });
      migrations.push(exec);
    }
  }
  
  return migrations;
}

/**
 * Builds migrations for creating new tables
 * 
 * @param db - Kysely instance
 * @param toBeCreated - Tables to be created
 * @param dbType - Database type
 * @returns Array of migration operations
 */
export function buildTableCreateMigrations(
  db: Kysely<any>,
  toBeCreated: TableToCreate[],
  dbType: KyselyDatabaseType
): MigrationOperation[] {
  const logger = createLogger();
  const migrations: MigrationOperation[] = [];
  
  for (const table of toBeCreated) {
    // Log all field names to detect potential duplicate 'id' issues
    const fieldNames = Object.keys(table.fields);
    logger.info(`Creating table ${table.table} with fields: ${fieldNames.join(', ')}`);
    
    // Check for conflicts
    if (fieldNames.includes('id')) {
      logger.warn(`⚠️ Table ${table.table} already has an explicit 'id' field, which may conflict with the auto-generated primary key`);
    }
    
    // Log fields with potential naming conflicts
    for (const [fieldName, field] of Object.entries(table.fields)) {
      if (field.fieldName === 'id' && fieldName !== 'id') {
        logger.error(`❌ ERROR: Table ${table.table} has field '${fieldName}' with fieldName 'id' - this will cause a duplicate column error`);
      }
    }

    let dbT = db.schema.createTable(table.table).addColumn(
      'id',
      dbType === 'mysql' || dbType === 'mssql' ? 'varchar(36)' : 'text',
      (col) => col.primaryKey().notNull()
    );

    for (const [fieldName, field] of Object.entries(table.fields)) {
      const type = getType(field, dbType);
      // Add debug message before adding each column
      logger.info(`Adding column ${fieldName} (fieldName: ${field.fieldName || fieldName}) to table ${table.table}`);
      
      dbT = dbT.addColumn(fieldName, type, (col) => {
        let column = field.required !== false ? col.notNull() : col;
        if (field.references) {
          column = column.references(
            `${field.references.model}.${field.references.field}`
          );
        }
        if (field.unique) {
          column = column.unique();
        }
        return column;
      });
    }
    
    // Add SQL debugging
    const sqlDebug = dbT.compile().sql;
    logger.info(`SQL for table ${table.table}:\n${sqlDebug}`);
    
    migrations.push(dbT);
  }
  
  return migrations;
} 