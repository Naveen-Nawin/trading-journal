import express from 'express';
import cors from 'cors';
import { randomUUID } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';
import { hashPassword, comparePassword, generateToken, requireAuth } from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '15mb' })); // Support base64 chart screenshots
app.use(express.static(distPath)); // Serve frontend production build

const DEFAULT_RULES = [
  'Risk max 1% of account per trade',
  'Stop-loss set BEFORE entering the trade',
  'No entries 15 min around high-impact news',
  'Only trade my A+ setups with clear confirmation',
  'Max 3 trades per day — then walk away',
  'Journal every trade with a screenshot',
];

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'pipdesk-api', time: new Date().toISOString() });
});

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (name && name.trim()) || cleanEmail.split('@')[0];

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    // Check if user exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const userId = `usr_${randomUUID()}`;
    const passwordHash = await hashPassword(password);

    // Insert user
    db.prepare('INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)').run(
      userId,
      cleanEmail,
      passwordHash,
      cleanName
    );

    // Insert default trading plan rules for new user
    const insertRule = db.prepare('INSERT INTO rules (id, user_id, num, text, active) VALUES (?, ?, ?, ?, 1)');
    DEFAULT_RULES.forEach((ruleText, idx) => {
      insertRule.run(`rule_${randomUUID()}`, userId, String(idx + 1).padStart(2, '0'), ruleText);
    });

    const userObj = { id: userId, email: cleanEmail, name: cleanName };
    const token = generateToken(userObj);

    return res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: userObj,
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Failed to create account.' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT id, email, password_hash, name FROM users WHERE email = ?').get(cleanEmail);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const userObj = { id: user.id, email: user.email, name: user.name };
    const token = generateToken(userObj);

    return res.json({
      message: 'Logged in successfully!',
      token,
      user: userObj,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed.' });
  }
});

// Get current user profile
app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, email, name, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
  res.json({ user });
});

// ==========================================
// TRADES ROUTES (Authenticated per user)
// ==========================================

// Helper to format DB trade into frontend model
const mapTradeFromDb = (row) => ({
  id: row.id,
  pair: row.pair,
  direction: row.direction,
  lots: row.lots,
  entryPrice: row.entry_price,
  exitPrice: row.exit_price,
  stopLoss: row.stop_loss,
  takeProfit: row.take_profit,
  pnl: row.pnl,
  pips: row.pips,
  rMultiple: row.r_multiple,
  date: row.date,
  time: row.time,
  session: row.session,
  status: row.status,
  setupTag: row.setup_tag,
  tags: row.tags_json ? JSON.parse(row.tags_json) : [],
  emotion: row.emotion,
  notes: row.notes,
  screenshot: row.screenshot,
  followedPlan: Boolean(row.followed_plan),
  createdAt: row.created_at,
});

// Get all trades for user
app.get('/api/trades', requireAuth, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM trades WHERE user_id = ? ORDER BY date DESC, time DESC, created_at DESC').all(req.user.id);
    res.json({ trades: rows.map(mapTradeFromDb) });
  } catch (err) {
    console.error('Get trades error:', err);
    res.status(500).json({ error: 'Failed to retrieve trades.' });
  }
});

