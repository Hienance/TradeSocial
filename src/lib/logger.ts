import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'server-only';

const LOG_DIR = path.resolve(process.cwd(), 'logs');

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

export type LogEvent =
  | { type: 'sign-up'; userId: string; email: string }
  | { type: 'sign-in'; userId: string; email: string }
  | { type: 'sign-out'; userId: string }
  | { type: 'checkout'; userId: string; tenantSlug: string; productIds: string[]; totalCents?: number };

export async function writeLog(event: LogEvent) {
  try {
    ensureLogDir();
    const date = new Date();
    const day = date.toISOString().slice(0, 10); // YYYY-MM-DD
    const filePath = path.join(LOG_DIR, `${day}.log`);
    const line = JSON.stringify({
      ts: date.toISOString(),
      ...event,
    });
    await fs.promises.appendFile(filePath, line + '\n', 'utf8');
  } catch (err) {
    console.error('Failed to write log', err);
  }
}