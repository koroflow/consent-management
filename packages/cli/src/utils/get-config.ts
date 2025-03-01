import { loadConfig } from "c12";
import { logger } from "@c15t/new";
import path from "node:path";
// @ts-ignore
import babelPresetTypescript from "@babel/preset-typescript";
// @ts-ignore
import babelPresetReact from "@babel/preset-react";
import fs from "node:fs";
import { C15TError } from "@c15t/new/error";
import { addSvelteKitEnvModules } from "./add-svelte-kit-env-modules";
import type { C15TOptions } from "@c15t/new/types";

let possiblePaths = [
	"c15t.ts",
	"c15t.tsx",
	"c15t.js",
	"c15t.jsx",
	"c15t.server.js",
	"c15t.server.ts",
];

possiblePaths = [
	...possiblePaths,
	...possiblePaths.map((it) => `lib/server/${it}`),
	...possiblePaths.map((it) => `server/${it}`),
	...possiblePaths.map((it) => `lib/${it}`),
	...possiblePaths.map((it) => `utils/${it}`),
];
possiblePaths = [
	...possiblePaths,
	...possiblePaths.map((it) => `src/${it}`),
	...possiblePaths.map((it) => `app/${it}`),
];

function stripJsonComments(jsonString: string): string {
	return jsonString
		.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (m, g) =>
			g ? "" : m,
		)
		.replace(/,(?=\s*[}\]])/g, "");
}

function getPathAliases(cwd: string): Record<string, string> | null {
	const tsConfigPath = path.join(cwd, "tsconfig.json");
	if (!fs.existsSync(tsConfigPath)) {
		return null;
	}
	try {
		const tsConfigContent = fs.readFileSync(tsConfigPath, "utf8");
		const strippedTsConfigContent = stripJsonComments(tsConfigContent);
		const tsConfig = JSON.parse(strippedTsConfigContent);
		const { paths = {}, baseUrl = "." } = tsConfig.compilerOptions || {};

		const result: Record<string, string> = {};
		const obj = Object.entries(paths) as [string, string[]][];
		for (const [alias, aliasPaths] of obj) {
			for (const aliasedPath of aliasPaths) {
				const resolvedBaseUrl = path.join(cwd, baseUrl);
				const finalAlias = alias.slice(-1) === "*" ? alias.slice(0, -1) : alias;
				const finalAliasedPath =
					aliasedPath.slice(-1) === "*"
						? aliasedPath.slice(0, -1)
						: aliasedPath;

				result[finalAlias || ""] = path.join(resolvedBaseUrl, finalAliasedPath);
			}
		}
		addSvelteKitEnvModules(result);
		return result;
	} catch (error) {
		console.error(error);
		throw new C15TError("Error parsing tsconfig.json");
	}
}
/**
 * .tsx files are not supported by Jiti.
 */
const jitiOptions = (cwd: string) => {
	const alias = getPathAliases(cwd) || {};
	return {
		transformOptions: {
			babel: {
				presets: [
					[
						babelPresetTypescript,
						{
							isTSX: true,
							allExtensions: true,
						},
					],
					[babelPresetReact, { runtime: "automatic" }],
				],
			},
		},
		extensions: [".ts", ".tsx", ".js", ".jsx"],
		alias,
	};
};
export async function getConfig({
	cwd,
	configPath,
}: {
	cwd: string;
	configPath?: string;
}) {
	try {
		let configFile: C15TOptions | null = null;
		if (configPath) {
			const resolvedPath = path.join(cwd, configPath);
			const { config } = await loadConfig<{
				c15t: {
					options: C15TOptions;
				};
				default?: {
					options: C15TOptions;
				};
			}>({
				configFile: resolvedPath,
				dotenv: true,
				jitiOptions: jitiOptions(cwd),
			});

			if (!config.c15t && !config.default) {
				logger.error(
					`[#c15t]: Couldn't read your c15t config in ${resolvedPath}. Make sure to default export your c15t instance or to export as a variable named c15t.`,
				);
				process.exit(1);
			}
			configFile = config.c15t?.options || config.default?.options || null;
		}

		if (!configFile) {
			for (const possiblePath of possiblePaths) {
				try {
					const { config } = await loadConfig<{
						c15t: {
							options: C15TOptions;
						};
						default?: {
							options: C15TOptions;
						};
					}>({
						configFile: possiblePath,
						jitiOptions: jitiOptions(cwd),
					});
					const hasConfig = Object.keys(config).length > 0;
					if (hasConfig) {
						logger.debug("Found c15t config in", possiblePath);
						configFile =
							config.c15t?.options || config.default?.options || null;
						logger.debug("Config file", configFile);
						if (!configFile) {
							logger.error("[#c15t]: Couldn't read your c15t config.");
							logger.info(
								"[#c15t]: Make sure to default export your c15t instance or to export as a variable named c15t.",
							);
							process.exit(1);
						}
						break;
					}
				} catch (e) {
					if (
						typeof e === "object" &&
						e &&
						"message" in e &&
						typeof e.message === "string" &&
						e.message.includes(
							"This module cannot be imported from a Client Component module",
						)
					) {
						logger.error(
							`Please remove import 'server-only' from your c15t config file temporarily. The CLI cannot resolve the configuration with it included. You can re-add it after running the CLI.`,
						);
						process.exit(1);
					}
					logger.error("[#c15t]: Couldn't read your c15t config.", e);
					process.exit(1);
				}
			}
		}
		return configFile;
	} catch (e) {
		if (
			typeof e === "object" &&
			e &&
			"message" in e &&
			typeof e.message === "string" &&
			e.message.includes(
				"This module cannot be imported from a Client Component module",
			)
		) {
			logger.error(
				`Please remove import 'server-only' from your c15t config file temporarily. The CLI cannot resolve the configuration with it included. You can re-add it after running the CLI.`,
			);
			process.exit(1);
		}
		logger.error("Couldn't read your c15t config.", e);
		process.exit(1);
	}
}

export { possiblePaths };
