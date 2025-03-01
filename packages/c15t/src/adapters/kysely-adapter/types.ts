import type { Kysely } from 'kysely';
import type { Pool as PostgresPool } from 'pg';
import type { Pool as MysqlPool } from 'mysql2/promise';
import type { ModelTypeMap } from '~/db/core/types';

/**
 * A type for table names in the database
 */
export type TableName = keyof Database;

/**
 * Database interface for Kysely that uses the ModelTypeMap
 * to ensure all table names and record types are properly typed.
 *
 * This allows Kysely operations to be type-safe throughout the adapter.
 */
export interface Database extends ModelTypeMap {
	// Add any adapter-specific table types here if needed
}

/**
 * Database types supported by the Kysely adapter
 */
export type KyselyDatabaseType = 'postgres' | 'mysql' | 'sqlite' | 'mssql';

/**
 * Types for database connections used by Kysely
 */
export type KyselyDialectConfig =
	| { dialect: 'postgres'; db: PostgresPool }
	| { dialect: 'mysql'; db: MysqlPool }
	| { dialect: 'sqlite'; db: Database }
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	| { dialect: 'mssql'; db: any }; // MSSQL connection

/**
 * Type for a Kysely instance
 */
export type KyselyInstance<T = Database> = Kysely<T>;
