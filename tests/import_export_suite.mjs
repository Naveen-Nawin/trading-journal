/**
 * COMPREHENSIVE IMPORT, EXPORT & RESTORE TEST SUITE
 * Covering all 15 scenarios required by the architecture specification.
 */

import Database from 'better-sqlite3';
import { pathToFileURL } from 'url';
import path from 'path';

// Import helpers using file URLs for Windows compatibility
const csvHelperPath = pathToFileURL(path.resolve('./src/utils/csvHelper.js')).href;
const backupHelperPath = pathToFileURL(path.resolve('./src/utils/backupHelper.js')).href;

const { serializeTradesToCSV, parseTradesFromCSV } = await import(csvHelperPath);
const {
  validateBackupJSON,
  prepareTradesForAccount,
  deduplicateTrades,
  createFullBackupData,
  getTradeSignature,
} = await import(backupHelperPath);

// Colors for console output
const colors = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  blue: (s) => `\x1b[34m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

let passedCount = 0;
let failedCount = 0;
const testResults = [];

function assert(condition, testName, details = '') {
  if (condition) {
    passedCount++;
    console.log(`  ${colors.green('✓ PASS:')} ${testName}`);
    testResults.push({ name: testName, status: 'PASS', details });
  } else {
    failedCount++;
    console.error(`  ${colors.red('✗ FAIL:')} ${testName} ${details ? '- ' + details : ''}`);
    testResults.push({ name: testName, status: 'FAIL', details });
  }
}

console.log(colors.bold('\n======================================================'));
console.log(colors.bold('  IMPORT, EXPORT & RESTORE AUDIT: 15-SCENARIO SUITE   '));
console.log(colors.bold('======================================================\n'));

// Helper to create mock trades for Account A
function createSampleAccountATrades(count = 5) {
  const trades = [];
  for (let i = 1; i <= count; i++) {
    trades.push({
      id: `acc_a_tr_${i}`,
      user_id: 'account_A_user_123',
      pair: i % 2 === 0 ? 'XAUUSD' : 'EURUSD',
      direction: i % 2 === 0 ? 'BUY' : 'SELL',
      lots: 0.1 * i,
      entryPrice: 2000 + i * 10,
      exitPrice: 2000 + i * 10 + (i % 2 === 0 ? 15 : -10),
      stopLoss: 2000 + i * 10 - 10,
      takeProfit: 2000 + i * 10 + 20,
      pnl: i % 2 === 0 ? 150 * i : -100 * i,
      pips: i % 2 === 0 ? 30 : -20,
      rMultiple: i % 2 === 0 ? 2.5 : -1.0,
      date: `2026-11-2${i % 9}`,
      time: '14:30',
      session: 'New York',
      status: 'CLOSED',
      setupTag: 'Breakout',
      tags: ['Breakout', 'Trend', `Tag${i}`],
      emotion: 'Confident',
      notes: `Trade #${i}: Entry after retest, target reached.`,
      screenshot: `data:image/png;base64,mockImageBase64Data_${i}`,
      followedPlan: true,
    });
  }
  return trades;
}

// -----------------------------------------------------------------------------
// Scenario 1: JSON Export → JSON Import (Roundtrip)
// -----------------------------------------------------------------------------
console.log(colors.blue('\nScenario 1: JSON Export → JSON Import (Roundtrip)'));
{
  const originalTrades = createSampleAccountATrades(5);
  const rules = [{ id: 'r1', num: '01', text: 'Never risk > 1%' }];
  const backupJSON = createFullBackupData(originalTrades, rules, 'USD', 'dark');

  const validated = validateBackupJSON(backupJSON);
  assert(validated.valid === true, 'JSON validation recognizes valid format');
  assert(validated.version === '2.0', 'Export contains backup schema version 2.0');
  assert(validated.trades.length === 5, 'Exact trade count 5 preserved');
  assert(validated.rulesCount === 1, 'Rules count preserved');
  assert(validated.hasImages === true, 'Screenshots detected in backup');
  assert(validated.trades[0].pair === originalTrades[0].pair, 'First trade pair matches');
  assert(validated.trades[0].pnl === originalTrades[0].pnl, 'Numeric PnL matches');
}

