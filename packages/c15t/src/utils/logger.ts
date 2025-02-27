import type { C15tOptions } from '../types/options';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LoggerInterface {
	debug: (message: string, meta?: any) => void;
	info: (message: string, meta?: any) => void;
	warn: (message: string, meta?: any) => void;
	error: (message: string, meta?: any) => void;
}

export function createLogger(config?: C15tOptions['logger']): LoggerInterface {
	const level = config?.level || (isProduction() ? 'info' : 'debug');
	const levels: Record<LogLevel, number> = {
		debug: 0,
		info: 1,
		warn: 2,
		error: 3,
	};

	const shouldLog = (messageLevel: LogLevel): boolean => {
		return levels[messageLevel] >= levels[level];
	};

	// Use custom logger if provided
	if (config?.custom) {
		return config.custom;
	}

	// Default console-based logger
	return {
		debug: (message, meta) => {
			if (shouldLog('debug')) {
				if (meta) {
					console.debug(`[c15t:debug] ${message}`, meta);
				} else {
					console.debug(`[c15t:debug] ${message}`);
				}
			}
		},
		info: (message, meta) => {
			if (shouldLog('info')) {
				if (meta) {
					console.info(`[c15t:info] ${message}`, meta);
				} else {
					console.info(`[c15t:info] ${message}`);
				}
			}
		},
		warn: (message, meta) => {
			if (shouldLog('warn')) {
				if (meta) {
					console.warn(`[c15t:warn] ${message}`, meta);
				} else {
					console.warn(`[c15t:warn] ${message}`);
				}
			}
		},
		error: (message, meta) => {
			if (shouldLog('error')) {
				if (meta) {
					console.error(`[c15t:error] ${message}`, meta);
				} else {
					console.error(`[c15t:error] ${message}`);
				}
			}
		},
	};
}

function isProduction(): boolean {
	return process.env.NODE_ENV === 'production';
}
