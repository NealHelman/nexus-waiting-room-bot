import { config as loadEnv } from 'dotenv';
loadEnv();

export const BOT_TOKEN = process.env.BOT_TOKEN;
export const WAITING_ROOM_CHAT_ID = Number(process.env.WAITING_ROOM_CHAT_ID); // group ID
export const PRIVATE_COMMUNITY_CHAT_ID = Number(process.env.PRIVATE_COMMUNITY_CHAT_ID); // private group ID
export const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS || '')
  .split(',')
  .map(x => x.trim())
  .filter(Boolean)
  .map(Number);

export const EMAIL_ENABLED = process.env.EMAIL_ENABLED === 'true';
export const SMTP_HOST = process.env.SMTP_HOST;
export const SMTP_USER = process.env.SMTP_USER;
export const SMTP_PASS = process.env.SMTP_PASS;
export const APPROVAL_BASE_URL = process.env.APPROVAL_BASE_URL; // e.g. https://nexus-bot.example.com
