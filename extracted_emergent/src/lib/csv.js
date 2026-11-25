const HEADERS = [
  "pair", "direction", "lots", "entry_price", "exit_price", "stop_loss", "take_profit",
  "pnl", "session", "tags", "emotion", "followed_plan", "status", "opened_at", "closed_at", "notes",
];

function esc(v) {
  if (v == null) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function tradesToCsv(trades) {
  const rows = trades.map((t) =>
    HEADERS.map((h) => {
      const v = t[h];
      return esc(Array.isArray(v) ? v.join("|") : v);
    }).join(",")
  );
  return [HEADERS.join(","), ...rows].join("\n");
}

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQ = false;
      else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ",") { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

const NUMERIC = ["lots", "entry_price", "exit_price", "stop_loss", "take_profit", "pnl"];

export function csvToTrades(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const heads = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const out = [];
  for (const line of lines.slice(1)) {
    const vals = parseCsvLine(line);
    const obj = {};
    heads.forEach((h, i) => (obj[h] = vals[i]));
    if (!obj.pair || !obj.entry_price) continue;
    const t = {
      pair: obj.pair.toUpperCase(),
      direction: (obj.direction || "buy").toLowerCase() === "sell" ? "sell" : "buy",
      lots: Number(obj.lots) || 0.01,
      entry_price: Number(obj.entry_price),
      exit_price: obj.exit_price ? Number(obj.exit_price) : null,
      stop_loss: obj.stop_loss ? Number(obj.stop_loss) : null,
      take_profit: obj.take_profit ? Number(obj.take_profit) : null,
      pnl: obj.pnl ? Number(obj.pnl) : null,
      session: obj.session || "london",
      tags: obj.tags ? obj.tags.split("|").filter(Boolean) : [],
      emotion: obj.emotion || null,
      followed_plan: String(obj.followed_plan).toLowerCase() === "true",
      opened_at: obj.opened_at || new Date().toISOString().slice(0, 10),
      closed_at: obj.closed_at || null,
      notes: obj.notes || "",
    };
    out.push(t);
  }
  return out;
}

export function downloadCsv(filename, content) {
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
