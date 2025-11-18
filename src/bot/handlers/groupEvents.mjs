import { upsertUser } from '../../storage/userRepo.mjs';
import { WAITING_ROOM_CHAT_ID } from '../../config/config.mjs';
import { logUserFlow } from '../../logger/logger.mjs';

export function setupGroupEvents(bot) {
  bot.on('new_chat_members', ctx => {
    if (ctx.chat.id !== WAITING_ROOM_CHAT_ID) return;
    ctx.message.new_chat_members.forEach(member => {
      upsertUser({
        id: member.id,
        username: member.username,
        first_name: member.first_name,
        last_name: member.last_name
      });
      logUserFlow('new_member_waiting_room', { userId: member.id });
      ctx.reply(
        `Welcome ${member.username ? '@' + member.username : member.first_name}! ` +
        `To request access to the Nexus Community, please DM me and send /request.`
      );
    });
  });
}
