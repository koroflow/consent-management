/**
 * Logging Utilities for c15t
 *
 * This module provides a configurable logging system for the c15t
 * consent management system, supporting different log levels and
 * custom logger implementations.
 */
import type { c15tOptions } from '../types/options';
import type { LoggerMetadata } from '../types/options';

/**
 * Log levels supported by the logging system
 * Levels are ordered by increasing severity: debug < info < warn < error
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Interface for logger implementations
 *
 * All loggers used in c15t must implement this interface, which
 * provides methods for logging messages at different severity levels.
 */
export interface LoggerInterface {
	/**
	 * Logs a debug-level message
	 * @param message - The message to log
	 * @param meta - Optional metadata to include with the log
	 */
	debug: (message: string, meta?: LoggerMetadata) => void;

	/**
	 * Logs an info-level message
	 * @param message - The message to log
	 * @param meta - Optional metadata to include with the log
	 */
	info: (message: string, meta?: LoggerMetadata) => void;

	/**
	 * Logs a warning-level message
	 * @param message - The message to log
	 * @param meta - Optional metadata to include with the log
	 */
	warn: (message: string, meta?: LoggerMetadata) => void;

	/**
	 * Logs an error-level message
	 * @param message - The message to log
	 * @param meta - Optional metadata to include with the log
	 */
	error: (message: string, meta?: LoggerMetadata) => void;
}

/**
 * Creates a logger instance based on the provided configuration
 *
 * This function returns a logger that respects the configured log level
 * and can either use a custom logger implementation or fall back to
 * a default console-based logger.
 *
 * @param config - Logger configuration options
 * @returns A logger instance implementing the LoggerInterface
 *
 * @example
 * ```typescript
 * // Create a default logger
 * const logger = createLogger();
 * logger.info('Application started');
 *
 * // Create a logger with custom level
 * const debugLogger = createLogger({ level: 'debug' });
 * debugLogger.debug('Debug information', { requestId: '123' });
 * ```
 */
export function createLogger(config?: c15tOptions['logger']): LoggerInterface {
	const level = config?.level || (isProduction() ? 'info' : 'debug');
	const levels: Record<LogLevel, number> = {
		debug: 0,
		info: 1,
		warn: 2,
		error: 3,
	};

	/**
	 * Determines if a message at the given level should be logged
	 * based on the configured minimum log level
	 *
	 * @param messageLevel - The level of the message to be logged
	 * @returns True if the message should be logged, false otherwise
	 */
	const shouldLog = (messageLevel: LogLevel): boolean => {
		return levels[messageLevel] >= levels[level];
	};

	// Use custom logger if provided
	if (config?.custom) {
		return config.custom;
	}

	// Default console-based logger
	return {
		debug: (message: string, meta?: LoggerMetadata) => {
			if (shouldLog('debug')) {
				if (meta) {
					console.debug(`[c15t:debug] ${message}`, meta);
				} else {
					console.debug(`[c15t:debug] ${message}`);
				}
			}
		},
		info: (message: string, meta?: LoggerMetadata) => {
			if (shouldLog('info')) {
				if (meta) {
					console.info(`[c15t:info] ${message}`, meta);
				} else {
					console.info(`[c15t:info] ${message}`);
				}
			}
		},
		warn: (message: string, meta?: LoggerMetadata) => {
			if (shouldLog('warn')) {
				if (meta) {
					console.warn(`[c15t:warn] ${message}`, meta);
				} else {
					console.warn(`[c15t:warn] ${message}`);
				}
			}
		},
		error: (message: string, meta?: LoggerMetadata) => {
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

/**
 * Checks if the application is running in production mode
 *
 * @returns True if NODE_ENV is set to 'production', false otherwise
 */
function isProduction(): boolean {
	return process.env.NODE_ENV === 'production';
}
