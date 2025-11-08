# NexusWaitingRoomBot (TypeScript / ESM)

Telegram-only approval workflow for gating access to the private Nexus Community group.

## Flow
1. User joins public group (NexusOfficial) → Bot greets publicly and instructs user to DM `/request`.
2. User issues `/request` → Bot asks the qualifying question.
3. User answers → Admins receive inline Approve / Deny buttons in DM (plus Mark Spam 🚫).
4. Admin approves → Bot generates single-use invite link (`member_limit=1`) and DMs user.
5. Admin denies → Bot DMs a polite denial.

## Requirements
- Bot added to:
  - Public waiting room group (NexusOfficial) — disable privacy mode in BotFather.
  - Private community group as admin (must have "Invite Users via Link").
- Node.js >= 20.
- Fill `.env`.

## Commands
- `/request`
- `/status`
- (Admin) `/pending`

## Rate Limiting
- Limits `/request` attempts per time window.
- Limits answer submission attempts while in `AWAITING_ANSWER`.

## Spam Heuristics
- Heuristic scoring (0..1) with configurable keywords and ham hints.
- Auto-deny toggle with threshold.
- Admin message includes suspicion level and quick Mark Spam button.

## Setup
```bash
cp .env.example .env
npm install
npm run dev   # watch mode
npm run build
npm start
```

## Logging
Structured JSON via Winston (`LOG_LEVEL` controls verbosity).

## Notes
Internal imports include `.js` suffix for Node ESM compatibility under `moduleResolution: NodeNext`. TypeScript emits `.js` files matching those specifiers.

## Future Enhancements
- Persistent rate limiter.
- Spam heuristic refinements.
- `/revoke` command.
- Join-request approval alternative flow.
