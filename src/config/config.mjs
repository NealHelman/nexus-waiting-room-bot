import { config as loadEnv } from 'dotenv';
loadEnv();

function toNumber(val, def) {
  const n = Number(val);
  return Number.isFinite(n) ? n : def;
}

export const BOT_TOKEN = process.env.BOT_TOKEN;
export const WAITING_ROOM_CHAT_ID = toNumber(process.env.WAITING_ROOM_CHAT_ID, 0);
export const PRIVATE_COMMUNITY_CHAT_ID = toNumber(process.env.PRIVATE_COMMUNITY_CHAT_ID, 0);
export const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
  .map(Number);

export const RATE_LIMIT_WINDOW_SECONDS = toNumber(process.env.RATE_LIMIT_WINDOW_SECONDS, 86400);
export const RATE_LIMIT_REQUESTS_PER_WINDOW = toNumber(process.env.RATE_LIMIT_REQUESTS_PER_WINDOW, 3);
export const RATE_LIMIT_ANSWER_ATTEMPTS = toNumber(process.env.RATE_LIMIT_ANSWER_ATTEMPTS, 3);
export const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

export function validateConfig() {
  if (!BOT_TOKEN) throw new Error('BOT_TOKEN missing');
  if (!WAITING_ROOM_CHAT_ID) throw new Error('WAITING_ROOM_CHAT_ID missing');
  if (!PRIVATE_COMMUNITY_CHAT_ID) throw new Error('PRIVATE_COMMUNITY_CHAT_ID missing');
  if (!ADMIN_USER_IDS.length) throw new Error('ADMIN_USER_IDS missing');
}
