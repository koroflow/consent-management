/**
 * Migration execution functionality
 * 
 * This module handles executing or compiling migrations.
 * 
 * @module migration/migration-execution
 */

import { createLogger } from '../../utils/logger';
import type { MigrationOperation } from './types';

/**
 * Creates functions to run or compile the generated migrations
 * 
 * @param migrations - Migration operations to execute
 * @returns Object with runMigrations and compileMigrations functions
 */
export function createMigrationExecutors(migrations: MigrationOperation[]) {
  const logger = createLogger();
  
  /**
   * Executes all migration operations
   */
  async function runMigrations() {
    for (const migration of migrations) {
      try {
        await migration.execute();
      } catch (error) {
        // Log which migration failed
        const sql = migration.compile().sql;
        logger.error(`Migration failed! SQL:\n${sql}`);
        throw error;
      }
    }
  }
  
  /**
   * Compiles all migrations to SQL without executing them
   * 
   * @returns SQL string of all migrations
   */
  async function compileMigrations() {
    const compiled = migrations.map((m) => m.compile().sql);
    return `${compiled.join(';\n\n')};`;
  }
  
  return { runMigrations, compileMigrations };
} 