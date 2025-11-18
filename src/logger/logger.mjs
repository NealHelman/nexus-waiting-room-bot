import winston from 'winston';
import { LOG_LEVEL } from '../config/config.mjs';

export const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

// Helper wrappers for semantic logging
export function logUserFlow(event, meta = {}) {
  logger.info({ category: 'user_flow', event, ...meta });
}
export function logAdminFlow(event, meta = {}) {
  logger.info({ category: 'admin_flow', event, ...meta });
}
export function logSecurity(event, meta = {}) {
  logger.warn({ category: 'security', event, ...meta });
}
export function logSystem(event, meta = {}) {
  logger.info({ category: 'system', event, ...meta });
}
export function logError(err, meta = {}) {
  logger.error({ category: 'error', message: err.message, stack: err.stack, ...meta });
}
