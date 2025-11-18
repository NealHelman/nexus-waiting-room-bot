import { BOT_TOKEN } from '../config/config.mjs';
import { Telegraf } from 'telegraf';
import { setupCommands } from './commands.mjs';
import { setupGroupEvents } from './handlers/groupEvents.mjs';
import { setupAdminCallbacks } from './handlers/adminFlow.mjs';
import { logSystem, logError } from '../logger/logger.mjs';

const bot = new Telegraf(BOT_TOKEN);

export function launchBot() {
  setupCommands(bot);
  setupGroupEvents(bot);
  setupAdminCallbacks(bot);

  bot.launch()
    .then(() => logSystem('bot_launched'))
    .catch(err => logError(err, { context: 'bot_launch' }));

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

export { bot };
