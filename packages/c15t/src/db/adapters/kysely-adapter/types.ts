import type { EntityTypeMap } from '~/db/core/types';
import type { Dialect, Kysely, MysqlPool, PostgresPool } from 'kysely';
import type { Database as SQLiteDatabase } from 'better-sqlite3';
import type { AdapterInstance } from '~/db/adapters/types';
import type { Database as KyselyDatabase } from '~/db/adapters/kysely-adapter/types';

/**
 * Database interface for Kysely that uses the EntityTypeMap
 * to ensure all table names and record types are properly typed.
 *
 * This allows Kysely operations to be type-safe throughout the adapter.
 */
export interface Database extends EntityTypeMap {
	// Add any adapter-specific table types here if needed
}

/**
 * Database types supported by the Kysely adapter
 *
 * These represent the major SQL database engines that can be used with the adapter.
 */
export type KyselyDatabaseType = 'postgres' | 'mysql' | 'sqlite' | 'mssql';

/**
 * Type alias for PostgreSQL connection pool configuration
 *
 * Used when configuring a PostgreSQL database connection.
 */
export type PostgresPoolConfig = PostgresPool;

/**
 * Type alias for MySQL connection pool configuration
 *
 * Used when configuring a MySQL database connection.
 */
export type MysqlPoolConfig = MysqlPool;

/**
 * Type alias for SQLite database configuration
 *
 * Used when configuring a SQLite database connection.
 */
export type SQLiteDatabaseConfig = SQLiteDatabase;

/**
 * Configuration for a Kysely dialect
 *
 * This interface allows direct configuration of a Kysely dialect
 * with explicit type information.
 */
export interface DialectConfig {
	/**
	 * The Kysely dialect instance to use for database operations
	 */
	dialect: Dialect;

	/**
	 * The type of database being connected to
	 */
	type: KyselyDatabaseType;

	/**
	 * Casing style for table names in the database
	 *
	 * @default "camel"
	 */
	casing?: 'snake' | 'camel';
}

/**
 * Configuration for an existing Kysely instance
 *
 * This allows using a pre-configured Kysely instance with the adapter.
 */
export interface KyselyInstanceConfig {
	/**
	 * Pre-configured Kysely instance to use for database operations
	 */
	db: Kysely<KyselyDatabase>;

	/**
	 * The type of database the Kysely instance is connected to
	 */
	type: KyselyDatabaseType;

	/**
	 * Casing style for table names in the database
	 *
	 * @default "camel"
	 */
	casing?: 'snake' | 'camel';
}

/**
 * Union type representing all possible database configurations
 *
 * This comprehensive type allows various ways to configure the database:
 * - Direct connection pools (PostgreSQL, MySQL)
 * - SQLite database instance
 * - Kysely dialect
 * - Custom adapter instance
 * - Dialect configuration
 * - Kysely instance configuration
 */
export type DatabaseConfiguration =
	| PostgresPoolConfig
	| MysqlPoolConfig
	| SQLiteDatabaseConfig
	| Dialect
	| AdapterInstance
	| DialectConfig
	| KyselyInstanceConfig;
