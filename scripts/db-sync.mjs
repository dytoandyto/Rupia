import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const envPath = path.resolve(process.cwd(), '.env');
let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('DATABASE_URL=')) {
      databaseUrl = trimmed.replace('DATABASE_URL=', '').replace(/^["']|["']$/g, '');
      break;
    }
  }
}

const isPostgres = databaseUrl && (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://'));
const schemaFile = isPostgres ? 'prisma/schema.prisma' : 'prisma/schema.sqlite.prisma';

console.log(`[RUPIA DB] Using ${isPostgres ? 'PostgreSQL' : 'SQLite'} schema: ${schemaFile}`);

try {
  // If SQLite and not set, ensure DATABASE_URL is set
  const env = { ...process.env };
  if (!isPostgres && !env.DATABASE_URL) {
    env.DATABASE_URL = 'file:./dev.db';
  }

  execSync(`npx.cmd prisma generate --schema=${schemaFile}`, { stdio: 'inherit', env });
  execSync(`npx.cmd prisma db push --schema=${schemaFile}`, { stdio: 'inherit', env });
  console.log('[RUPIA DB] Database synchronized successfully!');
} catch (err) {
  console.error('[RUPIA DB] Error synchronizing database:', err);
  process.exit(1);
}

