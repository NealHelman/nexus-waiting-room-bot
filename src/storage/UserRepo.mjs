import db from './db.js';

export type UserState = 'NONE' | 'AWAITING_ANSWER' | 'PENDING_REVIEW' | 'APPROVED' | 'DENIED';

export interface UserRow {
  id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  answer_text: string | null;
  state: UserState | null;
  requested_at: number | null;
  answered_at: number | null;
  decided_at: number | null;
  decision: 'approved' | 'denied' | null;
  decision_admin_id: number | null;
  invite_link: string | null;
  invite_link_created_at: number | null;
  spam_score: number | null;
}

export function upsertUser(user: {
  id: number;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  state?: UserState;
  requested_at?: number;
}): void {
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
    username: user.username ?? null,
    first_name: user.first_name ?? null,
    last_name: user.last_name ?? null,
    state: user.state ?? 'NONE',
    requested_at: user.requested_at ?? Date.now()
  });
}

export function setState(id: number, state: UserState): void {
  db.prepare(`UPDATE users SET state=@state WHERE id=@id`).run({ id, state });
}

export function recordAnswer(id: number, answerText: string, spamScore?: number): void {
  db.prepare(`
    UPDATE users
    SET answer_text=@answer_text,
        state='PENDING_REVIEW',
        answered_at=@answered_at,
        spam_score=COALESCE(@spam_score, spam_score)
    WHERE id=@id
  `).run({
    id,
    answer_text: answerText,
    answered_at: Date.now(),
    spam_score: typeof spamScore === 'number' ? spamScore : null
  });
}

export function decide(
  id: number,
  decision: 'approved' | 'denied',
  adminId: number,
  inviteLink: string | null = null
): void {
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

export function getUser(id: number): UserRow | undefined {
  return db.prepare('SELECT * FROM users WHERE id=@id').get({ id }) as UserRow | undefined;
}

export function listPending(
  limit = 50
): Array<Pick<UserRow, 'id' | 'username' | 'first_name' | 'answer_text' | 'answered_at'>> {
  return db
    .prepare(`
      SELECT id, username, first_name, answer_text, answered_at
      FROM users
      WHERE state='PENDING_REVIEW'
      ORDER BY answered_at ASC
      LIMIT @limit
    `)
    .all({ limit }) as Array<Pick<UserRow, 'id' | 'username' | 'first_name' | 'answer_text' | 'answered_at'>>;
}