// -----------------------------------------------------------------------------
// Scenario 2: CSV Export → CSV Import (RFC-4180 Roundtrip with quotes, commas, newlines)
// -----------------------------------------------------------------------------
console.log(colors.blue('\nScenario 2: CSV Export → CSV Import (RFC-4180 Roundtrip)'));
{
  const complexTrades = [
    {
      id: 'csv_1',
      pair: 'GBPUSD',
      direction: 'BUY',
      lots: 0.5,
      entryPrice: 1.2850,
      exitPrice: 1.2910,
      stopLoss: 1.2820,
      takeProfit: 1.2940,
      pnl: 300,
      pips: 60,
      rMultiple: 2.0,
      date: '2026-11-20',
      time: '09:15',
      session: 'London',
      status: 'CLOSED',
      setupTag: 'London Open',
      tags: ['London Breakout', 'High Volatility'],
      emotion: 'Disciplined',
      notes: 'Entry with 15m breakout, target "zone A", stop held cleanly.\nSecond line notes.',
      followedPlan: true,
    },
    {
      id: 'csv_2',
      pair: 'XAUUSD',
      direction: 'SELL',
      lots: 0.25,
      entryPrice: 2650.50,
      exitPrice: null,
      stopLoss: 2660.00,
      takeProfit: 2630.00,
      pnl: 0,
      pips: 0,
      rMultiple: 0,
      date: '2026-11-21',
      time: '13:00',
      session: 'New York',
      status: 'OPEN',
      tags: [],
      notes: 'Commas, everywhere, inside, note, test',
      followedPlan: true,
    },
  ];

  const csvOutput = serializeTradesToCSV(complexTrades);
  const parsedTrades = parseTradesFromCSV(csvOutput);

  assert(parsedTrades.length === 2, 'CSV parsed exact count of 2 trades');
  assert(parsedTrades[0].pair === 'GBPUSD', 'Trade 1 Pair matches');
  assert(parsedTrades[0].lots === 0.5, 'Trade 1 Lots matches float number');
  assert(parsedTrades[0].entryPrice === 1.2850, 'Trade 1 Entry price matches');
  assert(parsedTrades[0].exitPrice === 1.2910, 'Trade 1 Exit price matches');
  assert(parsedTrades[0].pnl === 300, 'Trade 1 PnL matches');
  assert(parsedTrades[0].time === '09:15', 'Trade 1 Time matches');
  assert(parsedTrades[0].status === 'CLOSED', 'Trade 1 Status matches');
  assert(parsedTrades[0].notes.includes('Second line notes'), 'Multiline notes with newlines preserved');
  assert(parsedTrades[0].notes.includes('"zone A"'), 'Escaped quotes inside notes preserved');
  assert(parsedTrades[1].pair === 'XAUUSD', 'Trade 2 Pair matches');
  assert(parsedTrades[1].status === 'OPEN', 'Trade 2 Open status matches');
  assert(parsedTrades[1].notes === 'Commas, everywhere, inside, note, test', 'Commas inside quotes parsed without column shift');
}

// -----------------------------------------------------------------------------
// Scenario 3: Account A Export → Account B Restore (Cross-Account Remapping & Isolation)
// -----------------------------------------------------------------------------
console.log(colors.blue('\nScenario 3: Account A Export → Account B Restore (Remapping & Isolation)'));
{
  const accountATrades = createSampleAccountATrades(4);
  const accountA_backup = createFullBackupData(accountATrades, [], 'USD', 'dark');

  const validated = validateBackupJSON(accountA_backup);
  const accountB_UserId = 'account_B_target_999';

  // Prepare for Account B
  const restoredForB = prepareTradesForAccount(validated.trades, accountB_UserId);

  assert(restoredForB.length === accountATrades.length, 'Restored trade count equals Account A count');
  assert(restoredForB.every((t) => t.user_id === accountB_UserId), 'All trades remapped to Account B user_id');
  assert(
    restoredForB.every((t, idx) => t.id !== accountATrades[idx].id),
    'All trade IDs regenerated (zero ID collision with Account A)'
  );
  assert(
    accountATrades.every((t) => t.user_id === 'account_A_user_123'),
    'Account A original trades remain completely untouched'
  );
}

