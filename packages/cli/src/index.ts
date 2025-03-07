#!/usr/bin/env node

import { Command } from 'commander';
import { generate } from './commands/generate';
import { migrate } from './commands/migrate';
import 'dotenv/config';
import { generateSecret } from './commands/secret';
import { getPackageInfo } from './utils/get-package-info';

// handle exit
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

async function main() {
	const program = new Command('c15t');
	const packageInfo = await getPackageInfo();
	program
		.addCommand(migrate)
		.addCommand(generate)
		.addCommand(generateSecret)
		.version(packageInfo.version || '1.1.2')
		.description('c15t CLI');
	program.parse();
}

main();
