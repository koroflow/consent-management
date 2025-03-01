/**
 * Schema comparison functionality
 * 
 * This module handles comparing the expected schema with the actual
 * database schema to determine what changes are needed.
 * 
 * @module migration/schema-comparison
 */

import type { C15TOptions } from '~/types';
import type { FieldAttribute } from '../index';
import { createLogger } from '../../utils/logger';
import { getSchema } from '../get-schema';
import type { TableToCreate, ColumnsToAdd } from './types';
import { matchType } from './type-mapping';
import type { KyselyDatabaseType } from '../../adapters/kysely-adapter/types';
import type { TableMetadata } from 'kysely';

/**
 * Analyzes schema differences between the expected schema and actual database
 * 
 * @param config - C15T configuration
 * @param tableMetadata - Database table metadata from introspection
 * @param dbType - Database type
 * @returns Tables to create and columns to add
 */
export function analyzeSchemaChanges(
  config: C15TOptions,
  tableMetadata: TableMetadata[],
  dbType: KyselyDatabaseType
): { toBeCreated: TableToCreate[], toBeAdded: ColumnsToAdd[] } {
  const betterAuthSchema = getSchema(config);
  const logger = createLogger(config.logger);
  const toBeCreated: TableToCreate[] = [];
  const toBeAdded: ColumnsToAdd[] = [];

  for (const [key, value] of Object.entries(betterAuthSchema)) {
    const table = tableMetadata.find((t: { name: string }) => t.name === key);
    if (!table) {
      handleNewTable(key, value, toBeCreated);
      continue;
    }
    
    handleExistingTable(key, value, table, toBeAdded, dbType, logger);
  }

  return { toBeCreated, toBeAdded };
}

/**
 * Handles logic for a table that needs to be created
 */
function handleNewTable(
  tableName: string, 
  value: { fields: Record<string, FieldAttribute>; order: number }, 
  toBeCreated: TableToCreate[]
): void {
  const tIndex = toBeCreated.findIndex((t) => t.table === tableName);
  const tableData = {
    table: tableName,
    fields: value.fields,
    order: value.order || Number.POSITIVE_INFINITY,
  };

  const insertIndex = toBeCreated.findIndex(
    (t) => (t.order || Number.POSITIVE_INFINITY) > tableData.order
  );

  if (insertIndex === -1) {
    if (tIndex === -1) {
      toBeCreated.push(tableData);
    } else {
      toBeCreated[tIndex].fields = {
        ...toBeCreated[tIndex].fields,
        ...value.fields,
      };
    }
  } else {
    toBeCreated.splice(insertIndex, 0, tableData);
  }
}

/**
 * Handles logic for an existing table that might need columns added
 */
function handleExistingTable(
  tableName: string,
  value: { fields: Record<string, FieldAttribute>; order: number },
  table: TableMetadata,
  toBeAdded: ColumnsToAdd[],
  dbType: KyselyDatabaseType,
  logger: ReturnType<typeof createLogger>
): void {
  const toBeAddedFields: Record<string, FieldAttribute> = {};
  
  for (const [fieldName, field] of Object.entries(value.fields)) {
    const column = table.columns.find((c) => c.name === fieldName);
    if (!column) {
      toBeAddedFields[fieldName] = field;
      continue;
    }

    if (matchType(column.dataType, field.type, dbType)) {
      continue;
    }

    logger.warn(
      `Field ${fieldName} in table ${tableName} has a different type in the database. Expected ${field.type} but got ${column.dataType}.`
    );
  }
  
  if (Object.keys(toBeAddedFields).length > 0) {
    toBeAdded.push({
      table: tableName,
      fields: toBeAddedFields,
      order: value.order || Number.POSITIVE_INFINITY,
    });
  }
} 