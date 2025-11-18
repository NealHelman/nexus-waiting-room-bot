import { config as loadEnv } from 'dotenv';
loadEnv();

const toNumber = (val: unknown, def: number): number => {
  const n = Number(val);
  return Number.isFinite(n) ? n : def;
};

export const BOT_TOKEN = process.env.BOT_TOKEN || '';
export const WAITING_ROOM_CHAT_ID = toNumber(process.env.WAITING_ROOM_CHAT_ID, 0);
export const PRIVATE_COMMUNITY_CHAT_ID = toNumber(process.env.PRIVATE_COMMUNITY_CHAT_ID, 0);
export const ADMIN_USER_IDS: number[] = (process.env.ADMIN_USER_IDS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
  .map(Number)
  .filter((n) => Number.isFinite(n));

export const RATE_LIMIT_WINDOW_SECONDS = toNumber(process.env.RATE_LIMIT_WINDOW_SECONDS, 86400);
export const RATE_LIMIT_REQUESTS_PER_WINDOW = toNumber(process.env.RATE_LIMIT_REQUESTS_PER_WINDOW, 3);
export const RATE_LIMIT_ANSWER_ATTEMPTS = toNumber(process.env.RATE_LIMIT_ANSWER_ATTEMPTS, 3);
export const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// Spam config
export const SPAM_NOTIFY_THRESHOLD = toNumber(process.env.SPAM_NOTIFY_THRESHOLD, 0.6);
export const SPAM_AUTODENY_THRESHOLD = toNumber(process.env.SPAM_AUTODENY_THRESHOLD, 0.92);
export const SPAM_AUTODENY_ENABLED = process.env.SPAM_AUTODENY_ENABLED === 'true';

export const SPAM_KEYWORDS: string[] = (process.env.SPAM_KEYWORDS ||
  'profit,whatsapp,signal,investment,forex,crypto,binance,okx,airdrop,testimony,mentor,account manager,roi,return on investment,loan,verify,contact me,dm me,marketing,promo')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export const HAM_HINTS: string[] = (process.env.HAM_HINTS ||
  'nexus,whitepaper,governance,roadmap,validator,staking,community call,dev update,github,docs,tokenomics,wallet,node,bridge')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export function validateConfig(): void {
  if (!BOT_TOKEN) throw new Error('BOT_TOKEN missing');
  if (!WAITING_ROOM_CHAT_ID) throw new Error('WAITING_ROOM_CHAT_ID missing');
  if (!PRIVATE_COMMUNITY_CHAT_ID) throw new Error('PRIVATE_COMMUNITY_CHAT_ID missing');
  if (!ADMIN_USER_IDS.length) throw new Error('ADMIN_USER_IDS missing');
}
