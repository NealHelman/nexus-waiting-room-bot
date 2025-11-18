import { Telegraf } from 'telegraf';
import { ADMIN_USER_IDS, PRIVATE_COMMUNITY_CHAT_ID, SPAM_NOTIFY_THRESHOLD } from '../../config/config.js';
import { getUser, decide } from '../../storage/userRepo.js';
import { logAdminFlow, logError, logSecurity } from '../../logger/logger.js';
import { Update } from 'telegraf/types';

export function notifyAdminsOfCandidate(bot: Telegraf, candidateId: number): void {
  const candidate = getUser(candidateId);
  if (!candidate) return;

  const spamScore = typeof candidate.spam_score === 'number' ? candidate.spam_score : 0;
  const suspicious = spamScore >= SPAM_NOTIFY_THRESHOLD;
  const suspicionLine = suspicious ? `Suspicion: HIGH (score ${spamScore.toFixed(2)})` : `Suspicion: LOW (score ${spamScore.toFixed(2)})`;

  const text =
    `${suspicionLine}\n` +
    `Candidate: @${candidate.username || candidate.first_name} (ID: ${candidate.id})\n\n` +
    `Answer:\n${candidate.answer_text ?? ''}\n\n` +
    `Actions:`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: 'Approve ✅', callback_data: `approve:${candidate.id}` },
        { text: 'Deny ❌', callback_data: `deny:${candidate.id}` },
        { text: 'Mark Spam 🚫', callback_data: `spam:${candidate.id}` }
      ]
    ]
  };

  ADMIN_USER_IDS.forEach((adminId) => {
    bot.telegram
      .sendMessage(adminId, text, { reply_markup: keyboard })
      .catch((err) => logError(err, { context: 'notify_admin', adminId }));
  });
  logAdminFlow('candidate_notified_admins', { candidateId, admins: ADMIN_USER_IDS, spamScore });
}

export function setupAdminCallbacks(bot: Telegraf): void {
  bot.on('callback_query', async (ctx) => {
    const data = (ctx.callbackQuery as Update.CallbackQuery.DataCallbackQuery).data;
    if (!data) return;

    const [action, idStr] = data.split(':');
    const candidateId = Number(idStr);

    if (!ADMIN_USER_IDS.includes(ctx.from.id)) {
      logSecurity('unauthorized_callback', { from: ctx.from.id, action, candidateId });
      return ctx.answerCbQuery('Not authorized', { show_alert: true });
    }

    const user = getUser(candidateId);
    if (!user || user.state !== 'PENDING_REVIEW') {
      return ctx.answerCbQuery('Invalid or already processed');
    }

    try {
      if (action === 'approve') {
        const invite = await ctx.telegram.createChatInviteLink(PRIVATE_COMMUNITY_CHAT_ID, {
          member_limit: 1,
          name: `Invite ${user.username || user.first_name}`
        });
        decide(candidateId, 'approved', ctx.from.id, invite.invite_link);
        await ctx.telegram.sendMessage(
          candidateId,
          `Approved! Welcome to the Nexus Community.\nYour personal invite link (single-use):\n${invite.invite_link}\nPlease join soon.`
        );
        await ctx.answerCbQuery('Approved');
        await ctx.editMessageText(`Approved ✅\nCandidate @${user.username || user.first_name}`);
        logAdminFlow('candidate_approved', { adminId: ctx.from.id, candidateId, invite: invite.invite_link });
      } else if (action === 'deny') {
        decide(candidateId, 'denied', ctx.from.id, null);
        await ctx.telegram.sendMessage(
          candidateId,
          `Thank you for your interest. At this time, we are not approving your request. You may reapply later with more details.`
        );
        await ctx.answerCbQuery('Denied');
        await ctx.editMessageText(`Denied ❌\nCandidate @${user.username || user.first_name}`);
        logAdminFlow('candidate_denied', { adminId: ctx.from.id, candidateId });
      } else if (action === 'spam') {
        decide(candidateId, 'denied', ctx.from.id, null);
        await ctx.telegram.sendMessage(
          candidateId,
          `Thank you for your interest. At this time, we are not approving your request.`
        );
        await ctx.answerCbQuery('Marked as spam');
        await ctx.editMessageText(`Denied (Spam) 🚫\nCandidate @${user.username || user.first_name}`);
        logAdminFlow('candidate_marked_spam', { adminId: ctx.from.id, candidateId, spamScore: user.spam_score });
      } else {
        await ctx.answerCbQuery('Unknown action');
      }
    } catch (err) {
      logError(err, { candidateId, action });
      await ctx.answerCbQuery('Error, try again');
    }
  });
}
