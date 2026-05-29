import { neon } from '@neondatabase/serverless';

let sqlClient;

export function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured');
  }
  if (!sqlClient) {
    sqlClient = neon(process.env.DATABASE_URL);
  }
  return sqlClient;
}

export function getUserId(req) {
  const fromHeader = req?.headers?.['x-user-id'];
  const value = Array.isArray(fromHeader) ? fromHeader[0] : fromHeader;
  return (value || process.env.APP_USER_ID || 'ameya').toString().slice(0, 80);
}

export async function ensureUser(sql, userId) {
  await sql`
    insert into app_users (id)
    values (${userId})
    on conflict (id) do nothing
  `;
}

export function setJsonCors(res, methods = 'GET, POST, OPTIONS') {
  res.setHeader('Access-Control-Allow-Origin', process.env.APP_ORIGIN || 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-User-Id');
  res.setHeader('Vary', 'Origin');
}
