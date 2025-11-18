import { Telegraf } from 'telegraf';
import { setState, upsertUser, recordAnswer, getUser, listPending, decide } from '../storage/userRepo.js';
import { isValidAnswer } from '../utils/validation.js';
import { notifyAdminsOfCandidate } from './handlers/adminFlow.js';
import {
  RATE_LIMIT_REQUESTS_PER_WINDOW,
  RATE_LIMIT_ANSWER_ATTEMPTS,
  ADMIN_USER_IDS,
  SPAM_AUTODENY_ENABLED,
  SPAM_AUTODENY_THRESHOLD
} from '../config/config.js';
import { rateLimit } from '../utils/rateLimit.js';
import { logUserFlow, logAdminFlow } from '../logger/logger.js';
import { evaluateAnswer } from '../utils/spam.js';

export function setupCommands(bot: Telegraf): void {
  bot.start((ctx) => {
    upsertUser({
      id: ctx.from.id,
      username: ctx.from.username ?? null,
      first_name: ctx.from.first_name ?? null,
      last_name: ctx.from.last_name ?? null
    });
    ctx.reply('Hello! Use /request to begin your Nexus community access request.');
  });

  bot.command('request', (ctx) => {
    const userId = ctx.from.id;
    const key = `request:${userId}`;
    if (!rateLimit(key, RATE_LIMIT_REQUESTS_PER_WINDOW)) {
      return ctx.reply('You have reached the request limit for the current window. Please try later.');
    }
    const user = getUser(userId);
    if (user?.state === 'PENDING_REVIEW') {
      return ctx.reply('Your answer is pending review. Please wait for an admin decision.');
    }
    if (user?.state === 'APPROVED') {
      return ctx.reply('You have already been approved.');
    }
    setState(userId, 'AWAITING_ANSWER');
    logUserFlow('request_initiated', { userId });
    ctx.reply(
      'Before I approve your request to join the Nexus community, may I ask how you found out about Nexus and what you like most about the project so far?\n\nPlease reply with your answer.'
    );
  });

  bot.command('status', (ctx) => {
    const user = getUser(ctx.from.id);
    if (!user) return ctx.reply('No record found.');
    ctx.reply(`Status: ${user.state}${user.state === 'PENDING_REVIEW' ? ' (awaiting admin decision)' : ''}`);
  });

  bot.command('pending', (ctx) => {
    if (!ADMIN_USER_IDS.includes(ctx.from.id)) {
      return ctx.reply('Not authorized.');
    }
    const pending = listPending(100);
    if (!pending.length) return ctx.reply('No pending candidates.');
    const lines = pending.map(
      (p) => `ID: ${p.id} @${p.username || p.first_name} • Answered ${(new Date(p.answered_at || 0)).toLocaleString()}`
    );
    ctx.reply(`Pending candidates (${pending.length}):\n` + lines.join('\n'));
  });

  bot.on('text', (ctx) => {
    const user = getUser(ctx.from.id);
    if (!user) return;

    if (user.state === 'AWAITING_ANSWER') {
      const attemptKey = `answer_attempt:${ctx.from.id}`;
      if (!rateLimit(attemptKey, RATE_LIMIT_ANSWER_ATTEMPTS)) {
        return ctx.reply('Too many answer attempts. Please wait and try again later.');
      }
      const answer = ctx.message.text;
      if (!isValidAnswer(answer)) {
        return ctx.reply('Could you please elaborate more? Provide at least a couple of sentences.');
      }

      const spam = evaluateAnswer(answer);
      recordAnswer(ctx.from.id, answer, spam.score);
      logUserFlow('answer_recorded', { userId: ctx.from.id, spamScore: spam.score, severity: spam.severity });

      // Optional auto-deny for high-confidence spam
      if (SPAM_AUTODENY_ENABLED && spam.score >= SPAM_AUTODENY_THRESHOLD) {
        decide(ctx.from.id, 'denied', 0, null);
        ctx.reply('Thank you for your interest. At this time, we are not approving your request.');
        logAdminFlow('auto_denied_spam', { userId: ctx.from.id, spamScore: spam.score, reasons: spam.reasons });
        return;
      }

      ctx.reply('Thank you! Your request is now pending admin review.');
      notifyAdminsOfCandidate(bot, ctx.from.id);
    }
  });
}
