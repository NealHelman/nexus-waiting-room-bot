import { ADMIN_USER_IDS, PRIVATE_COMMUNITY_CHAT_ID } from '../../config/config.mjs';
import { getUser, decide } from '../../storage/userRepo.mjs';

export function notifyAdminsOfCandidate(bot, candidateId) {
  const candidate = getUser(candidateId);
  const text = `Candidate @${candidate.username || candidate.first_name} (ID: ${candidate.id})\nAnswer:\n${candidate.answer_text}\n\nApprove or Deny?`;
  const keyboard = {
    inline_keyboard: [[
      { text: 'Approve ✅', callback_data: `approve:${candidate.id}` },
      { text: 'Deny ❌', callback_data: `deny:${candidate.id}` }
    ]]
  };
  ADMIN_USER_IDS.forEach(adminId => {
    bot.telegram.sendMessage(adminId, text, { reply_markup: keyboard });
  });
}

export function setupAdminCallbacks(bot) {
  bot.on('callback_query', async ctx => {
    const data = ctx.callbackQuery.data;
    const [action, idStr] = data.split(':');
    const candidateId = Number(idStr);
    if (!ADMIN_USER_IDS.includes(ctx.from.id)) {
      return ctx.answerCbQuery('Not authorized', { show_alert: true });
    }
    const user = getUser(candidateId);
    if (!user || user.state !== 'PENDING_REVIEW') {
      return ctx.answerCbQuery('Invalid or already decided.');
    }

    if (action === 'approve') {
      // Generate single-use invite link
      const invite = await ctx.telegram.createChatInviteLink(PRIVATE_COMMUNITY_CHAT_ID, {
        // optionally: expire_date: Math.floor(Date.now()/1000) + 86400,
        member_limit: 1,
        name: `Invite for ${user.username || user.first_name}`
      });
      decide(candidateId, 'approved', ctx.from.id, invite.invite_link);
      await ctx.telegram.sendMessage(candidateId,
        `Approved! Welcome to the Nexus Community.\nHere is your personal invite link: ${invite.invite_link}\nPlease join soon.`);
      await ctx.answerCbQuery('Approved');
      await ctx.editMessageText(`Approved ✅\nCandidate @${user.username || user.first_name}`);
    } else if (action === 'deny') {
      decide(candidateId, 'denied', ctx.from.id, null);
      await ctx.telegram.sendMessage(candidateId,
        `Thank you for your interest. At this time, we are not approving your request. You may try again later with more details.`);
      await ctx.answerCbQuery('Denied');
      await ctx.editMessageText(`Denied ❌\nCandidate @${user.username || user.first_name}`);
    }
  });
}