// Create single trade
app.post('/api/trades', requireAuth, (req, res) => {
  try {
    const t = req.body;
    const tradeId = t.id || `tr_${randomUUID()}`;

    const stmt = db.prepare(`
      INSERT INTO trades (
        id, user_id, pair, direction, lots, entry_price, exit_price,
        stop_loss, take_profit, pnl, pips, r_multiple, date, time,
        session, status, setup_tag, tags_json, emotion, notes,
        screenshot, followed_plan
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      tradeId,
      req.user.id,
      (t.pair || '').toUpperCase(),
      (t.direction || 'BUY').toUpperCase(),
      parseFloat(t.lots) || 0.1,
      parseFloat(t.entryPrice) || 0,
      t.exitPrice !== null && t.exitPrice !== undefined && t.exitPrice !== '' ? parseFloat(t.exitPrice) : null,
      t.stopLoss ? parseFloat(t.stopLoss) : null,
      t.takeProfit ? parseFloat(t.takeProfit) : null,
      t.pnl !== null && t.pnl !== undefined && t.pnl !== '' ? parseFloat(t.pnl) : null,
      t.pips !== null && t.pips !== undefined ? parseFloat(t.pips) : null,
      t.rMultiple !== null && t.rMultiple !== undefined ? parseFloat(t.rMultiple) : null,
      t.date || new Date().toISOString().split('T')[0],
      t.time || '',
      t.session || 'London',
      t.status || 'CLOSED',
      t.setupTag || 'general',
      JSON.stringify(t.tags || []),
      t.emotion || 'calm',
      t.notes || '',
      t.screenshot || '',
      t.followedPlan ? 1 : 0
    );

    const createdRow = db.prepare('SELECT * FROM trades WHERE id = ?').get(tradeId);
    res.status(201).json({ trade: mapTradeFromDb(createdRow) });
  } catch (err) {
    console.error('Create trade error:', err);
    res.status(500).json({ error: 'Failed to log trade.' });
  }
});

// Batch create trades (for OCR Screenshot Import / CSV Import)
app.post('/api/trades/batch', requireAuth, (req, res) => {
  try {
    const { trades } = req.body;
    if (!Array.isArray(trades) || trades.length === 0) {
      return res.status(400).json({ error: 'An array of trades is required.' });
    }

    const stmt = db.prepare(`
      INSERT INTO trades (
        id, user_id, pair, direction, lots, entry_price, exit_price,
        stop_loss, take_profit, pnl, pips, r_multiple, date, time,
        session, status, setup_tag, tags_json, emotion, notes,
        screenshot, followed_plan
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((list) => {
      for (const t of list) {
        const tradeId = t.id && !t.id.startsWith('ocr-') && !t.id.startsWith('sample-')
          ? t.id
          : `tr_${randomUUID()}`;

        stmt.run(
          tradeId,
          req.user.id,
          (t.pair || '').toUpperCase(),
          (t.direction || 'BUY').toUpperCase(),
          parseFloat(t.lots) || 0.1,
          parseFloat(t.entryPrice) || 0,
          t.exitPrice !== null && t.exitPrice !== undefined && t.exitPrice !== '' ? parseFloat(t.exitPrice) : null,
          t.stopLoss ? parseFloat(t.stopLoss) : null,
          t.takeProfit ? parseFloat(t.takeProfit) : null,
          t.pnl !== null && t.pnl !== undefined && t.pnl !== '' ? parseFloat(t.pnl) : null,
          t.pips !== null && t.pips !== undefined ? parseFloat(t.pips) : null,
          t.rMultiple !== null && t.rMultiple !== undefined ? parseFloat(t.rMultiple) : null,
          t.date || new Date().toISOString().split('T')[0],
          t.time || '',
          t.session || 'London',
          t.status || 'CLOSED',
          t.setupTag || 'general',
          JSON.stringify(t.tags || []),
          t.emotion || 'calm',
          t.notes || '',
          t.screenshot || '',
          t.followedPlan ? 1 : 0
        );
      }
    });

    insertMany(trades);

    const rows = db.prepare('SELECT * FROM trades WHERE user_id = ? ORDER BY date DESC, time DESC, created_at DESC').all(req.user.id);
    res.status(201).json({
      message: `Successfully imported ${trades.length} trades!`,
      count: trades.length,
      trades: rows.map(mapTradeFromDb),
    });
  } catch (err) {
    console.error('Batch trades error:', err);
    res.status(500).json({ error: 'Failed to batch import trades.' });
  }
});

// Update trade
app.put('/api/trades/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const t = req.body;

    const existing = db.prepare('SELECT id FROM trades WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!existing) {
      return res.status(404).json({ error: 'Trade not found.' });
    }

    db.prepare(`
      UPDATE trades SET
        pair = ?, direction = ?, lots = ?, entry_price = ?, exit_price = ?,
        stop_loss = ?, take_profit = ?, pnl = ?, pips = ?, r_multiple = ?,
        date = ?, time = ?, session = ?, status = ?, setup_tag = ?,
        tags_json = ?, emotion = ?, notes = ?, screenshot = ?, followed_plan = ?
      WHERE id = ? AND user_id = ?
    `).run(
      (t.pair || '').toUpperCase(),
      (t.direction || 'BUY').toUpperCase(),
      parseFloat(t.lots) || 0.1,
      parseFloat(t.entryPrice) || 0,
      t.exitPrice !== null && t.exitPrice !== undefined && t.exitPrice !== '' ? parseFloat(t.exitPrice) : null,
      t.stopLoss ? parseFloat(t.stopLoss) : null,
      t.takeProfit ? parseFloat(t.takeProfit) : null,
      t.pnl !== null && t.pnl !== undefined && t.pnl !== '' ? parseFloat(t.pnl) : null,
      t.pips !== null && t.pips !== undefined ? parseFloat(t.pips) : null,
      t.rMultiple !== null && t.rMultiple !== undefined ? parseFloat(t.rMultiple) : null,
      t.date || new Date().toISOString().split('T')[0],
      t.time || '',
      t.session || 'London',
      t.status || 'CLOSED',
      t.setupTag || 'general',
      JSON.stringify(t.tags || []),
      t.emotion || 'calm',
      t.notes || '',
      t.screenshot || '',
      t.followedPlan ? 1 : 0,
      id,
      req.user.id
    );

    const updatedRow = db.prepare('SELECT * FROM trades WHERE id = ?').get(id);
    res.json({ trade: mapTradeFromDb(updatedRow) });
  } catch (err) {
    console.error('Update trade error:', err);
    res.status(500).json({ error: 'Failed to update trade.' });
  }
});

