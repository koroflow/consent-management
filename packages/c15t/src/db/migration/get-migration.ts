/**
 * Main migration generation functionality
 *
 * This module orchestrates the entire database migration process by:
 * 1. Connecting to the database using the appropriate adapter
 * 2. Analyzing differences between expected schema and actual database
 * 3. Building migration operations for tables and columns
 * 4. Providing functions to execute or compile the migrations
 *
 * @remarks
 * This is the main entry point for the migration system and coordinates
 * the various specialized modules that handle specific parts of the process.
 *
 * @module migration/get-migrations
 */
import type { FieldType } from '~/db/core/fields';
import { createLogger } from '../../utils/logger';
import type { C15TOptions } from '~/types';
import { createKyselyAdapter } from '../adapters/kysely-adapter/dialect';
import type { KyselyDatabaseType } from '../adapters/kysely-adapter/types';
import { analyzeSchemaChanges } from './schema-comparison';
import {
	buildColumnAddMigrations,
	buildTableCreateMigrations,
} from './migration-builders';
import { createMigrationExecutors } from './migration-execution';
import type { MigrationResult } from './types';

/**
 * Type mappings for PostgreSQL data types
 * @internal
 */
const postgresMap = {
	string: ['character varying', 'text'],
	number: [
		'int4',
		'integer',
		'bigint',
		'smallint',
		'numeric',
		'real',
		'double precision',
	],
	boolean: ['bool', 'boolean'],
	date: ['timestamp', 'date'],
};

/**
 * Type mappings for MySQL data types
 * @internal
 */
const mysqlMap = {
	string: ['varchar', 'text'],
	number: [
		'integer',
		'int',
		'bigint',
		'smallint',
		'decimal',
		'float',
		'double',
	],
	boolean: ['boolean', 'tinyint'],
	date: ['timestamp', 'datetime', 'date'],
};

/**
 * Type mappings for SQLite data types
 * @internal
 */
const sqliteMap = {
	string: ['TEXT'],
	number: ['INTEGER', 'REAL'],
	boolean: ['INTEGER', 'BOOLEAN'], // 0 or 1
	date: ['DATE', 'INTEGER'],
};

/**
 * Type mappings for Microsoft SQL Server data types
 * @internal
 */
const mssqlMap = {
	string: ['text', 'varchar'],
	number: ['int', 'bigint', 'smallint', 'decimal', 'float', 'double'],
	boolean: ['bit', 'smallint'],
	date: ['datetime', 'date'],
};

/**
 * Combined map of all database type mappings
 * @internal
 */
const map = {
	postgres: postgresMap,
	mysql: mysqlMap,
	sqlite: sqliteMap,
	mssql: mssqlMap,
};

/**
 * Checks if a database column type matches the expected field type
 *
 * @param columnDataType - The actual column type in the database
 * @param fieldType - The expected field type
 * @param dbType - The database type (postgres, mysql, etc.)
 * @returns True if types match, false otherwise
 *
 * @remarks
 * This function handles type compatibility across different databases,
 * accounting for the fact that the same logical type may have different
 * names in different database systems.
 *
 * Array types (string[] and number[]) are treated specially and matched
 * against JSON-compatible column types.
 *
 * @example
 * ```typescript
 * // Returns true because 'text' is compatible with 'string' in PostgreSQL
 * matchType('text', 'string', 'postgres');
 *
 * // Returns true because 'jsonb' is compatible with array types
 * matchType('jsonb', 'string[]', 'postgres');
 * ```
 */
export function matchType(
	columnDataType: string,
	fieldType: FieldType,
	dbType: KyselyDatabaseType
): boolean {
	if (fieldType === 'string[]' || fieldType === 'number[]') {
		return columnDataType.toLowerCase().includes('json');
	}
	const types = map[dbType];
	const type = Array.isArray(fieldType)
		? types.string.map((t) => t.toLowerCase())
		: types[fieldType].map((t) => t.toLowerCase());
	const matches = type.includes(columnDataType.toLowerCase());
	return matches;
}

/**
 * Generates database migrations based on schema differences
 *
 * This is the main entry point for the migration system. It orchestrates
 * the entire process from connecting to the database to generating migrations.
 *
 * @param config - C15T configuration containing database connection and schema details
 *
 * @returns MigrationResult containing:
 *   - toBeCreated: Tables that need to be created
 *   - toBeAdded: Columns that need to be added to existing tables
 *   - runMigrations: Function to execute all migrations
 *   - compileMigrations: Function to compile migrations to SQL without executing
 *
 * @throws Will exit the process if the Kysely adapter is not available
 *
 * @example
 * ```typescript
 * // Generate migrations and execute them
 * const { runMigrations } = await getMigrations(config);
 * await runMigrations();
 *
 * // Or generate migrations and get the SQL
 * const { compileMigrations } = await getMigrations(config);
 * const sql = await compileMigrations();
 * console.log("Migration SQL:", sql);
 * ```
 */
export async function getMigrations(
	config: C15TOptions
): Promise<MigrationResult> {
	const logger = createLogger(config.logger);

	// Initialize database connection
	let { kysely: db, databaseType: dbType } = await createKyselyAdapter(config);

	// Check if the database type is supported
	if (!dbType) {
		logger.warn(
			'Could not determine database type, defaulting to sqlite. Please provide a type in the database options to avoid this.'
		);
		dbType = 'sqlite';
	}

	// Check if the database is connected
	if (!db) {
		logger.error(
			"Only kysely adapter is supported for migrations. You can use `generate` command to generate the schema, if you're using a different adapter."
		);
		process.exit(1);
	}

	// Get database metadata
	const tableMetadata = await db.introspection.getTables();

	// Analyze schema differences
	const { toBeCreated, toBeAdded } = analyzeSchemaChanges(
		config,
		tableMetadata,
		dbType
	);

	// Build migration operations
	const columnMigrations = buildColumnAddMigrations(db, toBeAdded, dbType);
	const tableMigrations = buildTableCreateMigrations(db, toBeCreated, dbType);
	const migrations = [...columnMigrations, ...tableMigrations];

	// Create migration executors
	const { runMigrations, compileMigrations } =
		createMigrationExecutors(migrations);

	return {
		toBeCreated,
		toBeAdded,
		runMigrations,
		compileMigrations,
	};
}
