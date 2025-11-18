import db from './db.mjs';

export function upsertUser(user) {
  const stmt = db.prepare(`
    INSERT INTO users (id, username, first_name, last_name, state, requested_at)
    VALUES (@id, @username, @first_name, @last_name, @state, @requested_at)
    ON CONFLICT(id) DO UPDATE SET
      username=@username,
      first_name=@first_name,
      last_name=@last_name
  `);
  stmt.run({
    id: user.id,
    username: user.username || null,
    first_name: user.first_name || null,
    last_name: user.last_name || null,
    state: user.state || 'NONE',
    requested_at: user.requested_at || Date.now()
  });
}

export function setState(id, state) {
  db.prepare(`UPDATE users SET state=@state WHERE id=@id`).run({ id, state });
}

export function recordAnswer(id, answerText) {
  db.prepare(`
    UPDATE users SET answer_text=@answer_text, state='PENDING_REVIEW', answered_at=@answered_at
    WHERE id=@id
  `).run({ id, answer_text: answerText, answered_at: Date.now() });
}

export function decide(id, decision, adminId, inviteLink = null) {
  db.prepare(`
    UPDATE users SET decision=@decision, decision_admin_id=@adminId, decided_at=@decided_at,
      state=@state, invite_link=@invite_link, invite_link_created_at=@invite_link_created_at
    WHERE id=@id
  `).run({
    id,
    decision,
    adminId,
    decided_at: Date.now(),
    state: decision === 'approved' ? 'APPROVED' : 'DENIED',
    invite_link: inviteLink,
    invite_link_created_at: inviteLink ? Date.now() : null
  });
}

export function getUser(id) {
  return db.prepare(`SELECT * FROM users WHERE id=@id`).get({ id });
}
