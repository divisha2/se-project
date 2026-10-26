import app from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';
import { lockExpiredItems } from './modules/submissions/submissions.service';
import { enqueueAiJob } from './jobs/aiQueue';
import { validateSubmission } from './services/validation';

const server = app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT} (${env.NODE_ENV})`);
});

// FR-FAC-21: lock submissions once their deadline passes (also enforced on every write).
const lockTimer = setInterval(() => void lockExpiredItems().catch((e) => console.error('lock sweep failed:', e)), 5 * 60 * 1000);
void lockExpiredItems().catch(() => undefined);

// The AI queue lives in memory: re-queue checks that were interrupted by a restart.
void prisma.documentSubmission
  .findMany({ where: { validationStatus: 'NOT_CHECKED', isDeleted: false, isCurrentVersion: true, NOT: { storagePath: { startsWith: 'seed/' } } }, select: { id: true } })
  .then((rows) => rows.forEach((r) => enqueueAiJob(() => validateSubmission(r.id))))
  .catch(() => undefined);

const shutdown = async () => {
  clearInterval(lockTimer);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
