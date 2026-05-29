import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { neon } from '@neondatabase/serverless';

function loadEnv() {
  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv();

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is missing. Add it to .env first.');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

await sql`
  create table if not exists app_users (
    id text primary key,
    created_at timestamptz not null default now(),
    preferences jsonb not null default '{}'::jsonb
  )
`;

await sql`
  create table if not exists watchlist_items (
    user_id text not null references app_users(id) on delete cascade,
    ticker text not null,
    added_at timestamptz not null default now(),
    last_analysis jsonb,
    analyzed_at timestamptz,
    primary key (user_id, ticker)
  )
`;

await sql`
  create table if not exists analyses (
    id bigserial primary key,
    user_id text not null references app_users(id) on delete cascade,
    ticker text not null,
    timeframe text not null,
    analysis jsonb not null,
    created_at timestamptz not null default now()
  )
`;

await sql`
  create table if not exists scanner_runs (
    id bigserial primary key,
    user_id text not null references app_users(id) on delete cascade,
    universe text not null,
    results jsonb not null,
    created_at timestamptz not null default now()
  )
`;

await sql`
  create table if not exists trade_logs (
    id bigserial primary key,
    user_id text not null references app_users(id) on delete cascade,
    ticker text not null,
    direction text not null check (direction in ('long', 'short')),
    entry_price numeric not null,
    exit_price numeric,
    shares numeric not null,
    date_opened date not null,
    date_closed date,
    notes text not null default '',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )
`;

await sql`
  create table if not exists chat_messages (
    id bigserial primary key,
    user_id text not null references app_users(id) on delete cascade,
    role text not null check (role in ('user', 'assistant')),
    content text not null,
    created_at timestamptz not null default now()
  )
`;

await sql`
  create table if not exists user_events (
    id bigserial primary key,
    user_id text not null references app_users(id) on delete cascade,
    event_type text not null,
    payload jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
  )
`;

const userId = process.env.APP_USER_ID || 'ameya';
await sql`
  insert into app_users (id)
  values (${userId})
  on conflict (id) do nothing
`;

console.log(`Database ready for user "${userId}".`);
