/**
 * Database type mapping functionality
 *
 * This module handles mapping between abstract field types and
 * database-specific column types.
 *
 * @module migration/type-mapping
 */
import type { KyselyDatabaseType } from '../../adapters/kysely-adapter/types';
import type { FieldAttribute, FieldType } from '~/db/fields';

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
};

/**
 * Type mappings for SQLite
 */
const sqliteMap = {
	string: ['TEXT'],
	number: ['INTEGER', 'REAL'],
	boolean: ['INTEGER', 'BOOLEAN'], // 0 or 1
	date: ['DATE', 'INTEGER'],
};

/**
 * Type mappings for Microsoft SQL Server
 */
const mssqlMap = {
	string: ['text', 'varchar'],
	number: ['int', 'bigint', 'smallint', 'decimal', 'float', 'double'],
	boolean: ['bit', 'smallint'],
	date: ['datetime', 'date'],
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
export function getMySqlStringType(field: FieldAttribute): string {
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
export function getType(
	field: FieldAttribute,
	dbType: KyselyDatabaseType = 'sqlite'
) {
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
	} as const;

	if (dbType === 'sqlite' && (type === 'string[]' || type === 'number[]')) {
		return 'text';
	}
	if (type === 'string[]' || type === 'number[]') {
		return 'jsonb';
	}
	if (Array.isArray(type)) {
		return 'text';
	}
	return typeMap[type as keyof typeof typeMap][dbType];
}
