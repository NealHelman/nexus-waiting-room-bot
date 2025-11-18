import { setState, upsertUser, recordAnswer, getUser, listPending } from '../storage/userRepo.mjs';
import { isValidAnswer } from '../utils/validation.mjs';
import { notifyAdminsOfCandidate } from './handlers/adminFlow.mjs';
import {
  RATE_LIMIT_REQUESTS_PER_WINDOW,
  RATE_LIMIT_ANSWER_ATTEMPTS,
  ADMIN_USER_IDS
} from '../config/config.mjs';
import { rateLimit } from '../utils/rateLimit.mjs';
import { logUserFlow } from '../logger/logger.mjs';

export function setupCommands(bot) {

  bot.start(ctx => {
    upsertUser({ id: ctx.from.id, username: ctx.from.username, first_name: ctx.from.first_name, last_name: ctx.from.last_name });
    ctx.reply('Hello! Use /request to begin your Nexus community access request.');
  });

  bot.command('request', ctx => {
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

  bot.command('status', ctx => {
    const user = getUser(ctx.from.id);
    if (!user) return ctx.reply('No record found.');
    ctx.reply(`Status: ${user.state}${user.state === 'PENDING_REVIEW' ? ' (awaiting admin decision)' : ''}`);
  });

  bot.command('pending', ctx => {
    if (!ADMIN_USER_IDS.includes(ctx.from.id)) {
      return ctx.reply('Not authorized.');
    }
    const pending = listPending(100);
    if (!pending.length) return ctx.reply('No pending candidates.');
    const lines = pending.map(p =>
      `ID: ${p.id} @${p.username || p.first_name} • Answered ${(new Date(p.answered_at)).toLocaleString()}`
    );
    ctx.reply(`Pending candidates (${pending.length}):\n` + lines.join('\n'));
  });

  bot.on('text', ctx => {
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
      recordAnswer(ctx.from.id, answer);
      logUserFlow('answer_recorded', { userId: ctx.from.id });
      ctx.reply('Thank you! Your request is now pending admin review.');
      notifyAdminsOfCandidate(bot, ctx.from.id);
    }
  });

}
