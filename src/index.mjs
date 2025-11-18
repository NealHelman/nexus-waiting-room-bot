import { migrate } from './storage/db.mjs';
import { launchBot } from './bot/index.mjs';
import { launchHttpServer } from './server/httpServer.mjs';

migrate();
launchBot();
launchHttpServer(); // Only if using email link approvals