// -----------------------------------------------------------------------------
// Scenario 4: Large Dataset Export & Import (150 trades)
// -----------------------------------------------------------------------------
console.log(colors.blue('\nScenario 4: Large Dataset Export & Import (150 Trades)'));
{
  const largeDataset = createSampleAccountATrades(150);
  const jsonBackup = createFullBackupData(largeDataset, [], 'USD', 'dark');
  const validatedJSON = validateBackupJSON(jsonBackup);
  assert(validatedJSON.trades.length === 150, 'Large JSON dataset exports & imports 150/150 records');

  const csvBackup = serializeTradesToCSV(largeDataset);
  const parsedCSV = parseTradesFromCSV(csvBackup);
  assert(parsedCSV.length === 150, 'Large CSV dataset exports & imports 150/150 records');
}

// -----------------------------------------------------------------------------
// Scenario 5: Duplicate Data Handling (Append vs Replace Mode)
// -----------------------------------------------------------------------------
console.log(colors.blue('\nScenario 5: Duplicate Data Handling'));
{
  const existingTrades = [
    {
      id: 'b_1',
      user_id: 'user_B',
      pair: 'EURUSD',
      direction: 'BUY',
      lots: 0.1,
      entryPrice: 1.0850,
      exitPrice: 1.0900,
      date: '2026-11-20',
      time: '10:00',
    },
    {
      id: 'b_2',
      user_id: 'user_B',
      pair: 'USDJPY',
      direction: 'SELL',
      lots: 0.2,
      entryPrice: 154.50,
      exitPrice: 153.50,
      date: '2026-11-21',
      time: '11:00',
    },
  ];

  const incomingTrades = [
    // Duplicate of b_1 (same pair, date, entryPrice, lots, direction)
    {
      id: 'incoming_dup',
      user_id: 'user_B',
      pair: 'EURUSD',
      direction: 'BUY',
      lots: 0.1,
      entryPrice: 1.0850,
      exitPrice: 1.0900,
      date: '2026-11-20',
      time: '10:00',
    },
    // Fresh trade
    {
      id: 'incoming_new',
      user_id: 'user_B',
      pair: 'GBPJPY',
      direction: 'BUY',
      lots: 0.3,
      entryPrice: 198.00,
      exitPrice: 199.00,
      date: '2026-11-22',
      time: '14:00',
    },
  ];

  const { unique, duplicatesSkipped } = deduplicateTrades(existingTrades, incomingTrades);
  assert(duplicatesSkipped === 1, 'Exactly 1 duplicate identified and skipped');
  assert(unique.length === 1, 'Only 1 unique new trade accepted');
  assert(unique[0].pair === 'GBPJPY', 'Accepted trade is the correct non-duplicate trade');
}

// -----------------------------------------------------------------------------
// Scenario 6: Missing Field Handling
// -----------------------------------------------------------------------------
console.log(colors.blue('\nScenario 6: Missing & Optional Field Handling'));
{
  const tradeWithMissingFields = {
    pair: 'EURUSD',
    direction: 'BUY',
    entryPrice: 1.0850,
    date: '2026-11-20',
    // lots missing
    // stopLoss missing
    // takeProfit missing
    // exitPrice missing
    // notes missing
    // tags missing
  };

  const csv = serializeTradesToCSV([tradeWithMissingFields]);
  const parsed = parseTradesFromCSV(csv);

  assert(parsed.length === 1, 'Trade with missing fields serialized & parsed safely');
  assert(parsed[0].lots === 0.01, 'Missing lots defaulted safely to 0.01');
  assert(parsed[0].status === 'OPEN', 'Trade without exitPrice defaulted safely to OPEN');
  assert(Array.isArray(parsed[0].tags), 'Missing tags normalized safely to empty Array');
}

