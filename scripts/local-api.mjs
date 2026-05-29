import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import analyze from '../api/analyze.js';
import analyzeAll from '../api/analyze-all.js';
import analysisLog from '../api/analysis-log.js';
import chat from '../api/chat.js';
import chart from '../api/chart.js';
import memory from '../api/memory.js';
import scan from '../api/scan.js';
import trades from '../api/trades.js';
import watchlist from '../api/watchlist.js';

function loadEnv() {
  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

function readBody(req) {
  return new Promise((resolveBody, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      if (!body) {
        resolveBody(undefined);
        return;
      }
      try {
        resolveBody(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

async function adapt(req, res) {
  const url = new URL(req.url, 'http://localhost:3000');
  req.query = Object.fromEntries(url.searchParams.entries());

  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload) => {
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json');
    }
    res.end(JSON.stringify(payload));
  };

  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    req.body = await readBody(req);
  }

  if (url.pathname === '/api/analyze') {
    await analyze(req, res);
    return;
  }

  if (url.pathname === '/api/analyze-all') {
    await analyzeAll(req, res);
    return;
  }

  if (url.pathname === '/api/analysis-log') {
    await analysisLog(req, res);
    return;
  }

  if (url.pathname === '/api/chat') {
    await chat(req, res);
    return;
  }

  if (url.pathname === '/api/chart') {
    await chart(req, res);
    return;
  }

  if (url.pathname === '/api/memory') {
    await memory(req, res);
    return;
  }

  if (url.pathname === '/api/scan') {
    await scan(req, res);
    return;
  }

  if (url.pathname === '/api/watchlist') {
    await watchlist(req, res);
    return;
  }

  if (url.pathname === '/api/trades') {
    await trades(req, res);
    return;
  }

  res.statusCode = 404;
  res.end('Not found');
}

loadEnv();

const server = createServer((req, res) => {
  adapt(req, res).catch((error) => {
    console.error(error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
    }
    res.end(JSON.stringify({ error: 'Local API server error' }));
  });
});

server.listen(3000, '127.0.0.1', () => {
  console.log('Local API ready on http://localhost:3000');
});
