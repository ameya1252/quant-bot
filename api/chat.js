import Anthropic from '@anthropic-ai/sdk';
import { ensureUser, getSql, getUserId, setJsonCors } from './_db.js';

function pnl(trade) {
  if (trade.exit_price == null) return null;
  const mult = trade.direction === 'long' ? 1 : -1;
  return (Number(trade.exit_price) - Number(trade.entry_price)) * Number(trade.shares) * mult;
}

function compactContext({ watchlist, analyses, scans, trades }) {
  const watched = watchlist.map((item) => ({
    ticker: item.ticker,
    verdict: item.last_analysis?.verdict,
    confidence: item.last_analysis?.confidence,
    setupScore: item.last_analysis?.signalQuality?.scannerScore,
    summary: item.last_analysis?.summary,
  }));

  const recentAnalyses = analyses.map((item) => ({
    ticker: item.ticker,
    timeframe: item.timeframe,
    verdict: item.analysis?.verdict,
    confidence: item.analysis?.confidence,
    summary: item.analysis?.summary,
    riskPlan: item.analysis?.riskPlan,
    createdAt: item.created_at,
  }));

  const latestScan = scans[0]?.results?.slice?.(0, 10) ?? [];
  const recentTrades = trades.map((trade) => ({
    ticker: trade.ticker,
    direction: trade.direction,
    entryPrice: Number(trade.entry_price),
    exitPrice: trade.exit_price == null ? null : Number(trade.exit_price),
    shares: Number(trade.shares),
    dateOpened: trade.date_opened,
    dateClosed: trade.date_closed,
    pnl: pnl(trade),
    notes: trade.notes,
  }));

  const closed = recentTrades.filter((trade) => trade.pnl != null);
  const tradeStats = {
    totalTrades: recentTrades.length,
    closedTrades: closed.length,
    winRate: closed.length
      ? Math.round((closed.filter((trade) => trade.pnl > 0).length / closed.length) * 100)
      : null,
    totalPnl: closed.reduce((sum, trade) => sum + trade.pnl, 0),
  };

  return { watched, recentAnalyses, latestScan, recentTrades, tradeStats };
}

async function createChatMessage(client, payload) {
  const models = [
    process.env.ANTHROPIC_CHAT_MODEL,
    'claude-3-haiku-20240307',
    process.env.ANTHROPIC_ANALYSIS_MODEL || 'claude-opus-4-20250514',
  ].filter(Boolean);

  let lastError;
  for (const model of Array.from(new Set(models))) {
    try {
      return await client.messages.create({ ...payload, model });
    } catch (error) {
      lastError = error;
      const message = error?.error?.error?.message || error?.message || '';
      const isModelError = error?.status === 404 || /model:/i.test(message);
      if (!isModelError) throw error;
    }
  }
  throw lastError;
}

export default async function handler(req, res) {
  setJsonCors(res, 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  if (!message) return res.status(400).json({ error: 'message is required' });
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured' });
  }

  try {
    const sql = getSql();
    const userId = getUserId(req);
    await ensureUser(sql, userId);

    const [watchlist, analyses, scans, trades, history] = await Promise.all([
      sql`
        select ticker, last_analysis, analyzed_at
        from watchlist_items
        where user_id = ${userId}
        order by added_at desc
        limit 30
      `,
      sql`
        select ticker, timeframe, analysis, created_at
        from analyses
        where user_id = ${userId}
        order by created_at desc
        limit 20
      `,
      sql`
        select universe, results, created_at
        from scanner_runs
        where user_id = ${userId}
        order by created_at desc
        limit 2
      `,
      sql`
        select ticker, direction, entry_price, exit_price, shares, date_opened, date_closed, notes
        from trade_logs
        where user_id = ${userId}
        order by date_opened desc, id desc
        limit 50
      `,
      sql`
        select role, content
        from chat_messages
        where user_id = ${userId}
        order by created_at desc
        limit 10
      `,
    ]);

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const context = compactContext({ watchlist, analyses, scans, trades });
    const previousMessages = history.reverse().map((row) => ({
      role: row.role,
      content: row.content,
    }));

    const response = await createChatMessage(client, {
      max_tokens: 1200,
      system: `You are Ameya's personal trading research assistant. Use the provided personal context: watchlist, recent analyses, and latest scanner results.

Reply briefly and meaningfully by default:
- Use 3-6 short bullets or a short paragraph.
- Avoid markdown headings unless the user asks for a structured breakdown.
- Lead with the answer or recommendation.
- Include only the most important reason, risk, and next action.
- For trade questions, include invalidation/risk and say WAIT when evidence is insufficient.
- Do not write long explanations unless Ameya explicitly asks for detail.
- Do not claim certainty. Do not say you can execute trades.`,
      messages: [
        ...previousMessages,
        {
          role: 'user',
          content: `Personal context JSON:\n${JSON.stringify(context).slice(0, 12000)}\n\nQuestion:\n${message}`,
        },
      ],
    });

    const answer = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim();

    await Promise.all([
      sql`insert into chat_messages (user_id, role, content) values (${userId}, 'user', ${message})`,
      sql`insert into chat_messages (user_id, role, content) values (${userId}, 'assistant', ${answer})`,
    ]);

    return res.json({ answer });
  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(500).json({ error: error.message || 'Chat failed' });
  }
}
