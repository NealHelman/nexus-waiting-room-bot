import { BOT_TOKEN } from '../config/config.mjs';
import { Telegraf } from 'telegraf';
import { setupCommands } from './commands.mjs';
import { setupGroupEvents } from './handlers/groupEvents.mjs';
import { setupAdminCallbacks } from './handlers/adminFlow.mjs';

const bot = new Telegraf(BOT_TOKEN);

setupCommands(bot);
setupGroupEvents(bot);
setupAdminCallbacks(bot);

export function launchBot() {
  bot.launch();
  console.log('NexusWaitingRoomBot launched.');
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}