// Delete single trade
app.delete('/api/trades/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM trades WHERE id = ? AND user_id = ?').run(id, req.user.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Trade not found.' });
    }
    res.json({ message: 'Trade deleted successfully.' });
  } catch (err) {
    console.error('Delete trade error:', err);
    res.status(500).json({ error: 'Failed to delete trade.' });
  }
});

// Clear all trades for current user
app.delete('/api/trades', requireAuth, (req, res) => {
  try {
    db.prepare('DELETE FROM trades WHERE user_id = ?').run(req.user.id);
    res.json({ message: 'All trades cleared.' });
  } catch (err) {
    console.error('Clear trades error:', err);
    res.status(500).json({ error: 'Failed to clear trades.' });
  }
});

// ==========================================
// TRADING RULES ROUTES (Authenticated per user)
// ==========================================

// Get rules
app.get('/api/rules', requireAuth, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM rules WHERE user_id = ? ORDER BY num ASC, created_at ASC').all(req.user.id);
    res.json({
      rules: rows.map((r) => ({
        id: r.id,
        num: r.num,
        text: r.text,
        active: Boolean(r.active),
      })),
    });
  } catch (err) {
    console.error('Get rules error:', err);
    res.status(500).json({ error: 'Failed to retrieve rules.' });
  }
});

// Add rule
app.post('/api/rules', requireAuth, (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Rule text is required.' });
    }

    const currentCount = db.prepare('SELECT COUNT(*) as count FROM rules WHERE user_id = ?').get(req.user.id).count;
    const nextNum = String(currentCount + 1).padStart(2, '0');
    const ruleId = `rule_${randomUUID()}`;

    db.prepare('INSERT INTO rules (id, user_id, num, text, active) VALUES (?, ?, ?, ?, 1)').run(
      ruleId,
      req.user.id,
      nextNum,
      text.trim()
    );

    res.status(201).json({
      rule: { id: ruleId, num: nextNum, text: text.trim(), active: true },
    });
  } catch (err) {
    console.error('Add rule error:', err);
    res.status(500).json({ error: 'Failed to add rule.' });
  }
});

// Toggle rule active status
app.put('/api/rules/:id/toggle', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const rule = db.prepare('SELECT active FROM rules WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found.' });
    }

    const newActive = rule.active ? 0 : 1;
    db.prepare('UPDATE rules SET active = ? WHERE id = ? AND user_id = ?').run(newActive, id, req.user.id);

    res.json({ id, active: Boolean(newActive) });
  } catch (err) {
    console.error('Toggle rule error:', err);
    res.status(500).json({ error: 'Failed to toggle rule.' });
  }
});

// Delete rule
app.delete('/api/rules/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM rules WHERE id = ? AND user_id = ?').run(id, req.user.id);

    // Re-index remaining rules
    const remaining = db.prepare('SELECT id FROM rules WHERE user_id = ? ORDER BY num ASC, created_at ASC').all(req.user.id);
    const updateNum = db.prepare('UPDATE rules SET num = ? WHERE id = ?');
    remaining.forEach((r, idx) => {
      updateNum.run(String(idx + 1).padStart(2, '0'), r.id);
    });

    res.json({ message: 'Rule deleted.' });
  } catch (err) {
    console.error('Delete rule error:', err);
    res.status(500).json({ error: 'Failed to delete rule.' });
  }
});

// SPA fallback - serve index.html for all client routes except /api
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`PipDesk Backend API running with SQLite DB on http://localhost:${PORT}`);
});
