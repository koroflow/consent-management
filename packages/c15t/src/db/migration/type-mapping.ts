/**
 * Database type mapping functionality
 *
 * This module handles mapping between abstract field types and
 * database-specific column types.
 *
 * @module migration/type-mapping
 */
import type { KyselyDatabaseType } from '../adapters/kysely-adapter/types';
import type { Field, FieldType } from '~/db/core/fields';

/**
 * Type mappings for PostgreSQL
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
	json: ['json', 'jsonb'],
	timezone: ['text', 'character varying'], // Timezone stored as text in PostgreSQL
};

/**
 * Type mappings for MySQL
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
	json: ['json'],
	timezone: ['varchar', 'text'], // Timezone stored as text in MySQL
};

/**
 * Type mappings for SQLite
 */
const sqliteMap = {
	string: ['TEXT'],
	number: ['INTEGER', 'REAL'],
	boolean: ['INTEGER', 'BOOLEAN'], // 0 or 1
	date: ['DATE', 'INTEGER'],
	json: ['TEXT'], // SQLite doesn't have native JSON, stored as TEXT
	timezone: ['TEXT'], // Timezone stored as text in SQLite
};

/**
 * Type mappings for Microsoft SQL Server
 */
const mssqlMap = {
	string: ['text', 'varchar'],
	number: ['int', 'bigint', 'smallint', 'decimal', 'float', 'double'],
	boolean: ['bit', 'smallint'],
	date: ['datetime', 'date'],
	json: ['nvarchar(max)'], // MSSQL uses nvarchar for JSON storage
	timezone: ['varchar', 'text'], // Timezone stored as text in MSSQL
};

/**
 * All database type mappings
 */
const map = {
	postgres: postgresMap,
	mysql: mysqlMap,
	sqlite: sqliteMap,
	mssql: mssqlMap,
};

/**
 * Determines MySQL string type based on field attributes
 *
 * @param field - Field attributes
 * @returns The appropriate MySQL type for the string field
 */
export function getMySqlStringType(field: Field): string {
	if (field.unique) {
		return 'varchar(255)';
	}
	if (field.references) {
		return 'varchar(36)';
	}
	return 'text';
}

/**
 * Checks if a database column type matches the expected field type
 *
 * @param columnDataType - The actual column type in the database
 * @param fieldType - The expected field type
 * @param dbType - The database type (postgres, mysql, etc.)
 * @returns True if types match, false otherwise
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
 * Gets the appropriate database type for a field
 *
 * @param field - Field attributes
 * @param dbType - Database type
 * @returns The appropriate database-specific type
 */
export function getType(field: Field, dbType: KyselyDatabaseType = 'sqlite') {
	const type = field.type;
	const typeMap = {
		string: {
			sqlite: 'text',
			postgres: 'text',
			mysql: getMySqlStringType(field),
			mssql: getMySqlStringType(field),
		},
		boolean: {
			sqlite: 'integer',
			postgres: 'boolean',
			mysql: 'boolean',
			mssql: 'smallint',
		},
		number: {
			sqlite: field.bigint ? 'bigint' : 'integer',
			postgres: field.bigint ? 'bigint' : 'integer',
			mysql: field.bigint ? 'bigint' : 'integer',
			mssql: field.bigint ? 'bigint' : 'integer',
		},
		date: {
			sqlite: 'date',
			postgres: 'timestamp',
			mysql: 'datetime',
			mssql: 'datetime',
		},
		timezone: {
			sqlite: 'text',
			postgres: 'text',
			mysql: 'varchar(50)',
			mssql: 'nvarchar(50)',
		},
		json: {
			sqlite: 'text', // SQLite doesn't have native JSON
			postgres: 'jsonb', // PostgreSQL prefers jsonb for better performance
			mysql: 'json',
			mssql: 'nvarchar(max)', // SQL Server stores JSON as nvarchar
		},
	} as const;

	if (dbType === 'sqlite' && (type === 'string[]' || type === 'number[]')) {
		return 'text';
	}
	if (type === 'string[]' || type === 'number[]') {
		switch (dbType) {
			case 'postgres':
				return 'jsonb';
			case 'mysql':
			case 'mssql':
				return 'json';
			default:
				return 'text';
		}
	}

	// Handle json type
	if (type === 'json') {
		return typeMap.json[dbType];
	}

	return typeMap[type][dbType];
}