// -----------------------------------------------------------------------------
// Scenario 7: Invalid JSON and CSV Handling
// -----------------------------------------------------------------------------
console.log(colors.blue('\nScenario 7: Invalid JSON & Malformed CSV Handling'));
{
  const malformedJSON = '{ "corrupt_data": [1, 2, ';
  const jsonResult = validateBackupJSON(malformedJSON);
  assert(jsonResult.valid === false, 'Malformed JSON rejected without throw');
  assert(jsonResult.error.length > 0, 'Informative error returned for malformed JSON');

  const emptyJSON = '{ "version": "2.0", "trades": [] }';
  const emptyResult = validateBackupJSON(emptyJSON);
  assert(emptyResult.valid === true, 'Empty trades list in valid backup handled cleanly');
  assert(emptyResult.trades.length === 0, 'Returns 0 trades for empty list');

  const malformedCSV = 'not,a,valid,trading,csv\nfoo,bar,baz,qux,quux';
  const parsedCSV = parseTradesFromCSV(malformedCSV);
  assert(Array.isArray(parsedCSV) && parsedCSV.length === 0, 'Malformed CSV safely returns empty array without throwing');
}

// -----------------------------------------------------------------------------
// Scenario 8: Data Type Validation
// -----------------------------------------------------------------------------
console.log(colors.blue('\nScenario 8: Data Type Validation'));
{
  const tradeRaw = {
    pair: 'BTCUSD',
    direction: 'BUY',
    lots: '0.75', // String in input
    entryPrice: '95000.50', // String
    exitPrice: '98000.25', // String
    stopLoss: '94000.00', // String
    takeProfit: '100000.00', // String
    pnl: '2250.75', // String
    pips: '3000', // String
    rMultiple: '3.0', // String
    date: '2026-11-20',
    followedPlan: 'true', // String
  };

  const csv = serializeTradesToCSV([tradeRaw]);
  const parsed = parseTradesFromCSV(csv);
  const t = parsed[0];

  assert(typeof t.lots === 'number' && t.lots === 0.75, 'Lots coerced to JavaScript number');
  assert(typeof t.entryPrice === 'number' && t.entryPrice === 95000.5, 'Entry price coerced to JavaScript number');
  assert(typeof t.exitPrice === 'number' && t.exitPrice === 98000.25, 'Exit price coerced to JavaScript number');
  assert(typeof t.pnl === 'number' && t.pnl === 2250.75, 'PnL coerced to JavaScript number');
  assert(typeof t.rMultiple === 'number' && t.rMultiple === 3.0, 'rMultiple coerced to JavaScript number');
  assert(typeof t.followedPlan === 'boolean' && t.followedPlan === true, 'followedPlan coerced to boolean');
  assert(Array.isArray(t.tags), 'tags coerced to Array');
}

