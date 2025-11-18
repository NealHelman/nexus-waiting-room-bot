import { setState, upsertUser, recordAnswer, getUser } from '../storage/userRepo.mjs';
import { isValidAnswer } from '../utils/validation.mjs';
import { notifyAdminsOfCandidate } from './handlers/adminFlow.mjs';

export function setupCommands(bot) {

  bot.start(ctx => {
    upsertUser({ id: ctx.from.id, username: ctx.from.username, first_name: ctx.from.first_name, last_name: ctx.from.last_name });
    ctx.reply('Hello! Use /request to begin your Nexus community access request.');
  });

  bot.command('request', ctx => {
    const user = getUser(ctx.from.id);
    if (user?.state === 'PENDING_REVIEW') {
      return ctx.reply('Your answer is pending review. Please wait for an admin decision.');
    }
    setState(ctx.from.id, 'AWAITING_ANSWER');
    ctx.reply('Before I approve your request to join the Nexus community, may I ask how you found out about Nexus and what you like most about the project so far?\n\nPlease reply with your answer.');
  });

  bot.on('text', ctx => {
    const user = getUser(ctx.from.id);
    if (!user) return;
    if (user.state === 'AWAITING_ANSWER') {
      const answer = ctx.message.text;
      if (!isValidAnswer(answer)) {
        return ctx.reply('Could you please elaborate a bit more? Provide at least a sentence or two.');
      }
      recordAnswer(ctx.from.id, answer);
      ctx.reply('Thank you! Your request is now pending admin review.');
      notifyAdminsOfCandidate(bot, ctx.from.id);
    }
  });

}
