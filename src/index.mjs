import { migrate } from './storage/db.mjs';
import { validateConfig } from './config/config.mjs';
import { launchBot } from './bot/index.mjs';
import { logSystem, logError } from './logger/logger.mjs';

try {
  validateConfig();
  migrate();
  launchBot();
  logSystem('startup_complete');
} catch (err) {
  logError(err, { context: 'startup' });
  process.exit(1);
}
