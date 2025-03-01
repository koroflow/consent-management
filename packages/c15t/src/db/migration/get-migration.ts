import type {
	AlterTableColumnAlteringBuilder,
	CreateTableBuilder,
} from 'kysely';
import type { FieldAttribute, FieldType } from '..';
import { createLogger } from '../../utils/logger';
import type { C15TOptions } from '~/types';
import { createKyselyAdapter } from '../../adapters/kysely-adapter/dialect';
import type { KyselyDatabaseType } from '../../adapters/kysely-adapter/types';
import { getSchema } from '../get-schema';

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

const sqliteMap = {
	string: ['TEXT'],
	number: ['INTEGER', 'REAL'],
	boolean: ['INTEGER', 'BOOLEAN'], // 0 or 1
	date: ['DATE', 'INTEGER'],
};

const mssqlMap = {
	string: ['text', 'varchar'],
	number: ['int', 'bigint', 'smallint', 'decimal', 'float', 'double'],
	boolean: ['bit', 'smallint'],
	date: ['datetime', 'date'],
};

const map = {
	postgres: postgresMap,
	mysql: mysqlMap,
	sqlite: sqliteMap,
	mssql: mssqlMap,
};

export function matchType(
	columnDataType: string,
	fieldType: FieldType,
	dbType: KyselyDatabaseType
) {
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

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
export async function getMigrations(config: C15TOptions) {
	const betterAuthSchema = getSchema(config);
	const logger = createLogger(config.logger);

	let { kysely: db, databaseType: dbType } = await createKyselyAdapter(config);

	if (!dbType) {
		logger.warn(
			'Could not determine database type, defaulting to sqlite. Please provide a type in the database options to avoid this.'
		);
		dbType = 'sqlite';
	}

	if (!db) {
		logger.error(
			"Only kysely adapter is supported for migrations. You can use `generate` command to generate the schema, if you're using a different adapter."
		);
		process.exit(1);
	}
	const tableMetadata = await db.introspection.getTables();
	const toBeCreated: {
		table: string;
		fields: Record<string, FieldAttribute>;
		order: number;
	}[] = [];
	const toBeAdded: {
		table: string;
		fields: Record<string, FieldAttribute>;
		order: number;
	}[] = [];

	for (const [key, value] of Object.entries(betterAuthSchema)) {
		const table = tableMetadata.find((t: { name: string }) => t.name === key);
		if (!table) {
			const tIndex = toBeCreated.findIndex((t) => t.table === key);
			const tableData = {
				table: key,
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
					//@ts-expect-error - we know that the table exists
					toBeCreated[tIndex].fields = {
						//@ts-expect-error - we know that the table exists
						...toBeCreated[tIndex].fields,
						...value.fields,
					};
				}
			} else {
				toBeCreated.splice(insertIndex, 0, tableData);
			}
			continue;
		}
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
				`Field ${fieldName} in table ${key} has a different type in the database. Expected ${field.type} but got ${column.dataType}.`
			);
		}
		if (Object.keys(toBeAddedFields).length > 0) {
			toBeAdded.push({
				table: key,
				fields: toBeAddedFields,
				order: value.order || Number.POSITIVE_INFINITY,
			});
		}
	}

	const migrations: (
		| AlterTableColumnAlteringBuilder
		| CreateTableBuilder<string, string>
	)[] = [];

  function getMySqlStringType(field: FieldAttribute) {
    if (field.unique) { return 'varchar(255)'; }
    if (field.references) { return 'varchar(36)'; }
    return 'text';
  }

	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
	function getType(field: FieldAttribute) {
		const type = field.type;
		const typeMap = {
			string: {
				sqlite: 'text',
				postgres: 'text',
				mysql: getMySqlStringType(field),
				mssql: getMySqlStringType(field)
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
		return typeMap[type as keyof typeof typeMap][dbType || 'sqlite'];
	}
	if (toBeAdded.length) {
		for (const table of toBeAdded) {
			for (const [fieldName, field] of Object.entries(table.fields)) {
				const type = getType(field);
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
	}
	if (toBeCreated.length) {
		for (const table of toBeCreated) {
			// Log all field names to detect potential duplicate 'id' issues
			const fieldNames = Object.keys(table.fields);
			logger.info(`Creating table ${table.table} with fields: ${fieldNames.join(', ')}`);
			
			// Check if there's an explicit 'id' field in the table definition
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
				const type = getType(field);
				// Add debug message before adding each column to identify problematic fields
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
	}
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
	async function compileMigrations() {
		const compiled = migrations.map((m) => m.compile().sql);
		return `${compiled.join(';\n\n')};`;
	}
	return { toBeCreated, toBeAdded, runMigrations, compileMigrations };
}
