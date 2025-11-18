import http from 'http';
import { decide, getUser } from '../storage/userRepo.mjs';
import { ADMIN_USER_IDS, PRIVATE_COMMUNITY_CHAT_ID } from '../config/config.mjs';
import { Telegraf } from 'telegraf';
import { BOT_TOKEN } from '../config/config.mjs';

const botApi = new Telegraf(BOT_TOKEN).telegram;

// Simplified token-based approval (if you choose email link approach)
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/approve') {
    const id = Number(url.searchParams.get('id'));
    const user = getUser(id);
    if (!user || user.state !== 'PENDING_REVIEW') {
      res.writeHead(400); return res.end('Invalid candidate');
    }
    // In real version validate token
    const invite = await botApi.createChatInviteLink(PRIVATE_COMMUNITY_CHAT_ID, { member_limit: 1 });
    decide(id, 'approved', 0, invite.invite_link); // 0 = system
    await botApi.sendMessage(id, `Approved via email link. Invite: ${invite.invite_link}`);
    res.end('Approved');
  } else if (url.pathname === '/deny') {
    const id = Number(url.searchParams.get('id'));
    const user = getUser(id);
    if (!user || user.state !== 'PENDING_REVIEW') {
      res.writeHead(400); return res.end('Invalid candidate');
    }
    decide(id, 'denied', 0, null);
    await botApi.sendMessage(id, `Denied via email link. You may reapply later.`);
    res.end('Denied');
  } else {
    res.writeHead(404); res.end('Not found');
  }
});

export function launchHttpServer() {
  server.listen(8080, () => console.log('Approval link server running on :8080'));
}
