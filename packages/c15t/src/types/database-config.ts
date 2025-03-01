import type { Dialect, Kysely, MysqlPool, PostgresPool } from 'kysely';
import type { KyselyDatabaseType } from '~/adapters/kysely-adapter/types';
import type { Database as SQLiteDatabase } from 'better-sqlite3';
import type { AdapterInstance } from '~/adapters/types';
import type { Database as KyselyDatabase } from '~/adapters/kysely-adapter/types';
// Types for different DB connection options
export type PostgresPoolConfig = PostgresPool;
export type MysqlPoolConfig = MysqlPool;
export type SQLiteDatabaseConfig = SQLiteDatabase;

// Dialect configuration
export interface DialectConfig {
	dialect: Dialect;
	type: KyselyDatabaseType;
	/**
	 * casing for table names
	 *
	 * @default "camel"
	 */
	casing?: 'snake' | 'camel';
}

// Kysely instance configuration
export interface KyselyInstanceConfig {
	/**
	 * Kysely instance
	 */
	db: Kysely<KyselyDatabase>;
	/**
	 * Database type between postgres, mysql and sqlite
	 */
	type: KyselyDatabaseType;
	/**
	 * casing for table names
	 *
	 * @default "camel"
	 */
	casing?: 'snake' | 'camel';
}

// Combined type for all database configurations
export type DatabaseConfiguration =
	| PostgresPoolConfig
	| MysqlPoolConfig
	| SQLiteDatabaseConfig
	| Dialect
	| AdapterInstance
	| DialectConfig
	| KyselyInstanceConfig;