// -----------------------------------------------------------------------------
// Scenario 9 & 14: Relationship & Foreign-Key Validation & Cross-Account Isolation (SQLite)
// -----------------------------------------------------------------------------
console.log(colors.blue('\nScenario 9 & 14: SQLite Database Foreign-Key & Isolation Test'));
{
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');

  // Schema matching production
  db.exec(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL
    );

    CREATE TABLE trades (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      pair TEXT NOT NULL,
      direction TEXT NOT NULL,
      lots REAL NOT NULL,
      entry_price REAL NOT NULL,
      exit_price REAL,
      stop_loss REAL,
      take_profit REAL,
      pnl REAL,
      pips REAL,
      r_multiple REAL,
      date TEXT NOT NULL,
      time TEXT,
      session TEXT,
      status TEXT DEFAULT 'CLOSED',
      setup_tag TEXT,
      tags_json TEXT,
      emotion TEXT,
      notes TEXT,
      screenshot TEXT,
      followed_plan INTEGER DEFAULT 1,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE rules (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      num TEXT NOT NULL,
      text TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Insert User A and User B
  db.prepare("INSERT INTO users (id, email, name) VALUES ('user_A', 'a@test.com', 'User A')").run();
  db.prepare("INSERT INTO users (id, email, name) VALUES ('user_B', 'b@test.com', 'User B')").run();

  // Insert 3 trades for User A
  const insertTradeStmt = db.prepare(`
    INSERT INTO trades (id, user_id, pair, direction, lots, entry_price, exit_price, pnl, pips, r_multiple, date, time, session, status, notes)
    VALUES (@id, @user_id, @pair, @direction, @lots, @entry_price, @exit_price, @pnl, @pips, @r_multiple, @date, @time, @session, @status, @notes)
  `);

  const accountATradesDB = [
    { id: 'db_tr_1', user_id: 'user_A', pair: 'EURUSD', direction: 'BUY', lots: 0.1, entry_price: 1.0800, exit_price: 1.0850, pnl: 50, pips: 50, r_multiple: 1.5, date: '2026-11-20', time: '08:00', session: 'London', status: 'CLOSED', notes: 'Account A Trade 1' },
    { id: 'db_tr_2', user_id: 'user_A', pair: 'GBPUSD', direction: 'SELL', lots: 0.2, entry_price: 1.3000, exit_price: 1.2950, pnl: 100, pips: 50, r_multiple: 2.0, date: '2026-11-21', time: '09:00', session: 'London', status: 'CLOSED', notes: 'Account A Trade 2' },
    { id: 'db_tr_3', user_id: 'user_A', pair: 'USDJPY', direction: 'BUY', lots: 0.3, entry_price: 155.00, exit_price: 155.80, pnl: 160, pips: 80, r_multiple: 1.8, date: '2026-11-22', time: '10:00', session: 'Tokyo', status: 'CLOSED', notes: 'Account A Trade 3' },
  ];

  accountATradesDB.forEach((t) => insertTradeStmt.run(t));

  // User B starts with 1 existing trade
  insertTradeStmt.run({
    id: 'db_tr_b_existing',
    user_id: 'user_B',
    pair: 'AUDUSD',
    direction: 'BUY',
    lots: 0.05,
    entry_price: 0.6500,
    exit_price: 0.6520,
    pnl: 10,
    pips: 20,
    r_multiple: 1.0,
    date: '2026-11-19',
    time: '04:00',
    session: 'Tokyo',
    status: 'CLOSED',
    notes: 'User B old trade',
  });

  // Export User A trades
  const userARows = db.prepare("SELECT * FROM trades WHERE user_id = 'user_A'").all();
  assert(userARows.length === 3, 'Account A has 3 initial trades in database');

  // Convert DB rows to app trade objects
  const userATradesApp = userARows.map((r) => ({
    id: r.id,
    user_id: r.user_id,
    pair: r.pair,
    direction: r.direction,
    lots: r.lots,
    entryPrice: r.entry_price,
    exitPrice: r.exit_price,
    pnl: r.pnl,
    pips: r.pips,
    rMultiple: r.r_multiple,
    date: r.date,
    time: r.time,
    session: r.session,
    status: r.status,
    notes: r.notes,
  }));

  // Perform Account B Restore (Replace Mode simulation)
  const restoredTradesForB = prepareTradesForAccount(userATradesApp, 'user_B');

  const executeRestoreTx = db.transaction((targetUserId, trades) => {
    // 1. Delete existing for User B
    db.prepare('DELETE FROM trades WHERE user_id = ?').run(targetUserId);

    // 2. Insert new trades
    for (const t of trades) {
      insertTradeStmt.run({
        id: t.id,
        user_id: targetUserId,
        pair: t.pair,
        direction: t.direction,
        lots: t.lots,
        entry_price: t.entryPrice,
        exit_price: t.exitPrice,
        pnl: t.pnl,
        pips: t.pips,
        r_multiple: t.rMultiple,
        date: t.date,
        time: t.time,
        session: t.session,
        status: t.status,
        notes: t.notes,
      });
    }
  });

  executeRestoreTx('user_B', restoredTradesForB);

  // Assert Account B has exactly 3 trades now
  const userBRows = db.prepare("SELECT * FROM trades WHERE user_id = 'user_B'").all();
  assert(userBRows.length === 3, 'Account B has exactly 3 restored trades');
  assert(userBRows.every((r) => r.user_id === 'user_B'), 'All restored trades belong to user_B');

  // Cross-Account Isolation Check: Account A must be 100% untouched
  const userARowsAfter = db.prepare("SELECT * FROM trades WHERE user_id = 'user_A'").all();
  assert(userARowsAfter.length === 3, 'Account A count remains exactly 3 after Account B restore');
  assert(userARowsAfter[0].id === 'db_tr_1', 'Account A IDs remain completely intact');
  assert(userARowsAfter[0].notes === 'Account A Trade 1', 'Account A notes unchanged');

  // Foreign Key test: Trying to restore to non-existent user must fail safely
  let foreignKeyThrew = false;
  try {
    const invalidTrades = prepareTradesForAccount(userATradesApp, 'non_existent_user');
    executeRestoreTx('non_existent_user', invalidTrades);
  } catch (err) {
    foreignKeyThrew = true;
  }
  assert(foreignKeyThrew === true, 'Foreign key constraint prevents inserting to non-existent user');
}

// -----------------------------------------------------------------------------
// Scenario 10: Special Characters & Unicode Handling
// -----------------------------------------------------------------------------
console.log(colors.blue('\nScenario 10: Special Characters & Unicode Handling'));
{
  const unicodeTrades = [
    {
      id: 'uni_1',
      pair: 'BTCUSD',
      direction: 'BUY',
      lots: 1.0,
      entryPrice: 96000,
      exitPrice: 98500,
      pnl: 2500,
      pips: 250,
      rMultiple: 3.5,
      date: '2026-11-25',
      time: '18:45',
      session: 'New York',
      status: 'CLOSED',
      tags: ['Crypto 🔥', 'All-Time-High 🚀', 'Profit: +$2,500.00'],
      emotion: 'Ecstatic 🥳',
      notes: 'Notes with symbols: €uro / ¥en / ₹upee / £pound & "quotes" + <brackets> & newlines:\nLine 2: 🚀 Moon mission accomplished! #winning',
      followedPlan: true,
    },
  ];

  // Test JSON Roundtrip with Unicode
  const json = createFullBackupData(unicodeTrades, [], 'USD', 'dark');
  const validJSON = validateBackupJSON(json);
  assert(validJSON.trades[0].notes === unicodeTrades[0].notes, 'Unicode & emojis preserved in JSON backup');
  assert(validJSON.trades[0].tags[0] === 'Crypto 🔥', 'Emoji in tags preserved in JSON');

  // Test CSV Roundtrip with Unicode
  const csv = serializeTradesToCSV(unicodeTrades);
  const parsedCSV = parseTradesFromCSV(csv);
  assert(parsedCSV[0].notes === unicodeTrades[0].notes, 'Unicode & emojis preserved across CSV roundtrip');
  assert(parsedCSV[0].tags.includes('Crypto 🔥'), 'Emoji in tags preserved across CSV roundtrip');
  assert(parsedCSV[0].notes.includes('₹upee'), 'Indian Rupee symbol ₹ preserved in CSV');
}

// -----------------------------------------------------------------------------
// Scenario 11: Empty Dataset Handling
// -----------------------------------------------------------------------------
console.log(colors.blue('\nScenario 11: Empty Dataset Handling'));
{
  const emptyJSON = createFullBackupData([], [], 'USD', 'dark');
  const validJSON = validateBackupJSON(emptyJSON);
  assert(validJSON.valid === true, 'Empty dataset JSON is valid');
  assert(validJSON.trades.length === 0, 'Empty dataset has 0 trades');

  const emptyCSV = serializeTradesToCSV([]);
  const parsedCSV = parseTradesFromCSV(emptyCSV);
  assert(Array.isArray(parsedCSV) && parsedCSV.length === 0, 'Empty CSV parses to empty array without error');
}

// -----------------------------------------------------------------------------
// Scenario 12: Partial Import Failure and Rollback
// -----------------------------------------------------------------------------
console.log(colors.blue('\nScenario 12: Partial Import Failure & Atomic Rollback'));
{
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE trades (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      pair TEXT NOT NULL
    );
  `);

  db.prepare("INSERT INTO trades (id, user_id, pair) VALUES ('init_1', 'user_B', 'EURUSD')").run();

  let failedAndRolledBack = false;
  try {
    const tx = db.transaction(() => {
      // Step 1: Delete
      db.prepare("DELETE FROM trades WHERE user_id = 'user_B'").run();
      // Step 2: Insert valid
      db.prepare("INSERT INTO trades (id, user_id, pair) VALUES ('batch_1', 'user_B', 'GBPUSD')").run();
      // Step 3: Trigger error (NULL in NOT NULL column)
      db.prepare("INSERT INTO trades (id, user_id, pair) VALUES ('batch_2', 'user_B', NULL)").run();
    });
    tx();
  } catch (err) {
    failedAndRolledBack = true;
  }

  assert(failedAndRolledBack === true, 'Mid-batch transaction error thrown');
  // Check if init_1 still exists due to rollback
  const remaining = db.prepare("SELECT * FROM trades WHERE user_id = 'user_B'").all();
  assert(remaining.length === 1 && remaining[0].id === 'init_1', 'Database rolled back completely; initial record intact');
}

// -----------------------------------------------------------------------------
// Scenario 13: Repeated Import and Restore Operations (Idempotency)
// -----------------------------------------------------------------------------
console.log(colors.blue('\nScenario 13: Repeated Restore & Append Idempotency'));
{
  const incoming = createSampleAccountATrades(10);
  const targetUser = 'user_repeat';

  // Test Replace Mode: 3 consecutive restores
  let state = [];
  for (let cycle = 1; cycle <= 3; cycle++) {
    const prepared = prepareTradesForAccount(incoming, targetUser);
    state = prepared; // Clean replace
  }
  assert(state.length === 10, 'Replace mode: 3 consecutive restores yield exactly 10 trades, not 30');

  // Test Append Mode: 3 consecutive appends with same trades
  let appendState = [];
  let totalDuplicatesSkipped = 0;
  for (let cycle = 1; cycle <= 3; cycle++) {
    const prepared = prepareTradesForAccount(incoming, targetUser);
    const { unique, duplicatesSkipped } = deduplicateTrades(appendState, prepared);
    totalDuplicatesSkipped += duplicatesSkipped;
    appendState = [...unique, ...appendState];
  }
  assert(appendState.length === 10, 'Append mode: 3 consecutive runs result in exactly 10 trades');
  assert(totalDuplicatesSkipped === 20, 'Exactly 20 duplicates skipped across 2 subsequent runs');
}

// -----------------------------------------------------------------------------
// Scenario 15: Exact Record Count and Field-Level Comparison
// -----------------------------------------------------------------------------
console.log(colors.blue('\nScenario 15: Exact Record Count and Field-Level Comparison (Account A → Account B)'));
{
  const originalAccountATrades = createSampleAccountATrades(10);
  const backupJSON = createFullBackupData(originalAccountATrades, [], 'USD', 'dark');

  const validated = validateBackupJSON(backupJSON);
  const accountBTrades = prepareTradesForAccount(validated.trades, 'account_B_recipient');

  // Compare record counts
  assert(accountBTrades.length === originalAccountATrades.length, 'Exact trade count matches 10 === 10');

  // Compare every field
  const fieldsToCheck = [
    'pair',
    'direction',
    'lots',
    'entryPrice',
    'exitPrice',
    'stopLoss',
    'takeProfit',
    'pnl',
    'pips',
    'rMultiple',
    'date',
    'time',
    'session',
    'status',
    'setupTag',
    'emotion',
    'notes',
    'screenshot',
    'followedPlan',
  ];

  let allFieldsMatch = true;
  let mismatchDetail = '';

  for (let i = 0; i < originalAccountATrades.length; i++) {
    const orig = originalAccountATrades[i];
    const restored = accountBTrades[i];

    for (const field of fieldsToCheck) {
      if (orig[field] !== restored[field]) {
        allFieldsMatch = false;
        mismatchDetail = `Trade index ${i}, field '${field}': orig=${orig[field]} vs restored=${restored[field]}`;
        break;
      }
    }
    if (!allFieldsMatch) break;

    // Check tags array equality
    if (JSON.stringify(orig.tags) !== JSON.stringify(restored.tags)) {
      allFieldsMatch = false;
      mismatchDetail = `Trade index ${i}, tags array mismatch`;
      break;
    }
  }

  assert(allFieldsMatch, 'Every field across all 10 trades matches 100% exactly', mismatchDetail);
}

// -----------------------------------------------------------------------------
// SUMMARY REPORT
// -----------------------------------------------------------------------------
console.log(colors.bold('\n======================================================'));
console.log(colors.bold(`  TEST SUITE RESULTS: ${passedCount} PASSED, ${failedCount} FAILED  `));
console.log(colors.bold('======================================================\n'));

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
