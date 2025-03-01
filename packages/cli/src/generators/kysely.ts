import { getMigrations } from "@c15t/new/db";
import type { SchemaGenerator } from "./types";

export const generateMigrations: SchemaGenerator = async ({
	options,
	file,
}) => {
	const { compileMigrations } = await getMigrations(options);
	const migrations = await compileMigrations();
	return {
		code: migrations,
		fileName:
			file ||
			`./c15t_migrations/${new Date()
				.toISOString()
				.replace(/:/g, "-")}.sql`,
	};
};
