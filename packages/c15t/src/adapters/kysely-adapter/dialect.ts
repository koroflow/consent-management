import { Kysely, MssqlDialect } from 'kysely';
import {
	type Dialect,
	MysqlDialect,
	PostgresDialect,
	SqliteDialect,
} from 'kysely';
import type { C15TOptions } from '~/types';
import type { Database, KyselyDatabaseType } from './types';
import type {
	DatabaseConfiguration,
	KyselyInstanceConfig,
	DialectConfig,
} from '~/types/database-config';

function getDatabaseType(
	db: DatabaseConfiguration | undefined
): KyselyDatabaseType | null {
	if (!db) {
		return null;
	}
	if ('dialect' in db) {
		return getDatabaseType(db.dialect as Dialect);
	}
	if ('createDriver' in db) {
		if (db instanceof SqliteDialect) {
			return 'sqlite';
		}
		if (db instanceof MysqlDialect) {
			return 'mysql';
		}
		if (db instanceof PostgresDialect) {
			return 'postgres';
		}
		if (db instanceof MssqlDialect) {
			return 'mssql';
		}
	}
	if ('aggregate' in db) {
		return 'sqlite';
	}

	if ('getConnection' in db) {
		return 'mysql';
	}
	if ('connect' in db) {
		return 'postgres';
	}

	return null;
}

export const createKyselyAdapter = async (
	config: C15TOptions
): Promise<{
	kysely: Kysely<Database> | null;
	databaseType: KyselyDatabaseType | null;
}> => {
	const db = config.database;

	if (!db) {
		return {
			kysely: null,
			databaseType: null,
		};
	}

	if ('db' in db) {
		const kyselyConfig = db as KyselyInstanceConfig;
		return {
			kysely: kyselyConfig.db,
			databaseType: kyselyConfig.type,
		};
	}

	if ('dialect' in db) {
		const dialectConfig = db as DialectConfig;
		return {
			kysely: new Kysely({ dialect: dialectConfig.dialect }),
			databaseType: dialectConfig.type,
		};
	}

	let dialect: Dialect | undefined;

	const databaseType = getDatabaseType(db);

	if ('createDriver' in db) {
		dialect = db;
	}

	if ('aggregate' in db) {
		dialect = new SqliteDialect({
			database: db,
		});
	}

	if ('getConnection' in db) {
		dialect = new MysqlDialect({
			pool: db,
		});
	}

	if ('connect' in db) {
		dialect = new PostgresDialect({
			pool: db,
		});
	}

	return {
		kysely: dialect ? new Kysely({ dialect }) : null,
		databaseType,
	};
};
