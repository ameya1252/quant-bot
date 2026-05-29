import { analyzeCandidate, UNIVERSES } from '../src/utils/quantScanner.js';

async function fetchCandles(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1y&includePrePost=false`;
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        Accept: 'application/json',
      },
    });
    if (!response.ok) return null;
    const data = await response.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;
    const timestamps = result.timestamp || [];
    const quote = result.indicators?.quote?.[0] || {};
    const { open = [], high = [], low = [], close = [], volume = [] } = quote;
    return timestamps
      .map((ts, i) => ({
        date: new Date(ts * 1000).toISOString().slice(0, 10),
        open: open[i], high: high[i], low: low[i], close: close[i],
        volume: volume[i] ?? 0,
      }))
      .filter((c) => Number.isFinite(c.close));
  } catch {
    return null;
  }
}

async function mapLimit(items, limit, mapper) {
  const results = [];
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const current = items[index];
      index += 1;
      results.push(await mapper(current));
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

function buildEmailHtml(picks, date, appUrl, universeSize) {
  const scoreColor = (score) =>
    score >= 78 ? '#16a34a' : score >= 65 ? '#d97706' : '#6b7280';
  const scoreBg = (score) =>
    score >= 78 ? '#dcfce7' : score >= 65 ? '#fef3c7' : '#f3f4f6';
  const actionLabel = (action) =>
    ({ BUY_ZONE: '🟢 BUY ZONE', WATCH_BREAKOUT: '🟡 WATCH', WAIT: '⚪ WAIT' })[action] ?? action;

  const rows = picks
    .map(
      (p) => `
    <tr>
      <td style="padding:14px 16px 6px;border-top:1px solid #f0f0f0;">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <span style="font-family:monospace;font-weight:700;font-size:17px;color:#111;">${p.ticker}</span>
          <span style="background:${scoreBg(p.score)};color:${scoreColor(p.score)};padding:2px 9px;border-radius:20px;font-size:12px;font-weight:700;">${actionLabel(p.action)}</span>
          <span style="font-family:monospace;font-weight:800;font-size:18px;color:${scoreColor(p.score)};margin-left:auto;">${p.score}<span style="font-size:11px;font-weight:400;color:#9ca3af;">/100</span></span>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding:4px 16px 14px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:12px;color:#6b7280;padding-bottom:6px;" colspan="3">
              ${p.reasons.slice(0, 3).map((r) => `• ${r}`).join(' &nbsp;·&nbsp; ')}
            </td>
          </tr>
          <tr>
            <td style="font-size:12px;">
              <div style="color:#9ca3af;margin-bottom:2px;text-transform:uppercase;letter-spacing:0.5px;font-size:10px;">Price</div>
              <div style="font-family:monospace;font-weight:600;color:#111;">$${p.price.toFixed(2)}</div>
            </td>
            <td style="font-size:12px;">
              <div style="color:#9ca3af;margin-bottom:2px;text-transform:uppercase;letter-spacing:0.5px;font-size:10px;">Entry</div>
              <div style="font-family:monospace;font-weight:600;color:#2563eb;">$${p.entry.low.toFixed(2)}–$${p.entry.high.toFixed(2)}</div>
            </td>
            <td style="font-size:12px;">
              <div style="color:#9ca3af;margin-bottom:2px;text-transform:uppercase;letter-spacing:0.5px;font-size:10px;">Stop</div>
              <div style="font-family:monospace;font-weight:600;color:#dc2626;">$${p.stopLoss.toFixed(2)}</div>
            </td>
            <td style="font-size:12px;">
              <div style="color:#9ca3af;margin-bottom:2px;text-transform:uppercase;letter-spacing:0.5px;font-size:10px;">TP1</div>
              <div style="font-family:monospace;font-weight:600;color:#16a34a;">$${p.targets.tp1.toFixed(2)}</div>
            </td>
            <td style="text-align:right;">
              <a href="${appUrl}/?t=${p.ticker}" style="display:inline-block;background:#111;color:#fff;padding:7px 14px;border-radius:6px;text-decoration:none;font-size:12px;font-weight:600;">Deep Analyze →</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>`,
    )
    .join('');

  const hasBuyZone = picks.some((p) => p.action === 'BUY_ZONE');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>AI Trader Nightly Alert</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#111;padding:28px 24px;">
            <div style="color:#00c46a;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;font-family:monospace;margin-bottom:8px;">▶ AI TRADER</div>
            <div style="color:#ffffff;font-size:22px;font-weight:700;margin-bottom:4px;">Nightly Scanner Alert</div>
            <div style="color:#888;font-size:13px;">${date}</div>
          </td>
        </tr>

        <!-- Summary bar -->
        <tr>
          <td style="background:${hasBuyZone ? '#f0fdf4' : '#fffbeb'};padding:14px 24px;border-bottom:1px solid ${hasBuyZone ? '#bbf7d0' : '#fde68a'};">
            <span style="color:${hasBuyZone ? '#15803d' : '#92400e'};font-weight:700;font-size:14px;">
              ${hasBuyZone ? '🟢' : '🟡'} ${picks.length} setup${picks.length !== 1 ? 's' : ''} found
            </span>
            <span style="color:#9ca3af;font-size:12px;margin-left:10px;">out of ${universeSize} stocks scanned tonight</span>
          </td>
        </tr>

        <!-- Picks -->
        <tr>
          <td>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${rows}
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:20px 24px;text-align:center;border-top:1px solid #f0f0f0;">
            <a href="${appUrl}" style="display:inline-block;background:#00c46a;color:#111;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:700;">
              Open AI Trader Dashboard →
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 24px;background:#f9fafb;border-top:1px solid #f0f0f0;">
            <p style="color:#9ca3af;font-size:11px;margin:0;line-height:1.6;">
              Scores based on trend (EMA50/200), momentum (21d/63d return), RSI, volume, and ATR.
              No Claude API used — pure quant math on Yahoo Finance OHLCV data.
              <br><strong>Not financial advice.</strong> Always do your own research before trading.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export const config = { maxDuration: 45 };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.APP_ORIGIN || 'http://localhost:5173');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Validate Vercel cron secret (Vercel sets this automatically)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers['authorization'];
    if (auth !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'RESEND_API_KEY is not configured' });
  }
  if (!process.env.ALERT_EMAIL) {
    return res.status(500).json({ error: 'ALERT_EMAIL is not configured' });
  }

  const minScore = Number(process.env.ALERT_MIN_SCORE || 65);
  const appUrl = (process.env.APP_ORIGIN || 'https://your-app.vercel.app').replace(/\/$/, '');
  const universe = UNIVERSES.mega;

  try {
    const scanned = await mapLimit(universe, 5, async (ticker) => {
      const candles = await fetchCandles(ticker);
      return analyzeCandidate(ticker, candles);
    });

    const picks = scanned
      .filter(Boolean)
      .filter((p) => p.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    if (picks.length === 0) {
      console.log(`Alert: no setups above ${minScore} tonight, skipping email.`);
      return res.json({ sent: false, reason: `No setups above score ${minScore}` });
    }

    const date = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      timeZone: 'America/New_York',
    });

    const html = buildEmailHtml(picks, date, appUrl, universe.length);

    const topTickers = picks.slice(0, 3).map((p) => p.ticker).join(', ');
    const extra = picks.length > 3 ? ` +${picks.length - 3} more` : '';
    const hasBuyZone = picks.some((p) => p.action === 'BUY_ZONE');
    const subject = `${hasBuyZone ? '🟢 BUY ZONE' : '🟡 Watch'}: ${topTickers}${extra} — AI Trader Nightly`;

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'AI Trader <onboarding@resend.dev>',
        to: [process.env.ALERT_EMAIL],
        subject,
        html,
      }),
    });

    if (!emailRes.ok) {
      const err = await emailRes.json().catch(() => ({}));
      throw new Error(err.message || `Resend responded with ${emailRes.status}`);
    }

    console.log(`Alert sent: ${picks.length} picks → ${process.env.ALERT_EMAIL}`);
    return res.json({ sent: true, picks: picks.length, tickers: picks.map((p) => p.ticker) });
  } catch (error) {
    console.error('Alert API error:', error);
    return res.status(500).json({ error: error.message || 'Alert failed' });
  }
}
